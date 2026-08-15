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

const DEPARTMENTS_DATA = {
  boys: {
    id: "boys",
    title: "قسم الفتية",
    age: "13 – 17 عاماً",
    tagline: "الانتقال من التوجيه الخارجي إلى الرقابة الذاتية",
    summary: "بناء الفتى بناءً رصيناً خالياً من أدران البيئة المحيطة، وتعزيز صلته بالله والقرآن، واكتشاف مواهبه وقدراته وتوجيهها بأحدث الطرق التربوية.",
    outcomes: [
      { title: "تعميق الصلة بالله", desc: "ترسيخ أداء الواجبات، واجتناب المحرمات، وتزكية النفس." },
      { title: "شخصية سوية متزنة", desc: "بناء نفسي وسلوكي متوازن قادر على قيادة النفس ومواجهة الضغوط." },
      { title: "التطوير المهاري", desc: "اكتشاف نقاط القوة والتميز والمواهب وتنميتها بما يلائم متطلبات العصر." },
      { title: "معرفة إسلامية أصيلة", desc: "تلقي المعارف الشرعية من مصادرها الأصلية في إطار ما لا يسع المسلم جهله." },
    ],
    activities: [
      "حلقات قرآنية أسبوعية وتدبرية",
      "مبيتات تربوية قصيرة وليالي إيمانية",
      "مخيمات معايشة مكثفة (مثل مخيم معالم)",
      "ورش عمل مهارية وفكرية وتدريبية",
    ],
    whatsappMsg: "السلام عليكم، أود الاستفسار والتسجيل في قسم الفتية (13 - 17 عاماً)",
  },
  early: {
    id: "early",
    title: "قسم الطليعة",
    age: "8 – 12 عاماً",
    tagline: "تأسيس الدرع الإيماني والوجداني الواقي",
    summary: "تأسيس طليعة البراعم تأسيساً إيمانياً ووجدانياً يكون لهم درعاً واقياً أمام تحديات الواقع، واحتضانهم في بيئة منضبطة وصحبة صالحة على مائدة القرآن.",
    outcomes: [
      { title: "تنشئة قرآنية مباركة", desc: "الارتباط بحفظ القرآن الكريم وفهمه وتدبره منذ الصغر." },
      { title: "غرس حب الإسلام", desc: "ترسيخ محبة الله ورسوله في قلب الناشئ بطرق محببة وتطبيقية." },
      { title: "قيم تأسيسية أصيلة", desc: "بناء العادات والسلوكيات الإيجابية التي تصاحب الطفل طيلة حياته." },
      { title: "الصحبة الصالحة", desc: "إحاطة الطفل ببيئة نقية تدفعه نحو الخير وتبعده عن المشتتات." },
    ],
    activities: [
      "حلقات تحفيظ وتلقين متقن",
      "أنشطة تربوية ترفيهية تفاعلية",
      "حقائب معرفية مبسطة في السيرة والآداب",
      "مسابقات تحفيزية وبناء العادات اليومية",
    ],
    whatsappMsg: "السلام عليكم، أود الاستفسار والتسجيل في قسم الطليعة (8 - 12 عاماً)",
  },
  girls: {
    id: "girls",
    title: "قسم الفتيات",
    age: "13 – 17 عاماً",
    tagline: "بناء شامل ومتزن للفتاة المسلمة",
    summary: "بناء شخصية الفتاة بناءً شاملاً ومتكاملاً ومتزناً، وإعداد الفتاة المسلمة للقيام بأدوارها في الحياة والأسرة والمجتمع من خلال أحدث الاتجاهات والممارسات التربوية.",
    outcomes: [
      { title: "بناء إيماني عميق", desc: "غرس الحياء والعفة والاعتزاز بالهوية الإسلامية." },
      { title: "اتزان نفسي وعاطفي", desc: "تنمية مهارات إدارة الذات والتعامل الواعي مع متغيرات العصر." },
      { title: "الوعي الأسري والاجتماعي", desc: "تأهيل الفتاة لتكون لبنة صالحة ومؤثرة إيجابياً في أسرتها ومجتمعها." },
      { title: "مهارات حياتية وقيادية", desc: "صقل المواهب القيادية والتنظيمية والإبداعية لدى الفتيات." },
    ],
    activities: [
      "حلقات تدبرية وقرآنية أسبوعية",
      "ليالي ومخيمات إيمانية خاصة",
      "دورات مهارية في إدارة الذات والأسرة",
      "لقاءات حوارية في بيئة آمنة وحاضنة",
    ],
    whatsappMsg: "السلام عليكم، أود الاستفسار والتسجيل في قسم الفتيات (13 - 17 عاماً)",
  },
  majalis: {
    id: "majalis",
    title: "قسم المجالس العلمية",
    age: "متاح للرجال والنساء",
    tagline: "إعادة المجتمع لمركزية العلم والعلماء",
    summary: "إعادة المجتمع المسلم في بلاد المهجر إلى مركزية العلم والعلماء والتفقه في الدين، عبر مجالس علمية أسبوعية منتظمة لنخبة من المشايخ الفضلاء.",
    outcomes: [
      { title: "تفسير وتدارس القرآن", desc: "الغوص في معاني الآيات وتدبرها وتطبيقها في واقع الحياة." },
      { title: "شرح مدارج السالكين", desc: "تزكية النفوس ومنازل السائرين إلى الله وفق المنهج السلفي النقي." },
      { title: "السيرة النبوية العطرة", desc: "استخلاص العبر والدروس التربوية والقيادية من حياة النبي ﷺ." },
      { title: "أنوار الصحابة والقدوات", desc: "ربط الجيل بسير الرعيل الأول ونماذج الثبات والبذل." },
    ],
    activities: [
      "مجالس علمية أسبوعية حضورية وافتراضية",
      "جلسات تدارس وحوار مفتوح مع المشايخ",
      "ملخصات ومقررات علمية منهجية",
      "مفتوحة لكافة أفراد الأسرة دون تقيد عمري",
    ],
    whatsappMsg: "السلام عليكم، أود الاستفسار عن مواعيد وبرامج المجالس العلمية",
  },
};

function PublicHome() {
  const [selectedDept, setSelectedDept] = useState("boys");
  const currentDept = DEPARTMENTS_DATA[selectedDept];

  return <div className="public-page" dir="rtl">
    <header className="public-nav">
      <Logo />
      <nav aria-label="التنقل الرئيسي">
        <a href="#about">عن المؤسسة</a>
        <a href="#journey">مسار الطالب</a>
        <a href="#departments">أقسامنا</a>
        <a href="#maelem">مخيم معالم</a>
        <a href="#contact">تواصل معنا</a>
      </nav>
      <LinkButton to="/login" className="outline-action"><SignIn size={22} /> دخول المنصة</LinkButton>
    </header>

    <main>
      {/* Hero Section */}
      <section className="public-hero">
        <div className="hero-copy">
          <span className="section-kicker">مؤسسة إحياء التربوية</span>
          <h1>إحياء معالم الدين<br />في نفوس الجيل</h1>
          <p>نهدف إلى إحياء معالم الدين من جديد في نفوس شرائح المجتمع المسلم، منطلقين من هدايات الوحي وأنوار السنّة، لسد الاحتياج وضبط البوصلة فكراً وجهداً.</p>
          <div className="hero-actions">
            <LinkButton to="/login" className="primary-action">دخول المنصة <ArrowLeft size={21} /></LinkButton>
            <a className="outline-action" href="#journey">خريطة البناء التربوي <ArrowLeft size={21} /></a>
          </div>
          <div className="hero-badges">
            <span className="gold-tag"><Sparkle size={16} weight="fill" /> جيلٌ على خُطى السابقين</span>
            <span className="sub-tag">التربية بالمعايشة • الرقابة الذاتية • إتقان القرآن</span>
          </div>
        </div>
        <div className="hero-emblem" aria-hidden="true">
          <div className="emblem-backdrop"></div>
          <img src="/assets/ihyaa-logo-color.png" alt="شعار مؤسسة إحياء" />
        </div>
      </section>

      {/* About Section */}
      <section className="care-section" id="about">
        <div className="section-heading">
          <span>عن المؤسسة ورسالتها</span>
          <h2>رعايةٌ وبناء، يَصِلُ العلمَ بالعمل</h2>
          <p className="section-lead">انطلاقاً من الشعور بالمسؤولية تجاه واقع الأمة وضياع البوصلة وتشتت الجهود، جاءت مؤسسة إحياء لتكثيف الجهود التربوية والمشاريع الهادفة، ولسد هذا الاحتياج وضبط البوصلة فكراً وجهداً، لتنشئة جيلٍ قرآنيٍّ راسخ يعتز بدينه وينفع مجتمعه.</p>
        </div>
        <div className="care-grid">
          <article className="care-card">
            <div className="care-icon-wrap"><BookOpen size={36} /></div>
            <h3>الارتباط بالوحي والسنّة</h3>
            <p>ربط الشباب بالقرآن والعمل به، وبالسنة المطهرة كمرجع ثانٍ، ومنطلقاً للهداية والنور والاستقامة في كل مناحي الحياة.</p>
          </article>
          <article className="care-card">
            <div className="care-icon-wrap"><UsersThree size={36} /></div>
            <h3>التربية بالمعايشة الحقيقية</h3>
            <p>صحبة تربوية مرافقة من خلال الليالي الإيمانية والمخيمات والمتابعة المستمرة لصناعة رفيق صادق للقرآن.</p>
          </article>
          <article className="care-card">
            <div className="care-icon-wrap"><Sparkle size={36} /></div>
            <h3>التحصين والتمكين المهاري</h3>
            <p>تحصين الشباب من فتن الشهوات والشبهات، والعمل على التطوير المهاري لاكتشاف نقاط التميز وتوجيهها للمجتمع.</p>
          </article>
        </div>
      </section>

      {/* Student Growth Journey */}
      <section className="journey-section" id="journey">
        <div className="section-heading">
          <span>التدرج التربوي</span>
          <h2>خريطة مسار الطالب في إحياء</h2>
          <p className="section-lead">نرافق الطالب عبر خطة بناء محكمة تنتقل به مرحلة بمرحلة من غرس الفطرة حتى النضج والرسوخ القيادي.</p>
        </div>
        <div className="journey-timeline">
          <div className="journey-step">
            <div className="step-badge">المرحلة 01</div>
            <div className="step-card">
              <span className="step-age">8 – 12 عاماً • قسم الطليعة</span>
              <h3>الغرس وحصن الفطرة</h3>
              <p>تنشئة على مائدة القرآن، تحصين الفطرة من المشتتات، وغرس محبة الله ورسوله وبناء العادات الصالحة مع صحبة نقية.</p>
              <ul className="step-checkpoints">
                <li><CheckCircle size={17} weight="fill" /> مائدة القرآن وتلقينه</li>
                <li><CheckCircle size={17} weight="fill" /> غرس قيم الاستقامة</li>
                <li><CheckCircle size={17} weight="fill" /> بيئة إيمانية حاضنة</li>
              </ul>
            </div>
          </div>

          <div className="journey-arrow" aria-hidden="true">➔</div>

          <div className="journey-step highlight">
            <div className="step-badge">المرحلة 02</div>
            <div className="step-card">
              <span className="step-age">13 – 17 عاماً • الفتية والفتيات</span>
              <h3>الرقابة الداخلية والتحصين</h3>
              <p>الانتقال بالفتى والفتاة من الاعتماد على التوجيه الخارجي إلى الرقابة الذاتية، ومواجهة فتن العصر باليقين والتفكير الناقد.</p>
              <ul className="step-checkpoints">
                <li><CheckCircle size={17} weight="fill" /> معايشة ومخيمات مكثفة</li>
                <li><CheckCircle size={17} weight="fill" /> كشف فتن الشبهات والشهوات</li>
                <li><CheckCircle size={17} weight="fill" /> الكسب الحلال والعمل الحر</li>
              </ul>
            </div>
          </div>

          <div className="journey-arrow" aria-hidden="true">➔</div>

          <div className="journey-step">
            <div className="step-badge">المرحلة 03</div>
            <div className="step-card">
              <span className="step-age">الشباب والعموم • المجالس العلمية</span>
              <h3>الرسوخ والأثر الممتد</h3>
              <p>إعادة المجتمع إلى مركزية العلم والعلماء، تدارس الوحي والسيرة ومدارج السالكين، ليكون الشاب معلماً هادياً في مجتمعه.</p>
              <ul className="step-checkpoints">
                <li><CheckCircle size={17} weight="fill" /> تدارس التفسير والسيرة</li>
                <li><CheckCircle size={17} weight="fill" /> تزكية النفس والتفقه</li>
                <li><CheckCircle size={17} weight="fill" /> صناعة القدوات والأثر</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Department Explorer */}
      <section className="programs-section" id="departments">
        <div className="section-heading">
          <span>استكشف المسارات</span>
          <h2>أقسام المؤسسة التخصصية</h2>
          <p className="section-lead">اختر القسم للتعرف على أهدافه ومخرجاته العملية وأنشطته المستمرة.</p>
        </div>

        <div className="dept-tabs-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={selectedDept === "boys"}
            className={`dept-tab-btn ${selectedDept === "boys" ? "active" : ""}`}
            onClick={() => setSelectedDept("boys")}
          >
            <UsersThree size={24} />
            <div>
              <strong>قسم الفتية</strong>
              <small>13 – 17 عاماً</small>
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedDept === "early"}
            className={`dept-tab-btn ${selectedDept === "early" ? "active" : ""}`}
            onClick={() => setSelectedDept("early")}
          >
            <Compass size={24} />
            <div>
              <strong>قسم الطليعة</strong>
              <small>8 – 12 عاماً</small>
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedDept === "girls"}
            className={`dept-tab-btn ${selectedDept === "girls" ? "active" : ""}`}
            onClick={() => setSelectedDept("girls")}
          >
            <Heart size={24} />
            <div>
              <strong>قسم الفتيات</strong>
              <small>13 – 17 عاماً</small>
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedDept === "majalis"}
            className={`dept-tab-btn ${selectedDept === "majalis" ? "active" : ""}`}
            onClick={() => setSelectedDept("majalis")}
          >
            <Books size={24} />
            <div>
              <strong>المجالس العلمية</strong>
              <small>للرجال والنساء</small>
            </div>
          </button>
        </div>

        {/* Selected Department Showcase Panel */}
        <div className="dept-showcase-panel">
          <div className="showcase-header">
            <div>
              <span className="showcase-badge">{currentDept.age}</span>
              <h3>{currentDept.title}</h3>
              <p className="showcase-tagline">✦ {currentDept.tagline}</p>
            </div>
            <a
              href={`https://wa.me/905375862201?text=${encodeURIComponent(currentDept.whatsappMsg)}`}
              target="_blank"
              rel="noreferrer"
              className="primary-action dept-cta"
            >
              استفسر أو سجّل في هذا القسم <ArrowLeft size={19} />
            </a>
          </div>

          <p className="showcase-summary">{currentDept.summary}</p>

          <div className="showcase-content-grid">
            <div className="outcomes-box">
              <h4><Sparkle size={20} /> مخرجات المسار وأهدافه</h4>
              <div className="outcomes-grid">
                {currentDept.outcomes.map((item, idx) => (
                  <div key={idx} className="outcome-item">
                    <span className="outcome-num">0{idx + 1}</span>
                    <div>
                      <h5>{item.title}</h5>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="activities-box">
              <h4><Clock size={20} /> الوسائل والأنشطة التربوية</h4>
              <ul className="activity-list">
                {currentDept.activities.map((act, idx) => (
                  <li key={idx}>
                    <CheckCircle size={19} weight="fill" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
              <div className="activity-note">
                <strong>التربية بالمعايشة:</strong> تعتمد المؤسسة على المبيتات القصيرة الدورية والمخيمات المعايشة كركيزة أساسية لبناء الشخصية.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Flagship Project: Ma'alem Camp */}
      <section className="maelem-section" id="maelem">
        <div className="section-heading">
          <span>مشاريع إحياء الرائدة</span>
          <h2>مخيم مَعَالِم (1)</h2>
          <p className="section-lead">«لسنا هنا لنكثر العابرين... بل لنخرج معالم على الطريق» — بيئة تربوية مكثفة تصنع من الفتى نموذجاً للثبات والاستقامة تحت ظلال الوحي.</p>
        </div>

        <div className="maelem-card-featured">
          {/* Challenge Banner */}
          <div className="maelem-challenge-banner">
            <div className="challenge-copy">
              <span className="challenge-kicker">سؤال التحدي والمنطلق</span>
              <h3>«في زمن الشاشات والفتن المتلاطمة.. هل يستطيع الفتى أن يثبت؟»</h3>
              <p>20 يوماً من المعايشة الكاملة تنقل الفتى من التوجيه الخارجي إلى الرقابة الذاتية الصادقة، وتصنع منه شعلة ثبات في مجتمعه.</p>
            </div>
            <div className="challenge-quran">
              <span>القيمة المركزية</span>
              <strong>الإِسْتِقَامَة</strong>
              <blockquote>﴿فَاسْتَقِمْ كَمَا أُمِرْتَ﴾</blockquote>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="maelem-stats-grid">
            <div className="stat-box">
              <span className="stat-val">20</span>
              <span className="stat-unit">يوماً متواصلة</span>
              <p>معايشة وتربية على مدار الساعة</p>
            </div>
            <div className="stat-box">
              <span className="stat-val">10</span>
              <span className="stat-unit">أجزاء قرآنية</span>
              <p>مراجعة وإتقان حسب قدرة كل فتى</p>
            </div>
            <div className="stat-box">
              <span className="stat-val">11</span>
              <span className="stat-unit">محوراً متكاملاً</span>
              <p>لبناء اليقين والشخصية والمهارة</p>
            </div>
            <div className="stat-box">
              <span className="stat-val">الأنبياء & العنكبوت</span>
              <span className="stat-unit">السور المركزية</span>
              <p>تدبراً ومنهاج عمل وسنن الثبات</p>
            </div>
          </div>

          {/* Daily Life & Pillars in Ma'alem */}
          <div className="maelem-body-extended">
            <div className="camp-daily-schedule">
              <h3>يومٌ في حياة فتى «مَعَالِم»</h3>
              <div className="schedule-timeline">
                <div className="schedule-item">
                  <div className="sch-icon">🌅</div>
                  <div>
                    <h4>الفجر والتلاوة اليومية</h4>
                    <p>استفتاح اليوم بصلات الفجر والورد القرآني وتدبر سورتي الأنبياء والعنكبوت والتسميع الفردي والجماعي.</p>
                  </div>
                </div>

                <div className="schedule-item">
                  <div className="sch-icon">💡</div>
                  <div>
                    <h4>الضحى: ورش اليقين والفكر</h4>
                    <p>جلسات حوارية حول فتن العصر، الشبهات، كيفية مقاومة التسويف، والتعامل مع الذنب والتوبة العملية.</p>
                  </div>
                </div>

                <div className="schedule-item">
                  <div className="sch-icon">🛠️</div>
                  <div>
                    <h4>العصر: الكسب الحلال والمسؤولية</h4>
                    <p>تطبيق عملي لمشاريع مصغرة وكسب حلال داخل المخيم، تعزيز المبادرة، وحل الخلافات والعمل الجماعي.</p>
                  </div>
                </div>

                <div className="schedule-item">
                  <div className="sch-icon">🌙</div>
                  <div>
                    <h4>المساء: دفتر المحاسبة وقيام الليل</h4>
                    <p>خلوة صادقة مع الله، مراجعة دفتر المحاسبة اليومية، قيام الليل، وصحبة أخوية تزيد الإيمان ثباتاً.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="camp-pillars-column">
              <h3>المرتكزات الخمسة للتربية</h3>
              <div className="pillars-cards">
                <div className="p-card">
                  <strong>01. القرآن الكريم</strong>
                  <p>تدبراً وحفظاً وفهماً وتثبيتاً في الصدور.</p>
                </div>
                <div className="p-card">
                  <strong>02. الصحبة الصالحة</strong>
                  <p>بيئة إيمانية حاضنة تعين على الثبات والمعالي.</p>
                </div>
                <div className="p-card">
                  <strong>03. المجاهدة والصبر</strong>
                  <p>تكاليف ومسؤوليات مستمرة لبناء طول النفس.</p>
                </div>
                <div className="p-card">
                  <strong>04. المحاسبة الصادقة</strong>
                  <p>دفتر يومي لمراجعة النفس وضبط العادات والوقت.</p>
                </div>
                <div className="p-card">
                  <strong>05. التطبيق العملي</strong>
                  <p>تحويل القيم الإيمانية إلى واقع وسلوك وكسب حلال.</p>
                </div>
              </div>
            </div>
          </div>

          {/* 11 Focus Axes list */}
          <div className="maelem-axes-container">
            <h3>محاور المخيم الاستراتيجية الـ 11</h3>
            <div className="axes-chips-grid">
              <div className="axis-chip"><strong>1. المحور الإيماني</strong><span>الصلة بالله، الخلوة، وقيام الليل</span></div>
              <div className="axis-chip"><strong>2. المحور القرآني</strong><span>تدبر الأنبياء والعنكبوت وسنن الثبات</span></div>
              <div className="axis-chip"><strong>3. الحفظ القرآني</strong><span>مراجعة 10 أجزاء وإتقان الورد</span></div>
              <div className="axis-chip"><strong>4. السلوكي والنفسي</strong><span>إدارة الانفعالات والصبر تحت الضغط</span></div>
              <div className="axis-chip"><strong>5. الفتن والشهوات</strong><span>التعامل مع الشاشات والخلوات</span></div>
              <div className="axis-chip"><strong>6. المحور الفكري</strong><span>صناعة اليقين والتفكير الناقد</span></div>
              <div className="axis-chip"><strong>7. الانتكاسة والنهوض</strong><span>فن التوبة والعودة بعد التعثر</span></div>
              <div className="axis-chip"><strong>8. العمل الحر والكسب</strong><span>قيمة السعي الحلال والمبادرة</span></div>
              <div className="axis-chip"><strong>9. المحور المهاري</strong><span>صناعة العادات وإدارة الوقت</span></div>
              <div className="axis-chip"><strong>10. المحور الاجتماعي</strong><span>صناعة الأخوة والتأثير الإيجابي</span></div>
              <div className="axis-chip"><strong>11. القدوات والرجال</strong><span>دراسة سير الأنبياء ونماذج الثبات</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Living Atmosphere Highlights */}
      <section className="atmosphere-section">
        <div className="section-heading">
          <span>المعايشة والأثر</span>
          <h2>مشاهد من بيئة إحياء التربوية</h2>
          <p className="section-lead">نؤمن بأن التربية الحقيقية ليست مجرد تلقين في قاعة، بل هي بيئة متكاملة تصنع الأثر في النفس والسلوك.</p>
        </div>

        <div className="atmosphere-grid">
          <article className="atmo-card">
            <div className="atmo-num">01</div>
            <div className="atmo-content">
              <h3>حلقات الوحي والتدبر</h3>
              <p>جلسات قرآنية يومية تربط الآيات بواقع الفتى، وتستخرج منها سنن الحياة والهداية وتثبيت الفؤاد.</p>
            </div>
          </article>

          <article className="atmo-card">
            <div className="atmo-num">02</div>
            <div className="atmo-content">
              <h3>المبيتات والليالي الإيمانية</h3>
              <p>معايشة حية تكسر حواجز الرسميات، وتصنع أخوة في الله تدوم وتعين على تقلبات الأيام.</p>
            </div>
          </article>

          <article className="atmo-card">
            <div className="atmo-num">03</div>
            <div className="atmo-content">
              <h3>حوارات اليقين وبناء الفكر</h3>
              <p>مساحة آمنة لطرح التساؤلات، وتفكيك الشبهات المعاصرة بأسلوب علمي رصين يرسخ اليقين.</p>
            </div>
          </article>

          <article className="atmo-card">
            <div className="atmo-num">04</div>
            <div className="atmo-content">
              <h3>المشاريع وبناء الرجولة</h3>
              <p>تكاليف حقيقية وتدريب على الكسب الحلال والمسؤولية والانضباط الذاتي لتخريج رجال فاعلين.</p>
            </div>
          </article>
        </div>
      </section>

      {/* Call to action */}
      <section className="public-cta-section">
        <div className="cta-box">
          <span className="cta-kicker">انضم إلى محاضن إحياء</span>
          <h2>استثمر في بناء جيلك القرآني</h2>
          <p>تواصل معنا اليوم لمعرفة تفاصيل التسجيل في الحلقات والمخيمات والمجالس العلمية.</p>
          <div className="cta-actions">
            <a
              href="https://wa.me/905375862201?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%A8%D8%B1%D8%A7%D9%85%D8%AC%20%D9%85%D8%A4%D8%B3%D8%B3%D8%A9%20%D8%A5%D8%AD%D9%8A%D8%A7%D8%A1"
              target="_blank"
              rel="noreferrer"
              className="primary-action"
            >
              تواصل معنا عبر واتساب <ArrowLeft size={21} />
            </a>
            <LinkButton to="/login" className="outline-action light">
              دخول المنصة للمعلمين والإدارة <SignIn size={21} />
            </LinkButton>
          </div>
        </div>
      </section>
    </main>

    <footer className="public-footer" id="contact">
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
