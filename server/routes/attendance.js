/* ============================================================
   נוכחות
   ------------------------------------------------------------
   ⚠⚠ **שורה לכל אדם ליום, ולא רשימת מזהים בתא אחד.**
     במערכת הקודמת רשימת הנוכחים הייתה טקסט מופרד בפסיקים,
     ולכן כל סימון **דרס** את כל היום: שני אנשים שסימנו כמעט
     יחד מחקו זה את זה. כאן הסימון הוא upsert על שורה אחת,
     ולכן שניים שמסמנים שני אנשים שונים אינם מתנגשים כלל.

   ⚠⚠ **«לא סומן» הוא מצב ולא היעדר מצב.** יום שאיש לא סימן
     ויום שכולם נעדרו בו נראים אחרת. זה עיקרון 6 בגרסתו
     החשובה ביותר: כשל ומצב ריק הם שני מסכים.

   ⚠ **אחוז מוצג רק מעל סף.** בתחילת שנה «0% נוכחות» הוא
     מספר נכון חשבונית ושקרי במשמעותו — והוא הדבר הראשון
     שהחניך רואה על עצמו. הסף נספר ב**ימים שסומנו**, ולא
     בסכום ימי-אדם: עם 33 חניכים הסכום עובר כל סף אחרי יום.
   ============================================================ */

import { DataError } from "../data/store.js";
import { counted } from "./people.js";
import { dayType, dayLabel, countsForAttendance } from "../../core/day-types.js";

/** ⚠ שעון ישראל ולא שעון השרת. שרת ב-UTC הופך ערב ליום הבא. */
export function todayISO(tz = "Asia/Jerusalem") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function day({ db, query, profile, user }) {
  const date = query.date && DATE_RE.test(query.date)
    ? query.date
    : todayISO(profile.structure?.timezone);

  const calDay = await db.find("calendarDay", { date });
  const students = await counted(db, "student");

  const attDay = await db.find("attendanceDay", { date });
  const marks = attDay
    ? await db.list("attendanceMark", { where: { day: attDay.id } })
    : [];
  const byPerson = new Map(marks.map((m) => [m.person, m]));

  const absences = await db.list("absence", { where: { date } });
  const absByPerson = new Map(absences.map((a) => [a.person, a]));

  const rows = students.map((p) => {
    const m = byPerson.get(p.id);
    const a = absByPerson.get(p.id);
    return {
      id: p.id,
      name: p.name,
      /* ⚠ ברירת המחדל היא `unmarked` ולא `absent`. */
      status: m?.status || "unmarked",
      absenceType: a?.type || null,
    };
  });

  const tally = { present: 0, absent: 0, half: 0, unmarked: 0 };
  for (const r of rows) tally[r.status] = (tally[r.status] || 0) + 1;

  return {
    date,
    /* ⚠ יום שאינו בלוח השנה הוא תשובה תקינה עם `inYear:false`,
       ולא 404 — 404 גורר באנר אדום של «לא הצלחנו לטעון»
       ושולח לחפש תקלה שאינה קיימת. */
    inYear: Boolean(calDay),
    kind: calDay?.kind || null,
    /* ⚠⚠ **התווית וההתנהגות מגיעות מהאפיון** ולא מרשימה בקוד:
       סוגי הימים הם נתון של המכינה. ראו core/day-types.js. */
    kindLabel: calDay ? dayLabel(profile, calDay.kind) : null,
    /* ⚠ **סוג שנמחק מהאפיון מדווח ואינו נבלע.** נפילה שקטה
       ל«יום רגיל» הייתה מכניסה למכנה יום שהמכינה הוציאה
       ממנו — כלומר משנה אחוזי נוכחות של כולם בלי שגיאה. */
    kindUnknown: Boolean(calDay && !dayType(profile, calDay.kind)),
    counts: calDay ? countsForAttendance(profile, calDay.kind) : false,
    marked: Boolean(attDay),
    markedAt: attDay?.markedAt || null,
    people: rows,
    tally,
    canMark: true,
    you: user.personId,
  };
}

/**
 * סימון.
 * ⚠ **שולחים את המצב הרצוי ולא «הפוך».** שני אנשים שלוחצים
 *   כמעט יחד על אותו חניך שולחים אותה כוונה ומקבלים אותה
 *   תוצאה; «הפוך» היה גורם לשני לבטל את הראשון.
 */
export async function mark({ db, body, user, profile }) {
  const date = String(body?.date || "");
  if (!DATE_RE.test(date)) throw new DataError("תאריך אינו תקין");

  const changes = Array.isArray(body?.marks) ? body.marks : [];
  if (!changes.length) throw new DataError("לא נשלחו סימונים");

  const allowed = new Set(profile.structure.attendanceStates);
  for (const c of changes) {
    if (!c?.person) throw new DataError("סימון בלי מזהה אדם");
    if (!allowed.has(c.status)) throw new DataError(`מצב לא מוכר: ${c.status}`);
  }

  /* ⚠⚠ **סימון ביום שאין בו מכינה נחסם ברעש.** סופ״ש בית
     שסומנה בו נוכחות מייצר יום במכנה שאיש לא היה אמור להיות
     בו — ואז כל המכינה יורדת באחוז על יום שלא היה. הסוג
     נלקח **מלוח השנה** ולא מגוף הבקשה. */
  const cal = await db.find("calendarDay", { date });
  if (cal) {
    const t = dayType(profile, cal.kind);
    if (!t) {
      throw new DataError(
        `ליום הזה סוג «${cal.kind}» שאינו קיים באפיון — יש לתקן אותו בהגדרות סוגי הימים`);
    }
    if (!t.school) {
      throw new DataError(`«${t.label}» אינו יום מכינה, ואי אפשר לסמן בו נוכחות`);
    }
  }

  let attDay = await db.find("attendanceDay", { date });
  if (!attDay) {
    attDay = await db.create("attendanceDay", {
      date, markedBy: user.personId, markedAt: new Date().toISOString(),
    });
  } else {
    await db.update("attendanceDay", attDay.id, {
      markedBy: user.personId, markedAt: new Date().toISOString(),
    });
  }

  let written = 0;
  for (const c of changes) {
    const person = await db.get("person", c.person);
    /* ⚠ מזהה שאינו קיים הוא 400 ולא השמטה שקטה — סימון
       שנעלם נראה בדיוק כמו סימון שנשמר. */
    if (!person) throw new DataError(`אדם לא מוכר: ${c.person}`);

    const existing = await db.find("attendanceMark", {
      day: attDay.id, person: c.person,
    });
    const fields = {
      day: attDay.id, person: c.person, status: c.status,
      by: user.personId, at: new Date().toISOString(),
    };
    if (existing) await db.update("attendanceMark", existing.id, fields);
    else await db.create("attendanceMark", fields);
    written++;
  }

  return { ok: true, date, written };
}

/* ============================================================
   סיכום — לשימוש מסכי החניך והצוות
   ⚠ `pct` הוא `null` ולא 0 מתחת לסף. 0% נראה כמו נתון.
   ============================================================ */
export async function summarize(db, profile, personId) {
  const days = await db.list("attendanceDay");
  const marks = await db.list("attendanceMark", { where: { person: personId } });
  const byDay = new Map(marks.map((m) => [m.day, m.status]));

  /* ============================================================
     ⚠⚠⚠ **המכנה מסונן לפי סוג היום, בזמן החישוב.**
     ------------------------------------------------------------
     קודם נספר **כל תאריך שיש לו שורת סימון**. יום שסומן ואז
     השתנה סוגו — לטיול, לחופשה, ל«לא התקיימה שגרה» — נשאר
     במכנה **לנצח**, כי השורה עדיין קיימת. חניך הופיע על 0/1
     ביום שלא הייתה בו מכינה.

     עכשיו הסינון בזמן החישוב, ולכן שינוי סוג היום מתקן את
     האחוז **מיד ולמפרע**, בלי לגעת בשום שורה. יום כזה משאיר
     את החניך על 0/0.

     ⚠ **וסוג שאינו מוכר אינו נספר, ומדווח.** נפילה שקטה
       ל«נספר» הייתה מחזירה בדיוק את הבאג. */
  const cal = await db.list("calendarDay");
  const kindOf = new Map(cal.map((c) => [c.date, c.kind]));

  let present = 0, absent = 0, marked = 0, skipped = 0, unknownKind = 0;
  for (const d of days) {
    const kind = kindOf.get(d.date);
    const t = kind ? dayType(profile, kind) : null;
    if (kind && !t) { unknownKind++; continue; }
    /* ⚠ יום שאינו בלוח השנה כלל **כן** נספר: הוא סומן, כלומר
       הייתה בו מכינה, ומי ששכח להוסיף אותו ללוח לא אמור
       למחוק בכך את הנוכחות של כולם. */
    if (t && !t.counts) { skipped++; continue; }

    const s = byDay.get(d.id);
    if (!s || s === "unmarked") continue;
    marked++;
    if (s === "present") present += 1;
    else if (s === "half") { present += 0.5; absent += 0.5; }
    else absent += 1;
  }

  const min = profile.year?.minMarkedDays ?? 5;
  return {
    markedDays: marked,
    present, absent,
    /* ⚠ **מה שהוצא מהמכנה נאמר.** «17 ימים» כשיש 24 שורות
       בלוח נראה כמו נתון חסר; «7 ימים שאינם נספרים» הוא
       הסבר. ראו ההערה על הסינון. */
    notCounted: skipped,
    unknownKind,
    pct: marked >= min ? Math.round((present / marked) * 100) : null,
    /* ⚠ נאמר במפורש כמה חסר עד שהאחוז יוצג, כדי שמי שרואה
       «—» יבין שזו התחלת שנה ולא תקלה. */
    needMore: marked >= min ? 0 : min - marked,
  };
}

/** הסיכום של המשתמש על עצמו */
export async function mySummary({ db, profile, user }) {
  /* ⚠ מנהל-על אינו אדם במכינה ואין לו נוכחות. `null` מפורש
     ולא סיכום של אפס — אפס כאן היה נראה כמו מי שלא הגיע
     מעולם, וזו טענה שגויה על נתון שאינו קיים. */
  if (!user.personId) return { summary: null, quota: null, notAPerson: true };
  const s = await summarize(db, profile, user.personId);
  return { summary: s, quota: profile.year?.vacationQuota ?? null };
}
