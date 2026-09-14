/* ============================================================
   סימון נוכחות
   ------------------------------------------------------------
   ⚠⚠ **שולחים את המצב הרצוי ולא «הפוך».** שני אנשים שלוחצים
     כמעט יחד שולחים אותה כוונה ומקבלים אותה תוצאה. בקשת
     «הפוך» הייתה גורמת לשנייה לבטל את הראשונה.

   ⚠⚠ **סימון אופטימי — ובכישלון חוזרים אחורה ואומרים.**
     הסימון מוצג מיד כי לחיצה שממתינה לשרת מרגישה כאילו לא
     נקלטה. אבל סימון שנשאר על המסך אחרי שהשרת דחה אותו הוא
     שקר, לא נוחות.

   ⚠ **«טרם סומן» הוא מצב ולא היעדר מצב** — ולכן הוא כפתור
     כמו כל השאר, ואפשר לחזור אליו.
   ============================================================ */

import React, { useEffect, useState } from "react";
import { api } from "./api.js";
import * as MI from "./icons.jsx";
import { Avatar, Band, Empty, Failed, Loading, Sec, useToast, heDate } from "./ui.jsx";

const STATES = [
  { key: "present", label: "נוכח", tone: "ok", icon: MI.Check },
  { key: "absent", label: "נעדר", tone: "bad", icon: MI.Close },
  { key: "half", label: "חצי", tone: "warn", icon: MI.Clock },
];

const tallyOf = (people) => {
  const t = { present: 0, absent: 0, half: 0, unmarked: 0 };
  for (const p of people) t[p.status] = (t[p.status] || 0) + 1;
  return t;
};

export function Attendance() {
  const [day, setDay] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(true);
  const toast = useToast();

  const load = (date) => {
    setBusy(true); setErr(null);
    api.day(date)
      .then(setDay)
      .catch((e) => setErr(e.offline ? "אין חיבור לשרת" : e.message))
      .finally(() => setBusy(false));
  };

  useEffect(() => { load(); }, []);

  async function set(personId, status) {
    if (!day) return;
    const before = day;
    const people = day.people.map((p) => p.id === personId ? { ...p, status } : p);
    /* אופטימי — לחיצה שממתינה לשרת מרגישה כאילו לא נקלטה */
    setDay({ ...day, marked: true, people, tally: tallyOf(people) });
    try {
      await api.mark(day.date, [{ person: personId, status }]);
    } catch (e) {
      /* ⚠ חזרה אחורה **ואמירה**. סימון שנשאר על המסך אחרי
         שהשרת דחה אותו הוא שקר, לא נוחות. */
      setDay(before);
      toast(e.offline ? "אין חיבור — הסימון לא נשמר" : `לא נשמר: ${e.message}`, "bad");
    }
  }

  /* ⚠ **סימון הכול הוא נוחות ולא ברירת מחדל.** יום שנפתח
     כשכולם מסומנים נוכחים נראה כמו יום שנבדק, ואיש לא בדק. */
  async function markRest() {
    if (!day) return;
    const rest = day.people.filter((p) => p.status === "unmarked");
    if (!rest.length) return;
    const before = day;
    const people = day.people.map((p) =>
      p.status === "unmarked" ? { ...p, status: "present" } : p);
    setDay({ ...day, marked: true, people, tally: tallyOf(people) });
    try {
      await api.mark(day.date, rest.map((p) => ({ person: p.id, status: "present" })));
      toast(`${rest.length} סומנו נוכחים`);
    } catch (e) {
      setDay(before);
      toast(`לא נשמר: ${e.message}`, "bad");
    }
  }

  if (busy) return <Loading rows={6} />;
  if (err) return <Failed error={err} onRetry={() => load()} />;
  if (!day) return null;

  const unmarked = day.tally.unmarked;

  return (
    <>
      <div className="row wrap" style={{ marginBottom: "var(--s4)" }}>
        <div className="grow">
          <h1>נוכחות</h1>
          <p className="muted" style={{ marginTop: 2 }}>
            {heDate(day.date)}
            {" · "}
            {day.marked
              ? `סומן ${day.markedAt ? new Date(day.markedAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : ""}`
              : "טרם סומן"}
          </p>
        </div>
        {unmarked > 0 && day.people.length > 0 && (
          <button className="btn ghost" onClick={markRest}>
            <MI.Check size={17} />סימון {unmarked} הנותרים כנוכחים
          </button>
        )}
      </div>

      {!day.inYear && (
        <div className="banner info">
          <MI.Calendar size={18} />
          <div>התאריך אינו בלוח השנה של המכינה.</div>
        </div>
      )}

      {day.people.length === 0 ? (
        <Empty icon={MI.People} title="אין עדיין אנשים במצבה">
          הוסיפו אותם בשלב «אנשים» של האפיון.
        </Empty>
      ) : (
        <>
          <Band items={[
            { value: day.tally.present, label: "נוכחים", tone: "ok" },
            { value: day.tally.absent, label: "נעדרים", tone: day.tally.absent ? "bad" : "" },
            { value: day.tally.half, label: "חצי יום", tone: day.tally.half ? "warn" : "" },
            /* ⚠ «טרם סומן» הוא מצב שלישי ולא היעדר מצב, ולכן
               הוא מוצג כמספר ולא מושמט. */
            { value: unmarked, label: "טרם סומנו" },
          ]} />

          <Sec>הרשימה</Sec>
          <div className="rows">
            {day.people.map((p) => (
              <div className="item" key={p.id}>
                <Avatar name={p.name} size="sm" />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="nm trunc">{p.name}</div>
                  {p.absenceType && (
                    <div className="tiny">היעדרות מאושרת</div>
                  )}
                </div>
                <div className="row" style={{ gap: 4 }}>
                  {STATES.map((st) => (
                    <button key={st.key} onClick={() => set(p.id, st.key)}
                      aria-pressed={p.status === st.key}
                      title={st.label}
                      className={"seg sm " + (p.status === st.key ? "on " + st.tone : "")}
                      style={{ height: 32, padding: "0 11px", fontSize: 13 }}>
                      <st.icon size={14} />
                      <span className="hide-sm">{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
