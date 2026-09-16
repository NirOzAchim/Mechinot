/* ============================================================
   לוח המודעות והציטוט היומי
   ------------------------------------------------------------
   ⚠⚠⚠ **הקהל הוא הרשאת קריאה בשרת ולא סינון בתצוגה.** מודעה
     ל«צוות» אינה בגוף התשובה של חניך כלל. סינון בתצוגה נראה
     זהה על המסך, ונפתח לגמרי בכלי הפיתוח.

   ⚠⚠ **תפוגה היא שדה ולא מחיקה.** מודעה שפג תוקפה יורדת
     מהלוח ונשארת בארכיון — לוח שמוחק את עצמו אינו יכול
     לענות על «מה בעצם נאמר אז», וזו השאלה שבגללה יש לוח.

   ⚠ **«נעוץ» הוא של ראש המכינה בלבד.** אחרת כל מודעה תהיה
     נעוצה תוך שבוע, והנעיצה תפסיק לומר משהו.

   ⚠ **ומי מפרסם נקבע לפי מה נאמר** — ראו core/board.js.
   ============================================================ */

import { DataError } from "../data/store.js";
import { todayISO } from "../../core/dates.js";
import {
  KINDS, AUDIENCES, kindOf, kindLabel, kindIcon,
  mayPost, mayTarget, visibleTo, quoteOfDay,
} from "../../core/board.js";

const isHead = (u) => u.isRoot || u.roles?.includes("head");

/** ⚠ בעל תפקיד הוא כל מי שהוענק לו תפקיד כלשהו מעבר לבסיס. */
const hasRole = (u) => Boolean(u.isRoot || (u.roles || []).length);

const view = (n, profile, nameOf) => ({
  id: n.id,
  title: n.title,
  body: n.body || null,
  kind: n.kind,
  kindLabel: kindLabel(profile, n.kind),
  icon: kindIcon(n.kind),
  audience: n.audience || "all",
  pinned: Boolean(n.pinned),
  at: n.at || null,
  expiresAt: n.expiresAt || null,
  /* ⚠ **שם המפרסם יוצא כאן, במכוון** — «מי איבד» ו«מי ממליץ»
     הם חצי מהערך של המודעה, ומודעה בלי שם היא הודעה שאי
     אפשר לענות לה. זה ההפך מרשימת התקלות, ומאותו נימוק:
     שם שם הוא מעקב, וכאן הוא הנמען. */
  by: n.by ? nameOf(n.by) : null,
  byId: n.by || null,
});

export async function list({ db, user, profile, query }) {
  const today = todayISO(profile.structure?.timezone);
  const archive = query.archive === "1";

  const rows = await db.list("notice");
  const people = await db.list("person");
  const nameOf = (id) => people.find((p) => p.id === id)?.name || null;

  /* ⚠⚠ הסינון לפי קהל קורה **לפני** המיפוי ולא אחריו: מה
     שאינו לאדם הזה אינו הופך לאובייקט בכלל. */
  const allowed = rows.filter((n) => visibleTo(n, { isStaff: user.isStaff }));

  const live = allowed.filter((n) => !n.expiresAt || n.expiresAt >= today);
  const expired = allowed.filter((n) => n.expiresAt && n.expiresAt < today);

  const sort = (a, b) =>
    (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
    String(b.at || "").localeCompare(String(a.at || ""));

  const notices = (archive ? expired : live)
    .map((n) => {
      const v = view(n, profile, nameOf);
      return {
        ...v,
        mine: Boolean(user.personId && n.by === user.personId),
        /* ⚠ **נגזר בשרת ונשלח.** מי שמחק מודעה של מישהו אחר
           מקבל 404, וכפתור שמופיע ואז נכשל הוא בדיוק מה
           שהכלל הזה נועד למנוע. */
        canEdit: Boolean(user.isRoot || isHead(user) ||
          (user.personId && n.by === user.personId)),
      };
    })
    .sort(sort);

  /* ---- הציטוט של היום ---- */
  const quotes = await db.list("quote");
  const today_ = quoteOfDay(quotes, today);

  return {
    notices,
    archive,
    expiredCount: expired.length,
    /* ⚠ **מה מותר לי לפרסם, מהשרת.** המסך מציג את הסוגים
       האלה בלבד — טופס שמציע סוג שיידחה הוא 403 אחרי
       שהמשתמש כבר הקליד. */
    canPost: KINDS
      .filter((k) => mayPost(k.slug, { isStaff: user.isStaff, hasRole: hasRole(user) }))
      .map((k) => ({ slug: k.slug, label: kindLabel(profile, k.slug), icon: k.icon })),
    audiences: AUDIENCES
      .filter((a) => mayTarget(a, { isStaff: user.isStaff }))
      .map((a) => ({ slug: a, label: audienceLabel(a) })),
    canPin: isHead(user),
    quote: today_
      ? {
        id: today_.id, text: today_.text, author: today_.author || null,
        by: today_.addedBy ? nameOf(today_.addedBy) : null,
      }
      : null,
    quoteCount: quotes.length,
  };
}

const audienceLabel = (a) =>
  a === "staff" ? "לצוות בלבד" : a === "students" ? "לחניכים" : "לכל המכינה";

export async function create({ db, user, body, profile }) {
  const kind = kindOf(body?.kind);
  if (!kind) throw new DataError("צריך לבחור סוג מודעה");
  if (!mayPost(kind, { isStaff: user.isStaff, hasRole: hasRole(user) })) {
    /* ⚠ ההודעה אומרת **מה כן מותר** ולא «אין הרשאה» — מי
       שנחסם צריך לדעת מה לעשות במקום. */
    throw new DataError(
      "מודעה מהסוג הזה מפרסמים בעלי תפקיד ואנשי צוות. " +
      "אבידה, מציאה והמלצה פתוחות לכולם.", 403);
  }

  const audience = String(body?.audience || "all");
  if (!mayTarget(audience, { isStaff: user.isStaff })) {
    throw new DataError("אפשר לפרסם לכל המכינה או לחניכים", 403);
  }

  const title = String(body?.title || "").trim();
  if (!title) throw new DataError("צריך כותרת למודעה");
  if (title.length > 120) throw new DataError("הכותרת ארוכה מ-120 תווים");

  const row = await db.create("notice", {
    title,
    body: String(body?.body || "").trim() || null,
    kind,
    audience,
    by: user.personId || null,
    at: new Date().toISOString(),
    expiresAt: String(body?.expiresAt || "").trim() || null,
    /* ⚠ נעיצה של מי שאינו ראש המכינה נבלעת ואינה נכשלת —
       היא אינה חלק ממה שביקש לפרסם. */
    pinned: isHead(user) ? Boolean(body?.pinned) : false,
  });

  return { ok: true, id: row.id };
}

export async function update({ db, user, body, profile }) {
  const n = await db.get("notice", String(body?.id || ""));
  /* ⚠ 404 גם כשהיא של מישהו אחר — 403 מאשר שהשורה קיימת. */
  if (!n || !visibleTo(n, { isStaff: user.isStaff })) {
    throw new DataError("המודעה אינה קיימת", 404);
  }
  const mine = Boolean(user.personId && n.by === user.personId);
  if (!mine && !isHead(user)) throw new DataError("המודעה אינה קיימת", 404);

  const patch = {};
  if (body?.title !== undefined) {
    const v = String(body.title || "").trim();
    if (!v) throw new DataError("צריך כותרת למודעה");
    patch.title = v;
  }
  if (body?.body !== undefined) patch.body = String(body.body || "").trim() || null;
  if (body?.expiresAt !== undefined) {
    patch.expiresAt = String(body.expiresAt || "").trim() || null;
  }
  /* ⚠⚠ **הסוג נאכף גם בעריכה.** בלי זה אפשר לפרסם «המלצה»
     ואז לשנות ל«הודעה» בשתי בקשות במקום באחת. */
  if (body?.kind !== undefined) {
    const kind = kindOf(body.kind);
    if (!kind) throw new DataError("סוג מודעה אינו מוכר");
    if (!mayPost(kind, { isStaff: user.isStaff, hasRole: hasRole(user) })) {
      throw new DataError("מודעה מהסוג הזה מפרסמים בעלי תפקיד ואנשי צוות", 403);
    }
    patch.kind = kind;
  }
  if (body?.audience !== undefined) {
    const a = String(body.audience);
    if (!mayTarget(a, { isStaff: user.isStaff })) {
      throw new DataError("אפשר לפרסם לכל המכינה או לחניכים", 403);
    }
    patch.audience = a;
  }
  if (body?.pinned !== undefined) {
    if (!isHead(user)) throw new DataError("נעיצת מודעה שמורה לראש המכינה", 403);
    patch.pinned = Boolean(body.pinned);
  }

  await db.update("notice", n.id, patch);
  return { ok: true };
}

export async function remove({ db, user, body }) {
  const n = await db.get("notice", String(body?.id || ""));
  if (!n || !visibleTo(n, { isStaff: user.isStaff })) {
    throw new DataError("המודעה אינה קיימת", 404);
  }
  const mine = Boolean(user.personId && n.by === user.personId);
  if (!mine && !isHead(user)) throw new DataError("המודעה אינה קיימת", 404);

  await db.remove("notice", n.id);
  return { ok: true };
}

/* ============================================================
   הציטוטים
   ⚠ **בנק שכל חניך מוסיף לו.** בנק שרק הצוות ממלא מחזיק
     עשרה ציטוטים ומפסיק להתחדש.
   ============================================================ */
export async function quotes({ db, user, profile }) {
  const rows = await db.list("quote");
  const people = await db.list("person");
  const nameOf = (id) => people.find((p) => p.id === id)?.name || null;
  const today = todayISO(profile.structure?.timezone);
  const pick = quoteOfDay(rows, today);

  return {
    todayId: pick?.id || null,
    quotes: rows
      .map((q) => ({
        id: q.id,
        text: q.text,
        author: q.author || null,
        by: q.addedBy ? nameOf(q.addedBy) : null,
        at: q.at || null,
        mine: Boolean(user.personId && q.addedBy === user.personId),
        canDelete: Boolean(isHead(user) || (user.personId && q.addedBy === user.personId)),
      }))
      .sort((a, b) => String(b.at || "").localeCompare(String(a.at || ""))),
  };
}

export async function quoteAdd({ db, user, body }) {
  const text = String(body?.text || "").trim();
  if (!text) throw new DataError("צריך לכתוב את הציטוט");
  if (text.length > 600) throw new DataError("הציטוט ארוך מ-600 תווים");

  const row = await db.create("quote", {
    text,
    author: String(body?.author || "").trim() || null,
    addedBy: user.personId || null,
    at: new Date().toISOString(),
  });
  return { ok: true, id: row.id };
}

export async function quoteRemove({ db, user, body }) {
  const q = await db.get("quote", String(body?.id || ""));
  if (!q) throw new DataError("הציטוט אינו קיים", 404);
  const mine = Boolean(user.personId && q.addedBy === user.personId);
  if (!mine && !isHead(user)) throw new DataError("הציטוט אינו קיים", 404);
  await db.remove("quote", q.id);
  return { ok: true };
}
