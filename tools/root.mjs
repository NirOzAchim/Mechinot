/* ============================================================
   מנהל-העל — הקמה ואיפוס
   ------------------------------------------------------------
   ⚠⚠ **זו הדרך המתועדת, והיא רצה בשרת.** לקונסולה יש מסלול
     הקמה, אבל הוא פתוח **רק מ-localhost ורק כשאין עדיין
     חשבון**. איפוס — כאן בלבד: מנוע «שכחתי סיסמה» למי שרואה
     את כל הלקוחות הוא משטח התקפה שכל תכליתו לחסוך פקודה.

   הרצה:
     npm run root -- --user achim --pass "סיסמה ארוכה"
     npm run root -- --show
   ============================================================ */

import { rootExists, readRoot, writeRoot } from "../server/root.js";
import { passwordProblem, USER_RE, normalizeUser } from "../server/auth.js";
import { args } from "./_tenant.mjs";

const { flag, has } = args();

if (has("show")) {
  const rec = rootExists() ? readRoot() : null;
  console.log("");
  if (!rec) console.log("  אין עדיין מנהל-על.");
  else console.log(`  מנהל-על: ${rec.username}   (נוצר ${rec.createdAt?.slice(0, 10)})`);
  console.log("");
  process.exit(0);
}

const username = normalizeUser(flag("user"));
const password = flag("pass");

if (!username || !password) {
  console.error("");
  console.error("  שימוש:  npm run root -- --user <שם> --pass <סיסמה>");
  console.error("          npm run root -- --show");
  console.error("");
  process.exit(1);
}

if (!USER_RE.test(username)) {
  console.error("\n  ✗ שם המשתמש: אנגלית קטנה, 3–32 תווים\n");
  process.exit(1);
}
const bad = passwordProblem(password);
if (bad) { console.error(`\n  ✗ ${bad}\n`); process.exit(1); }

/* ⚠ **החלפה קיימת אומרת זאת ודורשת `--force`.** מי שמריץ
   את הפקודה כדי «לבדוק» ומוחק בטעות את החשבון שלו נועל
   את עצמו מחוץ לכל הלקוחות. */
if (rootExists() && !has("force")) {
  const rec = readRoot();
  console.error("");
  console.error(`  ✗ כבר יש מנהל-על (${rec.username}).`);
  console.error("    להחלפת שם המשתמש והסיסמה:  --force");
  console.error("");
  process.exit(1);
}

const out = await writeRoot({ username, password });

console.log("");
console.log(`✓ מנהל-על: ${out.username}`);
console.log("  http://localhost:5180/console");
console.log("");
/* ⚠ **הסיסמה אינה מודפסת ואינה נשמרת בשום מקום** — מה
   שיושב בקובץ הוא scrypt. מי ששכח אותה מריץ את הפקודה שוב
   עם `--force`. */
