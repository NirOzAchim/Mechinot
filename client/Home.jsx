/* ============================================================
   מסך הבית
   ------------------------------------------------------------
   ⚠⚠ **מה שדורש פעולה בראש, מה שנעים לדעת אחריו.** מסך בית
     שהוא רשימת קיצורים מאלץ את המשתמש לחפש בעצמו מה חשוב
     היום — וזו בדיוק העבודה שהמערכת אמורה לעשות בשבילו.

   ⚠⚠ **הרשת נבנית מהמסכים שהשרת פתח**, ולכן מכינה שכיבתה
     מודול אינה רואה אריח שמוביל לשום מקום.

   ⚠ **תלוי ב-`nav` ולא רץ פעם אחת.** המסך נטען לפני שהניווט
     חוזר מהשרת, ולכן ברינדור הראשון `may()` מחזיר false —
     כלומר אף קריאה לא יוצאת, ובלוק שלם פשוט לא מופיע. בלי
     שגיאה ובלי סקלטון: המסך נראה תקין לגמרי וחסר בו חלק.
     נתפס בצילום מסך, לא בבדיקה.
   ============================================================ */

import React, { useEffect, useState } from "react";
import { api } from "./api.js";
import * as MI from "./icons.jsx";
import { screenIcon, moduleIcon } from "./icons.jsx";
import { Band, Empty, Sec, Bar, tone, Loading } from "./ui.jsx";

const HOUR_GREET = (h) =>
  h < 5 ? "לילה טוב" : h < 12 ? "בוקר טוב" : h < 17 ? "צהריים טובים" : "ערב טוב";

export function Home({ user, brand, nav, go }) {
  const [day, setDay] = useState(null);
  const [sum, setSum] = useState(null);
  const [reqs, setReqs] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(true);

  const may = (s) => nav?.screens?.includes(s);

  useEffect(() => {
    if (!nav) return;
    setBusy(true);
    const jobs = [];
    if (may("attendance")) jobs.push(api.day().then(setDay).catch(() => {}));
    if (may("requests")) jobs.push(api.requests().then(setReqs).catch(() => {}));
    if (!user.isStaff) jobs.push(api.summary().then(setSum).catch(() => {}));
    Promise.all(jobs)
      .catch((e) => setErr(e.offline ? "אין חיבור לשרת" : e.message))
      .finally(() => setBusy(false));
  }, [nav]); // eslint-disable-line

  const first = String(user.name || "").split(" ")[0];
  const today = new Date().toLocaleDateString("he-IL",
    { weekday: "long", day: "numeric", month: "long" });

  /* ⚠ **מה שדורש פעולה** — נגזר, ולא רשימה שמישהו מתחזק.
     מונה שמראה גם מה שאינו שלי מאמן להתעלם ממנו. */
  const todo = [];
  if (reqs?.waitingForMe > 0) {
    todo.push({
      key: "requests", icon: MI.Plane,
      title: `${reqs.waitingForMe} בקשות יציאה ממתינות לך`,
      note: "המדריך ממליץ, ראש המכינה מכריע",
    });
  }
  if (day && day.inYear && !day.marked && may("attendance")) {
    todo.push({
      key: "attendance", icon: MI.Check,
      title: "הנוכחות של היום טרם סומנה",
      note: "אף אחד עוד לא עבר על הרשימה",
    });
  }

  return (
    <>
      {/* ---------- פתיח ---------- */}
      <div className="row" style={{ marginBottom: "var(--s5)" }}>
        <div className="grow">
          <h1>{HOUR_GREET(new Date().getHours())}, {first}</h1>
          <p className="muted" style={{ marginTop: 2 }}>{today}</p>
        </div>
      </div>

      {busy && <Loading rows={2} />}
      {err && <div className="banner err"><MI.Warn size={18} /><div>{err}</div></div>}

      {/* ---------- דורש פעולה ----------
          ⚠ מוצג **רק כשיש**. כרטיס ריק שאומר "אין מה לעשות"
            הוא רעש שמאמן לדלג על האזור הזה. */}
      {todo.length > 0 && (
        <div className="stack enter" style={{ marginBottom: "var(--s5)" }}>
          {todo.map((t) => (
            <button key={t.key} className="card link item link" onClick={() => go(t.key)}
              style={{ padding: "var(--s4)", borderColor: "var(--warn-line)",
                background: "var(--warn-soft)" }}>
              <div className="tile" style={{ background: "var(--surface)",
                color: "var(--warn)" }}><t.icon size={19} /></div>
              <div className="grow">
                <div style={{ fontWeight: 700, color: "var(--warn)" }}>{t.title}</div>
                <div className="tiny">{t.note}</div>
              </div>
              <MI.Enter size={18} style={{ color: "var(--warn)" }} />
            </button>
          ))}
        </div>
      )}

      {/* ---------- החניך על עצמו ---------- */}
      {sum?.summary && (
        <>
          <Sec>הנוכחות שלי</Sec>
          <Band items={[
            {
              /* ⚠ מתחת לסף מוצג «—» ולא 0%. בתחילת שנה «0%
                 נוכחות» הוא מספר נכון חשבונית ושקרי במשמעותו,
                 והוא הדבר הראשון שהחניך רואה על עצמו. */
              value: sum.summary.pct == null ? null : sum.summary.pct + "%",
              label: sum.summary.pct == null
                ? `עוד ${sum.summary.needMore} ימים`
                : `מתוך ${sum.summary.markedDays} ימים`,
              tone: "ok",
            },
            { value: sum.summary.present, label: "ימי נוכחות" },
            sum.quota != null && { value: sum.quota, label: "מכסת חופש למחצית", tone: "warn" },
          ]} />
        </>
      )}

      {/* ---------- נוכחות היום ---------- */}
      {day && !err && (
        <>
          <Sec right={day.marked ? (
            <button className="btn ghost sm" onClick={() => go("attendance")}>
              <MI.Edit size={15} />לרשימה
            </button>) : null}>נוכחות היום</Sec>

          {!day.inYear ? (
            <div className="banner info">
              <MI.Calendar size={18} />
              <div>התאריך {day.date} אינו בלוח השנה של המכינה.</div>
            </div>
          ) : !day.marked ? (
            /* ⚠ «טרם סומן» אינו «כולם נעדרו». מצב שלישי, ונאמר. */
            <Empty icon={MI.Check} title="היום טרם סומן"
              action={<button className="btn" onClick={() => go("attendance")}>
                <MI.Check size={17} />לסימון הנוכחות</button>}>
              אף אחד עוד לא עבר על הרשימה. זה לא אומר שמישהו חסר.
            </Empty>
          ) : (
            <Band items={[
              { value: day.tally.present, label: "נוכחים", tone: "ok" },
              { value: day.tally.absent, label: "נעדרים",
                tone: day.tally.absent ? "bad" : "" },
              day.tally.half > 0 && { value: day.tally.half, label: "חצי יום", tone: "warn" },
              day.tally.unmarked > 0 && { value: day.tally.unmarked, label: "טרם סומנו" },
            ]} />
          )}
        </>
      )}

      {/* ---------- כל המסכים ----------
          ⚠ אריחים ולא צ׳יפים: אייקון, שם וגוון נגזר-שם.
            רשימת מילים בלי צורה אינה נסרקת בעין. */}
      {nav?.groups?.length > 0 && (
        <>
          <Sec>כל המסכים</Sec>
          <div className="stack" style={{ gap: "var(--s5)" }}>
            {nav.groups.map((g) => {
              const GIcon = moduleIcon(g.module);
              return (
                <div key={g.module}>
                  <h4 style={{ display: "flex", alignItems: "center", gap: 6,
                    marginBottom: "var(--s2)" }}>
                    <GIcon size={13} />{g.title}
                  </h4>
                  <div className="auto">
                    {g.items.map((i) => {
                      const Icon = screenIcon(i.key);
                      return (
                        <button key={i.key}
                          className={"card tight link item link " + tone(i.title)}
                          onClick={() => go(i.key)}>
                          <div className="tile"><Icon size={19} /></div>
                          <div className="grow nm trunc">{i.title}</div>
                          <MI.Enter size={16} style={{ color: "var(--faint)" }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {brand?.setupNeeded?.length > 0 && (
        <div className="banner warn" style={{ marginTop: "var(--s5)" }}>
          <MI.Warn size={18} />
          <div>האפיון עוד לא הושלם — חסרים: {brand.setupNeeded.join(" · ")}</div>
        </div>
      )}
    </>
  );
}
