/* ============================================================
   האתר — הגיליון של דף הנחיתה וההרשמה
   ------------------------------------------------------------
   ⚠⚠⚠ **גיליון שלישי, ובכוונה.** `CSS` של האפליקציה,
     `CONSOLE_CSS` של הקונסולה, ו-`SITE_CSS` כאן — שלושתם
     מגדירים `:root` ו-`body`, והאחרון שנטען היה מנצח. שלושת
     המוצרים לעולם אינם על אותו דף, וכל אחד מזריק את שלו.

   ⚠⚠ **ולמה לא להשתמש בגיליון של האפליקציה.** לדף נחיתה יש
     עבודה אחרת לגמרי: הוא נקרא פעם אחת על ידי מי שאינו מכיר
     את המוצר, בגלילה, ולרוב בטלפון. הוא צריך טיפוגרפיה
     גדולה, נשימה, וכותרת שנקראת משנייה. אפליקציה צריכה
     צפיפות, טבלאות ומצבים. כלל שמנסה לשרת את שניהם משרת
     גרוע את שניהם.

   ⚠ **אין בקטיקים בקובץ הזה מלבד אלה שעוטפים מחרוזת.**
     בקטיק בהערת CSS סוגר את מחרוזת התבנית והשארית הופכת
     לקוד. `npm run check` סופר אותם — הוא כבר תפס את זה כאן
     פעם אחת.

   ============================================================
   השפה
   ------------------------------------------------------------
   אותה זהות של המוצר — קרם, נייבי, חימר — אבל בקנה מידה של
   אתר: כותרות ענק עם letter-spacing שלילי, הרבה אוויר, וצבע
   במשורה. הרקע אינו לבן אלא קרם, כי לבן מלא נראה כמו מסמך.
   ============================================================ */

export const SITE_CSS = `
:root{
  --ink: #1B2430;
  --ink-2: #44505F;
  --ink-3: #6B7787;
  --cream: #F7F4ED;
  --cream-2: #EFEAE0;
  --paper: #FFFFFF;
  --navy: #002454;
  --navy-2: #0A3A78;
  --clay: #A25B3C;
  --line: #E3DDD1;
  --line-2: #D5CDBD;
  --ok: #1B7A4B;
  --bad: #A8321F;

  --r-sm: 10px; --r-md: 16px; --r-lg: 24px; --r-xl: 34px;
  --ease: cubic-bezier(.22,1,.36,1);
  --shadow-1: 0 1px 2px rgba(27,36,48,.05), 0 6px 18px -10px rgba(27,36,48,.18);
  --shadow-2: 0 2px 4px rgba(27,36,48,.05), 0 20px 46px -18px rgba(27,36,48,.28);
  --shadow-3: 0 30px 80px -28px rgba(0,36,84,.42);
  --glow: 0 10px 30px -12px rgba(0,36,84,.55);
}

*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%; scroll-behavior:smooth}
body{
  margin:0; background:var(--cream); color:var(--ink);
  font-family:Assistant,"Segoe UI",Arial,system-ui,sans-serif;
  font-size:17px; line-height:1.7;
  -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
}
button,input,select,textarea{font:inherit; color:inherit}
button{background:none; border:none; padding:0; cursor:pointer}
svg{display:block; flex:none}
a{color:inherit; text-decoration:none}
:focus-visible{outline:2px solid var(--navy); outline-offset:3px; border-radius:6px}
h1,h2,h3,h4{margin:0; line-height:1.15; font-weight:800; letter-spacing:-.03em}
p{margin:0}

.st-wrap{max-width:1180px; margin:0 auto; padding:0 24px}
.st-row{display:flex; align-items:center; gap:14px}
.st-grow{flex:1; min-width:0}
.st-mono{font-family:ui-monospace,Menlo,Consolas,monospace; direction:ltr; font-size:13.5px}

/* ============================================================
   הרצועה העליונה
   ⚠ **דביקה ומיטשטשת ולא אטומה.** רצועה אטומה על גלילה
     חותכת את הדף לשניים; טשטוש משאיר את התוכן נוכח מתחתיה.
   ============================================================ */
.st-nav{
  position:sticky; top:0; z-index:50;
  background:rgba(247,244,237,.82);
  backdrop-filter:saturate(1.6) blur(14px);
  -webkit-backdrop-filter:saturate(1.6) blur(14px);
  border-bottom:1px solid transparent;
  transition:border-color 200ms var(--ease), background 200ms var(--ease);
}
.st-nav.on{border-bottom-color:var(--line); background:rgba(247,244,237,.94)}
.st-nav .st-wrap{height:74px; display:flex; align-items:center; gap:20px}
.st-logo{display:flex; align-items:center; gap:10px; font-weight:800; font-size:20px;
  letter-spacing:-.03em}
.st-logo i{width:30px; height:30px; border-radius:9px; display:grid; place-items:center;
  background:linear-gradient(145deg,var(--navy),var(--navy-2)); color:#fff;
  font-style:normal; font-size:15px; font-weight:800}
.st-links{display:flex; gap:26px; font-size:15.5px; font-weight:600; color:var(--ink-2)}
.st-links a:hover{color:var(--ink)}
@media (max-width:860px){ .st-links{display:none} }

/* ============================================================
   כפתורים
   ⚠ הראשי נושא זוהר **בצבעו שלו** ולא צל אפור — צל אפור
     מתחת לכפתור כהה נראה כמו שכבה זרה.
   ============================================================ */
.st-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:9px;
  height:52px; padding:0 30px; border-radius:var(--r-md);
  background:linear-gradient(170deg,var(--navy-2),var(--navy));
  color:#fff; font-weight:700; font-size:16.5px; white-space:nowrap;
  box-shadow:var(--glow);
  transition:transform 140ms var(--ease), box-shadow 140ms var(--ease), filter 140ms var(--ease);
}
.st-btn:hover{transform:translateY(-1px); box-shadow:0 16px 40px -14px rgba(0,36,84,.62)}
.st-btn:active{transform:translateY(1px)}
.st-btn:disabled{opacity:.5; cursor:not-allowed; transform:none; filter:grayscale(.4)}
.st-btn.ghost{background:var(--paper); color:var(--ink); box-shadow:var(--shadow-1);
  border:1px solid var(--line)}
.st-btn.ghost:hover{border-color:var(--line-2); box-shadow:var(--shadow-2)}
.st-btn.sm{height:42px; padding:0 20px; font-size:15px; border-radius:var(--r-sm)}
.st-btn.lg{height:60px; padding:0 38px; font-size:18px}
.st-btn.block{width:100%}
.st-btn.quiet{background:none; color:var(--ink-2); box-shadow:none}
.st-btn.quiet:hover{color:var(--ink); background:var(--cream-2)}

/* ============================================================
   הגיבור
   ⚠⚠ **הכותרת אומרת מה זה, לא כמה זה מדהים.** מי שמגיע לדף
     הזה הוא ראש מכינה עמוס שקיבל קישור, ויש לו שלוש שניות.
   ============================================================ */
.st-hero{padding:76px 0 40px; position:relative; overflow:hidden}
.st-hero::before{
  content:""; position:absolute; inset-inline-start:-18%; top:-34%;
  width:78%; aspect-ratio:1; border-radius:50%;
  background:radial-gradient(circle at 50% 50%, rgba(0,36,84,.09), transparent 62%);
  pointer-events:none;
}
.st-hero .st-wrap{display:grid; grid-template-columns:1.05fr .95fr; gap:56px;
  align-items:center; position:relative}
@media (max-width:980px){
  .st-hero{padding-top:44px}
  .st-hero .st-wrap{grid-template-columns:1fr; gap:38px}
}
.st-eyebrow{display:inline-flex; align-items:center; gap:8px; font-size:14px;
  font-weight:700; color:var(--navy); background:rgba(0,36,84,.07);
  border-radius:999px; padding:7px 15px; margin-bottom:22px}
.st-h1{font-size:clamp(38px,5.4vw,66px); letter-spacing:-.04em; line-height:1.05}
.st-h1 em{font-style:normal; color:var(--navy);
  background:linear-gradient(180deg,transparent 62%,rgba(162,91,60,.22) 0); }
.st-sub{margin-top:22px; font-size:clamp(17px,2.1vw,21px); color:var(--ink-2);
  max-width:34ch; line-height:1.6}
.st-cta{margin-top:34px; display:flex; gap:12px; flex-wrap:wrap; align-items:center}
.st-fine{margin-top:16px; font-size:14.5px; color:var(--ink-3)}
.st-fine b{color:var(--ink-2)}

/* ============================================================
   התצוגה — צילום מסך מצויר, לא תמונה
   ⚠⚠ **מצויר ב-CSS ולא PNG.** צילום מסך מתיישן ברגע שהמוצר
     משתנה, ואז הדף מוכר משהו שאינו קיים. מה שמצויר כאן הוא
     **המבנה** — סרגל, כרטיסים, רשימה — והוא נשאר נכון.
   ============================================================ */
.st-shot{
  background:var(--paper); border-radius:var(--r-xl); box-shadow:var(--shadow-3);
  border:1px solid var(--line); overflow:hidden; transform:perspective(1400px) rotateY(3deg);
}
@media (max-width:980px){ .st-shot{transform:none} }
.st-shot-bar{height:40px; background:var(--cream-2); border-bottom:1px solid var(--line);
  display:flex; align-items:center; gap:6px; padding:0 14px}
.st-shot-bar i{width:9px; height:9px; border-radius:50%; background:var(--line-2)}
.st-shot-bar span{margin-inline-start:auto; font-size:11.5px; color:var(--ink-3);
  font-family:ui-monospace,Menlo,Consolas,monospace; direction:ltr}
.st-shot-body{display:flex; min-height:320px}
.st-shot-side{width:132px; flex:none; border-inline-start:1px solid var(--line);
  padding:14px 10px; background:#FCFBF8; order:2}
.st-shot-side b{display:block; font-size:10px; color:var(--ink-3); padding:0 8px 7px;
  letter-spacing:.06em}
.st-shot-side u{display:flex; align-items:center; gap:7px; text-decoration:none;
  font-size:12px; color:var(--ink-2); padding:6px 8px; border-radius:7px; margin-bottom:2px}
.st-shot-side u.on{background:rgba(0,36,84,.08); color:var(--navy); font-weight:700}
.st-shot-side u i{width:13px; height:13px; border-radius:4px; background:var(--line-2);
  flex:none}
.st-shot-side u.on i{background:var(--navy)}
.st-shot-main{flex:1; padding:18px; order:1; min-width:0}
.st-shot-h{font-size:15px; font-weight:800; margin-bottom:12px; letter-spacing:-.02em}
.st-band{display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line);
  border:1px solid var(--line); border-radius:12px; overflow:hidden; margin-bottom:14px}
.st-band div{background:var(--paper); padding:11px 8px; text-align:center}
.st-band b{display:block; font-size:19px; font-weight:800; letter-spacing:-.03em}
.st-band span{font-size:10.5px; color:var(--ink-3)}
.st-band .g{color:var(--ok)} .st-band .r{color:var(--bad)} .st-band .n{color:var(--navy)}
.st-list{display:grid; gap:6px}
.st-li{display:flex; align-items:center; gap:9px; border:1px solid var(--line);
  border-radius:10px; padding:8px 11px; background:var(--paper); font-size:12.5px}
.st-li i{width:22px; height:22px; border-radius:7px; flex:none; background:var(--cream-2)}
.st-li b{font-weight:600}
.st-li span{margin-inline-start:auto; font-size:10.5px; font-weight:700;
  border-radius:999px; padding:2px 9px; background:var(--cream-2); color:var(--ink-3)}
.st-li span.g{background:rgba(27,122,75,.13); color:var(--ok)}
.st-li span.a{background:rgba(162,91,60,.15); color:var(--clay)}

/* ============================================================
   רצועת האמון
   ============================================================ */
.st-strip{border-block:1px solid var(--line); background:var(--paper);
  padding:22px 0; margin-top:40px}
.st-strip .st-wrap{display:flex; gap:38px; flex-wrap:wrap; justify-content:center;
  align-items:center; text-align:center}
.st-strip div{min-width:130px}
.st-strip b{display:block; font-size:27px; font-weight:800; letter-spacing:-.035em;
  color:var(--navy)}
.st-strip span{font-size:14px; color:var(--ink-3)}

/* ============================================================
   מקטעים
   ============================================================ */
.st-sec{padding:84px 0}
.st-sec.alt{background:var(--paper); border-block:1px solid var(--line)}
.st-head{max-width:64ch; margin-bottom:44px}
.st-tag{font-size:13.5px; font-weight:800; color:var(--clay); letter-spacing:.08em;
  margin-bottom:12px}
.st-h2{font-size:clamp(28px,3.6vw,42px); letter-spacing:-.035em}
.st-lead{margin-top:16px; font-size:18px; color:var(--ink-2); line-height:1.65}

.st-grid{display:grid; gap:20px; grid-template-columns:repeat(auto-fit,minmax(272px,1fr))}
.st-card{background:var(--paper); border:1px solid var(--line); border-radius:var(--r-lg);
  padding:28px; box-shadow:var(--shadow-1);
  transition:transform 180ms var(--ease), box-shadow 180ms var(--ease),
             border-color 180ms var(--ease)}
.st-card:hover{transform:translateY(-3px); box-shadow:var(--shadow-2);
  border-color:var(--line-2)}
.st-sec.alt .st-card{background:var(--cream)}
.st-card .ic{width:46px; height:46px; border-radius:14px; display:grid; place-items:center;
  background:rgba(0,36,84,.08); color:var(--navy); margin-bottom:18px}
.st-card h3{font-size:19px; margin-bottom:9px; letter-spacing:-.02em}
.st-card p{color:var(--ink-2); font-size:15.5px; line-height:1.62}

/* ⚠ רשימת מודולים — **נגזרת מהתבנית** ולא מוקלדת בדף.
   ראו server/routes/public.js. */
.st-mods{display:flex; flex-wrap:wrap; gap:9px}
.st-mod{display:inline-flex; align-items:center; gap:7px; background:var(--paper);
  border:1px solid var(--line); border-radius:999px; padding:9px 16px;
  font-size:14.5px; font-weight:600}
.st-sec.alt .st-mod{background:var(--cream)}
.st-mod i{width:6px; height:6px; border-radius:50%; background:var(--navy); flex:none}
.st-mod.core i{background:var(--clay)}

/* ⚠ הצעד — הסבר של שלושה שלבים, ממוספר. */
.st-steps{display:grid; gap:26px; grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
  counter-reset:s}
.st-step{position:relative; padding-top:8px}
.st-step::before{counter-increment:s; content:counter(s);
  display:grid; place-items:center; width:40px; height:40px; border-radius:13px;
  background:var(--navy); color:#fff; font-weight:800; font-size:17px; margin-bottom:16px}
.st-step h3{font-size:18.5px; margin-bottom:8px}
.st-step p{color:var(--ink-2); font-size:15.5px}

/* ============================================================
   הטופס
   ⚠⚠ **שדה גבוה במילוי רך ולא לבן.** שדה לבן על כרטיס לבן
     נשען על המסגרת בלבד, ומסגרת דקה נעלמת בשמש.
   ============================================================ */
.st-form{background:var(--paper); border:1px solid var(--line);
  border-radius:var(--r-xl); padding:38px; box-shadow:var(--shadow-2);
  max-width:560px; margin:0 auto}
@media (max-width:620px){ .st-form{padding:24px; border-radius:var(--r-lg)} }
.st-f{display:block; margin-bottom:20px}
.st-f > span{display:block; font-size:14.5px; font-weight:700; margin-bottom:7px;
  color:var(--ink-2)}
.st-f > span u{text-decoration:none; color:var(--ink-3); font-weight:500}
.st-f input{
  width:100%; height:54px; padding:0 17px; border-radius:var(--r-md);
  border:1px solid var(--line); background:var(--cream); outline:none;
  transition:background 140ms var(--ease), border-color 140ms var(--ease),
             box-shadow 140ms var(--ease);
}
.st-f input:focus{background:var(--paper); border-color:var(--navy);
  box-shadow:0 0 0 4px rgba(0,36,84,.12)}
.st-f input::placeholder{color:var(--ink-3)}
.st-f.bad input{border-color:var(--bad)}
.st-f.bad input:focus{box-shadow:0 0 0 4px rgba(168,50,31,.14)}
.st-hint{font-size:13.5px; color:var(--ink-3); margin-top:7px; line-height:1.5}
.st-err{font-size:13.5px; color:var(--bad); margin-top:7px; font-weight:600}
.st-ok{font-size:13.5px; color:var(--ok); margin-top:7px; font-weight:600}
.st-two{display:grid; grid-template-columns:1fr 1fr; gap:14px}
@media (max-width:560px){ .st-two{grid-template-columns:1fr} }

/* ⚠ תצוגת הכתובת שתיווצר — היא נשארת על הניירת של המכינה
   לשנים, ולכן היא מוצגת גדול ולא כהערה קטנה. */
.st-url{display:flex; align-items:center; gap:2px; background:var(--cream);
  border:1px dashed var(--line-2); border-radius:var(--r-md); padding:13px 16px;
  direction:ltr; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:14px;
  color:var(--ink-3); overflow:hidden}
.st-url b{color:var(--navy); font-weight:700}
.st-url em{font-style:normal; color:var(--ink-3)}

/* ⚠ שדה הפיתיון — מוסתר מהעין **ומקורא המסך**, אחרת מי
   שמשתמש בקורא מסך ממלא אותו ונחסם. */
.st-pot{position:absolute; inset-inline-start:-9999px; width:1px; height:1px;
  opacity:0; pointer-events:none}

.st-note{border-radius:var(--r-md); padding:13px 17px; font-size:15px; margin-bottom:20px;
  display:flex; gap:10px; align-items:flex-start; line-height:1.55}
.st-note.bad{background:rgba(168,50,31,.08); color:var(--bad);
  border:1px solid rgba(168,50,31,.22); font-weight:600}
.st-note.info{background:rgba(0,36,84,.06); color:var(--ink-2);
  border:1px solid rgba(0,36,84,.14)}
.st-note.ok{background:rgba(27,122,75,.09); color:var(--ok);
  border:1px solid rgba(27,122,75,.24); font-weight:600}

/* ============================================================
   שאלות
   ============================================================ */
.st-q{border-bottom:1px solid var(--line); padding:22px 0}
.st-q:last-child{border-bottom:0}
.st-q h3{font-size:18px; margin-bottom:9px; letter-spacing:-.02em}
.st-q p{color:var(--ink-2); font-size:15.5px; line-height:1.65}

/* ============================================================
   הסיום
   ============================================================ */
.st-end{background:linear-gradient(165deg,var(--navy),#00183A); color:#fff;
  padding:84px 0; text-align:center; position:relative; overflow:hidden}
.st-end::after{content:""; position:absolute; inset-inline-end:-12%; bottom:-46%;
  width:56%; aspect-ratio:1; border-radius:50%;
  background:radial-gradient(circle,rgba(162,91,60,.34),transparent 64%)}
.st-end .st-wrap{position:relative}
.st-end h2{font-size:clamp(28px,4vw,44px); letter-spacing:-.035em}
.st-end p{margin:18px auto 0; max-width:50ch; color:rgba(255,255,255,.76); font-size:18px}
.st-end .st-btn{background:#fff; color:var(--navy); box-shadow:0 14px 40px -14px rgba(0,0,0,.6);
  margin-top:32px}
.st-end .st-btn:hover{background:#fff; transform:translateY(-1px)}

.st-foot{padding:34px 0; font-size:14.5px; color:var(--ink-3)}
.st-foot .st-wrap{display:flex; gap:18px; flex-wrap:wrap; align-items:center}

/* ⚠ הנפשת כניסה על הגיבור בלבד. רשימה שנכנסת בהנפשה נראית
   איטית, לא חיה — ו-prefers-reduced-motion מבטל הכול. */
.st-in{animation:stRise 620ms var(--ease) backwards}
.st-in:nth-child(2){animation-delay:70ms}
.st-in:nth-child(3){animation-delay:140ms}
@keyframes stRise{from{opacity:0; transform:translateY(14px)}}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:1ms !important; transition-duration:1ms !important;
    scroll-behavior:auto !important}
}
`;
