/* ============================================================
   כניסה, יציאה, ומי אני
   ------------------------------------------------------------
   ⚠ **אותה הודעה לכל כישלון כניסה.** «שם משתמש לא קיים»
     ו«סיסמה שגויה» הם שני מסלולים שהופכים את הטופס למנוע
     בדיקה של מי רשום במכינה.

   ⚠ **«אינו פעיל» כן מקבל הודעה נפרדת** — זו תקלה תפעולית
     שצריך לדעת לפנות איתה למישהו — אבל **רק אחרי** שהסיסמה
     אומתה. אחרת גם היא מנוע בדיקה.

   ⚠ **השהיה גוברת על ניסיונות כושלים**, לפי שם משתמש. בלעדיה
     שמונה תווים הם מיליארד ניחושים בשעה.
   ============================================================ */

import {
  verifyPassword, normalizeUser, sign, setCookie, clearCookie, screensOf, AuthError,
} from "../auth.js";
import { t } from "../../core/vocab.js";

const BAD = "שם המשתמש או הסיסמה שגויים";

/* ⚠ בזיכרון התהליך ובמכוון: זו האטה, לא אכיפה. מי שמפעיל
   מחדש את השרת מאפס אותה, וזה מחיר מקובל מול מסד שנכתב
   בכל ניסיון כושל.

   ⚠⚠ **המפתח כולל את המכינה.** זו המפה היחידה שנשארה ברמת
     המודול, וזה נכון — היא שייכת לתהליך ולא למכינה. אבל
     מפתח שהוא שם המשתמש לבדו הופך ניחושים במכינה אחת
     להשהיה על אדם במכינה אחרת, ששם משתמש כמו `menahel`
     חוזר בכל אחת מהן. */
const fails = new Map();
const keyOf = (slug, u) => `${slug}\u0000${u}`;
const delayFor = (k) => Math.min(2000, (fails.get(k) || 0) * 250);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function login({ db, body, res, profile, tenant }) {
  const user = normalizeUser(body?.user);
  const password = String(body?.password || "");

  /* ⚠ **אותו סוג שגיאה ואותו קוד** כמו כל כישלון אחר. החזרת
     אובייקט כאן במקום זריקה נתנה 200 על כניסה כושלת. */
  if (!user || !password) throw new AuthError(BAD, 401);

  const key = keyOf(tenant.slug, user);
  await wait(delayFor(key));

  const account = await db.find("account", { username: user })
    || await db.find("account", { loginEmail: user });

  const ok = account && await verifyPassword(password, account.passwordHash);
  if (!ok) {
    fails.set(key, (fails.get(key) || 0) + 1);
    /* ⚠ **אותה הודעה ואותו קוד בשני המסלולים** — משתמש שאינו
       קיים וסיסמה שגויה חייבים להיראות זהים לחלוטין. */
    throw new AuthError(BAD, 401);
  }

  const person = await db.get("person", account.person);
  if (!person || person.active === false) {
    /* ⚠ הודעה נפרדת — זו תקלה תפעולית — אבל **רק אחרי**
       שהסיסמה אומתה. אחרת גם היא מנוע בדיקה. */
    throw new AuthError("החשבון אינו פעיל. יש לפנות לראש המכינה", 403);
  }

  fails.delete(key);
  await db.update("account", account.id, { lastLogin: new Date().toISOString() });

  /* ⚠⚠ **ה-slug נחתם לתוך האסימון.** מזהי החשבונות רצים בכל
     מכינה בנפרד, ולכן עוגייה בלי מכינה הייתה מזהה במכינה
     אחרת חשבון אחר לגמרי — אדם שאיש לא התכוון אליו. */
  setCookie(res, sign({ tenant: tenant.slug, account: account.id }), tenant.slug);

  const roles = (await db.list("roleAssignment", { where: { person: person.id } }))
    .map((r) => r.role);

  return {
    ok: true,
    name: person.name,
    kind: person.kind,
    roles,
    screens: screensOf(profile, { roles }),
  };
}

export async function logout({ res, tenant }) {
  clearCookie(res, tenant.slug);
  return { ok: true };
}

/**
 * ⚠ מחזיר `user: null` ולא 401 — זו השאלה «האם אני מחובר»,
 *   ותשובת שגיאה עליה הופכת כל טעינת דף לרעש בקונסול.
 */
export async function me({ user, profile, db }) {
  if (!user) return { user: null };

  /* ⚠ מנהל-על אינו אדם במכינה — `personId` הוא null, ולכן
     `db.get` היה זורק. הוא מוחזר במפורש כמי שהוא. */
  const person = user.personId ? await db.get("person", user.personId) : null;
  return {
    user: {
      name: user.name,
      kind: user.kind,
      roles: user.roles,
      roleLabels: user.roles.map((r) =>
        (profile.roles || []).find((x) => x.slug === r)?.label || r),
      screens: screensOf(profile, user),
      viewOnly: user.viewOnly,
      isStaff: user.isStaff,
      /* ⚠ כינוי המשתמש בשפת המכינה — «חניך» או «תלמיד» */
      kindLabel: t(profile, `person.${user.kind}`),
      /* ⚠⚠ **המסך חייב לדעת.** מי שנכנס כמנהל-על ואינו רואה
         זאת ישכח שהוא בו, ויערוך נתונים אמיתיים בטוח שהוא
         בדמו. ראו ההערה ב-server/auth.js. */
      isRoot: Boolean(user.isRoot),
      rootUser: user.rootUser || null,
    },
    person: person ? { id: person.id, name: person.name } : null,
  };
}
