/* ============================================================
   מסך הבית
   ------------------------------------------------------------
   ⚠ הרשת נבנית מהמסכים שהשרת פתח — ולכן מכינה שכיבתה מודול
     אינה רואה אריח שמוביל לשום מקום.
   ============================================================ */

import React, { useEffect, useState } from "react";
import { api } from "./api.js";

const STATUS = {
  present: "נוכחים", absent: "נעדרים",
  half: "חצי יום", unmarked: "טרם סומנו",
};

export function Home({ user, brand, nav, go }) {
  const [day, setDay] = useState(null);
  const [sum, setSum] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(true);

  const may = (s) => nav?.screens?.includes(s);

  /* ⚠⚠ **תלוי ב-`nav` ולא רץ פעם אחת.** המסך הזה נטען לפני
     שהניווט חוזר מהשרת, ולכן ברינדור הראשון `nav` הוא null
     ו-`may("attendance")` מחזיר false — כלומר אף קריאה לא
     יצאה, ורשימת הנוכחות **פשוט לא הופיעה**. בלי שגיאה ובלי
     סקלטון: המסך נראה תקין לגמרי וחסר בו בלוק שלם.
     נתפס בצילום מסך, לא בבדיקה. */
  useEffect(() => {
    if (!nav) return;
    setBusy(true);
    const jobs = [];
    if (may("attendance")) jobs.push(api.day().then(setDay));
    if (!user.isStaff) jobs.push(api.summary().then(setSum).catch(() => {}));
    Promise.all(jobs)
      .catch((e) => setErr(e.offline ? "אין חיבור לשרת" : e.message))
      .finally(() => setBusy(false));
  }, [nav]); // eslint-disable-line

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
      {err && <div className="banner err">לא הצלחנו לטעון — {err}</div>}

      {/* ---------- הנוכחות של החניך על עצמו ---------- */}
      {sum && (
        <>
          <h2 style={{ margin: "0 0 10px" }}>הנוכחות שלי</h2>
          <div className="band" style={{ marginBottom: 18 }}>
            <div>
              {/* ⚠ מתחת לסף מוצג «—» ולא 0%. ראו attendance.js. */}
              <div className="k ok">{sum.summary.pct === null ? "—" : sum.summary.pct + "%"}</div>
              <div className="l">
                {sum.summary.pct === null
                  ? `עוד ${sum.summary.needMore} ימים`
                  : `מתוך ${sum.summary.markedDays} ימים`}
              </div>
            </div>
            <div>
              <div className="k">{sum.summary.present}</div>
              <div className="l">ימי נוכחות</div>
            </div>
            {sum.quota != null && (
              <div>
                <div className="k warn">{sum.quota}</div>
                <div className="l">מכסת חופש למחצית</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ---------- נוכחות היום ---------- */}
      {day && !err && (
        <>
          <h2 style={{ margin: "0 0 10px" }}>נוכחות היום</h2>
          {!day.inYear ? (
            <div className="banner info">
              התאריך {day.date} אינו בלוח השנה של המכינה
            </div>
          ) : !day.marked ? (
            /* ⚠ «טרם סומן» אינו «כולם נעדרו». מצב שלישי, ונאמר. */
            <div className="card"><div className="empty">
              <h3>היום טרם סומן</h3>
              <p className="muted" style={{ margin: "6px 0 14px" }}>
                אף אחד עוד לא עבר על הרשימה. זה לא אומר שמישהו חסר.
              </p>
              <button className="btn" onClick={() => go("attendance")}>
                לסימון הנוכחות
              </button>
            </div></div>
          ) : (
            <>
              <div className="band">
                <div><div className="k ok">{day.tally.present}</div><div className="l">{STATUS.present}</div></div>
                <div><div className={"k " + (day.tally.absent ? "bad" : "")}>{day.tally.absent}</div><div className="l">{STATUS.absent}</div></div>
                {day.tally.half > 0 && <div><div className="k warn">{day.tally.half}</div><div className="l">{STATUS.half}</div></div>}
                {day.tally.unmarked > 0 && <div><div className="k">{day.tally.unmarked}</div><div className="l">{STATUS.unmarked}</div></div>}
              </div>
              <button className="btn ghost" style={{ marginTop: 12 }}
                onClick={() => go("attendance")}>פתיחת רשימת הנוכחות</button>
            </>
          )}
        </>
      )}

      {/* ---------- כל המסכים ---------- */}
      {nav?.groups?.length > 0 && (
        <>
          <h2 style={{ margin: "24px 0 10px" }}>כל המסכים</h2>
          {nav.groups.map((g) => (
            <div className="navg" key={g.module}>
              <h4>{g.title}</h4>
              <div className="chips">
                {g.items.map((i) => (
                  <button key={i.key} className="chip" onClick={() => go(i.key)}>
                    {i.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {brand?.setupNeeded?.length > 0 && (
        <div className="banner info" style={{ marginTop: 20 }}>
          האפיון עוד לא הושלם — חסרים: {brand.setupNeeded.join(" · ")}
        </div>
      )}
    </>
  );
}
