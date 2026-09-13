/* ============================================================
   קטלוג המודולים והמסכים — מה אפשר שיהיה במכינה
   ------------------------------------------------------------
   ⚠⚠⚠ **זה הקובץ שהופך אפליקציה למוצר.** האשף מציג אותו,
     הניווט נבנה ממנו, ההרשאות נגזרות ממנו, ובדיקת התקינות
     רצה עליו. מודול חדש = ערך כאן, ולא נגיעה בשמונה קבצים.

   ------------------------------------------------------------
   מאיפה הרשימה הזו
   ------------------------------------------------------------
   מסקר של האפליקציה שרצה בייצור במכינת ניר עוז: 42 מסכים
   ב-13 קבוצות ניווט, ומפת `DUTIES` שקושרת תפקיד למסכים.
   **לא הומצא כאן כלום** — כל מודול כאן הוא משהו שמכינה
   אמיתית השתמשה בו במשך שנה.

   ⚠ מה שכן שונה: שם עברי אינו מפתח. `kitchen` הוא המפתח,
     «מטבח» היא התווית, ומכינה שתקרא לזה «מזון» משנה תווית.

   ------------------------------------------------------------
   השדות
   ------------------------------------------------------------
   core       מודול ליבה — אינו ניתן לכיבוי. בלעדיו אין מוצר.
   needs      מודולים שהוא נשען עליהם. כיבוי של אלה מכבה אותו.
   entities   ישויות מהסכימה שקיימות רק אם הוא דלוק.
   roles      תפקידים שהמודול מציע כשמדליקים אותו.
   screens    המסכים שהוא מוסיף. `staff` — צוות בלבד.
   why        מה זה **נותן**, במשפט. זה מה שמנהל מכינה קורא
              באשף, ולכן זו אינה כותרת טכנית אלא הבטחה.
   ============================================================ */

export const MODULE_CATALOG = {

  /* ============ ליבה ============ */
  people: {
    title: "אנשים ותפקידים",
    core: true,
    why: "מצבת החניכים והצוות, ומי נושא איזה תפקיד.",
    entities: ["person", "account", "roleAssignment"],
    screens: [
      { key: "home", title: "מסך הבית" },
      { key: "me", title: "הפרופיל שלי" },
      { key: "people", title: "אנשים", staff: true },
      { key: "roles", title: "בעלי תפקידים", staff: true },
      { key: "settings", title: "הגדרות המכינה", staff: true, admin: true },
    ],
  },

  attendance: {
    title: "נוכחות",
    core: true,
    why: "מי היה ומי לא, ואחוז נוכחות שמחושב מזה.",
    entities: ["calendarDay", "attendanceDay", "attendanceMark", "absence"],
    roles: ["weeklead"],
    screens: [
      { key: "attendance", title: "סימון יומי" },
      { key: "attendance-year", title: "לוח נוכחות שנתי", staff: true },
    ],
  },

  /* ============ ניתנים לכיבוי ============ */
  requests: {
    title: "בקשות יציאה",
    why: "חניך מבקש לצאת, המדריך ממליץ, וראש המכינה מכריע — והמכסה נגזרת מזה.",
    needs: ["attendance"],
    entities: ["leaveRequest"],
    screens: [
      { key: "requests", title: "בקשות יציאה" },
    ],
  },

  lessons: {
    title: "לו״ז ושיעורים",
    why: "מי מלמד מה ומתי, ומה כבר התקיים.",
    entities: ["course", "session"],
    roles: ["scheduler"],
    screens: [
      { key: "agenda", title: "הלו״ז שלי" },
      { key: "lessons", title: "שיעורים קרובים" },
      { key: "courses", title: "גיליונות המרצים", staff: true },
      { key: "archive", title: "השיעורים שהיו" },
      { key: "gantt", title: "גאנט שנתי", staff: true },
    ],
  },

  ratings: {
    title: "דירוג מרצים",
    why: "החניכים מדרגים, והמכינה יודעת את מי להזמין שוב.",
    needs: ["lessons"],
    entities: ["rating"],
    screens: [
      { key: "rate", title: "דירוג שיעורים" },
      { key: "evals", title: "חוות דעת על מרצים", staff: true },
      { key: "lecturers", title: "מאגר מרצים", staff: true },
      { key: "pay", title: "תשלום למרצים", staff: true, admin: true },
    ],
  },

  teams: {
    title: "מסגרות ושיבוצים",
    why: "ענפים, ועדות, סדרות וקבוצות — ומי משובץ לאן.",
    entities: ["team", "membership"],
    screens: [
      { key: "myteams", title: "המסגרות שלי" },
      { key: "placements", title: "שיבוצי חניכים", staff: true },
      { key: "teams", title: "ניהול צוותים", staff: true },
      { key: "mygroup", title: "הקבוצה שלי", staff: true },
    ],
  },

  inventory: {
    title: "מלאי וציוד",
    why: "כמה יש מכל דבר, כמה צריך להיות, ומה חסר.",
    entities: ["equipmentItem", "shoppingRow"],
    roles: ["kitchen", "storage"],
    screens: [
      { key: "inventory", title: "ציוד ומלאי" },
      { key: "shopping", title: "רשימת קניות" },
      { key: "par", title: "מפתח המלאי", staff: true },
    ],
  },

  menu: {
    title: "תפריט ומנות",
    why: "מה אוכלים בכל ארוחה, וכמה מצרכים צריך לזה.",
    needs: ["inventory"],
    entities: ["dish", "dishItem", "menuSlot"],
    screens: [
      { key: "menu", title: "תפריט הארוחות" },
      { key: "dishes", title: "מנות ומצרכים", staff: true },
    ],
  },

  budget: {
    title: "תקציב המטבח",
    why: "כמה עולה יום, כמה נקנה החודש, וכמה נשאר.",
    needs: ["inventory"],
    entities: ["budgetDay", "purchase"],
    screens: [
      { key: "budget", title: "תקציב המטבח", staff: true },
    ],
  },

  chores: {
    title: "תורנויות",
    why: "מי תורן מתי, צ׳ק ליסט לתורן, וטבלת הוגנות שמראה מי מאחור.",
    entities: ["dutyShift", "choreTask", "choreTick", "choreAdjust"],
    roles: ["house"],
    screens: [
      { key: "chores", title: "תורנויות" },
      { key: "chores-admin", title: "שיבוץ תורנויות", staff: true },
    ],
  },

  faults: {
    title: "תקלות ובעיות",
    why: "כל חניך מדווח, ואב הבית רואה רשימה אחת במקום עשרים הודעות.",
    entities: ["fault"],
    roles: ["house"],
    screens: [
      { key: "faults", title: "תקלות ובעיות" },
      { key: "faults-admin", title: "טיפול בתקלות", staff: true },
    ],
  },

  safety: {
    title: "בטיחות ואירוח",
    why: "דיווח אירועי בטיחות, ומעקב אחרי קבוצות שמתארחות.",
    entities: ["safetyEvent", "hosting"],
    roles: ["safety"],
    screens: [
      { key: "safety", title: "אירועי בטיחות", staff: true },
      { key: "hosting", title: "אירוח קבוצות", staff: true },
    ],
  },

  leadweek: {
    title: "שבוע הובלה",
    why: "מי מוביל כל שבוע, מה התוכנית, ומה נמסר למובילים הבאים.",
    entities: ["leadWeek", "leadTask", "leadTick"],
    roles: ["weeklead"],
    screens: [
      { key: "leadweek", title: "שבוע ההובלה" },
      { key: "leadweeks", title: "מובילי שבוע", staff: true },
    ],
  },

  laundry: {
    title: "חדר כביסה",
    why: "תור לחדר הכביסה, בלי רשימה על הדלת.",
    entities: ["laundrySlot"],
    screens: [
      { key: "laundry", title: "חדר כביסה" },
    ],
  },

  board: {
    title: "לוח מודעות",
    why: "הודעות, אבידות ומציאות, והציטוט היומי.",
    entities: ["notice", "quote"],
    screens: [
      { key: "board", title: "לוח מודעות" },
      { key: "quotes", title: "הציטוט היומי" },
    ],
  },

  army: {
    title: "צבא ובוגרים",
    why: "מיונים, שיבוץ לחיל, ולאן התגייסו הבוגרים.",
    entities: ["tryout", "alumnus", "recruitLead"],
    screens: [
      { key: "tryouts", title: "מיונים ושיבוצים" },
      { key: "alumni", title: "בוגרי המכינה", staff: true },
      { key: "recruit", title: "פניות גיוס", staff: true },
    ],
  },

  projects: {
    title: "פרויקטים אישיים",
    why: "חניך מנהל פרויקט משלו — משימות ותקציב.",
    entities: ["project", "projectTask"],
    /* ⚠⚠ **הפרטיות היא התכונה.** פרויקט הוא המקום שבו חניך
       מנסה: מתכנן תקציב שאולי לא יסתדר, ומשנה מטרה באמצע.
       ברגע שהוא יודע שמישהו קורא — הוא כותב אחרת. אין כאן
       מסך צוות, ולא בטעות. */
    private: true,
    screens: [
      { key: "projects", title: "הפרויקטים שלי" },
    ],
  },

  content: {
    title: "מליאות ותוכן",
    why: "מליאות, פתקים אנונימיים, ושיעורים שהחניכים עצמם מעבירים.",
    entities: ["plenary", "plenaryNote", "studentLesson"],
    screens: [
      { key: "plenary", title: "מליאות" },
      { key: "stu-lessons", title: "שיעורי חניך" },
    ],
  },

  reports: {
    title: "מגמות ודוחות",
    why: "איך המכינה נראית לאורך זמן, וייצוא לגיליון.",
    /* ⚠⚠ **אין ולא יהיה כאן מספר על חניך מסוים.** ברגע שמסך
       מגמות מציג «מי הכי נעדר» הוא הופך מכלי ניהול לכלי מעקב,
       וכל חניך שיודע שהוא קיים מתנהג אחרת. ההצהרה נשלחת עם
       הנתונים ומוצגת בראש המסך — לא רק כתובה כאן. */
    screens: [
      { key: "trends", title: "מגמות", staff: true },
      { key: "export", title: "ייצוא לגיליון", staff: true },
    ],
  },

  texts: {
    title: "נהלים וטקסטים",
    why: "נהלי המכינה ותיאורי התפקידים — נערכים מהמסך, בלי מפתח.",
    entities: ["textBlock"],
    screens: [
      { key: "rules", title: "נהלים במכינה" },
      { key: "texts", title: "ניהול תוכן", staff: true, admin: true },
    ],
  },
};

/* ============================================================
   קטלוג התפקידים
   ⚠ מה שמודול מציע כשמדליקים אותו. המכינה עורכת שם ומסכים,
     והמפתח נשאר.
   ============================================================ */
export const ROLE_CATALOG = {
  /* ============================================================
     ⚠⚠⚠ תפקיד הבסיס — מה שכל אדם במכינה רואה
     ------------------------------------------------------------
     **`base: true` פירושו שהוא נישא על ידי כולם ואינו מוענק.**
     בלעדיו חניך שאין לו תפקיד רואה **כלום**: לא בקשות יציאה,
     לא את הלו״ז שלו ולא את הפרופיל שלו — ובלי שום שגיאה, כי
     «אין מסכים» אינו כישלון. זה נתפס כאן ברגע שנוסף המסך
     הראשון שחניך אמור להשתמש בו.

     ⚠ **והוא תפקיד ולא רשימה בקוד**, בדיוק כדי שהמכינה תוכל
       לערוך אותו באשף: «מה כל חניך רואה» היא החלטה של המכינה,
       לא של המערכת. תפקיד שמעניקים מוסיף על הבסיס ואינו
       מחליף אותו.

     ⚠ המסכים כאן מסוננים ממילא למודולים הדלוקים
       (`roleScreens`), ולכן מכינה שכיבתה מודול אינה רואה
       אותו — לא מוסתר, פשוט לא קיים.
     ============================================================ */
  member: {
    label: "כל אדם במכינה", base: true,
    why: "מה שכל חניך רואה בלי שהעניקו לו שום תפקיד.",
    screens: [
      "home", "me", "requests", "agenda", "rate", "myteams",
      "chores", "faults", "laundry", "board", "quotes",
      "tryouts", "projects", "rules", "leadweek", "plenary", "stu-lessons",
    ],
  },

  head: { label: "ראש המכינה", staffOnly: true, admin: true, all: true,
    why: "רואה הכול ומכריע בכל דבר." },
  guide: { label: "מדריך", staffOnly: true,
    why: "מלווה קבוצה, ממליץ על בקשות יציאה.",
    screens: ["home", "me", "people", "attendance", "requests", "lessons", "mygroup", "myteams"] },
  staff: { label: "איש צוות", staffOnly: true,
    why: "רואה את המכינה, בלי הכרעות.",
    screens: ["home", "me", "people", "attendance", "requests", "lessons"] },
  viewer: { label: "צפייה בלבד", staffOnly: true, viewOnly: true,
    why: "רואה הכול ואינו משנה דבר. למנכ״ל או לרואה חשבון.",
    screens: ["home", "me", "people", "attendance", "lessons", "trends"] },

  scheduler: { label: "אחראי לו״ז", module: "lessons",
    why: "מנהל את גיליונות המרצים ומדווח מה התקיים.",
    screens: ["home", "me", "lessons", "courses", "archive", "gantt", "evals", "pay"] },
  kitchen: { label: "אחראי מטבח", module: "inventory",
    why: "המלאי, הקניות והתפריט.",
    screens: ["home", "me", "inventory", "shopping", "par", "menu", "budget", "chores"] },
  storage: { label: "אחראי מכולה", module: "inventory",
    why: "ציוד המכולה והשאלות.",
    screens: ["home", "me", "inventory", "shopping", "par"] },
  house: { label: "אב בית", module: "faults",
    why: "תקלות, ניקיון ותורנויות.",
    screens: ["home", "me", "faults", "faults-admin", "chores", "chores-admin", "shopping"] },
  safety: { label: "אחראי בטיחות", module: "safety",
    why: "אירועי בטיחות ואירוח קבוצות.",
    screens: ["home", "me", "safety", "hosting"] },
  weeklead: { label: "מוביל שבוע", module: "leadweek",
    why: "מוביל את השבוע — סימון נוכחות ולו״ז.",
    screens: ["home", "me", "leadweek", "attendance", "lessons"] },
  chair: { label: "יו״ר ועדה", module: "teams",
    why: "מנהל את המשימות של הוועדה שלו.",
    screens: ["home", "me", "myteams", "teams"] },
};

/* ============================================================
   נגזרות
   ============================================================ */

export const allModules = () => Object.keys(MODULE_CATALOG);

export const coreModules = () =>
  allModules().filter((m) => MODULE_CATALOG[m].core);

/**
 * אילו מודולים באמת דלוקים.
 * ⚠ **מודול שתלוי במודול כבוי — כבוי בעצמו.** בלי זה מסך
 *   «דירוג מרצים» מופיע במכינה בלי שיעורים, נפתח, וקורס על
 *   ישות שאינה קיימת.
 */
export function activeModules(modules = {}) {
  const on = new Set(allModules().filter((m) =>
    MODULE_CATALOG[m].core || modules[m]));
  /* מתכנס: כיבוי משרשר עד שאין שינוי */
  let changed = true;
  while (changed) {
    changed = false;
    for (const m of [...on]) {
      for (const need of MODULE_CATALOG[m].needs || []) {
        if (!on.has(need)) { on.delete(m); changed = true; break; }
      }
    }
  }
  return [...on];
}

/** כל המסכים שקיימים במכינה הזו */
export function activeScreens(modules = {}) {
  const out = [];
  for (const m of activeModules(modules)) {
    for (const s of MODULE_CATALOG[m].screens || []) out.push({ ...s, module: m });
  }
  return out;
}

/** מפה: מפתח מסך → ההגדרה שלו */
export function screenMap(modules = {}) {
  return Object.fromEntries(activeScreens(modules).map((s) => [s.key, s]));
}

/** אילו ישויות קיימות במכינה הזו */
export function activeEntities(modules = {}) {
  const out = new Set();
  for (const m of activeModules(modules)) {
    for (const e of MODULE_CATALOG[m].entities || []) out.add(e);
  }
  return [...out];
}

/**
 * התפקידים שמוצעים לפי המודולים הדלוקים.
 * ⚠ תפקיד של מודול כבוי אינו מוצע — «אחראי מטבח» במכינה בלי
 *   מלאי הוא תפקיד שאין לו אף מסך.
 */
export function suggestedRoles(modules = {}) {
  const on = new Set(activeModules(modules));
  return Object.entries(ROLE_CATALOG)
    .filter(([, r]) => !r.module || on.has(r.module))
    .map(([slug, r]) => ({ slug, ...r }));
}

/**
 * מסכי תפקיד, **מסוננים למה שקיים**.
 * ⚠ תפקיד שמפנה למסך של מודול כבוי מקבל כאן רשימה מקוצרת,
 *   ולא 404 אחרי הלחיצה.
 */
export function roleScreens(role, modules = {}) {
  if (role.all || (role.screens || []).includes("*")) return ["*"];
  const exists = new Set(activeScreens(modules).map((s) => s.key));
  return (role.screens || []).filter((s) => exists.has(s));
}
