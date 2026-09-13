/* ============================================================
   אוצר המילים — slug נשמר, label מוצג
   ------------------------------------------------------------
   ⚠⚠ **זה הקובץ שהמערכת הקודמת לא הייתה לה.** שם השם העברי
     שימש כמפתח ראשי — `DUTIES["אחראי מטבח"]` — ולכן מכינה
     שתקרא לזה «רכז מזון» הייתה מפצלת את כל ההיסטוריה שלה
     בלי שום שגיאה. כאן המפתח הוא `role.kitchen` לנצח, והשם
     הוא נתון תצוגה.

   ⚠ **`t()` לעולם אינו מחזיר ריק.** מפתח שאין לו תרגום מוחזר
     כמות שהוא — מסך שמציג «role.kitchen» מכוער, אבל מסך
     שמציג מחרוזת ריקה נראה שבור ואי אפשר לאתר את הסיבה.
   ============================================================ */

/**
 * תרגום מפתח לתווית.
 * @param {object} profile  הפרופיל המאוחד (אחרי resolveProfile)
 * @param {string} key      "person.student"
 * @param {{n?:number, plural?:boolean}} opt
 */
export function t(profile, key, opt = {}) {
  const entry = profile?.vocab?.[key];
  if (!entry) return key;
  /* ⚠ ההכרעה בין יחיד לרבים נעשית כאן ולא במסך. מסך שיכתוב
     `n === 1 ? one : many` בעצמו ישכח את זה במקום השלישי. */
  const many = opt.plural ?? (opt.n !== undefined && opt.n !== 1);
  const val = many ? entry.many : entry.one;
  return val || entry.one || entry.many || key;
}

/** «3 חניכים» · «חניך אחד» */
export function count(profile, key, n) {
  const word = t(profile, key, { n });
  if (n === 1) return `${word} אחד`;
  return `${n} ${word}`;
}

/** שם התפקיד להצגה */
export function roleLabel(profile, slug) {
  const r = (profile?.roles || []).find((x) => x.slug === slug);
  return r?.label || slug;
}

/** התפקיד המלא, או null */
export function role(profile, slug) {
  return (profile?.roles || []).find((x) => x.slug === slug) || null;
}

/**
 * האם התפקיד פותח מסך.
 * ⚠ `"*"` פותח הכול — וזה ראש המכינה בלבד.
 */
export function roleOpens(profile, slug, screen) {
  const r = role(profile, slug);
  if (!r) return false;
  const s = r.screens || [];
  return s.includes("*") || s.includes(screen);
}

/**
 * כל המסכים שאדם עם רשימת תפקידים נתונה רואה.
 * ⚠ **איחוד ולא חיתוך.** אדם שנושא שני תפקידים רואה את שניהם;
 *   זו הייתה טעות אמיתית במערכת הקודמת, שבה בעל תפקיד קיבל
 *   מסך מקוצץ במקום אותו מסך של המנהל.
 */
export function screensFor(profile, slugs = []) {
  const out = new Set();
  let all = false;
  for (const s of slugs) {
    const r = role(profile, s);
    if (!r) continue;
    for (const sc of r.screens || []) {
      if (sc === "*") all = true;
      else out.add(sc);
    }
  }
  if (all) return ["*"];
  return [...out];
}

/** האם מודול דלוק */
export const moduleOn = (profile, mod) => Boolean(profile?.modules?.[mod]);

/** תווית תחום מלאי */
export function areaLabel(profile, slug) {
  const a = (profile?.inventoryAreas || []).find((x) => x.slug === slug);
  return a?.label || slug;
}

/**
 * טקסט שהמכינה עורכת.
 * ⚠ בלוק שלא נכתב מחזיר `""` — והמסך **אינו מציג אותו בכלל**.
 *   מסך מלא בקופסאות ריקות מלמד להתעלם מהן.
 */
export const text = (profile, key) => profile?.texts?.[key] || "";
