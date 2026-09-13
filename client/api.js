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

/* ============================================================
   ⚠⚠ המכינה נקראת מהכתובת, במקום אחד
   ------------------------------------------------------------
   `/m/<slug>/…` → כל קריאה יוצאת ל-`/m/<slug>/api/…`.

   **זה חייב להיגזר מהכתובת ולא להישמר במשתנה.** משתנה
   שנקבע בטעינה היה שורד ניווט בין מכינות באותה לשונית —
   ואז מסך אחד מציג מכינה א׳ ושולח למכינה ב׳. הכתובת היא
   המקום היחיד שאי אפשר שיסתור את עצמו.

   ⚠ הקונסולה (`/api/admin/…`) אינה תחת מכינה כלל, ולכן יש
     לה `callAdmin` נפרדת. פונקציה אחת עם דגל הייתה יוצרת
     בדיוק את הבאג שבו קריאה של הקונסולה נשלחת לתוך מכינה.
   ============================================================ */
const M_RE = /^\/m\/([a-z][a-z0-9-]{1,31})(\/|$)/;

export function currentSlug() {
  const m = M_RE.exec(window.location.pathname);
  return m ? m[1] : null;
}

/** הבסיס לניווט בתוך האפליקציה של המכינה */
export const base = () => {
  const s = currentSlug();
  return s ? `/m/${s}` : "";
};

async function call(path, { method = "GET", body } = {}) {
  const slug = currentSlug();
  if (!slug) {
    /* ⚠ כשל מפורש ולא «אין נתונים»: קריאה של האפליקציה
       מחוץ לנתיב של מכינה היא באג, ולא מצב ריק. */
    const e = new Error("הכתובת אינה של מכינה");
    e.status = 400;
    throw e;
  }
  let res;
  try {
    res = await fetch(`/m/${slug}/api/${path}`, {
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
    /* ⚠⚠ **כישלון כניסה אינו סשן שפג.** בגרסה הראשונה כל 401
       הפעיל את המטפל הגלובלי, ולכן מסך הכניסה הציג את אותה
       הודעה **פעמיים** — פעם כ«הודעה» ופעם כ«שגיאה». מי
       שרואה את זה מסיק שהמערכת שבורה, לא שהסיסמה שגויה. */
    if (!path.startsWith("session/login")) {
      onUnauthorized(data?.error || "הסשן פג");
    }
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

  /* ---- בקשות יציאה ---- */
  requests: () => call("requests/list"),
  requestCreate: (f) => call("requests/create", { method: "POST", body: f }),
  requestUpdate: (f) => call("requests/update", { method: "PUT", body: f }),
  requestDelete: (id) => call("requests/delete", { method: "POST", body: { id } }),
  requestDecide: (id, approve, charge) =>
    call("requests/decide", { method: "POST", body: { id, approve, charge } }),
};

/* ============================================================
   הדלת של הקונסולה
   ------------------------------------------------------------
   ⚠⚠ **נפרדת לגמרי, וגם ה-401 שלה נפרד.** מי שהסשן שלו
     בקונסולה פג אינו «יצא ממכינה» — המטפל הגלובלי של
     האפליקציה אינו אמור להישמע כאן בכלל.
   ============================================================ */
async function callAdmin(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`/api/admin/${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
  } catch {
    const e = new Error("אין חיבור לשרת");
    e.offline = true;
    throw e;
  }

  let data = null;
  try { data = await res.json(); } catch { /* גוף ריק */ }

  if (!res.ok) {
    const e = new Error(data?.error || `שגיאה ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return data;
}

export const admin = {
  state: () => callAdmin("state"),
  setup: (user, password) => callAdmin("setup", { method: "POST", body: { user, password } }),
  login: (user, password) => callAdmin("login", { method: "POST", body: { user, password } }),
  logout: () => callAdmin("logout", { method: "POST" }),

  create: (fields) => callAdmin("create", { method: "POST", body: fields }),
  update: (slug, fields) => callAdmin("update", { method: "PUT", body: { slug, ...fields } }),
  remove: (slug, confirm) => callAdmin("delete", { method: "POST", body: { slug, confirm } }),
  account: (fields) => callAdmin("account", { method: "POST", body: fields }),
  /* ⚠ נקרא **לפני** שפותחים את המכינה, כדי שהכניסה תירשם.
     ראו ההערה ב-server/routes/admin.js. */
  enter: (slug) => callAdmin("enter", { method: "POST", body: { slug } }),
};
