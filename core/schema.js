/* ============================================================
   מסמך הסכימה — מה קיים במערכת, ומה יש לכל דבר
   ------------------------------------------------------------
   זהו המסמך החשוב ביותר במאגר. הכול נגזר ממנו: מסד הנתונים,
   הוולידציה, הזריעה, הייבוא, וגם מה שהאשף מרשה לאפיין.

   ⚠⚠ **הגדרה ולא קוד.** אין כאן לוגיקה, רק תיאור. מי שיכתוב
     כאן `if` — טעה בקובץ. הסיבה: מסמך שאפשר לקרוא מכל כיוון
     (לייצר ממנו טבלאות, טופס, בדיקה, ותיעוד) חייב להישאר
     נתון.

   ⚠⚠ **המפתחות באנגלית, התוויות בעברית, ולעולם לא להפך.**
     `role.kitchen` נשמר בשורות; «אחראי מטבח» מוצג. במערכת
     הקודמת השם העברי שימש כמפתח ראשי, וזו בדיוק הנקודה
     שנשברת אצל הלקוח השני — מכינה שתקרא לזה «רכז מזון»
     מפצלת את כל ההיסטוריה שלה בלי שום שגיאה.

   ⚠ **ישות שייכת למודול.** `module: "kitchen"` פירושו שהיא
     לא קיימת כלל במכינה שכיבתה את המודול — לא טבלה ריקה,
     לא מסך מוסתר. ישות בלי `module` היא ליבה ותמיד קיימת.
   ============================================================ */

/* ------------------------------------------------------------
   טיפוסי השדות
   ⚠ רשימה סגורה בכוונה. טיפוס חדש דורש מימוש בשלושה מקומות
     (ולידציה, מנוע האחסון, וטופס העריכה), ולכן הוספה שלו היא
     החלטה ולא שורה.
   ------------------------------------------------------------ */
export const TYPES = {
  id: "מזהה",
  text: "טקסט קצר",
  longtext: "טקסט ארוך",
  int: "מספר שלם",
  decimal: "מספר עשרוני",
  bool: "כן/לא",
  date: "תאריך",
  time: "שעה",
  datetime: "תאריך ושעה",
  enum: "בחירה מרשימה",
  ref: "הפניה לישות אחת",
  refs: "הפניה לכמה ישויות",
  json: "מבנה חופשי",
};

/* ------------------------------------------------------------
   רשימות ערכים — ה«תוויות» של המערכת
   ⚠ כל ערך הוא slug. התצוגה שלו מגיעה מאוצר המילים שבפרופיל,
     ולכן מכינה יכולה לקרוא ל-`absence.sick` «מחלה» או «יום
     בריאות» בלי שאף שורה בהיסטוריה תזוז.
   ------------------------------------------------------------ */
export const ENUMS = {
  personKind: ["student", "staff"],
  gender: ["male", "female", "other"],

  dayKind: ["regular", "series", "trip", "home", "holiday", "closed", "noroutine"],

  /* ⚠ **`unmarked` הוא ערך ולא היעדר ערך.** «לא סומן» ו«נעדר»
     הם שני דברים, וההפרדה הזו היא אחד הלקחים היקרים של
     המערכת הקודמת: יום שאיש לא סימן נראה בדיוק כמו יום שכולם
     נעדרו בו. */
  attendance: ["present", "absent", "half", "unmarked"],

  absenceType: ["vacation", "sick", "justified"],
  absenceSource: ["request", "manual"],

  requestStatus: ["pending", "approved", "rejected"],
  /* ⚠ השלב **נגזר** מהנתונים ואינו נשמר. הוא מופיע כאן כי
     ה-API מחזיר אותו, לא כי יש לו עמודה. */
  requestStage: ["guide", "head", "done"],

  /* ⚠ שלושה מצבים ולא שניים: `null` פירושו «טרם דווח», וזו
     כל הסיבה שמסך «מה עוד לא דווח» קיים. */
  happened: ["yes", "no"],
  planned: ["yes", "no"],

  teamCategory: ["branch", "series", "committee", "group", "adhoc"],
  teamPeriod: ["yearly", "per_term", "first_only", "second_only"],
};

/* ------------------------------------------------------------
   קיצורי כתיבה
   ------------------------------------------------------------ */
const f = (type, opts = {}) => ({ type, ...opts });
const id = () => f("id");
const req = (type, opts = {}) => f(type, { required: true, ...opts });

/* ============================================================
   הישויות
   ============================================================ */
export const ENTITIES = {

  /* ---------- אנשים וזהות ---------- */

  person: {
    title: "אדם",
    /* ⚠⚠ **חניכים וצוות באותה ישות.** במערכת הקודמת הם ישבו
       בשני לוחות נפרדים, ולכן כל שאלה שנוגעת ב«מי» נכתבה
       פעמיים — כולל הכניסה, שדרשה קובץ שלם רק כדי לאחד
       אותם. `kind` מבדיל, והשאר משותף. */
    fields: {
      id: id(),
      kind: req("enum", { enum: "personKind" }),
      name: req("text"),
      nationalId: f("text", { private: true, note: "ת.ז — סוד הכניסה הראשונה" }),
      gender: f("enum", { enum: "gender" }),
      birthDate: f("date"),
      phone: f("text"),
      email: f("text", { note: "אישי, ואינו כתובת הכניסה" }),
      city: f("text"),
      shirtSize: f("text"),
      /* ⚠ מובלט במסך ואינו שורה ברשימה — זה הנתון היחיד כאן
         שיש לו משמעות מיידית למי שמבשל. */
      allergy: f("text"),
      active: f("bool", { default: true }),
      /* ⚠ **נפרד מ-`active`.** חשבון בדיקה צריך להיכנס ולא
         להיספר; כיבוי `active` מונע את שניהם. */
      excludeFromCounts: f("bool", { default: false }),
      joinedAt: f("date"),
      leftAt: f("date"),
    },
    /* ⚠⚠ **מה שבמכוון אינו כאן**: כתובת מלאה, שמות ההורים
       וטלפוניהם, קופת חולים, ובעיה רפואית. המערכת אינה קוראת
       אותם, אינה מחזירה אותם ואינה מציגה אותם. מי שירצה
       להוסיף שדה כאן — לשאול קודם למה הוא נחוץ. */
  },

  account: {
    title: "חשבון כניסה",
    /* ⚠ **נפרד מ-`person` בכוונה.** זהות היא מי האדם; חשבון
       הוא איך הוא נכנס. איחודם מוביל לכך ששינוי פרטים אישיים
       נוגע בסיסמה, ולכך ששורה בלי חשבון אינה יכולה להתקיים. */
    fields: {
      id: id(),
      person: req("ref", { to: "person" }),
      username: req("text", { unique: true }),
      /* ⚠ **גיבוב בלבד.** הסיסמה אינה נשמרת בשום מקום —
         גם לא מוצפנת, גם לא למנהל. */
      passwordHash: f("text", { private: true }),
      loginEmail: f("text", { unique: true }),
      resetCode: f("text", { private: true }),
      resetExpires: f("datetime", { private: true }),
      lastLogin: f("datetime"),
      /* ⚠ ריק = הרשאה מלאה. הקוטביות ההפוכה היא כל העניין:
         שדה שנוסף מאוחר ומשמעותו «צפייה בלבד» היה נועל את
         כל מי שנרשם לפניו. */
      viewOnly: f("bool", { default: false }),
    },
  },

  roleAssignment: {
    title: "תפקיד של אדם",
    /* ⚠ **שורה ולא עמודה.** אדם נושא כמה תפקידים, תפקיד עובר
       בין אנשים, ולתפקיד יש לפעמים היקף (יו״ר של איזו ועדה).
       עמודת «תפקידים» מופרדת בפסיקים לא יכולה לשאת היקף. */
    fields: {
      id: id(),
      person: req("ref", { to: "person" }),
      role: req("text", { note: "slug של תפקיד מתוך הפרופיל" }),
      scope: f("ref", { to: "team", note: "ליו״ר — איזו ועדה" }),
      from: f("date"),
      to: f("date"),
    },
  },

  /* ---------- מסגרות ---------- */

  team: {
    title: "מסגרת",
    /* ⚠ ישות אחת לחמש הקטגוריות — ענף, סדרה, ועדה, קבוצה
       וצוות מזדמן — כי כולן עונות על אותן שאלות. חמש ישויות
       היו מתפצלות בתיקון הראשון. */
    fields: {
      id: id(),
      name: req("text"),
      category: req("enum", { enum: "teamCategory" }),
      period: f("enum", { enum: "teamPeriod", default: "yearly" }),
      capacity: f("int"),
      description: f("longtext"),
      guide: f("ref", { to: "person", note: "המדריך המלווה — איש צוות" }),
      /* ⚠ **היו״ר אינו המדריך.** עמודה אחת לשניהם נגמרת ביום
         שמסגרת תרצה גם מדריך וגם יו״ר. */
      chair: f("ref", { to: "person", note: "יו״ר — חניך" }),
      archived: f("bool", { default: false }),
    },
  },

  membership: {
    title: "שיבוץ",
    fields: {
      id: id(),
      person: req("ref", { to: "person" }),
      team: req("ref", { to: "team" }),
      term: f("text", { note: "slug של תקופה מתוך הפרופיל" }),
    },
  },

  /* ---------- לוח שנה ונוכחות ---------- */

  calendarDay: {
    title: "יום בלוח השנה",
    fields: {
      id: id(),
      date: req("date", { unique: true }),
      kind: req("enum", { enum: "dayKind", default: "regular" }),
      note: f("text"),
    },
  },

  attendanceDay: {
    title: "יום סימון",
    fields: {
      id: id(),
      date: req("date", { unique: true }),
      markedBy: f("ref", { to: "person" }),
      markedAt: f("datetime"),
    },
  },

  attendanceMark: {
    title: "סימון נוכחות",
    /* ⚠⚠ **שורה לכל אדם ליום, ולא רשימת מזהים בתא אחד.**
       במערכת הקודמת רשימת הנוכחים הייתה טקסט מופרד בפסיקים,
       ולכן כל סימון **דרס** את כל היום — שני אנשים שסימנו
       במקביל מחקו זה את זה, ולא הייתה שום דרך לשאול «מתי
       פלוני סומן». */
    fields: {
      id: id(),
      day: req("ref", { to: "attendanceDay" }),
      person: req("ref", { to: "person" }),
      status: req("enum", { enum: "attendance", default: "unmarked" }),
      by: f("ref", { to: "person" }),
      at: f("datetime"),
    },
  },

  absence: {
    title: "היעדרות",
    fields: {
      id: id(),
      person: req("ref", { to: "person" }),
      date: req("date"),
      type: req("enum", { enum: "absenceType" }),
      source: req("enum", { enum: "absenceSource", default: "manual" }),
      detail: f("longtext"),
      /* ⚠ כמה היום עולה במכסה. ריק = 1 ולא 0 — כל שורה
         שנוצרה לפני שהשדה קיים נכתבה בעולם שבו יום = יום. */
      cost: f("decimal", { default: 1 }),
      request: f("ref", { to: "leaveRequest" }),
    },
  },

  leaveRequest: {
    title: "בקשת יציאה",
    fields: {
      id: id(),
      person: req("ref", { to: "person" }),
      type: req("enum", { enum: "absenceType" }),
      fromDate: req("date"),
      toDate: req("date"),
      /* ⚠ טקסט "HH:MM" ולא טיפוס שעה של המנוע: זו השאלה
         התפעולית האמיתית, וכל המרה בין פורמטים היא הזדמנות
         לשגות. ואין השוואה בין השתיים — יציאה ב-20:00 וחזרה
         ב-08:00 היא לינה בבית, לא טעות. */
      outAt: f("time"),
      backAt: f("time"),
      detail: f("longtext"),
      attachment: f("text"),
      status: req("enum", { enum: "requestStatus", default: "pending" }),
      /* ⚠ **המלצת המדריך נפרדת מההכרעה.** גם דחייה שלו עוברת
         הלאה — היא המלצה, לא הכרעה. */
      guideDecision: f("enum", { enum: "requestStatus" }),
      guideBy: f("ref", { to: "person" }),
      guideAt: f("datetime"),
      decidedBy: f("ref", { to: "person" }),
      decidedAt: f("datetime"),
      /* ⚠ הערר אינו משנה את הסטטוס. «נדחה» עם ערר פתוח הוא
         עדיין «נדחה», והחניך אינו יוצא. */
      appeal: f("longtext"),
      appealAt: f("datetime"),
      chargedDays: f("decimal"),
    },
  },

  /* ---------- לימודים ---------- */

  course: {
    title: "שיעור",
    fields: {
      id: id(),
      subject: req("text"),
      lecturer: f("text"),
      dayTime: f("text", { note: "טקסט חופשי — «שני 10:00»" }),
      active: f("bool", { default: true }),
      guestLecturer: f("bool", { default: false }),
      pricePerSession: f("decimal"),
      excludeFromPay: f("bool", { default: false }),
      lecturerPhone: f("text", { private: true }),
      lecturerEmail: f("text", { private: true }),
    },
  },

  session: {
    title: "מפגש",
    fields: {
      id: id(),
      course: req("ref", { to: "course" }),
      date: req("date"),
      /* ⚠⚠ **`planned` מכריע, והוא מפורש.** הצהרה על הפריט
         גוברת על גזירה מהקשר — זה הכלל שחוזר בכל המערכת. */
      planned: f("enum", { enum: "planned", default: "yes" }),
      plannedReason: f("text"),
      /* ⚠ `null` = טרם דווח. מצב שלישי אמיתי. */
      happened: f("enum", { enum: "happened" }),
      lecturer: f("text", { note: "מי הגיע בפועל, כשזה שונה" }),
      summary: f("longtext", { note: "יוצא לחניכים" }),
      /* ⚠ הערה תפעולית — **אינה יוצאת לחניכים**. עמודה אחת
         לשניהם הייתה מדליפה את הראשונה או מוחקת אותה. */
      note: f("longtext", { private: true }),
      openForRating: f("bool", { default: false }),
    },
  },

  rating: {
    title: "דירוג מפגש",
    fields: {
      id: id(),
      session: req("ref", { to: "session" }),
      person: req("ref", { to: "person" }),
      score: req("int", { min: 1, max: 10 }),
      comment: f("longtext"),
      at: f("datetime"),
    },
  },

  /* ---------- תוכן שהמכינה עורכת ---------- */

  textBlock: {
    title: "בלוק טקסט",
    /* ⚠ **המפתח הוא שם הבלוק ולא מזהה.** בלוק שנמחק בטעות חוזר
       לחיים ביצירת שורה חדשה עם אותו שם, בלי לתקן קוד. */
    fields: {
      id: id(),
      key: req("text", { unique: true }),
      body: f("longtext"),
      updatedBy: f("ref", { to: "person" }),
      updatedAt: f("datetime"),
    },
  },

  /* ============================================================
     ישויות של מודולים — קיימות רק אם המודול דלוק
     ⚠ מוצהרות כאן ולא במקום אחר, כי הסכימה חייבת להיות מסמך
       אחד. מודול כבוי פירושו שהטבלאות שלו כלל לא נוצרות.
     ============================================================ */

  equipmentItem: {
    title: "פריט ציוד",
    module: "inventory",
    fields: {
      id: id(),
      name: req("text"),
      area: req("text", { note: "slug של תחום מתוך הפרופיל" }),
      quantity: f("text", { note: "טקסט חופשי — «40 חבילות של 10»" }),
      par: f("decimal", { note: "המפתח — כמה צריך להיות" }),
      unitPrice: f("decimal"),
      consumable: f("bool", { default: true }),
    },
  },

  shoppingRow: {
    title: "שורת קנייה",
    module: "inventory",
    fields: {
      id: id(),
      name: req("text"),
      area: req("text"),
      quantity: f("text"),
      bought: f("bool", { default: false }),
      item: f("ref", { to: "equipmentItem" }),
      addedAt: f("datetime"),
    },
  },

  fault: {
    title: "תקלה",
    module: "faults",
    fields: {
      id: id(),
      title: req("text"),
      place: f("text"),
      detail: f("longtext"),
      urgent: f("bool", { default: false }),
      status: f("text", { default: "open" }),
      reportedBy: f("ref", { to: "person" }),
      reportedAt: f("datetime"),
      doneAt: f("date"),
      cost: f("decimal"),
    },
  },

  dutyShift: {
    title: "תורנות",
    module: "duties",
    fields: {
      id: id(),
      person: req("ref", { to: "person" }),
      sector: req("text"),
      date: f("date"),
      weekStart: f("date"),
    },
  },

  leadWeek: {
    title: "שבוע הובלה",
    module: "leadweek",
    fields: {
      id: id(),
      number: f("int"),
      startDate: req("date"),
      endDate: req("date"),
      theme: f("text"),
      leaders: f("refs", { to: "person" }),
      summary: f("longtext"),
      handover: f("longtext"),
    },
  },
};

/* ------------------------------------------------------------
   נגזרות — לשימוש הוולידציה, הזריעה והמנוע
   ------------------------------------------------------------ */

/** שמות כל הישויות */
export const entityNames = () => Object.keys(ENTITIES);

/** ישויות הליבה — אלה שקיימות תמיד */
export const coreEntities = () =>
  entityNames().filter((n) => !ENTITIES[n].module);

/** ישויות של מודול מסוים */
export const moduleEntities = (mod) =>
  entityNames().filter((n) => ENTITIES[n].module === mod);

/** כל המודולים שהסכימה מזכירה */
export const schemaModules = () =>
  [...new Set(entityNames().map((n) => ENTITIES[n].module).filter(Boolean))];

/** כל ההפניות: מאיזו ישות, איזה שדה, לאיזו ישות */
export function references() {
  const out = [];
  for (const [name, ent] of Object.entries(ENTITIES)) {
    for (const [field, def] of Object.entries(ent.fields)) {
      if (def.type === "ref" || def.type === "refs") {
        out.push({ from: name, field, to: def.to, many: def.type === "refs" });
      }
    }
  }
  return out;
}
