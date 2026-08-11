import { randomUUID } from "node:crypto";

function mapAttendance(row) {
  return {
    id: row.id,
    date: row.session_date,
    studentId: row.student_id,
    studentName: row.student_name,
    circleId: row.circle_id,
    circleName: row.circle_name,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    status: row.status,
    note: row.note || "",
    updatedAt: row.updated_at,
  };
}

function mapQuran(row) {
  return {
    id: row.id,
    date: row.session_date,
    studentId: row.student_id,
    studentName: row.student_name,
    circleId: row.circle_id,
    circleName: row.circle_name,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    type: row.followup_type,
    content: row.content_text || row.entry_text || "",
    performance: row.performance || "",
    note: row.teacher_note || "",
    updatedAt: row.updated_at,
  };
}

export function createAdminDataHandlers({ pool, currentUser, json, body, hashPassword }) {
  const validUsername = (value) => /^[a-z0-9._@+-]{3,80}$/.test(value);
  const studentStatuses = new Set(["active", "discontinued", "suspended", "graduated"]);
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  async function requireAdmin(req, res) {
    const user = await currentUser(req, ["admin"]);
    if (!user) json(res, 401, { error: "يرجى تسجيل الدخول بحساب الإدارة." });
    return user;
  }

  async function overview(req, res) {
    if (!await requireAdmin(req, res)) return;
    const [stats, reference, circles, teachers, students, recentAttendance, recentQuran, watchlist, recentTransfers] = await Promise.all([
      pool.query(`SELECT
        (SELECT COUNT(*)::int FROM students) AS total_students,
        (SELECT COUNT(*)::int FROM students WHERE active = TRUE) AS active_students,
        (SELECT COUNT(*)::int FROM students WHERE active = FALSE) AS inactive_students,
        (SELECT COUNT(*)::int FROM circles WHERE active = TRUE) AS circles,
        (SELECT COUNT(*)::int FROM users WHERE role = 'teacher' AND active = TRUE) AS teachers,
        (SELECT COUNT(*)::int FROM attendance_records) AS attendance_records,
        (SELECT COUNT(*)::int FROM quran_records) AS quran_records`),
      pool.query("SELECT MAX(session_date)::text AS date FROM attendance_sessions"),
      pool.query(`SELECT c.id, c.name, c.sort_order, c.circle_type, c.meeting_days, c.notes, c.active,
        u.id AS teacher_id, u.full_name AS teacher_name,
        COUNT(s.id)::int AS student_count,
        COUNT(s.id) FILTER (WHERE s.active = TRUE)::int AS active_students,
        COUNT(s.id) FILTER (WHERE s.active = FALSE)::int AS inactive_students
       FROM circles c LEFT JOIN users u ON u.id = c.teacher_user_id
       LEFT JOIN students s ON s.circle_id = c.id
       GROUP BY c.id, u.id, u.full_name ORDER BY c.sort_order, c.name`),
      pool.query(`SELECT u.id, u.full_name, u.username, u.active,
        COUNT(DISTINCT c.id)::int AS circle_count,
        COALESCE(string_agg(DISTINCT c.name, '، ' ORDER BY c.name), '') AS circle_names,
        COUNT(s.id) FILTER (WHERE s.active = TRUE)::int AS active_students
       FROM users u LEFT JOIN circles c ON c.teacher_user_id = u.id AND c.active = TRUE
       LEFT JOIN students s ON s.circle_id = c.id
       WHERE u.role = 'teacher'
       GROUP BY u.id ORDER BY u.active DESC, u.full_name`),
      pool.query(`SELECT s.id, s.full_name, s.active, s.status, s.admin_notes, s.joined_at::text,
        c.id AS circle_id, c.name AS circle_name,
        u.id AS teacher_id, u.full_name AS teacher_name,
        COUNT(ar.id)::int AS attendance_count,
        COALESCE(ROUND(100.0 * COUNT(ar.id) FILTER (WHERE ar.status = 'present') / NULLIF(COUNT(ar.id), 0)), 0)::int AS attendance_rate,
        MAX(ats.session_date)::text AS last_attendance_date
       FROM students s JOIN circles c ON c.id = s.circle_id
       LEFT JOIN users u ON u.id = c.teacher_user_id
       LEFT JOIN attendance_records ar ON ar.student_id = s.id
       LEFT JOIN attendance_sessions ats ON ats.id = ar.session_id
       GROUP BY s.id, c.id, u.id, u.full_name
       ORDER BY c.sort_order, s.active DESC, s.full_name`),
      pool.query(`SELECT ar.id, ats.session_date::text, s.id AS student_id, s.full_name AS student_name,
        c.id AS circle_id, c.name AS circle_name, u.id AS teacher_id, u.full_name AS teacher_name,
        ar.status, ar.note, ar.updated_at
       FROM attendance_records ar JOIN attendance_sessions ats ON ats.id = ar.session_id
       JOIN students s ON s.id = ar.student_id JOIN circles c ON c.id = ats.circle_id
       LEFT JOIN users u ON u.id = c.teacher_user_id
       ORDER BY ats.session_date DESC, ar.updated_at DESC LIMIT 20`),
      pool.query(`SELECT qr.id, qr.session_date::text, s.id AS student_id, s.full_name AS student_name,
        c.id AS circle_id, c.name AS circle_name, u.id AS teacher_id, u.full_name AS teacher_name,
        qr.followup_type, qr.content_text, qr.entry_text, qr.performance, qr.teacher_note, qr.updated_at
       FROM quran_records qr JOIN students s ON s.id = qr.student_id
       JOIN circles c ON c.id = s.circle_id LEFT JOIN users u ON u.id = c.teacher_user_id
       ORDER BY qr.session_date DESC, qr.updated_at DESC LIMIT 20`),
      pool.query(`WITH recent_dates AS (
         SELECT DISTINCT session_date FROM attendance_sessions ORDER BY session_date DESC LIMIT 4
       )
       SELECT s.id, s.full_name, c.name AS circle_name,
         COUNT(*) FILTER (WHERE ar.status = 'absent')::int AS absence_count
       FROM attendance_records ar JOIN attendance_sessions ats ON ats.id = ar.session_id
       JOIN recent_dates rd ON rd.session_date = ats.session_date
       JOIN students s ON s.id = ar.student_id JOIN circles c ON c.id = s.circle_id
       WHERE s.active = TRUE
       GROUP BY s.id, c.name HAVING COUNT(*) FILTER (WHERE ar.status = 'absent') >= 2
       ORDER BY absence_count DESC, s.full_name LIMIT 12`),
      pool.query(`SELECT sth.id, sth.student_id, s.full_name AS student_name,
        fc.name AS from_circle_name, tc.name AS to_circle_name,
        u.full_name AS transferred_by_name, sth.note, sth.created_at
       FROM student_transfer_history sth
       JOIN students s ON s.id=sth.student_id
       LEFT JOIN circles fc ON fc.id=sth.from_circle_id
       LEFT JOIN circles tc ON tc.id=sth.to_circle_id
       LEFT JOIN users u ON u.id=sth.transferred_by
       ORDER BY sth.created_at DESC LIMIT 20`),
    ]);

    return json(res, 200, {
      stats: stats.rows[0],
      referenceDate: reference.rows[0].date,
      circles: circles.rows.map((row) => ({ id: row.id, name: row.name, teacherId: row.teacher_id, teacherName: row.teacher_name, studentCount: row.student_count, activeStudents: row.active_students, inactiveStudents: row.inactive_students, type: row.circle_type, meetingDays: row.meeting_days, notes: row.notes || "", active: row.active })),
      teachers: teachers.rows.map((row) => ({ id: row.id, name: row.full_name, username: row.username, active: row.active, circleCount: row.circle_count, circleNames: row.circle_names, activeStudents: row.active_students })),
      students: students.rows.map((row) => ({ id: row.id, name: row.full_name, active: row.active, status: row.status, adminNotes: row.admin_notes || "", joinedAt: row.joined_at, circleId: row.circle_id, circleName: row.circle_name, teacherId: row.teacher_id, teacherName: row.teacher_name, attendanceCount: row.attendance_count, attendanceRate: row.attendance_rate, lastAttendanceDate: row.last_attendance_date })),
      recentAttendance: recentAttendance.rows.map(mapAttendance),
      recentQuran: recentQuran.rows.map(mapQuran),
      watchlist: watchlist.rows.map((row) => ({ id: row.id, name: row.full_name, circleName: row.circle_name, absenceCount: row.absence_count })),
      recentTransfers: recentTransfers.rows.map((row) => ({ id: row.id, studentId: row.student_id, studentName: row.student_name, fromCircleName: row.from_circle_name || "حلقة غير مسجلة", toCircleName: row.to_circle_name || "حلقة غير مسجلة", transferredByName: row.transferred_by_name || "الإدارة", note: row.note || "", createdAt: row.created_at })),
    });
  }

  function filters(url, { quran = false } = {}) {
    const clauses = [];
    const values = [];
    const add = (clause, value) => { values.push(value); clauses.push(clause.replace("?", `$${values.length}`)); };
    if (url.searchParams.get("date")) add(`${quran ? "qr" : "ats"}.session_date = ?::date`, url.searchParams.get("date"));
    if (url.searchParams.get("circleId")) add("c.id = ?::uuid", url.searchParams.get("circleId"));
    if (url.searchParams.get("teacherId")) add("u.id = ?::uuid", url.searchParams.get("teacherId"));
    if (url.searchParams.get("student")) add("s.full_name ILIKE '%' || ? || '%'", url.searchParams.get("student"));
    return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", values };
  }

  async function attendance(req, res, url) {
    if (!await requireAdmin(req, res)) return;
    const { where, values } = filters(url);
    const result = await pool.query(
      `SELECT ar.id, ats.session_date::text, s.id AS student_id, s.full_name AS student_name,
        c.id AS circle_id, c.name AS circle_name, u.id AS teacher_id, u.full_name AS teacher_name,
        ar.status, ar.note, ar.updated_at
       FROM attendance_records ar JOIN attendance_sessions ats ON ats.id = ar.session_id
       JOIN students s ON s.id = ar.student_id JOIN circles c ON c.id = ats.circle_id
       LEFT JOIN users u ON u.id = c.teacher_user_id
       ${where} ORDER BY ats.session_date DESC, c.sort_order, s.full_name LIMIT 500`,
      values,
    );
    return json(res, 200, { records: result.rows.map(mapAttendance) });
  }

  async function quran(req, res, url) {
    if (!await requireAdmin(req, res)) return;
    const { where, values } = filters(url, { quran: true });
    const result = await pool.query(
      `SELECT qr.id, qr.session_date::text, s.id AS student_id, s.full_name AS student_name,
        c.id AS circle_id, c.name AS circle_name, u.id AS teacher_id, u.full_name AS teacher_name,
        qr.followup_type, qr.content_text, qr.entry_text, qr.performance, qr.teacher_note, qr.updated_at
       FROM quran_records qr JOIN students s ON s.id = qr.student_id
       JOIN circles c ON c.id = s.circle_id LEFT JOIN users u ON u.id = c.teacher_user_id
       ${where} ORDER BY qr.session_date DESC, c.sort_order, s.full_name LIMIT 500`,
      values,
    );
    return json(res, 200, { records: result.rows.map(mapQuran) });
  }

  async function saveStudent(req, res, studentId = null) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const payload = await body(req);
    const name = String(payload.name || "").trim();
    const circleId = String(payload.circleId || "");
    const status = String(payload.status || "active");
    if (name.length < 2 || !uuidPattern.test(circleId) || !studentStatuses.has(status)) {
      return json(res, 400, { error: "بيانات الطالب غير مكتملة أو غير صالحة." });
    }
    const circle = await pool.query("SELECT id FROM circles WHERE id = $1", [circleId]);
    if (!circle.rowCount) return json(res, 400, { error: "الحلقة المختارة غير موجودة." });
    const normalized = name.replace(/\s+/g, " ").toLocaleLowerCase("ar");
    const values = [name, normalized, circleId, status === "active", status, String(payload.adminNotes || "").trim() || null, payload.joinedAt || null];
    if (!studentId) {
      try {
        const id = randomUUID();
        await pool.query(`INSERT INTO students (id, full_name, normalized_name, circle_id, active, status, admin_notes, joined_at)
          VALUES ($8,$1,$2,$3,$4,$5,$6,$7)`, [...values, id]);
        return json(res, 200, { ok: true, id });
      } catch (error) {
        if (error.code === "23505") return json(res, 409, { error: "يوجد طالب بالاسم نفسه داخل هذه الحلقة." });
        throw error;
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const previous = await client.query("SELECT id, circle_id FROM students WHERE id=$1 FOR UPDATE", [studentId]);
      if (!previous.rowCount) {
        await client.query("ROLLBACK");
        return json(res, 404, { error: "الطالب غير موجود." });
      }
      await client.query(`UPDATE students SET full_name=$1, normalized_name=$2, circle_id=$3, active=$4, status=$5,
        admin_notes=$6, joined_at=$7, updated_at=NOW() WHERE id=$8`, [...values, studentId]);
      const moved = previous.rows[0].circle_id !== circleId;
      if (moved) {
        await client.query(`INSERT INTO student_transfer_history
          (id, student_id, from_circle_id, to_circle_id, transferred_by, note)
          VALUES ($1,$2,$3,$4,$5,$6)`, [randomUUID(), studentId, previous.rows[0].circle_id, circleId, admin.id, "نقل فردي من بطاقة تعديل الطالب"]);
      }
      await client.query("COMMIT");
      return json(res, 200, { ok: true, id: studentId, moved });
    } catch (error) {
      await client.query("ROLLBACK");
      if (error.code === "23505") return json(res, 409, { error: "يوجد طالب بالاسم نفسه داخل هذه الحلقة." });
      throw error;
    } finally { client.release(); }
  }

  async function archiveStudent(req, res, studentId) {
    if (!await requireAdmin(req, res)) return;
    const result = await pool.query(`UPDATE students SET active=FALSE, status='discontinued', updated_at=NOW()
      WHERE id=$1 RETURNING id`, [studentId]);
    return result.rowCount ? json(res, 200, { ok: true, archived: true }) : json(res, 404, { error: "الطالب غير موجود." });
  }

  async function studentDetail(req, res, studentId) {
    if (!await requireAdmin(req, res)) return;
    const [student, attendanceRows, quranRows, transferRows] = await Promise.all([
      pool.query(`SELECT s.id, s.full_name, s.status, s.active, s.admin_notes, s.joined_at::text,
        c.id AS circle_id, c.name AS circle_name, u.full_name AS teacher_name
        FROM students s JOIN circles c ON c.id=s.circle_id LEFT JOIN users u ON u.id=c.teacher_user_id WHERE s.id=$1`, [studentId]),
      pool.query(`SELECT ar.id, ats.session_date::text, ar.status, ar.note, c.name AS circle_name
        FROM attendance_records ar JOIN attendance_sessions ats ON ats.id=ar.session_id
        JOIN circles c ON c.id=ats.circle_id WHERE ar.student_id=$1 ORDER BY ats.session_date DESC LIMIT 100`, [studentId]),
      pool.query(`SELECT qr.id, qr.session_date::text, qr.followup_type, qr.content_text, qr.entry_text,
        qr.performance, qr.teacher_note FROM quran_records qr WHERE qr.student_id=$1 ORDER BY qr.session_date DESC LIMIT 100`, [studentId]),
      pool.query(`SELECT sth.id, fc.name AS from_circle_name, tc.name AS to_circle_name,
        u.full_name AS transferred_by_name, sth.note, sth.created_at
        FROM student_transfer_history sth
        LEFT JOIN circles fc ON fc.id=sth.from_circle_id
        LEFT JOIN circles tc ON tc.id=sth.to_circle_id
        LEFT JOIN users u ON u.id=sth.transferred_by
        WHERE sth.student_id=$1 ORDER BY sth.created_at DESC LIMIT 100`, [studentId]),
    ]);
    if (!student.rowCount) return json(res, 404, { error: "الطالب غير موجود." });
    const row = student.rows[0];
    return json(res, 200, {
      student: { id: row.id, name: row.full_name, status: row.status, active: row.active, adminNotes: row.admin_notes || "", joinedAt: row.joined_at, circleId: row.circle_id, circleName: row.circle_name, teacherName: row.teacher_name },
      attendance: attendanceRows.rows.map((item) => ({ id: item.id, date: item.session_date, status: item.status, note: item.note || "", circleName: item.circle_name })),
      quran: quranRows.rows.map((item) => ({ id: item.id, date: item.session_date, type: item.followup_type, content: item.content_text || item.entry_text || "", performance: item.performance || "", note: item.teacher_note || "" })),
      transfers: transferRows.rows.map((item) => ({ id: item.id, fromCircleName: item.from_circle_name || "حلقة غير مسجلة", toCircleName: item.to_circle_name || "حلقة غير مسجلة", transferredByName: item.transferred_by_name || "الإدارة", note: item.note || "", createdAt: item.created_at })),
    });
  }

  async function saveCircle(req, res, circleId) {
    if (!await requireAdmin(req, res)) return;
    const payload = await body(req);
    const teacherId = payload.teacherId || null;
    if (teacherId && !uuidPattern.test(teacherId)) return json(res, 400, { error: "المعلم المختار غير صالح." });
    const result = await pool.query(`UPDATE circles SET teacher_user_id=$1, circle_type=$2, active=$3,
      meeting_days=$4::smallint[], notes=$5, updated_at=NOW() WHERE id=$6 RETURNING id`, [
      teacherId, payload.type === "prestige" ? "prestige" : "regular", payload.active !== false,
      Array.isArray(payload.meetingDays) && payload.meetingDays.length ? payload.meetingDays : [6,0],
      String(payload.notes || "").trim() || null, circleId,
    ]);
    return result.rowCount ? json(res, 200, { ok: true }) : json(res, 404, { error: "الحلقة غير موجودة." });
  }

  async function createTeacher(req, res) {
    if (!await requireAdmin(req, res)) return;
    const payload = await body(req);
    const name = String(payload.name || "").trim();
    const username = String(payload.username || "").trim().toLowerCase();
    const password = String(payload.password || "");
    if (name.length < 2 || !validUsername(username) || password.length < 5) {
      return json(res, 400, { error: "اسم المستخدم يجب أن يكون بالإنجليزية ومن دون مسافات، ويمكن أن يكون بريدًا إلكترونيًا مثل moh@alehyaa.com. وكلمة المرور 5 أحرف على الأقل." });
    }
    try {
      const id = randomUUID();
      await pool.query(`INSERT INTO users (id, username, full_name, role, password_hash, must_change_password)
        VALUES ($1,$2,$3,'teacher',$4,FALSE)`, [id, username, name, await hashPassword(password)]);
      return json(res, 200, { ok: true, id });
    } catch (error) {
      if (error.code === "23505") return json(res, 409, { error: "اسم المستخدم مستخدم بالفعل." });
      throw error;
    }
  }

  async function updateTeacher(req, res, teacherId) {
    if (!await requireAdmin(req, res)) return;
    const payload = await body(req);
    const name = String(payload.name || "").trim();
    const username = String(payload.username || "").trim().toLowerCase();
    const password = String(payload.password || "");
    if (name.length < 2 || !validUsername(username) || (password && password.length < 5)) {
      return json(res, 400, { error: "اسم المستخدم يجب أن يكون بالإنجليزية ومن دون مسافات، ويمكن أن يكون بريدًا إلكترونيًا مثل moh@alehyaa.com. وكلمة المرور 5 أحرف على الأقل عند تغييرها." });
    }
    try {
      const result = password
        ? await pool.query(`UPDATE users SET full_name=$1, username=$2, active=$3, password_hash=$4,
            must_change_password=FALSE, updated_at=NOW() WHERE id=$5 AND role='teacher' RETURNING id`,
            [name, username, payload.active !== false, await hashPassword(password), teacherId])
        : await pool.query(`UPDATE users SET full_name=$1, username=$2, active=$3, updated_at=NOW()
            WHERE id=$4 AND role='teacher' RETURNING id`, [name, username, payload.active !== false, teacherId]);
      return result.rowCount ? json(res, 200, { ok: true }) : json(res, 404, { error: "المعلم غير موجود." });
    } catch (error) {
      if (error.code === "23505") return json(res, 409, { error: "اسم المستخدم مستخدم بالفعل." });
      throw error;
    }
  }

  async function archiveTeacher(req, res, teacherId) {
    if (!await requireAdmin(req, res)) return;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query("UPDATE users SET active=FALSE, updated_at=NOW() WHERE id=$1 AND role='teacher' RETURNING id", [teacherId]);
      if (!result.rowCount) { await client.query("ROLLBACK"); return json(res, 404, { error: "المعلم غير موجود." }); }
      await client.query("UPDATE circles SET teacher_user_id=NULL, updated_at=NOW() WHERE teacher_user_id=$1", [teacherId]);
      await client.query("DELETE FROM user_sessions WHERE user_id=$1", [teacherId]);
      await client.query("COMMIT");
      return json(res, 200, { ok: true, archived: true });
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }

  async function transferStudents(req, res) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const payload = await body(req);
    const studentIds = Array.isArray(payload.studentIds) ? [...new Set(payload.studentIds)] : [];
    const circleId = String(payload.circleId || "");
    if (!studentIds.length || studentIds.length > 250 || !uuidPattern.test(circleId) || studentIds.some((id) => !uuidPattern.test(id))) {
      return json(res, 400, { error: "اختر طلابًا وحلقة صحيحة للنقل." });
    }
    const circle = await pool.query("SELECT id, name FROM circles WHERE id=$1", [circleId]);
    if (!circle.rowCount) return json(res, 404, { error: "الحلقة المختارة غير موجودة." });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const selected = await client.query(`SELECT s.id, s.circle_id, c.name AS circle_name
        FROM students s JOIN circles c ON c.id=s.circle_id
        WHERE s.id=ANY($1::uuid[]) FOR UPDATE OF s`, [studentIds]);
      if (selected.rowCount !== studentIds.length) {
        await client.query("ROLLBACK");
        return json(res, 404, { error: "بعض الطلاب المحددين غير موجودين. حدّث الصفحة وحاول مرة أخرى." });
      }
      const movedRows = selected.rows.filter((row) => row.circle_id !== circleId);
      if (!movedRows.length) {
        await client.query("ROLLBACK");
        return json(res, 400, { error: "الطلاب المحددون موجودون بالفعل في الحلقة المختارة." });
      }
      await client.query("UPDATE students SET circle_id=$1, updated_at=NOW() WHERE id=ANY($2::uuid[])", [circleId, movedRows.map((row) => row.id)]);
      for (const row of movedRows) {
        await client.query(`INSERT INTO student_transfer_history
          (id, student_id, from_circle_id, to_circle_id, transferred_by, note)
          VALUES ($1,$2,$3,$4,$5,$6)`, [randomUUID(), row.id, row.circle_id, circleId, admin.id, "نقل جماعي من قائمة الطلاب"]);
      }
      await client.query("COMMIT");
      return json(res, 200, {
        ok: true,
        moved: movedRows.length,
        fromCircles: [...new Set(movedRows.map((row) => row.circle_name))],
        toCircle: circle.rows[0].name,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }

  async function deleteStudentPermanently(req, res, studentId) {
    if (!await requireAdmin(req, res)) return;
    const history = await pool.query(`SELECT
      EXISTS(SELECT 1 FROM attendance_records WHERE student_id=$1) OR
      EXISTS(SELECT 1 FROM quran_records WHERE student_id=$1) AS has_history`, [studentId]);
    if (history.rows[0]?.has_history) return json(res, 409, { error: "لا يمكن الحذف النهائي لأن للطالب سجلات محفوظة. استخدم تحويله إلى منقطع للحفاظ على التاريخ." });
    const result = await pool.query("DELETE FROM students WHERE id=$1 RETURNING id", [studentId]);
    return result.rowCount ? json(res, 200, { ok: true, deleted: true }) : json(res, 404, { error: "الطالب غير موجود." });
  }

  async function monthly(req, res, url) {
    if (!await requireAdmin(req, res)) return;
    const month = url.searchParams.get("month") || new Date().toISOString().slice(0,7);
    if (!/^\d{4}-\d{2}$/.test(month)) return json(res, 400, { error: "الشهر غير صالح." });
    const circleId = url.searchParams.get("circleId") || null;
    const teacherId = url.searchParams.get("teacherId") || null;
    const student = url.searchParams.get("student") || null;
    const params = [month, circleId, teacherId, student];
    const where = `ats.session_date >= ($1 || '-01')::date AND ats.session_date < (($1 || '-01')::date + INTERVAL '1 month')
      AND ($2::uuid IS NULL OR c.id=$2) AND ($3::uuid IS NULL OR u.id=$3) AND ($4::text IS NULL OR s.full_name ILIKE '%'||$4||'%')`;
    const [summary, sessions] = await Promise.all([
      pool.query(`SELECT s.id, s.full_name, c.name AS circle_name,
        COUNT(ar.id)::int AS recorded, COUNT(ar.id) FILTER (WHERE ar.status='present')::int AS present,
        COUNT(ar.id) FILTER (WHERE ar.status='absent')::int AS absent,
        COUNT(ar.id) FILTER (WHERE ar.status='late')::int AS late,
        COUNT(ar.id) FILTER (WHERE ar.status='excused')::int AS excused,
        COUNT(ar.id) FILTER (WHERE ar.status='traveling')::int AS traveling,
        COALESCE(ROUND(100.0*COUNT(ar.id) FILTER (WHERE ar.status='present')/NULLIF(COUNT(ar.id),0)),0)::int AS rate,
        qr.session_date::text AS last_quran_date, qr.last_quran
        FROM students s JOIN circles c ON c.id=s.circle_id LEFT JOIN users u ON u.id=c.teacher_user_id
        LEFT JOIN attendance_records ar ON ar.student_id=s.id LEFT JOIN attendance_sessions ats ON ats.id=ar.session_id
        LEFT JOIN LATERAL (SELECT session_date, COALESCE(content_text,entry_text) AS last_quran
          FROM quran_records WHERE student_id=s.id AND session_date >= ($1||'-01')::date
          AND session_date < (($1||'-01')::date+INTERVAL '1 month') ORDER BY session_date DESC LIMIT 1) qr ON TRUE
        WHERE ${where} GROUP BY s.id,c.name,c.sort_order,qr.session_date,qr.last_quran ORDER BY c.sort_order,s.full_name`, params),
      pool.query(`SELECT ats.id, ats.session_date::text, c.name AS circle_name, u.full_name AS teacher_name,
        ats.approved_at, COUNT(ar.id)::int AS recorded,
        COUNT(ar.id) FILTER (WHERE ar.status='present')::int AS present,
        COUNT(ar.id) FILTER (WHERE ar.status='absent')::int AS absent
        FROM attendance_sessions ats JOIN circles c ON c.id=ats.circle_id LEFT JOIN users u ON u.id=c.teacher_user_id
        LEFT JOIN attendance_records ar ON ar.session_id=ats.id
        WHERE ats.session_date >= ($1||'-01')::date AND ats.session_date < (($1||'-01')::date+INTERVAL '1 month')
        AND ($2::uuid IS NULL OR c.id=$2) AND ($3::uuid IS NULL OR u.id=$3)
        GROUP BY ats.id,c.name,u.full_name ORDER BY ats.session_date DESC,c.name`, params.slice(0,3)),
    ]);
    return json(res, 200, { month, students: summary.rows, sessions: sessions.rows });
  }

  async function approveSession(req, res, sessionId) {
    const admin = await requireAdmin(req, res); if (!admin) return;
    const payload = await body(req);
    const approved = payload.approved !== false;
    const result = await pool.query(`UPDATE attendance_sessions SET approved_at=$1, approved_by=$2, updated_at=NOW()
      WHERE id=$3 RETURNING id`, [approved ? new Date() : null, approved ? admin.id : null, sessionId]);
    return result.rowCount ? json(res, 200, { ok: true }) : json(res, 404, { error: "الجلسة غير موجودة." });
  }

  return { overview, attendance, quran, saveStudent, archiveStudent, deleteStudentPermanently, transferStudents, studentDetail, saveCircle, createTeacher, updateTeacher, archiveTeacher, monthly, approveSession };
}
