import { randomUUID } from "node:crypto";
import { isSessionDay } from "./schedule.mjs";

const attendanceStatuses = new Set(["present", "absent", "late", "excused", "traveling"]);
const followupTypes = new Set(["recitation", "new_memorization", "revision", "not_heard"]);
const performances = new Set(["excellent", "good", "needs_followup"]);
const followupFallback = {
  recitation: "تسميع",
  new_memorization: "حفظ جديد",
  revision: "مراجعة",
  not_heard: "لم يسمع",
};

function teachingDates(today, startDate) {
  const base = new Date(`${today}T12:00:00Z`);
  const day = base.getUTCDay();
  const offset = day === 0 ? -1 : (6 - day + 7) % 7;
  base.setUTCDate(base.getUTCDate() + offset);
  let saturday = base.toISOString().slice(0, 10);
  if (saturday < startDate) saturday = startDate;
  const sundayDate = new Date(`${saturday}T12:00:00Z`);
  sundayDate.setUTCDate(sundayDate.getUTCDate() + 1);
  return [saturday, sundayDate.toISOString().slice(0, 10)];
}

export function createTeacherDataHandlers({ pool, currentUser, json, body, todayInIstanbul, attendanceStartDate = "2026-08-15" }) {
  async function assignedCircles(user) {
    return (await pool.query(
      `SELECT c.id, c.name, u.full_name AS teacher_name,
        COUNT(s.id) FILTER (WHERE s.active = TRUE)::int AS active_students
       FROM circles c
       JOIN users u ON u.id = c.teacher_user_id
       LEFT JOIN students s ON s.circle_id = c.id
       WHERE c.active = TRUE AND c.teacher_user_id = $1
       GROUP BY c.id, u.full_name ORDER BY c.sort_order, c.name`,
      [user.id],
    )).rows;
  }

  async function resolveCircle(user, circleId) {
    const circles = await assignedCircles(user);
    const circle = circleId ? circles.find((item) => item.id === circleId) : circles[0];
    return { circles, circle };
  }

  async function getSession(req, res, url) {
    const user = await currentUser(req, ["teacher"]);
    if (!user) return json(res, 401, { error: "يرجى تسجيل الدخول بحساب المعلم." });
    const { circles, circle } = await resolveCircle(user, url.searchParams.get("circleId"));
    if (!circle) return json(res, 404, { error: "لا توجد حلقة مسندة لهذا الحساب." });
    const today = todayInIstanbul();
    const availableDates = teachingDates(today, attendanceStartDate);
    const requestedDate = url.searchParams.get("date");
    const date = availableDates.includes(requestedDate) ? requestedDate : availableDates[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(res, 400, { error: "التاريخ غير صالح." });

    const result = await pool.query(
      `SELECT s.id, s.full_name,
        ar.status, ar.note AS attendance_note,
        qr.followup_type, qr.content_text, qr.surah_name, qr.from_ref, qr.to_ref, qr.performance, qr.teacher_note
       FROM students s
       LEFT JOIN attendance_sessions ats ON ats.circle_id = s.circle_id AND ats.session_date = $2
       LEFT JOIN attendance_records ar ON ar.session_id = ats.id AND ar.student_id = s.id
       LEFT JOIN quran_records qr ON qr.student_id = s.id AND qr.session_date = $2
       WHERE s.circle_id = $1 AND s.active = TRUE
       ORDER BY s.created_at, s.full_name`,
      [circle.id, date],
    );

    return json(res, 200, {
      date,
      today,
      canEdit: availableDates.includes(date),
      availableDates,
      circles: circles.map((item) => ({ id: item.id, name: item.name, teacherName: item.teacher_name, activeStudents: item.active_students })),
      circle: { id: circle.id, name: circle.name, teacherName: circle.teacher_name },
      students: result.rows.map((row) => ({
        id: row.id,
        name: row.full_name,
        attendance: { status: row.status, note: row.attendance_note || "" },
        quran: {
          type: row.followup_type || "",
          content: row.content_text || "",
          surah: row.surah_name || "",
          from: row.from_ref || "",
          to: row.to_ref || "",
          performance: row.performance || "",
          note: row.teacher_note || "",
        },
      })),
    });
  }

  async function saveSession(req, res) {
    const user = await currentUser(req, ["teacher"]);
    if (!user) return json(res, 401, { error: "يرجى تسجيل الدخول بحساب المعلم." });
    const payload = await body(req);
    const date = String(payload.date || "");
    const today = todayInIstanbul();
    if (!teachingDates(today, attendanceStartDate).includes(date) || !isSessionDay(date)) {
      return json(res, 400, { error: "اختر السبت أو الأحد الظاهرين في واجهة الحلقة." });
    }
    const quranDay = new Date(`${date}T12:00:00Z`).getUTCDay() === 0;
    const { circle } = await resolveCircle(user, String(payload.circleId || ""));
    if (!circle) return json(res, 403, { error: "هذه الحلقة غير مسندة إلى حسابك." });
    const entries = Array.isArray(payload.students) ? payload.students : [];
    if (!entries.length || entries.length > 250) return json(res, 400, { error: "قائمة الطلاب غير صالحة." });
    if (new Set(entries.map((entry) => entry.studentId)).size !== entries.length) {
      return json(res, 400, { error: "يوجد طالب مكرر في الطلب." });
    }

    for (const entry of entries) {
      const status = entry.attendance?.status || "";
      if (status && !attendanceStatuses.has(status)) return json(res, 400, { error: "توجد حالة حضور غير صالحة." });
      const quran = entry.quran || {};
      if (quran.type && !followupTypes.has(quran.type)) return json(res, 400, { error: "نوع متابعة القرآن غير صالح." });
      if (quran.performance && !performances.has(quran.performance)) return json(res, 400, { error: "تقييم التسميع غير صالح." });
      const hasQuranInput = Boolean(quran.type || quran.surah || quran.from || quran.to || quran.performance || quran.note);
      if (hasQuranInput && !quranDay) return json(res, 400, { error: "متابعة القرآن متاحة في يوم الأحد فقط." });
      if (hasQuranInput && status !== "present") return json(res, 400, { error: "لا يمكن تسجيل متابعة قرآن إلا للطالب الحاضر." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const owned = await client.query(
        "SELECT id FROM students WHERE circle_id = $1 AND active = TRUE AND id = ANY($2::uuid[])",
        [circle.id, entries.map((entry) => entry.studentId)],
      );
      if (owned.rowCount !== entries.length) throw Object.assign(new Error("Student mismatch"), { status: 403 });
      const session = await client.query(
        `INSERT INTO attendance_sessions (id, circle_id, session_date, recorded_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (circle_id, session_date) DO UPDATE SET updated_at = NOW(), recorded_by = EXCLUDED.recorded_by
         RETURNING id`,
        [randomUUID(), circle.id, date, user.id],
      );
      const sessionId = session.rows[0].id;

      for (const entry of entries) {
        const status = entry.attendance?.status || "";
        const attendanceNote = String(entry.attendance?.note || "").trim() || null;
        if (status) {
          await client.query(
            `INSERT INTO attendance_records (id, session_id, student_id, status, note, recorded_by, source)
             VALUES ($1, $2, $3, $4, $5, $6, 'platform')
             ON CONFLICT (session_id, student_id) DO UPDATE SET
               status = EXCLUDED.status, note = EXCLUDED.note, recorded_by = EXCLUDED.recorded_by,
               source = EXCLUDED.source, updated_at = NOW()`,
            [randomUUID(), sessionId, entry.studentId, status, attendanceNote, user.id],
          );
        } else {
          await client.query("DELETE FROM attendance_records WHERE session_id = $1 AND student_id = $2", [sessionId, entry.studentId]);
        }

        const quran = entry.quran || {};
        const quranType = String(quran.type || "");
        const quranContent = String(quran.content || "").trim();
        const surah = String(quran.surah || "").trim();
        const fromRef = String(quran.from || "").trim();
        const toRef = String(quran.to || "").trim();
        const performance = String(quran.performance || "") || null;
        const teacherNote = String(quran.note || "").trim() || null;
        const structuredContent = [surah, fromRef && `من ${fromRef}`, toRef && `إلى ${toRef}`].filter(Boolean).join(" · ");
        const hasQuran = Boolean(quranType || quranContent || surah || fromRef || toRef || performance || teacherNote);
        if (hasQuran) {
          const type = quranType || "recitation";
          await client.query(
            `INSERT INTO quran_records (
               id, student_id, session_id, session_date, entry_text, followup_type,
               content_text, surah_name, from_ref, to_ref, performance, teacher_note, recorded_by, source
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'platform')
             ON CONFLICT (student_id, session_date) DO UPDATE SET
               session_id = EXCLUDED.session_id, entry_text = EXCLUDED.entry_text,
               followup_type = EXCLUDED.followup_type, content_text = EXCLUDED.content_text,
               surah_name = EXCLUDED.surah_name, from_ref = EXCLUDED.from_ref, to_ref = EXCLUDED.to_ref,
               performance = EXCLUDED.performance, teacher_note = EXCLUDED.teacher_note,
               recorded_by = EXCLUDED.recorded_by, source = EXCLUDED.source, updated_at = NOW()`,
            [randomUUID(), entry.studentId, sessionId, date, structuredContent || quranContent || followupFallback[type], type, structuredContent || quranContent || null, surah || null, fromRef || null, toRef || null, performance, teacherNote, user.id],
          );
        } else {
          await client.query("DELETE FROM quran_records WHERE student_id = $1 AND session_date = $2", [entry.studentId, date]);
        }
      }

      await client.query("COMMIT");
      return json(res, 200, { ok: true, savedAt: new Date().toISOString(), sessionId });
    } catch (error) {
      await client.query("ROLLBACK");
      if (error.status) return json(res, error.status, { error: "لا يمكن حفظ طالب خارج الحلقة المسندة إليك." });
      throw error;
    } finally {
      client.release();
    }
  }

  return { getSession, saveSession };
}
