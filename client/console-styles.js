/* ============================================================
   העיצוב של הקונסולה
   ------------------------------------------------------------
   ⚠⚠ **נראית אחרת מכל מכינה, ובכוונה.** האפליקציה לובשת את
     הצבעים של הלקוח, ולכן כל מכינה נראית אחרת — ומי שעובד
     בשש לשוניות פתוחות חייב לדעת **במבט אחד** אם הוא בכלי
     הניהול שלו או בתוך מכינה אמיתית. פלטה כהה היא הסימן,
     והיא זולה בהרבה מכל באנר.

   ⚠ **כל ההקסים בבלוק אחד למעלה**, כמו ב-styles.js. משתנה
     CSS שאינו קיים נפתר ל«כלום» ואינו שגיאה — זה בדיוק
     הבאג שחי חודשים עם `--sand` ועם `--navy`.

   ⚠ **אין כאן `applyColors`.** הקונסולה אינה של אף לקוח,
     ולכן אין מה להחיל עליה.
   ============================================================ */

export const CONSOLE_CSS = `
:root{
  --c-bg:#12161C; --c-panel:#1A2028; --c-panel2:#212936;
  --c-ink:#E9EDF2; --c-muted:#98A4B4; --c-faint:#6B7787;
  --c-line:#2B3442; --c-line-hi:#37424F;
  --c-accent:#5B9DF9; --c-accent-ink:#0B1220;
  --c-ok:#3FBF7F; --c-warn:#E0A33E; --c-bad:#E5675B;
  --c-r:14px; --c-r-sm:9px;
  --c-sh:0 1px 2px rgba(0,0,0,.4), 0 16px 40px -20px rgba(0,0,0,.8);
  --c-ease:cubic-bezier(.22,1,.36,1);
}

*{box-sizing:border-box}
html,body,#root{height:100%}
body{
  margin:0; background:var(--c-bg); color:var(--c-ink);
  font-family:"Assistant","Segoe UI",system-ui,-apple-system,sans-serif;
  font-size:15px; line-height:1.6; -webkit-font-smoothing:antialiased;
}
button,input,textarea,select{font:inherit; color:inherit}

.cx{min-height:100%; padding-bottom:60px}
.cwrap{max-width:1000px; margin:0 auto; padding:0 18px}

/* ---------- כותרת ---------- */
.ctop{
  border-bottom:1px solid var(--c-line); background:var(--c-panel);
  position:sticky; top:0; z-index:20;
}
.ctop .cwrap{display:flex; align-items:center; gap:12px; height:58px}
.ctop .brand{font-weight:800; letter-spacing:-.02em; font-size:17px}
.ctop .dot{
  width:9px; height:9px; border-radius:50%; background:var(--c-accent);
  box-shadow:0 0 0 4px rgba(91,157,249,.16);
}
.ctop .grow{flex:1}
.ctop button{
  background:transparent; border:1px solid var(--c-line);
  border-radius:var(--c-r-sm); padding:6px 13px; cursor:pointer;
  color:var(--c-muted);
}
.ctop button:hover{color:var(--c-ink); border-color:var(--c-accent)}

h1{margin:0; font-size:24px; font-weight:800; letter-spacing:-.02em}
h2{margin:0; font-size:17px; font-weight:700}
h3{margin:0; font-size:15px; font-weight:700}
.cmuted{color:var(--c-muted)}
.cfaint{color:var(--c-faint); font-size:13px}

/* ---------- משטחים ---------- */
.cpanel{
  background:var(--c-panel); border:1px solid var(--c-line);
  border-radius:var(--c-r); box-shadow:var(--c-sh); padding:18px 20px;
}

/* ---------- רצועת המספרים ---------- */
.cband{
  display:grid; grid-template-columns:repeat(4,1fr); gap:2px;
  background:var(--c-line); border:1px solid var(--c-line);
  border-radius:var(--c-r); overflow:hidden; margin:18px 0;
}
.cband>div{background:var(--c-panel); padding:14px 16px; text-align:center}
.cband .k{font-size:24px; font-weight:800; letter-spacing:-.02em}
.cband .l{font-size:12px; color:var(--c-muted)}
.cband .k.ok{color:var(--c-ok)}
.cband .k.warn{color:var(--c-warn)}
.cband .k.bad{color:var(--c-bad)}

/* ---------- כרטיס מכינה ---------- */
.mrow{
  background:var(--c-panel); border:1px solid var(--c-line);
  border-radius:var(--c-r); margin-bottom:10px; overflow:hidden;
  transition:border-color .12s var(--c-ease);
}
.mrow:hover{border-color:var(--c-line-hi)}
.mrow.arch{opacity:.55}
.mrow.broken{border-color:var(--c-bad)}
.mhead{display:flex; align-items:center; gap:12px; padding:14px 16px; cursor:pointer}
.mswatch{
  width:34px; height:34px; border-radius:9px; flex:none;
  border:1px solid var(--c-line);
}
.mname{font-weight:700}
.mslug{
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:12px; color:var(--c-faint); direction:ltr;
}
.mstat{display:flex; gap:14px; font-size:13px; color:var(--c-muted); flex:none}
.mstat b{color:var(--c-ink); font-weight:700}

.tag{
  font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px;
  border:1px solid var(--c-line); color:var(--c-muted);
}
.tag.warn{color:var(--c-warn); border-color:var(--c-warn)}
.tag.bad{color:var(--c-bad); border-color:var(--c-bad)}
.tag.ok{color:var(--c-ok); border-color:var(--c-ok)}

.mbody{border-top:1px solid var(--c-line); padding:16px; background:var(--c-panel2)}
.mgrid{display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:14px}

/* ---------- כפתורים ---------- */
.cbtn{
  border:1px solid transparent; border-radius:var(--c-r-sm);
  padding:9px 16px; cursor:pointer; font-weight:600;
  background:var(--c-accent); color:var(--c-accent-ink);
  transition:filter .12s var(--c-ease);
}
.cbtn:hover{filter:brightness(1.08)}
.cbtn:disabled{opacity:.45; cursor:not-allowed}
.cbtn.ghost{background:transparent; border-color:var(--c-line); color:var(--c-ink)}
.cbtn.ghost:hover{border-color:var(--c-accent)}
.cbtn.danger{background:transparent; border-color:var(--c-bad); color:var(--c-bad)}
.cbtn.sm{padding:6px 12px; font-size:13px}
.crow{display:flex; gap:8px; flex-wrap:wrap; align-items:center}

/* ---------- טפסים ---------- */
.cfield{display:block; margin-bottom:12px}
.cfield>span{display:block; font-size:13px; color:var(--c-muted); margin-bottom:5px}
.cfield input, .cfield textarea, .cfield select{
  width:100%; background:var(--c-bg); color:var(--c-ink);
  border:1px solid var(--c-line); border-radius:var(--c-r-sm);
  padding:11px 13px; outline:none;
}
.cfield input:focus, .cfield textarea:focus{
  border-color:var(--c-accent); box-shadow:0 0 0 3px rgba(91,157,249,.16);
}
.cfield input.ltr{direction:ltr; text-align:left;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.chint{font-size:12px; color:var(--c-faint); margin-top:4px}

/* ---------- הודעות ---------- */
.cbanner{
  border-radius:var(--c-r-sm); padding:11px 14px; margin:12px 0;
  border:1px solid var(--c-line); font-size:14px;
}
.cbanner.err{border-color:var(--c-bad); color:var(--c-bad)}
.cbanner.ok{border-color:var(--c-ok); color:var(--c-ok)}
.cbanner.info{color:var(--c-muted)}

.cempty{text-align:center; padding:44px 20px; color:var(--c-muted)}
.cskel{
  height:62px; border-radius:var(--c-r); margin-bottom:10px;
  background:linear-gradient(90deg,var(--c-panel),var(--c-panel2),var(--c-panel));
  background-size:200% 100%; animation:csk 1.2s linear infinite;
}
@keyframes csk{to{background-position:-200% 0}}

.clog{
  font-size:12px; color:var(--c-faint); direction:ltr; text-align:left;
  max-height:120px; overflow-y:auto;
}

/* ---------- מסך כניסה ---------- */
.cgate{max-width:380px; margin:0 auto; padding-top:14vh}
.cgate .cpanel{padding:26px}

@media (max-width:620px){
  .cband{grid-template-columns:repeat(2,1fr)}
  .mstat{display:none}
}
@media (prefers-reduced-motion: reduce){
  *{animation:none !important; transition:none !important}
}
`;
