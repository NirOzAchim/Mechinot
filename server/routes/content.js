/* ============================================================
   הטקסטים — נערכים מתוך המסך שהם מופיעים בו
   ------------------------------------------------------------
   ⚠⚠ **העריכה קיימת בשני מקומות ובכוונה**: במסך שאליו הטקסט
     שייך — שם רואים אותו בהקשר — ובמפת הטקסטים, שם רואים
     מה קיים, מה עוד לא נכתב, ומה שונה מהנוסח המקורי. אותה
     נקודת קצה לשניהם; שתי נקודות היו מתפצלות.

   ⚠⚠⚠ **ההרשאה נגזרת מ-`core/content.js` ואינה נכתבת כאן
     שוב.** המסך מסתיר בדיוק את מה שהשרת חוסם, כי שניהם
     שואלים את אותה פונקציה. שתי הגדרות מקבילות הן הדפוס
     שבו הכפתור מופיע והשמירה נופלת ב-403 אחרי שהמשתמש כבר
     הקליד עשרים שורות.

   ⚠ **`{student:true}` הוא השער, וההכרעה בתוך ההנדלר.** דגלי
     `withAuth` הם AND, והשאלה כאן היא איחוד: ראש המכינה
     **או** איש צוות **או** בעל התחום, לפי הבלוק. וקריאה
     פתוחה לכולם — נהלים שחניך אינו רואה אינם נהלים.
   ============================================================ */

import { DataError } from "../data/store.js";
import { resolveProfile, validateProfile } from "../../core/profile.js";
import { contentFor, contentText, mayEditContent, editHint, CONTENT } from "../../core/content.js";
import { presetOf } from "../tenants.js";

/* ⚠ מי אחראי על תחום — נקרא מהתפקידים, ולא מרשימה כאן.
   תפקיד שהמכינה יצרה בעצמה («אחראי תפריט») עובד מעצמו. */
const areaOwner = (user, area) => {
  if (!area || !user?.roles) return false;
  const OWNS = {
    kitchen: ["kitchen"],
    chores: ["house", "kitchen"],
    faults: ["house"],
  };
  return (OWNS[area] || []).some((r) => user.roles.includes(r));
};

const can = (key, user) =>
  mayEditContent(key, user, { mayEditArea: (a) => areaOwner(user, a) });

/* ============================================================
   מה יש
   ⚠ **מחזיר גם מה שלא נכתב** — אבל רק כאן. זו המפה, וזה
     בדיוק המקום שבו «טרם נכתב» הוא המידע. במסך עצמו בלוק
     שלא נכתב אינו מוצג כלל.
   ============================================================ */
export async function list({ profile, user }) {
  return {
    blocks: contentFor(profile).map((b) => ({
      key: b.key,
      title: b.title,
      where: b.where,
      kind: b.kind,
      screen: b.screen,
      hint: b.hint,
      example: b.example,
      body: contentText(profile, b.key),
      /* ⚠ **נגזר בשרת ונשלח**, כדי שהטופס יציג מראש רק את מה
         שמותר. ראו ההערה בראש הקובץ. */
      canEdit: can(b.key, user),
      editHint: editHint(b.key),
    })),
  };
}

/* ============================================================
   בלוק אחד — למסך שהוא יושב בו
   ⚠ נקרא מתוך מסכים, ולכן זול: הוא קורא מהאפיון שכבר נטען
     ואינו נוגע במסד.
   ============================================================ */
export async function one({ profile, user, query }) {
  const key = String(query?.key || "");
  if (!CONTENT[key]) throw new DataError(`אין בלוק טקסט בשם «${key}»`, 404);

  /* ⚠ בלוק של מודול כבוי הוא 404 ולא בלוק ריק — הוא אינו
     קיים במכינה הזו, וזה מצב אחר מ«טרם נכתב». */
  if (!contentFor(profile).some((b) => b.key === key)) {
    throw new DataError("הבלוק הזה שייך למודול שכבוי במכינה", 404);
  }

  return {
    key,
    title: CONTENT[key].title,
    body: contentText(profile, key),
    canEdit: can(key, user),
    editHint: editHint(key),
  };
}

/* ============================================================
   שמירה
   ============================================================ */
export async function save({ tenant, profile, user, body }) {
  const key = String(body?.key || "");
  if (!CONTENT[key]) throw new DataError(`אין בלוק טקסט בשם «${key}»`, 404);

  if (!contentFor(profile).some((b) => b.key === key)) {
    throw new DataError("הבלוק הזה שייך למודול שכבוי במכינה", 404);
  }

  if (!can(key, user)) {
    /* ⚠ ההודעה אומרת **מי כן רשאי** ולא «אין הרשאה» — מי
       שנחסם צריך לדעת למי לפנות. */
    throw new DataError(editHint(key), 403);
  }

  const text = String(body?.body ?? "");
  if (text.length > 20000) throw new DataError("הטקסט ארוך מ-20,000 תווים");

  const current = tenant.readDelta();
  const texts = { ...(current.texts || {}) };

  /* ⚠⚠ **מחיקה היא «החזרת הנוסח המקורי» ולא «מחיקה».** מי
     שמוחק את התוכן מקבל את מה שהיה לפני שהמכינה כתבה —
     ולכן המפתח **יורד מהדלתא** במקום להישמר כמחרוזת ריקה.
     מחרוזת ריקה שנשמרת היא בדיוק מה שגורם ל«בלוק שלא נכתב»
     להיות מוצג כקופסה ריקה. */
  const trimmed = text.trim();
  if (trimmed) texts[key] = text; else delete texts[key];

  const next = { ...current, texts };
  const check = validateProfile(resolveProfile(presetOf(next), next));
  if (!check.ok) throw new DataError("האפיון אינו תקין: " + check.errors.join(" · "));

  tenant.writeDelta(next);
  tenant.invalidateProfile();

  return {
    ok: true,
    key,
    body: trimmed || null,
    /* ⚠ מוחזר מה שקרה **בפועל** ולא «נשמר»: מחיקה ושמירה הן
       שתי פעולות שונות, והמסך צריך לומר את הנכונה. */
    cleared: !trimmed,
  };
}
