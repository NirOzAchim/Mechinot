/* ============================================================
   הסטודיו — כאן מנהל המכינה בונה לעצמו את האפליקציה
   ------------------------------------------------------------
   ⚠⚠ **התבנית היא המוצר; האשף רק עורך אותה.** כל שדה כאן
     מגיע מלא מראש. אין מסך אחד שמתחיל ריק, כי אפליקציה ריקה
     שצריך לבנות מאפס היא מוצר שאיש לא מסיים להקים.

   ⚠⚠ **שלושה שלבי חובה וארבעה שאפשר לדלג עליהם.** מכינה
     צריכה להגיע לאפליקציה עובדת תוך רבע שעה; השאר נעשה
     מההגדרות, מתי שנוח.

   ⚠⚠ **האשף אינו חד-פעמי.** אותם מסכים הם מסך ההגדרות אחרי
     ההקמה. אשף שרץ פעם אחת ונעלם מייצר מוצר שאי אפשר לתקן
     בו טעות — ומכינה תמיד תרצה לשנות שם של תפקיד בחודש
     השלישי.
   ============================================================ */

import React, { useEffect, useState, useCallback } from "react";
import { api } from "./api.js";
import { applyTheme } from "./styles.js";
import { Paste } from "./Paste.jsx";

const STEP_ORDER = ["identity", "vocab", "roles", "modules", "year", "people", "texts"];

export function Studio({ onDone, embedded = false }) {
  const [st, setSt] = useState(null);
  const [step, setStep] = useState("identity");
  const [err, setErr] = useState(null);
  const [saved, setSaved] = useState(null);

  const load = useCallback(() => {
    api.studio()
      .then((s) => { setSt(s); setErr(null); })
      .catch((e) => setErr(e.offline ? "אין חיבור לשרת" : e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (stepKey, fields) => {
    setErr(null);
    try {
      const r = await api.studioSave(stepKey, fields);
      setSaved(stepKey);
      setTimeout(() => setSaved(null), 2200);
      load();
      return r;
    } catch (e) {
      setErr(e.message);
      throw e;
    }
  };

  if (err && !st) return (
    <>
      <div className="banner err">לא הצלחנו לטעון את האפיון — {err}</div>
      <button className="btn" onClick={load}>נסה שוב</button>
    </>
  );
  if (!st) return <><div className="skel" /><div className="skel" /><div className="skel" /></>;

  const missing = new Set(st.missing);
  const meta = Object.fromEntries(st.steps.map((s) => [s.key, s]));
  const done = (k) => !missing.has(k);

  return (
    <div className="studio">
      {!embedded && (
        <div className="card lift" style={{ marginBottom: 18 }}>
          <h1>בונים את האפליקציה של המכינה</h1>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            הכול כבר מלא מראש מתבנית «{st.profile.identity?.name ? "מכינה קדם-צבאית" : "מכינה קדם-צבאית"}».
            משנים רק את מה ששלכם. <b>שלושה שלבים חובה</b> — השאר מתי שנוח.
          </p>
          {missing.size > 0 && (
            <div className="banner info" style={{ marginBottom: 0 }}>
              עוד לא הושלמו: {[...missing].map((k) => meta[k]?.title || k).join(" · ")}
            </div>
          )}
        </div>
      )}

      {err && <div className="banner err">{err}</div>}

      {/* ---------- מסילת השלבים ---------- */}
      <div className="steps">
        {STEP_ORDER.map((k, i) => {
          const m = meta[k] || { title: k };
          const isReq = m.required;
          return (
            <button key={k}
              className={"stp " + (step === k ? "on " : "") + (isReq && !done(k) ? "need" : "")}
              onClick={() => setStep(k)}>
              <span className="n">{i + 1}</span>
              <span className="t">{m.title}</span>
              {isReq && !done(k) && <span className="req">חובה</span>}
              {isReq && done(k) && <span className="ok">✓</span>}
            </button>
          );
        })}
      </div>

      {saved === step && <div className="banner ok-b">נשמר</div>}

      <div className="card lift">
        {step === "identity" && <Identity st={st} save={save} />}
        {step === "vocab" && <Vocab st={st} save={save} />}
        {step === "roles" && <Roles st={st} save={save} />}
        {step === "modules" && <Modules st={st} save={save} />}
        {step === "year" && <Year st={st} save={save} />}
        {step === "people" && <PeopleStep st={st} reload={load} />}
        {step === "texts" && <Texts st={st} save={save} />}
      </div>

      <div className="row-btns">
        {STEP_ORDER.indexOf(step) > 0 && (
          <button className="btn ghost" onClick={() =>
            setStep(STEP_ORDER[STEP_ORDER.indexOf(step) - 1])}>הקודם</button>
        )}
        {STEP_ORDER.indexOf(step) < STEP_ORDER.length - 1 ? (
          <button className="btn" onClick={() =>
            setStep(STEP_ORDER[STEP_ORDER.indexOf(step) + 1])}>הבא</button>
        ) : (
          <button className="btn" disabled={missing.size > 0} onClick={onDone}>
            {missing.size > 0 ? "עוד חסרים שלבי חובה" : "סיימתי — לאפליקציה"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   1 · זהות
   ⚠ תצוגה מקדימה **חיה**: שינוי צבע נראה מיד על המסך עצמו,
     לפני שמירה. אחרת מנהל מכינה בוחר צבע בעיוורון.
   ============================================================ */
function Identity({ st, save }) {
  const [v, setV] = useState(st.profile.identity || {});
  const set = (k, x) => setV({ ...v, [k]: x });
  const setColor = (k, x) => {
    const next = { ...v, colors: { ...(v.colors || {}), [k]: x } };
    setV(next);
    applyTheme(next.colors);   // ⚠ מיד, לא אחרי שמירה
  };

  const COLORS = [
    ["accent", "צבע ראשי", "הכותרת, הכפתורים והלוגו"],
    ["bg", "רקע", "הצבע שמאחורי הכול"],
    ["surface", "כרטיסים", "המשטחים שהתוכן יושב עליהם"],
    ["ink", "טקסט", "צבע האותיות"],
    ["warm", "הדגשה", "לפרטים חמים"],
  ];

  return (
    <>
      <h2>הזהות של המכינה</h2>
      <p className="muted">מה שמופיע במסך הכניסה ובראש כל עמוד.</p>

      <label className="field">
        <span>שם המכינה</span>
        <input id="st-name" value={v.name || ""} placeholder="מכינת ..."
          onChange={(e) => set("name", e.target.value)} />
      </label>
      <label className="field">
        <span>שם קצר <span className="faint">— לאות שבלוגו</span></span>
        <input id="st-short" value={v.shortName || ""}
          onChange={(e) => set("shortName", e.target.value)} />
      </label>
      <label className="field">
        <span>כותרת משנה</span>
        <input id="st-tag" value={v.tagline || ""}
          onChange={(e) => set("tagline", e.target.value)} />
      </label>

      <h3 style={{ marginTop: 20 }}>צבעים</h3>
      <p className="faint" style={{ marginBottom: 12 }}>
        כל שינוי נראה מיד על המסך הזה. שמירה קובעת אותו לכולם.
      </p>
      <div className="colors">
        {COLORS.map(([k, label, why]) => (
          <label key={k} className="col-row">
            <input type="color" id={`col-${k}`} value={v.colors?.[k] || "#000000"}
              onChange={(e) => setColor(k, e.target.value)} />
            <span className="grow">
              <b>{label}</b>
              <span className="faint"> — {why}</span>
            </span>
            <code>{v.colors?.[k]}</code>
          </label>
        ))}
      </div>

      <button className="btn" style={{ marginTop: 18 }}
        disabled={!v.name?.trim()}
        onClick={() => save("identity", { identity: v })}>שמירה</button>
    </>
  );
}

/* ============================================================
   2 · אוצר מילים
   ⚠ זה המסך שהופך אפליקציה של מכינה אחת למוצר: המפתח
     (`person.student`) נשמר בשורות לנצח, והתווית («חניך» או
     «תלמיד») היא נתון תצוגה.
   ============================================================ */
const VOCAB_GROUPS = [
  { title: "אנשים", keys: ["person.student", "person.staff", "person.guide", "person.head"] },
  { title: "מסגרות", keys: ["team.branch", "team.series", "team.committee", "team.group", "team.adhoc"] },
  { title: "היעדרויות", keys: ["absence.vacation", "absence.sick", "absence.justified"] },
  { title: "סוגי ימים", keys: ["day.regular", "day.series", "day.trip", "day.home", "day.holiday", "day.closed", "day.noroutine"] },
  { title: "תקופות ויחידות", keys: ["term.first", "term.second", "term.yearly", "unit.week", "unit.day", "unit.session"] },
];

function Vocab({ st, save }) {
  const [v, setV] = useState(st.profile.vocab || {});
  const set = (key, form, val) =>
    setV({ ...v, [key]: { ...(v[key] || {}), [form]: val } });

  return (
    <>
      <h2>איך קוראים לדברים אצלכם</h2>
      <p className="muted">
        המערכת שומרת מפתח קבוע ומציגה את מה שתכתבו כאן.
        <b> שינוי שם לא נוגע באף נתון היסטורי.</b>
      </p>

      {VOCAB_GROUPS.map((g) => (
        <div key={g.title} style={{ marginTop: 18 }}>
          <h3>{g.title}</h3>
          <div className="vocab">
            <div className="vh"><span>המפתח</span><span>יחיד</span><span>רבים</span></div>
            {g.keys.map((k) => (
              <div className="vr" key={k}>
                <code>{k}</code>
                <input id={`v1-${k}`} value={v[k]?.one || ""}
                  onChange={(e) => set(k, "one", e.target.value)} />
                <input id={`v2-${k}`} value={v[k]?.many || ""}
                  onChange={(e) => set(k, "many", e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button className="btn" style={{ marginTop: 18 }}
        onClick={() => save("vocab", { vocab: v })}>שמירה</button>
    </>
  );
}

/* ============================================================
   3 · תפקידים
   ⚠ **המסכים שמסומנים כאן הם מה שהשרת אוכף**, ולא רק מה
     שמוצג. זה אותו חישוב בדיוק, ולכן אי אפשר שהמסך יציע
     משהו שהשרת יחסום.
   ============================================================ */
function Roles({ st, save }) {
  const [roles, setRoles] = useState(st.profile.roles || []);
  const exists = st.screens;

  const patch = (slug, f) =>
    setRoles(roles.map((r) => r.slug === slug ? { ...r, ...f } : r));

  const toggle = (slug, screen) => {
    const r = roles.find((x) => x.slug === slug);
    if (!r || r.screens?.includes("*")) return;
    const has = r.screens.includes(screen);
    patch(slug, { screens: has ? r.screens.filter((s) => s !== screen) : [...r.screens, screen] });
  };

  return (
    <>
      <h2>התפקידים במכינה</h2>
      <p className="muted">
        השם ניתן לשינוי; מה שנשמר בפנים נשאר. סמנו אילו מסכים כל תפקיד פותח.
      </p>

      {roles.map((r) => {
        const all = r.screens?.includes("*");
        return (
          <div className="role" key={r.slug}>
            <div className="role-head">
              <input id={`r-${r.slug}`} className="role-name" value={r.label}
                onChange={(e) => patch(r.slug, { label: e.target.value })} />
              <code>{r.slug}</code>
              {r.staffOnly && <span className="pill unmarked">צוות</span>}
              {r.viewOnly && <span className="pill half">צפייה בלבד</span>}
            </div>
            {all ? (
              <p className="faint" style={{ margin: 0 }}>פותח את כל המסכים.</p>
            ) : (
              <div className="chips">
                {exists.map((s) => (
                  <button key={s.key}
                    className={"chip " + (r.screens?.includes(s.key) ? "on" : "")}
                    onClick={() => toggle(r.slug, s.key)}>{s.title}</button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <button className="btn" style={{ marginTop: 16 }}
        onClick={() => save("roles", { roles })}>שמירה</button>
    </>
  );
}

/* ============================================================
   4 · מודולים
   ⚠⚠ **המסך אומר מה זה נותן, ולא רק שם.** «מלאי וציוד» אינו
     אומר דבר; «כמה יש מכל דבר, כמה צריך להיות, ומה חסר» הוא
     מה שמנהל מכינה מחליט לפיו.

   ⚠ **תלות מוצגת ולא נאכפת בשקט.** מודול שתלוי בכבוי מוצג
     מעומעם עם הסיבה — ולא נעלם, כי היעלמות נראית כמו באג.
   ============================================================ */
function Modules({ st, save }) {
  const [mods, setMods] = useState(st.profile.modules || {});
  const cat = st.catalog;

  const blocked = (k) => (cat[k].needs || []).filter((n) => !mods[n] && !cat[n].core);

  const toggle = (k) => {
    if (cat[k].core) return;
    setMods({ ...mods, [k]: !mods[k] });
  };

  const on = Object.keys(cat).filter((k) => cat[k].core || mods[k]);

  return (
    <>
      <h2>מה יהיה באפליקציה שלכם</h2>
      <p className="muted">
        מה שכבוי <b>לא קיים</b> — לא בתפריט, לא בחיפוש, ולא כטבלה.
        אפשר להדליק בכל רגע.
      </p>
      <div className="banner info">
        דלוקים כרגע: <b>{on.length}</b> מתוך {Object.keys(cat).length}
      </div>

      <div className="mods">
        {Object.entries(cat).map(([k, m]) => {
          const need = blocked(k);
          const isOn = m.core || mods[k];
          return (
            <div key={k} className={"mod " + (isOn ? "on " : "") + (need.length ? "blocked" : "")}>
              <label className="mod-top">
                <input type="checkbox" id={`m-${k}`}
                  checked={Boolean(isOn)} disabled={m.core || need.length > 0}
                  onChange={() => toggle(k)} />
                <span className="grow">
                  <b>{m.title}</b>
                  {m.core && <span className="pill present">תמיד</span>}
                  {m.private && <span className="pill half">פרטי לחניך</span>}
                </span>
              </label>
              <p className="why">{m.why}</p>
              {need.length > 0 && (
                <p className="faint">דורש: {need.map((n) => cat[n].title).join(" · ")}</p>
              )}
              {isOn && m.screens.length > 0 && (
                <p className="faint">מסכים: {m.screens.join(" · ")}</p>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn" style={{ marginTop: 16 }}
        onClick={() => save("modules", { modules: mods })}>שמירה</button>
    </>
  );
}

/* ============================================================
   5 · השנה
   ============================================================ */
function Year({ st, save }) {
  const [y, setY] = useState(st.profile.year || {});
  const [areas, setAreas] = useState(st.profile.inventoryAreas || []);
  const set = (k, v) => setY({ ...y, [k]: v });

  return (
    <>
      <h2>מבנה השנה</h2>
      <div className="two">
        <label className="field">
          <span>תחילת השנה</span>
          <input id="y-start" type="date" value={y.start || ""}
            onChange={(e) => set("start", e.target.value)} />
        </label>
        <label className="field">
          <span>סיום השנה</span>
          <input id="y-end" type="date" value={y.end || ""}
            onChange={(e) => set("end", e.target.value)} />
        </label>
      </div>

      <div className="two">
        <label className="field">
          <span>מכסת ימי חופש למחצית</span>
          <input id="y-quota" type="number" inputMode="numeric" min="0"
            value={y.vacationQuota ?? ""} onChange={(e) => set("vacationQuota", Number(e.target.value))} />
        </label>
        <label className="field">
          <span>מינימום ימים לפני שמוצג אחוז</span>
          <input id="y-min" type="number" inputMode="numeric" min="1"
            value={y.minMarkedDays ?? ""} onChange={(e) => set("minMarkedDays", Number(e.target.value))} />
        </label>
      </div>
      {/* ⚠ ההסבר צמוד לשדה ולא בתיעוד: זה מספר שנראה שרירותי
          עד שמבינים למה הוא קיים. */}
      <p className="faint" style={{ marginTop: -6 }}>
        בתחילת שנה «0% נוכחות» הוא מספר נכון חשבונית ושקרי במשמעותו —
        והוא הדבר הראשון שחניך רואה על עצמו. עד הסף מוצג «—».
      </p>

      {st.profile.modules?.inventory && (
        <>
          <h3 style={{ marginTop: 20 }}>תחומי המלאי</h3>
          <p className="faint">איפה הציוד יושב אצלכם.</p>
          <div className="rows">
            {areas.map((a, i) => (
              <div className="row" key={a.slug}>
                <code>{a.slug}</code>
                <input className="grow" id={`a-${a.slug}`} value={a.label}
                  onChange={(e) => setAreas(areas.map((x, j) =>
                    j === i ? { ...x, label: e.target.value } : x))} />
                <button className="btn ghost" style={{ padding: "6px 12px" }}
                  onClick={() => setAreas(areas.filter((_, j) => j !== i))}>הסרה</button>
              </div>
            ))}
          </div>
        </>
      )}

      <button className="btn" style={{ marginTop: 18 }}
        disabled={!y.start || !y.end}
        onClick={() => save("year", { year: y, inventoryAreas: areas })}>שמירה</button>
    </>
  );
}

/* ============================================================
   6 · אנשים — ההדבקה
   ============================================================ */
function PeopleStep({ st, reload }) {
  const [kind, setKind] = useState("students");
  const order = ["students", "staff", "calendar", "courses", "teams"];
  const imp = st.importers;

  return (
    <>
      <h2>הכנסת הנתונים</h2>
      <p className="muted">
        מדביקים מהגיליון, מוואטסאפ או ממסמך. <b>תמיד רואים לפני שכותבים.</b>
      </p>

      <div className="segs">
        {order.filter((k) => imp[k]).map((k) => (
          <button key={k} className={"seg " + (kind === k ? "on" : "")}
            onClick={() => setKind(k)}>
            {imp[k].title}
            {imp[k].have > 0 && <span className="cnt">{imp[k].have}</span>}
          </button>
        ))}
      </div>

      <Paste kind={kind} def={imp[kind]} onDone={reload} />
    </>
  );
}

/* ============================================================
   7 · טקסטים
   ============================================================ */
const TEXT_LABELS = {
  "home.welcome": "ברכה במסך הבית",
  "rules.main": "נהלי המכינה",
  "requests.intro": "הסבר בראש מסך בקשות היציאה",
};

function Texts({ st, save }) {
  const [t, setT] = useState(st.profile.texts || {});
  return (
    <>
      <h2>נהלים וטקסטים</h2>
      <p className="muted">
        נערכים כאן ובמסך עצמו, תמיד. <b>בלוק שלא נכתב אינו מוצג כלל</b> —
        מסך מלא בקופסאות ריקות מלמד להתעלם מהן.
      </p>
      {Object.keys(TEXT_LABELS).map((k) => (
        <label className="field" key={k}>
          <span>{TEXT_LABELS[k]} <code>{k}</code></span>
          <textarea id={`t-${k}`} rows={k === "rules.main" ? 8 : 3}
            value={t[k] || ""} onChange={(e) => setT({ ...t, [k]: e.target.value })} />
        </label>
      ))}
      <button className="btn" onClick={() => save("texts", { texts: t })}>שמירה</button>
    </>
  );
}
