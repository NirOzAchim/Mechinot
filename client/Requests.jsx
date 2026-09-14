/* ============================================================
   בקשות יציאה
   ------------------------------------------------------------
   ⚠⚠ **מסך אחד, שני קהלים — והשרת מכריע מי רואה מה.**
     `staffView` מגיע מהשרת ואינו נגזר מהתפקיד במסך. שני
     מסכים נפרדים היו מתפצלים ביום הראשון, וזה בדיוק הלקח
     של «מסך של בעל תפקיד זהה למסך של המנהל».

   ⚠⚠ **החניך אינו רואה את השלבים בכלל** — לא מי המדריך שלו,
     לא מה הוא המליץ, ולא היכן הבקשה עומדת. זה נאכף **בשרת**
     (שני מיפויים נפרדים), והמסך הזה אינו יכול לחשוף אותם
     גם אם ירצה.

   ⚠ **`canDecide` ו-`canEdit` מגיעים מהשרת.** כפתור שמופיע
     ומקבל 403 אחרי שהמשתמש כבר הקליד הוא בדיוק מה שהכלל
     נועד למנוע.
   ============================================================ */

import React, { useEffect, useState, useCallback } from "react";
import { api } from "./api.js";
import * as MI from "./icons.jsx";

const TYPES = [
  { slug: "vacation", label: "יום חופש", needsDetail: false },
  { slug: "sick", label: "מחלה", needsDetail: true },
  { slug: "justified", label: "היעדרות מוצדקת", needsDetail: true },
];
const typeLabel = (s) => TYPES.find((t) => t.slug === s)?.label || s;

const STATUS = {
  pending: { label: "ממתין", tone: "warn" },
  approved: { label: "מאושר", tone: "ok" },
  rejected: { label: "נדחה", tone: "bad" },
};

const STAGE = {
  guide: "אצל המדריך",
  head: "אצל ראש המכינה",
  done: "",
};

const he = (d) => {
  if (!d) return "";
  const [y, m, dd] = d.split("-");
  return `${Number(dd)}.${Number(m)}.${y.slice(2)}`;
};

const range = (r) =>
  r.fromDate === r.toDate ? he(r.fromDate) : `${he(r.fromDate)} – ${he(r.toDate)}`;

export function Requests() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setErr(null);
    try { setD(await api.requests()); }
    catch (e) { setErr(e.offline ? "אין חיבור לשרת" : e.message); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (busy) return <><div className="skel" /><div className="skel" /></>;

  /* ⚠ כשל טעינה נראה אחרת מ«אין בקשות» — תמיד. */
  if (err) return <>
    <div className="banner err">לא הצלחנו לטעון — {err}</div>
    <button className="btn" onClick={() => { setBusy(true); load(); }}>נסה שוב</button>
  </>;

  const after = (m) => { setMsg(m); setForm(false); setEditing(null); load(); };

  return (
    <>
      <h1 style={{ marginBottom: 4 }}>בקשות יציאה</h1>
      {msg && <div className="banner ok">{msg}</div>}

      {d.staffView
        ? <StaffView d={d} after={after} setMsg={setMsg} />
        : <StudentView d={d} form={form} setForm={setForm}
            editing={editing} setEditing={setEditing} after={after} />}
    </>
  );
}

/* ============================================================
   צד החניך
   ============================================================ */
function StudentView({ d, form, setForm, editing, setEditing, after }) {
  const left = d.left;
  return (
    <>
      {/* ⚠ המכסה נספרת מבקשות מאושרות בלבד, וזה נאמר —
          יתרה שלא זזה אחרי סימון ידני נראית כמו באג. */}
      {d.quota != null && (
        <div className="band" style={{ margin: "14px 0 18px" }}>
          <div>
            <div className={"k " + (left === 0 ? "bad" : left <= 1 ? "warn" : "ok")}>{left}</div>
            <div className="l">ימי חופש שנותרו</div>
          </div>
          <div><div className="k">{d.used}</div><div className="l">נוצלו</div></div>
          <div><div className="k">{d.quota}</div><div className="l">המכסה למחצית</div></div>
        </div>
      )}

      {!form && !editing && (
        <button className="btn" onClick={() => setForm(true)}>בקשה חדשה</button>
      )}

      {(form || editing) && (
        <Form row={editing} onCancel={() => { setForm(false); setEditing(null); }}
          onDone={after} />
      )}

      <h2 style={{ margin: "22px 0 10px" }}>הבקשות שלי</h2>

      {d.mine.length === 0 ? (
        <div className="card"><div className="empty">
          <h3>עוד לא ביקשת כלום</h3>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            בקשה נשלחת לצוות, ומגיעה אליך תשובה: מאושר או נדחה.
          </p>
        </div></div>
      ) : d.mine.map((r) => (
        <div className="card" key={r.id} style={{ marginBottom: 10 }}>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3>{typeLabel(r.type)} · {range(r)}</h3>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                יציאה {r.outAt} · חזרה {r.backAt}
                {r.chargedDays != null && <> · נגבו {r.chargedDays} ימים מהמכסה</>}
              </p>
              {r.detail && <p className="faint" style={{ margin: "6px 0 0" }}>{r.detail}</p>}
            </div>
            <span className={"pill " + STATUS[r.status].tone}>{STATUS[r.status].label}</span>
          </div>

          {/* ⚠⚠ אין כאן שום מילה על שלבים או על מי המליץ מה.
              השרת לא שולח את זה, והמסך לא ממציא. */}
          {r.canEdit && (
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn ghost sm" onClick={() => setEditing(r)}>עריכה</button>
              <button className="btn ghost sm" onClick={async () => {
                await api.requestDelete(r.id);
                after("הבקשה בוטלה");
              }}>ביטול הבקשה</button>
            </div>
          )}

          {/* ---------- ערר ----------
              ⚠⚠ **הערר אינו משנה את הסטטוס, וזה כתוב כאן.**
                בלי המשפט הזה מישהו יראה «הוגש ערר» ויסיק
                שהוא יכול לנסוע. */}
          {r.appeal && (
            <div className="banner info" style={{ marginTop: 12 }}>
              <MI.Info size={17} />
              <div>
                <b>הוגש ערר</b> — ההחלטה עצמה לא השתנתה.
                <div className="tiny" style={{ marginTop: 3 }}>{r.appeal}</div>
              </div>
            </div>
          )}
          {r.canAppeal && <Appeal row={r} after={after} />}
        </div>
      ))}
    </>
  );
}


/* ============================================================
   ערר על החלטה
   ⚠⚠ **פעם אחת, ורק על בקשה שהוכרעה.** ערר שני היה דורס את
     הראשון, וראש המכינה היה קורא טקסט אחר ממה שקרא אתמול.
   ⚠ **וההחלטה נשארת כפי שהיא** — נאמר לפני השליחה ואחריה.
   ============================================================ */
function Appeal({ row, after }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  if (!open) {
    return (
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn quiet sm" onClick={() => setOpen(true)}>
          הגשת ערר על ההחלטה
        </button>
      </div>
    );
  }

  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <p className="tiny" style={{ marginBottom: 8 }}>
        מה השתנה, או מה לא נלקח בחשבון? <b>ההחלטה עצמה לא משתנה</b> —
        הבקשה חוזרת לבדיקה של ראש המכינה.
      </p>
      {err && <div className="err-t" style={{ marginBottom: 8 }}>{err}</div>}
      <textarea className="inp" rows={3} value={text}
        style={{ height: "auto", padding: "10px 14px", minHeight: 76 }}
        placeholder="ידעתי על זה חודש מראש, ולא הספקתי לכתוב את זה בבקשה."
        onChange={(e) => setText(e.target.value)} />
      <div className="btns" style={{ marginTop: 10 }}>
        <button className="btn sm" disabled={busy || text.trim().length < 10}
          onClick={async () => {
            setBusy(true); setErr(null);
            try {
              const r = await api.requestAppeal(row.id, text);
              after(r.note);
            } catch (e) { setErr(e.message); setBusy(false); }
          }}>{busy ? "שולח…" : "שליחת הערר"}</button>
        <button className="btn quiet sm" onClick={() => setOpen(false)}>ביטול</button>
      </div>
    </div>
  );
}

/* ============================================================
   הטופס — להגשה ולעריכה
   ============================================================ */
function Form({ row, onCancel, onDone }) {
  const [f, setF] = useState(() => ({
    type: row?.type || "vacation",
    fromDate: row?.fromDate || "",
    toDate: row?.toDate || "",
    outAt: row?.outAt || "",
    backAt: row?.backAt || "",
    detail: row?.detail || "",
  }));
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const needsDetail = TYPES.find((t) => t.slug === f.type)?.needsDetail;

  const go = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const body = { ...f, toDate: f.toDate || f.fromDate };
    try {
      const r = row
        ? await api.requestUpdate({ id: row.id, ...body })
        : await api.requestCreate(body);
      onDone(r.guideReset
        ? "הבקשה עודכנה. מכיוון שהתאריכים השתנו, היא חזרה לתחילת הטיפול."
        : row ? "הבקשה עודכנה" : "הבקשה נשלחה");
    } catch (x) { setErr(x.message); setBusy(false); }
  };

  return (
    <form className="card lift" style={{ margin: "14px 0" }} onSubmit={go}>
      <h2>{row ? "עריכת הבקשה" : "בקשה חדשה"}</h2>

      <div className="segs" style={{ margin: "12px 0" }}>
        {TYPES.map((t) => (
          <button key={t.slug} type="button"
            className={"seg " + (f.type === t.slug ? "on" : "")}
            onClick={() => setF({ ...f, type: t.slug })}>{t.label}</button>
        ))}
      </div>

      <div className="two">
        <label className="field"><span>תאריך יציאה</span>
          <input type="date" value={f.fromDate} onChange={on("fromDate")} required /></label>
        <label className="field"><span>תאריך חזרה</span>
          <input type="date" value={f.toDate} onChange={on("toDate")}
            placeholder={f.fromDate} />
          <div className="hint">ריק = אותו יום</div></label>
        {/* ⚠ `dir="ltr"` — בלעדיו 19:30 מוצג 30:19. */}
        <label className="field"><span>שעת יציאה</span>
          <input type="time" dir="ltr" value={f.outAt} onChange={on("outAt")} required /></label>
        <label className="field"><span>שעת חזרה</span>
          <input type="time" dir="ltr" value={f.backAt} onChange={on("backAt")} required /></label>
      </div>

      <label className="field">
        <span>פירוט {needsDetail ? "" : "— לא חובה"}</span>
        <textarea rows={3} value={f.detail} onChange={on("detail")}
          placeholder={needsDetail
            ? "מה קרה, ומה צריך כדי להכריע"
            : "אפשר להשאיר ריק"} />
        {/* ⚠ יום חופש הוא זכות במכסה; דרישת נימוק עליו הופכת
            אותו לבקשת רשות. */}
        {needsDetail && <div className="hint">
          במחלה ובהיעדרות מוצדקת הפירוט הוא מה שמאפשר להכריע בלי לחזור אליך.
        </div>}
      </label>

      {err && <div className="banner err">{err}</div>}
      <div className="row">
        <button className="btn" disabled={busy}>{busy ? "שולח…" : row ? "שמירה" : "שליחה"}</button>
        <button className="btn ghost" type="button" onClick={onCancel}>ביטול</button>
      </div>
    </form>
  );
}

/* ============================================================
   צד הצוות
   ============================================================ */
function StaffView({ d, after, setMsg }) {
  const [tab, setTab] = useState("mine");

  const pending = d.requests.filter((r) => r.status === "pending");
  const mine = pending.filter((r) => r.canDecide);
  const others = pending.filter((r) => !r.canDecide);
  const done = d.requests.filter((r) => r.status !== "pending");

  const shown = tab === "mine" ? mine : tab === "open" ? others : done;

  return (
    <>
      <div className="band" style={{ margin: "14px 0 16px" }}>
        {/* ⚠ המונה הוא של מה ש**אני** יכול להכריע בו. מספר
            שכולל בקשות שאינן שלי מאמן להתעלם ממנו. */}
        <div>
          <div className={"k " + (mine.length ? "warn" : "ok")}>{mine.length}</div>
          <div className="l">ממתינות לי</div>
        </div>
        <div><div className="k">{others.length}</div><div className="l">ממתינות לאחרים</div></div>
        <div><div className="k">{done.length}</div><div className="l">הוכרעו</div></div>
      </div>

      <div className="segs" style={{ marginBottom: 14 }}>
        <button className={"seg " + (tab === "mine" ? "on" : "")} onClick={() => setTab("mine")}>
          ממתינות לי {mine.length > 0 && `(${mine.length})`}
        </button>
        <button className={"seg " + (tab === "open" ? "on" : "")} onClick={() => setTab("open")}>
          שאר הפתוחות
        </button>
        <button className={"seg " + (tab === "done" ? "on" : "")} onClick={() => setTab("done")}>
          הוכרעו
        </button>
      </div>

      {shown.length === 0 && (
        <div className="card"><div className="empty">
          {tab === "mine"
            ? <><h3>אין בקשות שממתינות לך</h3>
                <p className="muted" style={{ margin: "6px 0 0" }}>
                  {others.length > 0
                    ? `יש ${others.length} בקשות פתוחות שההכרעה בהן אצל מישהו אחר.`
                    : "אין בקשות פתוחות בכלל."}
                </p></>
            : <h3>אין כאן כלום</h3>}
        </div></div>
      )}

      {shown.map((r) => (
        <StaffCard key={r.id} r={r} isHead={d.isHead} after={after} setMsg={setMsg} />
      ))}
    </>
  );
}

function StaffCard({ r, isHead, after, setMsg }) {
  const [open, setOpen] = useState(false);
  const [redo, setRedo] = useState(false);
  const [charge, setCharge] = useState("");
  const [busy, setBusy] = useState(false);

  const decide = async (approve, again = false) => {
    setBusy(true);
    try {
      const out = await api.requestDecide(r.id, approve,
        approve && charge !== "" ? Number(charge) : undefined, again);
      /* ⚠ ההמלצה אינה הכרעה, וזה נאמר — אחרת המדריך מניח
          שהוא סגר את העניין. */
      /* ⚠ נאמר מה **באמת** השתנה, כולל ההיעדרויות שהוסרו.
         «נשמר» על פעולה שמחקה ארבע שורות נוכחות אינו אמת. */
      after(out.note
        ? out.note
        : [
            approve ? "אושר" : "נדחה",
            out.charged != null && `נגבו ${out.charged} ימים`,
            out.absences > 0 && `נרשמו ${out.absences} ימי היעדרות`,
            out.absencesRemoved > 0 && `בוטלו ${out.absencesRemoved} ימי היעדרות`,
          ].filter(Boolean).join(" · "));
    } catch (e) { setMsg(null); setBusy(false); alert(e.message); }
  };

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3>{r.personName}</h3>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            {typeLabel(r.type)} · {range(r)} · יציאה {r.outAt} · חזרה {r.backAt}
            {r.cost != null && <> · שווה {r.cost} ימים במכסה</>}
          </p>
          {r.detail && <p className="faint" style={{ margin: "6px 0 0" }}>{r.detail}</p>}

          {/* ⚠ השלב מוצג לכל הצוות — «מנהל אינו ראש מכינה»,
              והוא כן צריך לדעת איפה הבקשה עומדת. */}
          {r.status === "pending" && (
            <p className="faint" style={{ margin: "8px 0 0" }}>
              {STAGE[r.stage]}
              {r.guideName && <> · המדריך: {r.guideName}</>}
              {r.guideDecision && <> · המליץ {r.guideDecision === "approved" ? "לאשר" : "לדחות"}</>}
            </p>
          )}
          {r.status !== "pending" && (
            <p className="faint" style={{ margin: "8px 0 0" }}>
              {r.decidedName ? `הוכרע על ידי ${r.decidedName}` : "הוכרע"}
              {r.chargedDays != null && <> · נגבו {r.chargedDays} ימים</>}
            </p>
          )}
        </div>
        <div className="row" style={{ gap: 6 }}>
          {/* ⚠ הערר מסומן **על הכרטיס**: הוא הסיבה היחידה
              שבקשה שהוכרעה חוזרת לתשומת הלב. */}
          {r.appeal && <span className="pill warn">ערר</span>}
          <span className={"pill " + STATUS[r.status].tone}>{STATUS[r.status].label}</span>
        </div>
      </div>

      {/* ---------- ערר ----------
          ⚠⚠ **מוצג במלואו למכריע.** החניך כתב אותו כדי שמישהו
            יקרא אותו; ערר שנשמר ואינו מוצג הוא שיחה אל הקיר.
          ⚠ ו«ההחלטה לא השתנתה» נאמר גם כאן, כדי שלא ייקרא
            כמו בקשה חדשה שממתינה. */}
      {r.appeal && (
        <div className="banner warn" style={{ marginTop: 10 }}>
          <MI.Warn size={17} />
          <div>
            <b>הוגש ערר</b> — ההחלטה עומדת בעינה עד שתשונה במפורש.
            <div style={{ marginTop: 4 }}>{r.appeal}</div>
          </div>
        </div>
      )}

      {/* ⚠⚠ **המילים שונות למי שממליץ ולמי שמכריע.** «אישור»
          אצל המדריך הוא שקר — הוא המליץ, וראש המכינה עוד יכול
          להפוך את זה. `decisionKind` מגיע מהשרת. */}
      {r.canDecide && (
        <>
          {r.decisionKind === "recommend" && (
            <p className="hint" style={{ marginTop: 10 }}>
              ההמלצה שלך אינה סופית — ההכרעה אצל ראש המכינה, והוא רואה את שתיהן.
            </p>
          )}
          {!open ? (
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn sm" disabled={busy}
                onClick={() => (r.decisionKind === "decide" ? setOpen(true) : decide(true))}>
                {r.decisionKind === "decide" ? "אישור" : "ממליץ לאשר"}
              </button>
              <button className="btn ghost sm" disabled={busy} onClick={() => decide(false)}>
                {r.decisionKind === "decide" ? "דחייה" : "ממליץ לדחות"}
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              {/* ⚠⚠ **כמה לגבות זו בחירה של המכריע.** אפס מותר
                  («מאשר ולא גובה»), ויותר מהחישוב נחסם בשרת —
                  זו כמעט תמיד טעות הקלדה שיורדת ממכסה שאי אפשר
                  להשיב. */}
              <label className="field" style={{ maxWidth: 260 }}>
                <span>כמה ימים לגבות מהמכסה</span>
                <input type="number" min="0" max={r.cost ?? undefined} dir="ltr"
                  value={charge} placeholder={String(r.cost ?? "")}
                  onChange={(e) => setCharge(e.target.value)} />
                <div className="hint">
                  ריק = {r.cost ?? "—"} (לפי השעות). 0 = מאשר ולא גובה.
                </div>
              </label>
              <div className="row">
                <button className="btn" disabled={busy} onClick={() => decide(true)}>
                  {busy ? "רגע…" : "אישור הבקשה"}
                </button>
                <button className="btn ghost" onClick={() => setOpen(false)}>חזרה</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ---------- שינוי החלטה שכבר ניתנה ----------
          ⚠⚠ **ראש המכינה בלבד, ורק בלחיצה מפורשת.** הכלל
            שמנהל שני לא יהפוך החלטה בלי שאיש יידע נשאר
            בתוקף — 409 על הכרעה חוזרת, אלא דרך הכפתור הזה.
          ⚠ **והאישור אומר מה בדיוק ישתנה**, כולל ימי
            ההיעדרות שיימחקו. «בטוח?» על פעולה שמשנה מכסה
            אינה שאלה שאפשר לענות עליה. */}
      {isHead && r.status !== "pending" && (
        redo ? (
          <div className="panel" style={{ marginTop: 12 }}>
            <p className="tiny" style={{ marginBottom: 10 }}>
              {r.status === "approved"
                ? `הפיכה לדחייה תמחק את ימי ההיעדרות שנוצרו מהבקשה${
                    r.chargedDays ? ` ותחזיר ${r.chargedDays} ימים למכסה` : ""}.`
                : "אישור ייצור את ימי ההיעדרות ויגבה מהמכסה."}
            </p>
            <div className="btns">
              <button className="btn sm" disabled={busy}
                onClick={() => decide(r.status !== "approved", true)}>
                {busy ? "רגע…" : r.status === "approved" ? "להפוך לדחייה" : "להפוך לאישור"}
              </button>
              <button className="btn quiet sm" onClick={() => setRedo(false)}>ביטול</button>
            </div>
          </div>
        ) : (
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn quiet sm" onClick={() => setRedo(true)}>
              <MI.Edit size={15} />שינוי ההחלטה
            </button>
          </div>
        )
      )}
    </div>
  );
}
