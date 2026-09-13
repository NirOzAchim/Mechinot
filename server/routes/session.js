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
  verifyPassword, normalizeUser, sign, setCookie, clearCookie, AuthError,
} from "../auth.js";
import { screensFor, t } from "../../core/vocab.js";

const BAD = "שם המשתמש או הסיסמה שגויים";

/* ⚠ בזיכרון התהליך ובמכוון: זו האטה, לא אכיפה. מי שמפעיל
   מחדש את השרת מאפס אותה, וזה מחיר מקובל מול מסד שנכתב
   בכל ניסיון כושל. */
const fails = new Map();
const delayFor = (u) => Math.min(2000, (fails.get(u) || 0) * 250);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function login({ db, body, res, profile }) {
  const user = normalizeUser(body?.user);
  const password = String(body?.password || "");

  /* ⚠ **אותו סוג שגיאה ואותו קוד** כמו כל כישלון אחר. החזרת
     אובייקט כאן במקום זריקה נתנה 200 על כניסה כושלת. */
  if (!user || !password) throw new AuthError(BAD, 401);

  await wait(delayFor(user));

  const account = await db.find("account", { username: user })
    || await db.find("account", { loginEmail: user });

  const ok = account && await verifyPassword(password, account.passwordHash);
  if (!ok) {
    fails.set(user, (fails.get(user) || 0) + 1);
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

  fails.delete(user);
  await db.update("account", account.id, { lastLogin: new Date().toISOString() });

  setCookie(res, sign({ account: account.id }));

  const roles = (await db.list("roleAssignment", { where: { person: person.id } }))
    .map((r) => r.role);

  return {
    ok: true,
    name: person.name,
    kind: person.kind,
    roles,
    screens: screensFor(profile, roles),
  };
}

export async function logout({ res }) {
  clearCookie(res);
  return { ok: true };
}

/**
 * ⚠ מחזיר `user: null` ולא 401 — זו השאלה «האם אני מחובר»,
 *   ותשובת שגיאה עליה הופכת כל טעינת דף לרעש בקונסול.
 */
export async function me({ user, profile, db }) {
  if (!user) return { user: null };

  const person = await db.get("person", user.personId);
  return {
    user: {
      name: user.name,
      kind: user.kind,
      roles: user.roles,
      roleLabels: user.roles.map((r) =>
        (profile.roles || []).find((x) => x.slug === r)?.label || r),
      screens: screensFor(profile, user.roles),
      viewOnly: user.viewOnly,
      isStaff: user.isStaff,
      /* ⚠ כינוי המשתמש בשפת המכינה — «חניך» או «תלמיד» */
      kindLabel: t(profile, `person.${user.kind}`),
    },
    person: person ? { id: person.id, name: person.name } : null,
  };
}
