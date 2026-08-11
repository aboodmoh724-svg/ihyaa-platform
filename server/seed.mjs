import { readFile, writeFile, chmod } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { hashPassword, normalizeName, temporaryPassword } from "./security.mjs";

const { Client } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!process.env.IMPORT_FILE) throw new Error("IMPORT_FILE is required");

const source = JSON.parse(await readFile(process.env.IMPORT_FILE, "utf8"));
const client = new Client({ connectionString: process.env.DATABASE_URL });
const credentials = [];
const usernames = new Map([
  ["محمد حسن", "mohamed.hassan"],
  ["إسماعيل سيف", "ismail.saif"],
  ["عمرو خالد", "amr.khaled"],
  ["عبدالرحمن دهبية", "abdulrahman.dahbia"],
]);
const inactiveStudents = new Set(
  source.attendance
    .filter((record) => String(record.note || "").includes("منقطع"))
    .map((record) => `${record.sourceTab}:${normalizeName(record.studentName)}`),
);

async function ensureUser({ username, fullName, role }) {
  const found = await client.query("SELECT id FROM users WHERE LOWER(username) = LOWER($1)", [username]);
  if (found.rowCount) return found.rows[0].id;
  const id = randomUUID();
  const password = temporaryPassword();
  await client.query(
    `INSERT INTO users (id, username, full_name, role, password_hash, must_change_password)
     VALUES ($1, $2, $3, $4, $5, TRUE)`,
    [id, username, fullName, role, await hashPassword(password)],
  );
  credentials.push({ role, fullName, username, temporaryPassword: password });
  return id;
}

await client.connect();
try {
  await client.query("BEGIN");
  await ensureUser({
    username: process.env.ADMIN_USERNAME || "admin",
    fullName: process.env.ADMIN_NAME || "إدارة مؤسسة إحياء",
    role: "admin",
  });

  const teacherIds = new Map();
  for (const circle of source.circles) {
    if (!circle.teacherName) continue;
    const username = usernames.get(circle.teacherName);
    if (!username) throw new Error(`No username configured for ${circle.teacherName}`);
    teacherIds.set(circle.teacherName, await ensureUser({ username, fullName: circle.teacherName, role: "teacher" }));
  }

  const circleIds = new Map();
  for (const circle of source.circles) {
    const existing = await client.query("SELECT id FROM circles WHERE source_key = $1", [circle.sourceTab]);
    const id = existing.rows[0]?.id || randomUUID();
    await client.query(
      `INSERT INTO circles (id, name, source_key, teacher_user_id, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (source_key) DO UPDATE SET
         name = EXCLUDED.name, teacher_user_id = EXCLUDED.teacher_user_id,
         sort_order = EXCLUDED.sort_order, updated_at = NOW()`,
      [id, circle.name, circle.sourceTab, teacherIds.get(circle.teacherName) || null, circle.sortOrder],
    );
    circleIds.set(circle.sourceTab, id);
  }

  const studentIds = new Map();
  for (const student of source.students) {
    const circleId = circleIds.get(student.sourceTab);
    const normalized = normalizeName(student.fullName);
    const existing = await client.query(
      "SELECT id FROM students WHERE circle_id = $1 AND normalized_name = $2",
      [circleId, normalized],
    );
    const id = existing.rows[0]?.id || randomUUID();
    await client.query(
      `INSERT INTO students (id, full_name, normalized_name, circle_id, source_key, active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (circle_id, normalized_name) DO UPDATE SET
         full_name = EXCLUDED.full_name, source_key = EXCLUDED.source_key,
         active = EXCLUDED.active, updated_at = NOW()`,
      [id, student.fullName, normalized, circleId, `${student.sourceTab}:${normalized}`, !inactiveStudents.has(`${student.sourceTab}:${normalized}`)],
    );
    studentIds.set(`${student.sourceTab}:${normalized}`, id);
  }

  const sessionIds = new Map();
  async function sessionId(sourceTab, date) {
    const key = `${sourceTab}:${date}`;
    if (sessionIds.has(key)) return sessionIds.get(key);
    const circleId = circleIds.get(sourceTab);
    const existing = await client.query(
      "SELECT id FROM attendance_sessions WHERE circle_id = $1 AND session_date = $2",
      [circleId, date],
    );
    const id = existing.rows[0]?.id || randomUUID();
    await client.query(
      `INSERT INTO attendance_sessions (id, circle_id, session_date)
       VALUES ($1, $2, $3) ON CONFLICT (circle_id, session_date) DO NOTHING`,
      [id, circleId, date],
    );
    sessionIds.set(key, id);
    return id;
  }

  for (const record of source.attendance) {
    const studentId = studentIds.get(`${record.sourceTab}:${normalizeName(record.studentName)}`);
    const sid = await sessionId(record.sourceTab, record.date);
    await client.query(
      `INSERT INTO attendance_records (id, session_id, student_id, status, note, source)
       VALUES ($1, $2, $3, $4, $5, 'google-sheet-import')
       ON CONFLICT (session_id, student_id) DO UPDATE SET
         status = EXCLUDED.status, note = EXCLUDED.note, source = EXCLUDED.source, updated_at = NOW()`,
      [randomUUID(), sid, studentId, record.status, record.note || null],
    );
  }

  for (const record of source.quranRecords) {
    const studentId = studentIds.get(`${record.sourceTab}:${normalizeName(record.studentName)}`);
    await client.query(
      `INSERT INTO quran_records (id, student_id, session_date, entry_text, followup_type, content_text)
       VALUES ($1, $2, $3, $4, $5, $4)
       ON CONFLICT (student_id, session_date) DO UPDATE SET
         entry_text = EXCLUDED.entry_text, followup_type = EXCLUDED.followup_type,
         content_text = EXCLUDED.content_text, updated_at = NOW()`,
      [randomUUID(), studentId, record.date, record.entry, /لم يسمع|^[-❌️]+$/.test(record.entry) ? "not_heard" : "recitation"],
    );
  }

  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}

if (process.env.CREDENTIALS_FILE && credentials.length) {
  await writeFile(process.env.CREDENTIALS_FILE, `${JSON.stringify(credentials, null, 2)}\n`, { mode: 0o600 });
  await chmod(process.env.CREDENTIALS_FILE, 0o600);
}

console.log(JSON.stringify({
  circles: source.circles.length,
  students: source.students.length,
  attendanceRecords: source.attendance.length,
  quranRecords: source.quranRecords.length,
  accountsCreated: credentials.length,
}));
