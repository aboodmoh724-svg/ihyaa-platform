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
        <a href="#departments">أقسام المؤسسة</a>
        <a href="#projects">المشاريع والبرامج</a>
        <a href="#methodology">المنهج التربوي</a>
        <a href="#contact">التواصل</a>
      </nav>
      <LinkButton to="/login" className="outline-action"><SignIn size={22} /> دخول المنصة</LinkButton>
    </header>

    <main>
      {/* 1. Institutional Hero Section */}
      <section className="public-hero">
        <div className="hero-copy">
          <span className="section-kicker">مؤسسة إحياء</span>
          <h1>إحياء معالم الدين<br />في نفوس الجيل</h1>
          <p>نهدف إلى إحياء معالم الدين من جديد في نفوس شرائح المجتمع المسلم، منطلقين من هدايات الوحي وأنوار السنّة، لسد الاحتياج وضبط البوصلة فكراً وجهداً.</p>
          <div className="hero-actions">
            <LinkButton to="/login" className="primary-action">دخول المنصة <ArrowLeft size={21} /></LinkButton>
            <a className="outline-action" href="#about">عن المؤسسة ورسالتها <ArrowLeft size={21} /></a>
          </div>
          <div className="hero-badges">
            <span className="gold-tag"><Sparkle size={16} weight="fill" /> جيلٌ على خُطى السابقين</span>
            <span className="sub-tag">الارتباط بالوحي • التربية بالمعايشة • التحصين والتمكين</span>
          </div>
        </div>
        <div className="hero-emblem" aria-hidden="true">
          <div className="emblem-backdrop"></div>
          <img src="/assets/ihyaa-logo-color.png" alt="شعار مؤسسة إحياء" />
        </div>
      </section>

      {/* 2. About & Mission */}
      <section className="care-section" id="about">
        <div className="section-heading">
          <span>الرسالة والأهداف</span>
          <h2>عن المؤسسة ورسالتها</h2>
          <p className="section-lead">انطلاقاً من الشعور بالمسؤولية تجاه واقع الأمة وضياع البوصلة وتشتت الجهود، جاءت مؤسسة إحياء لتكثيف الجهود التربوية والمشاريع الهادفة، ولسد هذا الاحتياج وضبط البوصلة فكراً وجهداً، لتنشئة جيلٍ قرآنيٍّ راسخ يعتز بدينه وينفع مجتمعه.</p>
        </div>
        <div className="care-grid">
          <article className="care-card">
            <div className="care-icon-wrap"><BookOpen size={36} /></div>
            <h3>الارتباط بالوحي والسنّة</h3>
            <p>ربط الشباب بالقرآن الكريم والعمل به، وبالسنة المطهرة كمرجع ثانٍ، ومنطلقاً للهداية والنور والاستقامة في كل مناحي الحياة.</p>
          </article>
          <article className="care-card">
            <div className="care-icon-wrap"><UsersThree size={36} /></div>
            <h3>التربية بالمعايشة</h3>
            <p>صحبة تربوية مرافقة من خلال الليالي الإيمانية والمخيمات والمتابعة الميدانية المستمرة لصناعة رفيق صادق للقرآن.</p>
          </article>
          <article className="care-card">
            <div className="care-icon-wrap"><ShieldCheck size={36} /></div>
            <h3>التحصين والتمكين</h3>
            <p>تحصين الشباب من فتن الشهوات والشبهات، والعمل على التطوير المهاري لاكتشاف نقاط التميز وتوجيه الطاقات نحو البناء.</p>
          </article>
        </div>
      </section>

      {/* 3. Institutional Departments (4 Pillars) */}
      <section className="programs-section" id="departments">
        <div className="section-heading">
          <span>الهيكل التربوي</span>
          <h2>أقسام المؤسسة التخصصية</h2>
          <p className="section-lead">تعمل المؤسسة عبر أربعة أقسام متكاملة تغطي مختلف المراحل العمرية واحتياجات الأسرة والمجتمع وفق معايير تربوية رصينة.</p>
        </div>

        <div className="departments-grid">
          {/* Department 1: Boys */}
          <article className="dept-card">
            <div className="dept-header">
              <span className="dept-badge">13 – 17 عاماً</span>
              <UsersThree size={36} className="dept-icon" />
            </div>
            <h3>قسم الفتية</h3>
            <p>بناء الفتى بناءً رصيناً خالياً من أدران البيئة المحيطة، وتعزيز صلته بالله والقرآن، والانتقال به من التوجيه الخارجي إلى الرقابة الذاتية، واكتشاف مواهبه وقدراته وتنميتها بأحدث الوسائل الحديثة.</p>
            <div className="dept-tags">
              <span>المحور الإيماني وتزكية النفس</span>
              <span>المحور السلوكي والنفسي</span>
              <span>المحور المهاري واكتشاف التميز</span>
              <span>المحور المعرفي الأصيل</span>
            </div>
          </article>

          {/* Department 2: Early Stage */}
          <article className="dept-card">
            <div className="dept-header">
              <span className="dept-badge">8 – 12 عاماً</span>
              <Compass size={36} className="dept-icon" />
            </div>
            <h3>قسم الطليعة</h3>
            <p>تأسيس طليعة هذا القسم تأسيساً إيمانياً ووجدانياً يكون لهم الدرع الواقي أمام تحديات الواقع، واحتضانهم في بيئة منضبطة تكون حاجزاً بينهم وبين الفتن المعاصرة، وتنشئتهم على مائدة القرآن حفظاً وتدبراً.</p>
            <div className="dept-tags">
              <span>تنشئة على مائدة القرآن</span>
              <span>غرس قيم الاستقامة</span>
              <span>غرس حب الإسلام</span>
              <span>الإحاطة بالصحبة الصالحة</span>
            </div>
          </article>

          {/* Department 3: Girls */}
          <article className="dept-card">
            <div className="dept-header">
              <span className="dept-badge">13 – 17 عاماً</span>
              <Heart size={36} className="dept-icon" />
            </div>
            <h3>قسم الفتيات</h3>
            <p>بناء شخصية الفتاة بناءً شاملاً ومتكاملاً ومتزناً، وإعداد الفتاة المسلمة للقيام بأدوارها الإيمانية والأسرية والمجتمعية في الحياة، من خلال أحدث الاتجاهات والممارسات التربوية الحاضنة.</p>
            <div className="dept-tags">
              <span>البناء الإيماني والعاطفي</span>
              <span>المجال الأسري والاجتماعي</span>
              <span>إدارة الذات وبناء الوعي</span>
              <span>المخيمات والليالي الإيمانية</span>
            </div>
          </article>

          {/* Department 4: Scholarly Assemblies */}
          <article className="dept-card">
            <div className="dept-header">
              <span className="dept-badge highlight">عام للرجال والنساء</span>
              <Books size={36} className="dept-icon" />
            </div>
            <h3>قسم المجالس العلمية</h3>
            <p>إعادة المجتمع المسلم في بلاد المهجر إلى مركزية العلم والعلماء، والتفقه في الدين من مصادره النقية، عبر مجالس علمية أسبوعية منتظمة لنخبة من المشايخ الفضلاء، وهي مفتوحة لعموم المجتمع دون تقيد عمري.</p>
            <div className="dept-tags">
              <span>تفسير وتدارس سور القرآن</span>
              <span>شرح كتاب مدارج السالكين</span>
              <span>مجالس السيرة النبوية</span>
              <span>مجالس أنوار الصحابة</span>
            </div>
          </article>
        </div>
      </section>

      {/* 4. Projects & Educational Programs */}
      <section className="projects-section" id="projects">
        <div className="section-heading">
          <span>العمل الميداني والمشاريع</span>
          <h2>المشاريع والبرامج التربوية</h2>
          <p className="section-lead">تترجم المؤسسة أهداف أقسامها إلى باقة متكاملة من المشاريع الميدانية والمخيمات المعايشة والبرامج العلمية المستمرة.</p>
        </div>

        <div className="projects-container">
          {/* Featured Project: Ma'alem Camp */}
          <article className="project-feature-card">
            <div className="project-feature-header">
              <div className="pf-badge-group">
                <span className="project-pill highlight">مشروع رائد</span>
                <span className="project-pill">مخيمات المعايشة المكثفة</span>
                <span className="project-pill">الفتيان 13 – 17 عاماً</span>
              </div>
              <h3>مخيم مَعَالِم (1) التربوي</h3>
              <p className="pf-quote">«لسنا هنا لنكثر العابرين... بل لنخرج معالم على الطريق»</p>
            </div>

            <div className="project-feature-body">
              <div className="pf-overview">
                <p>مشروع معايشة تربوية مكثفة يمتد على مدار <strong>20 يوماً متواصلة</strong>، يهدف إلى معالجة أزمة الثبات والانتقال بالفتى من التوجيه الخارجي إلى الرقابة الذاتية عبر منظومة متكاملة من المحاور الإيمانية والقرآنية والفكرية والسلوكية والمهارية.</p>
                
                <div className="pf-key-points">
                  <div className="k-box">
                    <small>القيمة المركزية</small>
                    <strong>الإِسْتِقَامَة</strong>
                    <span>﴿فَاسْتَقِمْ كَمَا أُمِرْتَ﴾</span>
                  </div>
                  <div className="k-box">
                    <small>السور المركزية</small>
                    <strong>الأنبياء & العنكبوت</strong>
                    <span>تدبراً وسنن ثبات ومنهاج حياة</span>
                  </div>
                  <div className="k-box">
                    <small>الإتقان القرآني</small>
                    <strong>مراجعة 10 أجزاء</strong>
                    <span>تسميع فردي وجماعي منضبط</span>
                  </div>
                  <div className="k-box">
                    <small>محاور البناء</small>
                    <strong>11 محوراً استراتيجياً</strong>
                    <span>إيماني، فكري، عمل حر، وسلوكي</span>
                  </div>
                </div>
              </div>

              <div className="pf-axes-summary">
                <h4>محاور المعايشة في مخيم معالم:</h4>
                <div className="pf-tags-grid">
                  <span>المحور الإيماني والخلوات</span>
                  <span>تدبر السنن القرآنية</span>
                  <span>كشف فتن الشبهات والشهوات</span>
                  <span>صناعة اليقين والتفكير الناقد</span>
                  <span>الانضباط ومقاومة التسويف</span>
                  <span>فن النهوض بعد التعثر</span>
                  <span>العمل الحر والكسب الحلال</span>
                  <span>صناعة الأخوة والعمل الجماعي</span>
                  <span>دراسة سير الأنبياء والقدوات</span>
                </div>
              </div>
            </div>
          </article>

          {/* Other Institutional Projects Grid */}
          <div className="projects-grid">
            <article className="project-card">
              <div className="project-card-header">
                <span className="p-type">مخيمات ومعايشة</span>
                <h3>المخيمات الموسمية والتربوية</h3>
              </div>
              <p>مخيمات دورية تجمع بين التربية الإيمانية، النشاط البدني، وبناء مهارات العمل الجماعي وتحمل المسؤولية في بيئة منضبطة وآمنة.</p>
              <ul className="project-features">
                <li><CheckCircle size={17} weight="fill" /> معايشة ميدانية متكاملة</li>
                <li><CheckCircle size={17} weight="fill" /> دورات مهارية وتربوية</li>
                <li><CheckCircle size={17} weight="fill" /> أنشطة رياضية ولياقة بدنية</li>
              </ul>
            </article>

            <article className="project-card">
              <div className="project-card-header">
                <span className="p-type">برامج دورية</span>
                <h3>المبيتات والليالي الإيمانية</h3>
              </div>
              <p>برامج مبيت دورية قصيرة المدى تركز على غرس عبادات السر، إحياء قيام الليل، تعميق الأخوة في الله، وكسر حواجز الرسميات بين الطلاب والمربين.</p>
              <ul className="project-features">
                <li><CheckCircle size={17} weight="fill" /> إحياء قيام الليل وتزكية النفوس</li>
                <li><CheckCircle size={17} weight="fill" /> مجالس ذكر ومحاسبة صادقة</li>
                <li><CheckCircle size={17} weight="fill" /> صناعة الصحبة الصالحة المعينة</li>
              </ul>
            </article>

            <article className="project-card">
              <div className="project-card-header">
                <span className="p-type">التعليم القرآني</span>
                <h3>الحلقات والمجالس التدبرية</h3>
              </div>
              <p>حلقات قرآنية منتظمة تعقد يومي السبت والأحد للحفظ المتقن، مراجعة المحفوظ، وربط الآيات بالسلوك اليومي وسنن الحياة الواقعية.</p>
              <ul className="project-features">
                <li><CheckCircle size={17} weight="fill" /> إقراء وحفظ وتسميع فردي</li>
                <li><CheckCircle size={17} weight="fill" /> تدبر واستخراج السنن الإلهية</li>
                <li><CheckCircle size={17} weight="fill" /> متابعة دورية عبر المنصة الرقمية</li>
              </ul>
            </article>

            <article className="project-card">
              <div className="project-card-header">
                <span className="p-type">العلم الشرعي</span>
                <h3>المجالس العلمية الأسبوعية</h3>
              </div>
              <p>سلسلة دروس منهجية أسبوعية يقدمها نخبة من المشايخ الفضلاء في التفسير وشروح كتب السلوك والحديث والسيرة النبوية العطرة.</p>
              <ul className="project-features">
                <li><CheckCircle size={17} weight="fill" /> تفسير وتدارس سور القرآن</li>
                <li><CheckCircle size={17} weight="fill" /> شرح مدارج السالكين في التزكية</li>
                <li><CheckCircle size={17} weight="fill" /> فقه السيرة النبوية وأنوار الصحابة</li>
              </ul>
            </article>

            <article className="project-card">
              <div className="project-card-header">
                <span className="p-type">التأهيل والتمكين</span>
                <h3>برامج التطوير المهاري والعمل الحر</h3>
              </div>
              <p>برامج عملية وتطبيقية تهدف إلى بناء شخصية منتجة تعتمد على نفسها وتفهم قيمة السعي الحلال، إدارة الوقت، ومواجهة فتن العصر.</p>
              <ul className="project-features">
                <li><CheckCircle size={17} weight="fill" /> مهارات المبادرة والتفاوض والبيع</li>
                <li><CheckCircle size={17} weight="fill" /> إدارة المال والادخار والمشاريع المصغرة</li>
                <li><CheckCircle size={17} weight="fill" /> ورش التفكير الناقد وصناعة اليقين</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* 5. Pedagogical Framework */}
      <section className="methodology-section" id="methodology">
        <div className="section-heading">
          <span>المرتكزات الحاكمة</span>
          <h2>المنهج التربوي للمؤسسة</h2>
          <p className="section-lead">يقوم البناء التربوي في محاضن إحياء على خمسة مرتكزات أساسية متكاملة تصنع الأثر الراسخ في شخصية الطالب.</p>
        </div>

        <div className="methodology-grid">
          <article className="method-card">
            <div className="m-num">01</div>
            <h3>القرآن الكريم</h3>
            <p>تدبراً وحفظاً وفهماً وعملاً، ليكون القرآن قائداً للسلوك ومرجعاً حاكماً وقت الفتن والتقلبات.</p>
          </article>

          <article className="method-card">
            <div className="m-num">02</div>
            <h3>الصحبة الصالحة</h3>
            <p>توفير بيئة إيمانية حاضنة وصحبة نقية تعين الفتى على الثبات وتدفعه نحو المعالي والمكارم.</p>
          </article>

          <article className="method-card">
            <div className="m-num">03</div>
            <h3>المجاهدة والصبر</h3>
            <p>تكاليف يومية ومسؤوليات مستمرة لبناء الصبر وطول النفس وقوة الإرادة في مواجهة الصوارف.</p>
          </article>

          <article className="method-card">
            <div className="m-num">04</div>
            <h3>المحاسبة الصادقة</h3>
            <p>مراجعة يومية صادقة للنفس، واستدراك التقصير، وبناء العادات الحسنة وإدارة الوقت بدقة.</p>
          </article>

          <article className="method-card">
            <div className="m-num">05</div>
            <h3>التطبيق والعمل</h3>
            <p>تحويل المعاني الإيمانية والمعارف الشرعية إلى واقع ملموس وأثر متعدٍّ ينفع الأسرة والمجتمع.</p>
          </article>
        </div>
      </section>

      {/* 6. Institutional Contact Section */}
      <section className="institutional-contact-section" id="contact">
        <div className="contact-card-box">
          <div className="contact-header">
            <span className="section-kicker">التواصل والتعاون</span>
            <h2>مؤسسة إحياء</h2>
            <p>نرحب بالتواصل والاستفسارات من أولياء الأمور والمهتمين بالبرامج التربوية والعلمية.</p>
          </div>
          <div className="contact-details-grid">
            <div className="c-item">
              <Phone size={24} />
              <div>
                <small>الهاتف والتواصل المباشر</small>
                <strong>+90 537 586 2201</strong>
              </div>
            </div>
            <div className="c-item">
              <EnvelopeSimple size={24} />
              <div>
                <small>البريد الإلكتروني الرسمي</small>
                <strong>ihyaa338@gmail.com</strong>
              </div>
            </div>
            <div className="c-item">
              <Sparkle size={24} />
              <div>
                <small>المعرف الرسمي الموحد</small>
                <strong>@ihyaatr</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer className="public-footer">
      <Logo light />
      <p>مؤسسة إحياء — جيلٌ على خُطى السابقين • اسطنبول</p>
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
