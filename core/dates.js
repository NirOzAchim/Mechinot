/* ============================================================
   תאריכים — במקום אחד
   ------------------------------------------------------------
   ⚠⚠ **אין `new Date()` גולמי לחישוב יום בשום מסלול.** השרת
     רץ ב-UTC, ובלי ההמרה כל דבר שקורה בישראל אחרי 21:00
     (או 22:00 בקיץ) נרשם ליום הבא. זה נראה נכון בבדיקה
     בצהריים ונשבר בערב — ולכן הוא חי חודשים במערכת הקודמת.

   ⚠ **ואזור הזמן מגיע מהאפיון.** «Asia/Jerusalem» הוא ברירת
     מחדל ולא הנחה: מוצר שנמכר למכינה אינו מוצר שמניח מדינה.

   ⚠ הפונקציה הזו ישבה בתוך `routes/attendance.js`, ו-
     `routes/requests.js` ייבא אותה **ממנו** — תלות בין שני
     מסלולים שאין ביניהם שום קשר, שהייתה גדלה עם כל מסלול
     נוסף שצריך תאריך.
   ============================================================ */

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** התאריך של היום, בשעון המכינה. */
export function todayISO(tz = "Asia/Jerusalem") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

/** השעה של עכשיו (0–23), בשעון המכינה. */
export function hourNow(tz = "Asia/Jerusalem") {
  return Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", hour12: false,
  }).format(new Date()));
}

/** ⚠ `null` על קלט שאינו תאריך, ולא נפילה שקטה להיום. */
export const asDate = (s) => (DATE_RE.test(String(s || "")) ? String(s) : null);

/** התאריך של המכינה מתוך `?date=`, או היום. */
export const dateOr = (s, tz) => asDate(s) || todayISO(tz);
