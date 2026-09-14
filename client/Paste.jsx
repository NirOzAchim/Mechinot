/* ============================================================
   הכנסת נתונים — קובץ או הדבקה → תצוגה מקדימה → אישור
   ------------------------------------------------------------
   ⚠⚠ **תמיד רואים לפני שכותבים.** הקלט הוא רשימה של אדם,
     ופרסור שגוי שנכתב ישר הוא 33 שורות למחוק ביד.

   ⚠⚠ **מה שלא נקלט מוצג עם הסיבה ועם מספר השורה.** שורה
     שנעלמת בשקט היא חניך שלא קיים, ואיש לא יידע עד ספטמבר.

   ⚠⚠ **ושתי רשימות דחייה נפרדות:**
       bad    — הפרסור נכשל («לא נמצא שם»)
       failed — הפרסור הצליח ו**המסד סירב**
     בלי ההפרדה שתיהן נראות כמו «לא נקלטה», והמנהל לא יודע
     אם לתקן את הרשימה או משהו אחר.

   ⚠⚠⚠ **הקובץ נקרא לתוך תיבת ההדבקה ולא לתוך מסלול שני.**
     גיליון נושא כותרות, שורות ריקות ותאים ממוזגים, וחילוץ
     שטוח לעולם לא יהיה מושלם — ולכן הטקסט מופיע, המנהל
     רואה אותו, ומתקן. מסלול שכותב ישר מהקובץ היה מייצר
     בדיוק את השורות שאי אפשר להסביר.
   ============================================================ */

import React, { useState, useRef } from "react";
import { api } from "./api.js";
import { readFile, ACCEPT } from "./readfile.js";
import * as MI from "./icons.jsx";
import { useToast } from "./ui.jsx";

export function Paste({ kind, def, onDone }) {
  const [text, setText] = useState("");
  const [src, setSrc] = useState(null);      /* מאיפה הגיע הטקסט */
  const [prev, setPrev] = useState(null);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [over, setOver] = useState(false);
  const fileRef = useRef(null);
  const toast = useToast();

  const reset = () => { setPrev(null); setRes(null); setErr(null); };

  /* ⚠ קריאת הקובץ היא **בדפדפן בלבד** — הוא אינו עולה לשרת,
     ולכן אין כאן נקודת קצה חדשה ואין קובץ ששוכב במקום כלשהו. */
  const take = async (file) => {
    if (!file) return;
    setErr(null);
    try {
      const r = await readFile(file);
      setText(r.text);
      setSrc({ name: r.name, lines: r.lines });
      reset();
      toast(`נקרא «${r.name}» — ${r.lines} שורות`, "ok");
    } catch (e) {
      /* ⚠ «נקרא וריק» ו«לא הצלחנו לקרוא» הם שני מצבים, ולכן
         שתי הודעות. הראשון פירושו כנראה הלשונית הלא-נכונה. */
      setErr(e.empty ? `${e.message} — אולי זו לשונית אחרת בחוברת?` : e.message);
    }
  };

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
      setRes(r); setPrev(null); setText(""); setSrc(null);
      toast(`נוספו ${r.created}`, "ok");
      onDone?.();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  if (!def) return null;
  const rejected = res ? res.bad.length + res.failed.length : 0;

  return (
    <div className="stack" style={{ marginTop: 16 }}>
      {def.have > 0 && !prev && !res && (
        <div className="banner info">
          <MI.Info size={18} />
          <div>
            כבר יש {def.have} במערכת. רשימה חוזרת <b>אינה מכפילה</b> —
            מה שקיים ידולג.
          </div>
        </div>
      )}

      {err && (
        <div className="banner err">
          <MI.Warn size={18} />
          <div>{err}</div>
        </div>
      )}

      {/* ---------- מה נכתב בפועל ---------- */}
      {res && (
        <>
          <div className={"banner " + (rejected ? "warn" : "ok")}>
            {rejected ? <MI.Warn size={18} /> : <MI.Check size={18} />}
            <div>
              <b>נוספו {res.created}</b>
              {res.skipped > 0 && <> · כבר היו {res.skipped}</>}
              {rejected > 0 && <> · <b>לא נקלטו {rejected}</b></>}
              <div className="tiny" style={{ marginTop: 2 }}>
                מתוך {res.pasted} שורות
              </div>
            </div>
          </div>
          {rejected > 0 && <Rejects bad={res.bad} failed={res.failed} />}
        </>
      )}

      {/* ---------- הקלט ---------- */}
      {!prev && (
        <>
          <div
            className={"drop " + (over ? "over" : "")}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault(); setOver(false);
              take(e.dataTransfer.files?.[0]);
            }}
          >
            <MI.Upload size={24} style={{ margin: "0 auto 8px" }} />
            <div style={{ fontWeight: 700, color: "var(--ink)" }}>
              גרירת קובץ לכאן, או לחיצה לבחירה
            </div>
            <div className="tiny" style={{ marginTop: 3 }}>
              אקסל · וורד · CSV · טקסט — נקרא כאן במחשב ואינו נשלח לשום מקום
            </div>
            <input ref={fileRef} type="file" accept={ACCEPT}
              onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
          </div>

          <div className="or">או להדביק</div>

          <label className="field" style={{ marginBottom: 0 }}>
            <span>{def.hint}</span>
            <textarea rows={8} value={text} placeholder={def.example}
              onChange={(e) => { setText(e.target.value); setSrc(null); reset(); }} />
          </label>

          {src && (
            <div className="row tiny">
              <MI.File size={14} />
              <span>{src.name} · {src.lines} שורות · אפשר לתקן כאן לפני שממשיכים</span>
            </div>
          )}

          <div className="btns">
            <button className="btn" disabled={!text.trim() || busy} onClick={preview}>
              {busy ? "בודק…" : "תצוגה מקדימה"}
            </button>
            {text && (
              <button className="btn quiet" onClick={() => { setText(""); setSrc(null); reset(); }}>
                ניקוי
              </button>
            )}
          </div>
        </>
      )}

      {/* ---------- מה עומד להיכתב ---------- */}
      {prev && (
        <>
          {/* ⚠ המספרים המדויקים, לפני הכתיבה. «נוסיף 33» כשבפועל
              נוספים 20 הוא ההבדל בין אמון לחוסר אמון במסך. */}
          <div className={"banner " + (prev.bad.length ? "warn" : "info")}>
            <MI.Eye size={18} />
            <div>
              ייכתבו <b>{prev.willCreate}</b>
              {prev.willSkip > 0 && <> · ידולגו {prev.willSkip} שכבר קיימים</>}
              {prev.bad.length > 0 && <> · <b>{prev.bad.length} לא נקלטו</b></>}
              {/* ⚠ שורת הכותרות מדולגת **ונאמרת**. שורה שנעלמת
                  בלי מילה היא בדיוק מה שמונע מהמנהל לדעת אם
                  המערכת הבינה נכון את הקובץ שלו. */}
              {prev.header && (
                <div className="tiny" style={{ marginTop: 3 }}>
                  שורת הכותרות דולגה — «{prev.header}»
                </div>
              )}
            </div>
          </div>

          {prev.bad.length > 0 && <Rejects bad={prev.bad} failed={[]} />}

          {prev.rows.length > 0 && (
            <Table columns={prev.columns} kind={kind}
              rows={prev.rows} total={prev.total} />
          )}

          <div className="btns">
            <button className="btn" disabled={busy || prev.willCreate === 0} onClick={commit}>
              {busy ? "כותב…" : `אישור — הוספת ${prev.willCreate}`}
            </button>
            <button className="btn ghost" onClick={reset}>חזרה לעריכה</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   הטבלה
   ⚠ **ארבעים שורות ואז מספר.** תצוגה מקדימה של 300 שורות
     אינה נקראת, ומה שחשוב בה הוא שהעמודות נחתו נכון.
   ============================================================ */
function Table({ columns, rows, total, kind }) {
  const cols = `repeat(${columns.length},minmax(90px,1fr))`;
  return (
    <div className="tbl scroll-x">
      <div style={{ minWidth: columns.length * 100 }}>
        <div className="tr hd" style={{ "--cols": cols }}>
          {columns.map((c) => <span key={c}>{c}</span>)}
        </div>
        <div className="rl">
          {rows.slice(0, 40).map((r, i) => (
            <div className="tr" key={i} style={{ "--cols": cols }}>
              {cellsFor(kind, r).map((c, j) => (
                <span key={j} className={c == null ? "faint" : ""}>{c ?? "—"}</span>
              ))}
            </div>
          ))}
        </div>
        {total > 40 && <div className="more">…ועוד {total - 40} שורות</div>}
      </div>
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
function Rejects({ bad, failed }) {
  return (
    <div className="card flat tight">
      {bad.length > 0 && (
        <>
          <h4 style={{ marginBottom: 6 }}>לא נקלטו בקריאה</h4>
          {bad.map((b, i) => (
            <div className="rj" key={"b" + i}>
              {b.n && <span className="ix">שורה {b.n}</span>}
              <span className="raw">{b.raw}</span>
              <span className="why">{b.why}</span>
            </div>
          ))}
        </>
      )}
      {failed.length > 0 && (
        <>
          <h4 style={{ margin: bad.length ? "14px 0 6px" : "0 0 6px" }}>
            נקראו, והמערכת סירבה
          </h4>
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
