/* ============================================================
   בלוק טקסט בתוך מסך
   ------------------------------------------------------------
   ⚠⚠⚠ **בלוק שלא נכתב אינו מוצג בכלל** — לא ריק, לא מסגרת,
     ולא «טרם הוזן». מסך שמלא בקופסאות ריקות מלמד להתעלם
     מהן, ואז גם מזו שכן נכתבה. המקום היחיד ש«טרם נכתב» מוצג
     בו הוא מפת הטקסטים, ושם הוא הנקודה.

   ⚠⚠ **חוץ ממי שרשאי לערוך** — לו מוצג כפתור «להוסיף נוסח»
     דק, כי אחרת אין שום דרך לגלות שהמקום הזה קיים. זו
     ההבחנה שהופכת «אפשר לערוך» ל«אפשר למצוא».

   ⚠⚠ **והעריכה כאן, במסך שהטקסט מופיע בו.** מי שקורא נוהל
     ורוצה לנסח אותו מחדש לא צריך לעבור מסך, למצוא אותו שוב
     ברשימה ולזכור מה רצה לשנות.

   ⚠ **`white-space: pre-wrap`** — הטקסט נשמר עם שבירות השורה
     שמישהו כתב בכוונה, ורינדור שמוחק אותן הופך רשימה של
     תשעה סעיפים לפסקה אחת.

   ⚠ **וכישלון טעינה אינו מפיל את המסך** — הבלוק פשוט אינו
     מוצג. מסך נהלים שנופל בגלל הערה בראשו הוא בדיוק ההפך
     ממה שהערה נועדה לה.
   ============================================================ */

import React, { useEffect, useState, useCallback } from "react";
import { api } from "./api.js";
import * as MI from "./icons.jsx";
import { useToast } from "./ui.jsx";

export function ScreenNote({ blockKey, tone = "info", compact = false }) {
  const [b, setB] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    api.contentOne(blockKey)
      .then(setB)
      /* ⚠ שקט בכוונה — ראו ההערה בראש הקובץ. */
      .catch(() => setB(null));
  }, [blockKey]);

  useEffect(() => { load(); }, [load]);

  if (!b) return null;
  if (editing) {
    return <Editor block={b} onClose={() => setEditing(false)}
      onSaved={(next) => { setB(next); setEditing(false); }} />;
  }

  /* ⚠ אין נוסח ואין הרשאה — כלום. אין נוסח ויש הרשאה —
     כפתור דק, כדי שאפשר יהיה לגלות שהמקום קיים. */
  if (!b.body) {
    if (!b.canEdit) return null;
    return (
      <button className="btn quiet sm" style={{ marginBottom: 12 }}
        onClick={() => setEditing(true)}>
        <MI.Plus size={15} />הוספת נוסח — {b.title}
      </button>
    );
  }

  return (
    <div className={"banner " + tone} style={{ alignItems: "flex-start" }}>
      {!compact && <MI.Info size={18} />}
      <div className="grow" style={{ whiteSpace: "pre-wrap" }}>{b.body}</div>
      {b.canEdit && (
        <button className="iconbtn" aria-label={"עריכת " + b.title}
          onClick={() => setEditing(true)}>
          <MI.Edit size={16} />
        </button>
      )}
    </div>
  );
}

/* ============================================================
   מסמך שלם — נהלים, ולא הערה
   ⚠ **שני רכיבים ולא דגל.** «נוהל» הוא מסמך שנקרא מלמעלה
     למטה ו«הערה» היא שורה-שתיים בראש מסך; באנר שמחזיק
     תשעה סעיפים אינו נקרא, ומסמך שמחזיק משפט אחד נראה ריק.
   ============================================================ */
export function ContentDoc({ blockKey, title, empty }) {
  const [b, setB] = useState(null);
  const [err, setErr] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    api.contentOne(blockKey)
      .then((x) => { setB(x); setErr(null); })
      .catch((e) => setErr(e.message));
  }, [blockKey]);

  useEffect(() => { load(); }, [load]);

  if (err) {
    return (
      <div className="banner err">
        <MI.Warn size={18} />
        <div>לא הצלחנו לטעון את הנוסח — {err}</div>
      </div>
    );
  }
  if (!b) return <div className="skel tall" />;

  if (editing) {
    return (
      <div className="card lift">
        <Editor block={b} rows={16} onClose={() => setEditing(false)}
          onSaved={(next) => { setB(next); setEditing(false); }} />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: b.body ? 14 : 0 }}>
        <h2 className="grow">{title || b.title}</h2>
        {b.canEdit && (
          <button className="btn ghost sm" onClick={() => setEditing(true)}>
            <MI.Edit size={15} />{b.body ? "עריכה" : "כתיבה"}
          </button>
        )}
      </div>

      {b.body ? (
        /* ⚠ pre-wrap — ראו ההערה בראש הקובץ. */
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{b.body}</div>
      ) : (
        <div className="empty">
          <div className="e-ico"><MI.Doc size={26} /></div>
          <h3>{empty || "עוד לא נכתב"}</h3>
          <p style={{ marginTop: 6 }}>
            {b.canEdit
              ? "אפשר לכתוב כאן, והטקסט יופיע לכל מי שנכנס למסך הזה."
              : b.editHint}
          </p>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   העורך
   ⚠ **«החזרת הנוסח המקורי» ולא «מחיקה»** כשיש נוסח: הטקסט
     בקוד עדיין קיים, והשורה במכינה היא דריסה שלו. המילה
     צריכה לומר מה קורה.
   ============================================================ */
function Editor({ block, onClose, onSaved, rows = 5 }) {
  const [text, setText] = useState(block.body || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const toast = useToast();

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await api.contentSave(block.key, text);
      toast(r.cleared ? "הנוסח הוסר" : "נשמר", "ok");
      onSaved({ ...block, body: r.body });
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div>
      <div className="row" style={{ marginBottom: 8 }}>
        <h3 className="grow">{block.title}</h3>
        <span className="tiny">{block.editHint}</span>
      </div>
      {err && (
        <div className="banner err"><MI.Warn size={17} /><div>{err}</div></div>
      )}
      <label className="field">
        <textarea rows={rows} value={text} placeholder={block.example}
          onChange={(e) => setText(e.target.value)}
          style={{ lineHeight: 1.7 }} />
        {block.hint && <div className="hint">{block.hint}</div>}
      </label>
      <div className="btns">
        <button className="btn" disabled={busy} onClick={save}>
          {busy ? "שומר…" : "שמירה"}
        </button>
        <button className="btn quiet" onClick={onClose}>ביטול</button>
        {block.body && (
          <button className="btn quiet" disabled={busy}
            style={{ marginInlineStart: "auto" }}
            onClick={() => { setText(""); }}>
            ניקוי הנוסח
          </button>
        )}
      </div>
    </div>
  );
}
