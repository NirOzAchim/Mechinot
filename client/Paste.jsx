/* ============================================================
   הדבקה → תצוגה מקדימה → אישור
   ------------------------------------------------------------
   ⚠⚠ **תמיד רואים לפני שכותבים.** הקלט הוא הדבקה של אדם,
     ופרסור שגוי שנכתב ישר הוא 33 שורות למחוק ביד.

   ⚠⚠ **מה שלא נקלט מוצג עם הסיבה ועם מספר השורה.** שורה
     שנעלמת בשקט היא חניך שלא קיים, ואיש לא יידע עד ספטמבר.

   ⚠⚠ **ושתי רשימות דחייה נפרדות:**
       bad    — הפרסור נכשל («לא נמצא שם»)
       failed — הפרסור הצליח ו**המסד סירב**
     בלי ההפרדה שתיהן נראות כמו «לא נקלטה», והמנהל לא יודע
     אם לתקן את ההדבקה או משהו אחר.
   ============================================================ */

import React, { useState } from "react";
import { api } from "./api.js";

export function Paste({ kind, def, onDone }) {
  const [text, setText] = useState("");
  const [prev, setPrev] = useState(null);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const reset = () => { setPrev(null); setRes(null); setErr(null); };

  const preview = async () => {
    if (!text.trim() || busy) return;
    setBusy(true); setErr(null); setRes(null);
    try { setPrev(await api.importPreview(kind, text)); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const commit = async () => {
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      const r = await api.importCommit(kind, text);
      setRes(r); setPrev(null); setText("");
      onDone?.();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  if (!def) return null;

  return (
    <div style={{ marginTop: 14 }}>
      {def.have > 0 && (
        <div className="banner info">
          כבר יש {def.have} במערכת. הדבקה חוזרת <b>אינה מכפילה</b> —
          מה שקיים ידולג.
        </div>
      )}

      {err && <div className="banner err">{err}</div>}

      {/* ---------- התוצאה ---------- */}
      {res && (
        <div className={"banner " + (res.failed.length || res.bad.length ? "info" : "ok-b")}>
          <b>נוספו {res.created}</b>
          {res.skipped > 0 && <> · כבר היו {res.skipped}</>}
          {(res.bad.length > 0 || res.failed.length > 0) && (
            <> · <b>לא נקלטו {res.bad.length + res.failed.length}</b></>
          )}
          <div className="faint" style={{ marginTop: 4 }}>מתוך {res.pasted} שורות שהודבקו</div>
        </div>
      )}
      {res && (res.bad.length > 0 || res.failed.length > 0) && (
        <RejectList bad={res.bad} failed={res.failed} />
      )}

      {/* ---------- ההדבקה ---------- */}
      {!prev && (
        <>
          <label className="field">
            <span>{def.hint}</span>
            <textarea id={`paste-${kind}`} rows={8} value={text}
              placeholder={def.example}
              onChange={(e) => { setText(e.target.value); reset(); }}
              style={{ fontFamily: "inherit", direction: "rtl" }} />
          </label>
          <button className="btn" disabled={!text.trim() || busy} onClick={preview}>
            {busy ? "בודק…" : "תצוגה מקדימה"}
          </button>
        </>
      )}

      {/* ---------- התצוגה המקדימה ---------- */}
      {prev && (
        <>
          <div className="banner info">
            {/* ⚠ המספרים המדויקים, לפני הכתיבה. «נוסיף 33» כשבפועל
                נוספים 20 הוא ההבדל בין אמון לחוסר אמון במסך. */}
            ייכתבו <b>{prev.willCreate}</b>
            {prev.willSkip > 0 && <> · ידולגו {prev.willSkip} שכבר קיימים</>}
            {prev.bad.length > 0 && <> · <b>{prev.bad.length} לא נקלטו</b></>}
          </div>

          {prev.bad.length > 0 && <RejectList bad={prev.bad} failed={[]} />}

          {prev.rows.length > 0 && (
            <div className="tbl">
              <div className="tr th">
                {prev.columns.map((c) => <span key={c}>{c}</span>)}
              </div>
              {prev.rows.slice(0, 40).map((r, i) => (
                <div className="tr" key={i}>
                  {cellsFor(kind, r).map((c, j) => <span key={j}>{c ?? "—"}</span>)}
                </div>
              ))}
              {prev.total > 40 && (
                <div className="tr faint">…ועוד {prev.total - 40} שורות</div>
              )}
            </div>
          )}

          <div className="row-btns">
            <button className="btn ghost" onClick={reset}>חזרה לעריכה</button>
            <button className="btn" disabled={busy || prev.willCreate === 0} onClick={commit}>
              {busy ? "כותב…" : `אישור — הוספת ${prev.willCreate}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** התאמת שורה לעמודות שהוגדרו במפרסר */
function cellsFor(kind, r) {
  switch (kind) {
    case "students": return [r.name, r.nationalId, genderLabel(r.gender), r.phone, r.city];
    case "staff": return [r.name, r._roleText, r.phone, r.email];
    case "calendar": return [r.date, r.kind];
    case "courses": return [r.subject, r.lecturer, r.dayTime, r.pricePerSession];
    case "teams": return [r.name, r.category, r.capacity];
    default: return Object.values(r);
  }
}
const genderLabel = (g) => g === "male" ? "זכר" : g === "female" ? "נקבה" : null;

/** ⚠ שתי הרשימות מוצגות בנפרד ומסומנות, ראו ההערה בראש הקובץ. */
function RejectList({ bad, failed }) {
  return (
    <div className="rejects">
      {bad.length > 0 && (
        <>
          <h4>לא נקלטו בפרסור</h4>
          {bad.map((b, i) => (
            <div className="rj" key={"b" + i}>
              {b.n && <span className="ln">שורה {b.n}</span>}
              <span className="raw">{b.raw}</span>
              <span className="why">{b.why}</span>
            </div>
          ))}
        </>
      )}
      {failed.length > 0 && (
        <>
          <h4>נקלטו, והמערכת סירבה</h4>
          {failed.map((f, i) => (
            <div className="rj" key={"f" + i}>
              <span className="raw">{f.key}</span>
              <span className="why">{f.why}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
