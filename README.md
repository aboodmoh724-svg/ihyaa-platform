# منصة إحياء

منصة داخلية لمؤسسة إحياء لإدارة الحلقات وطلابها، وتسجيل الحضور ومتابعة القرآن، مع واجهتين منفصلتين للإدارة والمعلم. الهدف هو أن تبقى سجلات الحلقة في قاعدة بيانات واحدة قابلة للتقرير والمتابعة، بدل الجداول اليدوية المتفرقة.

الموقع الحي: https://ihyaa.alrahmakuran.site/

## التقنيات

- **Frontend:** React 19 وVite 6.
- **Backend:** Node.js (HTTP server أصلي) وPostgreSQL عبر `pg`.
- **الخطوط والواجهة:** Noto Sans Arabic وAmiri مع دعم RTL.
- **النشر الحالي:** واجهة ثابتة مبنية في `dist/client`، وواجهة API مستقلة تعمل على الخادم. توجد ملفات Sites (`worker/` و`.openai/`) للحفاظ على قابلية الاستضافة، لكن الموقع الحي لا يجب تغييره من هنا دون إذن صريح.

## المتطلبات

- Node.js 22 أو أحدث (يُفضّل؛ يعتمد الخادم على `process.loadEnvFile`).
- PostgreSQL 14 أو أحدث.
- npm.

## التشغيل محليًا في VS Code

1. افتح مجلد المشروع في VS Code.
2. أنشئ ملف `.env` من `.env.example`، ثم ضع رابط قاعدة بيانات محلية في `DATABASE_URL`.
3. ثبّت الحزم:

   ```bash
   npm ci
   ```

4. أنشئ الجداول والتحديثات:

   ```bash
   npm run db:migrate
   ```

5. شغّل الواجهة والخادم في نافذتي Terminal منفصلتين:

   ```bash
   npm run dev
   npm run dev:api
   ```

افتح رابط Vite الظاهر في الطرفية (غالبًا `http://localhost:5173`). لضمان عمل طلبات `/api` محليًا، شغّل الواجهة عبر proxy محلي أو استخدم نفس الأصل/Reverse proxy المناسب؛ إعداد الإنتاج يضع الواجهة والـ API تحت النطاق نفسه.

## الأوامر

| الأمر | الغرض |
| --- | --- |
| `npm run dev` | تشغيل واجهة Vite محليًا. |
| `npm run dev:api` | تشغيل API بوضع المراقبة. |
| `npm run build` | بناء الواجهة وتجهيز مخرجات Sites. |
| `npm run preview` | معاينة بناء الواجهة. |
| `npm run start:api` | تشغيل API للإنتاج أو الاختبار. |
| `npm run db:migrate` | تطبيق ملفات migrations على PostgreSQL. |
| `npm run db:seed` | استيراد بيانات أولية من ملف مهيّأ (يتطلب `IMPORT_FILE`). |
| `npm run test:sites` | اختبار ملفات الاستضافة/worker. |
| `node --test tests/schedule.test.mjs tests/sites-worker.test.mjs` | اختبار جدولة اللقاءات وworker. |
| `node tests/delivery-api-smoke.mjs` | اختبار API تشغيلي على بيئة مهيّأة، باستخدام بيانات مؤقتة فقط. |

## متغيرات البيئة

انسخ `.env.example` إلى `.env`. لا ترفع `.env` أو كلمات المرور أو `DATABASE_URL` إلى GitHub.

أهم متغير مطلوب هو `DATABASE_URL`. المتغير `IMPORT_FILE` مطلوب فقط عند تشغيل الاستيراد الأولي (`db:seed`).

## قاعدة البيانات والبيانات الأولية

المصدر التشغيلي هو PostgreSQL الحقيقي. لا توجد قاعدة بيانات أو ملف Google Sheets مرفوعان داخل المستودع. ملفات `server/schema.sql` و`server/migrations/` تصف البنية، و`server/seed.mjs` يستورد ملف JSON خارجيًا عند الحاجة. لذلك يجب عمل نسخة احتياطية لقاعدة بيانات الإنتاج قبل أي ترقية.

## النشر الحالي

النشر الحالي معروف على خادم المؤسسة عبر نطاق `ihyaa.alrahmakuran.site`. لا يحتوي هذا المستودع على مفاتيح الخادم أو إعدادات الاتصال الإنتاجية. أي تغيير في الخادم أو قاعدة البيانات أو النشر يحتاج إذنًا صريحًا ونسخة احتياطية مسبقة.

راجع [PROJECT_HANDOVER.md](docs/PROJECT_HANDOVER.md) للتسليم التفصيلي، و[ARCHITECTURE.md](docs/ARCHITECTURE.md) للبنية، و[AGENTS.md](AGENTS.md) لقواعد العمل.
