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

const STATES = [
  { key: "present", label: "נוכח" },
  { key: "absent", label: "נעדר" },
  { key: "half", label: "חצי יום" },
];

export function Attendance() {
  const [day, setDay] = useState(null);
  const [err, setErr] = useState(null);
  const [flash, setFlash] = useState(null);
  const [busy, setBusy] = useState(true);

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
    /* אופטימי */
    setDay({
      ...day,
      marked: true,
      people: day.people.map((p) => p.id === personId ? { ...p, status } : p),
      tally: tallyOf(day.people.map((p) => p.id === personId ? { ...p, status } : p)),
    });
    try {
      await api.mark(day.date, [{ person: personId, status }]);
    } catch (e) {
      /* ⚠ חזרה אחורה **ואמירה**. */
      setDay(before);
      setFlash(e.offline ? "אין חיבור — הסימון לא נשמר" : `הסימון לא נשמר: ${e.message}`);
      setTimeout(() => setFlash(null), 5000);
    }
  }

  const tallyOf = (people) => {
    const t = { present: 0, absent: 0, half: 0, unmarked: 0 };
    for (const p of people) t[p.status] = (t[p.status] || 0) + 1;
    return t;
  };

  if (busy) return <><div className="skel" /><div className="skel" /><div className="skel" /></>;
  if (err) return (
    <>
      <div className="banner err">לא הצלחנו לטעון — {err}</div>
      <button className="btn" onClick={() => load()}>נסה שוב</button>
    </>
  );
  if (!day) return null;

  return (
    <>
      <h2 style={{ marginBottom: 4 }}>נוכחות · {day.date}</h2>
      <p className="faint" style={{ margin: "0 0 14px" }}>
        {day.marked
          ? `סומן לאחרונה ${day.markedAt ? new Date(day.markedAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : ""}`
          : "היום טרם סומן"}
      </p>

      {flash && <div className="banner err">{flash}</div>}

      {!day.inYear && (
        <div className="banner info">התאריך אינו בלוח השנה של המכינה</div>
      )}

      {day.people.length === 0 ? (
        <div className="card"><div className="empty">
          <h3>אין עדיין אנשים במצבה</h3>
          <p className="muted">הוסיפו אותם בשלב «אנשים» של האפיון.</p>
        </div></div>
      ) : (
        <div className="rows">
          {day.people.map((p) => (
            <div className="row" key={p.id}>
              <div className="grow">
                <div className="nm">{p.name}</div>
                {p.absenceType && (
                  <div className="faint">היעדרות מאושרת</div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {STATES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => set(p.id, s.key)}
                    className={"pill " + (p.status === s.key ? s.key : "unmarked")}
                    style={{
                      border: "1px solid var(--line)", cursor: "pointer",
                      fontWeight: p.status === s.key ? 700 : 500,
                    }}
                  >{s.label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
