/* ============================================================
   הרכיבים המשותפים
   ------------------------------------------------------------
   ⚠ **רק מה שנושא לוגיקה.** כפתור, שדה וכרטיס הם מחלקות
     CSS ולא רכיבים — עטיפה שכל תפקידה להעביר `className`
     מוסיפה שכבה ואינה מונעת שום התפצלות. מה שכאן הוא מה
     שיש בו החלטה: ראשי תיבות, גוון, מצב ריק, הודעה חולפת,
     דיאלוג אישור.

   ⚠⚠ **דיאלוג ולא `confirm()`.** הוא נראה זר, ובחלק
     מהדפדפנים בנייד הוא נחסם לגמרי — כלומר הכפתור פשוט לא
     עושה כלום.
   ============================================================ */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { toneOf } from "./theme.js";
import * as MI from "./icons.jsx";

/* ============================================================
   גוון וראשי תיבות
   ============================================================ */
export const tone = (name) => "tone-" + toneOf(name);

/** ⚠ שתי מילים ראשונות בלבד — שלוש אותיות בעיגול של 38px
    נדחסות ואינן נקראות. */
export function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[1][0];
}

export const Avatar = ({ name, size = "", className = "" }) => (
  <div className={`ava ${size} ${tone(name)} ${className}`} aria-hidden="true">
    {initials(name)}
  </div>
);

/* ============================================================
   כותרת מקטע
   ⚠ קו שממלא את שארית הרוחב — הוא מה שהופך כותרת לחלוקה
     ולא לעוד שורת טקסט מודגשת.
   ============================================================ */
export const Sec = ({ children, right = null }) => (
  <div className="sec">
    <h2>{children}</h2>
    <div className="ln" />
    {right}
  </div>
);

/* ============================================================
   מצב ריק
   ⚠⚠ **מנוסח ולא «אין נתונים».** הוא אומר מה יופיע כאן ומה
     הפעולה. ומצב ריק אמיתי וכשל טעינה הם שני מסכים שונים —
     תמיד, וזה באג שחי יומיים בייצור במערכת הקודמת.
   ============================================================ */
export const Empty = ({ icon: Icon = MI.Info, title, children, action = null }) => (
  <div className="card flat">
    <div className="empty">
      <div className="e-ico"><Icon size={26} /></div>
      <h3>{title}</h3>
      {children && <p style={{ marginTop: 6 }}>{children}</p>}
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  </div>
);

/** ⚠ כשל טעינה — מסך משלו, עם «נסה שוב». לא רשימה ריקה. */
export const Failed = ({ error, onRetry }) => (
  <>
    <div className="banner err">
      <MI.Warn size={18} />
      <div>לא הצלחנו לטעון — {error}</div>
    </div>
    {onRetry && <button className="btn ghost" onClick={onRetry}>נסה שוב</button>}
  </>
);

export const Loading = ({ rows = 3 }) => (
  <div aria-busy="true" aria-live="polite">
    {Array.from({ length: rows }, (_, i) => <div className="skel" key={i} />)}
  </div>
);

/* ============================================================
   הודעות חולפות
   ⚠ **חולפת ולא באנר שנשאר.** באנר שנשאר על המסך דוחף את
     התוכן ומאמן להתעלם ממנו.
   ⚠ ו-`aria-live` — מי שמשתמש בקורא מסך אינו רואה את
     ההודעה, ובלי זה הוא אינו יודע שהפעולה הצליחה.
   ============================================================ */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function Toasts({ children }) {
  const [list, setList] = useState([]);
  const seq = useRef(0);

  const push = useCallback((text, kind = "ok", ms = 3400) => {
    const id = ++seq.current;
    setList((l) => [...l, { id, text, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), ms);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {list.map((t) => (
          <div className={"toast " + t.kind} key={t.id}>
            {t.kind === "bad" ? <MI.Warn size={17} /> : <MI.Check size={17} />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ============================================================
   דיאלוג
   ⚠ `Escape` סוגר, והרקע סוגר. דיאלוג שאפשר לצאת ממנו רק
     בכפתור אחד הוא מלכודת בטלפון.
   ============================================================ */
export function Modal({ title, children, onClose, wide = false }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    /* ⚠ נעילת גלילת הרקע — בלעדיה הגיליון בטלפון "בורח" */
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true"
        style={wide ? { maxWidth: 680 } : undefined}>
        <div className="row" style={{ marginBottom: 14 }}>
          <h2 className="grow">{title}</h2>
          <button className="iconbtn" onClick={onClose} aria-label="סגירה">
            <MI.Close size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * אישור לפעולה שאי אפשר לבטל.
 *
 * ⚠⚠ **אומר מה בדיוק יקרה, ולא «בטוח?».** «בטוח?» על פעולה
 *   שמשנה מספר או מוחקת עשרים שורות אינה שאלה שאפשר לענות
 *   עליה.
 */
export function Confirm({ title, body, cta = "אישור", danger = false, onYes, onClose }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted" style={{ marginBottom: 20 }}>{body}</p>
      <div className="btns">
        <button className={"btn " + (danger ? "danger" : "")} disabled={busy}
          onClick={async () => { setBusy(true); try { await onYes(); } finally { onClose(); } }}>
          {busy ? "רגע…" : cta}
        </button>
        <button className="btn quiet" onClick={onClose}>ביטול</button>
      </div>
    </Modal>
  );
}

/* ============================================================
   בורר מקטעים
   ⚠ הרצועה נגללת, **והמונה חלק מהכפתור** — מספר שיושב
     במקום אחר מאלץ להצליב בעין.
   ============================================================ */
export const Segs = ({ value, onChange, options }) => (
  <div className="segs" role="tablist">
    {options.map((o) => (
      <button key={o.key} role="tab" aria-selected={value === o.key}
        className={"seg " + (value === o.key ? "on" : "")}
        onClick={() => onChange(o.key)}>
        {o.icon ? <o.icon size={16} /> : null}
        {o.label}
        {o.count != null && <span className="cnt">{o.count}</span>}
      </button>
    ))}
  </div>
);

/* ============================================================
   רצועת מספרים
   ⚠ **מספר בלי מילה אינו נקרא**, ו-`null` מוצג כ־«—» ולא
     כאפס: «0%» הוא טענה, ו«אין עדיין מה למדוד» הוא מצב אחר
     לגמרי.
   ============================================================ */
export const Band = ({ items }) => (
  <div className="band">
    {items.filter(Boolean).map((s, i) => (
      <div key={i}>
        <div className={"k " + (s.tone || "")}>{s.value == null ? "—" : s.value}</div>
        <div className="l">{s.label}</div>
      </div>
    ))}
  </div>
);

/** פס כמות מול יעד */
export const Bar = ({ value, max, tone: t = "", className = "" }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`bar ${t} ${className}`} role="progressbar"
      aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <i style={{ width: pct + "%" }} />
    </div>
  );
};

/* ⚠ תאריך עברי קצר. הפורמט חוזר בעשרה מסכים, ושלוש גרסאות
   שלו הן שלוש דרכים לכתוב את אותו יום. */
export function heDate(d, { year = true } = {}) {
  if (!d) return "";
  const [y, m, dd] = String(d).split("-");
  return `${Number(dd)}.${Number(m)}${year ? "." + y.slice(2) : ""}`;
}

export const heRange = (a, b) =>
  a === b ? heDate(a) : `${heDate(a, { year: false })} – ${heDate(b)}`;
