/* ============================================================
   הקונסולה — כל המכינות במסך אחד
   ------------------------------------------------------------
   ⚠⚠ **זה המוצר השלישי, ולא מסך באפליקציה.** הוא רואה את כל
     הלקוחות, ולכן הוא חי מאחורי זהות משלו, עוגייה משלה
     ונתיב משלו. ראו server/root.js.

   ⚠⚠ **מכינה שנפלה מוצגת ואינה נעלמת.** `ok:false` מקבל
     כרטיס אדום עם הסיבה — היא בדיוק המכינה שצריך לטפל בה,
     ורשימה שמשמיטה אותה נראית בדיוק כמו רשימה תקינה.

   ⚠ **כל מספר כאן הוא סכום ולא רשימה.** הקונסולה יודעת כמה
     חניכים יש במכינה, לא מי הם. מי שרוצה להסתכל פנימה נכנס
     לאפליקציה — וזה נרשם.
   ============================================================ */

import React, { useEffect, useState, useCallback } from "react";
import { admin } from "./api.js";
import { CONSOLE_CSS } from "./console-styles.js";

export function Console() {
  const [st, setSt] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    setErr(null);
    try { setSt(await admin.state()); }
    catch (e) { setErr(e.offline ? "אין חיבור לשרת" : e.message); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ⚠ כותרת הלשונית אומרת «קונסולה» ולא «מכינות». היא יושבת
     לצד הלשוניות של המכינות עצמן, וכולן היו נראות אותו דבר. */
  useEffect(() => { document.title = "Mechinot · קונסולה"; }, []);

  if (busy) return <Shell><div className="cskel" /><div className="cskel" /></Shell>;

  /* ⚠ כשל טעינה הוא מסך משלו עם «נסה שוב» — ולא רשימה ריקה
     שנראית כמו «אין מכינות». */
  if (err && !st) return <Shell>
    <div className="cbanner err">לא הצלחנו לטעון — {err}</div>
    <button className="cbtn" onClick={() => { setBusy(true); load(); }}>נסה שוב</button>
  </Shell>;

  if (!st.configured) return <Gate><Setup onDone={load} /></Gate>;
  if (!st.signedIn) return <Gate><SignIn onDone={load} /></Gate>;

  return <Dash st={st} reload={load} />;
}

/* ============================================================
   מעטפות
   ============================================================ */
function Shell({ children, user, onOut }) {
  return (
    <>
      <style>{CONSOLE_CSS}</style>
      <div className="cx">
        <header className="ctop"><div className="cwrap">
          <span className="dot" />
          <span className="brand">Mechinot · קונסולה</span>
          <span className="grow" />
          {user && <span className="cfaint">{user}</span>}
          {onOut && <button onClick={onOut}>יציאה</button>}
        </div></header>
        <div className="cwrap" style={{ paddingTop: 22 }}>{children}</div>
      </div>
    </>
  );
}

const Gate = ({ children }) => (
  <>
    <style>{CONSOLE_CSS}</style>
    <div className="cx"><div className="cgate">{children}</div></div>
  </>
);

/* ============================================================
   הקמת מנהל-העל הראשון
   ⚠ **מוצג רק כשאין חשבון, והשרת מקבל אותו מ-localhost בלבד.**
     שרת שעולה לרשת בלי מנהל-על הוא שרת שהראשון שמצא אותו
     הופך לבעליו — ולכן ההגנה בשרת ולא במסך הזה.
   ============================================================ */
function Setup({ onDone }) {
  const [user, setUser] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const go = async (e) => {
    e.preventDefault();
    if (pw !== pw2) return setErr("הסיסמאות אינן זהות");
    setBusy(true); setErr(null);
    try { await admin.setup(user, pw); onDone(); }
    catch (x) { setErr(x.message); setBusy(false); }
  };

  return (
    <form className="cpanel" onSubmit={go}>
      <h1>הקמת מנהל-על</h1>
      <p className="cmuted" style={{ marginTop: 6 }}>
        החשבון היחיד שרואה את כל המכינות. אין לו «שכחתי סיסמה» —
        איפוס נעשה בשרת בלבד.
      </p>

      <label className="cfield">
        <span>שם משתמש</span>
        <input className="ltr" value={user} autoFocus
          onChange={(e) => setUser(e.target.value)}
          placeholder="achim" autoComplete="username" />
      </label>
      <label className="cfield">
        <span>סיסמה</span>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          autoComplete="new-password" />
        <div className="chint">שמונה תווים לפחות. בלי דרישות מורכבות — הן מייצרות פתקים.</div>
      </label>
      <label className="cfield">
        <span>שוב</span>
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)}
          autoComplete="new-password" />
      </label>

      {err && <div className="cbanner err">{err}</div>}
      <button className="cbtn" disabled={busy || !user || !pw}>
        {busy ? "רגע…" : "יצירה"}
      </button>
      {/* ⚠ פקודה לטינית בתוך פסקה עברית מוצגת בסדר הפוך ובלתי
          קריאה. `dir="ltr"` על בלוק משלה, ולא בתוך המשפט. */}
      <div className="chint" style={{ marginTop: 12 }}>
        אפשר גם בשרת:
        <div className="mslug" style={{ marginTop: 4 }} dir="ltr">
          npm run root -- --user &lt;שם&gt; --pass &lt;סיסמה&gt;
        </div>
      </div>
    </form>
  );
}

function SignIn({ onDone }) {
  const [user, setUser] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const go = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try { await admin.login(user, pw); onDone(); }
    catch (x) { setErr(x.message); setBusy(false); }
  };

  return (
    <form className="cpanel" onSubmit={go}>
      <h1>Mechinot</h1>
      <p className="cmuted" style={{ marginTop: 4, marginBottom: 18 }}>קונסולת הניהול</p>
      <label className="cfield">
        <span>שם משתמש</span>
        <input className="ltr" value={user} autoFocus
          onChange={(e) => setUser(e.target.value)} autoComplete="username" />
      </label>
      <label className="cfield">
        <span>סיסמה</span>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          autoComplete="current-password" />
      </label>
      {/* ⚠ הודעה אחת לכל כישלון — «אין משתמש כזה» היה מגלה
          מהו שם המשתמש של מנהל-העל. */}
      {err && <div className="cbanner err">{err}</div>}
      <button className="cbtn" disabled={busy || !user || !pw}>
        {busy ? "רגע…" : "כניסה"}
      </button>
    </form>
  );
}

/* ============================================================
   הלוח
   ============================================================ */
function Dash({ st, reload }) {
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(null);
  const [msg, setMsg] = useState(null);
  const [fresh, setFresh] = useState(null);
  const [showArch, setShowArch] = useState(false);

  const out = async () => { await admin.logout(); reload(); };
  const rows = st.mechinot.filter((m) => showArch || !m.archived);
  const archived = st.mechinot.filter((m) => m.archived).length;

  return (
    <Shell user={st.user} onOut={out}>
      <div className="crow" style={{ justifyContent: "space-between" }}>
        <h1>המכינות</h1>
        <button className="cbtn" onClick={() => setAdding(!adding)}>
          {adding ? "ביטול" : "מכינה חדשה"}
        </button>
      </div>

      {msg && <div className="cbanner ok">{msg}</div>}

      {/* ⚠⚠ **אחרי יצירה, הדבר הבא שרוצים הוא להיכנס.** הודעת
          הצלחה שמזכירה כתובת ואינה מקשרת אליה מאלצת להקליד
          אותה ביד — וזו בדיוק הנקודה שבה מישהו מקליד שגוי
          ומסיק שהיצירה נכשלה. */}
      {fresh && (
        <div className="cpanel" style={{ marginBottom: 14 }}>
          <h2>«{fresh.mechina.name}» נפתחה</h2>
          <p className="cmuted" style={{ margin: "6px 0 12px" }}>
            יש בה חשבון אחד — <b dir="ltr">{fresh.account.username}</b> — ואפיון ריק.
            מי שייכנס בו יקבל את האשף מעצמו.
          </p>
          <div className="crow">
            <a className="cbtn" href={fresh.url}>פתיחת האפליקציה</a>
            <button className="cbtn ghost" onClick={() => setFresh(null)}>סגירה</button>
          </div>
        </div>
      )}

      {adding && (
        <NewMechina presets={st.presets}
          onDone={(r) => {
            setAdding(false);
            setMsg(null);
            setFresh(r);
            reload();
          }} />
      )}

      <div className="cband">
        <div><div className="k">{st.totals.live}</div><div className="l">פעילות</div></div>
        <div><div className="k">{archived}</div><div className="l">בארכיון</div></div>
        <div>
          <div className={"k " + (st.totals.needsSetup ? "warn" : "")}>{st.totals.needsSetup}</div>
          <div className="l">באמצע אפיון</div>
        </div>
        <div>
          <div className={"k " + (st.totals.broken ? "bad" : "ok")}>{st.totals.broken}</div>
          <div className="l">לא נטענות</div>
        </div>
      </div>

      {rows.length === 0 && (
        /* ⚠ מצב ריק מנוסח, ולא רשימה ריקה שנראית כמו תקלה. */
        <div className="cpanel cempty">
          <h2>עוד אין מכינות</h2>
          <p style={{ marginTop: 6 }}>
            «מכינה חדשה» פותחת פריסה עם חשבון אחד ואפיון ריק —
            ראש המכינה נכנס והאשף נפתח מעצמו.
          </p>
          {/* ⚠⚠ **הפקודה כתובה כאן ולא רק ב-README.** הנתונים
              אינם בגיט, ולכן קלון טרי מגיע לקונסולה ריקה —
              מצב תקין לחלוטין שנראה בדיוק כמו התקנה שנכשלה.
              זה עיקרון «כשל טעינה נראה אחרת מאין נתונים»,
              מהכיוון ההפוך. */}
          <p style={{ marginTop: 18 }}>
            ולראות מכינה מלאה לפני שפותחים אחת — מכינת הדגמה
            עם 33 חניכים, נוכחות, שיעורים ותורנויות:
          </p>
          <code className="ccmd">npm run seed:niroz</code>
          <p style={{ marginTop: 10, fontSize: 13 }}>
            בטרמינל נוסף, בתיקיית הפרויקט. אחר כך לרענן — אין צורך
            להפעיל את השרת מחדש.
          </p>
        </div>
      )}

      {rows.map((m) => (
        <MechinaRow key={m.slug} m={m}
          open={open === m.slug}
          onToggle={() => setOpen(open === m.slug ? null : m.slug)}
          reload={reload} setMsg={setMsg} />
      ))}

      {archived > 0 && (
        <button className="cbtn ghost sm" style={{ marginTop: 10 }}
          onClick={() => setShowArch(!showArch)}>
          {showArch ? "הסתרת הארכיון" : `הצגת ${archived} בארכיון`}
        </button>
      )}
    </Shell>
  );
}

/* ============================================================
   שורת מכינה
   ============================================================ */
function MechinaRow({ m, open, onToggle, reload, setMsg }) {
  const cls = "mrow" + (m.archived ? " arch" : "") + (m.ok ? "" : " broken");
  const accent = m.colors?.accent || "#2B3442";

  return (
    <div className={cls}>
      <div className="mhead" onClick={onToggle}>
        <div className="mswatch" style={{ background: accent }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="mname">{m.name}</div>
          <div className="mslug">/m/{m.slug}/</div>
        </div>

        {!m.ok && <span className="tag bad">לא נטענת</span>}
        {m.archived && <span className="tag">ארכיון</span>}
        {m.ok && m.setupNeeded?.length > 0 && (
          <span className="tag warn">אפיון חסר</span>
        )}
        {m.ok && m.setupNeeded?.length === 0 && <span className="tag ok">פעילה</span>}

        {m.ok && (
          <div className="mstat">
            <span><b>{m.counts.student}</b> חניכים</span>
            <span><b>{m.counts.staff}</b> צוות</span>
            <span><b>{m.modules}</b> מודולים</span>
          </div>
        )}
      </div>

      {open && (m.ok
        ? <Panel m={m} reload={reload} setMsg={setMsg} />
        /* ⚠ הסיבה מוצגת כלשונה. «לא נטענת» לבדו שולח לחפש. */
        : <div className="mbody">
            <div className="cbanner err">{m.error}</div>
            <p className="cfaint">
              הנתונים יושבים ב־.data/m/{m.slug}/ — הקובץ קיים, הקריאה שלו נכשלה.
            </p>
          </div>
      )}
    </div>
  );
}

/* ============================================================
   הפאנל של מכינה
   ============================================================ */
function Panel({ m, reload, setMsg }) {
  const [tab, setTab] = useState("open");
  return (
    <div className="mbody">
      <div className="crow" style={{ marginBottom: 14 }}>
        {[["open", "פתיחה"], ["edit", "פרטים"], ["account", "חשבון"],
          ["log", "יומן גישה"], ["danger", "מחיקה"]].map(([k, t]) => (
          <button key={k} className={"cbtn sm " + (tab === k ? "" : "ghost")}
            onClick={() => setTab(k)}>{t}</button>
        ))}
      </div>

      {tab === "open" && <OpenTab m={m} />}
      {tab === "edit" && <EditTab m={m} reload={reload} setMsg={setMsg} />}
      {tab === "account" && <AccountTab m={m} setMsg={setMsg} />}
      {tab === "log" && <LogTab m={m} />}
      {tab === "danger" && <DangerTab m={m} reload={reload} setMsg={setMsg} />}
    </div>
  );
}

/* ---------- פתיחה ---------- */
function OpenTab({ m }) {
  const [busy, setBusy] = useState(false);

  /* ⚠⚠ **נרשם לפני שנפתח.** עוגיית מנהל-העל תקפה בכל מכינה
     ממילא; הקריאה קיימת כדי שתישאר חותמת. גישה של ספק
     לנתוני קטינים שאינה נרשמת — לא קרתה. */
  const enter = async (screen) => {
    setBusy(true);
    try {
      const r = await admin.enter(m.slug);
      window.location.href = screen ? `${r.url}?screen=${screen}` : r.url;
    } catch (e) {
      setBusy(false);
      alert(e.message);
    }
  };

  return (
    <>
      <div className="cbanner info">
        ⚠ כניסה לכאן היא כניסה ל<b>נתונים אמיתיים</b> של המכינה, כ«מנהל-על» —
        לא כאדם מהצוות. האפליקציה תציג רצועה שאומרת את זה, והכניסה נרשמת ביומן.
      </div>
      <div className="crow">
        <button className="cbtn" disabled={busy} onClick={() => enter(null)}>
          האפליקציה
        </button>
        <button className="cbtn ghost" disabled={busy} onClick={() => enter("settings")}>
          הסטודיו
        </button>
      </div>

      {m.setupNeeded?.length > 0 && (
        <p className="cfaint" style={{ marginTop: 14 }}>
          שלבי אפיון שעדיין חסרים: {m.setupNeeded.join(" · ")}
        </p>
      )}
      <p className="cfaint" style={{ marginTop: 10 }}>
        {m.appName
          ? <>שם באפליקציה: <b>{m.appName}</b></>
          : <>האפיון עוד לא נשמר, ולכן האפליקציה עדיין בלי שם.</>}
        {" · "}נפתחה {String(m.createdAt || "").slice(0, 10)}
        {" · "}{Math.round((m.bytes || 0) / 1024)}KB
      </p>
    </>
  );
}

/* ---------- פרטים ---------- */
function EditTab({ m, reload, setMsg }) {
  const [name, setName] = useState(m.name);
  const [notes, setNotes] = useState(m.notes || "");
  const [contact, setContact] = useState(m.contact || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      await admin.update(m.slug, { name, notes, contact });
      setMsg(`«${name}» נשמרה`);
      reload();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const toggleArchive = async () => {
    setBusy(true); setErr(null);
    try {
      await admin.update(m.slug, { archived: !m.archived });
      setMsg(m.archived ? `«${m.name}» הוחזרה` : `«${m.name}» הועברה לארכיון`);
      reload();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="mgrid">
      <div>
        <label className="cfield">
          <span>שם המכינה (בקונסולה)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          {/* ⚠ שני שמות ולא אחד: זה של המרשם, וזה של האפיון.
              המנהל משנה את שלו באשף ואני את שלי כאן. */}
          <div className="chint">
            {m.appName
              ? <>באפליקציה היא נקראת «{m.appName}» — זה נקבע באשף ולא כאן.</>
              : <>האפיון עדיין ריק, ולכן זה השם היחיד שקיים.</>}
          </div>
        </label>
        <label className="cfield">
          <span>איש קשר</span>
          <input value={contact} onChange={(e) => setContact(e.target.value)}
            placeholder="שם · טלפון · מייל" />
        </label>
      </div>

      <div>
        <label className="cfield">
          <span>הערות</span>
          <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="מה סוכם, מה פתוח, מתי לחזור אליהם" />
        </label>
        <div className="chint" style={{ marginBottom: 10 }}>
          ⚠ המזהה <span className="mslug">{m.slug}</span> אינו ניתן לשינוי —
          הוא הכתובת, שם התיקיה ומפתח הסשן.
        </div>
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        {err && <div className="cbanner err">{err}</div>}
        <div className="crow">
          <button className="cbtn" disabled={busy} onClick={save}>שמירה</button>
          <button className="cbtn ghost" disabled={busy} onClick={toggleArchive}>
            {m.archived ? "החזרה מהארכיון" : "העברה לארכיון"}
          </button>
        </div>
        <div className="chint" style={{ marginTop: 8 }}>
          ארכיון מוריד מהרשימה ואינו נוגע בנתונים — האפליקציה ממשיכה לעבוד.
        </div>
      </div>
    </div>
  );
}

/* ---------- חשבון נוסף ---------- */
function AccountTab({ m, setMsg }) {
  const [f, setF] = useState({ name: "", username: "", password: "", role: "head" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const go = async () => {
    setBusy(true); setErr(null);
    try {
      await admin.account({ slug: m.slug, ...f });
      setMsg(`נוצר חשבון «${f.username}» ב־${m.name}`);
      setF({ name: "", username: "", password: "", role: "head" });
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className="cbanner info">
        זו פעולת <b>תמיכה</b>: היא קיימת כדי שמכינה שאיבדה את ראש המכינה שלה
        לא תישאר נעולה. הזמנות רגילות נעשות בתוך האפליקציה, באשף.
      </div>
      <div className="mgrid">
        <label className="cfield"><span>שם מלא</span>
          <input value={f.name} onChange={on("name")} /></label>
        <label className="cfield"><span>שם משתמש</span>
          <input className="ltr" value={f.username} onChange={on("username")} /></label>
        <label className="cfield"><span>סיסמה</span>
          <input type="password" value={f.password} onChange={on("password")}
            autoComplete="new-password" /></label>
        <label className="cfield"><span>תפקיד</span>
          <select value={f.role} onChange={on("role")}>
            <option value="head">ראש מכינה</option>
            <option value="staff">צוות</option>
            <option value="guide">מדריך</option>
          </select></label>
      </div>
      {err && <div className="cbanner err">{err}</div>}
      <button className="cbtn" disabled={busy || !f.name || !f.username || !f.password}
        onClick={go}>יצירת חשבון</button>
      <div className="chint" style={{ marginTop: 8 }}>
        {/* ⚠ הסיסמה אינה נשמרת בשום מקום — scrypt בלבד. */}
        הסיסמה לא תוצג שוב אחרי היצירה: מה שנשמר הוא גיבוב.
      </div>
    </>
  );
}

/* ---------- יומן גישה ---------- */
function LogTab({ m }) {
  const rows = m.rootEntries || [];
  return (
    <>
      <h3>כניסות שלי לאפליקציה</h3>
      <p className="cmuted" style={{ margin: "6px 0 12px" }}>
        כל פעם שאני נכנס לאפליקציה של המכינה — נרשם כאן.
      </p>
      {rows.length === 0
        ? <div className="cfaint">עוד לא נכנסתי לאפליקציה הזו.</div>
        : <div className="clog">
            {rows.map((r, i) => (
              <div key={i}>{r.at?.replace("T", " ").slice(0, 19)} · {r.by}</div>
            ))}
          </div>}
      {/* ⚠⚠ נאמר במפורש מה עדיין חסר: המכינה אינה רואה את
          היומן הזה. ביום שיהיה לקוח משלם זו דרישה, לא נחמדות. */}
      <div className="chint" style={{ marginTop: 14 }}>
        ⚠ המכינה עצמה עדיין אינה רואה את היומן. לפני לקוח משלם ראשון — זו דרישה.
      </div>
    </>
  );
}

/* ---------- מחיקה ---------- */
function DangerTab({ m, reload, setMsg }) {
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const go = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await admin.remove(m.slug, txt);
      setMsg(`«${m.name}» הוסרה מהרשימה. הנתונים הועברו ל־${r.movedTo || "סל"}`);
      reload();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <>
      <div className="cbanner err">
        מכינה היא שנה של נוכחות, בקשות ותיקי חניכים. אין «בטל».
      </div>
      <p className="cmuted">
        הנתונים <b>אינם נמחקים</b> — הם עוברים ל־<span className="mslug">.data/trash/</span>.
        מי שבאמת רוצה למחוק עושה זאת בשרת ובידיים.
      </p>
      <label className="cfield" style={{ maxWidth: 320 }}>
        <span>להקלדה: <span className="mslug">{m.slug}</span></span>
        <input className="ltr" value={txt} onChange={(e) => setTxt(e.target.value)} />
      </label>
      {err && <div className="cbanner err">{err}</div>}
      <button className="cbtn danger" disabled={busy || txt !== m.slug} onClick={go}>
        מחיקת «{m.name}»
      </button>
    </>
  );
}

/* ============================================================
   מכינה חדשה
   ⚠⚠ **החשבון נוצר באותה פעולה.** מכינה בלי חשבון היא מכינה
     שאי אפשר להיכנס אליה, ושלב שני שמישהו צריך לזכור הוא
     שלב שיישכח.
   ============================================================ */
const SLUG_OK = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/;

function NewMechina({ presets, onDone }) {
  const [f, setF] = useState({
    name: "", slug: "", preset: "premil",
    headName: "", username: "", password: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const slugBad = f.slug && !SLUG_OK.test(f.slug);
  const ready = f.name && f.slug && !slugBad && f.headName && f.username && f.password.length >= 8;

  const go = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try { onDone(await admin.create(f)); }
    catch (x) { setErr(x.message); setBusy(false); }
  };

  return (
    <form className="cpanel" style={{ marginBottom: 18 }} onSubmit={go}>
      <h2>מכינה חדשה</h2>
      <p className="cmuted" style={{ margin: "6px 0 16px" }}>
        נפרסת ריקה: כל התפקידים, אוצר המילים והמודולים מהתבנית —
        ובלי אף חניך. ראש המכינה נכנס, והאשף נפתח מעצמו.
      </p>

      <div className="mgrid">
        <label className="cfield">
          <span>שם המכינה</span>
          <input value={f.name} autoFocus onChange={on("name")}
            placeholder="מכינת מיתרים לכיש" />
        </label>
        <label className="cfield">
          <span>מזהה (בכתובת)</span>
          <input className="ltr" value={f.slug} onChange={on("slug")}
            placeholder="meitarim" />
          <div className="chint">
            {slugBad
              ? "אנגלית קטנה, 3–32 תווים, מתחיל באות"
              : <>הכתובת תהיה <span dir="ltr">/m/{f.slug || "…"}/</span> — ו<b>אי אפשר לשנות אותה אחר כך</b>.</>}
          </div>
        </label>
        <label className="cfield">
          <span>תבנית</span>
          <select value={f.preset} onChange={on("preset")}>
            {(presets || ["premil"]).map((p) => (
              <option key={p} value={p}>{p === "premil" ? "מכינה קדם-צבאית" : p}</option>
            ))}
          </select>
        </label>
      </div>

      <h3 style={{ marginTop: 10 }}>ראש המכינה</h3>
      <div className="mgrid" style={{ marginTop: 8 }}>
        <label className="cfield"><span>שם מלא</span>
          <input value={f.headName} onChange={on("headName")} placeholder="אבישי כהן" /></label>
        <label className="cfield"><span>שם משתמש</span>
          <input className="ltr" value={f.username} onChange={on("username")} /></label>
        <label className="cfield"><span>סיסמה ראשונה</span>
          <input type="password" value={f.password} onChange={on("password")}
            autoComplete="new-password" />
          <div className="chint">שמונה תווים לפחות</div></label>
      </div>

      {err && <div className="cbanner err">{err}</div>}
      <button className="cbtn" disabled={busy || !ready}>
        {busy ? "פורס…" : "פתיחת המכינה"}
      </button>
    </form>
  );
}
