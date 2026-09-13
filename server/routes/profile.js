/* ============================================================
   מסמך האפיון — קריאה ועריכה
   ------------------------------------------------------------
   ⚠⚠ **שני מיפויים מפורשים ונפרדים, ולא השמטה.**
     `publicProfile` יוצא **בלי התחברות** — מסך הכניסה צריך
     את שם המכינה ואת הצבעים לפני שיש משתמש. `fullProfile`
     יוצא לצוות בלבד.

     מיפוי מפורש ולא פריסה: שדה שיתווסף מחר לפרופיל לא ידלוף
     החוצה מעצמו. זה הכלל שחוזר בכל נקודת קצה שמחזירה נתון.
   ============================================================ */

import { readDelta, writeDelta, loadProfile, invalidateProfile } from "../profile-store.js";
import { validateProfile, resolveProfile, WIZARD_STEPS, missingSteps, MODULES } from "../../core/profile.js";
import PREMIL from "../../core/presets/premil.js";
import { DataError } from "../data/store.js";

/** מה שמותר לכל אדם בעולם לראות — לפני כניסה */
export async function publicProfile({ profile }) {
  return {
    name: profile.identity?.name || "",
    shortName: profile.identity?.shortName || "",
    tagline: profile.identity?.tagline || "",
    colors: profile.identity?.colors || {},
    logo: profile.identity?.logo || null,
    /* ⚠ נאמר במפורש כשהאפיון עוד לא הושלם — מסך כניסה בלי שם
       נראה שבור, והסיבה האמיתית היא שלב שלא נעשה. */
    setupNeeded: missingSteps(profile),
  };
}

/** לצוות: הפרופיל המלא, בלי הפנימיים */
export async function fullProfile({ profile }) {
  const { __valid, __errors, __warnings, ...rest } = profile;
  return {
    profile: rest,
    valid: __valid,
    errors: __errors,
    warnings: __warnings,
    steps: WIZARD_STEPS,
    missing: missingSteps(profile),
    modules: MODULES,
  };
}

/**
 * עדכון האפיון.
 * ⚠ **נבדק לפני שנכתב.** מסמך פסול שנכתב לקובץ מפיל את
 *   האפליקציה בטעינה הבאה, ואז אין מסך שדרכו מתקנים אותו.
 * ⚠ **דלתא ולא מסמך מלא** — כך תיקון בתבנית מגיע לכל המכינות.
 */
export async function update({ body }) {
  const patch = body?.profile;
  if (!patch || typeof patch !== "object") {
    throw new DataError("לא נשלח מסמך אפיון");
  }

  const current = readDelta();
  const next = { ...current, ...patch, preset: current.preset || "premil" };

  const merged = resolveProfile(PREMIL, next);
  const v = validateProfile(merged);
  if (!v.ok) {
    throw new DataError("האפיון אינו תקין: " + v.errors.join(" · "));
  }

  writeDelta(next);
  invalidateProfile();
  const after = await loadProfile();

  return {
    ok: true,
    warnings: v.warnings,
    missing: missingSteps(after),
    /* ⚠ מחזיר מה השתנה בפועל ולא «נשמר» — שדה שנשלח זהה
       לקיים אינו שינוי, והמסך צריך לומר אמת. */
    changed: Object.keys(patch),
  };
}
