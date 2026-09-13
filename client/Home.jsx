/* ============================================================
   מסך הבית
   ============================================================ */

import React, { useEffect, useState } from "react";
import { api } from "./api.js";

const STATUS = {
  present: "נוכחים", absent: "נעדרים",
  half: "חצי יום", unmarked: "טרם סומנו",
};

export function Home({ user, brand, go }) {
  const [day, setDay] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(true);

  const may = (s) => user.screens.includes("*") || user.screens.includes(s);

  useEffect(() => {
    if (!may("attendance")) { setBusy(false); return; }
    api.day()
      .then(setDay)
      .catch((e) => setErr(e.offline ? "אין חיבור לשרת" : e.message))
      .finally(() => setBusy(false));
  }, []); // eslint-disable-line

  const hour = new Date().getHours();
  const greet = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : "ערב טוב";

  return (
    <>
      <div className="card lift" style={{ marginBottom: 16 }}>
        <h1>{greet}, {user.name.split(" ")[0]}</h1>
        <p className="muted" style={{ margin: "4px 0 0" }}>
          {new Date().toLocaleDateString("he-IL", {
            weekday: "long", day: "numeric", month: "long",
          })}
        </p>
      </div>

      {busy && <><div className="skel" /><div className="skel" /></>}

      {/* ⚠ כשל טעינה — באנר אדום ולא מסך ריק. */}
      {err && <div className="banner err">לא הצלחנו לטעון את הנוכחות — {err}</div>}

      {day && !err && (
        <>
          <h2 style={{ margin: "0 0 10px" }}>נוכחות היום</h2>

          {/* ⚠ יום שאינו בלוח השנה אינו שגיאה — הוא מצב, והוא
              נאמר במילים. */}
          {!day.inYear ? (
            <div className="banner info">
              התאריך {day.date} אינו בלוח השנה של המכינה
            </div>
          ) : !day.marked ? (
            /* ⚠ «טרם סומן» אינו «כולם נעדרו». מצב שלישי, ונאמר. */
            <div className="card">
              <div className="empty">
                <h3>היום טרם סומן</h3>
                <p className="muted" style={{ margin: "6px 0 14px" }}>
                  אף אחד עוד לא עבר על הרשימה. זה לא אומר שמישהו חסר.
                </p>
                {may("attendance") && (
                  <button className="btn" onClick={() => go("attendance")}>
                    לסימון הנוכחות
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="band">
                <div>
                  <div className="k ok">{day.tally.present}</div>
                  <div className="l">{STATUS.present}</div>
                </div>
                <div>
                  <div className={"k " + (day.tally.absent ? "bad" : "")}>{day.tally.absent}</div>
                  <div className="l">{STATUS.absent}</div>
                </div>
                {day.tally.half > 0 && (
                  <div>
                    <div className="k warn">{day.tally.half}</div>
                    <div className="l">{STATUS.half}</div>
                  </div>
                )}
                {day.tally.unmarked > 0 && (
                  <div>
                    <div className="k">{day.tally.unmarked}</div>
                    <div className="l">{STATUS.unmarked}</div>
                  </div>
                )}
              </div>
              {may("attendance") && (
                <button className="btn ghost" style={{ marginTop: 12 }}
                  onClick={() => go("attendance")}>
                  פתיחת רשימת הנוכחות
                </button>
              )}
            </>
          )}
        </>
      )}

      {brand?.setupNeeded?.length > 0 && (
        <div className="banner info" style={{ marginTop: 20 }}>
          האפיון של המכינה עוד לא הושלם — חסרים: {brand.setupNeeded.join(" · ")}
        </div>
      )}
    </>
  );
}
