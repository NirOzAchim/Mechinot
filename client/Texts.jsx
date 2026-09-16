/* ============================================================
   שני מסכים שהטקסטים מזינים
   ------------------------------------------------------------
   `Rules`  — הנהלים, לכל המכינה
   `Texts`  — המפה: מה קיים, מה עוד לא נכתב, ומי עורך מה

   ⚠⚠ **המפה היא המקום היחיד ש«טרם נכתב» מוצג בו**, ודווקא
     שם הוא המידע. בתוך מסך, בלוק שלא נכתב אינו מוצג כלל —
     מסך מלא בקופסאות ריקות מלמד להתעלם מהן.

   ⚠ **והמפה אינה עורך שני.** היא מציגה, ומי שלוחץ נכנס
     לאותו רכיב עריכה שיושב במסך עצמו. שני עורכים היו
     מתפצלים, ואז הכללים שונים לפי איפה נכנסת.
   ============================================================ */

import React, { useEffect, useState, useCallback } from "react";
import { api } from "./api.js";
import * as MI from "./icons.jsx";
import { Sec, Empty, Failed, Loading, tone, useToast } from "./ui.jsx";
import { ContentDoc } from "./ScreenNote.jsx";

/* ============================================================
   נהלים
   ⚠ מסך אחד, בלוק אחד. הקוד **אינו מכיר את תוכנו**: הוא לא
     מפצל לסעיפים, לא מזהה כותרות ולא סופר קווים אדומים —
     כל מבנה שנכפה היה נשבר בעריכה הראשונה של מי שכותב.
   ============================================================ */
export function Rules() {
  return (
    <div className="wrap narrow">
      <ContentDoc blockKey="rules.main" title="נהלים במכינה"
        empty="הנהלים עוד לא נכתבו" />
    </div>
  );
}

/* ============================================================
   מפת הטקסטים
   ============================================================ */
export function Texts() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [open, setOpen] = useState(null);

  const load = useCallback(() => {
    api.content().then((x) => { setD(x); setErr(null); })
      .catch((e) => setErr(e.offline ? "אין חיבור לשרת" : e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (err && !d) return <Failed error={err} onRetry={load} />;
  if (!d) return <Loading rows={4} />;

  const written = d.blocks.filter((b) => b.body).length;
  const mine = d.blocks.filter((b) => b.canEdit).length;

  return (
    <>
      <Sec>הטקסטים של המכינה</Sec>
      <p className="muted">
        כל נוסח במערכת נערך מכאן או מהמסך שהוא מופיע בו — <b>בלי דיפלוי
        ובלי לפתוח קריאה</b>. מה שלא נכתב פשוט אינו מוצג.
      </p>

      {/* ⚠ המספר אומר כמה **מתוך כמה**: «4 נכתבו» לבדו אינו
          אומר אם נשארו שניים או עשרים. */}
      <div className="band" style={{ margin: "18px 0" }}>
        <div>
          <div className="k accent">{written}</div>
          <div className="l">נכתבו מתוך {d.blocks.length}</div>
        </div>
        <div>
          <div className="k">{mine}</div>
          <div className="l">שאתם רשאים לערוך</div>
        </div>
      </div>

      {d.blocks.length === 0 ? (
        <Empty icon={MI.Doc} title="אין בלוקי טקסט במכינה הזו">
          הם נגזרים מהמודולים הדלוקים.
        </Empty>
      ) : (
        <div className="rows">
          {d.blocks.map((b) => (
            <Row key={b.key} b={b} open={open === b.key}
              onToggle={() => setOpen(open === b.key ? null : b.key)}
              onSaved={load} />
          ))}
        </div>
      )}
    </>
  );
}

function Row({ b, open, onToggle, onSaved }) {
  const [text, setText] = useState(b.body || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const toast = useToast();

  useEffect(() => { setText(b.body || ""); }, [b.body, open]);

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await api.contentSave(b.key, text);
      toast(r.cleared ? "הנוסח הוסר" : "נשמר", "ok");
      onSaved();
      onToggle();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className={"card tight " + tone(b.title)}>
      <button className="row" onClick={onToggle}
        style={{ width: "100%", textAlign: "start" }}>
        <div className="tile sm">
          {b.kind === "doc" ? <MI.Doc size={15} /> : <MI.Info size={15} />}
        </div>
        <span className="grow">
          <span className="nm">{b.title}</span>
          <div className="tiny">
            {b.where}
            {/* ⚠ **«טרם נכתב» מוצג כאן ורק כאן** — ראו ההערה
                בראש הקובץ. */}
            {!b.body && " · טרם נכתב"}
          </div>
        </span>
        {b.canEdit
          ? <span className="pill tone">{b.body ? "נכתב" : "לכתיבה"}</span>
          : <span className="pill out">{b.editHint}</span>}
        {open ? <MI.Up size={16} /> : <MI.Down size={16} />}
      </button>

      {open && (
        <div style={{ marginTop: 14 }}>
          {err && (
            <div className="banner err"><MI.Warn size={17} /><div>{err}</div></div>
          )}

          {b.canEdit ? (
            <>
              <label className="field">
                <textarea rows={b.kind === "doc" ? 12 : 4} value={text}
                  placeholder={b.example} style={{ lineHeight: 1.7 }}
                  onChange={(e) => setText(e.target.value)} />
                <div className="hint">{b.hint}</div>
              </label>
              <div className="btns">
                <button className="btn sm" disabled={busy} onClick={save}>
                  {busy ? "שומר…" : "שמירה"}
                </button>
                {b.body && (
                  <button className="btn quiet sm" disabled={busy}
                    onClick={() => setText("")}>ניקוי הנוסח</button>
                )}
              </div>
            </>
          ) : (
            /* ⚠ מי שאינו רשאי **רואה את הנוסח** ואינו מקבל מסך
               נעול. הוא קורא אותו ממילא במסך שהוא מופיע בו. */
            <div className="panel" style={{ whiteSpace: "pre-wrap" }}>
              {b.body || "עוד לא נכתב."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
