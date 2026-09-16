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

/* ⚠⚠ **הדלתא נקראת מאובייקט המכינה ולא ממודול.** גרסה
   קודמת ייבאה `readDelta`/`loadProfile` ברמת הקובץ, וזה
   היה נכון כל עוד פריסה = מכינה. ברגע שיש קונסולה, מצב
   ברמת המודול פירושו שמכינה אחת כותבת לדלתא של אחרת. */
import { contentText } from "../../core/content.js";
import { validateProfile, resolveProfile, WIZARD_STEPS, missingSteps, MODULES } from "../../core/profile.js";
import { presetOf } from "../tenants.js";
import { DataError } from "../data/store.js";

/** מה שמותר לכל אדם בעולם לראות — לפני כניסה */
export async function publicProfile({ profile }) {
  return {
    name: profile.identity?.name || "",
    /* ⚠ השם שבמרשם, למסך שנטען לפני שהאפיון נשמר. מכינה
       חדשה נפתחת עם `identity.name` ריק **במכוון** (כדי
       שהאשף ייפתח על שלב 1), ומסך כניסה בלי שום שם נראה
       כמו מסך של אף אחד. ראו server/tenants.js. */
    registryName: profile.identity?.registryName || "",
    shortName: profile.identity?.shortName || "",
    tagline: profile.identity?.tagline || "",
    colors: profile.identity?.colors || {},
    logo: profile.identity?.logo || null,
    /* ⚠ נאמר במפורש כשהאפיון עוד לא הושלם — מסך כניסה בלי שם
       נראה שבור, והסיבה האמיתית היא שלב שלא נעשה.

       ⚠⚠ **בשמות ולא במפתחות.** `missingSteps` מחזיר מפתחות
         (`identity`, `year`), והמסך הציג אותם כלשונם: מנהל
         מכינה קרא «חסרים: identity · year» ולא ידע מה זה.
         המפתח נשמר, התווית מוצגת — אותו כלל בדיוק, והפעם
         בשלבי האשף. */
    setupNeeded: missingSteps(profile).map((k) =>
      WIZARD_STEPS.find((s) => s.key === k)?.title || k),
    /* ⚠⚠ **ההערה במסך הכניסה יוצאת כאן ולא מ-`content/one`.**
       זו נקודת הקצה היחידה שנקראת **לפני** שיש סשן, ומסך
       הכניסה הוא בדיוק המקום שבו אדם תקוע צריך לדעת למי
       לפנות. בלי זה הבלוק קיים במפה ואי אפשר להציג אותו
       באף מסך — כלומר תכונה שנכתבה ואינה מגיעה.

       ⚠ **ורק הבלוק הזה, במפורש.** `texts` כולו כאן היה
         מוציא לכל מי שמגיע לכתובת את הנהלים הפנימיים של
         המכינה, לפני שהוא הזדהה. */
    signinNote: contentText(profile, "signin.note"),
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
export async function update({ body, tenant }) {
  const patch = body?.profile;
  if (!patch || typeof patch !== "object") {
    throw new DataError("לא נשלח מסמך אפיון");
  }

  const current = tenant.readDelta();
  const next = { ...current, ...patch, preset: current.preset || "premil" };

  const merged = resolveProfile(presetOf(next), next);
  const v = validateProfile(merged);
  if (!v.ok) {
    throw new DataError("האפיון אינו תקין: " + v.errors.join(" · "));
  }

  tenant.writeDelta(next);
  tenant.invalidateProfile();
  const after = await tenant.loadProfile();

  return {
    ok: true,
    warnings: v.warnings,
    missing: missingSteps(after),
    /* ⚠ מחזיר מה השתנה בפועל ולא «נשמר» — שדה שנשלח זהה
       לקיים אינו שינוי, והמסך צריך לומר אמת. */
    changed: Object.keys(patch),
  };
}
