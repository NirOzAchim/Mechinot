/* ============================================================
   מסמך האפיון — החוזה בין הסטודיו לאפליקציה
   ------------------------------------------------------------
   האשף אינו מייצר קוד. הוא מייצר **מסמך אחד** שאומר מה שם
   המכינה, איך היא קוראת לדברים, אילו מודולים דלוקות ומה מבנה
   השנה שלה. הפריסה היא «הרץ אפליקציה עם המסמך הזה».

   ⚠⚠ **התבנית היא המוצר; האשף רק עורך אותה.**
     מכינה חדשה לעולם לא מתחילה מריק — היא מתחילה מתבנית
     מלאה, והאשף משנה את מה ששלה. אפליקציה ריקה שצריך לבנות
     מאפס היא מוצר שאיש לא מסיים להקים.

     מכאן שכל מסמך אפיון הוא **דלתא מעל תבנית**, לא מסמך
     עצמאי: הוא מחזיק רק את מה ששונה. זה גם מה שמאפשר לתקן
     את התבנית ושכל המכינות יקבלו את התיקון.

   ⚠⚠ **שלוש שכבות, והשלישית אינה ניתנת לאפיון.**
     מילים · מודולים · מבנה. השכבה השלישית מוצהרת כאן
     במפורש (STRUCTURE) כדי שהוויכוח עליה יהיה מפורש: מכינה
     שהמבנה שלה שונה אינה «הגדרה חסרה» — היא סיבה לשנות את
     הסכימה לכולם, או לקוח שעוד לא בשל.
   ============================================================ */

import { ENUMS, schemaModules } from "./schema.js";
import { MODULE_CATALOG, coreModules } from "./catalog.js";

/* ============================================================
   שכבה 3 — המבנה. קבוע, ומוצהר.
   ⚠ אלה אינן הגדרות. הן הנחות שכל הקוד נשען עליהן, והן כתובות
     כאן כדי שמי ששוקל לשבור אחת מהן יראה את המחיר לפני.
   ============================================================ */
export const STRUCTURE = Object.freeze({
  weekStartsOn: 0,            // ראשון. חישובי שבוע, תורנויות והובלה
  weekdays: 7,
  restDays: [5, 6],           // שישי ושבת
  attendanceGranularity: "day", // ולא לפי שיעור
  attendanceStates: ENUMS.attendance,
  approvalChain: ["guide", "head"], // ממליץ ואז מכריע
  termsPerYear: 2,
  timezone: "Asia/Jerusalem",
  calendar: "gregorian",
  direction: "rtl",
});

/* ============================================================
   שכבה 1 — אוצר המילים
   ⚠ כל ערך הוא `{ one, many }`. עברית מטה שם ברבים, ומערכת
     שמחזיקה צורה אחת מדפיסה «3 חניך».
   ⚠ מגדר אינו נתמך כרגע, ביודעין: «חניך/חניכה» דורש הטיה גם
     של הפועל שסביבו, וחצי-פתרון גרוע מהיעדרו. מכינת בנות
     תכתוב «חניכה» בשתי הצורות ותקבל טקסט תקין.
   ============================================================ */

/** מפתחות אוצר המילים שהמערכת באמת משתמשת בהם */
export const VOCAB_KEYS = [
  "person.student", "person.staff", "person.guide", "person.head",
  "team.branch", "team.series", "team.committee", "team.group", "team.adhoc",
  "term.first", "term.second", "term.yearly",
  "absence.vacation", "absence.sick", "absence.justified",
  "day.regular", "day.series", "day.trip", "day.home",
  "day.holiday", "day.closed", "day.noroutine",
  "unit.week", "unit.day", "unit.session",
];

/* ============================================================
   שכבה 2 — המודולים
   ⚠ מודול כבוי אינו קיים: לא בניווט, לא בחיפוש, לא בפעמון,
     ולא כטבלה. «מוסתר» הוא מצב שמישהו מגלה דרך כתובת ישירה.

   ⚠⚠ **הרשימה מגיעה מ-core/catalog.js ואינה נכתבת כאן.**
     שתי רשימות מקבילות מתפצלות בתוספת הראשונה — ואז האשף
     מציע מודול שהניווט אינו מכיר.
   ============================================================ */
export const MODULES = Object.fromEntries(
  Object.entries(MODULE_CATALOG).map(([k, m]) => [k, { title: m.title, core: Boolean(m.core) }]));

/** מודול ליבה אינו ניתן לכיבוי — בלעדיו אין מוצר */
export const CORE_MODULES = coreModules();

/* ============================================================
   מבנה המסמך
   ============================================================ */

/**
 * מסמך אפיון מלא. מכינה מחזיקה **דלתא** בצורה הזו, לא את כולו.
 *
 * {
 *   version: 1,
 *   preset: "premil",
 *   identity: { name, shortName, tagline, colors:{}, logo, domain },
 *   vocab:   { "person.student": { one, many } },
 *   roles:   [ { slug, label, screens:[] } ],
 *   modules: { inventory: false },
 *   year:    { start, end, terms:[], vacationQuota, minMarkedDays },
 * }
 */
export const PROFILE_VERSION = 1;

/** מיזוג עמוק — הדלתא מעל התבנית */
function merge(base, over) {
  if (over === undefined || over === null) return base;
  if (Array.isArray(base) || Array.isArray(over)) return over ?? base;
  if (typeof base !== "object" || typeof over !== "object") return over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = merge(base[k], v);
  return out;
}

/**
 * תבנית + דלתא → הפרופיל שהאפליקציה רצה איתו.
 * ⚠ **המיזוג הוא המקום היחיד שבו זה קורה.** מסך שיקרא את
 *   הדלתא ישירות יראה שדות ריקים וידווח «לא הוגדר» על משהו
 *   שיש לו ערך מצוין בתבנית.
 */
export function resolveProfile(preset, delta = {}) {
  const merged = merge(preset, delta);
  merged.version = PROFILE_VERSION;
  merged.preset = delta.preset || preset.preset;
  /* ⚠ מודולי ליבה נדלקים בכוח. מסמך שמכבה אותם הוא מסמך שגוי,
     ועדיף אפליקציה עובדת על פני כיבוד הגדרה שבורה. */
  merged.modules = { ...merged.modules };
  for (const m of CORE_MODULES) merged.modules[m] = true;
  /* ⚠ המבנה אינו ניתן לדריסה, גם אם מישהו שלח אותו. */
  merged.structure = STRUCTURE;

  /* ============================================================
     ⚠⚠ תפקיד הבסיס חייב להתקיים
     ------------------------------------------------------------
     רשימת התפקידים ניתנת לעריכה, ו**דלתא שנשמרה לפני שתפקיד
     הבסיס היה קיים דורסת את זה של התבנית** — כלומר כל חניך
     במכינה הזו מפסיק לראות מסכים, בשקט ובלי שגיאה. זה אינו
     תרחיש תיאורטי: כל מכינה שכבר אפיינה תפקידים נמצאת בו.

     ⚠ **מתווסף ואינו דורס.** מכינה שערכה את תפקיד הבסיס
       שלה שומרת על העריכה — רק היעדר מוחלט מתמלא.
     ============================================================ */
  const roles = Array.isArray(merged.roles) ? merged.roles : [];
  if (!roles.some((r) => r?.base)) {
    const fromPreset = (preset.roles || []).filter((r) => r.base);
    merged.roles = [...fromPreset, ...roles];
  }

  return merged;
}

/* ============================================================
   ולידציה
   ⚠ מפרידה בין **שגיאה** (המסמך פסול, אי אפשר להריץ) לבין
     **אזהרה** (אפשר להריץ, אבל משהו ייראה חסר). ערבוב
     השניים מוביל לכך שמפסיקים להסתכל על שניהם.
   ============================================================ */
export function validateProfile(p) {
  const errors = [];
  const warnings = [];
  const E = (m) => errors.push(m);
  const W = (m) => warnings.push(m);

  if (!p || typeof p !== "object") return { ok: false, errors: ["אין מסמך"], warnings };

  /* ---------- זהות ---------- */
  const name = p.identity?.name?.trim();
  if (!name) E("חסר שם למכינה");
  else if (name.length > 60) E("שם המכינה ארוך מ-60 תווים");

  for (const [k, v] of Object.entries(p.identity?.colors || {})) {
    if (!/^#[0-9a-fA-F]{6}$/.test(String(v))) E(`צבע לא תקין: ${k} = ${v}`);
  }

  /* ---------- אוצר מילים ---------- */
  for (const key of VOCAB_KEYS) {
    const v = p.vocab?.[key];
    if (!v) { W(`אין תרגום למונח ${key} — יוצג המפתח עצמו`); continue; }
    if (!v.one || !v.many) E(`המונח ${key} חסר צורת יחיד או רבים`);
  }
  for (const key of Object.keys(p.vocab || {})) {
    /* ⚠ מפתח שאינו מוכר **מדווח ואינו מושמט בשקט** — הוא כמעט
       תמיד שגיאת כתיב במפתח שכן קיים. */
    if (!VOCAB_KEYS.includes(key)) W(`מונח שאינו בשימוש: ${key}`);
  }

  /* ---------- תפקידים ---------- */
  const roles = p.roles || [];
  if (!roles.length) W("לא הוגדר אף תפקיד");
  const seen = new Set();
  for (const r of roles) {
    if (!r.slug) { E("תפקיד בלי slug"); continue; }
    if (!/^[a-z][a-z0-9_]*$/.test(r.slug)) E(`slug לא תקין לתפקיד: ${r.slug}`);
    if (seen.has(r.slug)) E(`תפקיד כפול: ${r.slug}`);
    seen.add(r.slug);
    if (!r.label?.trim()) E(`לתפקיד ${r.slug} אין שם להצגה`);
  }

  /* ---------- מודולים ---------- */
  const known = new Set(Object.keys(MODULES));
  for (const k of Object.keys(p.modules || {})) {
    if (!known.has(k)) W(`מודול שאינו מוכר: ${k}`);
  }
  for (const m of CORE_MODULES) {
    if (p.modules?.[m] === false) W(`${m} הוא מודול ליבה ויידלק בכל מקרה`);
  }
  /* ⚠ מודול שהסכימה מכירה ואינו ברשימה כאן — תקלה שתתגלה רק
     כשמישהו ינסה לכבות אותו. */
  for (const m of schemaModules()) {
    if (!known.has(m)) E(`הסכימה מכירה מודול שאינו ב-MODULES: ${m}`);
  }

  /* ---------- שנה ---------- */
  const y = p.year || {};
  const D = /^\d{4}-\d{2}-\d{2}$/;
  if (y.start && !D.test(y.start)) E("תאריך פתיחת השנה אינו תקין");
  if (y.end && !D.test(y.end)) E("תאריך סיום השנה אינו תקין");
  if (y.start && y.end && y.start >= y.end) E("סיום השנה אינו אחרי הפתיחה");
  if (y.vacationQuota != null && !(Number(y.vacationQuota) >= 0)) {
    E("מכסת ימי החופש אינה מספר");
  }
  if (!y.start || !y.end) W("לא הוגדרו תאריכי שנה — מסכים שתלויים בהם יהיו ריקים");

  return { ok: errors.length === 0, errors, warnings };
}

/* ============================================================
   השלמות האשף
   ⚠ שלושה שלבי חובה ו-ארבעה שאפשר לדלג עליהם. מכינה צריכה
     להגיע לאפליקציה עובדת תוך רבע שעה; השאר נעשה מההגדרות.
   ============================================================ */
export const WIZARD_STEPS = [
  { key: "identity", title: "זהות", required: true,
    desc: "שם, לוגו וצבעים" },
  { key: "vocab", title: "אוצר מילים", required: false,
    desc: "איך קוראים לחניך, למדריך ולקבוצה" },
  { key: "roles", title: "תפקידים", required: true,
    desc: "אילו תפקידים קיימים ומה כל אחד פותח" },
  { key: "modules", title: "מודולים", required: false,
    desc: "מה דלוק ומה לא" },
  { key: "year", title: "מבנה השנה", required: true,
    desc: "תאריכים, סמסטרים ומכסות" },
  { key: "people", title: "אנשים", required: false,
    desc: "הדבקת המצבה והצוות" },
  { key: "texts", title: "נהלים וטקסטים", required: false,
    desc: "נוסחים שאפשר לערוך תמיד" },
];

/** אילו שלבי חובה עוד לא הושלמו */
export function missingSteps(p) {
  const out = [];
  if (!p?.identity?.name) out.push("identity");
  if (!(p?.roles || []).length) out.push("roles");
  if (!p?.year?.start || !p?.year?.end) out.push("year");
  return out;
}
