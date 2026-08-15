import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, BookOpen, Books, CalendarBlank, Check, CheckCircle, Clock,
  Compass, EnvelopeSimple, Eye, EyeSlash, Gear, Headphones, Heart, House, Lock, Phone, SignIn,
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
      <nav aria-label="التنقل الرئيسي">
        <a href="#about">عن المؤسسة</a>
        <a href="#departments">أقسامنا</a>
        <a href="#maelem">مخيم معالم</a>
        <a href="#contact">تواصل معنا</a>
      </nav>
      <LinkButton to="/login" className="outline-action"><SignIn size={22} /> دخول المنصة</LinkButton>
    </header>
    <main>
      <section className="public-hero">
        <div className="hero-copy">
          <span className="section-kicker">مؤسسة إحياء</span>
          <h1>إحياء معالم الدين<br />في نفوس الجيل</h1>
          <p>نهدف إلى إحياء معالم الدين من جديد في نفوس شرائح المجتمع المسلم، منطلقين من هدايات الوحي وأنوار السنّة، لسد الاحتياج وضبط البوصلة فكراً وجهداً.</p>
          <div className="hero-actions">
            <LinkButton to="/login" className="primary-action">دخول المنصة <ArrowLeft size={21} /></LinkButton>
            <a className="outline-action" href="#departments">استكشف أقسامنا <ArrowLeft size={21} /></a>
          </div>
          <p className="gold-line"><Sparkle size={17} /> جيلٌ على خُطى السابقين <Sparkle size={17} /></p>
        </div>
        <div className="hero-emblem" aria-hidden="true"><img src="/assets/ihyaa-logo-color.png" alt="شعار مؤسسة إحياء" /></div>
      </section>
      <section className="care-section" id="about">
        <div className="section-heading">
          <span>عن المؤسسة ورسالتها</span>
          <h2>رعايةٌ وبناء، يَصِلُ العلمَ بالعمل</h2>
          <p className="section-lead">انطلاقاً من الشعور بالمسؤولية تجاه واقع الأمة وضياع البوصلة وتشتت الجهود، جاءت مؤسسة إحياء لتكثيف الجهود التربوية والمشاريع الهادفة، ولسد هذا الاحتياج وضبط البوصلة فكراً وجهداً، لتنشئة جيلٍ قرآنيٍّ راسخ يعتز بدينه وينفع مجتمعه.</p>
        </div>
        <div className="care-grid">
          <article>
            <BookOpen size={42} />
            <h3>الارتباط بالوحي والسنّة</h3>
            <p>ربط الشباب بالقرآن والعمل به، وبالسنة المطهرة كمرجع ثانٍ، ومنطلقاً للهداية والنور.</p>
          </article>
          <article>
            <UsersThree size={42} />
            <h3>التربية بالمعايشة</h3>
            <p>صحبة تربوية مرافقة من خلال الليالي الإيمانية والمخيمات والمتابعة المستمرة لصناعة رفيق للقرآن.</p>
          </article>
          <article>
            <Sparkle size={42} />
            <h3>التحصين والتمكين</h3>
            <p>تحصين الشباب من الشهوات والشبهات، والعمل على التطوير المهاري لاكتشاف نقاط التميز.</p>
          </article>
        </div>
      </section>
      <section className="programs-section" id="departments">
        <div className="section-heading">
          <span>أقسام المؤسسة</span>
          <h2>مسارات تربوية وعلمية متخصصة</h2>
          <p className="section-lead">نعمل من خلال أربعة مسارات متكاملة لرعاية الفرد والأسرة والمجتمع في مختلف المراحل العمرية وفق منهج نبوي أصيل.</p>
        </div>
        <div className="departments-grid">
          <article className="dept-card">
            <div className="dept-header">
              <span className="dept-badge">13 – 17 عاماً</span>
              <UsersThree size={36} className="dept-icon" />
            </div>
            <h3>قسم الفتية</h3>
            <p>بناء الفتى بناءً رصيناً خالياً من أدران البيئة المحيطة، وتعزيز صلته بالله والقرآن، واكتشاف مواهبه وقدراته بأحدث الطرق التربوية.</p>
            <div className="dept-tags">
              <span>المحور الإيماني</span>
              <span>السلوكي والنفسي</span>
              <span>التطوير المهاري</span>
              <span>المعرفة الأصيلة</span>
            </div>
          </article>

          <article className="dept-card">
            <div className="dept-header">
              <span className="dept-badge">8 – 12 عاماً</span>
              <Compass size={36} className="dept-icon" />
            </div>
            <h3>قسم الطليعة</h3>
            <p>تأسيس إيماني ووجداني مبكر يكون درعاً واقياً أمام تحديات الواقع، وتنشئة البراعم على مائدة القرآن في بيئة منضبطة وصحبة صالحة.</p>
            <div className="dept-tags">
              <span>مائدة القرآن وتدبره</span>
              <span>قيم الاستقامة</span>
              <span>بناء العادات</span>
              <span>الصحبة المعينة</span>
            </div>
          </article>

          <article className="dept-card">
            <div className="dept-header">
              <span className="dept-badge">13 – 17 عاماً</span>
              <Heart size={36} className="dept-icon" />
            </div>
            <h3>قسم الفتيات</h3>
            <p>بناء شخصية الفتاة بناءً شاملاً ومتزناً، وإعداد الفتاة المسلمة لأداء أدوارها الإيمانية والأسرية والمجتمعية عبر أحدث الممارسات التربوية.</p>
            <div className="dept-tags">
              <span>البناء الإيماني والوجداني</span>
              <span>المجال الأسري والمجتمعي</span>
              <span>إدارة الذات</span>
              <span>الليالي والمخيمات</span>
            </div>
          </article>

          <article className="dept-card">
            <div className="dept-header">
              <span className="dept-badge highlight">عام للرجال والنساء</span>
              <Books size={36} className="dept-icon" />
            </div>
            <h3>قسم المجالس العلمية</h3>
            <p>إعادة المجتمع المسلم في بلاد المهجر إلى مركزية العلم والعلماء والتفقه في الدين، عبر مجالس علمية أسبوعية لنخبة من المشايخ الفضلاء.</p>
            <div className="dept-tags">
              <span>تفسير وتدارس القرآن</span>
              <span>شرح مدارج السالكين</span>
              <span>السيرة النبوية</span>
              <span>أنوار الصحابة</span>
            </div>
          </article>
        </div>
      </section>

      <section className="maelem-section" id="maelem">
        <div className="section-heading">
          <span>مشاريع إحياء الرائدة</span>
          <h2>مخيم مَعَالِم (1)</h2>
          <p className="section-lead">«لسنا هنا لنكثر العابرين... بل لنخرج معالم على الطريق» — بيئة تربوية مكثفة تصنع من الفتى نموذجاً للثبات والاستقامة تحت ظلال الوحي.</p>
        </div>

        <div className="maelem-card-featured">
          <div className="maelem-highlights">
            <div className="maelem-badge-box">
              <span className="m-tag">القيمة المركزية</span>
              <strong>الإِسْتِقَامَة</strong>
              <small>﴿فَاسْتَقِمْ كَمَا أُمِرْتَ﴾</small>
            </div>
            <div className="maelem-badge-box">
              <span className="m-tag">السور المركزية</span>
              <strong>سورة الأنبياء والعنكبوت</strong>
              <small>تدبراً ومنهاج عمل وسنن الثبات</small>
            </div>
            <div className="maelem-badge-box">
              <span className="m-tag">الشريحة المستهدفة</span>
              <strong>الفتيان (13 – 17 عاماً)</strong>
              <small>الانتقال من التوجيه الخارجي إلى الرقابة الداخلية</small>
            </div>
            <div className="maelem-badge-box">
              <span className="m-tag">مدة المخيم</span>
              <strong>20 يوماً متواصلة</strong>
              <small>معايشة وتربية يومية متكاملة</small>
            </div>
          </div>

          <div className="maelem-body">
            <div className="maelem-pillars-wrap">
              <h3>مرتكزات المنهج التربوي الخمسة</h3>
              <div className="maelem-pillars-grid">
                <div className="pillar-item">
                  <span className="p-num">01</span>
                  <div>
                    <h4>القرآن الكريم</h4>
                    <p>تدبراً، وحفظاً، وفهماً، وتثبيتاً ضمن صحبة يومية منضبطة.</p>
                  </div>
                </div>
                <div className="pillar-item">
                  <span className="p-num">02</span>
                  <div>
                    <h4>الصحبة الصالحة</h4>
                    <p>بيئة إيمانية حاضنة وأخوة تعين على الحق وتدفع نحو المعالي.</p>
                  </div>
                </div>
                <div className="pillar-item">
                  <span className="p-num">03</span>
                  <div>
                    <h4>المجاهدة والعمل</h4>
                    <p>تكاليف يومية ومسؤوليات مستمرة لبناء الصبر وطول النفس.</p>
                  </div>
                </div>
                <div className="pillar-item">
                  <span className="p-num">04</span>
                  <div>
                    <h4>المحاسبة الصادقة</h4>
                    <p>دفتر محاسبة ومراجعة مستمرة للنفس وضبط للعادات والوقت.</p>
                  </div>
                </div>
                <div className="pillar-item">
                  <span className="p-num">05</span>
                  <div>
                    <h4>التطبيق العملي</h4>
                    <p>تحويل المعاني إلى واقع ملموس ومشاريع كسب حلال وعمل مجتمعي.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="maelem-focus-areas">
              <h3>أبرز محاور المخيم</h3>
              <ul className="focus-list">
                <li><span>✦</span> <strong>المحور الإيماني والقرآني:</strong> تعميق الصلة بالله واللجوء إليه وقيام الليل.</li>
                <li><span>✦</span> <strong>محور الفتن والشهوات:</strong> رفع الوعي بفتنة الهاتف، النظر، والخلوات والإدمان الرقمي.</li>
                <li><span>✦</span> <strong>المحور الفكري وصناعة اليقين:</strong> التثبت، التفكير الناقد، وكيفية التعامل مع الشبهات.</li>
                <li><span>✦</span> <strong>محور الانتكاسة والنهوض:</strong> فن العودة بعد التعثر، التوبة العملية، ومقاومة اليأس.</li>
                <li><span>✦</span> <strong>محور العمل الحر والكسب:</strong> بناء شخصية منتجة، احترام الكسب الحلال ومهارات البيع والمبادرة.</li>
                <li><span>✦</span> <strong>محور القدوات والرجال:</strong> دراسة سير الأنبياء والنماذج العملية للثبات على المبدأ.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
    <footer className="public-footer" id="contact">
      <Logo light />
      <p>للتواصل والاستفسار عن برامج ومشاريع المؤسسة</p>
      <div>
        <a href="mailto:ihyaa338@gmail.com"><EnvelopeSimple /> ihyaa338@gmail.com</a>
        <a href="tel:+905375862201"><Phone /> +90 537 586 2201</a>
      </div>
    </footer>
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
