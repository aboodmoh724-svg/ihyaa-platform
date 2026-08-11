import http from "node:http";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { hashPassword, newSessionToken, tokenHash, verifyPassword } from "./security.mjs";
import { isAttendanceOpen, nextSessionDate } from "./schedule.mjs";
import { createTeacherDataHandlers } from "./teacher-data.mjs";
import { createAdminDataHandlers } from "./admin-data.mjs";

if (typeof process.loadEnvFile === "function") {
  try { process.loadEnvFile(process.env.ENV_FILE || ".env"); } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
const port = Number(process.env.PORT || 3017);
const host = process.env.HOST || "127.0.0.1";
const appOrigin = process.env.APP_ORIGIN || "https://ihyaa.alrahmakuran.site";
const secureCookie = process.env.COOKIE_SECURE !== "false";
const sessionDays = 30;
const attendanceStartDate = process.env.ATTENDANCE_START_DATE || "2026-08-15";
const loginAttempts = new Map();

function json(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

function cookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

async function body(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 256_000) throw Object.assign(new Error("Payload too large"), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Invalid JSON"), { status: 400 });
  }
}

function sessionCookie(token, maxAge = sessionDays * 86400) {
  return [
    `ihyaa_session=${encodeURIComponent(token)}`,
    "HttpOnly",
    secureCookie ? "Secure" : "",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAge}`,
  ].filter(Boolean).join("; ");
}

async function currentUser(req, roles = []) {
  const token = cookies(req).ihyaa_session;
  if (!token) return null;
  const result = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.role, u.must_change_password, s.token_hash
     FROM user_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.active = TRUE`,
    [tokenHash(token)],
  );
  const user = result.rows[0];
  if (!user || (roles.length && !roles.includes(user.role))) return null;
  await pool.query("UPDATE user_sessions SET last_seen_at = NOW() WHERE token_hash = $1", [user.token_hash]);
  return user;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.full_name,
    role: user.role,
    mustChangePassword: user.must_change_password,
  };
}

function todayInIstanbul() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function requestIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
}

function checkOrigin(req) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return true;
  const origin = req.headers.origin;
  return !origin || origin === appOrigin;
}

async function login(req, res) {
  const ip = requestIp(req);
  const now = Date.now();
  const attempt = loginAttempts.get(ip) || { count: 0, resetAt: now + 15 * 60_000 };
  if (now > attempt.resetAt) Object.assign(attempt, { count: 0, resetAt: now + 15 * 60_000 });
  if (attempt.count >= 10) return json(res, 429, { error: "محاولات كثيرة. حاول بعد قليل." });

  const { identity, password, role } = await body(req);
  const result = await pool.query(
    `SELECT * FROM users
     WHERE active = TRUE AND (
       LOWER(username) = LOWER($1) OR LOWER(COALESCE(email, '')) = LOWER($1) OR COALESCE(phone, '') = $1
     ) LIMIT 1`,
    [String(identity || "").trim()],
  );
  const user = result.rows[0];
  const valid = user && await verifyPassword(String(password || ""), user.password_hash);
  if (!valid || (role && role !== user.role)) {
    attempt.count += 1;
    loginAttempts.set(ip, attempt);
    return json(res, 401, { error: "بيانات الدخول غير صحيحة." });
  }

  loginAttempts.delete(ip);
  const token = newSessionToken();
  await pool.query(
    `INSERT INTO user_sessions (id, user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, NOW() + INTERVAL '30 days', $4, $5)`,
    [randomUUID(), user.id, tokenHash(token), String(req.headers["user-agent"] || "").slice(0, 500), ip],
  );
  return json(res, 200, { user: publicUser(user) }, { "set-cookie": sessionCookie(token) });
}

async function logout(req, res) {
  const token = cookies(req).ihyaa_session;
  if (token) await pool.query("DELETE FROM user_sessions WHERE token_hash = $1", [tokenHash(token)]);
  return json(res, 200, { ok: true }, { "set-cookie": sessionCookie("", 0) });
}

async function changePassword(req, res) {
  const user = await currentUser(req);
  if (!user) return json(res, 401, { error: "يرجى تسجيل الدخول." });
  const { currentPassword, newPassword } = await body(req);
  if (String(newPassword || "").length < 10) {
    return json(res, 400, { error: "كلمة المرور الجديدة يجب ألا تقل عن 10 أحرف." });
  }
  const row = await pool.query("SELECT password_hash FROM users WHERE id = $1", [user.id]);
  if (!await verifyPassword(String(currentPassword || ""), row.rows[0].password_hash)) {
    return json(res, 400, { error: "كلمة المرور الحالية غير صحيحة." });
  }
  await pool.query(
    "UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() WHERE id = $2",
    [await hashPassword(newPassword), user.id],
  );
  return json(res, 200, { ok: true });
}

async function teacherCircle(user) {
  const result = await pool.query(
    `SELECT c.id, c.name, c.teacher_user_id, u.full_name AS teacher_name
     FROM circles c LEFT JOIN users u ON u.id = c.teacher_user_id
     WHERE c.active = TRUE AND ($1::text = 'admin' OR c.teacher_user_id = $2)
     ORDER BY c.sort_order LIMIT 1`,
    [user.role, user.id],
  );
  return result.rows[0] || null;
}

async function getTeacherAttendance(req, res, url) {
  const user = await currentUser(req, ["teacher", "admin"]);
  if (!user) return json(res, 401, { error: "يرجى تسجيل الدخول." });
  const circle = await teacherCircle(user);
  if (!circle) return json(res, 404, { error: "لا توجد حلقة مسندة لهذا الحساب." });
  const date = url.searchParams.get("date") || todayInIstanbul();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(res, 400, { error: "التاريخ غير صالح." });
  const students = await pool.query(
    `SELECT s.id, s.full_name,
            ar.status, ar.note
     FROM students s
     LEFT JOIN attendance_sessions ats ON ats.circle_id = s.circle_id AND ats.session_date = $2
     LEFT JOIN attendance_records ar ON ar.session_id = ats.id AND ar.student_id = s.id
     WHERE s.circle_id = $1 AND s.active = TRUE
     ORDER BY s.created_at, s.full_name`,
    [circle.id, date],
  );
  const today = todayInIstanbul();
  return json(res, 200, {
    date,
    canEdit: isAttendanceOpen({ date, today, startDate: attendanceStartDate }),
    attendanceStartDate,
    nextSessionDate: nextSessionDate(today, attendanceStartDate),
    circle: { id: circle.id, name: circle.name, teacherName: circle.teacher_name },
    students: students.rows.map((row) => ({ id: row.id, name: row.full_name, status: row.status, note: row.note })),
  });
}

async function saveTeacherAttendance(req, res) {
  const user = await currentUser(req, ["teacher"]);
  if (!user) return json(res, 401, { error: "يرجى تسجيل الدخول بحساب المعلم." });
  const circle = await teacherCircle(user);
  if (!circle) return json(res, 404, { error: "لا توجد حلقة مسندة لهذا الحساب." });
  const payload = await body(req);
  const date = String(payload.date || "");
  if (!isAttendanceOpen({ date, today: todayInIstanbul(), startDate: attendanceStartDate })) {
    return json(res, 400, { error: "يمكن تسجيل الحضور تلقائياً في يوم الحلقة الحالي فقط." });
  }
  const records = Array.isArray(payload.records) ? payload.records : [];
  if (records.length > 250) return json(res, 400, { error: "عدد السجلات غير صالح." });
  const validStatuses = new Set(["present", "absent", "late"]);
  if (records.some((r) => !r.studentId || !validStatuses.has(r.status))) {
    return json(res, 400, { error: "توجد حالة حضور غير صالحة." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const owned = await client.query(
      "SELECT id FROM students WHERE circle_id = $1 AND active = TRUE AND id = ANY($2::uuid[])",
      [circle.id, records.map((r) => r.studentId)],
    );
    if (owned.rowCount !== new Set(records.map((r) => r.studentId)).size) {
      throw Object.assign(new Error("Student mismatch"), { status: 403 });
    }
    const session = await client.query(
      `INSERT INTO attendance_sessions (id, circle_id, session_date)
       VALUES ($1, $2, $3)
       ON CONFLICT (circle_id, session_date) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      [randomUUID(), circle.id, date],
    );
    await client.query(
      "DELETE FROM attendance_records WHERE session_id = $1 AND NOT (student_id = ANY($2::uuid[]))",
      [session.rows[0].id, records.map((record) => record.studentId)],
    );
    for (const record of records) {
      await client.query(
        `INSERT INTO attendance_records (id, session_id, student_id, status, note, recorded_by, source)
         VALUES ($1, $2, $3, $4, $5, $6, 'platform')
         ON CONFLICT (session_id, student_id) DO UPDATE SET
           status = EXCLUDED.status, note = EXCLUDED.note,
           recorded_by = EXCLUDED.recorded_by, source = EXCLUDED.source, updated_at = NOW()`,
        [randomUUID(), session.rows[0].id, record.studentId, record.status, record.note || null, user.id],
      );
    }
    await client.query("COMMIT");
    return json(res, 200, { ok: true, savedAt: new Date().toISOString() });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.status) return json(res, error.status, { error: "لا يمكن تسجيل طالب خارج حلقة المعلم." });
    throw error;
  } finally {
    client.release();
  }
}

async function adminOverview(req, res) {
  const user = await currentUser(req, ["admin"]);
  if (!user) return json(res, 401, { error: "يرجى تسجيل الدخول بحساب الإدارة." });
  const [stats, reference, teachers, students] = await Promise.all([
    pool.query(`SELECT
      (SELECT COUNT(*)::int FROM students WHERE active = TRUE) AS students,
      (SELECT COUNT(*)::int FROM circles WHERE active = TRUE) AS circles,
      (SELECT COUNT(*)::int FROM users WHERE role = 'teacher' AND active = TRUE) AS teachers,
      (SELECT COUNT(*)::int FROM attendance_records) AS attendance_records`),
    pool.query("SELECT MAX(session_date)::text AS date FROM attendance_sessions"),
    pool.query(`SELECT u.id, u.full_name, u.username, c.name AS circle_name,
      (SELECT COUNT(*)::int FROM students s WHERE s.circle_id = c.id AND s.active = TRUE) AS student_count
      FROM users u LEFT JOIN circles c ON c.teacher_user_id = u.id AND c.active = TRUE
      WHERE u.role = 'teacher' AND u.active = TRUE ORDER BY u.full_name`),
    pool.query(`SELECT s.id, s.full_name, c.name AS circle_name, u.full_name AS teacher_name
      FROM students s JOIN circles c ON c.id = s.circle_id
      LEFT JOIN users u ON u.id = c.teacher_user_id
      WHERE s.active = TRUE ORDER BY c.sort_order, s.created_at, s.full_name`),
  ]);
  const referenceDate = reference.rows[0].date;
  const circles = await pool.query(
    `SELECT c.id, c.name, u.full_name AS teacher_name,
      COUNT(DISTINCT s.id)::int AS student_count,
      COUNT(DISTINCT ar.id)::int AS recorded_count,
      COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'present')::int AS present,
      COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'absent')::int AS absent,
      COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'late')::int AS late
     FROM circles c
     LEFT JOIN users u ON u.id = c.teacher_user_id
     LEFT JOIN students s ON s.circle_id = c.id AND s.active = TRUE
     LEFT JOIN attendance_sessions ats ON ats.circle_id = c.id AND ats.session_date = $1::date
     LEFT JOIN attendance_records ar ON ar.session_id = ats.id AND ar.student_id = s.id
     WHERE c.active = TRUE
     GROUP BY c.id, u.full_name ORDER BY c.sort_order`,
    [referenceDate],
  );
  const watchlist = await pool.query(
    `WITH recent_dates AS (
       SELECT DISTINCT session_date FROM attendance_sessions ORDER BY session_date DESC LIMIT 4
     )
     SELECT s.id, s.full_name, c.name AS circle_name,
       COUNT(*) FILTER (WHERE ar.status = 'absent')::int AS absence_count
     FROM attendance_records ar
     JOIN attendance_sessions ats ON ats.id = ar.session_id
     JOIN recent_dates rd ON rd.session_date = ats.session_date
     JOIN students s ON s.id = ar.student_id
     JOIN circles c ON c.id = s.circle_id
     GROUP BY s.id, c.name
     HAVING COUNT(*) FILTER (WHERE ar.status = 'absent') >= 2
     ORDER BY absence_count DESC, s.full_name LIMIT 8`,
  );
  const circleRows = circles.rows.map((row) => ({
    id: row.id,
    name: row.name,
    teacherName: row.teacher_name,
    studentCount: row.student_count,
    recordedCount: row.recorded_count,
    present: row.present,
    absent: row.absent,
    late: row.late,
    status: row.recorded_count === 0 ? "pending" : row.recorded_count >= row.student_count ? "complete" : "partial",
  }));
  const totals = circleRows.reduce((acc, row) => ({
    recorded: acc.recorded + row.recordedCount,
    present: acc.present + row.present,
    absent: acc.absent + row.absent,
    late: acc.late + row.late,
  }), { recorded: 0, present: 0, absent: 0, late: 0 });
  return json(res, 200, {
    stats: stats.rows[0],
    referenceDate,
    totals,
    circles: circleRows,
    teachers: teachers.rows.map((row) => ({ id: row.id, name: row.full_name, username: row.username, circleName: row.circle_name, studentCount: row.student_count || 0 })),
    students: students.rows.map((row) => ({ id: row.id, name: row.full_name, circleName: row.circle_name, teacherName: row.teacher_name })),
    watchlist: watchlist.rows.map((row) => ({ id: row.id, name: row.full_name, circleName: row.circle_name, absenceCount: row.absence_count })),
  });
}

const teacherData = createTeacherDataHandlers({ pool, currentUser, json, body, todayInIstanbul, attendanceStartDate });
const adminData = createAdminDataHandlers({ pool, currentUser, json, body, hashPassword });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (!checkOrigin(req)) return json(res, 403, { error: "الطلب غير مسموح." });
    if (req.method === "GET" && url.pathname === "/api/health") return json(res, 200, { ok: true });
    if (req.method === "POST" && url.pathname === "/api/auth/login") return await login(req, res);
    if (req.method === "POST" && url.pathname === "/api/auth/logout") return await logout(req, res);
    if (req.method === "GET" && url.pathname === "/api/auth/me") {
      const user = await currentUser(req);
      return user ? json(res, 200, { user: publicUser(user) }) : json(res, 401, { error: "يرجى تسجيل الدخول." });
    }
    if (req.method === "POST" && url.pathname === "/api/auth/change-password") return await changePassword(req, res);
    if (req.method === "GET" && url.pathname === "/api/teacher/attendance") return await teacherData.getSession(req, res, url);
    if (req.method === "PUT" && url.pathname === "/api/teacher/attendance") return await teacherData.saveSession(req, res);
    if (req.method === "GET" && url.pathname === "/api/admin/overview") return await adminData.overview(req, res);
    if (req.method === "GET" && url.pathname === "/api/admin/attendance") return await adminData.attendance(req, res, url);
    if (req.method === "GET" && url.pathname === "/api/admin/quran") return await adminData.quran(req, res, url);
    if (req.method === "GET" && url.pathname === "/api/admin/monthly") return await adminData.monthly(req, res, url);
    if (req.method === "POST" && url.pathname === "/api/admin/students") return await adminData.saveStudent(req, res);
    if (req.method === "PUT" && url.pathname === "/api/admin/students/transfer") return await adminData.transferStudents(req, res);
    if (req.method === "POST" && url.pathname === "/api/admin/teachers") return await adminData.createTeacher(req, res);
    const studentMatch = url.pathname.match(/^\/api\/admin\/students\/([0-9a-f-]+)$/i);
    if (studentMatch && req.method === "GET") return await adminData.studentDetail(req, res, studentMatch[1]);
    if (studentMatch && req.method === "PUT") return await adminData.saveStudent(req, res, studentMatch[1]);
    if (studentMatch && req.method === "DELETE") return url.searchParams.get("permanent") === "true" ? await adminData.deleteStudentPermanently(req, res, studentMatch[1]) : await adminData.archiveStudent(req, res, studentMatch[1]);
    const teacherMatch = url.pathname.match(/^\/api\/admin\/teachers\/([0-9a-f-]+)$/i);
    if (teacherMatch && req.method === "PUT") return await adminData.updateTeacher(req, res, teacherMatch[1]);
    if (teacherMatch && req.method === "DELETE") return await adminData.archiveTeacher(req, res, teacherMatch[1]);
    const circleMatch = url.pathname.match(/^\/api\/admin\/circles\/([0-9a-f-]+)$/i);
    if (circleMatch && req.method === "PUT") return await adminData.saveCircle(req, res, circleMatch[1]);
    const approvalMatch = url.pathname.match(/^\/api\/admin\/sessions\/([0-9a-f-]+)\/approval$/i);
    if (approvalMatch && req.method === "PUT") return await adminData.approveSession(req, res, approvalMatch[1]);
    return json(res, 404, { error: "المسار غير موجود." });
  } catch (error) {
    console.error(error);
    return json(res, error.status || 500, { error: "حدث خطأ غير متوقع. حاول مرة أخرى." });
  }
});

server.listen(port, host, () => console.log(`Ihyaa API listening on http://${host}:${port}`));

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
