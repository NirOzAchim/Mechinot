/* ============================================================
   לוח המודעות והציטוט היומי
   ------------------------------------------------------------
   ⚠⚠ **מה שמותר לי לפרסם מגיע מהשרת** (`canPost`, `audiences`,
     `canPin`). טופס שמציע סוג מודעה שיידחה הוא 403 אחרי
     שהמשתמש כבר הקליד.

   ⚠⚠ **הארכיון הוא לשונית ולא «מחיקה אוטומטית».** מודעה שפג
     תוקפה יורדת מהלוח ונשארת — לוח שמוחק את עצמו אינו יכול
     לענות על «מה בעצם נאמר אז», וזו השאלה שבגללה יש לוח.

   ⚠ **הציטוט של היום מגיע מהשרת ואינו נבחר כאן.** בחירה
     בלקוח הייתה מתחלפת בכל טעינה, ואז שני חניכים מדברים על
     «הציטוט של היום» ומתכוונים לשני דברים.
   ============================================================ */

import React, { useEffect, useState, useCallback } from "react";
import { api } from "./api.js";
import * as MI from "./icons.jsx";
import {
  Sec, Empty, Failed, Loading, Confirm, Modal, useToast, tone, heDate,
} from "./ui.jsx";
import { ScreenNote } from "./ScreenNote.jsx";

export function Board() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [archive, setArchive] = useState(false);
  const [form, setForm] = useState(null);
  const [kill, setKill] = useState(null);
  const toast = useToast();

  const load = useCallback(() => {
    api.board(archive)
      .then((x) => { setD(x); setErr(null); })
      .catch((e) => setErr(e.offline ? "אין חיבור לשרת" : e.message));
  }, [archive]);
  useEffect(() => { load(); }, [load]);

  if (err && !d) return <Failed error={err} onRetry={load} />;
  if (!d) return <Loading rows={4} />;

  const remove = async () => {
    try {
      await api.noticeDelete(kill.id);
      toast("המודעה הוסרה", "ok");
      setKill(null); load();
    } catch (e) { toast(e.message, "err"); setKill(null); }
  };

  return (
    <>
      <Sec right={d.canPost.length ? (
        <button className="btn sm" onClick={() => setForm({})}>
          <MI.Plus size={16} />מודעה חדשה
        </button>
      ) : null}>לוח המודעות</Sec>

      <ScreenNote blockKey="board.intro" />

      {/* ---------- הציטוט של היום ---------- */}
      {d.quote && (
        <div className="card lift tone-3" style={{ marginBottom: 18 }}>
          <div className="row start">
            <div className="tile"><MI.Quote size={17} /></div>
            <div className="grow">
              <div style={{ fontSize: 17, lineHeight: 1.6 }}>{d.quote.text}</div>
              <div className="tiny" style={{ marginTop: 6 }}>
                {d.quote.author || "ללא ייחוס"}
                {d.quote.by && ` · הביא ${d.quote.by}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- הרצועה ---------- */}
      {d.expiredCount > 0 && (
        <div className="segs">
          <button className={"seg " + (archive ? "" : "on")}
            onClick={() => setArchive(false)}>על הלוח</button>
          <button className={"seg " + (archive ? "on" : "")}
            onClick={() => setArchive(true)}>
            ארכיון<span className="cnt">{d.expiredCount}</span>
          </button>
        </div>
      )}

      {d.notices.length === 0 ? (
        <Empty icon={MI.Board}
          title={archive ? "הארכיון ריק" : "אין מודעות על הלוח"}>
          {archive
            ? "מודעה שפג תוקפה תרד מהלוח ותישאר כאן."
            : d.canPost.length
              ? "איבדתם משהו? מצאתם? ממליצים על משהו? זה המקום."
              : "כשיפורסם משהו, הוא יופיע כאן."}
        </Empty>
      ) : (
        <div className="rows" style={{ marginTop: 14 }}>
          {d.notices.map((n) => (
            <Notice key={n.id} n={n} archive={archive}
              onEdit={() => setForm(n)} onKill={() => setKill(n)} />
          ))}
        </div>
      )}

      {form && (
        <NoticeForm n={form} d={d} onClose={() => setForm(null)}
          onSaved={(m) => { toast(m, "ok"); setForm(null); load(); }} />
      )}

      {kill && (
        <Confirm title="הסרת המודעה" danger cta="להסיר"
          body={`«${kill.title}» תוסר מהלוח ומהארכיון, ולא יהיה אפשר לשחזר אותה.`}
          onYes={remove} onClose={() => setKill(null)} />
      )}
    </>
  );
}

function Notice({ n, archive, onEdit, onKill }) {
  const Icon = MI[n.icon] || MI.Board;
  return (
    <div className={"card tight " + tone(n.kindLabel) + (archive ? " dim" : "")}>
      <div className="row start">
        <div className="tile sm"><Icon size={15} /></div>
        <div className="grow">
          <div className="nm">
            {n.pinned && <MI.Flag size={14} />}
            {n.title}
            {/* ⚠ הקהל מסומן כשאינו «כולם» — מי שכותב צריך לדעת
                למי זה הלך, ומי שקורא צריך לדעת שזה לא לכולם. */}
            {n.audience !== "all" && (
              <span className="pill out sm">
                {n.audience === "staff" ? "לצוות" : "לחניכים"}
              </span>
            )}
          </div>
          <div className="tiny">
            {[n.kindLabel, n.by, n.at ? heDate(n.at.slice(0, 10)) : null]
              .filter(Boolean).join(" · ")}
            {n.expiresAt && !archive && ` · עד ${heDate(n.expiresAt)}`}
          </div>
          {n.body && (
            <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{n.body}</p>
          )}
        </div>
        {n.canEdit && (
          <div className="btns">
            <button className="iconbtn" aria-label="עריכה" onClick={onEdit}>
              <MI.Edit size={16} />
            </button>
            <button className="iconbtn" aria-label="הסרה" onClick={onKill}>
              <MI.Trash size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NoticeForm({ n, d, onClose, onSaved }) {
  const editing = Boolean(n.id);
  const [v, setV] = useState({
    title: n.title || "",
    body: n.body || "",
    kind: n.kind || d.canPost[0]?.slug || "lost",
    audience: n.audience || "all",
    expiresAt: n.expiresAt || "",
    pinned: Boolean(n.pinned),
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      if (editing) {
        await api.noticeUpdate({ id: n.id, ...v });
        onSaved("המודעה עודכנה");
      } else {
        await api.noticeCreate(v);
        onSaved("המודעה פורסמה");
      }
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={editing ? "עריכת המודעה" : "מודעה חדשה"} onClose={onClose}>
      {err && <div className="banner err"><MI.Warn size={17} /><div>{err}</div></div>}

      {/* ⚠⚠ **הסוגים מגיעים מהשרת** ומסוננים למה שמותר לי —
          ראו ההערה בראש הקובץ. */}
      <div className="field">
        <span>סוג המודעה</span>
        <div className="segs">
          {d.canPost.map((k) => (
            <button key={k.slug} className={"seg " + (v.kind === k.slug ? "on" : "")}
              onClick={() => setV({ ...v, kind: k.slug })}>{k.label}</button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>כותרת</span>
        <input className="inp" value={v.title} autoFocus
          placeholder="נמצאה חולצה כחולה ליד המטבח"
          onChange={(e) => setV({ ...v, title: e.target.value })} />
      </label>

      <label className="field">
        <span>פירוט (לא חובה)</span>
        <textarea rows={3} value={v.body}
          onChange={(e) => setV({ ...v, body: e.target.value })} />
      </label>

      {/* ⚠ הבורר מוצג רק כשיש יותר מאפשרות אחת — בורר של
          אפשרות יחידה הוא שאלה שאין לה תשובה שנייה. */}
      {d.audiences.length > 1 && (
        <label className="field">
          <span>למי</span>
          <select className="inp" value={v.audience}
            onChange={(e) => setV({ ...v, audience: e.target.value })}>
            {d.audiences.map((a) => (
              <option value={a.slug} key={a.slug}>{a.label}</option>
            ))}
          </select>
        </label>
      )}

      <label className="field">
        <span>עד מתי להציג (לא חובה)</span>
        <input className="inp" type="date" dir="ltr" value={v.expiresAt}
          onChange={(e) => setV({ ...v, expiresAt: e.target.value })} />
        {/* ⚠ נאמר **מה קורה אחרי**, כי «תפוגה» לבדה נשמעת
            כמו מחיקה. */}
        <div className="hint">אחרי התאריך המודעה יורדת מהלוח ועוברת לארכיון.</div>
      </label>

      {d.canPin && (
        <label className="chk">
          <input type="checkbox" checked={v.pinned}
            onChange={(e) => setV({ ...v, pinned: e.target.checked })} />
          <span>נעוץ בראש הלוח</span>
        </label>
      )}

      <div className="btns">
        <button className="btn" disabled={busy || !v.title.trim()} onClick={save}>
          {busy ? "שולח…" : editing ? "שמירה" : "פרסום"}
        </button>
        <button className="btn quiet" onClick={onClose}>ביטול</button>
      </div>
    </Modal>
  );
}

/* ============================================================
   הציטוט היומי — הבנק
   ⚠ **בנק שכל חניך מוסיף לו.** בנק שרק הצוות ממלא מחזיק
     עשרה ציטוטים ומפסיק להתחדש.
   ============================================================ */
export function Quotes() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [add, setAdd] = useState(false);
  const [kill, setKill] = useState(null);
  const toast = useToast();

  const load = useCallback(() => {
    api.quotes().then((x) => { setD(x); setErr(null); })
      .catch((e) => setErr(e.offline ? "אין חיבור לשרת" : e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (err && !d) return <Failed error={err} onRetry={load} />;
  if (!d) return <Loading rows={3} />;

  const remove = async () => {
    try {
      await api.quoteDelete(kill.id);
      toast("הציטוט הוסר", "ok");
      setKill(null); load();
    } catch (e) { toast(e.message, "err"); setKill(null); }
  };

  return (
    <>
      <Sec right={
        <button className="btn sm" onClick={() => setAdd(true)}>
          <MI.Plus size={16} />ציטוט חדש
        </button>
      }>הציטוט היומי</Sec>

      <p className="muted">
        הבנק של כל המכינה. <b>אחד מהם נבחר לכל יום</b> — אותו אחד לכולם,
        ומתחלף מעצמו בחצות.
      </p>

      {d.quotes.length === 0 ? (
        <Empty icon={MI.Quote} title="הבנק ריק">
          כל אחד יכול להוסיף. הציטוט שיתווסף ראשון יהיה הציטוט של מחר.
        </Empty>
      ) : (
        <div className="rows" style={{ marginTop: 16 }}>
          {d.quotes.map((q) => (
            <div className={"card tight " + (q.id === d.todayId ? "lift tone-3" : "")}
              key={q.id}>
              <div className="row start">
                <div className="tile sm"><MI.Quote size={15} /></div>
                <div className="grow">
                  <div style={{ lineHeight: 1.6 }}>{q.text}</div>
                  <div className="tiny" style={{ marginTop: 5 }}>
                    {[q.author || "ללא ייחוס", q.by && `הביא ${q.by}`,
                      q.id === d.todayId && "הציטוט של היום"]
                      .filter(Boolean).join(" · ")}
                  </div>
                </div>
                {q.canDelete && (
                  <button className="iconbtn" aria-label="הסרה"
                    onClick={() => setKill(q)}><MI.Trash size={16} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {add && <QuoteForm onClose={() => setAdd(false)}
        onSaved={() => { toast("נוסף לבנק", "ok"); setAdd(false); load(); }} />}

      {kill && (
        <Confirm title="הסרת הציטוט" danger cta="להסיר"
          body="הציטוט יוסר מהבנק. אם הוא הציטוט של היום, ייבחר אחר במקומו."
          onYes={remove} onClose={() => setKill(null)} />
      )}
    </>
  );
}

function QuoteForm({ onClose, onSaved }) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const save = async () => {
    setBusy(true); setErr(null);
    try { await api.quoteAdd(text, author); onSaved(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="ציטוט חדש" onClose={onClose}>
      {err && <div className="banner err"><MI.Warn size={17} /><div>{err}</div></div>}
      <label className="field">
        <span>הציטוט</span>
        <textarea rows={4} value={text} autoFocus
          onChange={(e) => setText(e.target.value)} />
      </label>
      <label className="field">
        <span>מי אמר (לא חובה)</span>
        <input className="inp" value={author}
          onChange={(e) => setAuthor(e.target.value)} />
      </label>
      <div className="btns">
        <button className="btn" disabled={busy || !text.trim()} onClick={save}>
          {busy ? "שומר…" : "הוספה לבנק"}
        </button>
        <button className="btn quiet" onClick={onClose}>ביטול</button>
      </div>
    </Modal>
  );
}
