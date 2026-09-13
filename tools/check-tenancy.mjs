/* ============================================================
   הגבול בין מכינות — בדיקה שרצה, ולא רק סורקת
   ------------------------------------------------------------
   ⚠⚠⚠ **`npm run check` סורק טקסט; זה מריץ.** הסריקה מוודאת
     שאין `let` ברמת המודול ושכל נקודת קצה עטופה — והיא
     **אינה יכולה** להוכיח שסשן של מכינה א׳ נדחה במכינה ב׳.
     זו הטענה היחידה שכשלונה הוא דליפה בין לקוחות, ולכן היא
     חייבת להיות מורצת.

   ⚠ **רץ על תיקיית נתונים זמנית** (`DATA_DIR`) ומוחק אותה
     בסוף — כולל ב-`uncaughtException`. בדיקה שנוגעת בנתונים
     האמיתיים היא בדיוק מה שנשרף עליו במערכת הקודמת.

   הרצה:  npm run check:tenancy
   ============================================================ */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/* ⚠ **לפני כל import של השרת.** `tenants.js` קורא את
   `DATA_DIR` בטעינת המודול, ומי שיקבע אותו אחרי הייבוא
   יריץ את הבדיקה על הנתונים האמיתיים בלי שום אזהרה. */
const TMP = mkdtempSync(join(tmpdir(), "mx-tenancy-"));
process.env.DATA_DIR = TMP;
process.env.SESSION_SECRET = "test-only-secret-0123456789-0123456789";

const cleanup = () => { try { rmSync(TMP, { recursive: true, force: true }); } catch { /* אין מה לנקות */ } };
process.on("exit", cleanup);
process.on("uncaughtException", (e) => { cleanup(); console.error(e); process.exit(1); });

const { createMechina, tenant } = await import("../server/tenants.js");
const { hashPassword, sign, currentUser, guard, screensOf, AuthError } =
  await import("../server/auth.js");

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log("  ✗ " + msg); } };
const section = (t) => console.log("\n" + t);

/* בקשה מזויפת — רק מה ש-`currentUser` קורא */
const reqWith = (token) => ({ headers: { cookie: token ? `mx_session=${token}` : "" } });

/* ============================================================
   שתי מכינות, ובכל אחת אדם אחר על אותו מזהה חשבון
   ------------------------------------------------------------
   ⚠⚠ **זה בדיוק התרחיש המסוכן.** המזהים רצים בכל מכינה
     בנפרד, ולכן «חשבון 1001» קיים בשתיהן ומצביע על שני
     אנשים שונים. אסימון בלי שם מכינה היה נקרא במכינה
     השנייה כמישהו אחר לגמרי — לא שגיאה, לא 401: **התחזות
     שקטה.**
   ============================================================ */
section("שתי מכינות");

createMechina({ slug: "alpha", name: "מכינה א" });
createMechina({ slug: "beta", name: "מכינה ב" });

const A = tenant("alpha");
const B = tenant("beta");

const pwd = await hashPassword("test-password-1");

const aPerson = await A.db.create("person", { kind: "staff", name: "אבי מא", active: true });
const aAcct = await A.db.create("account", { person: aPerson.id, username: "menahel", passwordHash: pwd });
await A.db.create("roleAssignment", { person: aPerson.id, role: "head" });

const bPerson = await B.db.create("person", { kind: "student", name: "בני מב", active: true });
const bAcct = await B.db.create("account", { person: bPerson.id, username: "menahel", passwordHash: pwd });

ok(aAcct.id === bAcct.id,
  `התרחיש הזה תלוי בכך שהמזהים מתנגשים (${aAcct.id} מול ${bAcct.id}) — ` +
  "אם הם כבר לא, יש לשנות את הבדיקה ולא למחוק אותה");

ok(A.paths.db !== B.paths.db, "שתי המכינות חולקות קובץ נתונים");

/* ============================================================
   האסימון
   ============================================================ */
section("האסימון נושא את המכינה");

const tokA = sign({ tenant: "alpha", account: aAcct.id });

const inA = await currentUser(reqWith(tokA), A);
ok(inA?.name === "אבי מא", "סשן תקין במכינה שלו נדחה");
ok(inA?.isRoot === false, "משתמש רגיל סומן כמנהל-על");

/* ⚠⚠⚠ הטענה שבגללה הקובץ הזה קיים. */
const inB = await currentUser(reqWith(tokA), B);
ok(inB === null,
  "⚠⚠⚠ אסימון של «alpha» התקבל ב«beta» — זו דליפה בין לקוחות");

/* ⚠ אסימון בלי שדה מכינה הוא הפורמט הישן. הוא חייב להיות
   חסר-ערך בשתיהן ולא «תקין בברירת מחדל». */
const legacy = sign({ account: aAcct.id });
ok(await currentUser(reqWith(legacy), A) === null, "אסימון בלי מכינה התקבל ב-alpha");
ok(await currentUser(reqWith(legacy), B) === null, "אסימון בלי מכינה התקבל ב-beta");

/* ⚠ אסימון על שם מכינה שאינה קיימת */
ok(await currentUser(reqWith(sign({ tenant: "ghost", account: aAcct.id })), A) === null,
  "אסימון עם מכינה לא-קיימת התקבל");

/* ⚠ חתימה מזויפת */
ok(await currentUser(reqWith(tokA.split(".")[0] + ".AAAA"), A) === null,
  "אסימון עם חתימה שגויה התקבל");
ok(await currentUser(reqWith(""), A) === null, "בקשה בלי עוגייה החזירה משתמש");

/* ⚠ כיבוי `active` מנתק **מיד** ולא בכניסה הבאה */
await A.db.update("person", aPerson.id, { active: false });
ok(await currentUser(reqWith(tokA), A) === null, "כיבוי «פעיל» לא ניתק את הסשן");
await A.db.update("person", aPerson.id, { active: true });

/* ============================================================
   הדלתא והפרופיל אינם משותפים
   ⚠⚠ זה היה הבאג הראשון והשקט ביותר: מטמון פרופיל ברמת
     המודול משמעו שמכינה ב׳ מקבלת את השם והצבעים של א׳
     למשך חמש שניות ואז מתקנת את עצמה — תקלה שאי אפשר לשחזר.
   ============================================================ */
section("האפיון אינו משותף");

A.writeDelta({ preset: "premil", identity: { name: "מכינה א" } });
B.writeDelta({ preset: "premil", identity: { name: "מכינה ב" } });

const pa = await A.loadProfile();
const pb = await B.loadProfile();
ok(pa.identity.name === "מכינה א", `הפרופיל של alpha חזר כ«${pa.identity.name}»`);
ok(pb.identity.name === "מכינה ב", `הפרופיל של beta חזר כ«${pb.identity.name}»`);

/* ⚠ כתיבה באחת אינה נראית בשנייה, גם אחרי שהמטמון התחמם */
A.writeDelta({ preset: "premil", identity: { name: "מכינה א — שונתה" } });
ok((await A.loadProfile()).identity.name === "מכינה א — שונתה", "עדכון לא נקלט ב-alpha");
ok((await B.loadProfile()).identity.name === "מכינה ב", "עדכון ב-alpha דלף ל-beta");

/* ============================================================
   מנהל-על
   ============================================================ */
section("מנהל-על");

const root = { username: "achim" };
const asRoot = await currentUser(reqWith(""), B, root);
ok(asRoot?.isRoot === true, "מנהל-על לא זוהה");
/* ⚠⚠ אינו מתחזה לאדם: `personId` הוא null, ושום שורה לא
   תיחתם בשמו של מישהו אחר. */
ok(asRoot?.personId === null, "מנהל-על קיבל personId של אדם אמיתי");
ok(asRoot?.accountId === null, "מנהל-על קיבל accountId");

/* ⚠ אסימון של מכינה אחרת + מנהל-על = מנהל-על, ולא המשתמש
   ההוא. הראשון נדחה, השני נכנס. */
const both = await currentUser(reqWith(tokA), B, root);
ok(both?.isRoot === true && both.personId === null,
  "אסימון זר ליד מנהל-על נתן משתמש של מכינה אחרת");

/* ⚠ ואסימון תקין **גובר** על מנהל-על: מי שהתחבר כאדם הוא
   אותו אדם, גם אם במקביל יש לו עוגיית קונסולה. */
const realFirst = await currentUser(reqWith(tokA), A, root);
ok(realFirst?.isRoot === false && realFirst.name === "אבי מא",
  "סשן אמיתי נדרס על ידי עוגיית מנהל-העל");

/* ⚠ מנהל-על רואה את כל המסכים — בלי זה הוא נכנס למכינה
   ומקבל תפריט ריק. */
ok(screensOf(pb, asRoot).includes("*"), "מנהל-על לא קיבל גישה לכל המסכים");
ok(!screensOf(pb, { roles: [] }).includes("*"), "משתמש בלי תפקידים קיבל הכול");

/* ============================================================
   השער
   ============================================================ */
section("השער");

const run = async (h, ctx) => { try { return await h(ctx); } catch (e) { return e; } };
const hit = guard(async () => "עבר", { screen: "attendance" });

ok((await run(hit, { user: null, req: { method: "GET" } })) instanceof AuthError,
  "בקשה בלי משתמש עברה את השער");

ok(await run(hit, { user: asRoot, req: { method: "POST" }, profile: pb }) === "עבר",
  "מנהל-על נחסם בשער");

const viewer = { ...inA, viewOnly: true, isRoot: false };
const denied = await run(hit, { user: viewer, req: { method: "POST" }, profile: pa });
ok(denied instanceof AuthError && denied.status === 403,
  "חשבון בצפייה בלבד הצליח לכתוב");
ok(await run(hit, { user: viewer, req: { method: "GET" }, profile: pa }) === "עבר",
  "חשבון בצפייה בלבד נחסם בקריאה");

const student = { personId: bPerson.id, roles: [], isStaff: false, isRoot: false, viewOnly: false };
const noScreen = await run(hit, { user: student, req: { method: "GET" }, profile: pb });
ok(noScreen instanceof AuthError && noScreen.status === 403,
  "משתמש בלי המסך הזה קיבל גישה");

/* ============================================================ */
console.log("");
console.log(`${pass} עברו, ${fail} נכשלו`);
process.exit(fail ? 1 : 0);
