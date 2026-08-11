import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, BookOpen, CalendarBlank, CaretDown, Check, CheckCircle, Clock,
  EnvelopeSimple, Eye, EyeSlash, Gear, Headphones, House, Lock, Phone, SignIn,
  SignOut, Sparkle, Student, Trash, User, UserCircle, Users, UsersThree, X,
} from "@phosphor-icons/react";
import { dataService } from "./data.js";
import { AdminWorkspace, TeacherWorkspace } from "./OperationalViews.jsx";

const statusOptions = [
  { id: "present", label: "حاضر", icon: Check },
  { id: "absent", label: "غائب", icon: X },
  { id: "late", label: "متأخر", icon: Clock },
];

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function LinkButton({ to, className = "", children, ...props }) {
  return <button type="button" className={className} onClick={() => navigate(to)} {...props}>{children}</button>;
}

function Logo({ light = false, compact = false }) {
  return <div className={`logo-lockup${light ? " light" : ""}${compact ? " compact" : ""}`}>
    <img src={light ? "/assets/ihyaa-logo.png" : "/assets/ihyaa-logo-color.png"} alt="شعار مؤسسة إحياء" />
    {!compact && <strong>مؤسسة إحياء</strong>}
  </div>;
}

function formatDate(value, options = {}) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    timeZone: "Europe/Istanbul",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: options.year ? "numeric" : undefined,
  }).format(new Date(`${value}T12:00:00+03:00`));
}

async function signOut() {
  try { await dataService.signOut(); } finally { navigate("/login"); }
}

function PublicHome() {
  return <div className="public-page" dir="rtl">
    <header className="public-nav">
      <Logo />
      <nav aria-label="التنقل الرئيسي"><a href="#about">عن المؤسسة</a><a href="#programs">برامجنا</a><a href="#contact">تواصل معنا</a></nav>
      <LinkButton to="/login" className="outline-action"><SignIn size={22} /> دخول المنصة</LinkButton>
    </header>
    <main>
      <section className="public-hero">
        <div className="hero-copy">
          <h1>نُحيي في الجيل<br />معنى القرآن</h1>
          <p>بناءٌ تربويٌّ متكامل، يَصِلُ العلمَ بالعمل، ويصنع أثرًا يمتد.</p>
          <div className="hero-actions"><LinkButton to="/login" className="primary-action">دخول المنصة <ArrowLeft size={21} /></LinkButton><a className="outline-action" href="#about">تعرّف إلى المؤسسة <ArrowLeft size={21} /></a></div>
          <p className="gold-line"><Sparkle size={17} /> جيلٌ على خُطى السابقين <Sparkle size={17} /></p>
        </div>
        <div className="hero-emblem" aria-hidden="true"><img src="/assets/ihyaa-logo-color.png" alt="" /></div>
      </section>
      <section className="care-section" id="about">
        <div className="section-heading"><span>منهجنا</span><h2>رعايةٌ تتجاوز الحلقة</h2></div>
        <div className="care-grid">
          <article><UsersThree size={42} /><h3>صحبة تربوية</h3><p>نرافق الطالب في رحلة تصنع منه رفيقًا للقرآن.</p></article>
          <article><BookOpen size={42} /><h3>بناء متكامل</h3><p>نربط العلم بالعمل، ونبني المهارة، ونغرس القيم.</p></article>
          <article><Sparkle size={42} /><h3>أثر ممتد</h3><p>نقيس الأثر لا العدد، ونؤمن بأن الخير إذا أُحسن صنعه امتد وأثمر.</p></article>
        </div>
      </section>
      <section className="programs-section" id="programs">
        <div className="section-heading"><span>برامجنا</span><h2>مسارٌ واضح لبناء الطالب</h2></div>
        <div className="program-list">
          <article><span>01</span><div><h3>الحلقات القرآنية</h3><p>حفظٌ وتلاوة ضمن بيئة تربوية يومية.</p></div></article>
          <article><span>02</span><div><h3>الرعاية التربوية</h3><p>متابعة للطالب وبناء لعاداته وقيمه.</p></div></article>
          <article><span>03</span><div><h3>التأهيل والتمكين</h3><p>إعداد جيل ينقل أثر القرآن إلى مجتمعه.</p></div></article>
        </div>
      </section>
    </main>
    <footer className="public-footer" id="contact"><Logo light /><p>للتواصل والاستفسار عن برامج المؤسسة</p><div><a href="mailto:info@ihyaa.org"><EnvelopeSimple /> info@ihyaa.org</a><a href="tel:+905000000000"><Phone /> +90 500 000 0000</a></div></footer>
  </div>;
}

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("teacher");
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!identity.trim() || !password) return setError("أدخل اسم المستخدم وكلمة المرور.");
    setState("loading"); setError("");
    try {
      const { user } = await dataService.signIn({ identity, password, role });
      navigate(user.mustChangePassword ? "/change-password" : user.role === "admin" ? "/admin" : "/teacher/attendance");
    } catch (requestError) {
      setError(requestError.message);
      setState("idle");
    }
  }

  return <main className="login-page" dir="rtl">
    <section className="login-brand-panel">
      <LinkButton to="/" className="login-home"><House size={21} /> الرئيسية</LinkButton><Logo light />
      <div className="login-brand-copy"><span>بيئةٌ رقمية للرعاية والبناء التربوي</span><h2>جيلٌ على خُطى السابقين</h2><blockquote>وَلِحَامِلِ الْقُرْآنِ شَرَفٌ فِي الْأُمَمِ،<br />وَبِهِ يُعْلَى مَقَامُ الْمَرْءِ وَيَرْتَقِي.</blockquote></div>
    </section>
    <section className="login-form-panel">
      <form className="login-card" onSubmit={submit}>
        <span className="welcome-mark"><Sparkle size={23} weight="fill" /></span><h1>أهلًا بعودتك</h1><p>ادخل إلى مساحة عمل مؤسسة إحياء.</p>
        <div className="role-switch" role="group" aria-label="نوع الحساب"><button type="button" className={role === "teacher" ? "active" : ""} onClick={() => setRole("teacher")}><User /> معلم</button><button type="button" className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}><Gear /> إدارة</button></div>
        <label>اسم المستخدم أو بيانات التواصل<span className="input-wrap"><EnvelopeSimple size={21} /><input value={identity} onChange={(e) => setIdentity(e.target.value)} placeholder="اسم المستخدم" autoComplete="username" /></span></label>
        <label>كلمة المرور<span className="input-wrap"><Lock size={21} /><input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="أدخل كلمة المرور" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>{showPassword ? <EyeSlash /> : <Eye />}</button></span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="login-submit" disabled={state === "loading"}>{state === "loading" ? "جارٍ الدخول..." : "دخول المنصة"}<SignIn size={23} /></button>
        <div className="help-line"><Headphones size={20} /><span>تحتاج مساعدة؟ تواصل مع الإدارة</span></div>
      </form>
    </section>
  </main>;
}

function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (newPassword.length < 10) return setError("استخدم كلمة مرور لا تقل عن 10 أحرف.");
    if (newPassword !== confirm) return setError("تأكيد كلمة المرور غير مطابق.");
    setLoading(true); setError("");
    try {
      await dataService.changePassword({ currentPassword, newPassword });
      const { user } = await dataService.me();
      navigate(user.role === "admin" ? "/admin" : "/teacher/attendance");
    } catch (requestError) { setError(requestError.message); setLoading(false); }
  }
  return <main className="password-page" dir="rtl"><form className="login-card" onSubmit={submit}><Logo /><span className="welcome-mark"><Lock size={23} /></span><h1>أنشئ كلمة مرورك</h1><p>هذه خطوة إلزامية عند أول دخول لحماية حسابك.</p><label>كلمة المرور المؤقتة<span className="input-wrap"><Lock /><input type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></span></label><label>كلمة المرور الجديدة<span className="input-wrap"><Lock /><input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></span></label><label>تأكيد كلمة المرور<span className="input-wrap"><Lock /><input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></span></label>{error && <p className="form-error">{error}</p>}<button className="login-submit" disabled={loading}>{loading ? "جارٍ الحفظ..." : "حفظ ومتابعة"}<ArrowLeft /></button></form></main>;
}

function StudentAttendance({ index, student, status, disabled, onChange }) {
  return <article className="student-card"><div className="student-heading"><span className="student-index">{index + 1}</span><h2>{student.name}</h2></div><div className="status-group" role="group" aria-label={`تسجيل حضور ${student.name}`}>{statusOptions.map(({ id, label, icon: Icon }) => <button key={id} type="button" disabled={disabled} className={`status-button status-${id}${status === id ? " is-selected" : ""}`} aria-pressed={status === id} onClick={() => onChange(student.id, id)}>{status === id && <Icon size={19} weight="bold" />}<span>{label}</span></button>)}</div></article>;
}

function TeacherAttendance() {
  const [page, setPage] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [saveState, setSaveState] = useState("saved");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    dataService.teacherAttendance().then((payload) => {
      setPage(payload);
      setAttendance(Object.fromEntries(payload.students.filter((student) => student.status).map((student) => [student.id, student.status])));
    }).catch((error) => error.status === 401 ? navigate("/login") : setNotice(error.message));
  }, []);

  useEffect(() => {
    if (!dirty || !page?.canEdit) return;
    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      try {
        await dataService.saveAttendance(page.date, Object.entries(attendance).map(([studentId, status]) => ({ studentId, status })));
        setSaveState("saved"); setDirty(false);
      } catch (error) { setSaveState("error"); setNotice(error.message); }
    }, 550);
    return () => clearTimeout(timer);
  }, [attendance, dirty, page]);

  if (!page) return <LoadingScreen message={notice || "جارٍ تحميل الحلقة..."} />;
  const markedCount = Object.keys(attendance).length;
  const progress = Math.round((markedCount / Math.max(page.students.length, 1)) * 100);
  const counts = Object.values(attendance).reduce((acc, status) => ({ ...acc, [status]: acc[status] + 1 }), { present: 0, absent: 0, late: 0 });
  const update = (id, status) => { setAttendance((value) => ({ ...value, [id]: status })); setDirty(true); setNotice(""); };
  const markAll = () => { setAttendance(Object.fromEntries(page.students.map((student) => [student.id, "present"]))); setDirty(true); setNotice("تم تعيين جميع الطلاب حاضرين. عدّل الاستثناءات الآن."); };
  const clear = () => { setAttendance({}); setDirty(true); setNotice("تم مسح الاختيارات."); };
  const finish = () => markedCount < page.students.length ? setNotice(`بقي ${page.students.length - markedCount} طالب دون تسجيل.`) : setShowSummary(true);

  return <div className="teacher-shell" dir="rtl">
    <header className="teacher-header"><div className="teacher-brand"><Logo light compact /><div><small>مؤسسة إحياء</small><h1>{page.circle.name}</h1><p><CalendarBlank size={19} /> {formatDate(page.date)}</p></div></div><blockquote>وَلِحَامِلِ الْقُرْآنِ <strong>شَرَفٌ</strong> فِي الْأُمَمِ،<br />وَبِهِ <strong>يُعْلَى</strong> مَقَامُ الْمَرْءِ وَيَرْتَقِي.</blockquote><button type="button" className="header-back" onClick={signOut}>الخروج <SignOut size={22} /></button></header>
    <main className="attendance-page">
      {!page.canEdit && <div className="notice">يمكنك مراجعة الطلاب الآن، وسيُفتح إدخال الحضور تلقائياً في {formatDate(page.nextSessionDate)}. الدوام يومي السبت والأحد فقط.</div>}
      <section className="attendance-toolbar"><div className="progress-block"><div className="progress-copy"><p>سُجّل حضور <strong>{markedCount}</strong> من <strong>{page.students.length}</strong> طالبًا</p><span>{progress}%</span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div><div className="bulk-actions"><button disabled={!page.canEdit} className="button button-outline" onClick={markAll}><UsersThree size={23} /> تعيين الجميع حاضرًا</button><button disabled={!page.canEdit} className="button button-quiet" onClick={clear}><Trash size={20} /> مسح الاختيارات</button></div></section>
      {notice && <div className="notice" role="status">{notice}</div>}
      <section className="students-grid">{page.students.map((student, index) => <StudentAttendance key={student.id} index={index} student={student} status={attendance[student.id]} disabled={!page.canEdit} onChange={update} />)}</section>
    </main>
    <footer className="teacher-footer"><div className={`save-indicator ${saveState}`}><CheckCircle size={23} weight="fill" />{saveState === "saving" ? "جارٍ الحفظ..." : saveState === "error" ? "تعذر الحفظ" : "يُحفظ الحضور تلقائيًا"}</div><button disabled={!page.canEdit} className="button button-primary" onClick={finish}>إنهاء التسجيل <ArrowLeft size={22} /></button></footer>
    {showSummary && <div className="modal-backdrop" onMouseDown={() => setShowSummary(false)}><section className="summary-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><CheckCircle className="success-icon" size={43} weight="fill" /><h2>اكتمل تسجيل الحضور</h2><p>حُفظ سجل {page.circle.name} تلقائيًا.</p><div className="summary-counts"><span className="summary-present">{counts.present} حاضر</span><span className="summary-absent">{counts.absent} غائب</span><span className="summary-late">{counts.late} متأخر</span></div><button className="button button-primary modal-action" onClick={() => setShowSummary(false)}>العودة إلى الحلقة</button></section></div>}
  </div>;
}

const adminNav = [["اليوم", House], ["الحلقات", BookOpen], ["الطلاب", Users], ["المعلمون", UserCircle]];

function AdminDashboard() {
  const [active, setActive] = useState("اليوم");
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { dataService.adminOverview().then(setOverview).catch((requestError) => requestError.status === 401 ? navigate("/login") : setError(requestError.message)); }, []);
  if (!overview) return <LoadingScreen message={error || "جارٍ تحميل بيانات المؤسسة..."} />;
  const incomplete = overview.circles.filter((circle) => circle.status !== "complete").length;
  return <div className="admin-shell" dir="rtl">
    <aside className="admin-sidebar"><Logo light /><nav>{adminNav.map(([label, Icon], index) => <button key={label} className={active === label ? "active" : ""} onClick={() => setActive(label)}><Icon size={24} />{label}{index === 0 && <span />}</button>)}</nav><button type="button" className="admin-logout" onClick={signOut}><SignOut size={21} /> تسجيل الخروج</button></aside>
    <main className="admin-main">
      <header className="admin-top"><div><h1>{active === "اليوم" ? "حال المؤسسة" : active}</h1><p><CalendarBlank size={19} /> آخر يوم حلقات: {formatDate(overview.referenceDate, { year: true })}</p></div><div className="admin-profile"><span><UserCircle size={36} /> إدارة مؤسسة إحياء <CaretDown size={17} /></span></div></header>
      {active === "اليوم" && <AdminToday overview={overview} incomplete={incomplete} />}
      {active === "الحلقات" && <CirclesView circles={overview.circles} referenceDate={overview.referenceDate} />}
      {active === "الطلاب" && <DirectoryView title="سجلات الطلاب" count={overview.students.length} headers={["الطالب", "الحلقة", "المعلم"]} rows={overview.students.map((item) => [item.name, item.circleName, item.teacherName || "غير مسند"])} />}
      {active === "المعلمون" && <DirectoryView title="حسابات المعلمين" count={overview.teachers.length} headers={["المعلم", "اسم المستخدم", "الحلقة", "عدد الطلاب"]} rows={overview.teachers.map((item) => [item.name, item.username, item.circleName || "غير مسند", item.studentCount])} />}
    </main>
  </div>;
}

function AdminToday({ overview, incomplete }) {
  const rate = overview.totals.recorded ? Math.round((overview.totals.present / overview.totals.recorded) * 100) : 0;
  return <>
    <section className="admin-metrics"><article><Users size={25} /><span>الطلاب</span><strong>{overview.stats.students}</strong></article><article><BookOpen size={25} /><span>الحلقات</span><strong>{overview.stats.circles}</strong></article><article><UserCircle size={25} /><span>المعلمون</span><strong>{overview.stats.teachers}</strong></article><article><CheckCircle size={25} /><span>نسبة الحضور المسجّل</span><strong>{rate}%</strong></article></section>
    <section className="daily-brief"><h2>{overview.watchlist.length ? `هناك ${overview.watchlist.length} حالات تستحق المتابعة.` : "لا توجد حالات متكررة تستحق المتابعة."}</h2><p>الأرقام أدناه مأخوذة مباشرة من السجل التاريخي حتى {formatDate(overview.referenceDate)}.</p><span /></section>
    <section className="admin-grid">
      <article className="priority-card panel"><h2>أولوية المتابعة</h2><div className="priority-row red"><BookOpen /><p>{incomplete} حلقات لم يكتمل فيها تسجيل جميع الطلاب في آخر يوم.</p></div><div className="priority-row amber"><User /><p>{overview.watchlist.length} طلاب تكرر غيابهم مرتين أو أكثر خلال آخر أربع جلسات.</p></div><div className="priority-row blue"><Users /><p>حلقة واحدة غير مسندة إلى معلم: حلقة برستيج.</p></div></article>
      <article className="timeline-card panel"><h2>ملخص آخر يوم</h2><div><strong>{overview.totals.present}</strong><span /><p>حاضر</p></div><div><strong>{overview.totals.absent}</strong><span /><p>غائب</p></div><div><strong>{overview.totals.late}</strong><span /><p>متأخر</p></div><div><strong>{overview.totals.recorded}</strong><span /><p>إجمالي السجلات</p></div></article>
    </section>
    <CirclesView circles={overview.circles} referenceDate={overview.referenceDate} embedded />
    {overview.watchlist.length > 0 && <section className="panel watchlist-panel"><h2>حالات الغياب المتكرر</h2><div className="watchlist-grid">{overview.watchlist.map((student) => <article key={student.id}><Student size={24} /><div><strong>{student.name}</strong><small>{student.circleName}</small></div><span>{student.absenceCount} غيابات</span></article>)}</div></section>}
  </>;
}

function CirclesView({ circles, referenceDate, embedded = false }) {
  return <section className={`${embedded ? "circles-panel" : "directory-panel"} panel`}><div className="panel-title"><div><h2>{embedded ? "الحلقات في آخر يوم" : "الحلقات"}</h2>{!embedded && <p>حالة التسجيل بتاريخ {formatDate(referenceDate)}</p>}</div><span>{circles.length} حلقات</span></div>{circles.map((circle) => <div className="circle-live-row" key={circle.id}><span className={`circle-icon ${circle.status}`}><BookOpen /></span><span className="circle-copy"><strong>{circle.name}</strong><small>{circle.teacherName || "لم يُسند معلم بعد"} · {circle.studentCount} طالب</small></span><span className={`circle-status ${circle.status}`}>{circle.status === "complete" ? "مكتمل" : circle.status === "partial" ? `${circle.recordedCount} من ${circle.studentCount}` : "لم يُسجّل"}</span><span className="circle-numbers">{circle.present} حاضر · {circle.absent} غائب · {circle.late} متأخر</span></div>)}</section>;
}

function DirectoryView({ title, count, headers, rows }) {
  return <section className="directory-panel panel" style={{ "--columns": headers.length }}><div className="panel-title"><h2>{title}</h2><span>{count} سجل</span></div><div className="directory-table" role="table"><div className="directory-head" role="row">{headers.map((header) => <strong key={header} role="columnheader">{header}</strong>)}</div>{rows.map((row, index) => <div className="directory-row" role="row" key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <span role="cell" key={`${cell}-${cellIndex}`}>{cell}</span>)}</div>)}</div></section>;
}

function LoadingScreen({ message }) {
  return <main className="loading-page" dir="rtl"><Logo /><span className="loading-dot" /><p>{message}</p></main>;
}

function NotFound() { return <main className="not-found" dir="rtl"><Logo /><h1>هذه الصفحة غير موجودة</h1><LinkButton to="/" className="primary-action">العودة للرئيسية <ArrowLeft /></LinkButton></main>; }

export function App() {
  const [path, setPath] = useState(window.location.pathname.replace(/\/$/, "") || "/");
  useEffect(() => { const onPop = () => setPath(window.location.pathname.replace(/\/$/, "") || "/"); window.addEventListener("popstate", onPop); return () => window.removeEventListener("popstate", onPop); }, []);
  if (path === "/") return <PublicHome />;
  if (path === "/login") return <LoginPage />;
  if (path === "/change-password") return <ChangePasswordPage />;
  if (path === "/teacher/attendance") return <TeacherWorkspace />;
  if (path === "/admin") return <AdminWorkspace />;
  return <NotFound />;
}
