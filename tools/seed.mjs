/* ============================================================
   זריעה — מכינה לדוגמה
   ------------------------------------------------------------
   ⚠ **אין כאן שום נתון אמיתי.** שמות ומספרים מומצאים לחלוטין.

   ⚠ **הזריעה עוברת דרך `store` ולא דרך המנוע.** כך היא נבדקת
     מול הסכימה בדיוק כמו כל כתיבה אחרת — וזריעה ששוברת את
     הסכימה נכשלת כאן ולא מתגלה בייצור.

   הרצה:  npm run seed      ·  npm run reset
   ============================================================ */

import { hashPassword } from "../server/auth.js";
import { args, ensureTenant } from "./_tenant.mjs";

/* ⚠ **על איזו מכינה זה כותב — נאמר, ולא מונח.** ברירת המחדל
   היא `demo`, ולא «המכינה היחידה»: מרגע שיש קונסולה, «יחידה»
   אינו מושג. `--reset` דורס את הקיימת ואומר זאת. */
const { flag, has } = args();
const slug = flag("slug", "demo");
const t = await ensureTenant({
  slug,
  name: "מכינת עין פרת",
  force: has("reset") || has("force"),
});
const db = t.db;
const writeDelta = t.writeDelta;

/* ============================================================
   1. האפיון — הדלתא של «מכינת עין פרת» מעל התבנית
   ⚠ **רק מה ששונה מהתבנית.** כל השאר — התפקידים, אוצר
     המילים, המודולים — מגיע מ-core/presets/premil.js.
   ============================================================ */
writeDelta({
  preset: "premil",
  identity: {
    name: "מכינת עין פרת",
    shortName: "עין פרת",
    tagline: "מערכת הניהול",
    colors: {
      bg: "#F3F1EC",
      surface: "#FFFFFF",
      ink: "#22262B",
      accent: "#1F4B3F",   // ירוק עמוק — כדי שייראה שהצבע באמת מגיע מהאפיון
      warm: "#A8683C",
    },
  },
  year: {
    start: "2026-09-01",
    end: "2027-07-15",
    vacationQuota: 4,     // ⚠ שונה מהתבנית: 4 ולא 3
    minMarkedDays: 5,
  },
  /* ⚠ המכינה הזו בלי תורנויות ובלי שבוע הובלה — וזה בדיוק מה
     שכיבוי מודול אמור לעשות: הם לא קיימים, לא מוסתרים. */
  modules: { duties: false, leadweek: false },
});
console.log("✓ נכתב מסמך האפיון");

/* ============================================================
   2. אנשים
   ============================================================ */
const STAFF = [
  ["דוד אלמוג", "head", "david"],
  ["רננה שחר", "guide", "renana"],
  ["יואב כרמי", "staff", "yoav"],
];

const STUDENTS = [
  "איתי ברנס", "נועם אשכנזי", "יהונתן שביט", "רועי אלימלך", "אורי טסלר",
  "עידו מרגלית", "שחר בן־דוד", "אלעד פרידמן", "תומר ניר", "גיא אבידן",
  "מתן הראל", "דניאל עומר", "יובל אסרף", "אביב רוזנברג", "עומר שלו",
  "נדב קידר", "ארי בלום", "רון מזרחי",
];

const ROLES_FOR = { 0: ["kitchen"], 1: ["scheduler"], 2: ["safety"], 3: ["storage"] };
const pass = await hashPassword("mechina2026");

async function person(name, kind, extra = {}) {
  const existing = await db.find("person", { name });
  if (existing) return existing;
  return db.create("person", { name, kind, active: true, ...extra });
}

const staffRows = [];
for (const [name, role, username] of STAFF) {
  const p = await person(name, "staff", {
    email: `${username}@example.org`,
    phone: "052-000-0000",
  });
  staffRows.push(p);
  if (!await db.find("account", { username })) {
    await db.create("account", {
      person: p.id, username, passwordHash: pass,
      loginEmail: `${username}@example.org`,
    });
  }
  if (!await db.find("roleAssignment", { person: p.id, role })) {
    await db.create("roleAssignment", { person: p.id, role });
  }
}

const studentRows = [];
for (let i = 0; i < STUDENTS.length; i++) {
  const p = await person(STUDENTS[i], "student", {
    gender: "male",
    phone: `05${2 + (i % 6)}-555-${String(1000 + i)}`,
    city: ["ירושלים", "מודיעין", "אלון", "כפר אדומים"][i % 4],
    shirtSize: ["S", "M", "L", "XL"][i % 4],
    allergy: i === 4 ? "בוטנים" : i === 11 ? "גלוטן" : null,
    birthDate: `200${6 + (i % 2)}-0${1 + (i % 9)}-1${i % 9}`,
  });
  studentRows.push(p);
  for (const role of (ROLES_FOR[i] || [])) {
    if (!await db.find("roleAssignment", { person: p.id, role })) {
      await db.create("roleAssignment", { person: p.id, role });
    }
  }
}

/* חשבון לחניך הראשון, כדי שאפשר יהיה לראות את צד החניך */
if (!await db.find("account", { username: "chanich" })) {
  await db.create("account", {
    person: studentRows[0].id, username: "chanich", passwordHash: pass,
    loginEmail: "chanich@example.org",
  });
}

console.log(`✓ ${staffRows.length} צוות · ${studentRows.length} חניכים`);

/* ============================================================
   3. לוח שנה ונוכחות
   ⚠ 30 ימים אחורה, בלי שישי ושבת — וגם היום, כדי שהמסך
     ייפתח על יום שיש בו תוכן.
   ============================================================ */
const DAY = 86400000;
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const today = new Date(iso(Date.now()));
const dow = (s) => new Date(s + "T00:00:00Z").getUTCDay();

const dates = [];
for (let i = 30; i >= 0; i--) {
  const d = iso(today.getTime() - i * DAY);
  if (i !== 0 && (dow(d) === 5 || dow(d) === 6)) continue;
  dates.push(d);
}
for (let i = 1; i <= 10; i++) {
  const d = iso(today.getTime() + i * DAY);
  if (dow(d) === 5 || dow(d) === 6) continue;
  dates.push(d);
}

for (const date of dates) {
  if (!await db.find("calendarDay", { date })) {
    await db.create("calendarDay", { date, kind: "regular" });
  }
}

/* ⚠ הימים שכבר עברו מסומנים; **היום עצמו נשאר לא מסומן**,
   כדי שמסך הבית יראה את המצב השלישי — «טרם סומן» — שהוא
   בדיוק מה שקל לשכוח לבנות. */
const past = dates.filter((d) => d < iso(today));
for (const date of past) {
  let ad = await db.find("attendanceDay", { date });
  if (!ad) {
    ad = await db.create("attendanceDay", {
      date, markedBy: staffRows[0].id, markedAt: new Date(date + "T08:30:00Z").toISOString(),
    });
  }
  const seed = Number(date.slice(8));
  for (let i = 0; i < studentRows.length; i++) {
    const p = studentRows[i];
    if (await db.find("attendanceMark", { day: ad.id, person: p.id })) continue;
    const r = (seed + i * 7) % 20;
    const status = r === 0 ? "absent" : r === 1 ? "half" : "present";
    await db.create("attendanceMark", {
      day: ad.id, person: p.id, status,
      by: staffRows[0].id, at: new Date(date + "T08:35:00Z").toISOString(),
    });
  }
}
console.log(`✓ ${dates.length} ימים בלוח השנה · ${past.length} סומנו`);

/* ============================================================
   4. מסגרות
   ============================================================ */
const TEAMS = [
  ["קבוצת רננה", "group", staffRows[1].id],
  ["ועדת תרבות", "committee", null],
  ["ענף מטבח", "branch", null],
];
for (const [name, category, guide] of TEAMS) {
  let team = await db.find("team", { name });
  if (!team) team = await db.create("team", { name, category, guide, period: "yearly" });
  for (const p of studentRows.slice(0, category === "group" ? 18 : 6)) {
    if (!await db.find("membership", { person: p.id, team: team.id })) {
      await db.create("membership", { person: p.id, team: team.id, term: "yearly" });
    }
  }
}
console.log(`✓ ${TEAMS.length} מסגרות`);

console.log("");
console.log(`  ${"http://localhost:5180/m/" + slug + "/"}`);
console.log("");
console.log("  כניסה:");
console.log("    david   / mechina2026   ראש המכינה");
console.log("    renana  / mechina2026   מדריכה");
console.log("    chanich / mechina2026   חניך");
console.log("");
console.log("  npm run dev");
console.log("");
