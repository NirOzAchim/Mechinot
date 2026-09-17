/* ============================================================
   ⚠⚠⚠ הבדיקה שנולדה מפני שהבנייה אינה תופסת ReferenceError
   ------------------------------------------------------------
   `vite build` **בונה, עובר, ומדפיס הצלחה** על קובץ שמשתמש
   בשם שלא יובא. השגיאה מגיעה בזמן ריצה, בדפדפן, כמסך לבן —
   ולעתים רק במסלול אחד מתוך שמונה, כלומר אחרי שכבר נדחף.

   זה קרה כאן פעמיים **באותה עריכה**: `<Bar />` בלי ייבוא,
   ו-`REQUIRED` שמעולם לא הוגדר. שתיהן עברו `npm run check`
   נקי לגמרי.

   ------------------------------------------------------------
   ⚠⚠ שני כללים, ולא חבילת lint
   ------------------------------------------------------------
   מאגר שמציף אלפי אזהרות סגנון הוא מאגר שמפסיקים להסתכל על
   הפלט שלו — כלומר גם על הכלל היחיד שמונע מסך לבן. לכן:

     1. **רכיב JSX בשם גדול** (`<Foo>`, `<Foo.Bar>`) חייב
        להיות מיובא או מוצהר באותו קובץ.
     2. **מזהה ב-SCREAMING_CASE** שמופיע בקוד חייב להיות
        מיובא או מוצהר. במאגר הזה קבועים הם תמיד ברמת
        המודול, ולכן זה אות בעל יחס רעש נמוך במיוחד.

   ⚠ **וזו אינה ניתוח scope.** משתנה מקומי באות קטנה אינו
     נבדק כאן, ובכוונה — הדבר היה דורש parser מלא, והשגיאות
     שהוא היה מוסיף אינן אלה שמפילות מסכים.

   הרצה:  npm run check   (או node tools/check-undef.mjs)
   ============================================================ */

import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const DIR = join(ROOT, "client");

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log("  ✗ " + msg); } };

/* ⚠ שמות שהסביבה נותנת ואינם מיובאים לעולם. רשימה סגורה
   וקצרה — כל תוספת כאן היא ויתור על כיסוי. */
const GLOBALS = new Set([
  "React", "Fragment",
  "Math", "Date", "JSON", "Object", "Array", "String", "Number", "Boolean",
  "Set", "Map", "WeakMap", "Promise", "Intl", "RegExp", "Error", "URL",
  "URLSearchParams", "FormData", "Blob", "File", "FileReader", "Image",
  "DecompressionStream", "TextDecoder", "TextEncoder", "AbortController",
  "ResizeObserver", "MutationObserver", "IntersectionObserver",
  "NaN", "Infinity",
]);

/** שמות שהקובץ מייבא, מצהיר עליהם, או מקבל כפרמטר מפורק */
function declared(src) {
  const out = new Set(GLOBALS);

  /* ייבוא: named, default, namespace */
  for (const m of src.matchAll(/import\s+([^;]+?)\s+from\s*["'][^"']+["']/g)) {
    const clause = m[1];
    for (const n of clause.matchAll(/\{([^}]*)\}/g)) {
      for (const part of n[1].split(",")) {
        const name = part.split(/\s+as\s+/).pop().trim();
        if (name) out.add(name);
      }
    }
    /* `import * as MI` ו-`import X from` */
    const ns = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
    if (ns) out.add(ns[1]);
    const def = clause.replace(/\{[^}]*\}/g, "").replace(/\*\s+as\s+[\w$]+/, "")
      .split(",")[0].trim();
    if (/^[A-Za-z_$][\w$]*$/.test(def)) out.add(def);
  }

  /* הצהרות: const/let/var/function/class — בכל רמה */
  for (const m of src.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) {
    out.add(m[1]);
  }
  /* פירוק: const { a, b } = ...  ו-({ a, b }) => */
  for (const m of src.matchAll(/[{,]\s*([A-Za-z_$][\w$]*)\s*(?:[=,}])/g)) {
    out.add(m[1]);
  }
  /* ⚠⚠ **פירוק עם שם אחר** — `{ icon: Icon }` מציג את
     `Icon`, לא את `icon`. בלי זה כל `Empty` ו`Feature`
     במאגר דווחו כרכיב שאינו קיים — ארבע התאמות
     שגויות בהרצה הראשונה, וזו בדיוק הדרך שבה
     מפסיקים לקרוא פלט של בדיקה. */
  for (const m of src.matchAll(/[{,]\s*[A-Za-z_$][\w$]*\s*:\s*([A-Za-z_$][\w$]*)/g)) {
    out.add(m[1]);
  }
  /* פרמטרים פשוטים של חץ ושל פונקציה */
  for (const m of src.matchAll(/\(([^)]*)\)\s*=>/g)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/[\s=:]/)[0];
      if (/^[A-Za-z_$][\w$]*$/.test(name)) out.add(name);
    }
  }
  return out;
}

/* ⚠ הערות ומחרוזות מוסרות לפני הסריקה — שם של רכיב בתוך
   הערה הוא בדיוק מה שמייצר אזהרה שגויה, וגיליונות ה-CSS
   כאן הם מחרוזות תבנית ענקיות מלאות בטקסט. */
function strip(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")
    .replace(/`(?:\\[\s\S]|[^\\`])*`/g, " ` ` ")
    .replace(/"(?:\\.|[^"\\])*"/g, ' "" ')
    .replace(/'(?:\\.|[^'\\])*'/g, " '' ");
}

const files = readdirSync(DIR).filter((f) => /\.(jsx|js)$/.test(f));

console.log("\nשמות שאינם מוגדרים");

for (const f of files) {
  const raw = readFileSync(join(DIR, f), "utf8");
  const src = strip(raw);
  const have = declared(raw);

  /* ---------- 1. רכיב JSX בשם גדול ---------- */
  const used = new Set();
  for (const m of src.matchAll(/<([A-Z][\w$]*)(?:\.[\w$]+)?[\s/>]/g)) used.add(m[1]);
  for (const name of used) {
    ok(have.has(name),
      `${f}: <${name} /> אינו מיובא ואינו מוצהר — מסך לבן בזמן ריצה`);
  }

  /* ---------- 2. קבוע ב-SCREAMING_CASE ---------- */
  /* ⚠⚠ **איבר של אובייקט אינו מזהה חופשי** — `Date.UTC`
     הוא שדה של `Date`, ולא שם שצריך לייבא.
     ⚠ **וטקסט בתוך JSX אינו קוד** — «אקסל · וורד · CSV»
     הוא משפט שמוצג למשתמש, ודיווח עליו הוא רעש טהור. */
  const noText = src.replace(/>[^<>{}]*</g, "><");
  const consts = new Set();
  for (const m of noText.matchAll(/(^|[^.\w$])([A-Z][A-Z0-9]{2,}(?:_[A-Z0-9]+)*)\b/g)) {
    consts.add(m[2]);
  }
  for (const name of consts) {
    if (GLOBALS.has(name)) continue;
    ok(have.has(name),
      `${f}: «${name}» בשימוש ואינו מוגדר — ReferenceError בזמן ריצה`);
  }

  /* ---------- 3. איבר של מרחב שמות ----------
     ⚠ `<MI.flag />` על מפתח שאינו קיים נותן *Element type is
       invalid* — הודעה שאינה מזכירה את השם בכלל. */
  const nsFiles = { MI: "icons.jsx" };
  for (const [ns, file] of Object.entries(nsFiles)) {
    if (!have.has(ns)) continue;
    const keys = new Set();
    const nsSrc = readFileSync(join(DIR, file), "utf8");
    for (const m of nsSrc.matchAll(/export\s+(?:const|function)\s+([A-Za-z_$][\w$]*)/g)) {
      keys.add(m[1]);
    }
    for (const m of src.matchAll(new RegExp(`\\b${ns}\\.([A-Za-z_$][\\w$]*)`, "g"))) {
      ok(keys.has(m[1]), `${f}: ${ns}.${m[1]} אינו קיים ב-${file}`);
    }
  }
}

console.log("");
console.log(`${pass} עברו, ${fail} נכשלו`);
process.exit(fail ? 1 : 0);
