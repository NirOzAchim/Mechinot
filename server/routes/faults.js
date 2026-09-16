/* ============================================================
   תקלות ובעיות
   ------------------------------------------------------------
   ⚠⚠⚠ **הרשימה פתוחה לכל המכינה, בקריאה.** זו אינה הקלה —
     זו כל התכלית. כשחניך ראה רק את מה שהוא דיווח, המערכת
     ייצרה בדיוק את הבעיה שהיא נועדה לפתור: שמונה דיווחים
     נפרדים על אותו מזגן. מי שרואה שכבר דיווחו, לא מדווח שוב.

   ⚠⚠ **ושם המדווח אינו יוצא לחניכים.** די בכותרת ובמקום.
     שם על כל שורה הופך את הרשימה מ«מה שבור במכינה» ל«מי
     דיווח על מה» — וזה יומן, לא רשימת תקלות. **לצוות כן**:
     תקלה שאי אפשר לשאול עליה היא תקלה שאי אפשר לשחזר.

   ⚠ **«שלי» מסומן בתוך הרשימה ולא ברשימה שנייה.** רשימה
     שנייה הייתה מציגה את אותה תקלה פעמיים.

   ⚠⚠ **המדווח עורך עד שטופל, ומוחק רק כל עוד פתוחה.** ברגע
     שמישהו התחיל לטפל, הדיווח כבר אינו רק שלו — מחיקה שלו
     מוחקת גם את העבודה שנעשתה עליו.

   ⚠ **ושדות הטיפול הם של הצוות.** סטטוס, עלות, תאריך סיום
     והערות — השרת **מתעלם מהם** במסלול של המדווח גם אם
     נשלחו, ואינו נכשל: הוא מדווח מה באמת השתנה.
   ============================================================ */

import { DataError } from "../data/store.js";
import { screensOf } from "../auth.js";
import { STATUSES, statusOf, isClosed, statusLabel } from "../../core/faults.js";

/** ⚠ מי מטפל: בעל המסך `faults-admin`, ולא «כל איש צוות». */
function mayHandle(profile, user) {
  if (user.isRoot) return true;
  const s = screensOf(profile, user);
  return s.includes("*") || s.includes("faults-admin");
}

/* ⚠⚠ שני מיפויים נפרדים ולא סינון של אחד. שדה שיתווסף
   לתצוגת הצוות לא ימצא את דרכו לצד החניך מעצמו. */
const publicView = (f, profile) => ({
  id: f.id,
  title: f.title,
  place: f.place || null,
  detail: f.detail || null,
  urgent: Boolean(f.urgent),
  status: statusOf(f.status),
  statusLabel: statusLabel(profile, f.status),
  closed: isClosed(f.status),
  reportedAt: f.reportedAt || null,
  doneAt: f.doneAt || null,
});

const staffView = (f, profile, nameOf) => ({
  ...publicView(f, profile),
  by: f.reportedBy ? nameOf(f.reportedBy) : null,
  byId: f.reportedBy || null,
  /* ⚠ העלות היא נתון תפעולי של הצוות ואינה יוצאת לחניך:
     «המקרר עלה 1,400 ₪» אינו מידע שמונע דיווח כפול. */
  cost: f.cost ?? null,
  notes: f.notes || null,
});

export async function list({ db, user, profile }) {
  const handler = mayHandle(profile, user);
  const rows = await db.list("fault");

  let nameOf = () => null;
  if (user.isStaff || handler) {
    const people = await db.list("person");
    const map = new Map(people.map((p) => [p.id, p.name]));
    nameOf = (id) => map.get(id) || null;
  }

  const full = user.isStaff || handler;

  const faults = rows
    .map((f) => ({
      ...(full ? staffView(f, profile, nameOf) : publicView(f, profile)),
      /* ⚠ **`mine` נגזר בשרת ונשלח.** השוואת שמות בלקוח הייתה
         נשברת ביום שמישהו משנה את שמו, וכפתור המחיקה היה
         מופיע על שורה של מישהו אחר. */
      mine: Boolean(user.personId && f.reportedBy === user.personId),
      /* ⚠ **`canEdit` מהשרת ואינו נגזר במסך** — כפתור שמופיע
         ומקבל 403 אחרי שהמשתמש כבר הקליד הוא בדיוק מה שהכלל
         הזה נועד למנוע. */
      canEdit: handler ||
        Boolean(user.personId && f.reportedBy === user.personId && !isClosed(f.status)
          && statusOf(f.status) === "open"),
      canDelete: handler ||
        Boolean(user.personId && f.reportedBy === user.personId && statusOf(f.status) === "open"),
      canHandle: handler,
    }))
    /* דחוף ראשון, ואז החדש ביותר */
    .sort((a, b) =>
      (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) ||
      String(b.reportedAt || "").localeCompare(String(a.reportedAt || "")));

  const open = faults.filter((f) => !f.closed);

  return {
    faults,
    canHandle: handler,
    /* ⚠ המונה נשלח כדי שהמסך לא יספור בעצמו — שני חישובים
       של אותו מספר מתפצלים בתיקון הראשון. */
    counts: {
      open: open.length,
      urgent: open.filter((f) => f.urgent).length,
      total: faults.length,
    },
    statuses: STATUSES.map((s) => ({ ...s, label: statusLabel(profile, s.slug) })),
    /* ⚠ המקומות נגזרים ממה שכבר הוקלד ואינם רשימה בקוד:
       מכינה אחת אומרת «חדר 4» ושנייה «צריף ב׳», ורשימה
       סגורה הייתה דוחפת את כולן ל«אחר». */
    places: [...new Set(rows.map((f) => f.place).filter(Boolean))].sort(),
  };
}

export async function create({ db, user, body }) {
  const title = String(body?.title || "").trim();
  if (!title) throw new DataError("צריך לכתוב מה התקלה");
  if (title.length > 120) throw new DataError("הכותרת ארוכה מ-120 תווים");

  const row = await db.create("fault", {
    title,
    place: String(body?.place || "").trim() || null,
    detail: String(body?.detail || "").trim() || null,
    urgent: Boolean(body?.urgent),
    status: "open",
    reportedBy: user.personId || null,
    reportedAt: new Date().toISOString(),
  });

  return { ok: true, id: row.id };
}

export async function update({ db, user, body, profile }) {
  const f = await db.get("fault", String(body?.id || ""));
  if (!f) throw new DataError("התקלה אינה קיימת", 404);

  const handler = mayHandle(profile, user);
  const mine = Boolean(user.personId && f.reportedBy === user.personId);

  if (!handler && !mine) {
    /* ⚠ 404 ולא 403 — 403 מאשר שהשורה קיימת. */
    throw new DataError("התקלה אינה קיימת", 404);
  }
  if (!handler && statusOf(f.status) !== "open") {
    throw new DataError(
      "התקלה כבר בטיפול ואי אפשר לערוך אותה — אפשר להוסיף פרטים למי שמטפל", 409);
  }

  const patch = {};
  const changed = [];

  /* ---- מה שהמדווח עורך ---- */
  for (const [key, label] of [["title", "הכותרת"], ["place", "המקום"],
    ["detail", "הפירוט"]]) {
    if (body?.[key] !== undefined) {
      const v = String(body[key] || "").trim() || null;
      if (v !== (f[key] || null)) { patch[key] = v; changed.push(label); }
    }
  }
  if (body?.urgent !== undefined && Boolean(body.urgent) !== Boolean(f.urgent)) {
    patch.urgent = Boolean(body.urgent);
    changed.push("הדחיפות");
  }
  if (patch.title === null) throw new DataError("צריך לכתוב מה התקלה");

  /* ---- מה שרק הצוות עורך ----
     ⚠ **מתעלמים בשקט ואין 403**, כי לקוח ישן עשוי לשלוח את
     האובייקט כולו; מה שהשתנה בפועל מוחזר, ולכן המסך אומר
     אמת גם כשלא הכול נכתב. */
  let closedNow = false;
  if (handler) {
    if (body?.status !== undefined) {
      const next = statusOf(body.status);
      if (!next) throw new DataError(`«${body.status}» אינו מצב מוכר`);
      if (next !== f.status) {
        patch.status = next;
        changed.push("המצב");
        /* ⚠ **תאריך הסגירה נחתם מעצמו** כשאין תאריך שאדם
           הקליד, ונמחק אם התקלה נפתחה מחדש. תאריך שאדם
           הקליד אינו נדרס לעולם. */
        if (isClosed(next)) {
          closedNow = true;
          if (!f.doneAt && body?.doneAt === undefined) {
            patch.doneAt = new Date().toISOString().slice(0, 10);
          }
        } else if (isClosed(f.status)) {
          patch.doneAt = null;
        }
      }
    }
    if (body?.notes !== undefined) {
      const v = String(body.notes || "").trim() || null;
      if (v !== (f.notes || null)) { patch.notes = v; changed.push("ההערות"); }
    }
    if (body?.cost !== undefined) {
      /* ⚠ **ריק אינו אפס.** 0 הוא «לא עלה כלום», וריק הוא
         «לא יודעים כמה». מחרוזת ריקה מחזירה ל«לא יודעים». */
      const raw = String(body.cost ?? "").trim();
      const v = raw === "" ? null : Number(raw);
      if (v !== null && !Number.isFinite(v)) throw new DataError("העלות אינה מספר");
      if (v !== (f.cost ?? null)) { patch.cost = v; changed.push("העלות"); }
    }
    if (body?.doneAt !== undefined) {
      const v = String(body.doneAt || "").trim() || null;
      if (v !== (f.doneAt || null)) { patch.doneAt = v; changed.push("תאריך הסיום"); }
    }
  }

  if (!changed.length) return { ok: true, changed: [], same: true };

  await db.update("fault", f.id, patch);
  /* ⚠ מוחזר **מה השתנה בפועל** ולא «נשמר». שדה שנשלח זהה
     לקיים אינו שינוי, והמסך אומר אמת. */
  return { ok: true, changed, closedNow };
}

export async function remove({ db, user, body, profile }) {
  const f = await db.get("fault", String(body?.id || ""));
  if (!f) throw new DataError("התקלה אינה קיימת", 404);

  const handler = mayHandle(profile, user);
  const mine = Boolean(user.personId && f.reportedBy === user.personId);

  if (!handler && !mine) throw new DataError("התקלה אינה קיימת", 404);
  if (!handler && statusOf(f.status) !== "open") {
    throw new DataError(
      "התקלה כבר בטיפול — אי אפשר למחוק אותה, אפשר לבקש ממי שמטפל לסגור", 409);
  }

  await db.remove("fault", f.id);
  return { ok: true };
}
