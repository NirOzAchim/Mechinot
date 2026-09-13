/* ============================================================
   תבנית: מכינה קדם-צבאית
   ------------------------------------------------------------
   ⚠⚠ **זה המוצר.** מכינה חדשה מקבלת את כל מה שכתוב כאן ביום
     הראשון, והאשף רק משנה את מה ששלה. כל ערך כאן נבחר מפני
     שהוא עבד במכינה אמיתית במשך שנה — לא מפני שהוא נשמע סביר.

   ⚠ **תבנית שנייה (ישיבה, שנת שירות, פנימייה) היא קובץ נוסף
     כאן**, לא דגל בתוך הקובץ הזה. תבנית עם `if` בפנים מפסיקה
     להיות תבנית.
   ============================================================ */

export const preset = "premil";

export const PREMIL = {
  preset,
  title: "מכינה קדם-צבאית",

  identity: {
    name: "",                 // ⚠ נשאר ריק בכוונה — זה שלב 1 באשף
    shortName: "",
    tagline: "מערכת הניהול",
    /* הפלטה שהוכיחה את עצמה: קרם, נייבי, חימר. משטח מוגדר
       בצל ולא במסגרת. */
    colors: {
      bg: "#F5F1E8",
      surface: "#FFFFFF",
      ink: "#1F2733",
      accent: "#002454",
      warm: "#906048",
    },
    logo: null,
  },

  /* ---------- אוצר מילים ---------- */
  vocab: {
    "person.student": { one: "חניך", many: "חניכים" },
    "person.staff": { one: "איש צוות", many: "אנשי צוות" },
    "person.guide": { one: "מדריך", many: "מדריכים" },
    "person.head": { one: "ראש המכינה", many: "ראשי המכינה" },

    "team.branch": { one: "ענף", many: "ענפים" },
    "team.series": { one: "סדרה", many: "סדרות" },
    "team.committee": { one: "ועדה", many: "ועדות" },
    "team.group": { one: "קבוצה", many: "קבוצות" },
    "team.adhoc": { one: "צוות מזדמן", many: "צוותים מזדמנים" },

    "term.first": { one: "סמסטר א׳", many: "סמסטר א׳" },
    "term.second": { one: "סמסטר ב׳", many: "סמסטר ב׳" },
    "term.yearly": { one: "שנתי", many: "שנתי" },

    "absence.vacation": { one: "יום חופש", many: "ימי חופש" },
    "absence.sick": { one: "מחלה", many: "ימי מחלה" },
    "absence.justified": { one: "היעדרות מוצדקת", many: "היעדרויות מוצדקות" },

    "day.regular": { one: "יום רגיל", many: "ימים רגילים" },
    "day.series": { one: "סדרה", many: "סדרות" },
    "day.trip": { one: "טיול", many: "טיולים" },
    "day.home": { one: "סופ״ש בית", many: "סופי שבוע בבית" },
    "day.holiday": { one: "חופשה", many: "חופשות" },
    "day.closed": { one: "יום סגור", many: "ימים סגורים" },
    "day.noroutine": { one: "לא התקיימה שגרה", many: "ימים ללא שגרה" },

    "unit.week": { one: "שבוע", many: "שבועות" },
    "unit.day": { one: "יום", many: "ימים" },
    "unit.session": { one: "מפגש", many: "מפגשים" },
  },

  /* ---------- תפקידים ----------
     ⚠ `screens` הוא מה שהתפקיד **פותח**, והוא מזין גם את
       הניווט וגם את מסך ההרשאות. שתי רשימות מקבילות מתפצלות
       בתיקון הראשון — זה קרה במערכת הקודמת בדיוק כך.
     ⚠ `staffOnly` מבדיל בין תפקיד שחניך נושא לבין כניסת צוות. */
  roles: [
    { slug: "head", label: "ראש המכינה", staffOnly: true, admin: true,
      screens: ["*"] },
    { slug: "guide", label: "מדריך", staffOnly: true,
      screens: ["home", "people", "attendance", "requests", "lessons", "mygroup"] },
    { slug: "staff", label: "איש צוות", staffOnly: true,
      screens: ["home", "people", "attendance", "requests", "lessons"] },

    { slug: "scheduler", label: "אחראי לו״ז",
      screens: ["home", "lessons", "courses"] },
    { slug: "kitchen", label: "אחראי מטבח",
      screens: ["home", "inventory", "shopping"] },
    { slug: "storage", label: "אחראי מכולה",
      screens: ["home", "inventory", "shopping"] },
    { slug: "house", label: "אב בית",
      screens: ["home", "faults", "duties"] },
    { slug: "safety", label: "אחראי בטיחות",
      screens: ["home", "faults"] },
    { slug: "weeklead", label: "מוביל שבוע",
      screens: ["home", "attendance", "leadweek"] },
  ],

  /* ---------- מודולים ---------- */
  modules: {
    attendance: true,
    requests: true,
    lessons: true,
    teams: true,
    inventory: true,
    faults: true,
    duties: true,
    leadweek: true,
    ratings: true,
    board: false,
  },

  /* ---------- השנה ---------- */
  year: {
    start: null,
    end: null,
    terms: [
      { slug: "first", from: null, to: null },
      { slug: "second", from: null, to: null },
    ],
    /* ⚠ שלושה ימים למחצית — המספר של המכינה שהמערכת נבנתה
       בה. מכינה אחרת תשנה, וזה בדיוק מה שהאשף נועד לו. */
    vacationQuota: 3,
    /* ⚠ **סף להצגת אחוז נוכחות.** בתחילת שנה, כשסומן יום אחד,
       «0% נוכחות» הוא מספר נכון חשבונית ושקרי במשמעותו — והוא
       הדבר הראשון שהחניך רואה על עצמו. הסף נספר בימים שסומנו
       ולא בסכום ימי-אדם. */
    minMarkedDays: 5,
  },

  /* ---------- תחומי מלאי ----------
     ⚠ slug + label, כמו כל השאר. מכינה בלי מכולה תמחק שורה. */
  inventoryAreas: [
    { slug: "food", label: "אוכל" },
    { slug: "disposable", label: "חד״פ" },
    { slug: "storage", label: "מכולה" },
    { slug: "cleaning", label: "ניקיון" },
  ],

  /* ---------- נוסחי ברירת מחדל ----------
     ⚠ המכינה עורכת אותם, והעריכה **דורסת ואינה מוחקת** —
       «החזרת הנוסח המקורי» חייבת להישאר אפשרית. */
  texts: {
    "home.welcome": "",
    "rules.main": "",
    "requests.intro": "בקשת יציאה מוגשת למדריך הקבוצה, וראש המכינה מכריע.",
  },
};

export default PREMIL;
