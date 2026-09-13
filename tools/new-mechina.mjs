/* ============================================================
   מכינה חדשה — פריסה ריקה עם חשבון אחד
   ------------------------------------------------------------
   זו הפעולה שהסטודיו יעשה אוטומטית ביום שיהיה תשלום: מכינה
   קונה, מקבלת פריסה, ובה **חשבון אחד** — ראש המכינה — ואפיון
   ריק. משם הוא נכנס ובונה לעצמו.

   ⚠⚠ **הכול ריק במכוון, חוץ מהתבנית.** אין חניכים, אין לוח
     שנה, ואין תפריט. מה שכן יש: כל התפקידים, כל אוצר המילים
     וכל המודולים — מהתבנית. זה ההבדל בין «מוצר שמתחיל
     ב-90%» לבין «מסך ריק שצריך לבנות מאפס».

   ⚠ **`identity.name` נשאר ריק** ולא מקבל את השם שנמסר כאן.
     השם נכתב, אבל שלבי החובה עדיין חסרים — כי מנהל שנכנס
     וכבר הכול מוגדר לא ילמד איפה משנים דברים.
     (מי שרוצה מכינה מלאה לבדיקה — `npm run seed`.)

   הרצה:
     node tools/new-mechina.mjs "מכינת מיתרים לכיש" --user meitarim
   ============================================================ */

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, rmSync } from "node:fs";

import { fileEngine } from "../server/data/file-engine.js";
import { createStore } from "../server/data/store.js";
import { hashPassword } from "../server/auth.js";
import { writeDelta, DELTA_FILE } from "../server/profile-store.js";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const DB = process.env.DATA_FILE || resolve(ROOT, ".data/db.json");

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith("--")) || "מכינה חדשה";
const flag = (k, d) => {
  const i = args.indexOf("--" + k);
  return i > -1 ? args[i + 1] : d;
};
const username = flag("user", "menahel");
const password = flag("pass", "mechina2026");
const headName = flag("head", "מנהל המכינה");

/* ⚠ **מאפסים במפורש.** פריסה חדשה היא פריסה חדשה; להשאיר
   נתונים של מכינה קודמת זה בדיוק הבאג שאי אפשר להסביר. */
for (const f of [DB, DELTA_FILE]) if (existsSync(f)) rmSync(f);

const db = createStore(fileEngine(DB));

/* ⚠ הדלתא מחזיקה **רק** את שם המכינה, ואפילו לא אותו בשדה
   שנבדק — `identity.name` נשאר ריק כדי שהאשף ייפתח על שלב 1.
   מה שכן נשמר: שם זמני לכותרת הדפדפן. */
writeDelta({ preset: "premil", identity: { shortName: name.replace(/^מכינת\s+/, "") } });

const head = await db.create("person", {
  kind: "staff", name: headName, active: true,
});
await db.create("account", {
  person: head.id, username, passwordHash: await hashPassword(password),
});
await db.create("roleAssignment", { person: head.id, role: "head" });

console.log("");
console.log(`✓ נפרסה מכינה חדשה: ${name}`);
console.log(`  נתונים : ${DB}`);
console.log("");
console.log("  יש בה חשבון אחד, ואפיון ריק:");
console.log(`    ${username} / ${password}   ${headName}`);
console.log("");
console.log("  npm run dev  →  כניסה  →  האשף נפתח מעצמו");
console.log("");
