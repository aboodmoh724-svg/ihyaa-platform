import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, BookOpen, CalendarBlank, Check, CheckCircle, Clock,
  EnvelopeSimple, Eye, EyeSlash, Gear, Headphones, House, Lock, Phone, SignIn,
  SignOut, Sparkle, User, UserCircle, UsersThree, X,
} from "@phosphor-icons/react";
import { dataService } from "./data.js";
import { AdminWorkspace, TeacherWorkspace } from "./OperationalViews.jsx";



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
