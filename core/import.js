/* ============================================================
   ייבוא בהדבקה — מגיליון, מוואטסאפ, או ממסמך
   ------------------------------------------------------------
   ⚠⚠ **הקלט הוא הדבקה ולא קובץ.** מנהל מכינה מחזיק את הנתונים
     בגיליון, בוואטסאפ או במסמך, וההדבקה עובדת מכולם. העלאת
     קובץ דורשת לשמור, למצוא ולבחור — שלושה שלבים שבכל אחד
     אפשר להיתקע, ואחד מהם דורש שהקובץ בכלל יהיה קובץ.

   ⚠⚠ **הפרסור משותף למסך ולשרת.** שתי גרסאות היו נפרדות זו
     מזו בתיקון הראשון, ואז המנהל מאשר בתצוגה המקדימה דבר
     אחד ומקבל אחר.

   ⚠⚠ **תמיד תצוגה מקדימה לפני כתיבה.** פרסור שגוי שנכתב ישר
     הוא 33 שורות למחוק ביד.

   ⚠⚠ **שורה שלא נקלטה מוצגת עם הסיבה ועם מספר השורה.** שורה
     שנעלמת בשקט היא חניך שלא קיים, ואיש לא יידע עד ספטמבר.
   ============================================================ */

/* ⚠ מפריד: טאב, פסיק, נקודה-פסיק, או **שני רווחים ומעלה**.
   רווח יחיד אינו מפריד — «אורי בן חיים» הוא שם אחד. */
const SPLIT = /\t|;|,|\s{2,}/;

const clean = (s) => String(s ?? "").replace(/‏|‎/g, "").trim();

/** שורות לא ריקות, עם מספר השורה המקורי */
function lines(text) {
  return String(text || "").split(/\r?\n/)
    .map((raw, i) => ({ n: i + 1, raw }))
    .filter((l) => clean(l.raw).length > 0);
}

const cells = (raw) => raw.split(SPLIT).map(clean).filter((c) => c.length > 0);

/* ⚠ ת.ז ישראלית: 5–9 ספרות. **אין בדיקת ספרת ביקורת** —
   מכינה שתדביק מספר שגוי בספרה אחת תקבל שגיאה על נתון אמיתי,
   וזה מרגיז יותר ממה שהוא מונע. */
const ID_RE = /^\d{5,9}$/;
/* ⚠ **שם חייב להכיל אות.** בלי זה «???» או «---» נקלטו כשם,
   כי הם ארוכים משני תווים ואינם מספר. זה נתפס בצילום מסך של
   התצוגה המקדימה ולא בבדיקה — שורת זבל נראית בדיוק כמו שורה
   תקינה עד שקוראים אותה. */
const HAS_LETTER = /[\u0590-\u05FF a-zA-Z]/;
const isName = (x) => x.length > 1 && HAS_LETTER.test(x);
const PHONE_RE = /^0\d{1,2}-?\d{7}$|^\d{9,10}$/;
const DATE_ANY = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** «14/09/2026» · «14.9.26» · «2026-09-14» → «2026-09-14» */
export function toISO(raw) {
  const s = clean(raw);
  if (!s) return null;
  if (ISO.test(s)) return s;
  const m = s.match(DATE_ANY);
  if (!m) return null;
  let [, d, mo, y] = m;
  if (y.length === 2) y = "20" + y;
  const pad = (x) => String(x).padStart(2, "0");
  const iso = `${y}-${pad(mo)}-${pad(d)}`;
  /* ⚠ נבדק שהוא באמת תאריך: «31/02» עובר את הביטוי ואינו קיים. */
  const dt = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(dt.getTime()) || dt.getUTCDate() !== Number(d)) return null;
  return iso;
}

/** «052-5551234» · «0525551234» → «052-555-1234» */
export function toPhone(raw) {
  const d = clean(raw).replace(/\D/g, "");
  if (!d) return null;
  const n = d.startsWith("972") ? "0" + d.slice(3) : d;
  if (n.length === 10) return `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6)}`;
  if (n.length === 9) return `${n.slice(0, 2)}-${n.slice(2, 5)}-${n.slice(5)}`;
  return clean(raw);
}

/* ⚠ **הטקסט נקרא בשתי מוסכמות.** «בן»/«בת» ו«זכר»/«נקבה»
   שתיהן נפוצות, ומכינה שתדביק אחת ותקבל דחייה על כל 33
   השורות תסיק שהמערכת שבורה. */
const GENDER = {
  "זכר": "male", "בן": "male", "ז": "male", "m": "male", "male": "male",
  "נקבה": "female", "בת": "female", "נ": "female", "f": "female", "female": "female",
};

const DAY_KIND = {
  "רגיל": "regular", "שגרה": "regular",
  "סדרה": "series", "טיול": "trip", "מסע": "trip",
  "בית": "home", "סופש בית": "home", "סופ״ש בית": "home",
  "חופשה": "holiday", "חופש": "holiday",
  "סגור": "closed", "חג": "holiday",
};

const TEAM_CATEGORY = {
  "ענף": "branch", "סדרה": "series", "ועדה": "committee",
  "קבוצה": "group", "צוות": "adhoc", "צוות מזדמן": "adhoc",
};

/* ============================================================
   המפרסרים
   ------------------------------------------------------------
   כל אחד מחזיר { rows, bad }:
     rows — שורות תקינות, מוכנות לכתיבה
     bad  — { n, raw, why } לכל שורה שנדחתה
   ============================================================ */
export const PARSERS = {

  students: {
    title: "מצבת החניכים",
    entity: "person",
    hint: "שם · ת.ז · מגדר · טלפון · עיר — בכל סדר, מופרד בטאב או בפסיק",
    example: "אורי בן־חיים\t300123456\tזכר\t052-5551234\tירושלים",
    columns: ["שם", "ת.ז", "מגדר", "טלפון", "עיר"],
    key: (r) => r.nationalId || r.name,

    parse(text) {
      const rows = [], bad = [];
      for (const { n, raw } of lines(text)) {
        const c = cells(raw);
        if (!c.length) continue;

        /* ⚠ **הזיהוי לפי צורה ולא לפי מיקום עמודה.** מנהל מכינה
           מדביק מהגיליון שלו, וסדר העמודות שלו אינו שלנו. */
        const nationalId = c.find((x) => ID_RE.test(x)) || null;
        const phone = c.find((x) => x !== nationalId && PHONE_RE.test(x.replace(/-/g, ""))) || null;
        const gender = c.map((x) => GENDER[x.toLowerCase()]).find(Boolean) || null;

        /* השם הוא התא הראשון שאינו מספר ואינו מילת מגדר */
        const name = c.find((x) =>
          x !== nationalId && x !== phone &&
          !GENDER[x.toLowerCase()] && !/^\d/.test(x) && isName(x)) || null;

        if (!name) { bad.push({ n, raw, why: "לא נמצא שם" }); continue; }
        if (name.length > 60) { bad.push({ n, raw, why: "השם ארוך מדי" }); continue; }

        /* העיר: תא שנשאר, שאינו השם */
        const rest = c.filter((x) =>
          x !== name && x !== nationalId && x !== phone && !GENDER[x.toLowerCase()]);
        const city = rest.find((x) => !/^\d+$/.test(x)) || null;

        rows.push({
          kind: "student", name, nationalId, gender,
          phone: phone ? toPhone(phone) : null,
          city, active: true,
        });
      }
      return dedupe(rows, bad, (r) => r.nationalId || r.name, "כבר מופיע בהדבקה");
    },
  },

  staff: {
    title: "הצוות",
    entity: "person",
    hint: "שם · תפקיד · טלפון · אימייל",
    example: "רננה שחר\tמדריכה\t052-5551234\trenana@example.org",
    columns: ["שם", "תפקיד", "טלפון", "אימייל"],
    key: (r) => r.name,

    parse(text) {
      const rows = [], bad = [];
      for (const { n, raw } of lines(text)) {
        const c = cells(raw);
        if (!c.length) continue;
        const email = c.find((x) => x.includes("@")) || null;
        const phone = c.find((x) => PHONE_RE.test(x.replace(/-/g, ""))) || null;
        const name = c.find((x) => x !== email && x !== phone && isName(x)) || null;
        if (!name) { bad.push({ n, raw, why: "לא נמצא שם" }); continue; }
        const roleText = c.find((x) => x !== name && x !== email && x !== phone) || null;
        rows.push({
          kind: "staff", name, email,
          phone: phone ? toPhone(phone) : null,
          active: true, _roleText: roleText,
        });
      }
      return dedupe(rows, bad, (r) => r.name, "כבר מופיע בהדבקה");
    },
  },

  calendar: {
    title: "לוח השנה",
    entity: "calendarDay",
    hint: "תאריך · סוג היום. טווח נכתב «14/09/2026 - 18/09/2026»",
    example: "14/09/2026\tרגיל\n20/09/2026 - 24/09/2026\tסדרה",
    columns: ["תאריך", "סוג"],
    key: (r) => r.date,

    parse(text) {
      const rows = [], bad = [];
      for (const { n, raw } of lines(text)) {
        const c = cells(raw);
        if (!c.length) continue;

        /* ⚠ טווח בתא אחד — «14/09 - 18/09». מנהל מכינה כותב
           סדרה כטווח, לא כחמש שורות. */
        const rangeCell = c.find((x) => /\s-\s|–/.test(x));
        const kindCell = c.find((x) => DAY_KIND[clean(x)]) || null;
        const kind = kindCell ? DAY_KIND[clean(kindCell)] : "regular";

        if (rangeCell) {
          const [a, b] = rangeCell.split(/\s*[-–]\s*/);
          const from = toISO(a), to = toISO(b);
          if (!from || !to) { bad.push({ n, raw, why: "טווח תאריכים לא תקין" }); continue; }
          if (from > to) { bad.push({ n, raw, why: "התאריך השני מוקדם מהראשון" }); continue; }
          const DAY = 86400000;
          for (let t = Date.parse(from); t <= Date.parse(to); t += DAY) {
            rows.push({ date: new Date(t).toISOString().slice(0, 10), kind });
          }
          continue;
        }

        const date = c.map(toISO).find(Boolean);
        if (!date) { bad.push({ n, raw, why: "לא נמצא תאריך" }); continue; }
        rows.push({ date, kind });
      }
      return dedupe(rows, bad, (r) => r.date, "התאריך מופיע פעמיים");
    },
  },

  courses: {
    title: "גיליונות המרצים",
    entity: "course",
    hint: "נושא · מרצה · יום ושעה · מחיר למפגש",
    example: "מחשבת ישראל\tהרב אבי שטרן\tשני 10:00\t450",
    columns: ["נושא", "מרצה", "יום ושעה", "מחיר"],
    key: (r) => r.subject,

    parse(text) {
      const rows = [], bad = [];
      for (const { n, raw } of lines(text)) {
        const c = cells(raw);
        if (!c.length) continue;
        const subject = c[0];
        if (!subject || !isName(subject)) { bad.push({ n, raw, why: "אין נושא" }); continue; }
        const priceCell = c.find((x, i) => i > 0 && /^\d+(\.\d+)?$/.test(x));
        const dayTime = c.find((x, i) => i > 0 && x !== priceCell &&
          /ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת|\d{1,2}:\d{2}/.test(x)) || null;
        const lecturer = c.find((x, i) => i > 0 && x !== priceCell && x !== dayTime) || null;
        rows.push({
          subject, lecturer, dayTime,
          /* ⚠ ריק אינו אפס: 0 הוא מתנדב, ריק הוא «לא סוכם». */
          pricePerSession: priceCell ? Number(priceCell) : null,
          active: true,
        });
      }
      return dedupe(rows, bad, (r) => r.subject, "הנושא מופיע פעמיים");
    },
  },

  teams: {
    title: "מסגרות",
    entity: "team",
    hint: "שם · סוג (ענף / ועדה / סדרה / קבוצה) · מכסה",
    example: "ועדת תרבות\tועדה\t8",
    columns: ["שם", "סוג", "מכסה"],
    key: (r) => r.name,

    parse(text) {
      const rows = [], bad = [];
      for (const { n, raw } of lines(text)) {
        const c = cells(raw);
        if (!c.length) continue;
        const name = c[0];
        if (!name || !isName(name)) { bad.push({ n, raw, why: "אין שם" }); continue; }
        const catCell = c.find((x, i) => i > 0 && TEAM_CATEGORY[clean(x)]);
        const capCell = c.find((x, i) => i > 0 && /^\d+$/.test(x));
        if (!catCell) {
          bad.push({ n, raw, why: "לא נמצא סוג — ענף · סדרה · ועדה · קבוצה · צוות" });
          continue;
        }
        rows.push({
          name, category: TEAM_CATEGORY[clean(catCell)],
          capacity: capCell ? Number(capCell) : null,
          period: "yearly",
        });
      }
      return dedupe(rows, bad, (r) => r.name, "השם מופיע פעמיים");
    },
  },
};

/**
 * ⚠ כפילות **בתוך ההדבקה עצמה** נתפסת כאן ומדווחת, ואינה
 *   נכתבת פעמיים. כפילות מול מה שכבר בבסיס הנתונים נבדקת
 *   בשרת — היא «כבר קיים» ואינה שגיאה.
 */
function dedupe(rows, bad, keyOf, why) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const k = keyOf(r);
    if (k && seen.has(k)) { bad.push({ n: null, raw: k, why }); continue; }
    if (k) seen.add(k);
    out.push(r);
  }
  return { rows: out, bad };
}

export const parserKeys = () => Object.keys(PARSERS);
