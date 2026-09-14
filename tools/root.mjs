/* ============================================================
   מנהל-העל — הקמה ואיפוס
   ------------------------------------------------------------
   ⚠⚠ **זו הדרך המתועדת, והיא רצה בשרת.** לקונסולה יש מסלול
     הקמה, אבל הוא פתוח **רק מ-localhost ורק כשאין עדיין
     חשבון**. איפוס — כאן בלבד: מנוע «שכחתי סיסמה» למי שרואה
     את כל הלקוחות הוא משטח התקפה שכל תכליתו לחסוך פקודה.

   ⚠ **הפלט באנגלית.** לקונסולת ווינדוס אין תמיכה ב-bidi,
     ועברית יוצאת שם הפוכה תו-תו — כלומר דווקא מסלול השחזור
     הוא זה שאי אפשר לקרוא. ראו server/index.js.

   הרצה:
     npm run root -- --user achim --pass "a long password"
     npm run root -- --show
     npm run root -- --user achim --pass "new one" --force
   ============================================================ */

import { rootExists, readRoot, writeRoot } from "../server/root.js";
import { passwordProblem, USER_RE, normalizeUser } from "../server/auth.js";
import { args } from "./_tenant.mjs";

const { flag, has } = args();

if (has("show")) {
  const rec = rootExists() ? readRoot() : null;
  console.log("");
  if (!rec) console.log("  No root admin yet.");
  else console.log(`  Root admin: ${rec.username}   (created ${rec.createdAt?.slice(0, 10)})`);
  console.log("");
  process.exit(0);
}

const username = normalizeUser(flag("user"));
const password = flag("pass");

if (!username || !password) {
  console.error("");
  console.error("  Usage:  npm run root -- --user <name> --pass <password>");
  console.error("          npm run root -- --show");
  console.error("          npm run root -- --user <name> --pass <new> --force");
  console.error("");
  process.exit(1);
}

if (!USER_RE.test(username)) {
  console.error("\n  [x] Username: lowercase latin, 3-32 characters\n");
  process.exit(1);
}
const bad = passwordProblem(password);
if (bad) {
  /* ⚠ ההודעה מהשרת היא עברית ותצא הפוכה בווינדוס. היא
     מודפסת בכל זאת — היא המידע — ולצידה שורה באנגלית
     שאומרת את אותו דבר בקצרה. */
  console.error("\n  [x] Password rejected: at least 8 characters, not all digits");
  console.error(`      (${bad})\n`);
  process.exit(1);
}

/* ⚠ **החלפה קיימת אומרת זאת ודורשת `--force`.** מי שמריץ
   את הפקודה כדי «לבדוק» ומוחק בטעות את החשבון שלו נועל
   את עצמו מחוץ לכל הלקוחות. */
if (rootExists() && !has("force")) {
  const rec = readRoot();
  console.error("");
  console.error(`  [x] A root admin already exists: ${rec.username}`);
  console.error("      To replace the username and password:  --force");
  console.error("");
  process.exit(1);
}

const out = await writeRoot({ username, password });

console.log("");
console.log(`  [ok] Root admin: ${out.username}`);
console.log("       http://localhost:5180/console");
console.log("");
/* ⚠ **הסיסמה אינה מודפסת ואינה נשמרת בשום מקום** — מה
   שיושב בקובץ הוא scrypt. מי ששכח אותה מריץ את הפקודה שוב
   עם `--force`. */
