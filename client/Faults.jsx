/* ============================================================
   תקלות ובעיות
   ------------------------------------------------------------
   ⚠⚠ **רשימה אחת לכל המכינה, ולא רשימה לכל אדם.** כשחניך ראה
     רק את מה שהוא דיווח, נוצרו שמונה דיווחים על אותו מזגן.
     «שלי» מסומן **בתוך** הרשימה — רשימה שנייה הייתה מציגה
     את אותה תקלה פעמיים.

   ⚠⚠ **כל הכפתורים מגיעים מהשרת** (`canEdit`, `canDelete`,
     `canHandle`). כפתור שמופיע ומקבל 403 אחרי שהמשתמש כבר
     הקליד הוא בדיוק מה שהכלל הזה נועד למנוע.

   ⚠ **ושם המדווח מוצג לצוות בלבד** — זה נאכף בשרת, ולא כאן.
   ============================================================ */

import React, { useEffect, useState, useCallback } from "react";
import { api } from "./api.js";
import * as MI from "./icons.jsx";
import { Sec, Empty, Failed, Loading, Confirm, Modal, useToast, heDate } from "./ui.jsx";
import { ScreenNote } from "./ScreenNote.jsx";

/* ⚠ סטטוס שאינו מוכר מקבל גון של אזהרה ומוצג בשמו.
   נתון שהגיע מיבוא או מגרסה ישנה צריך להיראות מוזר,
   ולא להיבלע בשקט לתוך «פתוחה». */
const TONE = { open: "warn", working: "info", done: "ok" };
const toneOfStatus = (s) => TONE[s] || "bad";

export function Faults() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState(null);
  const [kill, setKill] = useState(null);
  const [show, setShow] = useState("open");
  const toast = useToast();

  const load = useCallback(() => {
    api.faults()
      .then((x) => { setD(x); setErr(null); })
      .catch((e) => setErr(e.offline ? "אין חיבור לשרת" : e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (err && !d) return <Failed error={err} onRetry={load} />;
  if (!d) return <Loading rows={4} />;

  const remove = async () => {
    try {
      await api.faultDelete(kill.id);
      toast("הדיווח נמחק", "ok");
      setKill(null); load();
    } catch (e) { toast(e.message, "err"); setKill(null); }
  };

  const list = d.faults.filter((f) => (show === "open" ? !f.closed : f.closed));

  return (
    <>
      <Sec right={
        <button className="btn sm" onClick={() => setForm({})}>
          <MI.Plus size={16} />דיווח על תקלה
        </button>
      }>תקלות ובעיות</Sec>

      <ScreenNote blockKey="faults.intro" />

      <div className="band">
        <div>
          <div className="k accent">{d.counts.open}</div>
          <div className="l">פתוחות</div>
        </div>
        <div>
          {/* ⚠ דחוף לחוד — עשרים שורות רגילות הן רעש, ודחופה
              אחת היא פעולה. */}
          <div className={"k " + (d.counts.urgent ? "bad" : "")}>{d.counts.urgent}</div>
          <div className="l">דחופות</div>
        </div>
        <div>
          <div className="k">{d.counts.total - d.counts.open}</div>
          <div className="l">טופלו</div>
        </div>
      </div>

      <div className="segs" style={{ marginTop: 16 }}>
        <button className={"seg " + (show === "open" ? "on" : "")}
          onClick={() => setShow("open")}>פתוחות ובטיפול</button>
        <button className={"seg " + (show === "done" ? "on" : "")}
          onClick={() => setShow("done")}>שטופלו</button>
      </div>

      {list.length === 0 ? (
        /* ⚠⚠ **מצב ריק אמיתי נראה אחרת מכשל טעינה** — הכשל
           מטופל למעלה, ולכן כאן זו באמת מכינה בלי תקלות. */
        <Empty icon={MI.Wrench}
          title={show === "open" ? "אין תקלות פתוחות" : "עוד לא טופלה תקלה"}>
          {show === "open"
            ? "משהו שבור? עדיף לדווח כאן מאשר בהודעה שתיעלם."
            : "תקלות שייסגרו יופיעו כאן."}
        </Empty>
      ) : (
        <div className="rows" style={{ marginTop: 14 }}>
          {list.map((f) => (
            <Row key={f.id} f={f} d={d} onEdit={() => setForm(f)}
              onKill={() => setKill(f)} onSaved={load} />
          ))}
        </div>
      )}

      {form && (
        <FaultForm f={form} d={d} onClose={() => setForm(null)}
          onSaved={(m) => { toast(m, "ok"); setForm(null); load(); }} />
      )}

      {kill && (
        <Confirm title="מחיקת הדיווח" danger cta="למחוק"
          body={`«${kill.title}» יימחק ולא יופיע לאיש. אפשר לדווח שוב בכל רגע.`}
          onYes={remove} onClose={() => setKill(null)} />
      )}
    </>
  );
}

/* ============================================================
   שורה
   ============================================================ */
function Row({ f, d, onEdit, onKill, onSaved }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const setStatus = async (status) => {
    setBusy(true);
    try {
      const r = await api.faultUpdate({ id: f.id, status });
      toast(r.closedNow ? "התקלה סומנה כטופלה" : "המצב עודכן", "ok");
      onSaved();
    } catch (e) { toast(e.message, "err"); }
    finally { setBusy(false); }
  };

  return (
    <div className={"card tight " + (f.urgent && !f.closed ? "danger" : "")}>
      <button className="row start" style={{ width: "100%", textAlign: "start" }}
        onClick={() => setOpen(!open)}>
        <div className="tile sm"><MI.Wrench size={15} /></div>
        <span className="grow">
          <span className="nm">
            {f.title}
            {f.urgent && !f.closed && <span className="pill bad sm">דחוף</span>}
            {/* ⚠ «שלי» בתוך הרשימה ולא ברשימה שנייה. */}
            {f.mine && <span className="pill out sm">שלי</span>}
          </span>
          <div className="tiny">
            {[f.place, f.reportedAt ? heDate(f.reportedAt.slice(0, 10)) : null,
              f.by ? `דיווח: ${f.by}` : null]
              .filter(Boolean).join(" · ")}
          </div>
        </span>
        <span className={"pill " + toneOfStatus(f.status)}>{f.statusLabel}</span>
        {open ? <MI.Up size={16} /> : <MI.Down size={16} />}
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          {f.detail && (
            <div className="panel" style={{ whiteSpace: "pre-wrap" }}>{f.detail}</div>
          )}
          {f.notes && (
            <div className="panel" style={{ marginTop: 8 }}>
              <b>מהטיפול:</b> {f.notes}
            </div>
          )}
          {f.doneAt && (
            <p className="tiny muted" style={{ marginTop: 8 }}>
              נסגרה ב-{heDate(f.doneAt)}
              {f.cost != null && ` · עלות ${f.cost} ₪`}
            </p>
          )}

          <div className="btns" style={{ marginTop: 12 }}>
            {/* ⚠ **המטפל מזיז מצב בלחיצה אחת.** טופס לשינוי
                סטטוס הוא שלושה קליקים על הפעולה הנפוצה ביותר. */}
            {f.canHandle && d.statuses
              .filter((s) => s.slug !== f.status)
              .map((s) => (
                <button className="btn sm quiet" key={s.slug} disabled={busy}
                  onClick={() => setStatus(s.slug)}>
                  סמן: {s.label}
                </button>
              ))}
            {f.canEdit && (
              <button className="btn sm quiet" onClick={onEdit}>
                <MI.Edit size={15} />עריכה
              </button>
            )}
            {f.canDelete && (
              <button className="btn sm ghost" onClick={onKill}>
                <MI.Trash size={15} />מחיקה
              </button>
            )}
          </div>

          {/* ⚠ למי שאינו מטפל ואינו המדווח — נאמר למה אין
              כפתורים, במקום שורה ריקה שנראית כמו תקלה. */}
          {!f.canEdit && !f.canDelete && !f.canHandle && (
            <p className="tiny muted" style={{ marginTop: 6 }}>
              הדיווח אינו שלכם. אפשר להוסיף פרטים למי שמטפל בעל פה.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   הטופס — דיווח ועריכה באותו מקום
   ⚠ שני טפסים נפרדים היו מתפצלים בתיקון הראשון: שדה שנוסף
     לאחד ולא לשני נראה כמו שדה שנעלם.
   ============================================================ */
function FaultForm({ f, d, onClose, onSaved }) {
  const editing = Boolean(f.id);
  const [v, setV] = useState({
    title: f.title || "", place: f.place || "",
    detail: f.detail || "", urgent: Boolean(f.urgent),
    notes: f.notes || "", cost: f.cost ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      if (editing) {
        const body = { id: f.id, title: v.title, place: v.place, detail: v.detail, urgent: v.urgent };
        /* ⚠ שדות הטיפול נשלחים **רק** על ידי מי שרשאי. השרת
           מתעלם מהם ממילא, והמסך לא מעמיד פנים שהוא יכול. */
        if (f.canHandle) { body.notes = v.notes; body.cost = v.cost; }
        const r = await api.faultUpdate(body);
        onSaved(r.same ? "לא השתנה דבר" : `עודכן: ${r.changed.join(" · ")}`);
      } else {
        await api.faultCreate(v);
        onSaved("הדיווח נשלח");
      }
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={editing ? "עריכת הדיווח" : "דיווח על תקלה"} onClose={onClose}>
        {err && <div className="banner err"><MI.Warn size={17} /><div>{err}</div></div>}

        <label className="field">
          <span>מה הבעיה</span>
          <input className="inp" value={v.title} autoFocus
            placeholder="המזגן בכיתה לא מקרר"
            onChange={(e) => setV({ ...v, title: e.target.value })} />
        </label>

        <label className="field">
          <span>איפה</span>
          {/* ⚠ המקומות נגזרים ממה שכבר הוקלד ואינם רשימה בקוד —
              מכינה אחת אומרת «חדר 4» ושנייה «צריף ב׳». */}
          <input className="inp" value={v.place} list="fault-places"
            placeholder="כיתה · מטבח · מקלחות"
            onChange={(e) => setV({ ...v, place: e.target.value })} />
          <datalist id="fault-places">
            {d.places.map((p) => <option value={p} key={p} />)}
          </datalist>
        </label>

        <label className="field">
          <span>פרטים (לא חובה)</span>
          <textarea rows={3} value={v.detail}
            placeholder="מה בדיוק קורה, ממתי"
            onChange={(e) => setV({ ...v, detail: e.target.value })} />
        </label>

        <label className="chk">
          <input type="checkbox" checked={v.urgent}
            onChange={(e) => setV({ ...v, urgent: e.target.checked })} />
          <span>דחוף — משהו שאי אפשר לחכות איתו</span>
        </label>

        {f.canHandle && editing && (
          <>
            <label className="field">
              <span>הערות מהטיפול</span>
              <textarea rows={2} value={v.notes}
                onChange={(e) => setV({ ...v, notes: e.target.value })} />
            </label>
            <label className="field">
              <span>עלות בשקלים</span>
              {/* ⚠ **ריק אינו אפס.** 0 הוא «לא עלה כלום», וריק
                  הוא «לא יודעים כמה». */}
              <input className="inp" inputMode="decimal" dir="ltr" value={v.cost}
                placeholder="ריק = לא ידוע"
                onChange={(e) => setV({ ...v, cost: e.target.value })} />
            </label>
          </>
        )}

        <div className="btns">
          <button className="btn" disabled={busy || !v.title.trim()} onClick={save}>
            {busy ? "שולח…" : editing ? "שמירה" : "שליחת הדיווח"}
          </button>
          <button className="btn quiet" onClick={onClose}>ביטול</button>
        </div>
    </Modal>
  );
}
