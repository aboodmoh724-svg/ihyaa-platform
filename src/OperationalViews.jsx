import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive, BookOpen, CalendarBlank, ChartBar, Check, CheckCircle, Clock, FloppyDisk, Gear,
  House, PencilSimple, Plus, SignOut, Student, UserCircle, Users, UsersThree, Warning, X,
} from "@phosphor-icons/react";
import { dataService } from "./data.js";

const attendanceOptions = [
  ["present", "حاضر", Check],
  ["absent", "غائب", X],
  ["late", "متأخر", Clock],
  ["excused", "معتذر", CheckCircle],
  ["traveling", "مسافر", SignOut],
];
const attendanceLabels = Object.fromEntries(attendanceOptions.map(([value, label]) => [value, label]));
const followupLabels = { recitation: "تسميع", new_memorization: "حفظ جديد", revision: "مراجعة", not_heard: "لم يسمع" };
const performanceLabels = { excellent: "ممتاز", good: "جيد", needs_followup: "يحتاج متابعة" };
const quranSurahs = "الفاتحة,البقرة,آل عمران,النساء,المائدة,الأنعام,الأعراف,الأنفال,التوبة,يونس,هود,يوسف,الرعد,إبراهيم,الحجر,النحل,الإسراء,الكهف,مريم,طه,الأنبياء,الحج,المؤمنون,النور,الفرقان,الشعراء,النمل,القصص,العنكبوت,الروم,لقمان,السجدة,الأحزاب,سبأ,فاطر,يس,الصافات,ص,الزمر,غافر,فصلت,الشورى,الزخرف,الدخان,الجاثية,الأحقاف,محمد,الفتح,الحجرات,ق,الذاريات,الطور,النجم,القمر,الرحمن,الواقعة,الحديد,المجادلة,الحشر,الممتحنة,الصف,الجمعة,المنافقون,التغابن,الطلاق,التحريم,الملك,القلم,الحاقة,المعارج,نوح,الجن,المزمل,المدثر,القيامة,الإنسان,المرسلات,النبأ,النازعات,عبس,التكوير,الانفطار,المطففين,الانشقاق,البروج,الطارق,الأعلى,الغاشية,الفجر,البلد,الشمس,الليل,الضحى,الشرح,التين,العلق,القدر,البينة,الزلزلة,العاديات,القارعة,التكاثر,العصر,الهمزة,الفيل,قريش,الماعون,الكوثر,الكافرون,النصر,المسد,الإخلاص,الفلق,الناس".split(",");

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function signOut() {
  try { await dataService.signOut(); } finally { navigate("/login"); }
}

function LogoutConfirmModal({ onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return <div className="modal-backdrop logout-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <section className="logout-confirm-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
      <div className="logout-confirm-icon"><Warning size={40} weight="fill" /></div>
      <h2>تسجيل الخروج</h2>
      <p>هل تود تأكيد تسجيل الخروج من المنصة؟</p>
      <div className="logout-confirm-actions">
        <button className="button button-primary logout-confirm-btn" onClick={onConfirm}><SignOut size={20} /> تأكيد الخروج</button>
        <button className="button button-ghost" onClick={onCancel}>إلغاء</button>
      </div>
    </section>
  </div>;
}

function Brand({ compact = false }) {
  return <div className={`logo-lockup light${compact ? " compact" : ""}`}><img src="/assets/ihyaa-logo.png" alt="شعار مؤسسة إحياء" />{!compact && <strong>مؤسسة إحياء</strong>}</div>;
}

function formatDate(value, withYear = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", year: withYear ? "numeric" : undefined, timeZone: "Europe/Istanbul" }).format(new Date(`${value}T12:00:00+03:00`));
}

function blankStudent(student) {
  return {
    id: student.id,
    name: student.name,
    attendance: { status: student.attendance?.status || "", note: student.attendance?.note || "" },
    quran: { type: student.quran?.type || "", content: student.quran?.content || "", surah: student.quran?.surah || "", from: student.quran?.from || "", to: student.quran?.to || "", performance: student.quran?.performance || "", note: student.quran?.note || "" },
  };
}

export function TeacherWorkspace() {
  const [page, setPage] = useState(null);
  const [students, setStudents] = useState([]);
  const [circleId, setCircleId] = useState("");
  const [date, setDate] = useState("");
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dirty = useRef(false);

  useEffect(() => {
    const warn = (e) => { if (dirty.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const load = useCallback(async (next = {}) => {
    setState("loading"); setMessage("");
    try {
      const payload = await dataService.teacherAttendance({ date: next.date || date || undefined, circleId: next.circleId || circleId || undefined });
      setPage(payload); setStudents(payload.students.map(blankStudent));
      setCircleId(payload.circle.id); setDate(payload.date); setState("ready");
    } catch (error) {
      if (error.status === 401) navigate("/login");
      else { setMessage(error.message); setState("error"); }
    }
  }, [circleId, date]);

  useEffect(() => { load(); }, []);

  function updateStudent(id, section, field, value) {
    setStudents((items) => items.map((item) => item.id === id ? { ...item, [section]: { ...item[section], [field]: value } } : item));
    setMessage(""); dirty.current = true;
  }

  function updateAttendanceStatus(id, status) {
    setStudents((items) => items.map((item) => item.id === id ? {
      ...item,
      attendance: { ...item.attendance, status },
      quran: status === "present" ? item.quran : { type: "", content: "", surah: "", from: "", to: "", performance: "", note: "" },
    } : item));
    setMessage(""); dirty.current = true;
  }

  async function saveEntries(entries, successMessage) {
    setState("saving"); setMessage("");
    try {
      await dataService.saveTeacherSession({ circleId, date, students: entries.map(({ id, attendance, quran }) => ({ studentId: id, attendance, quran })) });
      const payload = await dataService.teacherAttendance({ circleId, date });
      setPage(payload); setStudents(payload.students.map(blankStudent));
      setState("saved"); setMessage(successMessage); dirty.current = false;
    } catch (error) { setState("error"); setMessage(error.message); }
  }

  if (!page) return <Loading message={message || "جارٍ تحميل حلقاتك..."} />;
  const marked = students.filter((student) => student.attendance.status).length;
  const heard = students.filter((student) => student.quran.type).length;
  const isQuranDay = new Date(`${date}T12:00:00+03:00`).getUTCDay() === 0;

  const requestLogout = () => setShowLogoutConfirm(true);

  return <div className="teacher-shell teacher-workspace teacher-simple" dir="rtl">
    <header className="teacher-header"><div className="teacher-brand"><Brand compact /><div><small>مؤسسة إحياء</small><h1>{page.circle.name}</h1><p><CalendarBlank size={19} /> {formatDate(date)}</p></div></div><blockquote>وَلِحَامِلِ الْقُرْآنِ <strong>شَرَفٌ</strong> فِي الْأُمَمِ،<br />وَبِهِ <strong>يُعْلَى</strong> مَقَامُ الْمَرْءِ وَيَرْتَقِي.</blockquote><button type="button" className="header-back" onClick={requestLogout}>الخروج <SignOut size={22} /></button></header>
    <main className="attendance-page">
      <section className="teacher-daybar panel">
        <div className="circle-picker"><span>حلقتك</span><select value={circleId} onChange={(event) => load({ circleId: event.target.value, date })}>{page.circles.map((circle) => <option key={circle.id} value={circle.id}>{circle.name} — {circle.activeStudents} طالب</option>)}</select></div>
        <div className="day-choice"><span>اختر يوم الحلقة</span><div>{page.availableDates.map((value) => <button key={value} className={date === value ? "active" : ""} onClick={() => load({ circleId, date: value })}><strong>{new Intl.DateTimeFormat("ar-EG", { weekday: "long", timeZone: "Europe/Istanbul" }).format(new Date(`${value}T12:00:00+03:00`))}</strong><small>{new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" }).format(new Date(`${value}T12:00:00+03:00`))}</small></button>)}</div></div>
        <div className="day-totals"><span>الحضور <strong>{marked}/{students.length}</strong></span>{isQuranDay && <span>المتابعة <strong>{heard}/{students.length}</strong></span>}</div>
      </section>
      {message && <div className={`notice ${state === "error" ? "notice-error" : "notice-success"}`} role="status">{message}</div>}
      <section className="student-entry-list">
        {students.map((student, index) => <article className="student-entry-card panel" key={student.id}>
          <header><label><span>{index + 1}</span><strong>{student.name}</strong></label><button disabled={!student.attendance.status} className="save-one" onClick={() => saveEntries([student], `تم حفظ بيانات ${student.name}.`)}><FloppyDisk /> حفظ الطالب</button></header>
          <section className="entry-section"><h3>الحضور</h3><div className="attendance-choice">{attendanceOptions.map(([value, label, Icon]) => <button type="button" key={value} className={`attendance-pill ${value}${student.attendance.status === value ? " selected" : ""}`} onClick={() => updateAttendanceStatus(student.id, value)}><Icon size={17} />{label}</button>)}</div></section>
          {isQuranDay && <section className="entry-section quran-simple"><h3>متابعة القرآن</h3>{student.attendance.status !== "present" ? <div className="quran-locked"><BookOpen /><span>{student.attendance.status ? "متابعة القرآن متاحة للطالب الحاضر فقط" : "حدد حالة الحضور أولًا"}</span></div> : <><div className="followup-choice">{[["new_memorization","حفظ جديد"],["revision","مراجعة"],["not_heard","لم يسمع"]].map(([value,label]) => <button key={value} className={student.quran.type === value ? "active" : ""} onClick={() => updateStudent(student.id, "quran", "type", value)}>{label}</button>)}</div>{student.quran.type && student.quran.type !== "not_heard" && <div className="range-fields"><label>السورة<select value={student.quran.surah} onChange={(e) => updateStudent(student.id, "quran", "surah", e.target.value)}><option value="">اختر السورة</option>{quranSurahs.map((surah) => <option value={surah} key={surah}>{surah}</option>)}</select></label><label>من<input value={student.quran.from} onChange={(e) => updateStudent(student.id, "quran", "from", e.target.value)} placeholder="آية أو صفحة" /></label><label>إلى<input value={student.quran.to} onChange={(e) => updateStudent(student.id, "quran", "to", e.target.value)} placeholder="آية أو صفحة" /></label><label>التقييم<select value={student.quran.performance} onChange={(e) => updateStudent(student.id, "quran", "performance", e.target.value)}><option value="">بدون تقييم</option>{Object.entries(performanceLabels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>}{student.quran.type && <input className="teacher-note-input" value={student.quran.note} onChange={(e) => updateStudent(student.id, "quran", "note", e.target.value)} placeholder="ملاحظة المعلم (اختيارية)" />}</>}</section>}
        </article>)}
      </section>
    </main>
    <footer className="teacher-footer"><div className={`save-indicator ${state}`}><CheckCircle size={23} weight="fill" />{state === "saving" ? "جارٍ الحفظ..." : state === "saved" ? "تم الحفظ في قاعدة البيانات" : isQuranDay ? `${marked} حضور · ${heard} متابعة` : `${marked} حضور مسجل`}</div><button disabled={state === "saving"} className="button button-primary teacher-save" onClick={() => saveEntries(students, "تم حفظ بيانات الحلقة كاملة وأصبحت ظاهرة للإدارة.")}><FloppyDisk size={22} /> حفظ الحلقة كاملة</button></footer>
    {showLogoutConfirm && <LogoutConfirmModal onConfirm={signOut} onCancel={() => setShowLogoutConfirm(false)} />}
  </div>;
}

const adminNav = [["اليوم", House], ["الحلقات", BookOpen], ["المعلمون", UserCircle], ["الطلاب", Users], ["الحضور", CheckCircle], ["متابعة القرآن", BookOpen], ["التقارير", ChartBar]];
const studentStatusLabels = { active: "نشط", discontinued: "منقطع", suspended: "موقوف", graduated: "متخرج" };

export function AdminWorkspace() {
  const [active, setActive] = useState("اليوم");
  const [overview, setOverview] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [quran, setQuran] = useState([]);
  const [filters, setFilters] = useState({ date: "", circleId: "", teacherId: "", student: "" });
  const [editor, setEditor] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [monthFilters, setMonthFilters] = useState({ month: overviewMonth(), circleId: "", teacherId: "", student: "" });
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const suppressNextPop = useRef(false);

  const requestLogout = () => setShowLogoutConfirm(true);

  const refreshOverview = useCallback(() => dataService.adminOverview().then(setOverview).catch((error) => error.status === 401 ? navigate("/login") : setMessage(error.message)), []);
  useEffect(() => { refreshOverview(); }, [refreshOverview]);

  /* Back-button: capture phase fires BEFORE App.jsx's handler */
  useEffect(() => {
    /* Push guard entry so first Back stays on /admin */
    window.history.replaceState({ admin: true, tab: "اليوم" }, "", "/admin");

    function onPop(event) {
      if (suppressNextPop.current) { suppressNextPop.current = false; return; }
      const pathname = window.location.pathname.replace(/\/$/, "") || "/";
      const hash = window.location.hash.replace("#", "");

      /* If hash points to valid tab, switch to it */
      if (pathname === "/admin" && hash) {
        const label = decodeURIComponent(hash);
        const valid = adminNav.find(([l]) => l === label);
        if (valid) {
          event.stopImmediatePropagation();
          setActive(label);
          return;
        }
      }

      /* Back went to /admin with no hash (from a tab) → go to home tab */
      if (pathname === "/admin" && !hash && active !== "اليوم") {
        event.stopImmediatePropagation();
        setActive("اليوم");
        return;
      }

      /* Back tried to leave /admin entirely, or we're already at home → show logout */
      event.stopImmediatePropagation();
      suppressNextPop.current = true;
      window.history.pushState({ admin: true, tab: "اليوم" }, "", "/admin");
      setShowLogoutConfirm(true);
    }
    window.addEventListener("popstate", onPop, true);
    return () => window.removeEventListener("popstate", onPop, true);
  }, [active]);

  async function loadRecords(kind, nextFilters = filters) {
    setMessage("");
    try {
      const payload = kind === "attendance" ? await dataService.adminAttendance(nextFilters) : await dataService.adminQuran(nextFilters);
      if (kind === "attendance") setAttendance(payload.records); else setQuran(payload.records);
    } catch (error) { setMessage(error.message); }
  }

  function open(section) {
    setActive(section);
    /* Push hash so back-button returns to previous tab */
    if (section === "اليوم") {
      window.history.pushState({ admin: true, tab: "اليوم" }, "", "/admin");
    } else {
      window.history.pushState({ admin: true, tab: section }, "", `/admin#${encodeURIComponent(section)}`);
    }
    if (section === "الحضور") loadRecords("attendance");
    if (section === "متابعة القرآن") loadRecords("quran");
    if (section === "التقارير") loadMonthly();
  }

  async function loadMonthly(next = monthFilters) {
    try { setMonthly(await dataService.adminMonthly(next)); } catch (error) { setMessage(error.message); }
  }

  async function saveEntity(payload) {
    const isStudentMove = editor.kind === "student" && editor.item?.id && editor.item.circleId !== payload.circleId;
    if (isStudentMove) {
      const target = overview.circles.find((circle) => circle.id === payload.circleId)?.name || "الحلقة الجديدة";
      if (!window.confirm(`سيتم نقل ${editor.item.name} من «${editor.item.circleName}» إلى «${target}» مع الاحتفاظ بكل سجلاته. هل تريد المتابعة؟`)) return { ok: false };
    }
    try {
      if (editor.kind === "student") editor.item?.id ? await dataService.updateStudent(editor.item.id, payload) : await dataService.createStudent(payload);
      if (editor.kind === "circle") await dataService.updateCircle(editor.item.id, payload);
      if (editor.kind === "teacher") editor.item?.id ? await dataService.updateTeacher(editor.item.id, payload) : await dataService.createTeacher(payload);
      setEditor(null); await refreshOverview(); setMessage("");
      setSuccessMessage(isStudentMove ? `تم نقل ${editor.item.name} وحفظ العملية في سجل التنقلات.` : "تم حفظ التغييرات بنجاح.");
      return { ok: true };
    } catch (error) {
      setMessage(error.message);
      return { ok: false, error: error.message };
    }
  }

  async function showStudent(id) {
    try { setStudentProfile(await dataService.studentDetail(id)); } catch (error) { setMessage(error.message); }
  }

  async function archiveStudent(id) {
    if (!window.confirm("سيتم تحويل حالة الطالب إلى منقطع مع الاحتفاظ بكامل سجلاته. هل تريد المتابعة؟")) return;
    try { await dataService.archiveStudent(id); await refreshOverview(); } catch (error) { setMessage(error.message); }
  }

  async function deleteStudent(id) {
    if (!window.confirm("الحذف النهائي متاح فقط للطالب الذي لا يملك أي سجل حضور أو قرآن. هل تريد المتابعة؟")) return;
    try { await dataService.deleteStudent(id); await refreshOverview(); } catch (error) { setMessage(error.message); }
  }

  async function archiveTeacher(id) {
    if (!window.confirm("سيتم تعطيل حساب المعلم وفك إسناد حلقاته، مع الاحتفاظ بالسجلات التي أدخلها. هل تريد المتابعة؟")) return;
    try { await dataService.archiveTeacher(id); await refreshOverview(); } catch (error) { setMessage(error.message); }
  }

  async function transferStudents(studentIds, targetCircleId) {
    try {
      const result = await dataService.transferStudents({ studentIds, circleId: targetCircleId });
      await refreshOverview(); setMessage("");
      setSuccessMessage(`تم نقل ${result.moved} طالب من ${result.fromCircles.join("، ")} إلى ${result.toCircle}، وحُفظت العملية في السجل.`);
      return result;
    } catch (error) { setMessage(error.message); return null; }
  }

  if (!overview) return <Loading message={message || "جارٍ تحميل بيانات المؤسسة..."} />;
  return <div className="admin-shell admin-workspace" dir="rtl">
    <aside className="admin-sidebar"><Brand /><nav>{adminNav.map(([label, Icon]) => <button key={label} className={active === label ? "active" : ""} onClick={() => open(label)}><Icon size={23} />{label}<span /></button>)}</nav><button type="button" className="admin-logout" onClick={requestLogout}><SignOut size={21} /> تسجيل الخروج</button></aside>
    <main className="admin-main">
      <header className="admin-top"><div><h1>{active === "اليوم" ? "بِحُسنِ إدارتك يستقيمُ العمل ويزدهرُ أثرُ القرآن" : active}</h1><p><CalendarBlank size={19} /> آخر جلسة مسجلة: {formatDate(overview.referenceDate, true)}</p></div><div className="admin-profile"><span><UserCircle size={36} /> إدارة مؤسسة إحياء</span><button type="button" className="mobile-logout" onClick={requestLogout} aria-label="تسجيل الخروج"><SignOut size={22} /></button></div></header>
      {message && <div className="notice notice-error">{message}</div>}
      {successMessage && <div className="notice notice-success" role="status">{successMessage}</div>}
      {active === "اليوم" && <AdminHome overview={overview} open={open} />}
      {active === "الحلقات" && <CirclesSection circles={overview.circles} onEdit={(item) => setEditor({ kind: "circle", item })} />}
      {active === "المعلمون" && <TeachersSection teachers={overview.teachers} onAdd={() => setEditor({ kind: "teacher" })} onEdit={(item) => setEditor({ kind: "teacher", item })} onArchive={archiveTeacher} />}
      {active === "الطلاب" && <StudentsSection students={overview.students} circles={overview.circles} transfers={overview.recentTransfers || []} onAdd={() => setEditor({ kind: "student" })} onEdit={(item) => setEditor({ kind: "student", item })} onOpen={showStudent} onArchive={archiveStudent} onDelete={deleteStudent} onTransfer={transferStudents} />}
      {active === "الحضور" && <RecordsSection kind="attendance" records={attendance} overview={overview} filters={filters} setFilters={setFilters} apply={() => loadRecords("attendance")} />}
      {active === "متابعة القرآن" && <RecordsSection kind="quran" records={quran} overview={overview} filters={filters} setFilters={setFilters} apply={() => loadRecords("quran")} />}
      {active === "التقارير" && <MonthlyReport report={monthly} overview={overview} filters={monthFilters} setFilters={setMonthFilters} apply={() => loadMonthly()} approve={async (id, approved) => { await dataService.approveSession(id, approved); await loadMonthly(); }} />}
    </main>
    {editor && <EntityEditor editor={editor} overview={overview} onClose={() => setEditor(null)} onSave={saveEntity} />}
    {studentProfile && <StudentProfile profile={studentProfile} onClose={() => setStudentProfile(null)} />}
    {showLogoutConfirm && <LogoutConfirmModal onConfirm={signOut} onCancel={() => setShowLogoutConfirm(false)} />}
  </div>;
}

function overviewMonth() { const parts = Object.fromEntries(new Intl.DateTimeFormat("en", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit" }).formatToParts(new Date()).map((part) => [part.type, part.value])); return `${parts.year}-${parts.month}`; }

function AdminHome({ overview, open }) {
  const stats = overview.stats;
  return <>
    <section className="admin-metrics six"><button onClick={() => open("الحلقات")}><BookOpen /><span>الحلقات</span><strong>{stats.circles}</strong></button><button onClick={() => open("المعلمون")}><UserCircle /><span>المعلمون</span><strong>{stats.teachers}</strong></button><button onClick={() => open("الطلاب")}><Users /><span>كل الطلاب</span><strong>{stats.total_students}</strong></button><button onClick={() => open("الطلاب")}><CheckCircle /><span>الطلاب النشطون</span><strong>{stats.active_students}</strong></button><button onClick={() => open("الطلاب")}><X /><span>المنقطعون</span><strong>{stats.inactive_students}</strong></button><button onClick={() => open("متابعة القرآن")}><BookOpen /><span>التسميعات</span><strong>{stats.quran_records}</strong></button></section>
    <section className="admin-grid">
      <article className="priority-card panel"><h2>تنبيهات الغياب المتكرر</h2>{overview.watchlist.length ? overview.watchlist.slice(0, 6).map((student) => <button className="priority-row red" key={student.id} onClick={() => open("الطلاب")}><Student /><p><strong>{student.name}</strong><small>{student.circleName} · {student.absenceCount} غيابات</small></p></button>) : <div className="empty-state">لا توجد حالات متكررة حالياً.</div>}</article>
      <article className="panel quick-summary"><h2>توزيع الطلاب</h2>{overview.circles.map((circle) => <button key={circle.id} onClick={() => open("الحلقات")}><span>{circle.name}</span><strong>{circle.activeStudents} نشط</strong><small>{circle.inactiveStudents} غير نشط</small></button>)}</article>
    </section>
    <section className="admin-grid records-preview"><RecentCard title="آخر سجلات الحضور" action={() => open("الحضور")} items={overview.recentAttendance.slice(0, 6).map((item) => ({ key: item.id, title: item.studentName, meta: `${attendanceLabels[item.status]} · ${item.circleName}`, date: item.date }))} /><RecentCard title="آخر تسميعات القرآن" action={() => open("متابعة القرآن")} items={overview.recentQuran.slice(0, 6).map((item) => ({ key: item.id, title: item.studentName, meta: `${followupLabels[item.type] || "تسميع"} · ${item.content || "دون تفاصيل"}`, date: item.date }))} /></section>
  </>;
}

function RecentCard({ title, items, action }) {
  return <article className="panel recent-card"><div className="panel-title"><h2>{title}</h2><button onClick={action}>عرض الكل</button></div>{items.length ? items.map((item) => <div key={item.key}><span><strong>{item.title}</strong><small>{item.meta}</small></span><time>{formatDate(item.date)}</time></div>) : <div className="empty-state">لا توجد سجلات بعد.</div>}</article>;
}

function CirclesSection({ circles, onEdit }) {
  return <section className="circle-directory">{circles.map((circle) => <article className="panel" key={circle.id}><BookOpen size={31} /><div><h2>{circle.name}</h2><p>{circle.teacherName || "لم يسند معلم"} · {circle.type === "prestige" ? "برستيج" : "حلقة عمومي"}</p></div><button className="icon-action" aria-label={`تعديل ${circle.name}`} onClick={() => onEdit(circle)}><PencilSimple /></button><dl><div><dt>كل الطلاب</dt><dd>{circle.studentCount}</dd></div><div><dt>النشطون</dt><dd>{circle.activeStudents}</dd></div><div><dt>غير النشطين</dt><dd>{circle.inactiveStudents}</dd></div></dl></article>)}</section>;
}

function TeachersSection({ teachers, onAdd, onEdit, onArchive }) {
  return <section className="directory-panel panel"><div className="panel-title"><div><h2>المعلمون والحلقات التابعة لهم</h2><p>إدارة الحسابات وأسماء المستخدمين وكلمات المرور والإسناد.</p></div><button className="button button-primary" onClick={onAdd}><Plus /> إضافة معلم</button></div><div className="teacher-admin-list"><div className="teacher-admin-head"><strong>المعلم</strong><strong>اسم المستخدم</strong><strong>الحلقات</strong><strong>الحالة</strong><strong>الإجراءات</strong></div>{teachers.map((item) => <div className={`teacher-admin-row${item.active ? "" : " inactive"}`} key={item.id}><span><strong>{item.name}</strong><small>{item.activeStudents} طالب نشط</small></span><span dir="ltr">{item.username}</span><span>{item.circleNames || "غير مسند"}</span><span className={`status-chip ${item.active ? "active" : "discontinued"}`}>{item.active ? "حساب نشط" : "حساب معطل"}</span><span className="text-actions"><button onClick={() => onEdit(item)}><PencilSimple /> تعديل الحساب</button>{item.active && <button className="danger-soft" onClick={() => onArchive(item.id)}><Archive /> تعطيل وحذف الإسناد</button>}</span></div>)}</div></section>;
}

function StudentsSection({ students, circles, transfers, onAdd, onEdit, onOpen, onArchive, onDelete, onTransfer }) {
  const [selectedStudents, setSelectedStudents] = useState(() => new Set());
  const [targetCircle, setTargetCircle] = useState("");
  const [search, setSearch] = useState("");
  const toggle = (id) => setSelectedStudents((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const selectedItems = students.filter((student) => selectedStudents.has(student.id));
  const sourceCircles = [...new Set(selectedItems.map((student) => student.circleName))];
  const targetName = circles.find((circle) => circle.id === targetCircle)?.name || "";
  const filteredStudents = students.filter((student) => `${student.name} ${student.circleName}`.toLocaleLowerCase("ar").includes(search.trim().toLocaleLowerCase("ar")));
  const transfer = async () => {
    if (!targetCircle || !selectedStudents.size) return;
    const fromText = sourceCircles.join("، ");
    if (!window.confirm(`سيتم نقل ${selectedStudents.size} طالب من «${fromText}» إلى «${targetName}» مع الاحتفاظ بكل السجلات. هل تريد المتابعة؟`)) return;
    const result = await onTransfer([...selectedStudents], targetCircle);
    if (result) { setSelectedStudents(new Set()); setTargetCircle(""); }
  };
  return <section className="directory-panel panel student-directory">
    <div className="panel-title"><div><h2>الطلاب وتوزيع الحلقات</h2><p>كل نقل يُعرض بوضوح من الحلقة السابقة إلى الجديدة، ويُحفظ تلقائيًا في سجل الطالب.</p></div><button className="button button-primary" onClick={onAdd}><Plus /> إضافة طالب</button></div>
    <div className="student-tools"><label className="student-search">بحث عن طالب أو حلقة<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="اكتب اسم الطالب أو الحلقة" /></label><div className="student-transfer-bar"><div><small>المحددون</small><strong>{selectedStudents.size} طالب</strong></div><div className="transfer-route"><span><small>من</small><strong>{sourceCircles.length ? sourceCircles.join("، ") : "حدد الطلاب أولًا"}</strong></span><span><small>إلى</small><select aria-label="الحلقة الجديدة" value={targetCircle} onChange={(e) => setTargetCircle(e.target.value)}><option value="">اختر الحلقة الجديدة</option>{circles.filter((circle) => circle.active).map((circle) => <option value={circle.id} key={circle.id}>{circle.name}</option>)}</select></span></div><button className="button button-primary" disabled={!targetCircle || !selectedStudents.size} onClick={transfer}>تأكيد النقل</button></div></div>
    {transfers.length > 0 && <section className="transfer-history"><div><h3>آخر عمليات النقل</h3><p>مرجع سريع للتغييرات التي أجرتها الإدارة.</p></div><div className="transfer-history-list">{transfers.slice(0, 6).map((item) => <button key={item.id} onClick={() => onOpen(item.studentId)}><strong>{item.studentName}</strong><span>من {item.fromCircleName}</span><span>إلى {item.toCircleName}</span><time>{new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(item.createdAt))}</time></button>)}</div></section>}
    <div className="student-admin-list"><div className="student-admin-head"><strong></strong><strong>الطالب</strong><strong>الحلقة الحالية</strong><strong>الحالة</strong><strong>الحضور</strong><strong>الإجراءات</strong></div>{filteredStudents.map((item) => <div className="student-admin-row" key={item.id}><input type="checkbox" checked={selectedStudents.has(item.id)} onChange={() => toggle(item.id)} aria-label={`تحديد ${item.name}`} /><button className="student-link" onClick={() => onOpen(item.id)}>{item.name}</button><span>{item.circleName}</span><span className={`status-chip ${item.status}`}>{studentStatusLabels[item.status] || (item.active ? "نشط" : "منقطع")}</span><span>{item.attendanceRate}%</span><span className="text-actions"><button onClick={() => onOpen(item.id)}>عرض السجل</button><button onClick={() => onEdit(item)}><PencilSimple /> تعديل البيانات أو نقل الحلقة</button>{item.active && <button className="warning-soft" onClick={() => onArchive(item.id)}><Archive /> تحويل إلى منقطع</button>}<button className="danger-soft" onClick={() => onDelete(item.id)}><X /> حذف نهائي</button></span></div>)}</div>
    {!filteredStudents.length && <div className="empty-state">لا توجد نتائج مطابقة للبحث.</div>}
  </section>;
}

function EntityEditor({ editor, overview, onClose, onSave }) {
  const item = editor.item || {};
  const [form, setForm] = useState(editor.kind === "student"
    ? { name: item.name || "", circleId: item.circleId || overview.circles[0]?.id || "", status: item.status || "active", adminNotes: item.adminNotes || "", joinedAt: item.joinedAt || "" }
    : editor.kind === "circle"
      ? { teacherId: item.teacherId || "", type: item.type || "regular", active: item.active !== false, meetingDays: item.meetingDays || [6,0], notes: item.notes || "" }
      : { name: item.name || "", username: item.username || "", password: "", active: item.active !== false, changePassword: !item.id });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const targetCircleName = overview.circles.find((circle) => circle.id === form.circleId)?.name || "";
  const isMove = editor.kind === "student" && item.id && item.circleId !== form.circleId;
  const title = editor.kind === "student" ? (item.id ? "تعديل بيانات الطالب" : "إضافة طالب") : editor.kind === "circle" ? `إعدادات ${item.name}` : item.id ? "تعديل حساب المعلم" : "إضافة معلم";
  const intro = editor.kind === "circle" ? "غيّر المعلم المسؤول ونوع الحلقة وحالتها من مكان واحد." : editor.kind === "teacher" ? "بيانات الدخول خاصة بالمعلم، ويمكن تعديلها دون التأثير على سجلاته." : "عدّل البيانات أو انقل الطالب مع بقاء سجل الحضور والقرآن محفوظًا.";

  async function submit(event) {
    event.preventDefault();
    setSaving(true); setFormError("");
    const result = await onSave(form);
    if (result?.error) setFormError(result.error);
    setSaving(false);
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className={`entity-modal entity-${editor.kind}`} onSubmit={submit}>
      <header className="entity-modal-header"><span>{editor.kind === "circle" ? <BookOpen /> : editor.kind === "teacher" ? <UserCircle /> : <Student />}</span><div><h2>{title}</h2><p>{intro}</p></div><button type="button" className="modal-close" aria-label="إغلاق" onClick={onClose}><X /></button></header>
      <div className="entity-modal-body">
        {editor.kind === "student" && <div className="entity-form-grid">
          <label className="wide">الاسم الكامل<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          {item.id && <div className="current-circle wide"><small>الحلقة الحالية</small><strong>{item.circleName}</strong><span>لن تتغير إلا عند اختيار حلقة أخرى أدناه وحفظ التغييرات.</span></div>}
          <label>{item.id ? "النقل إلى حلقة" : "الحلقة"}<select value={form.circleId} onChange={(event) => setForm({ ...form, circleId: event.target.value })}>{overview.circles.map((circle) => <option value={circle.id} key={circle.id}>{circle.name}{circle.id === item.circleId ? " — الحالية" : ""}</option>)}</select></label>
          <label>الحالة<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{Object.entries(studentStatusLabels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          {isMove && <div className="transfer-preview wide"><strong>ملخص النقل قبل الحفظ</strong><span>من «{item.circleName}» إلى «{targetCircleName}»</span><small>سيُحفظ هذا التغيير في سجل تنقلات الطالب.</small></div>}
          <label>تاريخ الانضمام<input type="date" value={form.joinedAt} onChange={(event) => setForm({ ...form, joinedAt: event.target.value })} /></label>
          <label className="wide">ملاحظات إدارية<textarea value={form.adminNotes} onChange={(event) => setForm({ ...form, adminNotes: event.target.value })} /></label>
        </div>}
        {editor.kind === "circle" && <div className="entity-form-grid">
          <label className="wide">المعلم المسؤول<select value={form.teacherId} onChange={(event) => setForm({ ...form, teacherId: event.target.value })}><option value="">غير مسند حاليًا</option>{overview.teachers.filter((teacher) => teacher.active).map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.name}</option>)}</select></label>
          <label>تصنيف الحلقة<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="regular">حلقة عمومي</option><option value="prestige">حلقة بريستيج</option></select></label>
          <label className="switch-label"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span><strong>الحلقة نشطة</strong><small>إيقافها يخفيها عن واجهة المعلم</small></span></label>
          <label className="wide">ملاحظات الحلقة<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="أي ملاحظة تنظيمية تخص الحلقة" /></label>
        </div>}
        {editor.kind === "teacher" && <div className="entity-form-grid">
          <label>اسم المعلم<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>اسم المستخدم أو البريد<input required dir="ltr" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="moh@alehyaa.com" /></label>
          {item.id && !form.changePassword && <button type="button" className="change-password-toggle wide" onClick={() => setForm({ ...form, changePassword: true, password: "" })}>تغيير كلمة المرور</button>}
          {form.changePassword && <label className="wide">{item.id ? "كلمة المرور الجديدة" : "كلمة مرور الحساب"}<input required minLength="10" dir="ltr" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="10 أحرف على الأقل" /></label>}
          {item.id && <label className="switch-label wide"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span><strong>الحساب نشط</strong><small>يمكن للمعلم تسجيل الدخول والوصول إلى حلقاته</small></span></label>}
          <p className="form-hint wide">يمكن حفظ الاسم واسم المستخدم دون إدخال كلمة المرور. يقبل اسمًا إنجليزيًا أو بريدًا مثل moh@alehyaa.com.</p>
        </div>}
        {formError && <div className="entity-form-error" role="alert">{formError}</div>}
      </div>
      <footer className="modal-actions"><button type="button" className="button button-ghost" onClick={onClose}>إلغاء</button><button disabled={saving} className="button button-primary"><FloppyDisk /> {saving ? "جارٍ الحفظ..." : isMove ? "تأكيد النقل والحفظ" : "حفظ التغييرات"}</button></footer>
    </form>
  </div>;
}

function LegacyEntityEditor({ editor, overview, onClose, onSave }) {
  const item = editor.item || {};
  const [form, setForm] = useState(editor.kind === "student" ? { name: item.name || "", circleId: item.circleId || overview.circles[0]?.id || "", status: item.status || "active", adminNotes: item.adminNotes || "", joinedAt: item.joinedAt || "" } : editor.kind === "circle" ? { teacherId: item.teacherId || "", type: item.type || "regular", active: item.active !== false, meetingDays: item.meetingDays || [6,0], notes: item.notes || "" } : { name: item.name || "", username: item.username || "", password: "", active: item.active !== false, changePassword: !item.id });
  const title = editor.kind === "student" ? (item.id ? "تعديل بيانات الطالب" : "إضافة طالب") : editor.kind === "circle" ? `إعدادات ${item.name}` : "إضافة معلم";
  const finalTitle = editor.kind === "teacher" && item.id ? "تعديل حساب المعلم" : title;
  const intro = editor.kind === "circle" ? "غيّر المعلم المسؤول ونوع الحلقة وحالتها من مكان واحد." : editor.kind === "teacher" ? "بيانات الدخول خاصة بالمعلم، ويمكن تغيير كلمة المرور دون التأثير على سجلاته." : "حدّث بيانات الطالب أو انقله إلى حلقة أخرى مع بقاء سجلاته محفوظة.";
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className={`entity-modal entity-${editor.kind}`} onSubmit={(event) => { event.preventDefault(); onSave(form); }}><header className="entity-modal-header"><span>{editor.kind === "circle" ? <BookOpen /> : editor.kind === "teacher" ? <UserCircle /> : <Student />}</span><div><h2>{finalTitle}</h2><p>{intro}</p></div><button type="button" className="modal-close" aria-label="إغلاق" onClick={onClose}><X /></button></header><div className="entity-modal-body">{editor.kind === "student" && <div className="entity-form-grid"><label className="wide">الاسم الكامل<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>الحلقة<select value={form.circleId} onChange={(e) => setForm({ ...form, circleId: e.target.value })}>{overview.circles.map((circle) => <option value={circle.id} key={circle.id}>{circle.name}</option>)}</select></label><label>الحالة<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{Object.entries(studentStatusLabels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>تاريخ الانضمام<input type="date" value={form.joinedAt} onChange={(e) => setForm({ ...form, joinedAt: e.target.value })} /></label><label className="wide">ملاحظات إدارية<textarea value={form.adminNotes} onChange={(e) => setForm({ ...form, adminNotes: e.target.value })} /></label></div>}{editor.kind === "circle" && <div className="entity-form-grid"><label className="wide">المعلم المسؤول<select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}><option value="">غير مسند حاليًا</option>{overview.teachers.filter((teacher) => teacher.active).map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.name}</option>)}</select></label><label>تصنيف الحلقة<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="regular">حلقة عمومي</option><option value="prestige">حلقة بريستيج</option></select></label><label className="switch-label"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /><span><strong>الحلقة نشطة</strong><small>إيقافها يخفيها عن واجهة المعلم</small></span></label><label className="wide">ملاحظات الحلقة<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="أي ملاحظة تنظيمية تخص الحلقة" /></label></div>}{editor.kind === "teacher" && <div className="entity-form-grid"><label>اسم المعلم<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>اسم المستخدم<input required dir="ltr" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>{item.id && !form.changePassword && <button type="button" className="change-password-toggle wide" onClick={() => setForm({ ...form, changePassword: true, password: "" })}>تغيير كلمة المرور</button>}{form.changePassword && <label className="wide">{item.id ? "كلمة المرور الجديدة" : "كلمة مرور الحساب"}<input required minLength="10" dir="ltr" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>}{item.id && <label className="switch-label wide"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /><span><strong>الحساب نشط</strong><small>يمكن للمعلم تسجيل الدخول والوصول إلى حلقاته</small></span></label>}<p className="form-hint wide">يمكن حفظ الاسم واسم المستخدم فقط دون تغيير كلمة المرور.</p></div>}</div><footer className="modal-actions"><button type="button" className="button button-ghost" onClick={onClose}>إلغاء</button><button className="button button-primary"><FloppyDisk /> حفظ التغييرات</button></footer></form></div>;
}

function StudentProfile({ profile, onClose }) {
  const { student } = profile;
  return <div className="modal-backdrop"><section className="student-profile panel">
    <div className="panel-title"><div><h2>{student.name}</h2><p>الحلقة الحالية: {student.circleName} · {student.teacherName || "غير مسند"}</p></div><button className="icon-action" onClick={onClose} aria-label="إغلاق"><X /></button></div>
    {student.adminNotes && <div className="admin-note"><strong>ملاحظة إدارية خاصة</strong><p>{student.adminNotes}</p></div>}
    {profile.transfers?.length > 0 && <section className="student-transfer-log"><div><h3>سجل تنقلات الطالب</h3><p>تاريخ الحلقات محفوظ ولا يتأثر بالنقل الحالي.</p></div>{profile.transfers.map((item) => <article key={item.id}><time>{new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(item.createdAt))}</time><strong>من {item.fromCircleName}</strong><strong>إلى {item.toCircleName}</strong><small>بواسطة {item.transferredByName}</small></article>)}</section>}
    <div className="profile-columns"><TableSection title="سجل الحضور" headers={["التاريخ","الحالة","الحلقة وقت التسجيل","الملاحظة"]} rows={profile.attendance.map((item) => [formatDate(item.date), attendanceLabels[item.status] || item.status, item.circleName || "—", item.note || "—"])} /><TableSection title="متابعة القرآن" headers={["التاريخ","النوع","المتابعة","التقييم"]} rows={profile.quran.map((item) => [formatDate(item.date), followupLabels[item.type] || item.type, item.content || "—", performanceLabels[item.performance] || "—"])} /></div>
  </section></div>;
}

function LegacyStudentProfile({ profile, onClose }) {
  const { student } = profile;
  return <div className="modal-backdrop"><section className="student-profile panel"><div className="panel-title"><div><h2>{student.name}</h2><p>{student.circleName} · {student.teacherName || "غير مسند"}</p></div><button className="icon-action" onClick={onClose} aria-label="إغلاق"><X /></button></div>{student.adminNotes && <div className="admin-note"><strong>ملاحظة إدارية خاصة</strong><p>{student.adminNotes}</p></div>}<div className="profile-columns"><TableSection title="سجل الحضور" headers={["التاريخ","الحالة","الملاحظة"]} rows={profile.attendance.map((item) => [formatDate(item.date), attendanceLabels[item.status] || item.status, item.note || "—"])} /><TableSection title="متابعة القرآن" headers={["التاريخ","النوع","المتابعة","التقييم"]} rows={profile.quran.map((item) => [formatDate(item.date), followupLabels[item.type] || item.type, item.content || "—", performanceLabels[item.performance] || "—"])} /></div></section></div>;
}

function MonthlyReport({ report, overview, filters, setFilters, apply, approve }) {
  const totalPresent = report?.students.reduce((sum, item) => sum + Number(item.present || 0), 0) || 0;
  const totalAbsent = report?.students.reduce((sum, item) => sum + Number(item.absent || 0), 0) || 0;
  const averageRate = report?.students.length ? Math.round(report.students.reduce((sum, item) => sum + Number(item.rate || 0), 0) / report.students.length) : 0;
  return <div className="monthly-report"><section className="record-filters panel"><label>الشهر<input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} /></label><label>الحلقة<select value={filters.circleId} onChange={(e) => setFilters({ ...filters, circleId: e.target.value })}><option value="">كل الحلقات</option>{overview.circles.map((circle) => <option value={circle.id} key={circle.id}>{circle.name}</option>)}</select></label><label>المعلم<select value={filters.teacherId} onChange={(e) => setFilters({ ...filters, teacherId: e.target.value })}><option value="">كل المعلمين</option>{overview.teachers.filter((teacher) => teacher.active).map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.name}</option>)}</select></label><label>الطالب<input value={filters.student} onChange={(e) => setFilters({ ...filters, student: e.target.value })} placeholder="ابحث بالاسم" /></label><button className="button button-primary" onClick={apply}>تحديث الملخص</button></section>{!report ? <div className="empty-state panel">جارٍ إنشاء التقرير الشهري…</div> : <><section className="report-metrics"><article><CalendarBlank /><span>جلسات الشهر</span><strong>{report.sessions.length}</strong></article><article><Users /><span>الطلاب في التقرير</span><strong>{report.students.length}</strong></article><article><CheckCircle /><span>متوسط الحضور</span><strong>{averageRate}%</strong></article><article><ChartBar /><span>الحضور والغياب</span><strong>{totalPresent} / {totalAbsent}</strong><small>حاضر / غائب</small></article></section><section className="monthly-students panel"><div className="panel-title"><div><h2>ملخص الطلاب الشهري</h2><p>عرض سريع يناسب شاشة اللابتوب؛ افتح سجلات الطالب من قسم الطلاب للتفاصيل الكاملة.</p></div><span>{report.students.length} طالب</span></div><div className="monthly-student-head"><strong>الطالب والحلقة</strong><strong>تفصيل الحضور</strong><strong>النسبة</strong><strong>آخر متابعة قرآن</strong></div><div className="monthly-student-list">{report.students.map((item) => <article key={item.id}><span><strong>{item.full_name}</strong><small>{item.circle_name}</small></span><span className="attendance-mini"><b className="present">{item.present} حاضر</b><b className="absent">{item.absent} غائب</b><small>{item.late} متأخر · {item.excused} معتذر · {item.traveling} مسافر</small></span><span className="rate-ring" style={{ "--rate": `${item.rate}%` }}>{item.rate}%</span><span>{item.last_quran || "لا توجد متابعة في هذا الشهر"}</span></article>)}</div></section><section className="directory-panel panel session-report"><div className="panel-title"><div><h2>جلسات الشهر واعتمادها</h2><p>الاعتماد اختياري، ويثبت أن الإدارة راجعت سجل الجلسة.</p></div><span>{report.sessions.length} جلسة</span></div><div className="session-approval-list">{report.sessions.map((session) => <div key={session.id}><span><strong>{formatDate(session.session_date)}</strong><small>{session.circle_name} · {session.teacher_name || "غير مسند"}</small></span><span>{session.recorded} مسجل · {session.present} حاضر · {session.absent} غائب</span><button className={`button ${session.approved_at ? "approved" : ""}`} onClick={() => approve(session.id, !session.approved_at)}>{session.approved_at ? "معتمد ✓" : "اعتماد السجل"}</button></div>)}</div></section></>}</div>;
}

function TableSection({ title, headers, rows }) {
  return <section className="directory-panel panel" style={{ "--columns": headers.length }}><div className="panel-title"><h2>{title}</h2><span>{rows.length} سجل</span></div><div className="directory-table"><div className="directory-head">{headers.map((header) => <strong key={header}>{header}</strong>)}</div>{rows.map((row, index) => <div className="directory-row" key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <span key={`${cellIndex}-${cell}`}>{cell}</span>)}</div>)}</div></section>;
}

function RecordsSection({ kind, records, overview, filters, setFilters, apply }) {
  const isQuran = kind === "quran";
  return <><section className="record-filters panel"><label>التاريخ<input type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} /></label><label>الحلقة<select value={filters.circleId} onChange={(event) => setFilters({ ...filters, circleId: event.target.value })}><option value="">كل الحلقات</option>{overview.circles.map((circle) => <option value={circle.id} key={circle.id}>{circle.name}</option>)}</select></label><label>المعلم<select value={filters.teacherId} onChange={(event) => setFilters({ ...filters, teacherId: event.target.value })}><option value="">كل المعلمين</option>{overview.teachers.map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.name}</option>)}</select></label><label>الطالب<input value={filters.student} onChange={(event) => setFilters({ ...filters, student: event.target.value })} placeholder="ابحث بالاسم" /></label><button className="button button-primary" onClick={apply}>تطبيق الفلاتر</button></section><TableSection title={isQuran ? "سجلات متابعة القرآن" : "سجلات الحضور"} headers={isQuran ? ["التاريخ", "الطالب", "الحلقة", "النوع", "المسمّع", "التقييم", "ملاحظة"] : ["التاريخ", "الطالب", "الحلقة", "المعلم", "الحالة", "الملاحظة"]} rows={records.map((item) => isQuran ? [formatDate(item.date), item.studentName, item.circleName, followupLabels[item.type] || item.type, item.content || "—", performanceLabels[item.performance] || "—", item.note || "—"] : [formatDate(item.date), item.studentName, item.circleName, item.teacherName || "—", attendanceLabels[item.status] || item.status, item.note || "—"])} /></>;
}

function Loading({ message }) {
  return <main className="loading-page" dir="rtl"><div className="logo-lockup"><img src="/assets/ihyaa-logo-color.png" alt="مؤسسة إحياء" /><strong>مؤسسة إحياء</strong></div><span className="loading-dot" /><p>{message}</p></main>;
}
