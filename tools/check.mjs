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
import { ROUTES } from "../server/routes/index.js";

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

const css = readFileSync(join(ROOT, "client/styles.js"), "utf8");
const block = css.slice(css.indexOf("export const CSS"), css.lastIndexOf("`"));
const afterRoot = block.slice(block.indexOf("}", block.indexOf(":root{")));
const hexes = afterRoot.match(/#[0-9a-fA-F]{6}\b/g) || [];
ok(hexes.length === 0,
  `יש ${hexes.length} צבעי הקס מחוץ ל-:root ב-styles.js — ${[...new Set(hexes)].join(" ")}`);

/* ---------- סיכום ---------- */
console.log("");
console.log(`${pass} עברו, ${fail} נכשלו`);
process.exit(fail ? 1 : 0);
