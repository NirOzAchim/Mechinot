/* ============================================================
   האייקונים
   ------------------------------------------------------------
   ⚠⚠ **SVG ולא אמוג׳י.** אמוג׳י נראה אחרת בכל מערכת הפעלה,
     אינו מקבל את צבע הטקסט, אינו מתיישר על קו הבסיס, ומכריז
     על עצמו כקישוט. זה ההבדל הגדול ביותר בין ממשק שנראה
     מקצועי לבין ממשק שנראה מורכב מחלקים.

   ⚠ **קו אחיד של 1.6 ופינות מעוגלות.** ערבוב עוביים ומילויים
     הוא מה שגורם לסט אייקונים להיראות כמו אוסף ולא כמו
     משפחה. `currentColor` תמיד — האייקון יורש את צבע ההקשר,
     ולכן אותו אייקון עובד על רקע בהיר, על כפתור כהה ובתוך
     תגית.

   ⚠ **`viewBox` אחיד 24 וגודל דרך CSS.** אייקון שמוגדר
     בפיקסלים בכל שימוש מתפצל, ואז שורה אחת נראית מיושרת
     ואחרת לא.

   ⚠ אין כאן תלות חיצונית. ספריית אייקונים היא 300KB עבור
     שלושים צורות.
   ============================================================ */

import React from "react";

const I = ({ children, size = 20, ...rest }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
    stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" focusable="false" {...rest}>
    {children}
  </svg>
);

/* ---------- ניווט ומבנה ---------- */
export const Home = (p) => <I {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9.5 20v-5.5h5V20" /></I>;
export const Grid = (p) => <I {...p}><rect x="3" y="3" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" /></I>;
export const Menu = (p) => <I {...p}><path d="M4 7h16M4 12h16M4 17h16" /></I>;
export const Close = (p) => <I {...p}><path d="M6 6l12 12M18 6L6 18" /></I>;
/* ⚠⚠ **שמות לפי כיוון הקריאה ולא לפי כיוון הציור.** בממשק
   RTL «להיכנס» הוא שברון ש**פונה שמאלה**, ו«לחזור» פונה
   ימינה — ההפך מלטינית. שמות כמו Back/Fwd לפי הצורה גרמו
   לכל חץ ברשימה להצביע חזרה אל הטקסט שלו, וזה נראה כמו
   כפתור חזרה על כל שורה.
   ⚠ מי שיוסיף ממשק LTR יחליף כאן שתי שורות ולא שלושים
     שימושים. */
export const Enter = (p) => <I {...p}><path d="M15 5l-7 7 7 7" /></I>;
export const Leave = (p) => <I {...p}><path d="M9 5l7 7-7 7" /></I>;
export const Down = (p) => <I {...p}><path d="M5 9l7 7 7-7" /></I>;
export const Up = (p) => <I {...p}><path d="M19 15l-7-7-7 7" /></I>;
export const More = (p) => <I {...p}><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></I>;

/* ---------- אנשים ---------- */
export const People = (p) => <I {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.2 2.7-5 6-5s6 1.8 6 5" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6" /><path d="M17.5 15.3c2.1.6 3.5 2.1 3.5 4.7" /></I>;
export const Person = (p) => <I {...p}><circle cx="12" cy="8" r="3.4" /><path d="M5 20c0-3.4 3-5.4 7-5.4s7 2 7 5.4" /></I>;
export const Shield = (p) => <I {...p}><path d="M12 3l7 3v5.5c0 4.3-2.9 8-7 9.5-4.1-1.5-7-5.2-7-9.5V6z" /><path d="M9.3 12l1.9 1.9 3.5-3.8" /></I>;

/* ---------- זמן ---------- */
export const Calendar = (p) => <I {...p}><rect x="3.5" y="5" width="17" height="16" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></I>;
export const Check = (p) => <I {...p}><path d="M5 12.5l4.5 4.5L19 7" /></I>;
export const Clock = (p) => <I {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></I>;
export const Plane = (p) => <I {...p}><path d="M10.5 3.5a1.5 1.5 0 0 1 3 0V9l7 4v2.2l-7-2v3.9l2.2 1.7v1.7L12 19.4l-3.7 1.1v-1.7L10.5 17v-3.9l-7 2V13l7-4z" /></I>;

/* ---------- תוכן ---------- */
export const Book = (p) => <I {...p}><path d="M4 4.5h6a2.5 2.5 0 0 1 2 2.5 2.5 2.5 0 0 1 2-2.5h6v13h-6a2.5 2.5 0 0 0-2 2.5 2.5 2.5 0 0 0-2-2.5H4z" /></I>;
export const Star = (p) => <I {...p}><path d="M12 3.8l2.6 5.3 5.8.85-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.85z" /></I>;
export const Box = (p) => <I {...p}><path d="M12 3l8 4v10l-8 4-8-4V7z" /><path d="M4 7l8 4 8-4M12 11v10" /></I>;
export const Cart = (p) => <I {...p}><path d="M3 4h2.2l2.3 11h10l2.2-8H6.2" /><circle cx="9.5" cy="19" r="1.5" /><circle cx="17.5" cy="19" r="1.5" /></I>;
export const Bowl = (p) => <I {...p}><path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z" /><path d="M12 11c0-2 2-2.4 2-4s-2-2-2-4" /><path d="M5 21h14" /></I>;
export const Coin = (p) => <I {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v9M14.5 9.6c-.6-.8-1.5-1.1-2.5-1.1-1.4 0-2.5.7-2.5 1.9s1 1.6 2.5 1.9 2.5.7 2.5 1.9-1.1 1.9-2.5 1.9c-1 0-1.9-.3-2.5-1.1" /></I>;
export const Broom = (p) => <I {...p}><path d="M15.5 3.5l5 5" /><path d="M13.5 5.5l5 5-6 2-5-5z" /><path d="M7.5 12.5l-4 8 8-4" /></I>;
export const Wrench = (p) => <I {...p}><path d="M15.5 3a5.5 5.5 0 0 0-4.6 8.5L3 19.4 4.6 21l7.9-7.9A5.5 5.5 0 1 0 15.5 3z" /><circle cx="16" cy="8" r="2.2" /></I>;
export const Flag = (p) => <I {...p}><path d="M5.5 21V4" /><path d="M5.5 5h12l-2.2 4 2.2 4h-12" /></I>;
export const Board = (p) => <I {...p}><rect x="3.5" y="4.5" width="17" height="13" rx="2.5" /><path d="M8 21l4-3.5 4 3.5M8 9h8M8 13h5" /></I>;
export const Chart = (p) => <I {...p}><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16.5V12M12.5 16.5V7M17 16.5v-6" /></I>;
export const Doc = (p) => <I {...p}><path d="M6 3.5h7l5 5V20.5H6z" /><path d="M13 3.5v5h5M9 13h6M9 16.5h4" /></I>;
export const Wash = (p) => <I {...p}><rect x="4.5" y="3" width="15" height="18" rx="3" /><circle cx="12" cy="14" r="4" /><path d="M8 6.5h3" /></I>;
export const Quote = (p) => <I {...p}><path d="M9.5 6C7 7 5.5 9.2 5.5 12v6h6v-6h-3c0-2 .8-3.3 2.4-4.2z" /><path d="M18.5 6C16 7 14.5 9.2 14.5 12v6h6v-6h-3c0-2 .8-3.3 2.4-4.2z" /></I>;
export const Rocket = (p) => <I {...p}><path d="M13.5 3.5c3.5 0 7 3.5 7 7 0 0-2 5-6 8l-4-4c3-4 8-6 8-6" /><path d="M10.5 14.5l-4-4c-2 1-3 3-3 3l2.5.8.7 2.5s2-1 3-3z" /><circle cx="15" cy="9" r="1.6" /></I>;
export const Bell = (p) => <I {...p}><path d="M12 3.5a5.5 5.5 0 0 0-5.5 5.5c0 5-2 6.5-2 6.5h15s-2-1.5-2-6.5A5.5 5.5 0 0 0 12 3.5z" /><path d="M10.3 19a2 2 0 0 0 3.4 0" /></I>;

/* ---------- פעולות ---------- */
export const Plus = (p) => <I {...p}><path d="M12 5v14M5 12h14" /></I>;
export const Minus = (p) => <I {...p}><path d="M5 12h14" /></I>;
export const Edit = (p) => <I {...p}><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="M15 5.5l3.5 3.5" /></I>;
export const Trash = (p) => <I {...p}><path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l1 13h9l1-13" /><path d="M10.5 10v6M13.5 10v6" /></I>;
export const Search = (p) => <I {...p}><circle cx="11" cy="11" r="6.5" /><path d="M15.8 15.8L20.5 20.5" /></I>;
export const Filter = (p) => <I {...p}><path d="M4 5.5h16l-6.2 7v6l-3.6 2v-8z" /></I>;
export const Upload = (p) => <I {...p}><path d="M12 16V4" /><path d="M7.5 8.5L12 4l4.5 4.5" /><path d="M4.5 15v4a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-4" /></I>;
export const Gear = (p) => <I {...p}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7h-.3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z" /></I>;
export const Logout = (p) => <I {...p}><path d="M14 8V5.5A1.5 1.5 0 0 0 12.5 4h-7A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20h7a1.5 1.5 0 0 0 1.5-1.5V16" /><path d="M9 12h11M17 9l3 3-3 3" /></I>;
export const Info = (p) => <I {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.8v.4" /></I>;
export const Warn = (p) => <I {...p}><path d="M12 3.8L21 19.5H3z" /><path d="M12 9.5v4.5M12 17v.4" /></I>;
export const Sparkle = (p) => <I {...p}><path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7L12 16.5l-1.7-4.8-4.8-1.7 4.8-1.7z" /><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></I>;

/* ============================================================
   מפת המסכים → אייקון
   ⚠⚠ **מפה אחת, ולא אייקון שנבחר בכל מסך.** שתי רשימות
     מקבילות מתפצלות בתיקון הראשון, ואז אותו מסך מקבל אייקון
     אחד בניווט ואחר בכרטיס.
   ⚠ **מסך שאינו במפה מקבל ברירת מחדל ואינו נעלם** — זה
     הכלל שחוזר בכל המערכת.
   ============================================================ */
const SCREEN = {
  home: Home, me: Person, people: People, roles: Shield, settings: Gear,
  attendance: Check, "attendance-year": Calendar,
  requests: Plane,
  agenda: Clock, lessons: Book, courses: Book, archive: Doc, gantt: Calendar,
  rate: Star, evals: Star, lecturers: People, pay: Coin,
  myteams: Flag, placements: Grid, teams: Flag, mygroup: People,
  inventory: Box, shopping: Cart, par: Box,
  menu: Bowl, dishes: Bowl, budget: Coin,
  chores: Broom, "chores-admin": Broom,
  faults: Wrench, "faults-admin": Wrench,
  safety: Shield, hosting: People,
  leadweek: Flag, leadweeks: Flag,
  laundry: Wash,
  board: Board, quotes: Quote,
  tryouts: Rocket, alumni: Rocket, recruit: Rocket,
  projects: Sparkle,
  plenary: Board, "stu-lessons": Book,
  trends: Chart, export: Doc,
  rules: Doc, texts: Doc,
};

export const screenIcon = (key) => SCREEN[key] || Doc;

/* ⚠ אותו דבר למודול — קבוצות הניווט נגזרות ממודול, ולכן
   הכותרת שלהן צריכה אייקון משלה. */
const MODULE = {
  people: People, attendance: Check, requests: Plane, lessons: Book,
  ratings: Star, teams: Flag, inventory: Box, menu: Bowl, budget: Coin,
  chores: Broom, faults: Wrench, safety: Shield, leadweek: Flag,
  laundry: Wash, board: Board, army: Rocket, projects: Sparkle,
  content: Board, reports: Chart, texts: Doc,
};

export const moduleIcon = (key) => MODULE[key] || Grid;
