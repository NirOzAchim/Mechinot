/* ============================================================
   הדלת הציבורית — הרשמה מהאתר
   ------------------------------------------------------------
   ⚠⚠⚠ **שלוש נקודות הקצה כאן הן היחידות במוצר שאין מאחוריהן
     סשן.** כל השאר יושב מאחורי `withAuth` או `rootGuard`,
     וזה נכון להשאיר כך: מי שיוסיף כאן נקודת קצה רביעית
     מוסיף משטח התקפה, לא תכונה. שלוש הסיבות שהן קיימות:

       public/plans    מה המוצר — נקרא לפני שיש משתמש
       public/slug     האם הכתובת פנויה — נקרא תוך כדי הקלדה
       public/signup   ההרשמה עצמה

   ⚠⚠ **ההרשמה מקימה פריסה שלמה, ולכן היא מוגבלת בקצב.** ראו
     `server/ratelimit.js`. בלי זה לולאה אחת ממלאת את הדיסק
     במכינות ריקות ואת המרשם ברשימה שאי אפשר לקרוא.

   ⚠⚠ **ומי שנרשם נכנס פנימה מיד.** «נוצר בהצלחה» ואז מסך
     כניסה שבו הוא מקליד שוב את מה שהרגע הקליד הוא הרגע שבו
     אנשים נוטשים טופס. העוגייה נחתמת כאן, בתשובה עצמה.

   ⚠ **`public/slug` אינו מנוע בדיקה של הלקוחות שלי.** הוא
     עונה «פנוי / תפוס» ותו לא — לא שם המכינה, לא מתי נפתחה
     ולא כמה חניכים יש בה. מי שינסה למפות דרכו מקבל בדיוק
     את מה שהוא היה מקבל מניסיון להירשם.
   ============================================================ */

import { getMechina, slugProblem, suggestSlug, TenantError } from "../tenants.js";
import { provisionMechina, mailProblem } from "../provision.js";
import { sign, setCookie, passwordProblem, USER_RE, normalizeUser } from "../auth.js";
import { rateLimit, peekLimit, recordLimit, clientIp } from "../ratelimit.js";
import { PREMIL } from "../../core/presets/premil.js";
import { activeModules, MODULE_CATALOG } from "../../core/catalog.js";

/* ============================================================
   מה המוצר — לדף הנחיתה
   ⚠⚠ **נגזר מהתבנית ואינו טקסט שיווקי מוקלד.** רשימת מה
     שהמכינה מקבלת ביום הראשון חייבת להיות **אותה רשימה**
     שהיא באמת מקבלת; שתי רשימות מתפצלות בתוספת הראשונה,
     ואז הדף מבטיח מודול שכבוי. זה 4מד בגרסה שעולה כסף.
   ============================================================ */
export async function plans() {
  const mods = PREMIL.modules || {};
  const on = activeModules(mods);

  return {
    /* ⚠ רק מה שדלוק בתבנית, ורק מה שיש לו כותרת — מודול
       שנוסף לקטלוג ואין לו `title` לא יופיע כשורה ריקה. */
    included: on
      .filter((m) => MODULE_CATALOG[m]?.title)
      .map((m) => ({
        key: m,
        title: MODULE_CATALOG[m].title,
        why: MODULE_CATALOG[m].why || "",
        core: Boolean(MODULE_CATALOG[m].core),
      })),
    /* ⚠ מספרים שנגזרים ולא נכתבים: «14 מודולים» שנשאר בטקסט
       אחרי שנוסף החמישה־עשר הוא בדיוק מה שגורם לאדם להפסיק
       להאמין לדף. */
    counts: {
      modules: on.length,
      roles: (PREMIL.roles || []).length,
      vocab: Object.keys(PREMIL.vocab || {}).length,
    },
  };
}

/* ============================================================
   האם הכתובת פנויה
   ⚠ **תוך כדי הקלדה, ולכן חייבת להיות זולה.** היא קוראת את
     המרשם בלבד ואינה נוגעת באף מכינה.
   ============================================================ */
export async function slugCheck({ query }) {
  const raw = String(query?.slug || "").trim();
  const from = String(query?.name || "").trim();
  const slug = raw || (from ? suggestSlug(from) : "");

  if (!slug) return { slug: "", ok: false, why: "חסר מזהה" };

  const problem = slugProblem(slug);
  if (problem) return { slug, ok: false, why: problem };
  if (getMechina(slug)) return { slug, ok: false, why: "הכתובת הזו כבר תפוסה" };

  return { slug, ok: true, url: `/m/${slug}/` };
}

/* ============================================================
   ההרשמה
   ============================================================ */

/* ⚠ שלוש הגנות, וכל אחת עוצרת משהו אחר:
     חלון קצב  — לולאה מאותה כתובת
     פיתיון    — בוט שממלא כל שדה בטופס
     סף זמן    — בוט ששולח את הטופס מיד בלי לקרוא אותו
   אף אחת מהן אינה עוצרת אדם אמיתי, ואף אחת מהן אינה דורשת
   ספק חיצוני. */
const HONEYPOT = "website";
const MIN_FORM_MS = 2500;

export async function signup({ req, res, body }) {
  const ip = clientIp(req);

  /* ============================================================
     ⚠⚠⚠ **הספירה היא של מכינות שנפתחו, לא של טפסים שנשלחו.**
     ------------------------------------------------------------
     הגרסה הראשונה ספרה כל בקשה, ולכן מי שהקליד אימייל שגוי
     שלוש פעמים ננעל לשעה **לפני שיצר משהו** — וההודעה שקיבל
     דיברה על «יותר מדי ניסיונות» במקום על השדה שהוא טעה בו.
     בטופס הרשמה זו עסקה שאבדה, לא אי-נוחות.

     שלושה דלפקים, כל אחד על משהו אחר:
       הלימה   — 25 בקשות לשעה מכתובת, נגד סקריפט
       פתיחה   — 3 מכינות לשעה מכתובת, **נספר רק בהצלחה**
       גלובלי  — 40 מכינות לשעה בסך הכול, נגד בוטנט שכל
                 כתובת בו מנסה פעם אחת
     ============================================================ */
  const flood = rateLimit(`signup:try:${ip}`, {
    max: 25, windowMs: 3600_000,
    what: "הגיעו יותר מדי בקשות מהכתובת הזו.",
  });
  if (!flood.ok) throw new TenantError(flood.message, 429);

  /* ⚠ `peek` ולא `rateLimit` — בדיקה בלי צריכה. הרישום קורה
     אחרי שהמכינה באמת נפתחה, בסוף הפונקציה. */
  const perIp = peekLimit(`signup:ok:${ip}`, {
    max: 3, windowMs: 3600_000,
    what: "נפתחו כבר שלוש מכינות מהכתובת הזו בשעה האחרונה.",
  });
  if (!perIp.ok) throw new TenantError(perIp.message, 429);

  const global = peekLimit("signup:ok:all", { max: 40, windowMs: 3600_000 });
  if (!global.ok) {
    throw new TenantError(
      "נפתחו הרבה מכינות בשעה האחרונה והפתיחה מושהית לרגע. " +
      "אפשר לנסות שוב בעוד כמה דקות, או לכתוב לנו.", 429);
  }

  /* ⚠ הפיתיון מוחזר כהצלחה מדומה? **לא.** «נרשמת» כשלא נרשם
     כלום היה מייצר פנייה של אדם אמיתי שמילא אותו בטעות
     בהשלמה אוטומטית של הדפדפן, ואז הוא ממתין למייל שלא
     יגיע. שגיאה שקטה ומנוסחת עדיפה. */
  if (String(body?.[HONEYPOT] || "").trim()) {
    throw new TenantError("הטופס לא נשלח. אם זו טעות — אפשר לרענן ולנסות שוב.", 400);
  }

  const elapsed = Number(body?.elapsedMs);
  if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < MIN_FORM_MS) {
    throw new TenantError("הטופס נשלח מהר מדי. אפשר לשלוח שוב.", 400);
  }

  /* ⚠⚠ **הוולידציה נעשית פעמיים, וזה בכוונה.** `provisionMechina`
     בודקת הכול ממילא, אבל היא בודקת **בסדר שלה** — ומי שממלא
     טופס צריך לדעת על השדה שהוא נמצא בו, לא על הראשון שנפל.
     כאן נבדק מה שהמסך מציג לפי הסדר של המסך. */
  const name = String(body?.name || "").trim();
  if (!name) throw new TenantError("חסר שם המכינה", 400);

  const headName = String(body?.headName || "").trim();
  if (!headName) throw new TenantError("חסר שם ראש המכינה", 400);

  const mail = mailProblem(body?.email, { required: true });
  if (mail) throw new TenantError(mail, 400);

  const username = normalizeUser(body?.username);
  if (!USER_RE.test(username)) {
    throw new TenantError("שם המשתמש: אנגלית קטנה, 3–32 תווים", 400);
  }

  const bad = passwordProblem(body?.password);
  if (bad) throw new TenantError(bad, 400);

  const out = await provisionMechina({
    name,
    slug: body?.slug,
    headName,
    username,
    password: body.password,
    email: body.email,
    /* ⚠ **אימייל חובה בהרשמה מהאתר, ואינו חובה בקונסולה.**
       מי שנפתח מהקונסולה יושב מולי; מי שנרשם לבד הוא האדם
       היחיד שיוכל אי פעם לשחזר את החשבון הזה. */
    requireEmail: true,
    source: "signup",
  });

  /* ⚠ **נרשם רק עכשיו** — ראו ההערה על שלושת הדלפקים. פתיחה
     שנכשלה אינה עולה למשתמש כלום. */
  recordLimit(`signup:ok:${ip}`);
  recordLimit("signup:ok:all");

  /* ⚠⚠ **העוגייה נחתמת כאן, לא במסך.** היא מוגבלת לנתיב של
     המכינה שנוצרה (`Path=/m/<slug>`), ולכן ההרשמה אינה
     מכניסה לשום מכינה אחרת — גם לא בטעות. */
  setCookie(res, sign({ account: out.accountId, tenant: out.slug }), out.slug);

  return {
    ok: true,
    slug: out.slug,
    url: out.url,
    account: out.account,
    /* ⚠ מוחזר כדי שהמסך יאמר «נכנסת» ולא «אפשר להיכנס» —
       שתי הודעות שונות לגמרי אחרי אותה פעולה. */
    signedIn: true,
  };
}
