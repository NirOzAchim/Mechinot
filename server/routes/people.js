/* ============================================================
   אנשים
   ------------------------------------------------------------
   ⚠⚠ **מיפוי מפורש ולא פריסה.** `person` נושא ת.ז, תאריך
     לידה וטלפון, ופריסה של `...row` הייתה מוציאה אותם לכל
     מי שיש לו גישה לרשימה. שדה חדש בסכימה לא ידלוף מעצמו.

   ⚠⚠ **שני מיפויים נפרדים לחניך ולצוות.** לא סינון של אותו
     אובייקט — שני מיפויים, כדי ששדה שיתווסף לצוות לא ימצא
     את דרכו לצד החניך בטעות.

   ⚠ **`excludeFromCounts` מסונן כאן, במקום אחד.** כל מסך
     שמונה אנשים עובר דרך `counted()`, ולכן מסך שייכתב מחר
     יסנן את חשבון הבדיקה מעצמו. מי שירצה דווקא לכלול אותו
     יצטרך לקרוא ל-`db.list` במפורש — ולכתוב למה.
   ============================================================ */

import { t } from "../../core/vocab.js";

/** כל מי שנספר: פעיל, ולא מסומן כמוחרג */
export async function counted(db, kind = null) {
  const where = { active: true, excludeFromCounts: false };
  if (kind) where.kind = kind;
  return db.list("person", { where, order: "name" });
}

/** ⚠ מה שכל אדם במכינה רשאי לראות על אדם אחר */
const publicView = (p) => ({
  id: p.id,
  name: p.name,
  kind: p.kind,
});

/** ⚠ מה שהצוות רואה. ת.ז ותאריך לידה כלולים; ראו הערה למטה. */
const staffView = (p) => ({
  id: p.id,
  name: p.name,
  kind: p.kind,
  gender: p.gender,
  phone: p.phone,
  email: p.email,
  city: p.city,
  shirtSize: p.shirtSize,
  /* ⚠ מובלט במסך ואינו שורה ברשימה — זה הנתון היחיד כאן שיש
     לו משמעות מיידית למי שמבשל. */
  allergy: p.allergy,
  birthDate: p.birthDate,
  active: p.active,
  /* ⚠⚠ ת.ז **אינה** כאן. היא סוד הכניסה הראשונה, והיא יוצאת
     רק במסלול של ראש המכינה — שטרם נכתב. כשייכתב: שדה משלו,
     לא הרחבה של המיפוי הזה. */
});

export async function list({ db, user, profile, query }) {
  const kind = query.kind === "staff" ? "staff" : "student";
  const rows = await counted(db, kind);

  const view = user.isStaff ? staffView : publicView;

  /* התפקידים נקראים טרי בכל בקשה — הסרת תפקיד סוגרת מסך מיד
     ולא בכניסה הבאה. */
  const assignments = await db.list("roleAssignment");
  const byPerson = new Map();
  for (const a of assignments) {
    if (!byPerson.has(a.person)) byPerson.set(a.person, []);
    byPerson.get(a.person).push(a.role);
  }

  return {
    kind,
    label: t(profile, `person.${kind}`, { plural: true }),
    total: rows.length,
    people: rows.map((p) => ({
      ...view(p),
      roles: byPerson.get(p.id) || [],
    })),
  };
}

/** הנתונים של המשתמש על עצמו — מהשורה שלו בלבד */
export async function myProfile({ db, user, profile }) {
  /* ⚠ מנהל-על אינו אדם במכינה — ראו server/auth.js. */
  if (!user.personId) return { person: null, roles: [], notAPerson: true };
  const p = await db.get("person", user.personId);
  if (!p) return { person: null, roles: [] };

  return {
    person: {
      ...staffView(p),
      /* ⚠ על עצמו הוא כן רואה את הת.ז שלו — היא שלו. */
      nationalId: p.nationalId || null,
    },
    roles: user.roles.map((slug) => ({
      slug,
      label: (profile.roles || []).find((r) => r.slug === slug)?.label || slug,
    })),
  };
}
