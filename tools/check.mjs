/* ============================================================
   הבדיקות שנולדו מהמערכת הקודמת
   ------------------------------------------------------------
   ⚠ **כלל אחד לכל בדיקה, ולא חבילת lint.** מאגר שמציף אלפי
     אזהרות סגנון הוא מאגר שמפסיקים להסתכל על הפלט שלו —
     כלומר גם על הכלל היחיד שמונע מסך לבן.

   ⚠ **כל בדיקה כאן מגנה על באג אמיתי ששולם עליו** במערכת
     הקודמת. אין כאן בדיקה שנוספה «כי ככה עושים».

   הרצה:  npm run check
   ============================================================ */

import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ENTITIES, ENUMS, references, schemaModules } from "../core/schema.js";
import { MODULES, VOCAB_KEYS, resolveProfile, validateProfile, STRUCTURE } from "../core/profile.js";
import PREMIL from "../core/presets/premil.js";
import { ROUTES, ADMIN_ROUTES } from "../server/routes/index.js";
import { SLUG_RE, slugProblem, suggestSlug } from "../server/tenants.js";
import { MODULE_CATALOG, ROLE_CATALOG, activeModules, activeScreens, roleScreens } from "../core/catalog.js";
import { PARSERS } from "../core/import.js";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
let pass = 0, fail = 0;
const ok = (cond, msg) => {
  if (cond) { pass++; }
  else { fail++; console.log("  ✗ " + msg); }
};
const section = (t) => console.log("\n" + t);

/* ============================================================
   ⚠⚠⚠ **הבדיקה הזו רצה ראשונה, ובכוונה.**
   ------------------------------------------------------------
   בקטיק בהערת CSS סוגר את מחרוזת התבנית, והקובץ הופך לקוד
   פסול. כל בדיקה שמייבאת אותו **קורסת** — ומה שהמריץ מדפיס
   הוא stack trace שאינו מזכיר בקטיק במילה אחת, בשורה של
   טעינת מודול שאין בה שום באג.

   זה קרה כאן בפועל. הבדיקה ידעה לזהות את זה במדויק ולומר
   באיזו שורה — והיא פשוט לא הגיעה לרוץ.
   ============================================================ */
/* ============================================================
   7ב. ⚠⚠ אין בקטיק בתוך בלוק CSS
   ------------------------------------------------------------
   כל בלוק עיצוב הוא **מחרוזת תבנית אחת**, ובקטיק בהערת CSS
   סוגר אותה — השארית הופכת לקוד, והקובץ נשבר. במערכת הקודמת
   זה קרה **חמש פעמים**, ובאחת מהן `vite build` דיווח הצלחה
   בעוד הדפדפן נכשל. כאן זה קרה בפעם הראשונה שנוסף בלוק.

   ⚠ **הבדיקה מוצאת את הסוגר ולא את הבקטיק הראשון.** ניסיון
     ראשון חיפש «הבקטיק הראשון אחרי הפתיחה» והכריז שאין
     בקטיקים עד אליו — טענה שנכונה תמיד.

   ⚠ **ומדפיסה את השורה עצמה.** «יש בקטיק» לבדו שולח לחפש
     בקובץ של 300 שורות.
   ============================================================ */
section("בקטיק בבלוק CSS");

for (const f of readdirSync(join(ROOT, "client")).filter((x) => /\.jsx?$/.test(x))) {
  const src = readFileSync(join(ROOT, "client", f), "utf8");
  /* ⚠⚠ **גם `const` פנימי ולא רק `export const`.** שלושה־עשר
     בלוקי ה-CSS ב-styles.js אינם מיוצאים — כלומר בקטיק בכל
     אחד מהם **לא נתפס כאן בכלל**, והדבר היחיד שגילה אותו
     היה קריסת הייבוא עם stack trace שאינו מזכיר בקטיק במילה. */
  const re = /(?:export\s+)?const ([A-Z_0-9]+)\s*=\s*`/g;
  let m;
  while ((m = re.exec(src))) {
    const from = m.index + m[0].length;
    const close = src.indexOf("`;", from);
    ok(close > -1, `${f}: הבלוק ${m[1]} אינו נסגר ב-backtick+;`);
    if (close < 0) continue;
    const inside = src.slice(from, close);
    const at = inside.indexOf("`");
    if (at > -1) {
      const line = src.slice(0, from + at).split("\n").length;
      const text = src.split("\n")[line - 1].trim();
      ok(false, `${f}:${line} — בקטיק בתוך ${m[1]} סוגר את המחרוזת:  ${text}`);
    } else {
      pass++;
    }
  }
}


/* ============================================================
   1. הסכימה עומדת בפני עצמה
   ============================================================ */
section("הסכימה");

for (const [name, ent] of Object.entries(ENTITIES)) {
  ok(Boolean(ent.title), `${name}: אין כותרת`);
  ok(Boolean(ent.fields?.id), `${name}: אין שדה id`);
  for (const [fname, def] of Object.entries(ent.fields || {})) {
    ok(Boolean(def.type), `${name}.${fname}: אין טיפוס`);
    if (def.type === "enum") {
      ok(Boolean(ENUMS[def.enum]), `${name}.${fname}: רשימת ערכים «${def.enum}» אינה קיימת`);
    }
  }
}

/* ⚠⚠ **כל הפניה חייבת להצביע על ישות קיימת.** זו בדיוק
   התקלה שנתפסה במערכת הקודמת ב-CYCLE_BOARDS: נתיב שנכתב
   `group.board` בעוד המפתח הוא `group.messages`, ושום דבר
   לא צעק — התקלה הייתה מתגלה רק בעוד שנה. */
for (const r of references()) {
  ok(Boolean(ENTITIES[r.to]),
    `${r.from}.${r.field} מצביע על ישות שאינה קיימת: ${r.to}`);
}

/* ⚠ מודול שהסכימה מכירה ואינו ברשימת המודולים — ישות שאי
   אפשר לכבות, ואיש לא ידע למה. */
for (const m of schemaModules()) {
  ok(Boolean(MODULES[m]), `הסכימה מכירה מודול שאינו ב-MODULES: ${m}`);
}

/* ============================================================
   2. התבנית שלמה
   ⚠ תבנית חסרה פירושה מכינה חדשה שמתחילה עם חורים — וזה
     בדיוק ההפך מ«התבנית היא המוצר».
   ============================================================ */
section("התבנית");

for (const key of VOCAB_KEYS) {
  const v = PREMIL.vocab?.[key];
  ok(v?.one && v?.many, `אין תרגום מלא למונח ${key} בתבנית`);
}

const slugs = new Set();
for (const r of PREMIL.roles) {
  ok(/^[a-z][a-z0-9_]*$/.test(r.slug), `slug לא תקין: ${r.slug}`);
  ok(!slugs.has(r.slug), `תפקיד כפול בתבנית: ${r.slug}`);
  slugs.add(r.slug);
  ok(Boolean(r.label), `לתפקיד ${r.slug} אין תווית`);
  ok(Array.isArray(r.screens) && r.screens.length, `לתפקיד ${r.slug} אין מסכים`);
}

for (const m of Object.keys(PREMIL.modules)) {
  ok(Boolean(MODULES[m]), `התבנית מדליקה מודול שאינו מוכר: ${m}`);
}

/* ============================================================
   3. אין שם עברי שמשמש כמפתח
   ⚠⚠ **זו הבדיקה החשובה ביותר כאן.** במערכת הקודמת השם
     העברי היה המפתח הראשי, וזו הנקודה שנשברת אצל הלקוח
     השני. מפתח עברי ב-slug, ב-enum או בשם ישות = כשל.
   ============================================================ */
section("מפתחות באנגלית");

const HEB = /[֐-׿]/;
for (const name of Object.keys(ENTITIES)) {
  ok(!HEB.test(name), `שם ישות בעברית: ${name}`);
  for (const f of Object.keys(ENTITIES[name].fields)) {
    ok(!HEB.test(f), `שם שדה בעברית: ${name}.${f}`);
  }
}
for (const [list, vals] of Object.entries(ENUMS)) {
  for (const v of vals) ok(!HEB.test(v), `ערך בעברית ברשימה ${list}: ${v}`);
}
for (const r of PREMIL.roles) ok(!HEB.test(r.slug), `slug בעברית: ${r.slug}`);
for (const k of VOCAB_KEYS) ok(!HEB.test(k), `מפתח אוצר מילים בעברית: ${k}`);

/* ============================================================
   4. הפרופיל המאוחד תקין, והמבנה אינו נדרס
   ============================================================ */
section("האפיון");

const demo = resolveProfile(PREMIL, {
  identity: { name: "מכינת בדיקה" },
  year: { start: "2026-09-01", end: "2027-07-15" },
  /* ⚠ ניסיון לדרוס את המבנה — חייב להיכשל בשקט ולא להשפיע. */
  structure: { weekStartsOn: 3 },
  modules: { attendance: false },
});
const v = validateProfile(demo);
ok(v.ok, "פרופיל הדגמה אינו תקין: " + v.errors.join(" · "));
ok(demo.structure.weekStartsOn === STRUCTURE.weekStartsOn,
  "⚠⚠ המבנה נדרס על ידי הדלתא — שכבה 3 חייבת להיות קבועה");
ok(demo.modules.attendance === true,
  "מודול ליבה כובה — חייב להידלק בכוח");

/* ============================================================
   5. כל נקודת קצה מוגנת
   ⚠⚠ במערכת הקודמת הנתב לא נגע באימות, וכל מודול היה צריך
     להביא את ההגנה שלו — נקודה אחת נשכחה ונתנה סשן מלא למי
     שמחזיק תעודת זהות. כאן הרשימה נבדקת.
   ============================================================ */
section("שערים");

const OPEN = new Set(["session/login", "session/logout", "session/me", "profile/public"]);
const routeSrc = readFileSync(join(ROOT, "server/routes/index.js"), "utf8");

for (const [path, methods] of Object.entries(ROUTES)) {
  if (OPEN.has(path)) continue;
  const line = routeSrc.split("\n").find((l) => l.includes(`"${path}"`));
  ok(Boolean(line && line.includes("guard(")),
    `נקודת קצה בלי guard: ${path}`);
  ok(Object.keys(methods).length > 0, `${path}: אין אף שיטה`);
}

/* ============================================================
   6. אין fetch מחוץ ל-api.js
   ⚠ הדלת היחידה. במערכת הקודמת קובץ אחר החזיק ארבע כתובות
     מקובעות, הן לא עודכנו, והמסך נראה בדיוק כמו מחסן ריק
     במשך יומיים.
   ============================================================ */
section("דלת אחת");

for (const f of readdirSync(join(ROOT, "client"))) {
  if (f === "api.js" || !/\.jsx?$/.test(f)) continue;
  const src = readFileSync(join(ROOT, "client", f), "utf8");
  ok(!/\bfetch\s*\(/.test(src), `יש fetch ישיר ב-client/${f} — הכול דרך api.js`);
}

/* ============================================================
   7. אין הקס מקובע ב-CSS
   ⚠ הצבעים מגיעים מהאפיון. כלל עם הקס נשאר בצבע אחד לכל
     המכינות, וזה מתגלה רק בצילום מסך — כי CSS שגוי אינו
     שגיאה.
   ============================================================ */
section("צבעים מהאפיון");

/* ⚠⚠ **הבדיקה מייבאת את המודול ובודקת את ה-CSS שנוצר, ולא
   את טקסט הקובץ.** בלוק ה-:root נבנה בזמן ריצה מ-theme.js,
   ולכן סריקת מקור הכריזה שכל טוקן "אינו מוגדר" — בדיקה
   שנכשלת על התנהגות נכונה היא בדיקה שמפסיקים להסתכל עליה.
   מה שנבדק עכשיו הוא **מה שהדפדפן יקבל**. */
{
  const sheets = [
    ["styles.js", (await import("../client/styles.js")).CSS],
    ["console-styles.js", (await import("../client/console-styles.js")).CONSOLE_CSS],
  ];

  for (const [name, css] of sheets) {
    ok(typeof css === "string" && css.length > 500, `${name}: לא נוצר CSS`);

    /* ⚠ הצבעים מהאפיון. כלל עם הקס נשאר בצבע אחד לכל
       המכינות, וזה מתגלה רק בצילום מסך — כי CSS שגוי אינו
       שגיאה. */
    const rootStart = css.indexOf(":root{");
    const rootEnd = css.indexOf("}", rootStart);
    const after = css.slice(rootEnd);
    const hexes = after.match(/#[0-9a-fA-F]{6}\b/g) || [];
    ok(hexes.length === 0,
      `${name}: ${hexes.length} צבעי הקס מחוץ ל-:root — ${[...new Set(hexes)].join(" ")}`);

    /* ⚠⚠ **משתנה CSS שנקרא ואינו מוגדר אינו שגיאה** —
       var() נפתר ל«כלום», הרקע יוצא שקוף, וזה חי חודשים
       במערכת הקודמת פעמיים (--sand ואז --navy). */
    const root = css.slice(rootStart, rootEnd);
    const defined = new Set(root.match(/--[a-z0-9-]+(?=\s*:)/g) || []);

    /* ⚠ **משתנה עם נפילה לאחור אינו נספר.** `var(--cols,repeat(…))`
       הוא משתנה שהמסך קובע בשורה עצמה — הוא **אינו יכול**
       להיפתר לכלום, וזו כל הסכנה שהבדיקה הזו קיימת בשבילה.
       ספירה שלו הייתה שגיאה שאינה שגיאה, וזו בדיוק בדיקה
       שמפסיקים להסתכל על הפלט שלה. */
    const used = new Set();
    for (const m of css.matchAll(/var\(\s*(--[a-z0-9-]+)\s*(,?)/g)) {
      if (!m[2]) used.add(m[1]);
    }
    const missing = [...used].filter((v) => !defined.has(v));
    ok(missing.length === 0,
      `${name}: משתנים בשימוש ואינם מוגדרים ב-:root — ${missing.join(" ")}`);
  }
}

/* ============================================================
   7ג. ⚠⚠ מחלקת CSS שאינה קיימת
   ------------------------------------------------------------
   `className="line"` על מחלקה שנמחקה **אינה שגיאה**: ה-div
   פשוט מאבד את העיצוב שלו והכרטיס מתפרק — בלי אזהרה, בלי
   כשל בנייה, ובלי שום דבר בקונסול. נתפס כאן בצילום מסך
   אחרי שכתוב שכבת העיצוב, ובדיוק כמו ReferenceError זה
   סוג הבאג שרק הרצה בפועל מגלה.

   ⚠ **לכל מסך הגיליון שלו.** הקונסולה אינה משתמשת ב-styles
     של האפליקציה, ובדיקה שתשווה אותה מולו תדווח חמישים
     שגיאות שאינן שגיאות — וזו בדיקה שמפסיקים להסתכל על
     הפלט שלה.
   ============================================================ */
section("מחלקות CSS");

{
  const setOf = (css) => new Set((css.match(/\.[a-z][a-z0-9-]*/g) || []).map((c) => c.slice(1)));
  const appCls = setOf((await import("../client/styles.js")).CSS);
  const conCls = setOf((await import("../client/console-styles.js")).CONSOLE_CSS);
  const siteCls = setOf((await import("../client/site-styles.js")).SITE_CSS);

  /* ⚠⚠ **שלושה גיליונות, ולכל מסך אחד מהם.** הקונסולה והאתר
     אינם משתמשים בגיליון של האפליקציה, ובדיקה שתשווה אותם
     מולו תדווח חמישים שגיאות שאינן שגיאות — וזו בדיקה
     שמפסיקים להסתכל על הפלט שלה.

     ⚠ **מסך חדש שנוסף לאתר או לקונסולה — שורה כאן.** בלי זה
       הוא נבדק מול הגיליון הלא-נכון, וכל מחלקה בו נראית
       חסרה. נתפס כשנוסף Site.jsx. */
  const SHEET_OF = { "Console.jsx": conCls, "Site.jsx": siteCls };

  for (const f of readdirSync(join(ROOT, "client")).filter((x) => /\.jsx$/.test(x))) {
    const src = readFileSync(join(ROOT, "client", f), "utf8");
    const known = SHEET_OF[f] || appCls;
    const bad = new Set();
    for (const m of src.matchAll(/className=\{?"([^"]+)"/g)) {
      for (const c of m[1].split(/\s+/).filter(Boolean)) {
        if (/^[a-z][a-z0-9-]*$/.test(c) && !known.has(c)) bad.add(c);
      }
    }
    ok(bad.size === 0,
      `client/${f}: מחלקות שאינן קיימות בגיליון — ${[...bad].join(" ")}`);
  }
}

/* ============================================================
   6ב. ⚠⚠ אדם בלי תפקיד רואה משהו
   ------------------------------------------------------------
   חניך שאין לו תפקיד קיבל **אפס מסכים** — ובלי שום שגיאה,
   כי «אין מסכים» אינו כישלון: הניווט פשוט חוזר ריק והמסך
   נראה כאילו הוא נטען. נתפס בקריאה אמיתית לנקודת קצה,
   לא בבנייה.
   ============================================================ */
section("תפקיד הבסיס");

{
  const base = (PREMIL.roles || []).filter((r) => r.base);
  ok(base.length > 0, "אין אף תפקיד בסיס — אדם בלי תפקיד לא יראה כלום");

  const { screensFor } = await import("../core/vocab.js");
  const bare = screensFor(PREMIL, []);
  ok(!bare.includes("*"), "תפקיד הבסיס פותח הכול — זה ראש המכינה בלבד");
  for (const must of ["home", "me", "requests"]) {
    ok(bare.includes(must), `אדם בלי תפקיד אינו רואה «${must}»`);
  }

  /* ⚠ תפקיד שמוענק **מוסיף** על הבסיס ואינו מחליף אותו. */
  const withRole = screensFor(PREMIL, ["kitchen"]);
  ok(withRole.includes("inventory"), "תפקיד מוענק לא הוסיף את המסכים שלו");
  ok(withRole.includes("requests"), "תפקיד מוענק דרס את תפקיד הבסיס");

  /* ⚠ ראש המכינה עדיין מקבל הכול, ולא בסיס + תוספות. */
  ok(screensFor(PREMIL, ["head"]).includes("*"), "ראש המכינה אינו מקבל הכול");

  /* ⚠⚠ כל מסך בתפקיד הבסיס חייב להיות מסך שקיים בקטלוג —
     אחרת הוא «פתוח» ומוביל לשום מקום. */
  const known = new Set(Object.values(MODULE_CATALOG)
    .flatMap((m) => (m.screens || []).map((s) => s.key)));
  for (const r of PREMIL.roles || []) {
    for (const sc of r.screens || []) {
      if (sc === "*") continue;
      ok(known.has(sc), `התפקיד «${r.slug}» מפנה למסך שאינו בקטלוג: ${sc}`);
    }
  }
}

/* ============================================================
   7א. הגבול בין מכינות
   ------------------------------------------------------------
   ⚠⚠⚠ **זו הבדיקה הקריטית ביותר במאגר.** עד לקונסולה, פריסה
     שווה מכינה וכל מצב גלובלי היה נכון. מרגע שיש מרשם, מצב
     ברמת המודול פירושו שמכינה אחת רואה — או **כותבת** —
     את הנתונים של אחרת, ואיש לא יבין למה.
   ============================================================ */
section("הגבול בין מכינות");

{
  /* ⚠ כל נקודת קצה של הקונסולה חייבת `rootGuard`, חוץ
     מארבע הפתוחות במפורש. אותו כלל של `guard`, בשער השני. */
  const OPEN_ADMIN = new Set(["admin/state", "admin/setup", "admin/login", "admin/logout"]);
  for (const [path, methods] of Object.entries(ADMIN_ROUTES)) {
    ok(Object.keys(methods).length > 0, `${path}: אין אף שיטה`);
    if (OPEN_ADMIN.has(path)) continue;
    const line = routeSrc.split("\n").find((l) => l.includes(`"${path}"`));
    ok(Boolean(line && line.includes("rootGuard(")),
      `נקודת קצה של הקונסולה בלי rootGuard: ${path}`);
  }

  /* ⚠⚠ **שתי המפות זרות זו לזו.** נתיב שמופיע בשתיהן היה
     נגיש גם דרך `/api/admin/` וגם דרך `/m/<slug>/api/`,
     כלומר שער אחד היה עוקף את השני. */
  for (const p of Object.keys(ADMIN_ROUTES)) {
    ok(!(p in ROUTES), `${p} מופיע גם במפת המכינה וגם במפת הקונסולה`);
  }
  for (const p of Object.keys(ROUTES)) {
    ok(!p.startsWith("admin/"), `${p} במפת המכינה ומתחיל ב-admin/`);
  }

  /* ⚠⚠ **אין מצב ברמת המודול בשרת של המכינה.** הדפוס שנאסר:
     `let x = …` או `const cache = new Map()` בקובץ נתיב.
     המטמון היחיד שמותר יושב על אובייקט המכינה. */
  for (const f of readdirSync(join(ROOT, "server/routes"))) {
    if (!/\.js$/.test(f)) continue;
    const src = readFileSync(join(ROOT, "server/routes", f), "utf8");
    const bad = (src.match(/^(?:let|var)\s+\w+/gm) || []);
    ok(bad.length === 0,
      `server/routes/${f}: יש מצב ברמת המודול (${bad.join(", ")}) — ` +
      "מרגע שיש קונסולה זה מצב משותף בין מכינות");
  }

  /* ⚠ הדלתא והמסד מגיעים מ-`ctx.tenant` בלבד. ייבוא ישיר
     של מנוע או של קובץ נתונים מקובץ נתיב הוא בדיוק הדרך
     שבה מכינה אחת כותבת לשנייה. */
  for (const f of readdirSync(join(ROOT, "server/routes"))) {
    if (!/\.js$/.test(f) || f === "index.js") continue;
    const src = readFileSync(join(ROOT, "server/routes", f), "utf8");
    ok(!/from\s+"\.\.\/data\/file-engine\.js"/.test(src),
      `server/routes/${f}: מייבא את המנוע ישירות — המסד מגיע מ-ctx.tenant`);
  }

  /* ⚠⚠ **ה-slug של הלקוח וה-slug של השרת הם אותו כלל.**
     שתי הגדרות מקבילות מתפצלות בתיקון הראשון, ואז המסך
     מאשר מזהה שהשרת דוחה. */
  const apiSrc = readFileSync(join(ROOT, "client/api.js"), "utf8");
  ok(/\/m\/\$\{slug\}\/api\//.test(apiSrc),
    "client/api.js אינו מקדים את המכינה לכתובת");
  ok(/\/api\/admin\//.test(apiSrc),
    "client/api.js אינו מכיר את הדלת של הקונסולה");

  for (const good of ["demo", "ein-prat", "meitarim", "a1b"]) {
    ok(SLUG_RE.test(good) && !slugProblem(good), `slug תקין נדחה: ${good}`);
  }
  /* ⚠ שמות שמורים: מכינה בשם `api` או `console` הייתה מתנגשת
     בנתיב עצמו — כלומר מכינה שאי אפשר להיכנס אליה, בלי שום
     שגיאה. */
  for (const bad of ["api", "console", "admin", "m", "AB", "a", "-x", "x-", "a_b", ""]) {
    ok(Boolean(slugProblem(bad)), `slug פסול התקבל: «${bad}»`);
  }
  /* ============================================================
     ⚠⚠⚠ **הבדיקה הזו נהפכה, כי היא נעלה התנהגות שגויה.**
     ------------------------------------------------------------
     היא דרשה ש**שם עברי יחזיר ריק** — וזו הייתה ההתנהגות של
     הגרסה הראשונה, שזרקה כל תו שאינו לטיני. כלומר ההצעה
     עבדה בדיוק על השמות שאין להם: לכל מכינה בארץ יש שם
     עברי. הבדיקה עברה, והתכונה לא עשתה דבר.

     נתפס בהרשמה הציבורית: «מכינת שדה בוקר» הציעה כלום, וראש
     מכינה שרק רצה להירשם נאלץ להמציא כתובת באנגלית ברגע שבו
     הוא הכי קרוב לוותר.

     ⚠ **מה שנבדק עכשיו הוא החוזה ולא התעתיק עצמו.** נעילה של
       «שדה בוקר → sde-boker» הייתה נשברת בכל שיפור של המילון,
       והבדיקה הייתה נמחקת במקום להיקרא. מה שחייב להחזיק:
       שם עברי מחזיר **slug תקין**, וזבל מחזיר **ריק**.
     ============================================================ */
  for (const he of ["מכינת מיתרים לכיש", "מכינת שדה בוקר", "מכינת ניר עוז",
    "מכינת בית ישראל", "המכינה הצבאית בעלי", "מכינת נחשון"]) {
    const out = suggestSlug(he);
    ok(out !== "" && !slugProblem(out),
      `הצעת slug מ«${he}» חייבת להיות תקינה — התקבל «${out}»`);
  }
  /* ⚠ וזבל עדיין מחזיר ריק — הצעה מומצאת גרועה מהיעדר הצעה,
     כי המשתמש יאשר אותה בלי להסתכל. */
  for (const junk of ["", "   ", "!!!", "א", "־־", "מכינת"]) {
    ok(suggestSlug(junk) === "", `הצעת slug מ«${junk}» הייתה צריכה להיות ריקה`);
  }
  ok(suggestSlug("Ein Prat") === "ein-prat", "הצעת slug משם לטיני נשברה");
}

/* ============================================================
   7ה. ⚠⚠⚠ סוגי הימים הם נתון ולא רשימה בקוד
   ------------------------------------------------------------
   הם היו `enum` קפואה בסכימה, וזו הייתה טעות: כל מכינה
   מחלקת את השנה אחרת, ורשימה סגורה פירושה שכל מכינה שלישית
   מגיעה עם בקשה שדורשת דיפלוי.

   ⚠ **ומה שנבדק כאן הוא הכללים, לא הרשימה.** נעילה של שבעת
     הסוגים שבתבנית הייתה נשברת בכל שינוי שלה, והבדיקה
     הייתה נמחקת במקום להיקרא.
   ============================================================ */
section("סוגי ימים");

{
  const DT = await import("../core/day-types.js");
  const { ENTITIES } = await import("../core/schema.js");

  /* ⚠⚠ **הבדיקה החשובה כאן**: הרגע שבו מישהו יחזיר את
     `enum` לסכימה הוא הרגע שבו הכול נסגר שוב — בלי שגיאה,
     כי מכינה שלא הוסיפה סוג לא תרגיש בזה כלל. */
  ok(ENTITIES.calendarDay.fields.kind.type === "text",
    "calendarDay.kind חזר להיות enum — סוגי הימים ננעלו שוב בקוד");
  ok(!ENTITIES.calendarDay.fields.kind.enum,
    "calendarDay.kind נושא enum, כלומר המכינה אינה יכולה להוסיף סוג");

  /* ⚠ שני הדגלים, והצירוף שאינו אפשרי */
  ok(DT.validateDayTypes([{ slug: "a_b", label: "x", school: true, counts: true }]).length === 0,
    "סוג יום תקין נדחה");
  ok(DT.validateDayTypes([{ slug: "a_b", label: "x", school: false, counts: true }]).length > 0,
    "«נספר באחוז» בלי «יש מכינה» חייב להידחות — הוא מוריד את האחוז על יום שלא היה");
  ok(DT.validateDayTypes([{ slug: "a_b", label: "x", school: true, counts: false }]).length > 0,
    "רשימה שאין בה אף סוג נספר חייבת להיאמר — האחוז יהיה ריק לכולם");
  ok(DT.validateDayTypes([]).length > 0, "רשימה ריקה התקבלה");
  ok(DT.validateDayTypes([
    { slug: "a_b", label: "x", school: true, counts: true },
    { slug: "a_b", label: "y", school: true, counts: true },
  ]).length > 0, "סוג כפול התקבל");

  /* ⚠⚠ **סוג שאינו מוכר מוחזר `null` ואינו נופל ל«רגיל».**
     נפילה שקטה הייתה מכניסה למכנה יום שהמכינה הוציאה ממנו,
     כלומר משנה אחוזי נוכחות של כולם בלי שגיאה. */
  const p = { dayTypes: DT.DEFAULT_DAY_TYPES };
  ok(DT.dayType(p, "no_such_type") === null,
    "סוג שאינו מוכר נפל לברירת מחדל במקום להחזיר null");
  ok(DT.countsForAttendance(p, "no_such_type") === false,
    "סוג שאינו מוכר נספר באחוז");
  ok(DT.countsForAttendance(p, "trip") === false,
    "טיול נספר באחוז — היו בו כולם ואין רשימה");
  ok(DT.isSchoolDay(p, "home") === false, "סופ״ש בית סומן כיום מכינה");
  /* ⚠ סוג שנמחק מציג את המפתח ולא «—»: מי שרואה slug מבין
     מיד שמישהו מחק סוג שעדיין בשימוש. */
  ok(DT.dayLabel(p, "gone_type") === "gone_type",
    "סוג שנמחק חייב להציג את המפתח שלו");

  /* ⚠ פרופיל בלי `dayTypes` מקבל את ברירת המחדל — מכינה
     שנפתחה לפני שהשדה היה קיים אינה מאבדת את הנוכחות שלה. */
  const { resolveProfile } = await import("../core/profile.js");
  const { PREMIL } = await import("../core/presets/premil.js");
  const bare = resolveProfile(PREMIL, { identity: { name: "x" }, dayTypes: [] });
  ok(bare.dayTypes?.length > 0,
    "פרופיל בלי סוגי ימים לא קיבל את ברירת המחדל — כל יום בלוח נושא סוג לא מוכר");

  /* ⚠ ואוצר המילים כבר אינו מכיל אותם — שתי רשימות מקבילות
     על אותו דבר מתפצלות בתוספת הראשונה. */
  const { VOCAB_KEYS } = await import("../core/profile.js");
  ok(!VOCAB_KEYS.some((k) => k.startsWith("day.")),
    "מפתחות day.* חזרו לאוצר המילים — התווית והדגלים בשני מקומות");
}

/* ============================================================
   8. הקטלוג עומד בפני עצמו
   ============================================================ */
section("קטלוג המודולים");

for (const [k, m] of Object.entries(MODULE_CATALOG)) {
  ok(Boolean(m.title), `${k}: אין כותרת`);
  /* ⚠ `why` הוא מה שמנהל מכינה קורא באשף לפני שהוא מחליט.
     מודול בלי משפט כזה הוא שם טכני שאיש אינו יודע אם הוא
     צריך אותו. */
  ok(Boolean(m.why), `${k}: אין משפט «מה זה נותן»`);
  ok(Array.isArray(m.screens) && m.screens.length > 0, `${k}: אין מסכים`);
  for (const need of m.needs || []) {
    ok(Boolean(MODULE_CATALOG[need]), `${k} תלוי במודול שאינו קיים: ${need}`);
  }
  for (const s2 of m.screens) ok(Boolean(s2.key && s2.title), `${k}: מסך בלי מפתח או כותרת`);
}

/* ⚠⚠ **מפתח מסך ייחודי על פני כל הקטלוג.** שני מודולים עם
   אותו מפתח נותנים ניווט שמוביל למסך הלא-נכון, ושום דבר
   אינו צועק. */
{
  const seen = new Map();
  for (const [k, m] of Object.entries(MODULE_CATALOG))
    for (const s2 of m.screens) {
      ok(!seen.has(s2.key), `מפתח מסך כפול «${s2.key}» — ${seen.get(s2.key)} ו-${k}`);
      seen.set(s2.key, k);
    }
}

/* ⚠⚠ **תפקיד אינו מפנה למסך שאינו קיים בשום מודול.** זו
   ההרשאה שאי אפשר להגיע אליה — נשברה פעם אחת בכל ועדה
   במערכת הקודמת. */
{
  const all = new Set(Object.values(MODULE_CATALOG).flatMap((m) => m.screens.map((s2) => s2.key)));
  for (const [slug, r] of Object.entries(ROLE_CATALOG))
    for (const s2 of r.screens || [])
      ok(s2 === "*" || all.has(s2), `התפקיד ${slug} מפנה למסך שאינו קיים: ${s2}`);
}

/* ⚠ כיבוי מודול משרשר: מודול שתלוי בכבוי חייב לכבות בעצמו,
   אחרת המסך שלו נפתח וקורס על ישות שאינה קיימת. */
{
  const off = activeModules({ lessons: false, ratings: true });
  ok(!off.includes("ratings"), "«דירוג מרצים» נשאר דלוק כשהשיעורים כבויים");
  const on = activeModules({ lessons: true, ratings: true });
  ok(on.includes("ratings"), "«דירוג מרצים» לא נדלק כשהכול דלוק");
}

/* ⚠ תפקיד שמסכיו נחתכו מקבל רשימה מקוצרת ולא מסך שנפתח ל-404 */
{
  const mods = { lessons: true, ratings: false };
  const sc = roleScreens(ROLE_CATALOG.scheduler, mods);
  ok(!sc.includes("evals"), "מסך של מודול כבוי נשאר בתפקיד");
  ok(sc.includes("lessons"), "מסך של מודול דלוק נחתך בטעות");
}

/* ============================================================
   9. הייבוא — מה שנתפס בצילום מסך, לא בבדיקה
   ============================================================ */
section("ייבוא בהדבקה");

for (const [k, p2] of Object.entries(PARSERS)) {
  ok(Boolean(p2.title && p2.hint && p2.example), `${k}: חסר הסבר או דוגמה`);
  ok(Array.isArray(p2.columns) && p2.columns.length > 0, `${k}: אין עמודות לתצוגה`);
  /* ⚠ הדוגמה חייבת להיקלט על ידי המפרסר של עצמה. דוגמה שאינה
     עוברת היא מסך שמלמד את המשתמש פורמט שגוי. */
  const r = p2.parse(p2.example);
  ok(r.rows.length > 0, `${k}: הדוגמה שמוצגת למשתמש אינה נקלטת`);
  ok(r.bad.length === 0, `${k}: הדוגמה מייצרת שורות דחויות`);
}

{
  const r = PARSERS.students.parse("עומר דגן\t312990001\tבן\n???\n---\n  \nאורי שחם,312990002,בת");
  ok(r.rows.length === 2, `שורת זבל נקלטה כשם — נקלטו ${r.rows.length} במקום 2`);
  ok(r.bad.length === 2, `שורות הזבל לא דווחו — ${r.bad.length} במקום 2`);
  ok(r.rows[0].phone === null, "טלפון חסר הפך למשהו שאינו null");
  ok(r.rows[1].gender === "female", "«בת» לא זוהה כנקבה");
  /* ⚠ טאב ופסיק באותה הדבקה — מנהל מכינה מדביק משני מקורות. */
  ok(r.rows[1].name === "אורי שחם", "שורה מופרדת בפסיק לא נקלטה");
}
{
  /* ⚠ 31/02 עובר את הביטוי הרגולרי ואינו תאריך קיים. */
  const r = PARSERS.calendar.parse("31/02/2026\tרגיל\n01/09/2026 - 03/09/2026\tסדרה");
  ok(r.bad.length === 1, "תאריך שאינו קיים לא נדחה");
  ok(r.rows.length === 3, `טווח לא נפרש לשלושה ימים — ${r.rows.length}`);
  ok(r.rows.every((x) => x.kind === "series"), "סוג היום לא הוחל על כל הטווח");
}

/* ---------- סיכום ---------- */
console.log("");
console.log(`${pass} עברו, ${fail} נכשלו`);
process.exit(fail ? 1 : 0);
