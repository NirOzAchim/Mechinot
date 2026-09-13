/* ============================================================
   שפת העיצוב — נגזרת מהאפיון, לא מקובעת
   ------------------------------------------------------------
   ⚠⚠ **הצבעים מגיעים מהפרופיל.** `--bg`, `--surface`, `--ink`,
     `--accent`, `--warm` נכתבים על `:root` בזמן ריצה מתוך
     `identity.colors`. מכינה שתבחר פלטה אחרת מקבלת אותה בכל
     המסכים — ולכן **אסור לכתוב הקס בשום כלל CSS כאן**.

     במערכת הקודמת כ-30 כללים נשאו הקס מקובע, ומצב לילה
     השאיר אותם בהירים — רשת הקיצורים במסך הבית נשארה לבנה
     עם טקסט קרם, בלתי קריאה לגמרי. הבעיה התגלתה בצילום מסך
     ולא בבנייה, כי **CSS שגוי אינו שגיאה**.

   ⚠ **משטח מוגדר בצל ולא במסגרת.** צל דו-שכבתי: קו צמוד
     שמגדיר קצה, ופיזור רך שמרים. שכבה אחת נותנת או קצה חד
     או ערפל, לא את שתיהן.

   ⚠ **משתנה שאינו קיים אינו שגיאה** — `var(--nope)` נפתר
     לכלום והרקע נשאר שקוף. זה נראה «בסדר» על משטח לבן
     ונעלם בכל מקום אחר. כל משתנה כאן מוגדר ב-`:root`.
   ============================================================ */

export const CSS = `
:root{
  --bg:#F5F1E8; --surface:#FFFFFF; --ink:#1F2733;
  --accent:#002454; --warm:#906048;

  --muted:#6B6455; --faint:#A29A88;
  --line:#E7E0D2; --sand:#F1ECE0;
  --ok:#177A45; --ok-soft:#DFF0E4;
  --warn:#8A5A1E; --warn-soft:#F5EBDA;
  --bad:#9E3626; --bad-soft:#F8E6E2;

  --r-lg:20px; --r-md:14px; --r-sm:10px;
  --sh-1:0 1px 2px rgba(47,38,22,.05), 0 8px 20px -12px rgba(47,38,22,.18);
  --sh-2:0 2px 5px rgba(47,38,22,.06), 0 20px 44px -20px rgba(47,38,22,.3);
  --ease:cubic-bezier(.22,1,.36,1);
}

*{box-sizing:border-box}
html,body,#root{height:100%}
body{
  margin:0; background:var(--bg); color:var(--ink);
  font-family:"Assistant","Segoe UI",system-ui,-apple-system,sans-serif;
  font-size:16px; line-height:1.6; -webkit-font-smoothing:antialiased;
}
button{font:inherit; color:inherit}
input{font:inherit}

.wrap{max-width:820px; margin:0 auto; padding:0 16px}

/* ---------- טיפוגרפיה ---------- */
h1,h2,h3{margin:0; font-weight:700; letter-spacing:-.01em}
h1{font-size:26px}
h2{font-size:19px}
h3{font-size:17px}
.muted{color:var(--muted)}
.faint{color:var(--faint); font-size:14px}

/* ---------- משטחים ---------- */
.card{
  background:var(--surface); border:1px solid var(--line);
  border-radius:var(--r-lg); box-shadow:var(--sh-1); padding:18px 20px;
}
.card.lift{box-shadow:var(--sh-2)}

/* ---------- כפתורים ---------- */
.btn{
  border:1px solid transparent; border-radius:var(--r-md);
  padding:11px 18px; cursor:pointer; font-weight:600;
  background:var(--accent); color:#fff;
  transition:transform .12s var(--ease), box-shadow .12s var(--ease);
  box-shadow:var(--sh-1);
}
.btn:hover:not(:disabled){transform:translateY(-1px); box-shadow:var(--sh-2)}
.btn:active:not(:disabled){transform:translateY(0)}
.btn:disabled{opacity:.5; cursor:not-allowed}
.btn.ghost{background:transparent; color:var(--accent); border-color:var(--line); box-shadow:none}
.btn.ghost:hover:not(:disabled){background:var(--sand)}
.btn.block{width:100%}
.btn:focus-visible, input:focus-visible{outline:2px solid var(--accent); outline-offset:2px}

/* ---------- שדות ---------- */
.field{display:block; margin-bottom:14px}
.field label{display:block; font-size:14px; color:var(--muted); margin-bottom:6px; font-weight:600}
.field input{
  width:100%; padding:14px 15px; border-radius:var(--r-md);
  border:1px solid var(--line); background:var(--sand); color:var(--ink);
}
.field input:focus{background:var(--surface); border-color:var(--accent)}

/* ---------- רצועת מספרים ---------- */
.band{
  display:grid; gap:1px; background:var(--line);
  border-radius:var(--r-lg); overflow:hidden; box-shadow:var(--sh-1);
  grid-template-columns:repeat(auto-fit,minmax(120px,1fr));
}
.band > div{background:var(--surface); padding:16px 18px; text-align:center}
.band .k{font-size:30px; font-weight:800; line-height:1.1; font-variant-numeric:tabular-nums}
.band .l{font-size:13px; color:var(--muted); margin-top:2px}
.band .k.ok{color:var(--ok)} .band .k.bad{color:var(--bad)} .band .k.warn{color:var(--warn)}

/* ---------- רשימות ---------- */
.rows{display:grid; gap:8px}
.row{
  display:flex; align-items:center; gap:12px;
  background:var(--surface); border:1px solid var(--line);
  border-radius:var(--r-md); padding:12px 15px;
}
.row .grow{flex:1; min-width:0}
.row .nm{font-weight:600}

/* ---------- תגיות מצב ----------
   ⚠ צבע לעולם לא לבדו: לכל מצב יש גם מילה. מי שאינו מבחין
   בין ירוק לאדום, ומי שמדפיס בשחור-לבן, חייב לדעת מה קורה. */
.pill{
  font-size:13px; font-weight:700; padding:4px 10px;
  border-radius:999px; white-space:nowrap;
}
.pill.present{background:var(--ok-soft); color:var(--ok)}
.pill.absent{background:var(--bad-soft); color:var(--bad)}
.pill.half{background:var(--warn-soft); color:var(--warn)}
.pill.unmarked{background:var(--sand); color:var(--muted)}

/* ---------- כותרת עליונה ---------- */
.top{
  background:var(--accent); color:#fff; padding:14px 0;
  box-shadow:var(--sh-1); position:sticky; top:0; z-index:10;
}
.top .wrap{display:flex; align-items:center; gap:12px}
.top .nm{font-weight:700; font-size:17px}
.top .sub{font-size:13px; opacity:.75}
.top .grow{flex:1}
.top button{
  background:rgba(255,255,255,.14); border:none; color:#fff;
  padding:7px 13px; border-radius:var(--r-sm); cursor:pointer; font-size:14px;
}
.top button:hover{background:rgba(255,255,255,.24)}

/* ---------- מצבי מסך ----------
   ⚠ **כשל טעינה נראה אחרת מ«אין נתונים».** תמיד. */
.banner{
  border-radius:var(--r-md); padding:13px 16px; margin:14px 0; font-size:15px;
}
.banner.err{background:var(--bad-soft); color:var(--bad); font-weight:600}
.banner.info{background:var(--warn-soft); color:var(--warn)}
.empty{text-align:center; padding:36px 20px; color:var(--muted)}
.skel{
  height:52px; border-radius:var(--r-md); margin-bottom:8px;
  background:linear-gradient(90deg,var(--sand),var(--surface),var(--sand));
  background-size:200% 100%; animation:sk 1.4s infinite;
}
@keyframes sk{to{background-position:-200% 0}}

/* ---------- מסך הכניסה ---------- */
.login{min-height:100%; display:grid; place-items:center; padding:24px 16px}
.login .box{width:100%; max-width:400px}
.login .brand{text-align:center; margin-bottom:22px}
.login .brand .mark{
  width:64px; height:64px; border-radius:18px; margin:0 auto 12px;
  background:var(--accent); color:#fff; display:grid; place-items:center;
  font-size:26px; font-weight:800; box-shadow:var(--sh-2);
}
.login .brand h1{font-size:24px}
.login .brand p{margin:4px 0 0; color:var(--muted); font-size:15px}

/* ============================================================
   הסטודיו
   ============================================================ */
.steps{display:flex; gap:8px; overflow-x:auto; padding:4px 0 12px; scrollbar-width:thin}
.stp{
  display:flex; align-items:center; gap:8px; white-space:nowrap;
  background:var(--surface); border:1px solid var(--line); border-radius:var(--r-md);
  padding:9px 14px; cursor:pointer; box-shadow:var(--sh-1);
}
.stp.on{background:var(--accent); color:#fff; border-color:transparent}
.stp .n{
  width:22px; height:22px; border-radius:50%; display:grid; place-items:center;
  background:var(--sand); color:var(--muted); font-size:12px; font-weight:700;
}
.stp.on .n{background:rgba(255,255,255,.22); color:#fff}
.stp .req{font-size:11px; font-weight:700; color:var(--bad)}
.stp.on .req{color:#fff; opacity:.9}
.stp .ok{font-size:13px; color:var(--ok); font-weight:800}
.stp.on .ok{color:#fff}

.row-btns{display:flex; gap:10px; margin-top:16px; flex-wrap:wrap}
.two{display:grid; grid-template-columns:1fr 1fr; gap:12px}
@media (max-width:560px){.two{grid-template-columns:1fr}}

textarea{
  width:100%; padding:13px 15px; border-radius:var(--r-md);
  border:1px solid var(--line); background:var(--sand); color:var(--ink);
  font-family:inherit; font-size:15px; line-height:1.6; resize:vertical;
}
textarea:focus{background:var(--surface); border-color:var(--accent); outline:none}

/* ---------- צבעים ---------- */
.colors{display:grid; gap:8px}
.col-row{display:flex; align-items:center; gap:12px; padding:8px 10px;
  background:var(--sand); border-radius:var(--r-md)}
.col-row input[type=color]{
  width:42px; height:32px; padding:0; border:1px solid var(--line);
  border-radius:var(--r-sm); background:none; cursor:pointer;
}
.col-row code{font-size:12px; color:var(--muted)}

/* ---------- אוצר מילים ---------- */
.vocab{display:grid; gap:6px}
.vh,.vr{display:grid; grid-template-columns:1.3fr 1fr 1fr; gap:8px; align-items:center}
.vh{font-size:12px; color:var(--faint); padding:0 4px}
.vr code{font-size:11.5px; color:var(--muted); overflow:hidden; text-overflow:ellipsis}
.vr input{padding:9px 11px; border-radius:var(--r-sm); border:1px solid var(--line);
  background:var(--sand); color:var(--ink); width:100%}
.vr input:focus{background:var(--surface); border-color:var(--accent); outline:none}
@media (max-width:560px){
  .vh{display:none}
  .vr{grid-template-columns:1fr 1fr; gap:6px}
  .vr code{grid-column:1 / -1}
}

/* ---------- תפקידים ---------- */
.role{border:1px solid var(--line); border-radius:var(--r-md); padding:14px 16px;
  margin-bottom:10px; background:var(--surface)}
.role-head{display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:10px}
.role-name{font-weight:700; font-size:16px; padding:7px 11px; border-radius:var(--r-sm);
  border:1px solid var(--line); background:var(--sand); color:var(--ink)}
.role-head code{font-size:11.5px; color:var(--faint)}
.chips{display:flex; flex-wrap:wrap; gap:6px}
.chip{font-size:12.5px; padding:5px 11px; border-radius:999px; cursor:pointer;
  border:1px solid var(--line); background:var(--surface); color:var(--muted)}
.chip.on{background:var(--accent); color:#fff; border-color:transparent; font-weight:600}

/* ---------- מודולים ---------- */
.mods{display:grid; gap:10px; grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.mod{border:1px solid var(--line); border-radius:var(--r-md); padding:14px 16px;
  background:var(--surface); opacity:.62; transition:opacity .12s var(--ease)}
.mod.on{opacity:1; box-shadow:var(--sh-1)}
.mod.blocked{opacity:.4}
.mod-top{display:flex; align-items:center; gap:10px; cursor:pointer; margin-bottom:6px}
.mod-top input{width:18px; height:18px; accent-color:var(--accent); cursor:pointer}
.mod .why{margin:0; font-size:14px; color:var(--muted); line-height:1.55}
.mod .faint{margin:6px 0 0}

/* ---------- ייבוא ---------- */
.segs{display:flex; gap:8px; overflow-x:auto; padding-bottom:10px}
.seg{display:flex; align-items:center; gap:7px; white-space:nowrap; cursor:pointer;
  background:var(--surface); border:1px solid var(--line); border-radius:var(--r-md);
  padding:8px 14px; font-size:14.5px}
.seg.on{background:var(--accent); color:#fff; border-color:transparent; font-weight:600}
.seg .cnt{background:var(--sand); color:var(--muted); border-radius:999px;
  padding:1px 7px; font-size:11.5px; font-weight:700}
.seg.on .cnt{background:rgba(255,255,255,.22); color:#fff}

.tbl{border:1px solid var(--line); border-radius:var(--r-md); overflow:hidden; margin:12px 0}
.tr{display:grid; grid-template-columns:repeat(auto-fit,minmax(90px,1fr));
  gap:10px; padding:9px 13px; font-size:14px; border-bottom:1px solid var(--line)}
.tr:last-child{border-bottom:none}
.tr.th{background:var(--sand); font-weight:700; font-size:12.5px; color:var(--muted)}
.tr span{overflow:hidden; text-overflow:ellipsis; white-space:nowrap}

.rejects{background:var(--bad-soft); border-radius:var(--r-md); padding:12px 15px; margin:12px 0}
.rejects h4{margin:0 0 8px; font-size:14px; color:var(--bad)}
.rejects h4 ~ h4{margin-top:14px}
.rj{display:flex; gap:10px; align-items:baseline; font-size:13.5px;
  padding:4px 0; flex-wrap:wrap}
.rj .ln{color:var(--muted); font-size:12px; white-space:nowrap}
.rj .raw{flex:1; min-width:120px; color:var(--ink)}
.rj .why{color:var(--bad); font-weight:600}

.banner.ok-b{background:var(--ok-soft); color:var(--ok); font-weight:600}

/* ---------- ניווט לפי קבוצות ---------- */
.navg{margin-bottom:14px}
.navg h4{margin:0 0 6px; font-size:12px; color:var(--faint); font-weight:700}
.navg .chips{gap:6px}

.pl{padding:30px 24px; text-align:center}
.pl h3{margin:0 0 8px}
.pl .why{color:var(--muted); max-width:46ch; margin:0 auto 12px}

/* ============================================================
   מה שנוסף עם מסכי התוכן
   ------------------------------------------------------------
   ⚠⚠ **אין בקטיקים בקובץ הזה.** הוא כולו מחרוזת תבנית אחת,
     ובקטיק בהערת CSS **סוגר אותה** והשארית הופכת לקוד. זה
     נתפס כאן בבנייה, ובמערכת הקודמת זה קרה חמש פעמים —
     ובאחת מהן הבנייה דיווחה הצלחה בעוד הדפדפן נשבר.
     npm run check סופר אותם ונכשל על כל תוספת.

   ⚠ טוקנים בלבד, בלי הקס — הצבעים מגיעים מהאפיון של המכינה.

   ⚠ .banner.ok לצד .banner.ok-b שכבר היה: השם הישן נשאר
     כדי לא לשבור מסכים קיימים, והחדש הוא מה שנכתב מעכשיו.
   ============================================================ */
.banner.ok{background:var(--ok-soft); color:var(--ok); font-weight:600}

.pill.ok{background:var(--ok-soft); color:var(--ok)}
.pill.warn{background:var(--warn-soft); color:var(--warn)}
.pill.bad{background:var(--bad-soft); color:var(--bad)}
.pill.plain{background:var(--sand); color:var(--muted)}

.btn.sm{padding:7px 13px; font-size:14px; box-shadow:none}
.btn:disabled{opacity:.5; cursor:not-allowed}

/* ⚠ שורת פעולות שאינה משטח. .row כבר תפוסה למשטח מוקף
   מסגרת, ולכן שם אחר ולא עוד וריאציה שלה. */
.line{display:flex; align-items:center; gap:8px; flex-wrap:wrap}
.line .grow{flex:1; min-width:0}

/* ⚠ .field label כבר קיים; span הוא אותו דבר, כי כל רכיב
   חדש נכתב עם label+span — ושתי צורות לאותו דבר הן בדיוק
   איך שעיצוב מתפצל. */
.field>span{display:block; font-size:14px; color:var(--muted);
  margin-bottom:6px; font-weight:600}
.field textarea, .field select{
  width:100%; padding:13px 15px; border-radius:var(--r-md);
  border:1px solid var(--line); background:var(--sand); color:var(--ink);
  font-family:inherit; font-size:15px;
}
.hint{font-size:13px; color:var(--faint); margin-top:5px}

/* ⚠ טבלת פריטים: שורה שנקראת בסריקה, לא כרטיס לכל דבר.
   105 פריטי מלאי ככרטיסים הם עשרה מסכי גלילה. */
.item{
  display:flex; align-items:center; gap:10px;
  background:var(--surface); border:1px solid var(--line);
  border-radius:var(--r-md); padding:10px 14px; margin-bottom:6px;
}
.item .nm{font-weight:600; flex:1; min-width:0}
.item .qty{font-variant-numeric:tabular-nums; font-weight:700; min-width:56px;
  text-align:center}
.item.low{border-color:var(--bad); background:var(--bad-soft)}
.item.bought{opacity:.5}

/* ⚠ פס כמות מול יעד. מספר לבדו אינו נקרא ברשימה של מאה. */
.mini-bar{height:5px; border-radius:999px; background:var(--sand);
  overflow:hidden; width:70px; flex:none}
.mini-bar>i{display:block; height:100%; background:var(--ok)}
.mini-bar.low>i{background:var(--bad)}

.stepper{display:flex; align-items:center; gap:4px}
.stepper button{
  width:34px; height:34px; border-radius:var(--r-sm); cursor:pointer;
  border:1px solid var(--line); background:var(--surface); font-weight:700;
}
.stepper button:hover{border-color:var(--accent)}

@media (prefers-reduced-motion: reduce){
  *{animation:none !important; transition:none !important}
}
`;

/**
 * מחיל את צבעי המכינה על :root.
 * ⚠ **בזמן ריצה ולא בבנייה** — זו כל הסיבה שאותה חבילה
 *   משרתת כל מכינה.
 */
export function applyColors(colors = {}) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(colors)) {
    if (/^#[0-9a-fA-F]{6}$/.test(String(v))) root.style.setProperty(`--${k}`, v);
  }
}
