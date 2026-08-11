async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    headers: options.body ? { "content-type": "application/json", ...options.headers } : options.headers,
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "تعذر إكمال الطلب.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const dataService = {
  signIn({ identity, password, role }) {
    return request("/auth/login", { method: "POST", body: JSON.stringify({ identity, password, role }) });
  },
  signOut() {
    return request("/auth/logout", { method: "POST" });
  },
  me() {
    return request("/auth/me");
  },
  changePassword({ currentPassword, newPassword }) {
    return request("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
  },
  teacherAttendance({ date, circleId } = {}) {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (circleId) params.set("circleId", circleId);
    return request(`/teacher/attendance${params.size ? `?${params}` : ""}`);
  },
  saveTeacherSession(payload) {
    return request("/teacher/attendance", { method: "PUT", body: JSON.stringify(payload) });
  },
  adminOverview() {
    return request("/admin/overview");
  },
  adminAttendance(filters = {}) {
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    return request(`/admin/attendance${params.size ? `?${params}` : ""}`);
  },
  adminQuran(filters = {}) {
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    return request(`/admin/quran${params.size ? `?${params}` : ""}`);
  },
  adminMonthly(filters = {}) {
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    return request(`/admin/monthly?${params}`);
  },
  studentDetail(id) { return request(`/admin/students/${id}`); },
  createStudent(payload) { return request("/admin/students", { method: "POST", body: JSON.stringify(payload) }); },
  updateStudent(id, payload) { return request(`/admin/students/${id}`, { method: "PUT", body: JSON.stringify(payload) }); },
  archiveStudent(id) { return request(`/admin/students/${id}`, { method: "DELETE" }); },
  deleteStudent(id) { return request(`/admin/students/${id}?permanent=true`, { method: "DELETE" }); },
  transferStudents(payload) { return request("/admin/students/transfer", { method: "PUT", body: JSON.stringify(payload) }); },
  updateCircle(id, payload) { return request(`/admin/circles/${id}`, { method: "PUT", body: JSON.stringify(payload) }); },
  createTeacher(payload) { return request("/admin/teachers", { method: "POST", body: JSON.stringify(payload) }); },
  updateTeacher(id, payload) { return request(`/admin/teachers/${id}`, { method: "PUT", body: JSON.stringify(payload) }); },
  archiveTeacher(id) { return request(`/admin/teachers/${id}`, { method: "DELETE" }); },
  approveSession(id, approved = true) { return request(`/admin/sessions/${id}/approval`, { method: "PUT", body: JSON.stringify({ approved }) }); },
};
