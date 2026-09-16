/* ============================================================
   מכינת ניר עוז — מכינה מוחשית בתוך הקונסולה
   ------------------------------------------------------------
   ⚠⚠⚠ **אין כאן monday, ואין חיבור לשום מערכת חיצונית.** זו
     מכינה שלמה שחיה במסד של המוצר בלבד. מי שיחבר כאן מקור
     חיצוני הופך את המוצר לתלוי בו — וזו בדיוק ההחלטה שנפלה
     כשהמוצר הזה נפתח.

   ⚠⚠ **וכל נתון כאן מומצא.** השמות, הטלפונים, תעודות הזהות
     והמרצים אינם של איש. מה שאמיתי הוא **המבנה**: 33 חניכים,
     שבעה אנשי צוות, ענפים וועדות, שיעורים שחלקם לא התקיימו,
     בקשות יציאה בשלושה שלבים שונים, תקלות שחלקן דחופות.
     מסד ריק אינו מראה אם המוצר עובד; מסד שנראה כמו מכינה —
     כן.

   ⚠ **הרשימות כאן הן הדגמה של האפיון, לא של הקוד.** התפקידים
     שנוצרים למטה כוללים שלושה שאינם בקטלוג כלל — סגנית, גזבר
     וחובש — בדיוק כדי להראות שתפקיד הוא נתון ולא רשימה בקוד.

   הרצה:  node tools/seed-niroz.mjs
          node tools/seed-niroz.mjs --force     דורס מכינה קיימת
   ============================================================ */

import { hashPassword } from "../server/auth.js";
import { args, ensureTenant } from "./_tenant.mjs";
import { ROLE_CATALOG } from "../core/catalog.js";

const { flag, has } = args();
const slug = flag("slug", "nir-oz");

const t = await ensureTenant({
  slug,
  name: "מכינת ניר עוז",
  force: has("force") || has("reset"),
});
const db = t.db;

/* ============================================================
   תאריכים — הכול יחסית להיום, כדי שהמסך ייפתח על תוכן
   ⚠ מכינה שנזרעת עם תאריכים קבועים נראית נטושה כעבור חודש:
     הלו״ז ריק, הנוכחות מלפני שנה, והבקשות כולן בעבר.
   ============================================================ */
const DAY = 86400000;
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const today = iso(Date.now());
const at = (n) => iso(Date.now() + n * DAY);
const dow = (s) => new Date(s + "T00:00:00Z").getUTCDay();
const stamp = (d, time = "08:30") => new Date(`${d}T${time}:00Z`).toISOString();

/* ⚠ גיבוב יציב — אותה מכינה נראית אותו דבר בכל זריעה, ולכן
   צילום מסך מאתמול עדיין מתאר את מה שרואים. Math.random היה
   מייצר מכינה אחרת בכל הרצה. */
let seed = 20260914;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const chance = (p) => rnd() < p;

/* ============================================================
   1 · האפיון
   ============================================================ */
const CUSTOM_ROLES = [
  /* ⚠⚠ **שלושת אלה אינם בקטלוג.** הם נוצרים כאן כנתון בלבד,
     ומנהל המכינה יכול למחוק אותם, לשנות להם שם או להוסיף
     עליהם — בלי דיפלוי. זו כל הטענה של המוצר. */
  {
    slug: "deputy", label: "סגנית ראש המכינה",
    desc: "מכריעה בכל מה שראש המכינה מכריע, כשהוא אינו זמין.",
    staffOnly: true, admin: true, viewOnly: false, screens: ["*"],
  },
  {
    slug: "treasurer", label: "גזבר",
    desc: "התקציב, הקניות ודוח התשלום למרצים.",
    staffOnly: true, admin: false, viewOnly: false,
    screens: ["home", "me", "budget", "shopping", "pay", "trends"],
  },
  {
    slug: "medic", label: "חובש",
    desc: "מלווה אירועי בטיחות ומחזיק את רשימת האלרגיות.",
    staffOnly: false, admin: false, viewOnly: false,
    screens: ["home", "me", "safety", "people"],
  },
];

/* ⚠ התפקידים מהקטלוג נשמרים כמו שהם, ורק שלוש תוויות שונות
   אצל ניר עוז — «מוביל שבוע» במקום ברירת המחדל וכדומה. */
const RELABEL = {
  head: "ראש המכינה",
  guide: "מדריך קבוצה",
  staff: "איש צוות",
  viewer: "צפייה בלבד",
  scheduler: "אחראי לו״ז",
  kitchen: "אחראי מטבח",
  storage: "אחראי מכולה",
  house: "אב בית",
  safety: "אחראי בטיחות",
  weeklead: "מוביל שבוע",
  chair: "יו״ר ועדה",
  member: "כל חניך במכינה",
};

const roles = [
  ...Object.entries(ROLE_CATALOG).map(([s, r]) => ({
    slug: s,
    label: RELABEL[s] || r.label,
    desc: r.why || "",
    staffOnly: Boolean(r.staffOnly),
    admin: Boolean(r.admin),
    viewOnly: Boolean(r.viewOnly),
    base: Boolean(r.base),
    screens: r.all ? ["*"] : (r.screens || []),
  })),
  ...CUSTOM_ROLES.map((r) => ({ ...r, base: false })),
];

t.writeDelta({
  preset: "premil",
  identity: {
    name: "מכינת ניר עוז",
    shortName: "ניר עוז",
    tagline: "במעלה הדרך",
    /* הפלטה שהמכינה עובדת איתה: קרם, נייבי, חימר. */
    colors: {
      bg: "#F5F1E8",
      surface: "#FFFFFF",
      ink: "#1F2733",
      accent: "#002454",
      warm: "#906048",
    },
  },
  roles,
  year: {
    start: "2026-09-01",
    end: "2027-07-20",
    vacationQuota: 3,
    minMarkedDays: 5,
  },
  /* ⚠ ניר עוז מדליקה גם מליאות וגם פרויקטים אישיים — שניהם
     כבויים בתבנית, כי הם אינם נפוצים. */
  modules: { content: true, projects: true },
  texts: {
    "home.welcome": "בוקר טוב. מה שצריך תשומת לב היום מופיע ראשון.",
    "requests.intro":
      "בקשת יציאה מוגשת למדריך הקבוצה, והוא ממליץ. ראש המכינה מכריע.\n" +
      "מחלה והיעדרות מוצדקת מחייבות פירוט; יום חופש אינו.",
  },
});
t.invalidateProfile();
say("profile", roles.length + " roles (3 of them not in any catalog)");

/* ============================================================
   2 · אנשים
   ============================================================ */
const STAFF = [
  ["דני שרעבי", "danny", ["head"]],
  ["מיכל אורן", "michal", ["deputy"]],
  ["נעם ברקת", "noam", ["guide"]],
  ["רננה שחר", "renana", ["guide"]],
  ["איתי לביא", "itay", ["guide"]],
  ["יואב כרמי", "yoav", ["staff", "treasurer"]],
  ["אלון רצון", "alon", ["viewer"]],
];

const FIRST = [
  "אורי", "איתי", "נועם", "יהונתן", "רועי", "עידו", "שחר", "אלעד", "תומר",
  "גיא", "מתן", "דניאל", "יובל", "אביב", "עומר", "נדב", "ארי", "רון",
  "אסף", "הראל", "יונתן", "אמיתי", "בועז", "גלעד", "דור", "זוהר", "חן",
  "טל", "ידידיה", "כפיר", "לביא", "מאור", "נתנאל",
];
const LAST = [
  "בן־חיים", "אשכנזי", "שביט", "אלימלך", "טסלר", "מרגלית", "בן־דוד",
  "פרידמן", "ניר", "אבידן", "הראל", "עומר", "אסרף", "רוזנברג", "שלו",
  "קידר", "בלום", "מזרחי", "דגן", "ברנס", "יפרח", "כהנא", "לוגסי",
  "נחמיאס", "סבן", "עזרא", "פינטו", "צדוק", "קמחי", "רווה", "שטרית",
  "תורג׳מן", "אביטל",
];
const CITIES = ["ירושלים", "מודיעין", "אלון", "כפר אדומים", "רעננה", "מעלה אדומים", "בית שמש"];

const pass = await hashPassword("mechina2026");

async function person(name, kind, extra = {}) {
  const hit = await db.find("person", { name });
  if (hit) return hit;
  return db.create("person", { name, kind, active: true, ...extra });
}

async function account(p, username, extra = {}) {
  if (await db.find("account", { username })) return;
  await db.create("account", {
    person: p.id, username, passwordHash: pass,
    loginEmail: `${username}@nir-oz.example`, ...extra,
  });
}

async function give(p, role, scope = null) {
  if (await db.find("roleAssignment", { person: p.id, role })) return;
  await db.create("roleAssignment", { person: p.id, role, scope });
}

const staff = [];
for (const [name, username, rs] of STAFF) {
  const p = await person(name, "staff", {
    email: `${username}@nir-oz.example`,
    phone: `050-${100 + staff.length}-${1000 + staff.length}`,
  });
  staff.push(p);
  /* ⚠ אלון הוא **צפייה בלבד** — החשבון נושא את הדגל, והשרת
     דוחה כל בקשה שאינה קריאה. זה נבדק במערכת ולא רק מוצג. */
  await account(p, username, { viewOnly: rs.includes("viewer") });
  for (const r of rs) await give(p, r);
}
const [head, deputy, guideNoam, guideRenana, guideItay] = staff;

const students = [];
for (let i = 0; i < 33; i++) {
  const name = `${FIRST[i]} ${LAST[i]}`;
  const p = await person(name, "student", {
    nationalId: String(300100000 + i * 137),
    gender: "male",
    birthDate: `2008-0${1 + (i % 9)}-${String(3 + (i % 25)).padStart(2, "0")}`,
    phone: `05${2 + (i % 6)}-${String(500 + i)}-${String(1000 + i * 7).slice(0, 4)}`,
    city: CITIES[i % CITIES.length],
    shirtSize: ["S", "M", "L", "XL"][i % 4],
    /* ⚠ אלרגיה היא הנתון היחיד כאן שיש לו משמעות מיידית —
       למי שמבשל. הוא מובלט במסך ואינו שורה ברשימה אפורה. */
    allergy: i === 4 ? "בוטנים" : i === 11 ? "גלוטן" : i === 22 ? "ביצים" : null,
    joinedAt: "2026-09-01",
  });
  students.push(p);
}

/* ⚠ חשבון בדיקה — **נכנס ואינו נספר.** `excludeFromCounts`
   נפרד מ-`active` בדיוק בשביל זה: כיבוי `active` היה מוציא
   אותו מכל ספירה **וגם חוסם לו את הכניסה**, וזה ההפך ממה
   שצריך. */
const demo = await person("חשבון בדיקה", "student", {
  excludeFromCounts: true, joinedAt: "2026-09-01",
});
await account(demo, "bdika");
await account(students[0], "chanich");

/* תפקידים של חניכים — בעלי תפקיד רואים את אותם מסכים כמו
   המנהל, לא גרסה מקוצצת. */
const DUTY = {
  0: ["kitchen"], 1: ["scheduler"], 2: ["storage"], 3: ["house"],
  4: ["safety"], 5: ["weeklead"], 6: ["medic"], 7: ["weeklead"],
};
for (const [i, rs] of Object.entries(DUTY)) {
  for (const r of rs) await give(students[i], r);
}
/* ⚠ חשבון הבדיקה נושא חמישה תפקידים, כדי שאפשר יהיה לראות
   דרכו כל מסך של בעל תפקיד. */
for (const r of ["kitchen", "storage", "house", "safety", "scheduler"]) await give(demo, r);

say("people", `${staff.length} staff, ${students.length} students, 1 test account`);

/* ============================================================
   3 · מסגרות
   ============================================================ */
const TEAMS = [
  ["קבוצת נעם", "group", guideNoam, 11],
  ["קבוצת רננה", "group", guideRenana, 11],
  ["קבוצת איתי", "group", guideItay, 11],
  ["ענף מטבח", "branch", null, 6],
  ["ענף מכולה", "branch", null, 5],
  ["ענף ניקיון", "branch", null, 6],
  ["ענף לו״ז", "branch", null, 4],
  ["ועדת תרבות", "committee", null, 7],
  ["ועדת קבוצה ותוכן", "committee", null, 6],
  ["ועדת ידיעת הארץ והכנה לצבא", "committee", null, 6],
  ["סדרת ארץ ישראל", "series", null, null],
  ["סדרת מנהיגות", "series", null, null],
  ["צוות יום הזיכרון", "adhoc", null, 5],
];

const teams = {};
let cursor = 0;
for (const [name, category, guide, capacity] of TEAMS) {
  let team = await db.find("team", { name });
  if (!team) {
    team = await db.create("team", {
      name, category, capacity,
      guide: guide ? guide.id : null,
      period: category === "series" ? "per_term" : "yearly",
    });
  }
  teams[name] = team;

  /* קבוצות מחלקות את כל המחזור; השאר לוקחות פלח */
  const members = category === "group"
    ? students.slice(cursor, cursor + 11)
    : sample(students, capacity || 5);
  if (category === "group") cursor += 11;

  for (const p of members) {
    if (!await db.find("membership", { person: p.id, team: team.id })) {
      await db.create("membership", {
        person: p.id, team: team.id,
        term: category === "series" ? "first" : "yearly",
      });
    }
  }

  /* ⚠ יו״ר הוא **חניך**, והמדריך המלווה הוא איש צוות —
     שתי עמודות ולא אחת. ועדה תרצה יום אחד את שניהם. */
  if (category === "committee" && members.length && !team.chair) {
    await db.update("team", team.id, { chair: members[0].id });
    await give(members[0], "chair", team.id);
  }
}
say("teams", `${TEAMS.length} — groups, branches, committees, series, one ad-hoc`);

/* ============================================================
   4 · לוח השנה
   ⚠ **לא רק «רגיל».** מכינה אמיתית נושאת סופ״ש בית, סדרה,
     טיול, חג ויום שהשגרה פשוט לא התקיימה בו — וכל אחד מהם
     מתנהג אחרת בחישוב הנוכחות ובחישוב הכסף.
   ============================================================ */
const SPECIAL = {
  [at(-23)]: "trip", [at(-22)]: "trip",
  [at(-16)]: "series", [at(-15)]: "series", [at(-14)]: "series",
  [at(-9)]: "holiday",
  [at(-3)]: "noroutine",
  [at(6)]: "trip",
};

const days = [];
for (let i = -45; i <= 21; i++) {
  const d = at(i);
  const w = dow(d);
  /* שישי ושבת — סופ״ש בית, ואינם ימי לימוד */
  const kind = w === 5 || w === 6 ? "home" : (SPECIAL[d] || "regular");
  days.push({ date: d, kind });
  if (!await db.find("calendarDay", { date: d })) {
    await db.create("calendarDay", { date: d, kind });
  }
}

/* ⚠ ימים שנספרים לנוכחות — **לא כל יום שיש לו שורה.** יום
   שסומן ואז השתנה סוגו חייב לצאת מהמכנה מיד ולמפרע, ולכן
   הסינון הוא בזמן החישוב ולא בשורה. */
const schoolDays = days
  .filter((d) => d.date < today && ["regular", "series"].includes(d.kind))
  .map((d) => d.date);

/* ============================================================
   5 · נוכחות
   ⚠ **היום עצמו נשאר לא מסומן**, כדי שמסך הבית יראה את המצב
     השלישי — «טרם סומן» — שהוא בדיוק מה שקל לשכוח לבנות.
   ============================================================ */
let marks = 0;
for (const date of schoolDays) {
  let ad = await db.find("attendanceDay", { date });
  if (!ad) {
    ad = await db.create("attendanceDay", {
      date, markedBy: pick([guideNoam, guideRenana, guideItay]).id,
      markedAt: stamp(date),
    });
  }
  for (const p of students) {
    if (await db.find("attendanceMark", { day: ad.id, person: p.id })) continue;
    const status = chance(0.055) ? "absent" : chance(0.03) ? "half" : "present";
    await db.create("attendanceMark", {
      day: ad.id, person: p.id, status, by: ad.markedBy, at: stamp(date, "08:35"),
    });
    marks++;
  }
}
say("attendance", `${schoolDays.length} marked days, ${marks} marks, today left unmarked`);

/* ============================================================
   6 · בקשות יציאה — בכל שלב שיש
   ⚠⚠ **השלב נגזר ואינו נשמר.** אין כאן עמודת «שלב» שיכולה
     לסתור את הנתונים: בקשה שהמדריך טרם נגע בה היא אצלו,
     בקשה שהמליץ עליה היא אצל ראש המכינה, ובקשה שהוכרעה
     סגורה. הזריעה כותבת רק את מה שבאמת קרה.
   ============================================================ */
const REQS = [
  /* אצל המדריך — טרם המליץ */
  { i: 2, type: "vacation", from: at(4), to: at(5), out: "14:00", back: "22:00",
    detail: "", status: "pending" },
  { i: 9, type: "sick", from: at(1), to: at(1), out: "08:00", back: "20:00",
    detail: "חום מאתמול בערב, נקבע תור לרופא המשפחה.", status: "pending" },

  /* המדריך המליץ — אצל ראש המכינה */
  { i: 14, type: "justified", from: at(3), to: at(3), out: "07:00", back: "21:00",
    detail: "זימון ללשכת הגיוס.", status: "pending",
    guideDecision: "approved", guideBy: guideRenana, guideAt: at(-1) },
  /* ⚠ **גם דחיית מדריך עוברת הלאה.** היא המלצה, לא הכרעה. */
  { i: 21, type: "vacation", from: at(2), to: at(3), out: "16:00", back: "23:00",
    detail: "", status: "pending",
    guideDecision: "rejected", guideBy: guideItay, guideAt: at(-1) },

  /* הוכרעו */
  { i: 5, type: "vacation", from: at(-7), to: at(-6), out: "15:00", back: "22:30",
    detail: "", status: "approved", charged: 1,
    guideDecision: "approved", guideBy: guideNoam, guideAt: at(-9),
    decidedBy: head, decidedAt: at(-8) },
  { i: 17, type: "sick", from: at(-12), to: at(-11), out: "08:00", back: "20:00",
    detail: "שפעת.", status: "approved", charged: 0,
    decidedBy: head, decidedAt: at(-13) },
  { i: 28, type: "vacation", from: at(-4), to: at(-4), out: "12:00", back: "22:00",
    detail: "", status: "rejected",
    guideDecision: "rejected", guideBy: guideItay, guideAt: at(-6),
    decidedBy: head, decidedAt: at(-5),
    appeal: "זה היה יום ההולדת של סבתא שלי, וידעתי על זה חודש מראש.",
    appealAt: at(-4) },
];

let created = 0;
for (const r of REQS) {
  const p = students[r.i];
  if (await db.find("leaveRequest", { person: p.id, fromDate: r.from })) continue;
  const row = await db.create("leaveRequest", {
    person: p.id, type: r.type,
    fromDate: r.from, toDate: r.to,
    outAt: r.out, backAt: r.back,
    detail: r.detail || null,
    status: r.status,
    guideDecision: r.guideDecision || null,
    guideBy: r.guideBy ? r.guideBy.id : null,
    guideAt: r.guideAt ? stamp(r.guideAt, "19:20") : null,
    decidedBy: r.decidedBy ? r.decidedBy.id : null,
    decidedAt: r.decidedAt ? stamp(r.decidedAt, "21:05") : null,
    appeal: r.appeal || null,
    appealAt: r.appealAt ? stamp(r.appealAt, "22:10") : null,
    chargedDays: r.charged ?? null,
  });
  created++;

  /* ⚠⚠ **שורת היעדרות נוצרת בהכרעה הסופית בלבד.** המלצת
     המדריך אינה נוגעת בלוח השנה. */
  if (r.status === "approved") {
    for (let d = Date.parse(r.from); d <= Date.parse(r.to); d += DAY) {
      const date = iso(d);
      if (await db.find("absence", { person: p.id, date })) continue;
      await db.create("absence", {
        person: p.id, date, type: r.type, source: "request",
        detail: r.detail || null,
        /* ⚠ המחיר במכסה יושב על שורת ההיעדרות ולא על הבקשה —
           הסיכום סופר משם, ושני מספרים על אותה שאלה סותרים. */
        cost: r.charged ?? 1,
        request: row.id,
      });
    }
  }
}
say("requests", `${created} — at the guide, at the head, decided, and one under appeal`);

/* ============================================================
   7 · שיעורים
   ⚠⚠ **«מתוכנן» שבגיליון מכריע.** מפגש שסומן «לא» אינו
     מתקיים — הוא עובר לרשימת «לא מתקיימים» עם הסיבה ואינו
     נספר ב«טרם דווחו». אין עליו מה לדווח.
   ⚠ **ו«טרם דווח» הוא מצב שלישי** ולא «לא התקיים». זו כל
     הסיבה שהמסך קיים.
   ============================================================ */
const COURSES = [
  ["מחשבת ישראל", "הרב אבי שטרן", "ראשון 10:00", 450, 1],
  ["ציונות ותולדות המדינה", "ד״ר יעל נוה", "שני 11:30", 500, 1],
  ["מנהיגות וחברה", "רונן בר־אל", "שלישי 09:00", 420, 2],
  ["ידיעת הארץ", "אורי כספי", "רביעי 08:30", 380, 2],
  ["אימונים", null, "שני 07:00", null, 0],
  ["כושר קרבי", null, "חמישי 07:00", null, 0],
  ["מליאה", null, "חמישי 20:00", null, 0],
  ["סדנת דיבור בציבור", "נעמה גל", "שלישי 19:00", 700, 3],
  ["הכנה לגיבושים", "סרן (מיל׳) טל אבידר", "רביעי 17:00", 650, 3],
  ["בית מדרש", "הרב אבי שטרן", "ראשון 20:00", null, 1],
];

const SUMMARIES = [
  "עסקנו בשאלה מה הופך קבוצה לחברה — ובמה שקורה כשהמטרה המשותפת נגמרת.",
  "המרצה פרש את הוויכוח על גבולות 47 והראה כמה החלטות נפלו בחדר אחד.",
  "תרגלנו מתן משוב: כל אחד אמר לחבר דבר אחד שעבד ודבר אחד שלא.",
];

const courses = [];
for (const [subject, lecturer, dayTime, price, guest] of COURSES) {
  let c = await db.find("course", { subject });
  if (!c) {
    c = await db.create("course", {
      subject, lecturer, dayTime,
      pricePerSession: price,
      guestLecturer: guest === 3,
      /* ⚠ אימונים ומליאה **אמיתיים ואינם עולים כסף** — הם
         מוצאים מדוח התשלום ואינם מנפחים את «שיעורים בלי
         מחיר», שהוא כל התכלית של הדוח. */
      excludeFromPay: price === null,
      lecturerPhone: price ? "052-000-0000" : null,
      lecturerEmail: price ? "lecturer@example.org" : null,
    });
  }
  courses.push(c);
}

let sessions = 0, rated = 0;
for (const c of courses) {
  for (let w = -6; w <= 1; w++) {
    const date = at(w * 7 + (rnd() > 0.5 ? 1 : 2));
    if (await db.find("session", { course: c.id, date })) continue;

    const future = date > today;
    /* אחד מכל שמונה מסומן «לא מתוכנן», עם סיבה */
    const off = chance(0.12);
    const s = await db.create("session", {
      course: c.id, date,
      planned: off ? "no" : "yes",
      plannedReason: off ? pick(["שבוע קליטה", "יום מיון", "לתאם מחדש", "חג"]) : null,
      /* ⚠ `null` = טרם דווח, וזה מצב שלישי אמיתי */
      happened: off || future ? null : (chance(0.9) ? "yes" : "no"),
      summary: !off && !future && chance(0.35) ? pick(SUMMARIES) : null,
      note: !off && !future && chance(0.12) ? "המרצה איחר בעשרים דקות." : null,
      openForRating: !off && !future && c.pricePerSession != null && chance(0.25),
    });
    sessions++;

    if (s.openForRating) {
      for (const p of sample(students, 9 + Math.floor(rnd() * 12))) {
        await db.create("rating", {
          session: s.id, person: p.id,
          score: 6 + Math.floor(rnd() * 5),
          comment: chance(0.2) ? "היה מעניין, קצת ארוך." : null,
          at: stamp(date, "21:00"),
        });
        rated++;
      }
    }
  }
}
say("lessons", `${courses.length} courses, ${sessions} sessions, ${rated} student ratings`);

/* ============================================================
   8 · מלאי וקניות
   ⚠ **הכמות היא טקסט חופשי** («40 חבילות של 10»), והמפתח הוא
     מספר. חיבור עובר דרך «רק המספר הראשון» ומשאיר את תיאור
     האריזה — מי שיחליף את שניהם יהפוך פריט אחד לשני פריטים.
   ============================================================ */
const STOCK = [
  ["אורז", "food", "18 ק״ג", 25, 7.5],
  ["פסטה", "food", "12 חבילות", 20, 6],
  ["שמן קנולה", "food", "4 בקבוקים", 10, 14],
  ["רסק עגבניות", "food", "9 קופסאות", 12, 4.5],
  ["טחינה גולמית", "food", "3 צנצנות", 6, 22],
  ["קמח", "food", "22 ק״ג", 20, 4],
  ["סוכר", "food", "14 ק״ג", 15, 5],
  ["עגבניות", "food", "6 ק״ג", 20, 8],
  ["מלפפונים", "food", "4 ק״ג", 18, 7],
  ["ביצים", "food", "8 תבניות", 15, 18],
  ["צלחות", "disposable", "40 חבילות של 25", 50, 12],
  ["כוסות", "disposable", "30 חבילות", 45, 9],
  ["סכו״ם", "disposable", "12 חבילות", 30, 15],
  ["מפיות", "disposable", "20 חבילות", 20, 6],
  ["שקיות אשפה", "cleaning", "9 גלילים", 15, 11],
  ["אקונומיקה", "cleaning", "5 בקבוקים", 8, 9],
  ["סמרטוטים", "cleaning", "2 חבילות", 6, 13],
  ["נוזל כלים", "cleaning", "3 בקבוקים", 8, 12],
  ["אוהל סיירים", "storage", "7 יחידות", 10, 380],
  ["שק שינה", "storage", "26 יחידות", 35, 120],
  ["מזרן שטח", "storage", "24 יחידות", 35, 65],
  ["ג׳ריקן מים", "storage", "6 יחידות", 8, 90],
  ["פנס ראש", "storage", "17 יחידות", 35, 45],
];

const stockRows = [];
for (const [name, area, quantity, par, unitPrice] of STOCK) {
  let it = await db.find("equipmentItem", { name, area });
  if (!it) {
    it = await db.create("equipmentItem", {
      name, area, quantity, par, unitPrice,
      consumable: area !== "storage",
    });
  }
  stockRows.push(it);
}

/* ⚠ רשימת הקניות נוצרת **מהפריט עצמו**, ולכן השם זהה והשווי
   מתאים למחיר של אותו פריט. התאמה חלקית הייתה מדביקה מחיר
   של פריט אחר על שורה שהוקלדה ביד. */
let shop = 0;
for (const it of stockRows) {
  const qty = Number(String(it.quantity).match(/\d+/)?.[0] || 0);
  if (it.par == null || qty >= it.par) continue;
  if (await db.find("shoppingRow", { item: it.id, bought: false })) continue;
  await db.create("shoppingRow", {
    name: it.name, area: it.area,
    quantity: `${Math.ceil(it.par - qty)}`,
    bought: chance(0.25),
    item: it.id, addedAt: stamp(at(-2), "16:00"),
  });
  shop++;
}
say("inventory", `${stockRows.length} items in 4 areas, ${shop} on the shopping list`);

/* ============================================================
   9 · תקלות
   ⚠ **דחוף לחוד והשאר כמספר.** עשרים שורות «תקלה פתוחה» הן
     רעש שגורם לסגור את הפעמון ולא לפתוח אותו.
   ============================================================ */
const FAULTS = [
  ["מזגן בחדר אוכל לא מקרר", "חדר אוכל", true, "open", null],
  ["ברז דולף במקלחות בנים", "מקלחות", false, "open", null],
  ["נורה שרופה במסדרון צפוני", "מסדרון", false, "open", null],
  ["דלת המכולה לא ננעלת", "מכולה", true, "working", null],
  ["מקרר שני עושה רעש", "מטבח", false, "working", null],
  ["שקע רופף בכיתה ב׳", "כיתה ב׳", false, "done", at(-5)],
  ["חלון שבור בחדר 12", "מגורים", false, "done", at(-11)],
  ["סתימה בכיור המטבח", "מטבח", true, "done", at(-2)],
];
for (const [title, place, urgent, status, doneAt] of FAULTS) {
  if (await db.find("fault", { title })) continue;
  await db.create("fault", {
    title, place, urgent, status, doneAt,
    detail: urgent ? "מפריע לשגרה — דווח גם בעל פה." : null,
    reportedBy: pick(students).id,
    reportedAt: stamp(at(-14 + Math.floor(rnd() * 12)), "13:00"),
    cost: status === "done" ? Math.floor(rnd() * 600) + 80 : null,
  });
}
say("faults", `${FAULTS.length} — open, in progress and closed, three of them urgent`);

/* ============================================================
   10 · תורנויות
   ⚠ **שני סוגים ולא אחד עם דגל**: גזרת סוף יום משובצת
     ל**שבוע**, ותורנות מטבח משובצת ל**תאריך**. שורה נושאת
     אחד מהם — לא את שניהם.
   ============================================================ */
const SECTORS = ["מטבח", "חדר אוכל", "מסדרונות", "שירותים", "חצר"];
const CHORES = [
  ["ניקיון משטחי העבודה", "מטבח", ["sun", "mon", "tue", "wed", "thu"], "אחרי כל ארוחה"],
  ["שטיפת רצפת המטבח", "מטבח", [], "בסוף היום"],
  ["ריקון פחים", "מטבח", [], "אחרי ארוחת ערב"],
  ["ניגוב שולחנות", "חדר אוכל", [], "אחרי כל ארוחה"],
  ["סידור כיסאות", "חדר אוכל", [], "בסוף היום"],
  ["טאטוא", "מסדרונות", [], "בערב"],
  ["ניקיון אסלות וכיורים", "שירותים", [], "בערב"],
  ["איסוף אשפה מהחצר", "חצר", ["sun", "thu"], "לפני ארוחת ערב"],
  ["בדיקת מקררים", "מטבח", ["sun"], "בבוקר"],
];
for (const [title, sector, daysList, when] of CHORES) {
  if (await db.find("choreTask", { title })) continue;
  await db.create("choreTask", { title, sector, area: sector, days: daysList, when });
}

/* השבוע הנוכחי ושני השבועות הבאים */
const sunday = (d) => iso(Date.parse(d) - dow(d) * DAY);
let shifts = 0;
for (const w of [0, 1, 2]) {
  const weekStart = sunday(at(w * 7));
  const pool = sample(students, 25);
  /* ⚠ `await` ולא forEach שמשליך הבטחות — כתיבה שאיש אינו
     ממתין לה נכתבת אחרי שהסקריפט הדפיס «נגמר», ומי שיפסיק
     אותו מקבל מכינה חצי-זרועה בלי שום סימן. */
  for (let i = 0; i < SECTORS.length; i++) {
    for (const p of pool.slice(i * 5, i * 5 + 5)) {
      await db.create("dutyShift", { person: p.id, sector: SECTORS[i], weekStart, date: null });
      shifts++;
    }
  }
  /* תורנות מטבח — שלושה ליום, לתאריך */
  for (let d = 0; d < 5; d++) {
    const date = iso(Date.parse(weekStart) + d * DAY);
    for (const p of sample(students, 3)) {
      await db.create("dutyShift", { person: p.id, sector: "תורנות מטבח", date, weekStart: null });
      shifts++;
    }
  }
}
say("chores", `${CHORES.length} checklist tasks, ${shifts} shifts over three weeks`);

/* ============================================================
   11 · לוח מודעות, ציטוטים, מליאות, שיעורי חניך
   ============================================================ */
const NOTICES = [
  ["נמצא מעיל שחור ליד חדר האוכל", "lost", "all", "יש לגשת למשרד."],
  ["מחר יוצאים ב-6:30 ולא ב-7:00", "notice", "all", "האוטובוס לא יחכה."],
  ["המלצה: הרצאה על גרעיני נחל ביום שני", "tip", "all", ""],
  ["הגשת בקשות יציאה עד יום שלישי בערב", "notice", "all", "אחרי זה לא נספיק להכריע."],
];
for (const [title, kind, audience, body] of NOTICES) {
  if (await db.find("notice", { title })) continue;
  await db.create("notice", {
    title, kind, audience, body: body || null,
    by: pick(staff).id, at: stamp(at(-1), "18:00"),
    expiresAt: at(10), pinned: kind === "notice" && chance(0.5),
  });
}

const QUOTES = [
  ["מי שאין לו עבר — אין לו עתיד.", "אחד העם"],
  ["אין דבר שלם יותר מלב שבור.", "רבי מנחם מנדל מקוצק"],
  ["האדם אינו אלא תבנית נוף מולדתו.", "שאול טשרניחובסקי"],
  ["אם תרצו אין זו אגדה.", "בנימין זאב הרצל"],
];
for (const [text, author] of QUOTES) {
  if (await db.find("quote", { text })) continue;
  await db.create("quote", {
    text, author, addedBy: pick(students).id, at: stamp(at(-20), "12:00"),
  });
}

/* ⚠⚠ הפרוטוקול **פרטי** והסיכום פתוח — שני שדות ולא אחד.
   הפרוטוקול הוא רישום של מי אמר מה, כולל דעות שנאמרו בפה
   מלא דווקא מפני שהן נשארות בחדר. */
const PLENARY = [
  ["מליאת פתיחת שנה", at(-38),
    "היכרות · כללי המכינה · בחירת ועדות",
    "דובר על כך שיש תחושה של חוסר סדר בשעות הערב.",
    "פתחנו את השנה, הצגנו את הוועדות, וכל אחד בחר איפה הוא רוצה להיות."],
  ["מליאת אמצע סמסטר", at(-10),
    "משוב על הסדרה · תורנויות · יציאות",
    "שני חניכים אמרו שהתורנויות אינן מחולקות בהוגנות. הוחלט להציג את הטבלה.",
    "דיברנו על התורנויות ועל הסדרה. הטבלה תוצג לכולם מעכשיו."],
  ["מליאת סיכום סמסטר א׳", at(12), "סיכום · מה הלאה", null, null],
];
for (const [title, date, agenda, protocol, summary] of PLENARY) {
  if (await db.find("plenary", { title })) continue;
  await db.create("plenary", {
    title, date, agenda, protocol, summary,
    notesOpen: date > today, cancelled: false,
  });
}

/* ⚠ שני סוגים ולא אחד עם דגל: «שיעור חניך» ו«חניך מביא את
   עולמו». 33 חניכים כפול שניים — 66 משבצות, וכל התכלית היא
   לדעת אילו ריקות. */
let lessons = 0;
for (let i = 0; i < 14; i++) {
  const p = students[i * 2 % students.length];
  const date = at(-30 + i * 3);
  if (await db.find("studentLesson", { person: p.id, date })) continue;
  await db.create("studentLesson", {
    person: p.id, date,
    kind: i % 3 === 0 ? "world" : "lesson",
    subject: pick(["הפרטה בישראל", "מהו חבר", "יחידות מיוחדות", "מוזיקה ישראלית",
      "הסיפור של סבא שלי", "בחירה חופשית"]),
    happened: date < today ? "yes" : null,
  });
  lessons++;
}
say("content", `${NOTICES.length} notices, ${QUOTES.length} quotes, ${PLENARY.length} plenaries, ${lessons} student lessons`);

/* ============================================================
   12 · תקציב וכביסה
   ⚠ **ריק אינו אפס.** `diners` ריק = «לא נספר» ונשאר התעריף;
     0 = «אף אחד לא אכל» ומאפס את היום.
   ============================================================ */
const DAY_TYPE = { regular: "שגרה", series: "סדרה", trip: "טיול", home: "סופ״ש בית" };
let budget = 0;
for (const d of days.filter((x) => x.date <= today && x.date >= at(-30))) {
  if (await db.find("budgetDay", { date: d.date })) continue;
  await db.create("budgetDay", {
    date: d.date,
    dayType: DAY_TYPE[d.kind] || null,
    dayType2: chance(0.08) ? "עשייה קהילתית" : null,
    manualCost: null,
    diners: d.kind === "home" ? 0 : chance(0.3) ? 30 + Math.floor(rnd() * 8) : null,
  });
  budget++;
}

let wash = 0;
for (let i = 0; i < 12; i++) {
  const p = students[i * 3 % students.length];
  const date = at(Math.floor(rnd() * 6));
  const startAt = ["16:00", "17:00", "18:00", "19:00", "20:00"][i % 5];
  if (await db.find("laundrySlot", { person: p.id, date, startAt })) continue;
  await db.create("laundrySlot", { person: p.id, date, startAt, minutes: 60 });
  wash++;
}
say("misc", `${budget} budget days, ${wash} laundry slots`);

/* ============================================================
   13 · נהלים
   ============================================================ */
const RULES = `נהלי מכינת ניר עוז

1. היום מתחיל ב-7:00 בתדריך בוקר. מי שמאחר מודיע למוביל השבוע מראש.
2. יציאה באמצע השבוע מוגשת כבקשה, ולא בהודעה בוואטסאפ.
3. שלושה ימי חופש למחצית. מחלה והיעדרות מוצדקת אינן נגרעות מהם.
4. תורנות שמתחלפת — מודיעים לאב הבית, לא רק לחבר.
5. הטלפונים בכיס בזמן שיעור. לא על השולחן.
6. מה שלוקחים מהמכולה — מחזירים לאותו מקום, באותו יום.
7. אלרגיות ורגישויות מדווחות לאחראי המטבח בתחילת השנה ובכל שינוי.
8. מי שמרגיש לא טוב פונה לחובש, גם אם זה נראה קטן.
9. מה שנאמר במליאה בחדר — נשאר בחדר.`;

if (!await db.find("textBlock", { key: "rules.main" })) {
  await db.create("textBlock", {
    key: "rules.main", body: RULES,
    updatedBy: head.id, updatedAt: stamp(at(-40), "10:00"),
  });
}

/* ============================================================
   סיכום
   ============================================================ */
console.log("");
console.log(`  http://localhost:5180/m/${slug}/`);
console.log("");
console.log("  Sign in with:");
console.log("    danny   / mechina2026   head of the mechina");
console.log("    michal  / mechina2026   deputy - a role that exists in no catalog");
console.log("    noam    / mechina2026   group guide");
console.log("    yoav    / mechina2026   staff + treasurer");
console.log("    alon    / mechina2026   VIEW ONLY - every write is refused");
console.log("    chanich / mechina2026   a student");
console.log("    bdika   / mechina2026   test account - signs in, counted nowhere");
console.log("");
console.log("  No monday, no external service. Every row above lives in this product.");
console.log("");

/* ---------- עזר ---------- */
function say(what, detail) {
  console.log(`  [ok] ${what.padEnd(11)} ${detail}`);
}

/** דגימה יציבה — אותה זריעה נותנת את אותה מכינה */
function sample(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
  }
  return out;
}
