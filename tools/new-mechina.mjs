/* ============================================================
   מכינה חדשה — פריסה ריקה עם חשבון אחד
   ------------------------------------------------------------
   זו הפעולה שהקונסולה עושה בלחיצה, וכאן היא בשורת פקודה —
   לסביבה שאין בה דפדפן.

   ⚠⚠ **הכול ריק במכוון, חוץ מהתבנית.** אין חניכים, אין לוח
     שנה, ואין תפריט. מה שכן יש: כל התפקידים, כל אוצר המילים
     וכל המודולים — מהתבנית. זה ההבדל בין «מוצר שמתחיל
     ב-90%» לבין «מסך ריק שצריך לבנות מאפס».

   ⚠ **`identity.name` נשאר ריק** ולא מקבל את השם שנמסר כאן.
     השם נכתב **למרשם** (זה מה שהקונסולה מציגה), אבל שלבי
     החובה של האפיון עדיין חסרים — כי מנהל שנכנס וכבר הכול
     מוגדר לא ילמד איפה משנים דברים.
     (מי שרוצה מכינה מלאה לבדיקה — `npm run seed`.)

   הרצה:
     npm run new -- "מכינת מיתרים לכיש" --slug meitarim --user meitarim
   ============================================================ */

import { hashPassword, USER_RE, normalizeUser } from "../server/auth.js";
import { suggestSlug } from "../server/tenants.js";
import { args, ensureTenant } from "./_tenant.mjs";

const { flag, has, positional } = args();

const name = positional[0] || "מכינה חדשה";
const username = normalizeUser(flag("user", "menahel"));
const password = flag("pass", "mechina2026");
const headName = flag("head", "מנהל המכינה");

/* ⚠ ה-slug מוצע מהשם ונשאל במפורש. שם עברי אינו נותן slug
   תקין, ו«נמציא אחד» היה מייצר כתובות כמו `/m/mechina-3/`
   שאיש לא יזהה. */
const slug = flag("slug") || suggestSlug(name);
if (!slug) {
  console.error("");
  console.error("  ✗ אי אפשר לגזור מזהה משם עברי — יש למסור אותו:");
  console.error(`      npm run new -- "${name}" --slug <מזהה באנגלית>`);
  console.error("");
  process.exit(1);
}

if (!USER_RE.test(username)) {
  console.error("\n  ✗ שם המשתמש חייב להיות באנגלית קטנה, 3–32 תווים\n");
  process.exit(1);
}

const t = await ensureTenant({ slug, name, force: has("force") });

/* ⚠ הדלתא מחזיקה את התבנית בלבד. שם המכינה יושב **במרשם**,
   ו-`identity.name` נשאר ריק כדי שהאשף ייפתח על שלב 1. */
t.writeDelta({ preset: "premil", identity: {} });

const head = await t.db.create("person", {
  kind: "staff", name: headName, active: true,
});
await t.db.create("account", {
  person: head.id, username, passwordHash: await hashPassword(password),
});
await t.db.create("roleAssignment", { person: head.id, role: "head" });

console.log("");
console.log(`✓ נפרסה מכינה חדשה: ${name}`);
console.log(`  כתובת  : http://localhost:5180/m/${slug}/`);
console.log(`  נתונים : ${t.paths.db}`);
console.log("");
console.log("  יש בה חשבון אחד, ואפיון ריק:");
console.log(`    ${username} / ${password}   ${headName}`);
console.log("");
console.log("  npm run dev  →  כניסה  →  האשף נפתח מעצמו");
console.log("");
