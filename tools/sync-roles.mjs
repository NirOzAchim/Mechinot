/* ============================================================
   סנכרון תפקידים של מכינה קיימת מול הקטלוג
   ------------------------------------------------------------
   ⚠⚠⚠ **מכינה קיימת אינה מקבלת מסך חדש מעצמה, וזו אינה תקלה.**
     האפיון הוא דלתא מעל הפריסט, ו-`resolveProfile` **מחליף
     מערך שלם ואינו ממזג אותו** — אחרת מכינה שמחקה תפקיד הייתה
     מקבלת אותו בחזרה בכל עדכון, וזו התנהגות גרועה בהרבה.

     המשמעות: מכינה שנגעה בתפקידים פעם אחת מקפיאה את הרשימה
     שלה. מסך שנוסף לקטלוג מחר **לא יופיע לה**, בלי שגיאה ובלי
     שאיש ישים לב — היא פשוט לא תדע שהוא קיים.

   ⚠⚠ **ולכן הכלי מדווח כברירת מחדל ואינו כותב.** הענקת מסך
     היא הרחבת הרשאה, וכלי שמרחיב הרשאות בשקט בכל עדכון הוא
     בדיוק מה שאסור שיהיה. `--go` כדי לכתוב.

   ⚠ **והוא משווה מול `ROLE_CATALOG` לפי slug בלבד.** תפקיד
     שהמכינה המציאה לעצמה אינו בקטלוג, ולכן אינו נגוע — הכלי
     מדלג עליו ואומר זאת.

   ⚠ **מסך שהמכינה הסירה במכוון יחזור.** אין דרך להבחין בין
     «הוסר» לבין «לא היה» — ולכן הריצה היבשה מדפיסה **שורה
     לכל מסך** לפני שמאשרים, ולא רק מספר.

   הרצה:
     npm run sync:roles          מה היה משתנה
     npm run sync:roles -- --go  ביצוע
   ============================================================ */

import { listMechinot, tenant } from "../server/tenants.js";
import { ROLE_CATALOG, activeScreens } from "../core/catalog.js";

const GO = process.argv.includes("--go");
const only = process.argv.find((a) => a.startsWith("--slug="))?.slice(7) || null;

console.log("");
console.log(GO ? "  סנכרון תפקידים — ביצוע" : "  סנכרון תפקידים — הרצה יבשה");
console.log("  " + "-".repeat(50));

let touched = 0, wrote = 0;

for (const m of await listMechinot()) {
  if (only && m.slug !== only) continue;

  let t, profile;
  try { t = tenant(m.slug); profile = await t.loadProfile(); }
  catch (e) { console.log(`\n  ${m.slug}: לא נפתחה — ${e.message}`); continue; }

  const delta = t.readDelta();

  /* ⚠ מכינה שלא נגעה בתפקידים יורשת את הפריסט ומקבלת הכול
     מעצמה. זה הרוב, וזה המצב הבריא. */
  if (!Array.isArray(delta.roles)) {
    console.log(`\n  ${m.slug} — יורשת את הפריסט, אין מה לסנכרן`);
    continue;
  }

  /* המסכים שקיימים במכינה הזו בפועל */
  const exists = new Set(activeScreens(profile.modules || {}).map((s) => s.key));

  const plan = [];
  for (const r of delta.roles) {
    const cat = ROLE_CATALOG[r.slug];
    if (!cat) continue;                       /* תפקיד של המכינה */
    const have = r.screens || [];
    if (have.includes("*")) continue;         /* ראש המכינה */

    const want = (cat.all ? ["*"] : cat.screens || [])
      .filter((s) => s !== "*" && exists.has(s) && !have.includes(s));
    if (want.length) plan.push({ role: r, want });
  }

  if (!plan.length) {
    console.log(`\n  ${m.slug} — מעודכנת`);
    continue;
  }

  touched++;
  console.log(`\n  ${m.slug} — ${m.name}`);
  for (const { role, want } of plan) {
    /* ⚠ שורה לכל מסך, ולא מספר — ראו ההערה בראש. */
    console.log(`    ${role.label || role.slug}:  + ${want.join("  + ")}`);
  }

  if (GO) {
    for (const { role, want } of plan) role.screens = [...(role.screens || []), ...want];
    t.writeDelta(delta);
    t.invalidateProfile();
    wrote++;
    console.log("    נכתב.");
  }
}

console.log("");
if (!touched) {
  console.log("  כל המכינות מעודכנות.");
} else if (GO) {
  console.log(`  עודכנו ${wrote} מכינות.`);
} else {
  /* ⚠ ההרצה היבשה אומרת **מה להריץ**, ולא «השתמש בדגל». */
  console.log(`  ${touched} מכינות דורשות עדכון. לביצוע:`);
  console.log("    npm run sync:roles -- --go");
}
console.log("");
