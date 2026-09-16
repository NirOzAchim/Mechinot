/* ============================================================
   הקמת מכינה — מסלול אחד לשני הדלתות
   ------------------------------------------------------------
   ⚠⚠⚠ **מכינה נוצרת בשני מקומות: הקונסולה וההרשמה הציבורית.**
     שתי גרסאות של אותה פעולה מתפצלות בתיקון הראשון — ואז
     מכינה שנפתחה מהאתר מקבלת אפיון אחר, או תפקיד אחר, או
     חשבון בלי `head`, ממכינה שנפתחה מהקונסולה. זה בדיוק
     הדפוס ש«דלת אחת» נועד למנוע, ובגרסה המסוכנת ביותר שלו:
     הפער מתגלה רק כשלקוח אמיתי נתקע.

   ⚠⚠ **הניקוי בכישלון הוא חלק מהפעולה ולא נחמדות.** מהרגע
     ש-`createMechina` הצליח, המכינה קיימת במרשם. כישלון
     בכתיבת החשבון היה משאיר שורה שאי אפשר להיכנס אליה ואיש
     לא יודע למה — ולכן היא נמחקת בחזרה.

   ⚠ **ומה שנשאר שונה בין שתי הדלתות מוצהר כאן**: מי שנרשם
     מהאתר מקבל `source: "signup"` במרשם, ומי שנפתח מהקונסולה
     `source: "console"`. זה נתון תפעולי אמיתי — הקונסולה
     צריכה לדעת מי הגיע לבד — והוא **אינו** משנה שום הרשאה.
   ============================================================ */

import {
  createMechina, deleteMechina, getMechina, mechinaSummary,
  tenant, slugProblem, suggestSlug, TenantError,
} from "./tenants.js";
import { hashPassword, passwordProblem, USER_RE, normalizeUser } from "./auth.js";

/* ⚠ אימייל נבדק בצורה ולא ברשימת ספקים. כתובת תקינה שנראית
   מוזרה היא כתובת תקינה, וחסימה שלה היא בדיוק הרגע שבו
   לקוח אמיתי מוותר. */
const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function mailProblem(mail, { required = false } = {}) {
  const s = String(mail || "").trim();
  if (!s) return required ? "חסרה כתובת אימייל" : null;
  if (!MAIL_RE.test(s)) return "כתובת האימייל אינה תקינה";
  if (s.length > 200) return "כתובת האימייל ארוכה מדי";
  return null;
}

/**
 * מקים מכינה שלמה: רישום במרשם, אפיון, ראש מכינה וחשבון.
 *
 * ⚠ **מחזיר גם `accountId`** — ההרשמה הציבורית צריכה אותו כדי
 *   לחתום עוגייה ולהכניס את מי שנרשם ישר פנימה. בלי זה הוא
 *   מקבל «נוצר בהצלחה» ואז מסך כניסה, ומקליד שוב את מה שהרגע
 *   הקליד. זה הרגע שבו אנשים נוטשים טופס.
 */
export async function provisionMechina({
  name, slug, preset = "premil",
  headName, username, password, email = null,
  source = "console", requireEmail = false,
}) {
  const cleanName = String(name || "").trim();
  if (!cleanName) throw new TenantError("חסר שם למכינה", 400);
  if (cleanName.length > 80) throw new TenantError("שם המכינה ארוך מ-80 תווים", 400);

  const wanted = String(slug || "").trim() || suggestSlug(cleanName);
  const problem = slugProblem(wanted);
  if (problem) throw new TenantError(problem, 400);

  const head = String(headName || "").trim();
  if (!head) throw new TenantError("חסר שם ראש המכינה", 400);
  if (head.length > 60) throw new TenantError("השם ארוך מ-60 תווים", 400);

  const user = normalizeUser(username);
  if (!USER_RE.test(user)) {
    throw new TenantError("שם המשתמש: אנגלית קטנה, 3–32 תווים", 400);
  }

  const badPass = passwordProblem(password);
  if (badPass) throw new TenantError(badPass, 400);

  const badMail = mailProblem(email, { required: requireEmail });
  if (badMail) throw new TenantError(badMail, 400);

  const entry = createMechina({ slug: wanted, name: cleanName, preset, source });

  /* ⚠ מכאן והלאה המכינה קיימת במרשם — וכל כישלון מוחק אותה
     בחזרה. ראו ההערה בראש הקובץ. */
  let accountId = null;
  try {
    const t = tenant(wanted);
    /* ⚠ שם המכינה נכתב לאפיון **וגם** למרשם. המרשם הוא מה
       שהקונסולה מציגה, והאפיון הוא מה שהאפליקציה מציגה —
       ומכינה שנפתחה בלי שם באפיון מקבלת מסך כניסה בלי שם. */
    t.writeDelta({ preset, identity: { name: cleanName } });

    const person = await t.db.create("person", {
      kind: "staff", name: head, active: true,
      email: email ? String(email).trim() : null,
    });
    const account = await t.db.create("account", {
      person: person.id,
      username: user,
      passwordHash: await hashPassword(password),
      loginEmail: email ? String(email).trim().toLowerCase() : null,
    });
    accountId = account.id;
    await t.db.create("roleAssignment", { person: person.id, role: "head" });
    t.invalidateProfile();
  } catch (e) {
    try { deleteMechina(wanted, { confirm: wanted }); } catch { /* כבר דווח */ }
    throw new TenantError(`המכינה לא נוצרה: ${e.message}`, 500);
  }

  return {
    ok: true,
    slug: wanted,
    accountId,
    url: `/m/${wanted}/`,
    account: { username: user },
    mechina: await mechinaSummary(getMechina(wanted)),
    entry,
  };
}
