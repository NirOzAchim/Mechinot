/* ============================================================
   אימות — סיסמאות, עוגייה חתומה, והרשאות
   ------------------------------------------------------------
   ⚠⚠ **הסיסמה אינה נשמרת בשום מקום.** מה שיושב במסד הוא
     תוצאת scrypt עם מלח אקראי לכל משתמש. מי שיפתח את המסד —
     כולל מנהל המכינה, כולל מפתח — רואה מחרוזת חסרת פשר.

   ⚠ scrypt ולא SHA: גיבוב מהיר נשבר במיליארד ניחושים לשנייה.
     ההשוואה ב-`timingSafeEqual`. הפרמטרים נשמרים **בתוך**
     המחרוזת, כדי שאפשר יהיה לחזק אותם בלי לפסול סיסמאות
     קיימות.

   ⚠ **אותה הודעה לכל כישלון כניסה.** «שם משתמש לא קיים»
     ו«סיסמה שגויה» הופכים את הטופס למנוע בדיקה של מי רשום.

   ⚠ **הסשן הוא עוגייה חתומה ולא רשומה במסד.** כך אין קריאה
     למסד בכל בקשה רק כדי לזהות, והשרת נשאר חסר-מצב.
     המחיר: שינוי הרשאה נכנס לתוקף בכניסה הבאה — ולכן
     `active` נבדק מול המסד בכל בקשה, וכיבויו מנתק מיד.
   ============================================================ */

import crypto from "node:crypto";
import { screensFor } from "../core/vocab.js";

const COOKIE = "mx_session";
const TTL_DAYS = 7;
const N = 16384, R = 8, P = 1, KEYLEN = 32;

const scrypt = (pw, salt, keylen, opts) =>
  new Promise((res, rej) =>
    crypto.scrypt(pw, salt, keylen, opts, (e, k) => (e ? rej(e) : res(k))));

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(String(password), salt, KEYLEN, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password, stored) {
  try {
    const parts = String(stored || "").split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const [, n, r, p, salt, hash] = parts;
    const got = await scrypt(String(password), Buffer.from(salt, "base64"),
      Buffer.from(hash, "base64").length, { N: +n, r: +r, p: +p });
    const want = Buffer.from(hash, "base64");
    if (got.length !== want.length) return false;
    return crypto.timingSafeEqual(got, want);
  } catch {
    return false;
  }
}

/** ⚠ אורך בלבד. כללי מורכבות מייצרים `Aa123456!` אצל כולם. */
export function passwordProblem(pw) {
  const s = String(pw || "");
  if (s.length < 8) return "הסיסמה חייבת להיות באורך 8 תווים לפחות";
  if (/^\d+$/.test(s)) return "סיסמה שכולה ספרות נשברת מיד";
  const common = ["12345678", "password", "qwertyui", "abcd1234"];
  if (common.includes(s.toLowerCase())) return "הסיסמה הזו מנוחשת ראשונה";
  return null;
}

export const USER_RE = /^[a-z0-9._-]{3,32}$/;
export const normalizeUser = (raw) => String(raw || "").trim().toLowerCase();

/* ---------- עוגייה חתומה ---------- */
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET חסר או קצר מ-32 תווים");
  return s;
}
const b64 = (b) => Buffer.from(b).toString("base64url");
const mac = (d) => b64(crypto.createHmac("sha256", secret()).update(d).digest());

export function sign(payload, ttlMs = TTL_DAYS * 864e5) {
  const body = b64(JSON.stringify({ ...payload, exp: Date.now() + ttlMs }));
  return `${body}.${mac(body)}`;
}

export function unsign(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const want = mac(body);
  if (sig.length !== want.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

export const readCookie = (req) => {
  const raw = req.headers?.cookie || "";
  const hit = raw.split(";").map((s) => s.trim())
    .find((s) => s.startsWith(COOKIE + "="));
  return hit ? decodeURIComponent(hit.slice(COOKIE.length + 1)) : null;
};

/* ============================================================
   ⚠⚠ העוגייה מוגבלת לנתיב של המכינה
   ------------------------------------------------------------
   `Path=/m/<slug>` — הדפדפן אפילו לא שולח אותה למכינה אחרת.
   זו ההגנה הראשונה, והיא גם מה שמאפשר להיות מחובר לשתי
   מכינות בשתי לשוניות: בדיוק מה שמנהל-על צריך.

   ⚠ **וההגנה השנייה היא ש-`slug` יושב בתוך האסימון החתום.**
     מזהי החשבונות רצים בכל מכינה בנפרד («1001», «1002»…),
     ולכן עוגייה של מכינה א׳ שתגיע למכינה ב׳ הייתה מזהה
     שם **חשבון אחר לגמרי** — אדם שאיש לא התכוון אליו.
     שתי ההגנות נחוצות: הראשונה היא התנהגות דפדפן, והשנייה
     היא מה שהשרת בודק בעצמו.
   ============================================================ */
export const cookiePath = (slug) => `/m/${slug}`;

export function setCookie(res, token, slug) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie",
    `${COOKIE}=${encodeURIComponent(token)}; Path=${cookiePath(slug)}; HttpOnly; SameSite=Lax; Max-Age=${TTL_DAYS * 86400}${secure}`);
}

export function clearCookie(res, slug) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie",
    `${COOKIE}=; Path=${cookiePath(slug)}; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

/* ============================================================
   מי המשתמש — נקרא בכל בקשה
   ⚠ הזהות מגיעה מהעוגייה, **אף פעם לא מגוף הבקשה.**
   ============================================================ */
export async function currentUser(req, tenant, root = null) {
  const p = unsign(readCookie(req));

  /* ⚠⚠ **אסימון של מכינה אחרת אינו סשן — הוא כלום.**
     בלי השורה הזו, עוגייה שנשלחה (בטעות או בכוונה) לנתיב
     של מכינה אחרת הייתה נקראת שם כמזהה חשבון מקומי. */
  if (p?.account && p.tenant === tenant.slug) {
    const account = await tenant.db.get("account", p.account);
    if (account) {
      const person = await tenant.db.get("person", account.person);
      /* ⚠ נבדק בכל בקשה: כיבוי `active` מנתק מיד ולא בכניסה הבאה. */
      if (person && person.active !== false) {
        const roles = (await tenant.db.list("roleAssignment", { where: { person: person.id } }))
          .map((r) => r.role);
        return {
          accountId: account.id,
          personId: person.id,
          name: person.name,
          kind: person.kind,
          roles,
          viewOnly: Boolean(account.viewOnly),
          isStaff: person.kind === "staff",
          isRoot: false,
        };
      }
    }
  }

  /* ============================================================
     ⚠⚠⚠ מנהל-על בתוך מכינה
     ------------------------------------------------------------
     הקונסולה חייבת דרך להיכנס לאפליקציה של מכינה — אחרת
     «תמיכה» פירושה לבקש ממנהל המכינה את הסיסמה שלו, וזה
     גרוע בהרבה מכל דבר שכתוב כאן.

     שלוש החלטות שמחזיקות את זה:

     1. **הוא אינו מתחזה לאדם.** `personId` הוא `null`, השם
        הוא «מנהל-על», ושום שורה בלוח לא תיחתם בשמו של מישהו
        אחר. מערכת שבה התמיכה נכנסת כ«דוד» מייצרת יומן
        שמשקר על מי עשה מה.

     2. **זה נראה במסך.** האפליקציה מציגה רצועה קבועה. מי
        שלא רואה שהוא במצב הזה ישכח שהוא בו, ויערוך נתונים
        אמיתיים בטוחים שהוא ב«דמו».

     3. **זה נרשם.** הכניסה נחתמת ביומן שהקונסולה מציגה.
        ⚠ ומה שעדיין חסר, ונאמר במפורש: **המכינה עצמה אינה
        רואה את היומן הזה.** ביום שיהיה לקוח משלם זו דרישה
        ולא נחמדות, והמקום היחיד לתקן הוא כאן.
     ============================================================ */
  if (root) {
    return {
      accountId: null,
      personId: null,
      name: "מנהל-על",
      kind: "staff",
      roles: [],
      viewOnly: false,
      isStaff: true,
      isRoot: true,
      rootUser: root.username,
    };
  }

  return null;
}

/**
 * אילו מסכים פתוחים למשתמש הזה.
 *
 * ⚠⚠ **המקום היחיד שמכריע.** ארבעה קוראים שואלים את השאלה
 *   הזו — השער, הניווט, הכניסה ו-`me` — וכל אחד מהם שחישב
 *   אותה בעצמו היה מתפצל ביום שנוסף מקרה. זה בדיוק הלקח של
 *   «מסך של בעל תפקיד זהה למסך של המנהל»: שתי מעטפות שבנו
 *   את הניווט בנפרד, ושתיהן «עבדו».
 *
 * ⚠ **מנהל-על מקבל `*`** — הוא אינו נושא תפקידים במכינה, ובלי
 *   השורה הזו הוא היה נכנס למכינה ומקבל תפריט **ריק**: גישה
 *   מלאה בשרת, ואפס מסכים במסך.
 */
export function screensOf(profile, user) {
  if (!user) return [];
  if (user.isRoot) return ["*"];
  return screensFor(profile, user.roles);
}

export class AuthError extends Error {
  constructor(message, status = 401) { super(message); this.status = status; }
}

/**
 * שער אחד לכל נקודת קצה.
 *
 * ⚠ **`viewOnly` נאכף כאן ולא בכל מסלול בנפרד** — כל בקשה
 *   שאינה GET נדחית. יש עשרות מסלולי כתיבה, ומי שיוסיף את
 *   הבא לא יזכור להוסיף בדיקה. מסלול שייכתב מחר מוגן מעצמו.
 *
 * ⚠ `screen` נבדק מול הפרופיל — כלומר ההרשאה נגזרת מהאפיון
 *   של המכינה ולא מרשימה בקוד.
 */
export function guard(handler, { screen = null, staffOnly = false } = {}) {
  return async (ctx) => {
    const { user, req } = ctx;
    if (!user) throw new AuthError("יש להתחבר");

    /* ⚠ מנהל-על עובר את שער המסכים ו**אינו** עובר את
       `viewOnly` — הוא פשוט לעולם אינו כזה. */
    if (user.isRoot) return handler(ctx);

    if (user.viewOnly && req.method !== "GET") {
      throw new AuthError("החשבון שלך בצפייה בלבד", 403);
    }
    if (staffOnly && !user.isStaff) {
      throw new AuthError("הפעולה שמורה לצוות", 403);
    }
    if (screen) {
      const allowed = screensOf(ctx.profile, user);
      if (!allowed.includes("*") && !allowed.includes(screen)) {
        throw new AuthError("אין לך גישה למסך הזה", 403);
      }
    }
    return handler(ctx);
  };
}
