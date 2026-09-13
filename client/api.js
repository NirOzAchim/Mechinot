/* ============================================================
   הדלת היחידה לשרת
   ------------------------------------------------------------
   ⚠⚠ **אין `fetch` בשום מקום אחר ב-client/.** במערכת הקודמת
     כתובות היו מפוזרות בכמה קבצים, וכשנקודות הקצה אוחדו הן
     לא עודכנו — הקטלוג חזר ריק, והמסך נראה בדיוק כמו מחסן
     ריק. הבאג חי יומיים בייצור.

   ⚠ **401 מטופל במקום אחד.** מי שהסשן שלו פג מוחזר למסך
     הכניסה עם הסבר, ולא מקבל מסך שבור. עקיפת השכבה מאבדת
     גם את זה.

   ⚠ **כשל רשת נבדל מ«אין נתונים».** `ok:false` עם סיבה, ולא
     מערך ריק — משתמש חייב לדעת שהחיבור נכשל ולא לחשוב
     שהמכינה ריקה.
   ============================================================ */

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function call(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`/api/${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
  } catch {
    /* ⚠ זו הבחנה שעולה כסף לאבד: הרשת נפלה, ולא «אין נתונים». */
    const e = new Error("אין חיבור לשרת");
    e.offline = true;
    throw e;
  }

  let data = null;
  try { data = await res.json(); } catch { /* גוף ריק */ }

  if (res.status === 401) {
    onUnauthorized(data?.error || "הסשן פג");
    const e = new Error(data?.error || "יש להתחבר");
    e.status = 401;
    throw e;
  }

  if (!res.ok) {
    const e = new Error(data?.error || `שגיאה ${res.status}`);
    e.status = res.status;
    e.detail = data?.detail;
    throw e;
  }
  return data;
}

export const api = {
  /* ---- סשן ---- */
  publicProfile: () => call("profile/public"),
  me: () => call("session/me"),
  login: (user, password) => call("session/login", { method: "POST", body: { user, password } }),
  logout: () => call("session/logout", { method: "POST" }),

  /* ---- ניווט ----
     ⚠ נבנה בשרת. המסך אינו מחשב מה מותר לו — ראו server/routes/nav.js. */
  nav: () => call("nav"),

  /* ---- אפיון ---- */
  profile: () => call("profile/full"),
  saveProfile: (profile) => call("profile/update", { method: "PUT", body: { profile } }),

  /* ---- הסטודיו ---- */
  studio: () => call("studio/state"),
  studioSave: (step, fields) => call("studio/save", { method: "PUT", body: { step, ...fields } }),
  /* ⚠ שני מסלולים נפרדים ולא דגל: preview אינו כותב דבר. */
  importPreview: (kind, text) => call("studio/preview", { method: "POST", body: { kind, text } }),
  importCommit: (kind, text) => call("studio/commit", { method: "POST", body: { kind, text } }),
  invite: (person, username) => call("studio/invite", { method: "POST", body: { person, username } }),

  /* ---- אנשים ---- */
  people: (kind = "student") => call(`people/list?kind=${encodeURIComponent(kind)}`),
  myProfile: () => call("people/me"),

  summary: () => call("attendance/summary"),

  /* ---- נוכחות ---- */
  day: (date) => call(`attendance/day${date ? `?date=${date}` : ""}`),
  /* ⚠ מצב רצוי ולא «הפוך» — שניים שמסמנים יחד מקבלים אותה
     תוצאה. ראו ההערה ב-server/routes/attendance.js. */
  mark: (date, marks) => call("attendance/mark", { method: "POST", body: { date, marks } }),
};
