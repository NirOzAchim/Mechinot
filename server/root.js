/* ============================================================
   מנהל-על — הזהות שמנהלת את כל המכינות
   ------------------------------------------------------------
   ⚠⚠ **זו זהות נפרדת לחלוטין, ולא «משתמש עם דגל».** היא
     יושבת בקובץ משלה מחוץ למסד של כל מכינה, ולכן אין שום
     שאילתה בשום מכינה שיכולה להחזיר אותה, ואין עמודה
     שמישהו יכול לסמן כדי להפוך את עצמו למנהל-על.

     לו זו הייתה שורה במסד של מכינה כלשהי, ראש המכינה
     ההיא היה יכול — בטעות או לא — לתת לעצמו גישה לכל
     שאר המכינות. הפרדה בקובץ היא הגבול שאי אפשר לחצות
     מבפנים.

   ⚠⚠ **עוגייה נפרדת בשם נפרד.** `mx_root` לצד `mx_session`.
     עוגייה אחת שנושאת שני סוגי זהות היא בדיוק המקום שבו
     באג אחד הופך משתמש רגיל למנהל-על.

   ⚠ **אין הרשמה עצמית ואין «שכחתי סיסמה».** החשבון נוצר
     בשרת בפקודה (`npm run root`). מנוע איפוס למנהל-על הוא
     משטח התקפה שכל תכליתו לחסוך פקודה אחת.

   ⚠ **הסיסמה אינה נשמרת** — scrypt, בדיוק כמו כל משתמש.
     מי שיפתח את `.data/root.json` יראה מחרוזת חסרת פשר.
   ============================================================ */

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import crypto from "node:crypto";

import { DATA_DIR } from "./tenants.js";
import { hashPassword, verifyPassword, sign, unsign, USER_RE, normalizeUser } from "./auth.js";

const ROOT_FILE = join(DATA_DIR, "root.json");
const COOKIE = "mx_root";
/* ⚠ קצר מסשן של מכינה (7 ימים): מפתח לכל הלקוחות אינו
   אמור לשבת פתוח בדפדפן שבוע. */
const TTL_HOURS = 12;

export function rootExists() {
  return existsSync(ROOT_FILE);
}

export function readRoot() {
  if (!existsSync(ROOT_FILE)) return null;
  try { return JSON.parse(readFileSync(ROOT_FILE, "utf8")); }
  catch (e) {
    /* ⚠ קובץ פגום אינו «אין מנהל-על» — זריקה, כדי שלא
       ייווצר חשבון שני על גבי אחד שקיים. */
    throw new Error(`קובץ מנהל-העל פגום: ${ROOT_FILE} — ${e.message}`);
  }
}

export async function writeRoot({ username, password }) {
  const user = normalizeUser(username);
  if (!USER_RE.test(user)) {
    throw new Error("שם המשתמש חייב להיות באנגלית קטנה, 3–32 תווים");
  }
  const rec = {
    username: user,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  mkdirSync(dirname(ROOT_FILE), { recursive: true });
  const tmp = ROOT_FILE + ".tmp";
  writeFileSync(tmp, JSON.stringify(rec, null, 2), "utf8");
  renameSync(tmp, ROOT_FILE);
  return { username: user };
}

/* ============================================================
   כניסה
   ⚠ **אותה הודעה לכל כישלון**, כמו בכל כניסה במערכת. כאן
     זה חשוב כפליים: טופס שמבדיל בין «אין משתמש כזה» לבין
     «סיסמה שגויה» מגלה מהו שם המשתמש של מנהל-העל.
   ============================================================ */
export async function rootLogin(username, password) {
  const rec = readRoot();
  const user = normalizeUser(username);

  /* ⚠ גם כשאין חשבון כלל — מבזבזים את אותו זמן חישוב.
     תשובה מהירה על «אין קובץ» היא עצמה אינדיקציה. */
  const stored = rec?.passwordHash
    || "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  const okPass = await verifyPassword(password, stored);

  if (!rec || user !== rec.username || !okPass) return null;
  return { username: rec.username };
}

/* ============================================================
   העוגייה
   ============================================================ */
export function signRoot(username) {
  return sign({ root: true, user: username }, TTL_HOURS * 3600_000);
}

export function readRootCookie(req) {
  const raw = req.headers?.cookie || "";
  const hit = raw.split(";").map((s) => s.trim())
    .find((s) => s.startsWith(COOKIE + "="));
  return hit ? decodeURIComponent(hit.slice(COOKIE.length + 1)) : null;
}

export function setRootCookie(res, token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie",
    `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL_HOURS * 3600}${secure}`);
}

export function clearRootCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

/**
 * מי מנהל-העל בבקשה הזו — או `null`.
 *
 * ⚠⚠ **הזהות נבדקת מול הקובץ בכל בקשה ולא רק מול החתימה.**
 *   מי שמחליף את שם המשתמש או מוחק את הקובץ מנתק מיד כל
 *   סשן פתוח, וזו הפעולה שעושים כשחוששים.
 */
export function currentRoot(req) {
  const p = unsign(readRootCookie(req));
  if (!p?.root || !p.user) return null;
  let rec = null;
  try { rec = readRoot(); } catch { return null; }
  if (!rec || rec.username !== p.user) return null;
  return { username: rec.username };
}

export class RootError extends Error {
  constructor(message, status = 401) { super(message); this.status = status; }
}

/**
 * שער הקונסולה.
 * ⚠ **404 ולא 401 על נתיב הקונסולה כשאין מנהל-על מחובר?**
 *   לא. 401 הוא הנכון כאן: הקונסולה אינה סוד — היא כתובת
 *   שמוגנת בסיסמה, וכל שאר המערכת מתנהגת כך. 404 היה מסתיר
 *   ממני עצמי שהיא קיימת ביום שאשכח את הסיסמה.
 */
export function rootGuard(handler) {
  return async (ctx) => {
    if (!ctx.root) throw new RootError("הקונסולה שמורה למנהל-העל");
    return handler(ctx);
  };
}

/** מזהה חד-פעמי ליומן הכניסות — בלי תלות חיצונית */
export const stamp = () => crypto.randomBytes(6).toString("hex");
