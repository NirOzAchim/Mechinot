/* ============================================================
   שפת העיצוב
   ------------------------------------------------------------
   ⚠⚠⚠ **בלוק ה-:root נבנה מ-theme.js ואינו מוקלד כאן.**
     שתי רשימות טוקנים — אחת כברירת מחדל ב-CSS ואחת שנכתבת
     בזמן ריצה — מתפצלות בתוספת הראשונה, ואז טוקן קיים לפני
     הכניסה ונעלם אחריה. מקור אחד, ואי אפשר לסטות.

   ⚠⚠ **אין בקטיקים בקובץ הזה מלבד אלה שעוטפים מחרוזת.**
     הוא בנוי ממחרוזות תבנית, ובקטיק בהערת CSS סוגר אותן
     והשארית הופכת לקוד. זה קרה במערכת הקודמת חמש פעמים,
     ובאחת מהן הבנייה דיווחה הצלחה בעוד הדפדפן נשבר.
     npm run check סופר אותם.

   ⚠ **ואין הקס כאן בכלל.** הצבעים מגיעים מהאפיון של המכינה,
     וכלל עם הקס נשאר בצבע אחד לכל הלקוחות — וזה מתגלה רק
     בצילום מסך, כי CSS שגוי אינו שגיאה.

   ============================================================
   חמשת העקרונות
   ------------------------------------------------------------
   1. משטח מוגדר בצל ולא במסגרת. מסגרת מפרידה, צל מרים.
      ⚠ והמסגרת הוחלשה ולא הוסרה — בלעדיה משטח לבן על קרם
      בהיר מאבד את הקצה באור שמש ובמסכים חיוורים.
   2. רוב הדברים שטוחים. **מעט מאוד מורם.** ממשק שבו כל
      כרטיס צף הוא ממשק בלי היררכיה.
   3. צבע ראשי אחד, במשורה. כל השאר ניטרלי.
   4. מעבר על מה שבאמת משתנה בלבד — לעולם לא transition:all.
   5. מספרים ב-tabular-nums. טבלה שהספרות בה קופצות נראית
      חובבנית ברגע.
   ============================================================ */

import { rootVars } from "./theme.js";

/* ⚠⚠ **הפונט נטען, ולא רק נקרא בשמו.** הגרסה הראשונה ביקשה
   Assistant ולא טענה אותו בשום מקום — כלומר כל המערכת רצה
   על Segoe UI, ואיש לא ידע. זה היה חצי מההרגשה של «נראה לא
   גמור».

   ⚠ **ועם מחסנית נפילה אמיתית**: רשת שנופלת אינה אמורה
   להשאיר עברית בפונט סריפי. */
export const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700;800&display=swap";

/* ⚠ טוקנים שאינם צבע — מידות, רדיוסים, תזמון. אינם נגזרים
   מהאפיון, ולכן כאן ולא ב-theme.js. */
const SCALE = `
  --r-xs: 8px;  --r-sm: 11px; --r-md: 14px;
  --r-lg: 18px; --r-xl: 24px; --r-full: 999px;

  --s1: 4px;  --s2: 8px;  --s3: 12px; --s4: 16px;
  --s5: 22px; --s6: 32px; --s7: 48px; --s8: 72px;

  --t-fast: 120ms; --t-mid: 200ms; --t-slow: 340ms;
  --ease: cubic-bezier(.22,1,.36,1);

  /* ⚠⚠ **הגוון הנוכחי חייב ברירת מחדל.** .tone-N דורסת אותו
     על ההורה, אבל .card.edge או .pill.tone בלי הורה כזה היו
     מקבלים var(--t) שנפתר **לכלום** — כלומר פס שקוף ותגית
     בלי צבע, בלי שום שגיאה. זו בדיוק משפחת הבאגים של --sand
     ושל --navy שחיו חודשים במערכת הקודמת, ו-npm run check
     תופס אותה עכשיו. */
  --t: var(--accent); --t-s: var(--a-soft); --t-l: var(--a-300);
`;

const BASE = `
*{ box-sizing:border-box; }
html,body,#root{ height:100%; }
button,input,textarea,select{ font:inherit; color:inherit; }
button{ background:none; border:none; padding:0; cursor:pointer; }
svg{ display:block; flex:none; }
::selection{ background:var(--a-soft-2); }

/* ⚠ טבעת מיקוד אחת לכל המערכת. ברירת המחדל שונה בכל דפדפן,
   ומי שמסיר אותה בלי חלופה שובר ניווט במקלדת לגמרי. */
:focus-visible{ outline:2px solid var(--accent); outline-offset:2px;
  border-radius:var(--r-xs); }

.scroll-y{ overflow-y:auto; overscroll-behavior:contain; }
.scroll-x{ overflow-x:auto; overscroll-behavior-x:contain;
  scrollbar-width:none; }
.scroll-x::-webkit-scrollbar{ display:none; }

.row{ display:flex; align-items:center; gap:var(--s3); }
.row.start{ align-items:flex-start; }
.row.wrap{ flex-wrap:wrap; }
.grow{ flex:1; min-width:0; }
.stack{ display:grid; gap:var(--s3); }
.two{ display:grid; grid-template-columns:1fr 1fr; gap:var(--s3); }
.three{ display:grid; grid-template-columns:repeat(3,1fr); gap:var(--s3); }
.auto{ display:grid; gap:var(--s3);
  grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); }
@media (max-width:620px){ .two,.three{ grid-template-columns:1fr; } }
`;

const TYPE = `
/* ============================================================
   טיפוגרפיה
   ⚠ עברית צריכה גובה שורה נדיב יותר מלטינית — 1.65 בגוף.
   ⚠ וכותרות ב-letter-spacing שלילי: בגדלים גדולים המרווח
     הטבעי נראה רופף.
   ============================================================ */
html{ -webkit-text-size-adjust:100%; }
body{
  margin:0; background:var(--bg); color:var(--ink);
  font-family:Assistant,"Segoe UI",Arial,system-ui,-apple-system,sans-serif;
  font-size:15.5px; line-height:1.65;
  font-feature-settings:"kern" 1;
  -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
}
h1,h2,h3,h4{ margin:0; font-weight:700; line-height:1.25; }
h1{ font-size:27px; letter-spacing:-.024em; font-weight:800; }
h2{ font-size:20px; letter-spacing:-.018em; }
h3{ font-size:16.5px; letter-spacing:-.012em; }
h4{ font-size:12px; letter-spacing:.06em; font-weight:700; color:var(--faint); }
p{ margin:0; }
.display{ font-size:34px; font-weight:800; letter-spacing:-.032em; line-height:1.15; }
.muted{ color:var(--muted); }
.faint{ color:var(--faint); font-size:13.5px; }
.tiny{ font-size:12.5px; color:var(--faint); }
.num{ font-variant-numeric:tabular-nums; font-feature-settings:"tnum" 1; }
.ltr{ direction:ltr; text-align:left; }
.mono{ font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  font-size:12.5px; direction:ltr; }
.nowrap{ white-space:nowrap; }
.trunc{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
a{ color:var(--accent); }
`;

const SHELL = `
/* ============================================================
   שלד האפליקציה
   ------------------------------------------------------------
   ⚠⚠ **סרגל צד במסך רחב, רצועה תחתונה בטלפון.** הגרסה
     הראשונה הייתה מגירת צ׳יפים שנפתחת — כל מעבר בין מסכים
     היה שתי נגיעות וחיפוש, ובלי שום תחושת מקום. ניווט קבוע
     שרואים תמיד הוא ההבדל הגדול ביותר בין «אתר» ל«אפליקציה».

   ⚠ **הסרגל בימין** — הממשק RTL, וניווט בשמאל מכריח את העין
     לחצות את כל הרוחב בכל מעבר.
   ============================================================ */
.app{ min-height:100%; display:flex; flex-direction:column; }

.side{
  position:fixed; inset-block:0; inset-inline-end:0;
  width:266px; background:var(--surface);
  border-inline-start:1px solid var(--line);
  display:flex; flex-direction:column; z-index:40;
}
.side-top{ padding:var(--s5) var(--s4) var(--s4);
  display:flex; align-items:center; gap:var(--s3); }
.side-nav{ flex:1; padding:0 var(--s3) var(--s4); overflow-y:auto; }
.side-foot{ padding:var(--s3); border-top:1px solid var(--line-soft); }

.navgroup{ margin-bottom:var(--s4); }
.navgroup>h4{ display:flex; align-items:center; gap:6px;
  padding:0 var(--s3) var(--s2); }
.navlink{
  display:flex; align-items:center; gap:10px; width:100%;
  padding:8px var(--s3); border-radius:var(--r-sm);
  color:var(--n-600); font-size:14.5px; font-weight:500; text-align:start;
  transition:background var(--t-fast) var(--ease), color var(--t-fast) var(--ease);
}
.navlink:hover{ background:var(--sand); color:var(--ink); }
.navlink.on{ background:var(--a-soft); color:var(--accent); font-weight:700; }
.navlink.on svg{ color:var(--accent); }
.navlink svg{ color:var(--faint); }
.navlink .cnt{ margin-inline-start:auto; font-size:11.5px; font-weight:700;
  background:var(--bad); color:var(--surface);
  min-width:19px; height:19px; border-radius:999px;
  display:grid; place-items:center; padding:0 5px; }

.top{ position:sticky; top:0; z-index:30;
  background:var(--surface); border-bottom:1px solid var(--line); }
.top-in{ height:60px; display:flex; align-items:center; gap:var(--s3);
  padding:0 var(--s4); max-width:1180px; margin:0 auto; }
.top .nm{ font-weight:800; letter-spacing:-.02em; font-size:16px; }
.top .sub{ font-size:12.5px; color:var(--faint); margin-top:-3px; }

.iconbtn{ width:38px; height:38px; border-radius:var(--r-sm);
  display:grid; place-items:center; color:var(--n-600); position:relative;
  transition:background var(--t-fast) var(--ease), color var(--t-fast) var(--ease); }
.iconbtn:hover{ background:var(--sand); color:var(--ink); }

.main{ flex:1; padding:var(--s5) var(--s4) 96px; }
.wrap{ max-width:1180px; margin:0 auto; }
.wrap.narrow{ max-width:760px; }

@media (min-width:1024px){
  .app.has-side{ padding-inline-end:266px; }
  .app.has-side .top-in{ max-width:100%; padding-inline:var(--s6); }
  .app.has-side .main{ padding:var(--s6) var(--s6) var(--s7); }
  .app.has-side .wrap{ max-width:1020px; margin-inline:0; }
}
@media (max-width:1023px){ .side{ display:none; } }
@media (min-width:1024px){ .app.has-side .hide-lg{ display:none; } }

.tabs{
  position:fixed; inset-inline:0; bottom:0; z-index:40;
  background:var(--surface); border-top:1px solid var(--line);
  display:grid; grid-auto-flow:column; grid-auto-columns:1fr;
  padding-bottom:env(safe-area-inset-bottom);
  box-shadow:var(--e-2);
}
.tab{ padding:8px 2px 9px; display:grid; justify-items:center; gap:3px;
  color:var(--faint); font-size:11px; font-weight:600; position:relative; }
.tab.on{ color:var(--accent); }
.tab.on::before{ content:""; position:absolute; top:0; inset-inline:22%;
  height:2.5px; border-radius:0 0 3px 3px; background:var(--accent); }
.tab .dot{ position:absolute; top:6px; inset-inline-end:calc(50% - 16px);
  width:7px; height:7px; border-radius:999px; background:var(--bad);
  border:1.5px solid var(--surface); }
@media (min-width:1024px){ .tabs{ display:none; } .main{ padding-bottom:var(--s7); } }
`;

const SURFACE = `
/* ============================================================
   משטחים
   ⚠ רוב הכרטיסים **שטוחים** — מסגרת עדינה וצל מינימלי.
     .lift שמור למה שבאמת צף: טופס פתוח, דיאלוג, כרטיס
     שדורש פעולה.
   ============================================================ */
.card{ background:var(--surface); border:1px solid var(--line);
  border-radius:var(--r-lg); padding:var(--s5); box-shadow:var(--e-1); }
.card.tight{ padding:var(--s4); }
.card.flat{ box-shadow:none; }
.card.lift{ box-shadow:var(--e-3); border-color:var(--line-soft); }

/* ⚠⚠ פס גוון בקצה העליון של כרטיס. זה הפרט שהופך כרטיס לבן
   ל«כרטיס של משהו», והוא יורש את הגוון מההורה (.tone-N) —
   ולכן הכותרת, הפס והתגית באותו כרטיס מקבלים את אותו צבע
   בלי שאיש יקליד אותו פעמיים. */
.card.edge{ position:relative; overflow:hidden; }
.card.edge::before{ content:""; position:absolute; inset-inline:0; top:0;
  height:3px; background:linear-gradient(90deg,var(--t),var(--t-l)); }

.panel{ background:var(--sand); border-radius:var(--r-md); padding:var(--s4); }
.hr{ height:1px; background:var(--line-soft); border:0; margin:var(--s4) 0; }

.sec{ display:flex; align-items:flex-end; gap:var(--s3); margin:var(--s6) 0 var(--s3); }
.sec:first-child{ margin-top:0; }
.sec h2{ flex:none; }
.sec .ln{ flex:1; height:1px; background:var(--line-soft); margin-bottom:8px; }
`;

const TONE = `
/* ============================================================
   שמונה גוונים
   ⚠⚠ **הגוון נגזר מהשם ואינו נשמר.** ועדה חדשה, תפקיד חדש
     או קבוצה חדשה מקבלים צבע מעצמם — בלי עמודת צבע לתחזק
     ובלי דיפלוי. אותו שם מקבל תמיד אותו צבע, ולכן הרשימה
     אינה מתחלפת בכל טעינה.

   ⚠⚠ **גוון של תחום וצבע של מצב הם שני דברים.** ירוק ואדום
     שמורים למצב — תקין, חוסר, חריגה. אילו גם האריח היה
     מאדים, מסך עם שתי בעיות היה נראה כמו אזעקה.
   ============================================================ */
.tone-0{ --t:var(--t0); --t-s:var(--t0-s); --t-l:var(--t0-l); }
.tone-1{ --t:var(--t1); --t-s:var(--t1-s); --t-l:var(--t1-l); }
.tone-2{ --t:var(--t2); --t-s:var(--t2-s); --t-l:var(--t2-l); }
.tone-3{ --t:var(--t3); --t-s:var(--t3-s); --t-l:var(--t3-l); }
.tone-4{ --t:var(--t4); --t-s:var(--t4-s); --t-l:var(--t4-l); }
.tone-5{ --t:var(--t5); --t-s:var(--t5-s); --t-l:var(--t5-l); }
.tone-6{ --t:var(--t6); --t-s:var(--t6-s); --t-l:var(--t6-l); }
.tone-7{ --t:var(--t7); --t-s:var(--t7-s); --t-l:var(--t7-l); }

.tile{ width:38px; height:38px; border-radius:var(--r-sm); flex:none;
  display:grid; place-items:center;
  background:var(--t-s,var(--a-soft)); color:var(--t,var(--accent)); }
.tile.lg{ width:46px; height:46px; border-radius:var(--r-md); }
.tile.sm{ width:30px; height:30px; border-radius:var(--r-xs); }

.ava{ width:38px; height:38px; border-radius:999px; flex:none;
  display:grid; place-items:center; font-weight:700; font-size:14px;
  background:var(--t-s,var(--sand)); color:var(--t,var(--n-600));
  letter-spacing:-.02em; }
.ava.sm{ width:30px; height:30px; font-size:12px; }
.ava.lg{ width:52px; height:52px; font-size:19px; }
`;

const BUTTON = `
/* ============================================================
   כפתורים
   ⚠⚠ **הראשי: שיפוע קל, וזוהר בצבעו שלו מתחתיו.** צל אפור
     מתחת לכפתור צבעוני נראה כמו שכבה זרה; זוהר בגוונו נראה
     כמו שהכפתור מאיר. זה הפרט שהכי מבדיל בין כפתור שנראה
     מצויר לכפתור שנראה מעוצב.

   ⚠ המעבר על transform ו-box-shadow בלבד ולא על all: מעבר
     על all מנפיש גם רוחב וגם רקע, ואז כל שינוי נראה איטי.
   ============================================================ */
.btn{
  display:inline-flex; align-items:center; justify-content:center; gap:7px;
  height:44px; padding:0 var(--s5); border-radius:var(--r-md);
  font-weight:700; font-size:15px; letter-spacing:-.01em; white-space:nowrap;
  background:linear-gradient(180deg,var(--a-grad-a),var(--a-grad-b));
  color:var(--a-ink);
  box-shadow:0 1px 0 var(--a-grad-a) inset, 0 6px 16px -8px var(--a-glow);
  transition:transform var(--t-fast) var(--ease),
             box-shadow var(--t-fast) var(--ease),
             filter var(--t-fast) var(--ease);
}
.btn:hover{ box-shadow:0 1px 0 var(--a-grad-a) inset, 0 10px 22px -8px var(--a-glow); }
.btn:active{ transform:translateY(1px); box-shadow:0 2px 8px -4px var(--a-glow); }
.btn:disabled{ opacity:.45; cursor:not-allowed; transform:none;
  box-shadow:none; filter:grayscale(.35); }

.btn.ghost{ background:var(--surface); color:var(--ink);
  border:1px solid var(--line); box-shadow:var(--e-1); }
.btn.ghost:hover{ border-color:var(--a-300); box-shadow:var(--e-2); }

.btn.quiet{ background:none; color:var(--n-600); box-shadow:none; }
.btn.quiet:hover{ background:var(--sand); color:var(--ink); box-shadow:none; }

.btn.danger{ background:var(--surface); color:var(--bad);
  border:1px solid var(--bad-line); box-shadow:none; }
.btn.danger:hover{ background:var(--bad-soft); }

.btn.sm{ height:34px; padding:0 var(--s4); font-size:13.5px;
  border-radius:var(--r-sm); }
.btn.lg{ height:52px; padding:0 var(--s6); font-size:16.5px; }
.btn.block{ width:100%; }
.btn.icon{ width:44px; padding:0; }
.btn.sm.icon{ width:34px; }

.btns{ display:flex; gap:var(--s2); flex-wrap:wrap; align-items:center; }
`;

const FORM = `
/* ============================================================
   טפסים
   ⚠⚠ **שדה גבוה (52px) ובמילוי רך ולא לבן.** שדה לבן על
     כרטיס לבן נשען על המסגרת בלבד, ומסגרת דקה נעלמת בשמש.
   ⚠ **וטבעת מיקוד ולא רק החלפת צבע מסגרת** — היא נראית גם
     למי שרואה ניגודיות נמוכה.
   ============================================================ */
.field{ display:block; margin-bottom:var(--s4); }
.field>span,.field>label{ display:block; font-size:13.5px; font-weight:600;
  color:var(--n-600); margin-bottom:6px; }
.field .req{ color:var(--bad); margin-inline-start:3px; }
.inp,
.field input,.field textarea,.field select{
  width:100%; height:52px; padding:0 var(--s4);
  border-radius:var(--r-md); border:1px solid var(--line);
  background:var(--sand); color:var(--ink); outline:none;
  transition:background var(--t-fast) var(--ease),
             border-color var(--t-fast) var(--ease),
             box-shadow var(--t-fast) var(--ease);
}
.field textarea{ height:auto; padding:var(--s3) var(--s4); line-height:1.6;
  resize:vertical; min-height:96px; }
.field select{ appearance:none; padding-inline-end:var(--s6); }
.inp:focus,
.field input:focus,.field textarea:focus,.field select:focus{
  background:var(--surface); border-color:var(--accent);
  box-shadow:0 0 0 4px var(--a-ring);
}
.field input::placeholder,.field textarea::placeholder{ color:var(--faint); }
.field.bad input,.field.bad textarea{ border-color:var(--bad); }
.field.bad input:focus{ box-shadow:0 0 0 4px var(--bad-ring); }
.hint{ font-size:12.5px; color:var(--faint); margin-top:6px; line-height:1.5; }
.err-t{ font-size:12.5px; color:var(--bad); margin-top:6px; font-weight:600; }

/* ⚠ dir=ltr על שעה ותאריך — בלעדיו 19:30 מוצג 30:19 */
.field input[type="time"],.field input[type="date"]{ direction:ltr; text-align:start; }

.chk{ display:flex; align-items:center; gap:10px; cursor:pointer;
  padding:9px var(--s3); border-radius:var(--r-sm);
  transition:background var(--t-fast) var(--ease); }
.chk:hover{ background:var(--sand); }
.chk input{ width:18px; height:18px; accent-color:var(--accent); flex:none; }
.chk.on{ background:var(--a-soft); }

.segs{ display:flex; gap:6px; overflow-x:auto; padding-bottom:2px;
  scrollbar-width:none; }
.segs::-webkit-scrollbar{ display:none; }
.seg{ display:inline-flex; align-items:center; gap:7px; white-space:nowrap;
  height:38px; padding:0 var(--s4); border-radius:999px;
  border:1px solid var(--line); background:var(--surface);
  font-size:14px; font-weight:600; color:var(--n-600);
  transition:background var(--t-fast) var(--ease),
             color var(--t-fast) var(--ease),
             border-color var(--t-fast) var(--ease); }
.seg:hover{ border-color:var(--a-300); color:var(--ink); }
.seg.on{ background:var(--accent); color:var(--a-ink); border-color:transparent; }
/* ⚠ מצב נבחר בצבע **המשמעות** ולא בצבע הראשי: נוכח ירוק,
   נעדר אדום. כפתור נבחר בכחול על שורה של חניך אינו אומר
   מה נבחר, רק שמשהו נבחר. */
.seg.on.ok{ background:var(--ok); }
.seg.on.bad{ background:var(--bad); }
.seg.on.warn{ background:var(--warn); }

/* ⚠ בטלפון נשאר האייקון בלבד — שלוש מילים ליד כל שם דוחקות
   את השם עצמו מהמסך. */
@media (max-width:560px){ .hide-sm{ display:none; } }
.seg .cnt{ background:var(--sand); color:var(--muted); border-radius:999px;
  padding:0 6px; font-size:11.5px; min-width:18px; text-align:center; }
.seg.on .cnt{ background:var(--a-700); color:var(--a-ink); }

/* ⚠ מפריד עם מילה. שני מסלולים בלי מפריד נראים כמו טופס
   אחד ארוך. */
.or{ display:flex; align-items:center; gap:var(--s3); margin:var(--s4) 0;
  color:var(--faint); font-size:13px; }
.or::before,.or::after{ content:""; flex:1; height:1px; background:var(--line); }
`;

const BITS = `
.pill{ display:inline-flex; align-items:center; gap:5px;
  font-size:12.5px; font-weight:700; padding:3px 10px;
  border-radius:999px; white-space:nowrap;
  background:var(--sand); color:var(--muted); }
.pill.ok{ background:var(--ok-soft); color:var(--ok); }
.pill.warn{ background:var(--warn-soft); color:var(--warn); }
.pill.bad{ background:var(--bad-soft); color:var(--bad); }
.pill.info{ background:var(--info-soft); color:var(--info); }
.pill.tone{ background:var(--t-s); color:var(--t); }
.pill.out{ background:none; border:1px solid currentColor; }

.band{ display:grid; gap:1px; background:var(--line);
  border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden;
  grid-template-columns:repeat(auto-fit,minmax(110px,1fr));
  box-shadow:var(--e-1); }
.band>div{ background:var(--surface); padding:var(--s4) var(--s3); text-align:center; }
.band .k{ font-size:26px; font-weight:800; letter-spacing:-.03em;
  font-variant-numeric:tabular-nums; line-height:1.15; }
.band .k.ok{ color:var(--ok); } .band .k.warn{ color:var(--warn); }
.band .k.bad{ color:var(--bad); } .band .k.accent{ color:var(--accent); }
.band .l{ font-size:12.5px; color:var(--muted); margin-top:2px; }

.rows{ display:grid; gap:6px; }
.item{ display:flex; align-items:center; gap:var(--s3);
  background:var(--surface); border:1px solid var(--line);
  border-radius:var(--r-md); padding:10px var(--s4);
  transition:border-color var(--t-fast) var(--ease),
             box-shadow var(--t-fast) var(--ease); }
.item.link{ cursor:pointer; text-align:start; width:100%; }
.item.link:hover{ border-color:var(--a-300); box-shadow:var(--e-2); }
.item .nm{ font-weight:600; }
.item.on{ border-color:var(--accent); background:var(--a-soft); }
.item.dim{ opacity:.55; }
/* ⚠ **גם לבדה.** הגדרה על .item.dim בלבד פירושה ש-.chk.dim
   או .card.dim אינם עושים דבר — מחלקה שקיימת בגיליון, עוברת
   את הבדיקה, ואינה משנה כלום על המסך. זה בדיוק סוג הכלל
   שנראה עובד ואינו.
   ⚠⚠ ואין בקטיקים בהערה הזו: הקובץ הוא מחרוזת תבנית אחת,
     ובקטיק סוגר אותה. זה קרה כאן בדיוק כשהיא נכתבה — ובפעם
     הזו צינור אל tail הסתיר את כשל הבדיקה, והקומיט יצא שבור. */
.dim{ opacity:.55; }

.bar{ height:6px; border-radius:999px; background:var(--sand); overflow:hidden; }
.bar>i{ display:block; height:100%; border-radius:999px;
  background:var(--accent); transition:width var(--t-slow) var(--ease); }
.bar.ok>i{ background:var(--ok); }
.bar.warn>i{ background:var(--warn); }
.bar.bad>i{ background:var(--bad); }
.bar.sm{ height:4px; width:72px; flex:none; }

.banner{ display:flex; align-items:flex-start; gap:10px;
  border-radius:var(--r-md); padding:12px var(--s4); margin:var(--s3) 0;
  font-size:14.5px; line-height:1.55;
  background:var(--sand); color:var(--n-700);
  border:1px solid var(--line-soft); }
.banner svg{ margin-top:2px; }
.banner.err{ background:var(--bad-soft); color:var(--bad);
  border-color:var(--bad-line); font-weight:600; }
.banner.ok{ background:var(--ok-soft); color:var(--ok);
  border-color:var(--ok-line); font-weight:600; }
.banner.warn{ background:var(--warn-soft); color:var(--warn);
  border-color:var(--warn-line); }
.banner.info{ background:var(--info-soft); color:var(--info);
  border-color:var(--info-line); }

/* ⚠ מצב ריק **מנוסח** ולא «אין נתונים»: הוא אומר מה יופיע
   כאן ומה הפעולה. ומצב ריק אמיתי וכשל טעינה הם שני מסכים
   שונים — תמיד. */
.empty{ text-align:center; padding:var(--s7) var(--s4); }
.empty .e-ico{ width:56px; height:56px; border-radius:var(--r-lg);
  margin:0 auto var(--s3); display:grid; place-items:center;
  background:var(--sand); color:var(--faint); }
.empty h3{ margin-bottom:4px; }
.empty p{ color:var(--muted); max-width:42ch; margin:0 auto; }

.skel{ height:60px; border-radius:var(--r-md); margin-bottom:8px;
  background:linear-gradient(90deg,var(--sand) 25%,var(--n-100) 37%,var(--sand) 63%);
  background-size:400% 100%; animation:sk 1.4s ease infinite; }
.skel.sm{ height:18px; }
.skel.tall{ height:120px; }
@keyframes sk{ 0%{background-position:100% 0} 100%{background-position:0 0} }

/* ⚠ מסילת שלבים ממוספרת. מספר לצד שם הופך רשימה לרצף. */
.steps{ display:flex; gap:2px; overflow-x:auto; padding:2px 0 var(--s3);
  scrollbar-width:none; }
.steps::-webkit-scrollbar{ display:none; }
.stp{ display:inline-flex; align-items:center; gap:8px; white-space:nowrap;
  height:40px; padding:0 var(--s4); border-radius:999px;
  font-size:14px; font-weight:600; color:var(--muted); }
.stp .no{ width:23px; height:23px; border-radius:999px; flex:none;
  display:grid; place-items:center; font-size:12px; font-weight:800;
  background:var(--sand); color:var(--muted); }
.stp.done .no{ background:var(--ok-soft); color:var(--ok); }
.stp.on{ background:var(--accent); color:var(--a-ink); }
.stp.on .no{ background:var(--a-700); color:var(--a-ink); }
.stp .must{ font-size:10.5px; color:var(--bad); font-weight:800; }
.stp.on .must{ color:var(--a-ink); opacity:.75; }
`;

const OVERLAY = `
/* ============================================================
   שכבות על
   ⚠ **דיאלוג של המערכת ולא confirm() של הדפדפן** — הוא נראה
     זר, ובחלק מהדפדפנים בנייד הוא נחסם לגמרי, כלומר הכפתור
     פשוט לא עושה כלום.
   ============================================================ */
.scrim{ position:fixed; inset:0; z-index:60; background:var(--scrim);
  display:grid; place-items:center; padding:var(--s4);
  animation:fade var(--t-mid) var(--ease); }
/* ⚠⚠ **גובה מוגבל וגלילה בפנים.** דיאלוג גבוה מהמסך נחתך
   בתחתיתו — וכפתור השמירה הוא בדיוק מה שנחתך. נתפס בצילום
   מסך של עורך התפקידים, שיש בו ארבעים מסכים לסמן. */
.modal{ background:var(--surface); border-radius:var(--r-xl);
  box-shadow:var(--e-4); width:100%; max-width:460px; padding:var(--s6);
  max-height:calc(100vh - 2 * var(--s4)); overflow-y:auto;
  overscroll-behavior:contain;
  animation:pop var(--t-mid) var(--ease); }
.modal h2{ margin-bottom:6px; }
@keyframes fade{ from{opacity:0} }
@keyframes pop{ from{opacity:0; transform:translateY(10px) scale(.985)} }

/* ⚠ בטלפון — גיליון מלמטה ולא דיאלוג במרכז. האגודל מגיע
   לתחתית המסך, לא לאמצעו. */
@media (max-width:620px){
  .scrim{ align-items:flex-end; padding:0; }
  .modal{ max-width:100%; border-radius:var(--r-xl) var(--r-xl) 0 0;
    animation:sheet var(--t-mid) var(--ease); max-height:90vh;
    padding-bottom:calc(var(--s6) + env(safe-area-inset-bottom)); }
}
@keyframes sheet{ from{transform:translateY(100%)} }

/* ⚠ הודעת הצלחה חולפת ולא באנר שנשאר: באנר שנשאר דוחף את
   התוכן ומאמן להתעלם. */
.toasts{ position:fixed; z-index:70; bottom:96px; inset-inline:0;
  display:grid; justify-items:center; gap:8px; pointer-events:none;
  padding:0 var(--s4); }
.toast{ pointer-events:auto; max-width:520px;
  display:flex; align-items:center; gap:10px;
  background:var(--n-700); color:var(--bg);
  border-radius:var(--r-md); padding:11px var(--s4);
  box-shadow:var(--e-4); font-size:14.5px; font-weight:600;
  animation:toast var(--t-mid) var(--ease); }
.toast.ok{ background:var(--ok); color:var(--surface); }
.toast.bad{ background:var(--bad); color:var(--surface); }
@keyframes toast{ from{opacity:0; transform:translateY(12px)} }
@media (min-width:1024px){ .toasts{ bottom:var(--s5); } }
`;

const MOTION = `
/* ============================================================
   תנועה
   ⚠ **הנפשת כניסה רק במסך הבית.** רשימה של שלושים שורות
     שנכנסת בהנפשה נראית איטית, לא חיה.
   ⚠ ו-prefers-reduced-motion מבטל הכול — לא מקצר, מבטל.
   ============================================================ */
.enter>*{ animation:rise var(--t-slow) var(--ease) backwards; }
.enter>*:nth-child(1){ animation-delay:0ms }
.enter>*:nth-child(2){ animation-delay:40ms }
.enter>*:nth-child(3){ animation-delay:80ms }
.enter>*:nth-child(4){ animation-delay:120ms }
.enter>*:nth-child(5){ animation-delay:160ms }
.enter>*:nth-child(6){ animation-delay:200ms }
@keyframes rise{ from{ opacity:0; transform:translateY(8px) } }

@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:1ms !important; animation-iteration-count:1 !important;
    transition-duration:1ms !important; scroll-behavior:auto !important;
  }
}
`;

const DATA = `
/* ============================================================
   רשת החודש — לוח הנוכחות
   ------------------------------------------------------------
   ⚠⚠ **direction:rtl במפורש.** בלעדיו הרשת נבנית
     משמאל לימין בעוד כותרות הימים בעברית, וכל
     תאריך יושב על היום הלא-נכון.

   ⚠⚠ **הקידומת .app חובה.** התא הוא «button»,
     וכלל כללי על כפתורים מאפס רקע ומסגרת בסגוליות
     גבוהה יותר — ואז הרשת מצטיירת לבנה לגמרי.
   ============================================================ */
.yr{ display:grid; grid-template-columns:repeat(7,1fr); gap:5px;
  margin-top:var(--s3); }
.yr-h{ text-align:center; font-size:12px; font-weight:700;
  color:var(--faint); padding-bottom:2px; }
.app .yr-c{ aspect-ratio:1; display:flex; align-items:center;
  justify-content:center; font-size:13.5px; font-weight:600;
  border-radius:var(--r-sm); border:1px solid var(--line-soft);
  background:var(--surface); color:var(--ink); cursor:pointer;
  transition:transform .12s var(--ease); }
.app .yr-c:hover:not(:disabled){ transform:scale(1.07); }
.app .yr-c:disabled{ opacity:.35; cursor:default; border-style:dashed; }

/* ⚠ הצבע הוא רמז ולא המידע — המקרא אומר במילים
   מה כל אחד אומר, והתא נפתח לפירוט בלחיצה. */
.app .yr-c.ok{ background:var(--ok-soft); border-color:var(--ok); }
.app .yr-c.warn{ background:var(--warn-soft); border-color:var(--warn); }
.app .yr-c.bad{ background:var(--bad-soft); border-color:var(--bad); }
.app .yr-c.faint{ color:var(--faint); }
/* ⚠⚠ «אין שורה» — מסומן בקו מקווקו ולא בצבע בלבד:
   הוא מצב של **חוסר נתון**, ולא מצב של היום. */
.app .yr-c.dim{ background:repeating-linear-gradient(45deg,
    var(--sand) 0 5px, transparent 5px 10px);
  border-style:dashed; border-color:var(--warn); color:var(--faint); }
.app .yr-c.out{ background:var(--sand); color:var(--faint);
  border-style:dotted; }

/* ⚠⚠ **«.dot» הייתה מוגדרת רק כ«.tab .dot»**, ולכן מקרא
   שהשתמש בה עבר את בדיקת המחלקות וצייר כלום. מקרא
   של צבעים בלי צבעים הוא רשימת מילים שאינה מסבירה דבר. */
.dot{ width:11px; height:11px; border-radius:var(--r-full); flex:none;
  background:var(--surface); border:1px solid var(--line); }
.dot.ok{ background:var(--ok-soft); border-color:var(--ok); }
.dot.warn{ background:var(--warn-soft); border-color:var(--warn); }
.dot.bad{ background:var(--bad-soft); border-color:var(--bad); }
.dot.faint{ background:var(--surface); border-color:var(--line); }
.dot.dim{ background:repeating-linear-gradient(45deg,
    var(--sand) 0 3px, transparent 3px 6px); border-color:var(--warn);
  border-style:dashed; }
.dot.out{ background:var(--sand); border-style:dotted; }
/* ============================================================
   טבלה, מתג, דגימת צבע, אזור שחרור
   ------------------------------------------------------------
   ⚠ אלה הרכיבים של מסכי **העריכה** — האפיון והייבוא. הם אינם
     ברוב המסכים, והפרדתם לבלוק משלהם היא מה שמאפשר לקרוא את
     שפת העיצוב בלי לדלג עליהם.

   ⚠⚠ **טבלה גוללת לרוחב ולא נדחסת.** חמש עמודות על טלפון
     נדחסות לשלוש אותיות לעמודה, ואז התצוגה המקדימה — שכל
     תכליתה לקרוא לפני שכותבים — אינה ניתנת לקריאה.
   ============================================================ */
.tbl{ border:1px solid var(--line); border-radius:var(--r-md);
  overflow:hidden; background:var(--surface); }
.tbl .rl{ display:grid; gap:1px; background:var(--line-soft); }
.tbl .tr{ display:grid; background:var(--surface);
  grid-template-columns:var(--cols,repeat(auto-fit,minmax(90px,1fr)));
  font-size:13.5px; }
.tbl .tr>span{ padding:9px var(--s3); min-width:0;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.tbl .tr.hd{ background:var(--sand); font-weight:700; font-size:12.5px;
  color:var(--n-600); position:sticky; top:0; z-index:1; }
.tbl .tr.hd>span{ padding:8px var(--s3); }
.tbl .more{ padding:9px var(--s3); font-size:12.5px; color:var(--faint);
  background:var(--sand); }

/* ⚠⚠ **מתג ולא תיבת סימון למודול.** «דלוק/כבוי» הוא מצב של
   דבר שרץ, וזה מה שמתג אומר; תיבת סימון אומרת «בחרתי». */
.sw{ position:relative; display:inline-flex; flex:none;
  width:44px; height:26px; cursor:pointer; }
.sw input{ position:absolute; opacity:0; width:100%; height:100%;
  margin:0; cursor:pointer; }
/* ⚠ המסילה הכבויה ב-n-300 ולא ב-n-200: עם ידית לבנה וצל
   רך, מסילה בהירה מדי נקראת כמו כפתור לבן ולא כמו מתג
   כבוי — ואז לא ברור בכלל שיש כאן מצב. נתפס בצילום מסך. */
.sw i{ position:absolute; inset:0; border-radius:999px;
  background:var(--n-300); box-shadow:var(--e-in);
  transition:background var(--t-fast) var(--ease); }
.sw i::after{ content:""; position:absolute; top:3px; inset-inline-start:3px;
  width:20px; height:20px; border-radius:999px; background:var(--surface);
  box-shadow:var(--e-2);
  transition:transform var(--t-fast) var(--ease); }
.sw input:checked + i{ background:var(--accent); }
/* ⚠ הזזה **הפוכה** — הממשק RTL, וידית שנעה ימינה בדלוק נראית
   כמו כיבוי. */
.sw input:checked + i::after{ transform:translateX(-18px); }
.sw input:disabled + i{ opacity:.45; }
.sw input:focus-visible + i{ box-shadow:0 0 0 4px var(--a-ring); }

/* ⚠ דגימת צבע — הריבוע **הוא** הכפתור, ולידו ההקס לקריאה.
   input[type=color] לבדו נראה שונה בכל דפדפן. */
.swatch{ display:flex; align-items:center; gap:10px;
  border:1px solid var(--line); border-radius:var(--r-md);
  padding:7px var(--s3); background:var(--sand); }
.swatch input[type="color"]{ width:34px; height:34px; padding:0; flex:none;
  border:none; border-radius:var(--r-sm); background:none; cursor:pointer; }
.swatch input[type="color"]::-webkit-color-swatch{ border:none;
  border-radius:var(--r-sm); }
.swatch input[type="color"]::-webkit-color-swatch-wrapper{ padding:0; }
.swatch .hx{ font-family:ui-monospace,Menlo,Consolas,monospace;
  font-size:12.5px; direction:ltr; color:var(--muted); text-transform:uppercase; }

/* ⚠⚠ **הדבקה וקובץ באותו מקום.** הגרסה הראשונה קיבלה הדבקה
   בלבד, וזה נכון לוואטסאפ ולמסמך — אבל מי שמחזיק אקסל נאלץ
   לפתוח, לסמן, להעתיק. אזור שחרור לצד תיבת ההדבקה עולה
   שורה אחת ומוריד שלושה שלבים. */
.drop{ border:1.5px dashed var(--line); border-radius:var(--r-lg);
  padding:var(--s5) var(--s4); text-align:center; cursor:pointer;
  background:var(--sand); color:var(--muted);
  transition:border-color var(--t-fast) var(--ease),
             background var(--t-fast) var(--ease); }
.drop:hover{ border-color:var(--a-300); }
.drop.over{ border-color:var(--accent); background:var(--a-soft);
  color:var(--accent); }
.drop input{ display:none; }

/* ⚠ שורה שנדחתה — **הסיבה לצד הטקסט הגולמי**, ולא הודעה
   כללית מעל הרשימה. «3 שורות לא נקלטו» אינו מאפשר לתקן. */
.rj{ display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;
  padding:7px var(--s3); border-radius:var(--r-sm); font-size:13.5px; }
.rj:nth-child(odd){ background:var(--sand); }
.rj .ix{ font-size:11.5px; font-weight:700; color:var(--faint);
  font-variant-numeric:tabular-nums; flex:none; }
.rj .raw{ flex:1; min-width:140px; color:var(--n-700);
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.rj .why{ color:var(--bad); font-weight:600; font-size:12.5px; }
`;

export const CSS = [
  ":root{\n" + rootVars() + SCALE + "}",
  BASE, TYPE, SHELL, SURFACE, TONE, BUTTON, FORM, BITS, DATA, OVERLAY, MOTION,
].join("\n");

export { applyTheme, toneOf } from "./theme.js";
