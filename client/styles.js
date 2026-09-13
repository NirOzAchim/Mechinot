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
