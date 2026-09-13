/* ============================================================
   הקונסולה — ניהול כל המכינות
   ------------------------------------------------------------
   ⚠⚠ **זה מוצר שלישי ולא מסך נוסף באפליקציה.** הוא רואה את
     **כל** המכינות, ולכן אילו הוא היה מסך בתוך אחת מהן, כל
     באג הרשאה שם היה באג חוצה-לקוחות. נתיב נפרד, עוגייה
     נפרדת, זהות נפרדת, וקובץ נתיבים נפרד.

   ⚠⚠ **אף נקודת קצה כאן אינה נוגעת בנתוני חניכים.** הקונסולה
     יודעת **כמה** חניכים יש, לא מי הם. מי שרוצה להסתכל בתוך
     מכינה נכנס לאפליקציה שלה — וזה נרשם. הפרדה בין «ניהול
     המוצר» לבין «צפייה בנתונים» היא מה שהופך את הראשון
     לבטוח.

   ⚠ **מכינה אחת שנופלת אינה מפילה את הרשימה.** כל שורה
     נטענת בנפרד (`mechinaSummary`) ומדווחת `ok:false` עם
     הסיבה — כי המכינה השבורה היא בדיוק זו שצריך לראות.
   ============================================================ */

import {
  listMechinot, getMechina, createMechina, updateMechina, deleteMechina,
  mechinaSummary, tenant, forgetTenant, slugProblem, suggestSlug,
  setRootEntries, PRESET_NAMES, TenantError,
} from "../tenants.js";
import {
  rootExists, writeRoot, rootLogin, signRoot, setRootCookie, clearRootCookie,
  RootError,
} from "../root.js";
import { hashPassword, passwordProblem, USER_RE, normalizeUser } from "../auth.js";

/* ============================================================
   המצב — נקרא בלי התחברות, ובכוונה
   ⚠ הוא עונה על שתי שאלות בלבד: **האם יש בכלל מנהל-על**,
     ו**האם אני מחובר**. שתיהן נחוצות כדי לדעת איזה מסך
     להציג, ואף אחת מהן אינה מגלה דבר על המכינות.
   ============================================================ */
export async function state({ root }) {
  const configured = rootExists();
  if (!root) {
    return { configured, signedIn: false, mechinot: null };
  }

  const rows = listMechinot();
  const mechinot = [];
  for (const m of rows) mechinot.push(await mechinaSummary(m));

  return {
    configured: true,
    signedIn: true,
    user: root.username,
    presets: PRESET_NAMES,
    mechinot,
    totals: {
      all: mechinot.length,
      live: mechinot.filter((m) => !m.archived).length,
      needsSetup: mechinot.filter((m) => m.ok && m.setupNeeded?.length).length,
      broken: mechinot.filter((m) => !m.ok).length,
    },
  };
}

/* ============================================================
   הקמת מנהל-העל הראשון
   ------------------------------------------------------------
   ⚠⚠ **רק מ-localhost, ורק כשאין עדיין חשבון.** שרת שעולה
     לרשת בלי מנהל-על הוא שרת שהראשון שמצא אותו הופך לבעליו.
     הדרך המתועדת היא `npm run root` בשרת עצמו; המסלול הזה
     קיים כדי שהתקנה מקומית לא תדרוש לפתוח טרמינל שני.

   ⚠ **ואין «איפוס סיסמה».** מנוע איפוס למנהל-על הוא משטח
     התקפה שכל תכליתו לחסוך פקודה אחת בשרת.
   ============================================================ */
const isLoopback = (req) => {
  const a = req.socket?.remoteAddress || "";
  return a === "127.0.0.1" || a === "::1" || a === "::ffff:127.0.0.1";
};

export async function setup({ req, res, body }) {
  if (rootExists()) {
    throw new RootError("כבר יש מנהל-על. איפוס נעשה בשרת בלבד", 409);
  }
  if (!isLoopback(req)) {
    throw new RootError("הקמת מנהל-על אפשרית מהמחשב שהשרת רץ עליו בלבד", 403);
  }
  const username = normalizeUser(body?.user);
  const password = String(body?.password || "");
  if (!USER_RE.test(username)) {
    throw new RootError("שם המשתמש: אנגלית קטנה, 3–32 תווים", 400);
  }
  const bad = passwordProblem(password);
  if (bad) throw new RootError(bad, 400);

  await writeRoot({ username, password });
  setRootCookie(res, signRoot(username));
  console.log(`\n  ✓ נוצר מנהל-על: ${username}\n`);
  return { ok: true, user: username };
}

export async function login({ res, body }) {
  const who = await rootLogin(body?.user, body?.password);
  /* ⚠ אותה הודעה לכל כישלון — ראו server/root.js. */
  if (!who) throw new RootError("שם המשתמש או הסיסמה שגויים", 401);
  setRootCookie(res, signRoot(who.username));
  return { ok: true, user: who.username };
}

export async function logout({ res }) {
  clearRootCookie(res);
  return { ok: true };
}

/* ============================================================
   מכינה חדשה
   ------------------------------------------------------------
   ⚠⚠ **מכינה בלי חשבון היא מכינה שאי אפשר להיכנס אליה.**
     היצירה כוללת את ראש המכינה, ולא «קודם ניצור ואז נזמין»:
     שלב שני שמישהו צריך לזכור הוא שלב שיישכח, ואז יש בקונסולה
     מכינה שנראית תקינה ואי אפשר לפתוח אותה.

   ⚠ **האפיון נשאר ריק במכוון.** מה שנשמר הוא שם למרשם בלבד;
     `identity.name` נשאר ריק כדי שהאשף ייפתח מעצמו על שלב 1.
     מנהל שנכנס וכבר הכול מוגדר לא ילמד איפה משנים דברים.
   ============================================================ */
export async function create({ body }) {
  const name = String(body?.name || "").trim();
  const slug = String(body?.slug || "").trim() || suggestSlug(name);
  const preset = String(body?.preset || "premil");

  const problem = slugProblem(slug);
  if (problem) throw new TenantError(problem, 400);

  const headName = String(body?.headName || "").trim();
  const username = normalizeUser(body?.username);
  const password = String(body?.password || "");

  if (!headName) throw new TenantError("חסר שם ראש המכינה", 400);
  if (!USER_RE.test(username)) {
    throw new TenantError("שם המשתמש: אנגלית קטנה, 3–32 תווים", 400);
  }
  const bad = passwordProblem(password);
  if (bad) throw new TenantError(bad, 400);

  const entry = createMechina({ slug, name, preset });

  /* ⚠ מכאן והלאה המכינה קיימת במרשם. כישלון בכתיבת החשבון
     ישאיר אותה ריקה — ולכן היא **נמחקת בחזרה** ולא נשארת
     כשורה שאי אפשר להיכנס אליה ואיש לא יודע למה. */
  try {
    const t = tenant(slug);
    t.writeDelta({ preset, identity: {} });
    const head = await t.db.create("person", {
      kind: "staff", name: headName, active: true,
    });
    await t.db.create("account", {
      person: head.id, username, passwordHash: await hashPassword(password),
    });
    await t.db.create("roleAssignment", { person: head.id, role: "head" });
  } catch (e) {
    try { deleteMechina(slug, { confirm: slug }); } catch { /* כבר דווח */ }
    throw new TenantError(`המכינה לא נוצרה: ${e.message}`, 500);
  }

  return {
    ok: true,
    mechina: await mechinaSummary(getMechina(slug)),
    url: `/m/${slug}/`,
    account: { username },
  };
}

/** שינוי שם, הערות, ארכוב — ⚠ לא ה-slug. ראו server/tenants.js. */
export async function update({ body }) {
  const slug = String(body?.slug || "");
  const m = updateMechina(slug, body || {});
  forgetTenant(slug);
  return { ok: true, mechina: await mechinaSummary(m) };
}

/**
 * ⚠⚠ מחיקה דורשת הקלדת ה-slug, והנתונים עוברים לסל ולא
 *   נמחקים. מכינה היא שנה של נוכחות ובקשות ותיקי חניכים,
 *   ואין «בטל».
 */
export async function remove({ body }) {
  const slug = String(body?.slug || "");
  const out = deleteMechina(slug, { confirm: String(body?.confirm || "") });
  return { ok: true, ...out };
}

/* ============================================================
   חשבון נוסף במכינה
   ⚠ קיים כדי שמכינה שאיבדה את ראש המכינה שלה לא תהיה נעולה
     לנצח. זו פעולת תמיכה ולא ניהול שוטף — ההזמנות הרגילות
     נעשות **בתוך** האפליקציה, באשף.
   ============================================================ */
export async function account({ body }) {
  const slug = String(body?.slug || "");
  const t = tenant(slug);

  const name = String(body?.name || "").trim();
  const username = normalizeUser(body?.username);
  const password = String(body?.password || "");
  const role = String(body?.role || "head");

  if (!name) throw new TenantError("חסר שם", 400);
  if (!USER_RE.test(username)) {
    throw new TenantError("שם המשתמש: אנגלית קטנה, 3–32 תווים", 400);
  }
  const bad = passwordProblem(password);
  if (bad) throw new TenantError(bad, 400);

  /* ⚠ שם משתמש תפוס נחסם **ברעש** — חשבון שני על אותו שם
     פירושו ששניים מתחברים לאותו מקום, ומי שמנצח הוא סדר
     השורות בקובץ. */
  if (await t.db.find("account", { username })) {
    throw new TenantError(`שם המשתמש «${username}» תפוס במכינה הזו`, 409);
  }

  const person = await t.db.create("person", { kind: "staff", name, active: true });
  await t.db.create("account", {
    person: person.id, username, passwordHash: await hashPassword(password),
  });
  await t.db.create("roleAssignment", { person: person.id, role });

  return { ok: true, username, name, role };
}

/* ============================================================
   כניסה לאפליקציה של מכינה
   ------------------------------------------------------------
   ⚠⚠ **נרשם, ולא רק מתאפשר.** עוגיית מנהל-העל תקפה בכל
     מכינה ממילא; הקריאה הזו קיימת כדי שתישאר **חותמת** של
     מתי נכנסתי ולאן. גישה של ספק לנתוני קטינים חייבת להיות
     ניתנת לשחזור, ואם היא לא נרשמת — היא לא קרתה.

   ⚠ **ומה שעדיין חסר, ונאמר:** המכינה עצמה אינה רואה את
     היומן. ביום שיהיה לקוח משלם זו דרישה ולא נחמדות.
   ============================================================ */
export async function enter({ body, root }) {
  const slug = String(body?.slug || "");
  const m = getMechina(slug);
  if (!m) throw new TenantError(`אין מכינה במזהה «${slug}»`, 404);

  const entries = Array.isArray(m.rootEntries) ? m.rootEntries : [];
  entries.unshift({ at: new Date().toISOString(), by: root.username });

  /* ⚠ מוגבל ל-50. יומן שגדל בלי גבול הופך קובץ מרשם של חמש
     שורות לקובץ של מגה-בייט, ואז כל טעינת קונסולה קוראת
     אותו — וזו טעינה שקורית הרבה. */
  setRootEntries(slug, entries.slice(0, 50));
  forgetTenant(slug);

  return { ok: true, url: `/m/${slug}/`, at: entries[0].at };
}
