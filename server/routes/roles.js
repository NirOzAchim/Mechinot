/* ============================================================
   תפקידים — נוצרים, נערכים ונמחקים מהמסך
   ------------------------------------------------------------
   ⚠⚠⚠ **התפקידים הם נתון ולא רשימה בקוד.** ראש המכינה יוצר
     תפקיד חדש, קובע לו שם, קובע אילו מסכים הוא פותח ומוחק
     אותו — הכול בלי דיפלוי. הקטלוג (`core/catalog.js`)
     מתאר **מה קיים במערכת**; מי נושא מה ומה כל אחד פותח
     הוא של המכינה.

     זה ההבדל בין מוצר שאפשר להתאים לבין מוצר שצריך לתכנת
     מחדש לכל לקוח.

   ⚠⚠ **ה-slug נשמר, התווית מוצגת, וה-slug אינו ניתן
     לשינוי.** שורות `roleAssignment` מצביעות עליו, ושינוי
     שלו היה מנתק כל מי שנושא את התפקיד — בלי שגיאה ובלי
     שאיש ישים לב, כי «אין תפקיד כזה» נראה בדיוק כמו «אין
     לו תפקיד». שינוי שם הוא תווית בלבד.

   ⚠ **מחיקת תפקיד שיש לו נושאים נחסמת ואומרת כמה.** תפקיד
     שנמחק תחתם משאיר שורות שמצביעות לשום מקום, והחניך
     מאבד מסכים בלי שאיש יידע למה.
   ============================================================ */

import { DataError } from "../data/store.js";
import { resolveProfile, validateProfile, missingSteps } from "../../core/profile.js";
import { activeScreens, activeModules, MODULE_CATALOG, ROLE_CATALOG } from "../../core/catalog.js";
import { presetOf } from "../tenants.js";
import { screensOf } from "../auth.js";

const SLUG_RE = /^[a-z][a-z0-9_]{1,30}$/;

/* ⚠ שמות שמורים: `*` הוא «הכול», ו-slug ריק שובר את כל
   ההשוואות. חסימה כאן זולה בהרבה מאשר לגלות את זה אחר כך. */
const RESERVED = new Set(["*", "all", "none", "null", "undefined"]);

const isHead = (u) => u.isRoot || u.roles.includes("head");

function gate(user) {
  /* ⚠ **ראש המכינה בלבד.** רשימת התפקידים קובעת מה כל אדם
     במכינה רואה; מי שיכול לערוך אותה יכול לפתוח לעצמו הכול. */
  if (!isHead(user)) {
    throw new DataError("עריכת התפקידים שמורה לראש המכינה", 403);
  }
}

/* ============================================================
   ⚠⚠⚠ נעילה עצמית — הדבר היחיד כאן שאין ממנו חזרה
   ------------------------------------------------------------
   נתפס בהרצה: ראש המכינה מחק את התפקיד שהוא עצמו נושא,
   הבקשה הצליחה — **ומאותו רגע כל נקודת קצה החזירה לו 403**,
   כולל המסך שדרכו מתקנים את זה. אין «בטל», אין מסך, ואין
   דרך פנימית להחזיר את המצב: רק כלי שורת פקודה או מנהל-על.

   ⚠ **הבדיקה היא על המצב שאחרי, ולא על «האם זה תפקיד שלי».**
     מנהל רשאי למחוק תפקיד שהוא נושא, כל עוד נשאר לו נתיב
     אל ההגדרות דרך תפקיד אחר — וזה המצב הרגיל אצל מי
     שנושא שניים.

   ⚠ **ומנהל-על פטור** — הוא אינו נושא תפקידים במכינה כלל,
     ו-`screensOf` מחזירה לו `*` בכל מקרה.
   ============================================================ */
function notLockingSelf(profile, user, nextRoles, what) {
  if (user.isRoot) return;
  const after = screensOf({ ...profile, roles: nextRoles }, user);
  if (after.includes("*") || after.includes("settings")) return;
  throw new DataError(
    `${what} היה סוגר לך את מסך ההגדרות — ומאותו רגע לא הייתה דרך לחזור. ` +
    "יש להעניק לעצמך קודם תפקיד אחר שפותח את ההגדרות.", 409);
}

/* ============================================================
   מה יש
   ============================================================ */
export async function list({ profile, db, user }) {
  const mods = profile.modules || {};
  const screens = activeScreens(mods);
  const byKey = new Map(screens.map((s) => [s.key, s]));

  /* ⚠ כמה אנשים נושאים כל תפקיד — **נספר, ולא מוצג כ«יש
     נושאים».** מי שעומד למחוק צריך לדעת אם זה אחד או עשרים. */
  const counts = {};
  for (const a of await db.list("roleAssignment")) {
    counts[a.role] = (counts[a.role] || 0) + 1;
  }

  return {
    canEdit: isHead(user),
    roles: (profile.roles || []).map((r) => ({
      slug: r.slug,
      label: r.label,
      desc: r.desc || "",
      staffOnly: Boolean(r.staffOnly),
      viewOnly: Boolean(r.viewOnly),
      admin: Boolean(r.admin),
      base: Boolean(r.base),
      all: (r.screens || []).includes("*"),
      /* ⚠ מסכים **מסוננים למה שקיים**: תפקיד שמפנה למסך של
         מודול כבוי מקבל רשימה מקוצרת, ולא 404 אחרי הלחיצה. */
      screens: (r.screens || []).filter((s) => s === "*" || byKey.has(s)),
      /* ⚠ ומה נחתך מדווח, ולא נעלם — אחרת התפקיד «אחראי
         מטבח» נשאר ברשימה בלי אף מסך ואיש לא יודע למה. */
      hidden: (r.screens || []).filter((s) => s !== "*" && !byKey.has(s)),
      people: counts[r.slug] || 0,
    })),

    /* ⚠ קטלוג המסכים לבורר — מקובצים במודול, כדי שהבחירה
       תיקרא כמו הניווט ולא כרשימה שטוחה של ארבעים מפתחות. */
    catalog: activeModules(mods).map((m) => ({
      module: m,
      title: MODULE_CATALOG[m].title,
      screens: (MODULE_CATALOG[m].screens || []).map((s) => ({
        key: s.key, title: s.title, staff: Boolean(s.staff), admin: Boolean(s.admin),
      })),
    })),

    /* ⚠ הצעות מהקטלוג — מכינה שרוצה «אחראי מטבח» לא צריכה
       לבחור עשרה מסכים ביד. מי שאינו רוצה, מתחיל מריק. */
    suggest: Object.entries(ROLE_CATALOG)
      .filter(([slug, r]) => !r.base && !(profile.roles || []).some((x) => x.slug === slug))
      .filter(([, r]) => !r.module || activeModules(mods).includes(r.module))
      .map(([slug, r]) => ({
        slug, label: r.label, why: r.why || "",
        screens: r.all ? ["*"] : (r.screens || []).filter((s) => byKey.has(s)),
        staffOnly: Boolean(r.staffOnly), viewOnly: Boolean(r.viewOnly),
        admin: Boolean(r.admin),
      })),
  };
}

/* ============================================================
   שמירה — יצירה ועריכה באותו מסלול
   ⚠⚠ **הוולידציה אחת לשתיהן.** שתי גרסאות מתפצלות בתיקון
     הראשון, ואז תפקיד שאסור ליצור אפשר להגיע אליו בעריכה.
   ============================================================ */
export async function save({ profile, tenant, body, user }) {
  gate(user);

  const slug = String(body?.slug || "").trim().toLowerCase();
  if (!SLUG_RE.test(slug) || RESERVED.has(slug)) {
    throw new DataError("מזהה התפקיד: אנגלית קטנה, 2–31 תווים, מתחיל באות");
  }

  const label = String(body?.label || "").trim();
  if (!label) throw new DataError("לתפקיד חייב להיות שם להצגה");
  if (label.length > 40) throw new DataError("שם התפקיד ארוך מ-40 תווים");

  const current = tenant.readDelta();
  const merged = resolveProfile(presetOf(current), current);
  const roles = [...(merged.roles || [])];
  const at = roles.findIndex((r) => r.slug === slug);
  const creating = at < 0;

  /* ⚠ שם כפול נחסם: שני תפקידים באותו שם הם שתי שורות
     שנראות זהות בכל בורר, ומי שמשייך בוחר באקראי. */
  if (roles.some((r) => r.slug !== slug && r.label.trim() === label)) {
    throw new DataError(`כבר יש תפקיד בשם «${label}»`);
  }

  const all = body?.all === true;
  const wanted = Array.isArray(body?.screens) ? body.screens : [];
  const exists = new Set(activeScreens(merged.modules || {}).map((s) => s.key));

  /* ⚠ **מסך שאינו קיים נדחה ברעש** ולא מושמט בשקט. השמטה
     שקטה פירושה שהמנהל סימן משהו, קיבל «נשמר», והמסך אינו
     נפתח — ואין שום דבר שיסביר לו למה. */
  const bad = wanted.filter((s) => !exists.has(s));
  if (bad.length) {
    throw new DataError(`מסכים שאינם קיימים במכינה הזו: ${bad.join(", ")}`);
  }

  const next = {
    slug,
    label,
    desc: String(body?.desc || "").trim().slice(0, 400),
    staffOnly: Boolean(body?.staffOnly),
    viewOnly: Boolean(body?.viewOnly),
    admin: Boolean(body?.admin),
    /* ⚠⚠ `base` אינו ניתן להחלפה מהמסך. תפקיד הבסיס נישא על
       ידי כולם, וכיבויו בטעות מעוור את כל החניכים בבת אחת —
       בלי שגיאה, כי «אין מסכים» אינו כישלון. */
    base: creating ? false : Boolean(roles[at].base),
    screens: all ? ["*"] : wanted,
  };

  if (creating) roles.push(next); else roles[at] = next;

  const delta = { ...current, roles };
  const check = validateProfile(resolveProfile(presetOf(delta), delta));
  if (!check.ok) throw new DataError("האפיון אינו תקין: " + check.errors.join(" · "));
  notLockingSelf(profile, user, resolveProfile(presetOf(delta), delta).roles, "השינוי הזה");

  tenant.writeDelta(delta);
  tenant.invalidateProfile();

  return {
    ok: true, created: creating, slug,
    warnings: check.warnings,
    missing: missingSteps(await tenant.loadProfile()),
  };
}

/* ============================================================
   מחיקה
   ============================================================ */
export async function remove({ tenant, db, body, user }) {
  gate(user);
  const slug = String(body?.slug || "");

  const current = tenant.readDelta();
  const merged = resolveProfile(presetOf(current), current);
  const roles = merged.roles || [];
  const row = roles.find((r) => r.slug === slug);
  if (!row) throw new DataError("התפקיד לא נמצא", 404);

  /* ⚠⚠ תפקיד הבסיס אינו נמחק. הוא מה שכל אדם במכינה רואה,
     ובלעדיו חניך בלי תפקיד מקבל **אפס מסכים** — בלי שגיאה. */
  if (row.base) {
    throw new DataError(
      "אי אפשר למחוק את תפקיד הבסיס — הוא מה שכל אדם במכינה רואה. " +
      "אפשר לערוך אותו ולהוריד ממנו מסכים.");
  }

  /* ⚠ ולא למחוק את התפקיד האחרון שרואה הכול: מכינה בלי אף
     תפקיד ניהולי היא מכינה שאיש אינו יכול לתקן בה כלום. */
  const admins = roles.filter((r) => r.admin || (r.screens || []).includes("*"));
  if (admins.length === 1 && admins[0].slug === slug) {
    throw new DataError(
      "זה התפקיד היחיד שרואה את כל המערכת. מחיקתו תנעל את המכינה — " +
      "יש ליצור תפקיד ניהולי אחר קודם.");
  }

  /* ⚠⚠ **נושאים נספרים, וההודעה אומרת כמה.** «יש נושאים»
     לבדו אינו אומר אם זה אחד או עשרים, ולכן אינו מאפשר
     להחליט. */
  const holders = (await db.list("roleAssignment", { where: { role: slug } })).length;
  if (holders > 0 && body?.force !== true) {
    throw new DataError(
      `${holders} אנשים נושאים את «${row.label}». מחיקה תסיר אותו מכולם — ` +
      "אפשר לאשר במפורש, או להסיר אותו מהם קודם.", 409);
  }

  const kept = roles.filter((r) => r.slug !== slug);
  notLockingSelf(merged, user, kept, `מחיקת «${row.label}»`);

  tenant.writeDelta({ ...current, roles: kept });
  tenant.invalidateProfile();

  /* ⚠ **השורות נמחקות איתו.** שורת שיוך שמצביעה לתפקיד
     שאינו קיים אינה נראית בשום מסך ואי אפשר למחוק אותה —
     היא פשוט נשארת שם לנצח. */
  let cleared = 0;
  for (const a of await db.list("roleAssignment", { where: { role: slug } })) {
    await db.remove("roleAssignment", a.id);
    cleared++;
  }

  return { ok: true, slug, cleared };
}

/* ============================================================
   מי נושא מה
   ⚠ **המצב הרצוי ולא «הוסף/הסר».** שני אנשים שפותחים את
     אותו חניך ושומרים שולחים את הרשימה המלאה, והאחרון מנצח
     בשלמות — במקום ששניהם יוסיפו חצי.
   ============================================================ */
export async function assign({ db, profile, body, user, tenant }) {
  gate(user);

  const personId = String(body?.person || "");
  const person = await db.get("person", personId);
  if (!person) throw new DataError("האדם לא נמצא", 404);

  const wanted = Array.isArray(body?.roles) ? [...new Set(body.roles.map(String))] : [];
  const known = new Map((profile.roles || []).map((r) => [r.slug, r]));

  for (const slug of wanted) {
    const r = known.get(slug);
    if (!r) throw new DataError(`אין תפקיד בשם «${slug}»`);
    /* ⚠ תפקיד שמסומן «צוות בלבד» אינו מוענק לחניך. בלי זה
       חניך מקבל מסכים שכל ההיגיון שלהם הוא שהוא לא בהם. */
    if (r.staffOnly && person.kind !== "staff") {
      throw new DataError(`«${r.label}» שמור לאנשי צוות`);
    }
    /* ⚠ תפקיד בסיס אינו מוענק — הוא נישא ממילא. הענקה שלו
       הייתה יוצרת שורה שאינה משנה דבר, ומי שיראה אותה יסיק
       שלמישהו אחר חסר משהו. */
    if (r.base) throw new DataError(`«${r.label}» נישא על ידי כולם ואינו מוענק`);
  }

  const have = await db.list("roleAssignment", { where: { person: personId } });
  const haveSet = new Set(have.map((a) => a.role));

  let added = 0, removed = 0;
  for (const slug of wanted) {
    if (!haveSet.has(slug)) { await db.create("roleAssignment", { person: personId, role: slug }); added++; }
  }
  for (const a of have) {
    if (!wanted.includes(a.role)) { await db.remove("roleAssignment", a.id); removed++; }
  }

  /* ⚠ מוחזר מה שהשתנה **בפועל** ולא «נשמר». שיוך שנשלח זהה
     לקיים אינו שינוי, והמסך צריך לומר אמת. */
  return {
    ok: true, added, removed, roles: wanted,
    screens: screensOf(profile, { roles: wanted, isStaff: person.kind === "staff" }),
  };
}

/* ============================================================
   מי נושא איזה תפקיד
   ------------------------------------------------------------
   ⚠⚠ **נקודת קצה נפרדת מ-`roles/list`, ובכוונה.** `roles/list`
     שמור למסך ההגדרות (`screen: "settings"`) ומחזיר את קטלוג
     המסכים ואת ההצעות — כלומר את מה שדרוש כדי **לערוך** את
     ההגדרה של תפקיד. המסך «בעלי תפקידים» שואל שאלה אחרת:
     מי, בפועל, נושא מה.

     הרחבת השער של `roles/list` כדי לשרת את שניהם הייתה פותחת
     לכל איש צוות את עורך ההרשאות של המכינה. **שני קהלים, שתי
     נקודות קצה, שני שערים.**

   ⚠ **ותפקידי הבסיס אינם ברשימה.** הם נישאים על ידי כולם
     ואינם מוענקים; שורה «כל אדם במכינה — 33 נושאים» היא רעש
     שמסתיר את מי שבאמת נושא תפקיד.

   ⚠ **`canAssign` נגזר בשרת** — כפתור שמופיע ומקבל 403 אחרי
     הלחיצה הוא בדיוק מה שהכלל הזה נועד למנוע.
   ============================================================ */
export async function holders({ profile, db, user }) {
  const people = await db.list("person", {
    where: { active: true, excludeFromCounts: false }, order: "name",
  });
  const byId = new Map(people.map((p) => [p.id, p]));

  const mine = new Map();
  for (const a of await db.list("roleAssignment")) {
    if (!byId.has(a.person)) continue;
    if (!mine.has(a.role)) mine.set(a.role, []);
    mine.get(a.role).push({ id: a.person, name: byId.get(a.person).name });
  }

  return {
    canAssign: isHead(user),
    roles: (profile.roles || [])
      .filter((r) => !r.base)
      .map((r) => ({
        slug: r.slug,
        label: r.label,
        desc: r.desc || "",
        staffOnly: Boolean(r.staffOnly),
        /* ⚠ מספר המסכים ולא הרשימה — המסך הזה עונה על «מי»,
           ולא על «מה מותר לו». השני יושב בהגדרות. */
        screenCount: (r.screens || []).includes("*") ? null : (r.screens || []).length,
        people: mine.get(r.slug) || [],
      })),
    /* ⚠ הבורר מקבל את מי שאפשר לשבץ, לפי סוג — תפקיד
       `staffOnly` שיוענק לחניך פותח לו מסכים שאינם שלו. */
    staff: people.filter((p) => p.kind === "staff").map((p) => ({ id: p.id, name: p.name })),
    students: people.filter((p) => p.kind === "student").map((p) => ({ id: p.id, name: p.name })),
  };
}
