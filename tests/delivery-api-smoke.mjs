import assert from "node:assert/strict";

const base = process.env.IHYAA_BASE_URL;
const adminPassword = process.env.IHYAA_ADMIN_PASSWORD;
const teacherPassword = process.env.IHYAA_TEACHER_PASSWORD;
if (!base || !adminPassword || !teacherPassword) throw new Error("Delivery test environment is incomplete.");

async function call(path, { method = "GET", body, cookie } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(payload.error || `${method} ${path} failed`), { status: response.status, payload });
  return { payload, cookie: response.headers.get("set-cookie")?.split(";")[0] };
}

const adminLogin = await call("/auth/login", { method: "POST", body: { identity: "admin", password: adminPassword, role: "admin" } });
const adminCookie = adminLogin.cookie;
assert.ok(adminCookie);

const overview = (await call("/admin/overview", { cookie: adminCookie })).payload;
assert.ok(overview.circles.length >= 2);
assert.ok(overview.teachers.length >= 1);
assert.ok(overview.students.length >= 1);

const sourceCircle = overview.circles[0];
const targetCircle = overview.circles[1];
const testName = `طالب اختبار التسليم ${Date.now()}`;
let studentId;
let teacher;
let originalTeacherUsername;

try {
  studentId = (await call("/admin/students", {
    method: "POST", cookie: adminCookie,
    body: { name: testName, circleId: sourceCircle.id, status: "active", adminNotes: "سجل اختبار آلي يحذف بعد انتهاء الفحص" },
  })).payload.id;
  assert.ok(studentId);

  await call(`/admin/students/${studentId}`, {
    method: "PUT", cookie: adminCookie,
    body: { name: testName, circleId: targetCircle.id, status: "active", adminNotes: "اختبار نقل فردي" },
  });
  let detail = (await call(`/admin/students/${studentId}`, { cookie: adminCookie })).payload;
  assert.equal(detail.student.circleId, targetCircle.id);
  assert.equal(detail.transfers.length, 1);
  assert.equal(detail.transfers[0].fromCircleName, sourceCircle.name);
  assert.equal(detail.transfers[0].toCircleName, targetCircle.name);

  const bulk = (await call("/admin/students/transfer", {
    method: "PUT", cookie: adminCookie,
    body: { studentIds: [studentId], circleId: sourceCircle.id },
  })).payload;
  assert.equal(bulk.moved, 1);
  assert.equal(bulk.toCircle, sourceCircle.name);
  detail = (await call(`/admin/students/${studentId}`, { cookie: adminCookie })).payload;
  assert.equal(detail.transfers.length, 2);

  const attendance = (await call("/admin/attendance", { cookie: adminCookie })).payload;
  const quran = (await call("/admin/quran", { cookie: adminCookie })).payload;
  const monthly = (await call("/admin/monthly?month=2026-08", { cookie: adminCookie })).payload;
  assert.ok(Array.isArray(attendance.records));
  assert.ok(Array.isArray(quran.records));
  assert.ok(Array.isArray(monthly.students));

  teacher = overview.teachers.find((item) => item.username === "amjad") || overview.teachers[0];
  originalTeacherUsername = teacher.username;
  const testUsername = `qa.delivery+${Date.now()}@alehyaa.com`;
  await call(`/admin/teachers/${teacher.id}`, { method: "PUT", cookie: adminCookie, body: { name: teacher.name, username: testUsername, active: teacher.active } });
  const teacherLogin = await call("/auth/login", { method: "POST", body: { identity: testUsername, password: teacherPassword, role: "teacher" } });
  assert.ok(teacherLogin.cookie);
  const teacherPage = (await call("/teacher/attendance", { cookie: teacherLogin.cookie })).payload;
  assert.equal(teacherPage.circles.some((circle) => circle.id === teacherPage.circle.id), true);
  assert.equal(teacherPage.availableDates.length, 2);
  await assert.rejects(
    call("/admin/overview", { cookie: teacherLogin.cookie }),
    (error) => error.status === 401,
  );

  console.log(JSON.stringify({ ok: true, circles: overview.circles.length, teachers: overview.teachers.length, students: overview.students.length, transferHistory: detail.transfers.length, attendanceRecords: attendance.records.length, quranRecords: quran.records.length, monthlyStudents: monthly.students.length, teacherDates: teacherPage.availableDates }, null, 2));
} finally {
  if (teacher && originalTeacherUsername) {
    await call(`/admin/teachers/${teacher.id}`, { method: "PUT", cookie: adminCookie, body: { name: teacher.name, username: originalTeacherUsername, active: teacher.active } }).catch(() => {});
  }
  if (studentId) await call(`/admin/students/${studentId}?permanent=true`, { method: "DELETE", cookie: adminCookie }).catch(() => {});
}
