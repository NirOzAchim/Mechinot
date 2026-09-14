/* ============================================================
   בקשות יציאה — המדריך ממליץ, ראש המכינה מכריע
   ------------------------------------------------------------
   ⚠⚠⚠ **החניך אינו רואה את השלבים בכלל.** יוצאת לו תשובה
     אחת — ממתין · מאושר · נדחה. לא מי המדריך שלו, לא מה הוא
     המליץ, ולא היכן הבקשה עומדת. **שני מיפויים מפורשים
     ונפרדים**, ולא סינון של אותו אובייקט, כדי ששדה חדש לא
     ידלוף לצד החניך מעצמו.

     הסיבה אינה טכנית: המלצה היא שלב פנימי, וחניך שיראה
     «המדריך המליץ לדחות» ינהל משא ומתן על החלטה שאינה סופית.

   ⚠⚠ **השלב נגזר ואינו נשמר.** אין עמודת «שלב» שיכולה
     לסתור את הנתונים. `stageOf()` הוא המקום היחיד.

   ⚠ **גם דחיית מדריך עוברת הלאה.** היא המלצה, לא הכרעה —
     ראש המכינה רואה את כל התמונה ורשאי להפוך אותה.

   ⚠ **ראש המכינה אינו כפוף לשלב.** הוא מכריע גם לפני
     שהמדריך המליץ, וההכרעה שלו סוגרת. השלב הראשון הוא סדר
     עבודה, לא שער. ההמלצה שדולגה **נשארת ריקה** ואינה
     מומצאת בדיעבד.

   ⚠ **שורות ההיעדרות נוצרות בהכרעה הסופית בלבד.** המלצה
     אינה נוגעת בלוח השנה.

   ⚠ **חניך בלי שיבוץ לקבוצה מתחיל אצל ראש המכינה.** שיבוץ
     חסר לא יתקע בקשה.
   ============================================================ */

import { DataError } from "../data/store.js";
import { counted } from "./people.js";
import { todayISO } from "./attendance.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY = 86400000;

/* ============================================================
   מי המדריך של החניך
   ⚠ **נגזר מהשיבוץ ואינו שם בקוד.** המכינה מחליפה מדריך או
     מעבירה חניך בין קבוצות — הכול בנתונים, בלי דיפלוי.
   ============================================================ */
async function guideOf(db, personId) {
  const mships = await db.list("membership", { where: { person: personId } });
  for (const m of mships) {
    const team = await db.get("team", m.team);
    if (team?.category === "group" && team.guide) return team.guide;
  }
  return null;
}

/** האם אני המדריך של החניך הזה */
const isGuideOf = async (db, userPersonId, personId) =>
  Boolean(userPersonId) && (await guideOf(db, personId)) === userPersonId;

const isHead = (user) => user.isRoot || user.roles.includes("head");

/* ============================================================
   השלב — נגזר, לא נשמר
   ============================================================ */
export function stageOf(req, hasGuide) {
  if (req.status !== "pending") return "done";
  /* ⚠ חניך בלי מדריך מתחיל אצל ראש המכינה — שיבוץ חסר
     לא יתקע בקשה. */
  if (!hasGuide) return "head";
  return req.guideDecision ? "head" : "guide";
}

/* ============================================================
   ⚠⚠ מכסת החופש נמדדת בשעות
   ------------------------------------------------------------
   24 שעות מתחילות הן יום. יציאה ב-8.9 ב-08:00 וחזרה ב-9.9
   ב-08:00 היא **יום אחד** — ספירת תאריכים הייתה גובה שניים,
   ומתוך מכסה של שלושה למחצית זו טעות של שליש.

   ⚠ **מינימום אחד** — יציאה של שעתיים היא עדיין יום שהחניך
     לא היה. ⚠ **ו-`null` על קלט לא תקין**, ולא נפילה שקטה
     ל-1: מספר שהומצא נראה בדיוק כמו מספר שחושב.

   ⚠ **טהורה ומיוצאת**, כדי שהמסך והשרת יאמרו אותו מספר.
     שתי גרסאות נפרדות ביום הראשון, ואז המסך מבטיח אחד
     והשרת גובה אחר.
   ============================================================ */
export function vacationCost(fromDate, toDate, outAt, backAt) {
  if (!DATE_RE.test(String(fromDate)) || !DATE_RE.test(String(toDate))) return null;
  if (!TIME_RE.test(String(outAt)) || !TIME_RE.test(String(backAt))) return null;

  const start = Date.parse(`${fromDate}T${outAt}:00Z`);
  const end = Date.parse(`${toDate}T${backAt}:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  return Math.max(1, Math.ceil((end - start) / DAY));
}

/* ============================================================
   שני המיפויים
   ⚠⚠ **נפרדים ולא סינון של אותו אובייקט.** ראו הכותרת.
   ============================================================ */

/** מה שהחניך רואה על הבקשה **שלו** */
const toStudent = (r, { canEdit, canAppeal }) => ({
  id: r.id,
  type: r.type,
  fromDate: r.fromDate,
  toDate: r.toDate,
  outAt: r.outAt,
  backAt: r.backAt,
  detail: r.detail,
  /* ⚠ תשובה אחת ויחידה. אין `guideDecision`, אין `stage`,
     ואין שם של אף אחד. */
  status: r.status,
  chargedDays: r.chargedDays,
  /* ⚠ הערר **שלו** חוזר אליו — הוא כתב אותו, והוא צריך
     לראות שהוא נקלט. אין כאן שום נתון של אדם אחר. */
  appeal: r.appeal || null,
  appealAt: r.appealAt || null,
  /* ⚠ נגזר בשרת ואינו מחושב במסך — כפתור שמופיע ומקבל 403
     אחרי שהמשתמש כבר הקליד הוא בדיוק מה שהכלל נועד למנוע. */
  canEdit,
  canAppeal,
});

/** מה שהצוות רואה */
const toStaff = (r, { personName, guideName, decidedName, stage, canDecide, decisionKind }) => ({
  id: r.id,
  person: r.person,
  personName,
  type: r.type,
  fromDate: r.fromDate,
  toDate: r.toDate,
  /* ⚠ שעות היציאה והחזרה **נאספות כחובה ומוצגות לצוות.**
     בגרסה הראשונה הן יצאו רק במיפוי של החניך, והמדריך —
     שבשבילו הן נאספו — לא ראה אותן בכרטיס. מיפוי מפורש מונע
     דליפה, והוא מונע גם **הגעה**. */
  outAt: r.outAt,
  backAt: r.backAt,
  detail: r.detail,
  status: r.status,
  guideDecision: r.guideDecision || null,
  guideName,
  decidedName,
  decidedAt: r.decidedAt || null,
  chargedDays: r.chargedDays,
  /* ⚠⚠ **הערר מגיע למכריע.** הוא נכתב על בקשה שכבר הוכרעה,
     ובלי שהוא יוצא כאן הוא נכתב לתוך שורה שאיש אינו קורא —
     כלומר החניך מדבר אל הקיר. נתפס בצילום מסך של מסך הבית:
     הרצועה ספרה עררים והמיפוי לא החזיר את השדה. */
  appeal: r.appeal || null,
  appealAt: r.appealAt || null,
  cost: vacationCost(r.fromDate, r.toDate, r.outAt, r.backAt),
  stage,
  /* ⚠ הפעמון וכרטיס תשומת הלב הולכים לפי `canDecide` בלבד —
     התראה על משהו שאי אפשר לגעת בו היא רעש. מנהל אינו
     ראש מכינה. */
  canDecide,
  /* ⚠⚠ **«ממליץ» ו«מכריע» הם שני דברים, והמסך חייב לומר
     את הנכון.** כפתור «אישור» אצל המדריך הוא שקר: הוא
     המליץ, וראש המכינה עוד יכול להפוך את זה. מדריך שחושב
     שסגר את העניין אומר לחניך «אישרתי לך» — וזו בדיוק
     הסיבה שהחניך אינו רואה שלבים מלכתחילה.
     ⚠ **נגזר בשרת** ולא מהתפקיד במסך. */
  decisionKind: canDecide ? decisionKind : null,
});

/* ============================================================
   ולידציה — אחת להגשה ולעריכה
   ⚠⚠ **פונקציה אחת לשתיהן.** שתי גרסאות היו נפרדות בתיקון
     הראשון, ואז בקשה שאסור להגיש אבל מותר לערוך אליה היא
     החור שדרכו עוקפים את המכסה.
   ============================================================ */
function validate(body) {
  const type = String(body?.type || "");
  if (!["vacation", "sick", "justified"].includes(type)) {
    throw new DataError("יש לבחור סוג יציאה");
  }

  const fromDate = String(body?.fromDate || "");
  const toDate = String(body?.toDate || fromDate);
  if (!DATE_RE.test(fromDate) || !DATE_RE.test(toDate)) {
    throw new DataError("תאריכים אינם תקינים");
  }
  if (toDate < fromDate) throw new DataError("תאריך החזרה לפני תאריך היציאה");

  /* ⚠ **שעת יציאה ושעת חזרה — חובה.** זו השאלה התפעולית
     האמיתית, ובלעדיה המדריך שואל בוואטסאפ בדיוק את מה
     שהטופס אמור היה לתפוס. */
  const outAt = String(body?.outAt || "");
  const backAt = String(body?.backAt || "");
  if (!TIME_RE.test(outAt)) throw new DataError("יש למלא שעת יציאה");
  if (!TIME_RE.test(backAt)) throw new DataError("יש למלא שעת חזרה");
  /* ⚠ **ואין השוואה בין השעות.** יציאה ב-20:00 וחזרה ב-08:00
     היא לינה בבית, לא טעות — והשוואה נאיבית הייתה חוסמת
     בדיוק את הבקשה הנפוצה ביותר. */

  const detail = String(body?.detail || "").trim();
  /* ⚠ **מחלה והיעדרות מוצדקת מחייבות פירוט; יום חופש לא.**
     יום חופש הוא זכות במכסה, ודרישת נימוק עליו הופכת אותו
     לבקשת רשות. */
  if (type !== "vacation" && detail.length < 2) {
    throw new DataError("במחלה ובהיעדרות מוצדקת יש למלא פירוט — בלעדיו אי אפשר להכריע");
  }

  return { type, fromDate, toDate, outAt, backAt, detail: detail || null };
}

/* ============================================================
   רשימה
   ============================================================ */
export async function list({ db, user, profile }) {
  const quota = profile.year?.vacationQuota ?? null;

  /* ---------- החניך על עצמו ---------- */
  if (!user.isStaff) {
    const mine = await db.list("leaveRequest", { where: { person: user.personId } });
    mine.sort((a, b) => String(b.fromDate).localeCompare(String(a.fromDate)));

    /* ⚠ המכסה נספרת מבקשות **מאושרות בלבד** — שם יש פחות
       מקום לפרשנות מאשר בסימון היומי. */
    const used = mine
      .filter((r) => r.status === "approved" && r.type === "vacation")
      .reduce((n, r) => n + (Number(r.chargedDays) || 0), 0);

    return {
      /* ⚠⚠ **ערר קיים רק על בקשה שהוכרעה, ופעם אחת.** ערר
         שני היה דורס את הראשון, וראש המכינה היה קורא טקסט
         אחר ממה שקרא אתמול. */
      mine: mine.map((r) => toStudent(r, {
        canEdit: r.status === "pending",
        canAppeal: r.status !== "pending" && !r.appeal,
      })),
      quota,
      used,
      /* ⚠ `null` כשאין מכסה מוגדרת, ולא 0 — «נותרו 0» הוא
         טענה, ו«לא הוגדרה מכסה» הוא מצב אחר לגמרי. */
      left: quota == null ? null : Math.max(0, quota - used),
      staffView: false,
    };
  }

  /* ---------- הצוות ---------- */
  const rows = await db.list("leaveRequest");
  const people = new Map((await counted(db)).map((p) => [p.id, p.name]));
  const staff = new Map((await db.list("person", { where: { kind: "staff" } }))
    .map((p) => [p.id, p.name]));

  const head = isHead(user);
  const out = [];
  for (const r of rows) {
    const g = await guideOf(db, r.person);
    const stage = stageOf(r, Boolean(g));
    /* ⚠⚠ **מי המחליט נקבע מהשלב שהבקשה נמצאת בו** — לא ממה
       שהדפדפן שולח. וראש המכינה אינו כפוף לשלב. */
    const canDecide = r.status === "pending" &&
      (head || (stage === "guide" && g === user.personId));

    out.push(toStaff(r, {
      personName: people.get(r.person) || staff.get(r.person) || "—",
      guideName: g ? (staff.get(g) || null) : null,
      decidedName: r.decidedBy ? (staff.get(r.decidedBy) || null) : null,
      stage, canDecide,
      /* ⚠ ראש המכינה **מכריע תמיד**, גם בשלב המדריך — השלב
         הראשון הוא סדר עבודה, לא שער. */
      decisionKind: head ? "decide" : "recommend",
    }));
  }

  out.sort((a, b) =>
    (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1) ||
    String(b.fromDate).localeCompare(String(a.fromDate)));

  return {
    requests: out,
    quota,
    staffView: true,
    /* ⚠ המונה הוא של מה ש**אני** יכול להכריע בו. מספר שכולל
       בקשות שאינן שלי מאמן להתעלם ממנו. */
    waitingForMe: out.filter((r) => r.canDecide).length,
    isHead: head,
  };
}

/* ============================================================
   הגשה
   ============================================================ */
export async function create({ db, user, body, profile }) {
  if (user.isStaff) {
    /* ⚠ הודעה שאומרת מה כן לעשות. «אין הרשאה» לבדו שולח
       לחפש באג שאינו קיים. */
    throw new DataError("בקשת יציאה מוגשת על ידי החניך עצמו", 403);
  }

  const f = validate(body);
  const cost = vacationCost(f.fromDate, f.toDate, f.outAt, f.backAt);

  /* ⚠ **המכסה נאכפת כאן ולא בסימון היומי.** היא תקציב של
     התחייבויות, ולכן בקשות מאושרות **עתידיות** נספרות בה —
     בלי זה אפשר היה לאשר שלושה ימים בכל שבוע והמכסה לא
     הייתה נגמרת. */
  const quota = profile.year?.vacationQuota ?? null;
  if (f.type === "vacation" && quota != null) {
    const mine = await db.list("leaveRequest", { where: { person: user.personId } });
    const used = mine
      .filter((r) => r.status === "approved" && r.type === "vacation")
      .reduce((n, r) => n + (Number(r.chargedDays) || 0), 0);
    if (cost != null && used + cost > quota) {
      throw new DataError(
        `המכסה למחצית היא ${quota} ימים, ניצלת ${used}. הבקשה הזו שווה ${cost} — ` +
        "אפשר לקצר אותה או לבקש כהיעדרות מוצדקת");
    }
  }

  const row = await db.create("leaveRequest", {
    ...f,
    person: user.personId,
    status: "pending",
    attachment: body?.attachment || null,
  });

  return { ok: true, request: toStudent(row, { canEdit: true, canAppeal: false }), cost };
}

/* ============================================================
   עריכה — מה שאדם הגיש, הוא מתקן, כל עוד לא הוכרע
   ============================================================ */
export async function update({ db, user, body }) {
  const id = String(body?.id || "");
  const row = await db.get("leaveRequest", id);

  /* ⚠ **404 ולא 403** על בקשה של חניך אחר — 403 מאשר
     שהשורה קיימת. */
  if (!row || row.person !== user.personId) {
    throw new DataError("הבקשה לא נמצאה", 404);
  }
  /* ⚠ **409 עם שם המכריע.** בקשה שהוכרעה אינה נערכת: השינוי
     היה הופך החלטה שכבר ניתנה להחלטה על משהו אחר. */
  if (row.status !== "pending") {
    throw new DataError("הבקשה כבר הוכרעה ואי אפשר לערוך אותה", 409);
  }

  const f = validate(body);

  /* ⚠⚠ **שינוי מהותי מאפס את המלצת המדריך.** הוא המליץ על
     תאריך ושעות מסוימים; בקשה שהתאריך שלה השתנה היא בקשה
     אחרת, וההמלצה שנשארה עליה הייתה מטעה את ראש המכינה.
     ⚠ פירוט וקובץ **אינם** מאפסים — הם מוסיפים מידע ואינם
     משנים את מה שביקשו. */
  const material = ["type", "fromDate", "toDate", "outAt", "backAt"]
    .some((k) => row[k] !== f[k]);

  const patch = { ...f };
  if (material && row.guideDecision) {
    patch.guideDecision = null;
    patch.guideBy = null;
    patch.guideAt = null;
  }
  if (body?.attachment !== undefined) patch.attachment = body.attachment || null;

  const next = await db.update("leaveRequest", id, patch);
  return {
    ok: true,
    request: toStudent(next, { canEdit: true }),
    /* ⚠ נאמר במפורש: הבקשה חזרה למדריך. שינוי שקט היה משאיר
       את החניך בטוח שהיא ממשיכה מהמקום שבו הייתה. */
    guideReset: Boolean(material && row.guideDecision),
  };
}

export async function remove({ db, user, body }) {
  const id = String(body?.id || "");
  const row = await db.get("leaveRequest", id);
  if (!row || row.person !== user.personId) throw new DataError("הבקשה לא נמצאה", 404);
  if (row.status !== "pending") {
    throw new DataError("הבקשה כבר הוכרעה ואי אפשר לבטל אותה", 409);
  }
  await db.remove("leaveRequest", id);
  return { ok: true };
}

/* ============================================================
   הכרעה — שני השלבים באותה נקודת קצה
   ⚠⚠ **מי המחליט נקבע מהשלב שהבקשה נמצאת בו**, ולא ממה
     שהדפדפן שולח.
   ============================================================ */
export async function decide({ db, user, body, profile }) {
  const id = String(body?.id || "");
  const approve = body?.approve === true;
  const row = await db.get("leaveRequest", id);
  if (!row) throw new DataError("הבקשה לא נמצאה", 404);

  /* ============================================================
     ⚠⚠ שינוי החלטה שכבר ניתנה
     ------------------------------------------------------------
     הכלל שמנהל שני לא יהפוך החלטה בלי שאיש יידע **נשאר
     בתוקף**: 409 על הכרעה חוזרת, אלא אם נשלח `redo` — וזה
     כפתור אחד במסך, אחרי אישור שאומר מה בדיוק ישתנה.

     ⚠⚠⚠ **ובלי זה הערר הוא מבוי סתום.** חניך שמגיש ערר על
       החלטה שאי אפשר לשנות מדבר אל הקיר — נתפס כאן בהרצה,
       כשהערר נרשם יפה ולא הייתה שום דרך לפעול לפיו.

     ⚠ **ראש המכינה בלבד** — המדריך ממליץ ואינו הופך הכרעה.
     ============================================================ */
  const redo = body?.redo === true;
  if (row.status !== "pending") {
    if (!redo) throw new DataError("הבקשה כבר הוכרעה", 409);
    if (!isHead(user)) {
      throw new DataError("שינוי החלטה שכבר ניתנה שמור לראש המכינה", 403);
    }
  }

  const g = await guideOf(db, row.person);
  const stage = stageOf(row, Boolean(g));
  const head = isHead(user);
  const now = new Date().toISOString();

  /* ---------- ראש המכינה מכריע ---------- */
  if (head) {
    /* ⚠⚠ **כמה נגבה בפועל — בחירה של המכריע.** היציאה עשויה
       להיות 26 שעות והמדריך מכיר את הקושי להגיע ובוחר לגבות
       אחד. **אפס מותר** («מאשר ולא גובה»); **יותר מהחישוב
       נחסם** — זו כמעט תמיד טעות הקלדה שיורדת ממכסה שאי
       אפשר להשיב. */
    const auto = vacationCost(row.fromDate, row.toDate, row.outAt, row.backAt);
    let charged = auto;
    if (approve && body?.charge !== undefined && body.charge !== null && body.charge !== "") {
      const n = Number(body.charge);
      if (!Number.isFinite(n) || n < 0) throw new DataError("מספר ימי החיוב אינו תקין");
      if (auto != null && n > auto) {
        throw new DataError(`היציאה שווה ${auto} ימים — אי אפשר לגבות יותר`);
      }
      charged = n;
    }

    const next = await db.update("leaveRequest", id, {
      status: approve ? "approved" : "rejected",
      decidedBy: user.personId,
      decidedAt: now,
      chargedDays: approve ? charged : null,
      /* ⚠ **ההמלצה שדולגה נשארת ריקה** ואינה מומצאת בדיעבד. */
      /* ⚠⚠ **הכרעה חדשה מנקה ערר פתוח.** התראה על משהו
         שכבר טופל היא בדיוק מה שגורם לסגור את הפעמון. */
      appeal: null,
      appealAt: null,
    });

    /* ⚠⚠ **שורות ההיעדרות נוצרות בהכרעה הסופית בלבד**, ואחת
       לכל יום בטווח — לנוכחות זה הנתון הנכון. */
    let created = 0, removed = 0;
    /* ⚠ בשינוי החלטה מנקים **קודם**: אישור שהפך לדחייה חייב
       להחזיר את הימים, ואישור ששונה לו החיוב חייב שהשורות
       יישאו את המספר החדש. */
    if (row.status !== "pending") removed = await clearAbsences(db, id);
    if (approve) created = await writeAbsences(db, next);

    return {
      ok: true, status: next.status,
      absences: created, absencesRemoved: removed,
      charged: next.chargedDays,
      /* ⚠ מוחזר מה שקרה **בפועל** ולא «נשמר» — המסך צריך
         לומר אמת על מה שהשתנה במכסה. */
      changed: row.status !== "pending",
    };
  }

  /* ---------- המדריך ממליץ ---------- */
  if (stage !== "guide" || !(await isGuideOf(db, user.personId, row.person))) {
    /* ⚠ ההודעה אומרת **מי כן רשאי** ולא «אין הרשאה» — מי
       שנחסם צריך לדעת למי לפנות. */
    throw new DataError("ההכרעה בבקשה הזו שמורה לראש המכינה", 403);
  }

  /* ⚠⚠ **גם דחיית מדריך עוברת הלאה.** היא המלצה, לא הכרעה —
     הסטטוס נשאר `pending` וראש המכינה רשאי להפוך אותה. */
  await db.update("leaveRequest", id, {
    guideDecision: approve ? "approved" : "rejected",
    guideBy: user.personId,
    guideAt: now,
  });

  return {
    ok: true,
    status: "pending",
    /* ⚠ נאמר במפורש שההמלצה אינה סופית, אחרת המדריך מניח
       שהוא סגר את העניין. */
    recommendation: approve ? "approved" : "rejected",
    note: "ההמלצה נרשמה. ההכרעה הסופית אצל ראש המכינה.",
  };
}

/* ============================================================
   ⚠ שורה לכל יום בטווח
   ------------------------------------------------------------
   לנוכחות זה הנתון הנכון — יום הוא יום. `cost` על השורה
   אומרת כמה היא שווה במכסה, ו**ריק = 1 ולא 0**: שורה שנוצרה
   לפני שהשדה היה קיים נכתבה בעולם שבו יום = יום, ואפס היה
   מוחק למפרע את כל מה שנוצל.

   ⚠ ו-`source: "request"` — שורה שסומנה ביד היא עובדה על
     היום ולא תוצאה של הבקשה, והיפוך החלטה לא ימחק אותה.
   ============================================================ */
/* ⚠⚠ **ההיעדרויות מתהפכות עם ההחלטה.** אישור שהופך לדחייה
   חייב למחוק את השורות שנוצרו ממנו — אחרת החניך נשאר נעדר
   ביום שהבקשה שלו נדחתה, והמכסה נשארת מחויבת.

   ⚠ **ורק שורות שנוצרו מהבקשה הזו** (`request`). שורה שמוביל
     השבוע סימן ביד היא עובדה על היום ולא תוצאה של הבקשה,
     ומחיקתה הייתה מוחקת את הסימון שלו. */
async function clearAbsences(db, requestId) {
  const rows = await db.list("absence", { where: { request: requestId } });
  for (const a of rows) await db.remove("absence", a.id);
  return rows.length;
}

async function writeAbsences(db, req) {
  const from = Date.parse(req.fromDate + "T00:00:00Z");
  const to = Date.parse(req.toDate + "T00:00:00Z");
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;

  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  let n = 0;
  for (let t = from; t <= to; t += DAY) {
    const date = iso(t);
    /* ⚠ **המצב הרצוי ולא «הוסף»** — הכרעה שנשלחת פעמיים
       אינה מייצרת שתי שורות. */
    const existing = await db.find("absence", { person: req.person, date, request: req.id });
    if (existing) continue;
    await db.create("absence", {
      person: req.person, date, type: req.type,
      source: "request", detail: req.detail || null,
      /* ⚠ **ריק = 1 ולא 0** בצד הקורא: כל שורה שנוצרה לפני
         שהעמודה הייתה קיימת נכתבה בעולם שבו יום הוא יום.
         כאן נכתב מה שנגבה בפועל, כשהוכרע. */
      cost: req.chargedDays ?? null, request: req.id,
    });
    n++;
  }
  return n;
}

/* ============================================================
   ערר
   ------------------------------------------------------------
   ⚠⚠⚠ **הערר אינו משנה את הסטטוס.** «נדחה» עם ערר פתוח הוא
     עדיין «נדחה», והחניך אינו יוצא — **וזה כתוב במסך**, כי
     בלי זה מישהו ייסע הביתה. מה שהוא עושה הוא להחזיר את
     הבקשה לתשומת הלב.

   ⚠⚠ **מסלול נפרד, לפני הבדיקה של «ממתינה».** `update` דוחה
     בכוונה כל בקשה שהוכרעה — והערר קיים **רק** עליהן. מסלול
     אחד לשניהם היה מחייב לפתוח את העריכה על בקשות סגורות,
     וזה בדיוק מה שאסור.

   ⚠ **פעם אחת להכרעה.** ערר שני דורס את הראשון, וראש המכינה
     קורא טקסט אחר ממה שקרא אתמול.
   ============================================================ */
export async function appeal({ db, user, body }) {
  if (user.isStaff) {
    throw new DataError("ערר מוגש על ידי החניך עצמו", 403);
  }
  const id = String(body?.id || "");
  const row = await db.get("leaveRequest", id);
  /* ⚠ **404 ולא 403** על בקשה של חניך אחר — 403 מאשר שהשורה קיימת. */
  if (!row || row.person !== user.personId) throw new DataError("הבקשה לא נמצאה", 404);

  if (row.status === "pending") {
    throw new DataError("הבקשה עוד לא הוכרעה — ערר מוגש על החלטה", 409);
  }
  if (row.appeal) {
    throw new DataError("כבר הוגש ערר על הבקשה הזו, והוא ממתין להכרעה", 409);
  }

  const text = String(body?.appeal || "").trim();
  if (text.length < 10) {
    throw new DataError("יש לכתוב מה השתנה או מה לא נלקח בחשבון — לפחות עשרה תווים");
  }

  await db.update("leaveRequest", id, {
    appeal: text.slice(0, 2000),
    appealAt: new Date().toISOString(),
  });

  return {
    ok: true,
    /* ⚠ נאמר במפורש שהסטטוס לא זז. בלי זה מישהו ייסע הביתה. */
    status: row.status,
    note: "הערר נרשם. ההחלטה עצמה לא השתנתה — היא חוזרת לבדיקה של ראש המכינה.",
  };
}
