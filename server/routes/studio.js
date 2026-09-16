/* ============================================================
   הסטודיו — האשף שבו מנהל מכינה מאפיין לעצמו את האפליקציה
   ------------------------------------------------------------
   ⚠⚠ **תמיד תצוגה מקדימה לפני כתיבה.** כל ייבוא עובר שני
     מסלולים נפרדים: `preview` שאינו כותב דבר, ו-`commit`
     שכותב. אין מסלול אחד עם דגל — דגל שנשכח כותב 33 שורות
     שאיש לא אישר.

   ⚠⚠ **שלוש רשימות תוצאה ולא אחת**: מה נוצר, מה כבר היה,
     ומה נדחה **עם הסיבה**. «נוספו 32» אחרי שהמנהל הדביק 33
     הוא בדיוק מה שגורם לו לא לשים לב שחניך חסר.

   ⚠ **הדבקה חוזרת אינה מכפילה.** שורה שכבר קיימת נספרת
     כ«כבר קיים» ואינה שגיאה — מנהל שמדביק שוב אחרי שהוסיף
     שניים לגיליון שלו עושה דבר סביר לגמרי.
   ============================================================ */

import { PARSERS } from "../../core/import.js";
import { MODULE_CATALOG, ROLE_CATALOG, activeModules, activeScreens, suggestedRoles, roleScreens } from "../../core/catalog.js";
import { WIZARD_STEPS, missingSteps, VOCAB_KEYS, validateProfile, resolveProfile } from "../../core/profile.js";
/* ⚠ הדלתא מאובייקט המכינה — ראו ההערה ב-routes/profile.js. */
import { presetOf } from "../tenants.js";
import { DataError } from "../data/store.js";
import { hashPassword } from "../auth.js";

/* ============================================================
   מצב האשף
   ============================================================ */
export async function state({ profile, db }) {
  const counts = {};
  for (const [key, p] of Object.entries(PARSERS)) {
    /* ⚠ ספירה לפי מה שכבר קיים, כדי שהאשף יאמר «יש כבר 18»
       ולא ישאל שוב על משהו שנעשה. */
    try {
      counts[key] = p.entity === "person"
        ? await db.count("person", { kind: key === "staff" ? "staff" : "student" })
        : await db.count(p.entity);
    } catch { counts[key] = 0; }
  }

  const mods = profile.modules || {};
  return {
    steps: WIZARD_STEPS,
    missing: missingSteps(profile),
    profile: {
      identity: profile.identity,
      vocab: profile.vocab,
      roles: profile.roles,
      modules: mods,
      year: profile.year,
      inventoryAreas: profile.inventoryAreas,
      texts: profile.texts,
    },
    /* ⚠ הקטלוג נשלח למסך כדי שהאשף יציג **מה זה נותן** ולא
       רק שם מודול. זה מה שמנהל מכינה קורא לפני שהוא מחליט. */
    catalog: Object.fromEntries(Object.entries(MODULE_CATALOG).map(([k, m]) => [k, {
      title: m.title, why: m.why, core: Boolean(m.core),
      /* ⚠ מודול שטרם נבנו מסכיו **מוצג ואינו ניתן להדלקה**
         — ראו ההערה על `built` ב-core/catalog.js. */
      built: Boolean(m.built),
      needs: m.needs || [],
      screens: (m.screens || []).map((s) => s.title),
      private: Boolean(m.private),
    }])),
    active: activeModules(mods),
    screens: activeScreens(mods),
    suggestedRoles: suggestedRoles(mods),
    vocabKeys: VOCAB_KEYS,
    importers: Object.fromEntries(Object.entries(PARSERS).map(([k, p]) => [k, {
      title: p.title, hint: p.hint, example: p.example, columns: p.columns,
      have: counts[k] || 0,
    }])),
  };
}

/* ============================================================
   שמירת שלב
   ⚠ **נבדק לפני שנכתב.** מסמך פסול שנכתב לקובץ מפיל את
     האפליקציה בטעינה הבאה, ואז אין מסך שדרכו מתקנים אותו.
   ============================================================ */
const STEP_FIELDS = {
  identity: ["identity"],
  vocab: ["vocab"],
  roles: ["roles"],
  modules: ["modules"],
  year: ["year", "inventoryAreas"],
  texts: ["texts"],
};

export async function save({ body, tenant }) {
  const step = String(body?.step || "");
  const fields = STEP_FIELDS[step];
  if (!fields) throw new DataError(`שלב לא מוכר: ${step}`);

  const patch = {};
  for (const f of fields) if (body[f] !== undefined) patch[f] = body[f];
  if (!Object.keys(patch).length) throw new DataError("לא נשלח דבר לשמירה");

  const current = tenant.readDelta();
  const next = { ...current, preset: current.preset || "premil" };
  for (const [k, v] of Object.entries(patch)) {
    /* ⚠ מיזוג רדוד לשדה, כדי ששמירת «צבעים» לא תמחק «שם». */
    next[k] = (v && typeof v === "object" && !Array.isArray(v))
      ? { ...(current[k] || {}), ...v } : v;
  }

  const merged = resolveProfile(presetOf(next), next);
  const v = validateProfile(merged);
  if (!v.ok) throw new DataError("האפיון אינו תקין: " + v.errors.join(" · "));

  tenant.writeDelta(next);
  tenant.invalidateProfile();
  const after = await tenant.loadProfile();

  return {
    ok: true, step,
    warnings: v.warnings,
    missing: missingSteps(after),
    /* ⚠ תפקידים שמסכיהם נחתכו בגלל מודול שכובה — מדווח ולא
       נעלם. אחרת התפקיד «אחראי מטבח» נשאר ברשימה בלי אף מסך. */
    roleScreens: (after.roles || []).map((r) => ({
      slug: r.slug, screens: roleScreens(r, after.modules),
    })),
  };
}

/* ============================================================
   ייבוא — שני מסלולים נפרדים
   ============================================================ */
function parseOrThrow(kind, text) {
  const p = PARSERS[kind];
  if (!p) throw new DataError(`סוג ייבוא לא מוכר: ${kind}`);
  if (!String(text || "").trim()) throw new DataError("לא הודבק דבר");
  return { p, ...p.parse(text) };
}

/** ⚠ **אינו כותב דבר.** */
export async function preview({ body, db }) {
  const kind = String(body?.kind || "");
  const { p, rows, bad, header } = parseOrThrow(kind, body?.text);

  /* מה מתוך מה שהודבק כבר קיים */
  const existing = [];
  for (const r of rows) {
    const key = p.key(r);
    const where = p.entity === "person"
      ? (r.nationalId ? { nationalId: r.nationalId } : { name: r.name })
      : keyWhere(p, r);
    const hit = where ? await db.find(p.entity, where) : null;
    if (hit) existing.push(key);
  }

  return {
    kind, title: p.title, columns: p.columns,
    rows: rows.slice(0, 200),
    total: rows.length,
    bad,
    /* ⚠ שורת הכותרות **מדווחת ואינה מושמטת בשקט** — מי שרואה
       «ייכתבו 3» על קובץ בן ארבע שורות צריך לדעת למה. */
    header,
    existing,
    /* ⚠ מוצג במפורש: כמה ייכתבו וכמה ידולגו. «נוסיף 33» כשבפועל
       נוספים 20 הוא ההבדל בין אמון לחוסר אמון במסך. */
    willCreate: rows.length - existing.length,
    willSkip: existing.length,
  };
}

function keyWhere(p, r) {
  if (p.entity === "calendarDay") return { date: r.date };
  if (p.entity === "course") return { subject: r.subject };
  if (p.entity === "team") return { name: r.name };
  return null;
}

/** ⚠ כותב. הוא זה שמאחורי כפתור «אישור». */
export async function commit({ body, db, user }) {
  const kind = String(body?.kind || "");
  const { p, rows, bad, header } = parseOrThrow(kind, body?.text);

  const created = [], skipped = [], failed = [];

  for (const r of rows) {
    const key = p.key(r);
    try {
      const where = p.entity === "person"
        ? (r.nationalId ? { nationalId: r.nationalId } : { name: r.name })
        : keyWhere(p, r);
      const hit = where ? await db.find(p.entity, where) : null;
      if (hit) { skipped.push(key); continue; }

      const { _roleText, ...fields } = r;
      const row = await db.create(p.entity, fields);
      created.push(key);

      /* ⚠ תפקיד שהוקלד בעמודה מתורגם ל-slug **רק אם הוא מוכר**.
         טקסט חופשי שאינו מתאים לאף תפקיד מדווח ואינו יוצר
         תפקיד מומצא. */
      if (_roleText) {
        const slug = matchRole(_roleText);
        if (slug) await db.create("roleAssignment", { person: row.id, role: slug });
        else failed.push({ key, why: `התפקיד «${_roleText}» אינו מוכר — נוצר בלי תפקיד` });
      }
    } catch (e) {
      /* ⚠⚠ **שורה שהמסד דחה מוצגת בנפרד משורה שהפרסור דחה.**
         הראשונה עברה פרסור והמסד סירב — וזה קורה באמת. בלי
         ההפרדה שתיהן נראות כמו «לא נקלטה». */
      failed.push({ key, why: e.message });
    }
  }

  return {
    ok: true, kind,
    created: created.length, skipped: skipped.length,
    bad, failed, header,
    /* ⚠ הסכום מוצג כדי שהמנהל יוכל להשוות למה שהדביק. */
    pasted: rows.length + bad.length,
  };
}

function matchRole(text) {
  const t = String(text).trim();
  for (const [slug, r] of Object.entries(ROLE_CATALOG)) {
    if (r.label === t) return slug;
  }
  /* התאמה רכה — «מדריכה» ל«מדריך» */
  for (const [slug, r] of Object.entries(ROLE_CATALOG)) {
    if (t.startsWith(r.label.slice(0, 4))) return slug;
  }
  return null;
}

/* ============================================================
   פתיחת חשבון לאדם שכבר במצבה
   ⚠ **הסיסמה אינה מוחזרת ואינה נשמרת.** מוחזר קוד חד-פעמי
     שהמנהל מוסר, והמשתמש בוחר סיסמה בכניסה הראשונה.
     בגרסה הזו — לשם הפשטות — נקבעת סיסמה זמנית ומוצגת פעם
     אחת. ⚠ זה מקובל **רק כל עוד אין לקוחות אמיתיים**, וזה
     רשום כאן כדי שלא יישכח.
   ============================================================ */
export async function invite({ body, db }) {
  const personId = String(body?.person || "");
  const person = await db.get("person", personId);
  if (!person) throw new DataError("האדם אינו נמצא", 404);

  const existing = await db.find("account", { person: personId });
  if (existing) throw new DataError("כבר יש לאדם הזה חשבון", 409);

  const username = String(body?.username || "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new DataError("שם המשתמש חייב להיות 3–32 תווים באנגלית");
  }

  const temp = Math.random().toString(36).slice(2, 10);
  await db.create("account", {
    person: personId, username,
    passwordHash: await hashPassword(temp),
    loginEmail: person.email || null,
  });

  return { ok: true, username, tempPassword: temp, name: person.name };
}
