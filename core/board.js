/* ============================================================
   לוח המודעות — מי מפרסם מה, ולמי
   ------------------------------------------------------------
   ⚠⚠⚠ **מי מפרסם נקבע לפי מה נאמר, ולא לפי מי אומר.**
     לוח שכל אחד מכריז בו כל דבר הופך לוואטסאפ תוך שבוע;
     לוח שרק בעלי תפקידים כותבים בו נועל את המקרה הנפוץ
     ביותר — חניך שאיבד משהו.

       `open: true`   כל אדם במכינה
       `open: false`  בעל תפקיד או איש צוות

   ⚠⚠ **הקהל הוא הרשאת קריאה בשרת ולא סינון בתצוגה.** מודעה
     ל«צוות» אינה בגוף התשובה של חניך **כלל** — לא מוסתרת,
     לא מסוננת: אינה שם.

   ⚠ **וחניך אינו מפרסם לצוות.** לא כי זה מסוכן, אלא כי זה
     ערוץ אחר: מה שחניך רוצה לומר לבעל תפקיד עובר במקום שיש
     בו נמען ואחריות, ולא בהכרזה לכולם.
   ============================================================ */

import { t } from "./vocab.js";

export const KINDS = Object.freeze([
  { slug: "lost", open: true, icon: "Search" },
  { slug: "tip", open: true, icon: "Star" },
  { slug: "notice", open: false, icon: "Bell" },
  { slug: "event", open: false, icon: "Calendar" },
]);

const BY_SLUG = Object.fromEntries(KINDS.map((k) => [k.slug, k]));

export const AUDIENCES = Object.freeze(["all", "students", "staff"]);

/** ⚠ `null` על סוג שאינו מוכר — הקורא מחליט, ולא נופל לברירת מחדל. */
export const kindOf = (slug) => (BY_SLUG[slug] ? slug : null);

export const kindLabel = (profile, slug) =>
  BY_SLUG[slug] ? t(profile, `notice.${slug}`) : (slug || "");

export const kindIcon = (slug) => BY_SLUG[slug]?.icon || "Board";

/**
 * האם מותר לפרסם מודעה כזו.
 * ⚠ **`isStaff` אינו התנאי היחיד** — חניך שנושא תפקיד
 *   (אחראי מטבח, אב בית) מפרסם ככל בעל תפקיד. בדיוק הכלל
 *   שמסך של בעל תפקיד זהה למסך של המנהל.
 */
export function mayPost(kind, { isStaff = false, hasRole = false } = {}) {
  const k = BY_SLUG[kind];
  if (!k) return false;
  return k.open || isStaff || hasRole;
}

/** ⚠ קהל «צוות» הוא של הצוות בלבד — ראו ההערה בראש. */
export function mayTarget(audience, { isStaff = false } = {}) {
  if (!AUDIENCES.includes(audience)) return false;
  if (audience === "staff") return isStaff;
  return true;
}

/**
 * האם המודעה מגיעה לאדם הזה.
 * ⚠ נקראת **בשרת** לפני המיפוי, ולא במסך.
 */
export function visibleTo(notice, { isStaff = false } = {}) {
  const a = notice.audience || "all";
  if (a === "staff") return isStaff;
  if (a === "students") return !isStaff;
  return true;
}

/**
 * הציטוט של היום — גיבוב יציב של התאריך.
 *
 * ⚠⚠ **ולא אקראי.** אקראי היה מתחלף בכל טעינת מסך, ואז שני
 *   חניכים שמדברים על «הציטוט של היום» מדברים על שני דברים.
 *   גיבוב של התאריך נותן אותו ציטוט לכולם, ומתחלף מעצמו
 *   בחצות בלי שאיש יבחר.
 */
export function quoteOfDay(quotes, isoDate) {
  if (!quotes?.length) return null;
  let h = 0;
  for (const ch of String(isoDate || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return quotes[h % quotes.length];
}
