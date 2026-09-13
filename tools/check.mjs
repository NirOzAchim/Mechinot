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

/* ⚠ **כל קובץ עיצוב ולא רק styles.js.** הקונסולה הביאה
   `console-styles.js`, וכלל שמכיר קובץ אחד בשם הוא כלל
   שהקובץ הבא חומק ממנו בשקט. */
for (const f of readdirSync(join(ROOT, "client")).filter((x) => /styles\.js$/.test(x))) {
  const css = readFileSync(join(ROOT, "client", f), "utf8");
  const block = css.slice(css.indexOf("export const"), css.lastIndexOf("`"));
  const afterRoot = block.slice(block.indexOf("}", block.indexOf(":root{")));
  const hexes = afterRoot.match(/#[0-9a-fA-F]{6}\b/g) || [];
  ok(hexes.length === 0,
    `יש ${hexes.length} צבעי הקס מחוץ ל-:root ב-${f} — ${[...new Set(hexes)].join(" ")}`);

  /* ⚠⚠ **משתנה CSS שנקרא ואינו מוגדר אינו שגיאה** — `var()`
     נפתר ל«כלום», הרקע יוצא שקוף, וזה חי חודשים במערכת
     הקודמת פעמיים (`--sand` ואז `--navy`). */
  const root = block.slice(block.indexOf(":root{"), block.indexOf("}", block.indexOf(":root{")));
  const defined = new Set((root.match(/--[a-z0-9-]+(?=\s*:)/g) || []));
  for (const used of new Set(block.match(/var\(\s*(--[a-z0-9-]+)/g) || [])) {
    const name = used.replace(/var\(\s*/, "");
    ok(defined.has(name), `${f}: ‎${name}‎ בשימוש ואינו מוגדר ב-:root`);
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
  ok(suggestSlug("מכינת מיתרים לכיש") === "",
    "הצעת slug משם עברי חייבת להחזיר ריק ולא מחרוזת מקרית");
  ok(suggestSlug("Ein Prat") === "ein-prat", "הצעת slug משם לטיני נשברה");
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
