/* ============================================================
   סוגי הימים — נערכים מתוך האפליקציה
   ------------------------------------------------------------
   ⚠⚠⚠ **מחיקת סוג שיש לו ימים בלוח השנה נחסמת ואומרת כמה.**
     סוג שנמחק תחתיו משאיר שורות שנושאות slug שאינו מוכר —
     והן **יוצאות מהמכנה של אחוז הנוכחות בשקט**. כלומר מחיקה
     אחת משנה את האחוז של כל המכינה, למפרע, בלי שום שגיאה
     ובלי שאיש ישים לב עד סוף השנה.

   ⚠⚠ **וה-slug אינו ניתן לשינוי.** הוא נשמר על כל שורה בלוח
     השנה, ושינוי שלו היה מיתם את כולן. השם משתנה חופשי —
     הוא תווית.

   ⚠ **ראש המכינה בלבד.** סוג יום משנה את חישוב הנוכחות של
     **כל** המכינה ולכל השנה; זו אינה החלטה תפעולית יומית.
   ============================================================ */

import { DataError } from "../data/store.js";
import { resolveProfile, validateProfile } from "../../core/profile.js";
import { validateDayTypes, orphanedTypes, SLUG_RE } from "../../core/day-types.js";
import { presetOf } from "../tenants.js";

const isHead = (u) => u.isRoot || u.roles?.includes("head");

function gate(user) {
  if (!isHead(user)) {
    throw new DataError(
      "עריכת סוגי הימים שמורה לראש המכינה — היא משנה את חישוב הנוכחות של כל המכינה", 403);
  }
}

/* ============================================================
   מה יש, וכמה ימים לכל סוג
   ⚠ **הספירה היא העניין.** מי שעומד למחוק סוג צריך לדעת אם
     מאחוריו יום אחד או מאה — «יש שימוש» לבדו אינו מאפשר
     להחליט.
   ============================================================ */
export async function list({ profile, db, user }) {
  const cal = await db.list("calendarDay");
  const used = {};
  for (const c of cal) used[c.kind] = (used[c.kind] || 0) + 1;

  const known = new Set((profile.dayTypes || []).map((d) => d.slug));

  return {
    canEdit: isHead(user),
    types: (profile.dayTypes || []).map((d) => ({
      ...d,
      days: used[d.slug] || 0,
    })),
    /* ⚠⚠ **סוגים יתומים מוצגים במפורש.** שורה בלוח השנה
       שנושאת סוג שאינו קיים אינה נראית בשום מסך אחר, והיא
       יוצאת מהמכנה בשקט. כאן היא הדבר הראשון שרואים. */
    orphans: Object.keys(used)
      .filter((k) => k && !known.has(k))
      .map((k) => ({ slug: k, days: used[k] })),
    total: cal.length,
  };
}

/* ============================================================
   שמירה — הרשימה כולה, ולא שורה אחת
   ⚠⚠ **המצב הרצוי ולא «הוסף/הסר».** שני אנשים שעורכים את
     הרשימה מקבלים תוצאה שלמה ולא חצי מכל אחד, והבדיקה של
     «מה נמחק» אפשרית רק כשרואים את שתי הרשימות יחד.
   ============================================================ */
export async function save({ tenant, profile, db, body, user }) {
  gate(user);

  const next = Array.isArray(body?.types) ? body.types : null;
  if (!next) throw new DataError("לא נשלחה רשימת סוגי ימים");

  const clean = next.map((d) => ({
    slug: String(d?.slug || "").trim().toLowerCase(),
    label: String(d?.label || "").trim(),
    school: Boolean(d?.school),
    counts: Boolean(d?.counts),
  }));

  const errors = validateDayTypes(clean);
  if (errors.length) throw new DataError(errors.join(" · "));

  /* ⚠ ה-slug אינו משתנה: סוג שקיים ומגיע עם slug שאינו ברשימה
     הישנה הוא **חדש**, וסוג ישן שנעלם הוא **מחיקה**. אין
     «שינוי מזהה», ולכן אין מצב שבו שורות מתייתמות בעריכה. */
  const before = profile.dayTypes || [];
  const beforeSlugs = new Set(before.map((d) => d.slug));
  const afterSlugs = new Set(clean.map((d) => d.slug));
  const removed = [...beforeSlugs].filter((s) => !afterSlugs.has(s));

  if (removed.length) {
    const cal = await db.list("calendarDay");
    const used = {};
    for (const c of cal) used[c.kind] = (used[c.kind] || 0) + 1;

    const blocking = removed.filter((s) => used[s] > 0);
    if (blocking.length && body?.force !== true) {
      /* ⚠⚠ ההודעה אומרת **כמה ימים ומאיזה סוג**, כי זו
         ההחלטה: סוג שמאחוריו יום אחד וסוג שמאחוריו מאה הם
         שתי פעולות שונות לגמרי. */
      const detail = blocking
        .map((s) => `«${before.find((d) => d.slug === s)?.label || s}» — ${used[s]} ימים`)
        .join(" · ");
      throw new DataError(
        `אי אפשר למחוק סוג שיש לו ימים בלוח השנה: ${detail}. ` +
        "הימים האלה ייצאו מחישוב הנוכחות בשקט. " +
        "אפשר לשנות להם סוג קודם, או לאשר במפורש.", 409);
    }
  }

  const current = tenant.readDelta();
  const delta = { ...current, dayTypes: clean };
  const check = validateProfile(resolveProfile(presetOf(delta), delta));
  if (!check.ok) throw new DataError("האפיון אינו תקין: " + check.errors.join(" · "));

  tenant.writeDelta(delta);
  tenant.invalidateProfile();

  return {
    ok: true,
    types: clean,
    /* ⚠ מוחזר מה שהשתנה **בפועל**, ולא «נשמר». */
    added: [...afterSlugs].filter((s) => !beforeSlugs.has(s)),
    removed,
  };
}

/* ============================================================
   תיקון סוג יתום — החלפה של כל השורות בבת אחת
   ⚠ בלי זה, סוג שנמחק בטעות משאיר ימים שאין שום מסך שמגיע
     אליהם, ואי אפשר לתקן אותם מתוך האפליקציה כלל.
   ============================================================ */
export async function remap({ tenant, profile, db, body, user }) {
  gate(user);

  const from = String(body?.from || "");
  const to = String(body?.to || "");
  if (!from) throw new DataError("חסר הסוג שמחליפים");
  if (!SLUG_RE.test(to)) throw new DataError("חסר הסוג החדש");

  if (!(profile.dayTypes || []).some((d) => d.slug === to)) {
    throw new DataError(`«${to}» אינו סוג יום קיים`);
  }

  const cal = await db.list("calendarDay", { where: { kind: from } });
  if (!cal.length) throw new DataError(`אין ימים מסוג «${from}»`, 404);

  for (const c of cal) await db.update("calendarDay", c.id, { kind: to });

  /* ⚠ מוחזר כמה שורות הוחלפו — פעולה שמשנה את אחוז הנוכחות
     של כל המכינה חייבת לומר על כמה ימים היא עברה. */
  return { ok: true, from, to, days: cal.length };
}
