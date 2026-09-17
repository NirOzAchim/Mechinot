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
import { DayTypes } from "./DayTypes.jsx";
import * as MI from "./icons.jsx";
import { Sec, Empty, Failed, Loading, Modal, Confirm, Bar, useToast, tone } from "./ui.jsx";

const STEP_ORDER = ["identity", "vocab", "roles", "modules", "year", "days", "people", "texts"];

export function Studio({ onDone, embedded = false }) {
  const [st, setSt] = useState(null);
  const [step, setStep] = useState("identity");
  const [err, setErr] = useState(null);
  const toast = useToast();

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
      toast("נשמר", "ok");
      load();
      return r;
    } catch (e) {
      setErr(e.message);
      throw e;
    }
  };

  if (err && !st) return <Failed error={err} onRetry={load} />;
  if (!st) return <Loading rows={4} />;

  const missing = new Set(st.missing);
  const meta = Object.fromEntries(st.steps.map((s) => [s.key, s]));
  const at = STEP_ORDER.indexOf(step);
  /* ⚠ נגזר מהמטא-דאטה ואינו קבוע: שלב שיוסף כחובה
     מחר היה משנה את המכנה בלי שאיש יזכור לעדכן מספר. */
  const required = st.steps.filter((x) => x.required).length;

  return (
    <div className="stack">
      {/* ---------- הפתיח ----------
          ⚠⚠ **בדיוק הדקדוק של דף הנחיתה**: תגית קטנה,
            כותרת גדולה, ושורת פתיחה. מי שנרשם דרך האתר
            מגיע לכאן בשנייה שאחרי, ועיצוב אחר לגמרי נקרא
            כמו מוצר אחר. */}
      {/* ---------- הגיבור ----------
          ⚠⚠⚠ **שתי עמודות כמו בדף הנחיתה: מילים ותצוגה.**
            מי שנרשם דרך האתר מגיע לכאן בשנייה שאחרי,
            ומסך שנפתח על טופס נקרא כמו מוצר אחר לגמרי.
            התצוגה אינה קישוט: היא נושאת את הצבעים ואת
            השם של המכינה הזו, ומתעדכנת בזמן אמת. */}
      {!embedded && (
        <div className="hero split">
          <div>
            <div className="eyebrow">הקמה</div>
            <h1 className="display">בונים את האפליקציה של המכינה</h1>
            <p className="lead">
              הכול כבר מלא מראש מתבנית של מכינה קדם-צבאית.
              משנים רק את מה ששלכם — <b>שלושה שלבים חובה</b>,
              והשאר מתי שנוח.
            </p>

            {/* ⚠ **התקדמות כפס ולא כרשימת חסרים.** רשימת
                «עוד לא הושלמו» אומרת מה חסר ולא כמה נשאר. */}
            <div className="row" style={{ marginTop: 26, gap: 14, maxWidth: 420 }}>
              <Bar className="grow" value={required - missing.size} max={required}
                tone={missing.size ? "warn" : "ok"} />
              <span className="tiny nowrap">
                {missing.size === 0
                  ? "כל שלבי החובה הושלמו"
                  : `${required - missing.size} / ${required} שלבי חובה`}
              </span>
            </div>
          </div>

          <div className="art"><Mock st={st} /></div>
        </div>
      )}

      {err && (
        <div className="banner err"><MI.Warn size={18} /><div>{err}</div></div>
      )}

      {/* ---------- מסילת השלבים ----------
          ⚠⚠ **עיגול ממוספר עם קו מקשר, ולא צ׳יפים.** הקו
            הוא מה שהופך שמונה כפתורים לרצף שיש בו התחלה
            וסוף — בלעדיו אי אפשר לדעת אם נשאר שלב אחד
            או חמישה. */}
      <div className="rail">
        {STEP_ORDER.map((k, i) => {
          const m = meta[k] || { title: k };
          const need = m.required && missing.has(k);
          const done = !missing.has(k) && m.required;
          return (
            <button key={k} type="button"
              className={"rl-i " + (step === k ? "on " : "") + (done ? "done" : "")}
              onClick={() => setStep(k)}>
              <span className="rl-n">{done ? "✓" : i + 1}</span>
              <span className="rl-t">
                {m.title}
                {need && <em>חובה</em>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="card lift">
        {/* ⚠⚠ **כותרת לשלב, מהמטא-דאטה ולא מוקלדת בכל שלב.**
            `desc` כבר ישב ב-`WIZARD_STEPS` ולא הוצג בשום מקום —
            כלומר הוסבר שנכתב ואיש לא קרא. שדה שנאסף ואינו
            מוצג הוא טופס שממלאים לחינם. */}
        <div className="head">
          <div className="eyebrow">שלב {at + 1} מתוך {STEP_ORDER.length}</div>
          <h2>{meta[step]?.title || step}</h2>
          {meta[step]?.desc && <p className="lead">{meta[step].desc}</p>}
        </div>

        {step === "identity" && <Identity st={st} save={save} />}
        {step === "vocab" && <Vocab st={st} save={save} />}
        {step === "roles" && <RolesStep reload={load} />}
        {step === "modules" && <Modules st={st} save={save} />}
        {step === "year" && <Year st={st} save={save} />}
        {step === "days" && <DayTypes />}
        {step === "people" && <PeopleStep st={st} reload={load} />}
        {step === "texts" && <Texts st={st} save={save} />}
      </div>

      <div className="btns">
        {at < STEP_ORDER.length - 1 ? (
          <button className="btn" onClick={() => setStep(STEP_ORDER[at + 1])}>
            הבא — {meta[STEP_ORDER[at + 1]]?.title}
            <MI.Enter size={17} />
          </button>
        ) : (
          <button className="btn" disabled={missing.size > 0} onClick={onDone}>
            {missing.size > 0 ? "עוד חסרים שלבי חובה" : "סיימתי — לאפליקציה"}
          </button>
        )}
        {at > 0 && (
          <button className="btn quiet" onClick={() => setStep(STEP_ORDER[at - 1])}>
            <MI.Leave size={17} />הקודם
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
/* ============================================================
   התצוגה החיה — האפליקציה מצוירת ב-CSS
   ------------------------------------------------------------
   ⚠⚠⚠ **זה מה שהופך את מסך הצבעים ממשהו מנהלי
     למשהו שרוצים לגעת בו.** בורר שמראה ריבוע צבע
     אומר «זה הגוון»; בורר שמראה את **האפליקציה עצמה**
     מתחלפת אומר «ככה זה ייראה לחניכים שלך» — וזו
     השאלה שראש מכינה באמת שואל.

   ⚠⚠ **ואין כאן שום קוד שמסנכרן.** כל צבע בתצוגה הוא
     משתנה CSS מהאפיון, ו-`applyTheme` מחליפה אותו על השורש.
     מי שינסה «לעדכן את התצוגה» יבנה מסלול שני שיתפצל
     מהראשון בתיקון הראשון.

   ⚠ **מצויר ולא צילום מסך.** צילום מתיישן ברגע שמסך
     משתנה, ואז ההגדרות מראות מוצר שאינו קיים.

   ⚠ **והתוכן בו אינו נתון אמיתי** — הוא המבנה בלבד.
     שליפה אמיתית לתצוגה מקדימה היתה קריאה נוספת לכל
     טעינת אשף, בשביל תמונה שכל תכליתה להראות צבע.
   ============================================================ */
function Mock({ st }) {
  const id = st.profile.identity || {};
  const name = id.shortName || id.name || "המכינה";

  return (
    <div className="mock" aria-hidden="true">
      <div className="mk-bar">
        <i /><i /><i />
        <b>{"/m/" + (st.slug || "mechina") + "/"}</b>
      </div>
      <div className="mk-body">
        <div className="mk-side">
          <u className="on"><i />מסך הבית</u>
          <u><i />נוכחות</u>
          <u><i />בקשות</u>
          <u><i />תקלות</u>
          <u><i />לוח מודעות</u>
        </div>
        <div className="mk-main">
          <div className="mk-h">{"בוקר טוב, " + name}</div>
          <div className="mk-band">
            <div><b className="a">94%</b><span>נוכחות</span></div>
            <div><b>28</b><span>חניכים</span></div>
            <div><b className="w">3</b><span>בקשות</span></div>
          </div>
          <div className="mk-li"><i />הנוכחות טרם סומנה<span>היום</span></div>
          <div className="mk-li"><i />בקשת יציאה חדשה<span>חדש</span></div>
          <div style={{ marginTop: 10 }}><span className="mk-btn">לסימון הנוכחות</span></div>
        </div>
      </div>
    </div>
  );
}

const COLORS = [
  ["accent", "צבע ראשי", "הכותרות, הכפתורים והלוגו"],
  ["bg", "רקע", "הצבע שמאחורי הכול"],
  ["surface", "כרטיסים", "המשטחים שהתוכן יושב עליהם"],
  ["ink", "טקסט", "צבע האותיות"],
  ["warm", "הדגשה", "לפרטים חמים"],
];

function Identity({ st, save }) {
  const [v, setV] = useState(st.profile.identity || {});
  const set = (k, x) => setV({ ...v, [k]: x });
  const setColor = (k, x) => {
    const next = { ...v, colors: { ...(v.colors || {}), [k]: x } };
    setV(next);
    applyTheme(next.colors);   /* ⚠ מיד, לא אחרי שמירה */
  };

  /* ⚠ התצוגה מקבלת את מה שמוקלד עכשיו ולא את מה
     שנשמר — אחרת השם בתצוגה מפגר בשמירה אחת אחרי
     מה שעל המסך, וזה נראה כמו תקלה. */
  const live = { ...st, profile: { ...st.profile, identity: v } };

  return (
    <>
      <div className="pane">
        <div className="head">
          <h3>השם של המכינה</h3>
          <p className="lead">מה שמופיע במסך הכניסה ובראש כל עמוד.</p>
        </div>

        <div className="two">
          <label className="field">
            <span>שם המכינה<span className="req">*</span></span>
            <input value={v.name || ""} placeholder="מכינת ..."
              onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="field">
            <span>שם קצר <span className="faint">— לאות שבלוגו</span></span>
            <input value={v.shortName || ""}
              onChange={(e) => set("shortName", e.target.value)} />
          </label>
        </div>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>כותרת משנה</span>
          <input value={v.tagline || ""}
            onChange={(e) => set("tagline", e.target.value)} />
        </label>
      </div>

      {/* ---------- הצבעים ----------
          ⚠⚠⚠ **התצוגה לצד הבוררים ולא אחריהם.** מי שבוחר
            צבע רוצה לראות מה הוא עשה באותה שנייה, ותצוגה
            שיושבת שתי גלילות מתחת אינה קיימת. */}
      <div className="pane sunk">
        <div className="head">
          <div className="eyebrow">הצבעים שלכם</div>
          <h3>כך האפליקציה תיראה לחניכים</h3>
          <p className="lead">
            כל שינוי נראה <b>מיד</b>, גם על המסך הזה וגם בתצוגה.
            שמירה קובעת אותו לכולם.
          </p>
        </div>

        <div className="hero split" style={{ padding: 0 }}>
          <div className="stack" style={{ gap: "var(--s2)" }}>
            {COLORS.map(([k, label, why]) => (
              <label key={k} className="sw-c">
                <input type="color" value={v.colors?.[k] || "#000000"}
                  aria-label={label}
                  onChange={(e) => setColor(k, e.target.value)} />
                <span className="grow">
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{label}</div>
                  <div className="tiny">{why}</div>
                </span>
                <span className="hx">{v.colors?.[k]}</span>
              </label>
            ))}
          </div>
          <div className="art"><Mock st={live} /></div>
        </div>
      </div>

      <div className="btns">
        <button className="btn lg" disabled={!v.name?.trim()}
          onClick={() => save("identity", { identity: v })}>
          <MI.Check size={18} />שמירת הזהות
        </button>
      </div>
    </>
  );
}

/* ============================================================
   2 · אוצר מילים
   ⚠ זה המסך שהופך אפליקציה של מכינה אחת למוצר: המפתח
     (person.student) נשמר בשורות לנצח, והתווית («חניך» או
     «תלמיד») היא נתון תצוגה.
   ============================================================ */
const VOCAB_GROUPS = [
  { title: "אנשים", keys: ["person.student", "person.staff", "person.guide", "person.head"] },
  { title: "מסגרות", keys: ["team.branch", "team.series", "team.committee", "team.group", "team.adhoc"] },
  { title: "היעדרויות", keys: ["absence.vacation", "absence.sick", "absence.justified"] },
  /* ⚠⚠ **סוגי הימים ירדו מאוצר המילים.** התווית ישבה כאן
     והדגלים (האם יש מכינה, האם נספר) ישבו בקוד — שתי רשימות
     מקבילות על אותו דבר. עכשיו יש להם שלב משלהם, וסוג יום
     הוא שורה אחת שנושאת את שמו ואת התנהגותו. */
  { title: "תקופות ויחידות", keys: ["term.first", "term.second", "term.yearly", "unit.week", "unit.day", "unit.session"] },
];

function Vocab({ st, save }) {
  const [v, setV] = useState(st.profile.vocab || {});
  const set = (key, form, val) =>
    setV({ ...v, [key]: { ...(v[key] || {}), [form]: val } });

  return (
    <>
      <Sec>איך קוראים לדברים אצלכם</Sec>
      <p className="muted">
        המערכת שומרת מפתח קבוע ומציגה את מה שתכתבו כאן.
        <b> שינוי שם אינו נוגע באף נתון היסטורי.</b>
      </p>

      {VOCAB_GROUPS.map((g) => (
        <div key={g.title}>
          <Sec>{g.title}</Sec>
          <div className="rows">
            {g.keys.map((k) => (
              <div className="item" key={k}>
                <span className="mono grow trunc">{k}</span>
                <input className="inp" style={{ height: 38, maxWidth: 150 }}
                  aria-label={k + " יחיד"} placeholder="יחיד"
                  value={v[k]?.one || ""} onChange={(e) => set(k, "one", e.target.value)} />
                <input className="inp" style={{ height: 38, maxWidth: 150 }}
                  aria-label={k + " רבים"} placeholder="רבים"
                  value={v[k]?.many || ""} onChange={(e) => set(k, "many", e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="btns" style={{ marginTop: 22 }}>
        <button className="btn" onClick={() => save("vocab", { vocab: v })}>שמירה</button>
      </div>
    </>
  );
}

/* ============================================================
   3 · תפקידים — נוצרים, נערכים ונמחקים מהמסך
   ------------------------------------------------------------
   ⚠⚠⚠ **זה אינו טופס על רשימה בקוד.** ראש המכינה יוצר תפקיד
     שלא קיים בשום קטלוג, קובע לו שם ואילו מסכים הוא פותח,
     ומוחק אותו — בלי דיפלוי. הקטלוג מתאר מה **קיים במערכת**;
     מי נושא מה ומה כל אחד פותח הוא של המכינה.

   ⚠⚠ **המסכים שמסומנים כאן הם מה שהשרת אוכף**, ולא רק מה
     שמוצג — אותו חישוב בדיוק. ולכן אי אפשר שהמסך יציע משהו
     שהשרת יחסום.
   ============================================================ */
function RolesStep({ reload }) {
  const [st, setSt] = useState(null);
  const [err, setErr] = useState(null);
  const [edit, setEdit] = useState(null);      /* התפקיד בעריכה */
  const [kill, setKill] = useState(null);      /* התפקיד שעומד להימחק */
  const toast = useToast();

  const load = useCallback(() => {
    api.roles().then((r) => { setSt(r); setErr(null); })
      .catch((e) => setErr(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (err && !st) return <Failed error={err} onRetry={load} />;
  if (!st) return <Loading rows={3} />;

  const after = () => { load(); reload?.(); };

  const remove = async (slug, force) => {
    const r = await api.roleDelete(slug, force);
    toast(r.cleared ? `נמחק — והוסר מ-${r.cleared} אנשים` : "התפקיד נמחק", "ok");
    after();
  };

  return (
    <>
      <Sec right={st.canEdit ? (
        <button className="btn sm" onClick={() => setEdit({ isNew: true, screens: [] })}>
          <MI.Plus size={16} />תפקיד חדש
        </button>
      ) : null}>התפקידים במכינה</Sec>

      <p className="muted">
        כל תפקיד הוא נתון: השם, מה הוא פותח, ולמי הוא שמור.
        {st.canEdit
          ? " אפשר ליצור תפקיד שלא קיים בשום מקום אחר."
          : " העריכה שמורה לראש המכינה."}
      </p>

      {st.roles.length === 0 ? (
        <Empty icon={MI.Shield} title="אין עדיין תפקידים">
          בלי תפקיד אחד לפחות איש אינו רואה דבר.
        </Empty>
      ) : (
        <div className="rows" style={{ marginTop: 16 }}>
          {st.roles.map((r) => (
            <RoleRow key={r.slug} r={r} canEdit={st.canEdit}
              onEdit={() => setEdit({ ...r })}
              onCopy={() => setEdit({
                ...r, isNew: true, base: false,
                slug: "", label: r.label + " — עותק",
              })}
              onKill={() => setKill(r)} />
          ))}
        </div>
      )}

      {/* ⚠ הצעות מהקטלוג — מכינה שרוצה «אחראי מטבח» לא צריכה
          לסמן עשרה מסכים ביד. מי שאינו רוצה, מתחיל מריק. */}
      {st.canEdit && st.suggest.length > 0 && (
        <>
          <Sec>להוסיף מהמוכנים</Sec>
          <p className="faint">
            נוצרים כתפקיד רגיל לכל דבר — אפשר לשנות בהם הכול מיד אחרי.
          </p>
          <div className="rows" style={{ marginTop: 10 }}>
            {st.suggest.map((s) => (
              <button className="item link" key={s.slug}
                onClick={() => setEdit({ ...s, isNew: true, all: s.screens.includes("*") })}>
                <div className={"tile sm " + tone(s.label)}><MI.Plus size={15} /></div>
                <span className="grow">
                  <span className="nm">{s.label}</span>
                  <div className="tiny">{s.why}</div>
                </span>
                <MI.Enter size={16} />
              </button>
            ))}
          </div>
        </>
      )}

      {edit && (
        <RoleEditor role={edit} catalog={st.catalog}
          taken={st.roles.map((x) => x.slug)}
          onClose={() => setEdit(null)}
          onSaved={() => { setEdit(null); after(); }} />
      )}

      {kill && (
        <Confirm
          title={`מחיקת «${kill.label}»`}
          danger
          cta={kill.people > 0 ? `מחיקה והסרה מ-${kill.people} אנשים` : "מחיקה"}
          body={kill.people > 0
            ? `${kill.people} אנשים נושאים את התפקיד הזה. מחיקתו תסיר אותו מכולם, והמסכים שהוא פתח ייסגרו להם.`
            : "אף אחד אינו נושא את התפקיד הזה כרגע."}
          onYes={() => remove(kill.slug, kill.people > 0)}
          onClose={() => setKill(null)} />
      )}
    </>
  );
}

/* ⚠ האייקון נגזר מהמסך ה**מבחין** ולא מהראשון ברשימה: כמעט
   כל תפקיד פותח «מסך הבית», ולכן שתים־עשרה שורות קיבלו את
   אותו אייקון בית וכל התועלת שלו אבדה. */
const ROLE_ICON = (r) =>
  MI.screenIcon(r.all ? "settings"
    : (r.screens.find((s) => !["home", "me"].includes(s)) || r.screens[0] || "home"));

function RoleRow({ r, canEdit, onEdit, onCopy, onKill }) {
  const Icon = ROLE_ICON(r);
  return (
    <div className={"item " + tone(r.label)}>
      <div className="tile sm"><Icon size={15} /></div>
      <span className="grow">
        <span className="nm">{r.label}</span>
        <div className="tiny">
          {/* ⚠⚠ **המזהה בשורה משלו ולא צמוד לשם.** בשורה אחת
              הוא נדבק לאות האחרונה של השם העברי — bidi אינו
              מוסיף רווח בין קטע RTL לקטע LTR, ומרווח ב-CSS
              אינו נראה שם. «כל חניך במכינהmember» נקרא כמו
              באג, וזה מה שנראה בצילום המסך. */}
          <span className="mono">{r.slug}</span>
          {" · "}
          {r.all ? "פותח את כל המסכים"
            : r.screens.length ? `${r.screens.length} מסכים` : "אינו פותח שום מסך"}
          {/* ⚠ מה שנחתך בגלל מודול כבוי **מדווח ולא נעלם** —
              אחרת התפקיד נשאר ברשימה בלי אף מסך ואיש לא יודע למה. */}
          {r.hidden.length > 0 && ` · ${r.hidden.length} שייכים למודול כבוי`}
          {r.desc && <div className="trunc">{r.desc}</div>}
        </div>
      </span>

      <span className="row hide-sm" style={{ gap: 6 }}>
        {r.base && <span className="pill info"><MI.Lock size={12} />בסיס</span>}
        {r.admin && <span className="pill tone">ניהול</span>}
        {r.viewOnly && <span className="pill warn">צפייה</span>}
        {r.staffOnly && <span className="pill out">צוות</span>}
        {r.people > 0 && <span className="pill num">{r.people}</span>}
      </span>

      {canEdit && (
        <span className="row" style={{ gap: 2 }}>
          <button className="iconbtn" onClick={onEdit} aria-label="עריכה"><MI.Edit size={17} /></button>
          <button className="iconbtn" onClick={onCopy} aria-label="שכפול"><MI.Copy size={17} /></button>
          {/* ⚠⚠ תפקיד הבסיס אינו נמחק — הוא מה שכל אדם במכינה
              רואה, ובלעדיו חניך בלי תפקיד מקבל אפס מסכים. */}
          {!r.base && (
            <button className="iconbtn" onClick={onKill} aria-label="מחיקה"><MI.Trash size={17} /></button>
          )}
        </span>
      )}
    </div>
  );
}

/* ============================================================
   עורך התפקיד
   ⚠ **המזהה נקבע פעם אחת ואינו ניתן לשינוי.** שורות השיוך
     מצביעות עליו, ושינוי שלו היה מנתק את כל מי שנושא את
     התפקיד — בלי שגיאה, כי «אין תפקיד כזה» נראה בדיוק כמו
     «אין לו תפקיד».
   ============================================================ */
function RoleEditor({ role, catalog, taken, onClose, onSaved }) {
  const [v, setV] = useState({
    slug: role.slug || "",
    label: role.label || "",
    desc: role.desc || "",
    staffOnly: Boolean(role.staffOnly),
    viewOnly: Boolean(role.viewOnly),
    admin: Boolean(role.admin),
    all: Boolean(role.all),
    screens: (role.screens || []).filter((s) => s !== "*"),
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const isNew = Boolean(role.isNew);
  const set = (k, x) => setV((p) => ({ ...p, [k]: x }));

  /* ⚠ המזהה נגזר מהשם **רק ביצירה וכל עוד לא נגעו בו**. גזירה
     תמידית הייתה משנה מזהה קיים בשינוי שם, וזה בדיוק מה שאסור. */
  const [touched, setTouched] = useState(Boolean(role.slug));
  const onLabel = (x) => {
    set("label", x);
    if (!touched && isNew) set("slug", slugify(x));
  };

  const has = (k) => v.screens.includes(k);
  const flip = (k) =>
    set("screens", has(k) ? v.screens.filter((s) => s !== k) : [...v.screens, k]);
  const flipModule = (mod) => {
    const keys = mod.screens.map((s) => s.key);
    const allOn = keys.every(has);
    set("screens", allOn
      ? v.screens.filter((s) => !keys.includes(s))
      : [...new Set([...v.screens, ...keys])]);
  };

  const dupSlug = isNew && taken.includes(v.slug);

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      await api.roleSave({
        slug: v.slug, label: v.label, desc: v.desc,
        staffOnly: v.staffOnly, viewOnly: v.viewOnly, admin: v.admin,
        all: v.all, screens: v.screens,
      });
      onSaved();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal wide title={isNew ? "תפקיד חדש" : `עריכת «${role.label}»`} onClose={onClose}>
      {err && <div className="banner err"><MI.Warn size={18} /><div>{err}</div></div>}

      <div className="two">
        <label className="field">
          <span>שם התפקיד<span className="req">*</span></span>
          <input value={v.label} autoFocus
            placeholder="אחראי מטבח" onChange={(e) => onLabel(e.target.value)} />
        </label>
        <label className={"field " + (dupSlug ? "bad" : "")}>
          <span>מזהה <span className="faint">— באנגלית, ואינו משתנה</span></span>
          <input className="ltr" value={v.slug} disabled={!isNew}
            onChange={(e) => { setTouched(true); set("slug", slugify(e.target.value)); }} />
          {dupSlug && <div className="err-t">כבר יש תפקיד עם המזהה הזה</div>}
          {!isNew && <div className="hint">שינוי מזהה היה מנתק את כל מי שנושא את התפקיד.</div>}
        </label>
      </div>

      <label className="field">
        <span>מה האדם הזה עושה <span className="faint">— לרשימת התפקידים</span></span>
        <textarea rows={2} value={v.desc} style={{ minHeight: 62 }}
          placeholder="מנהל את המלאי, את הקניות ואת התפריט."
          onChange={(e) => set("desc", e.target.value)} />
      </label>

      {/* ---------- מאפיינים ---------- */}
      <div className="panel stack" style={{ gap: 2 }}>
        <Flag on={v.staffOnly} set={(x) => set("staffOnly", x)}
          title="שמור לאנשי צוות"
          why="חניך אינו יכול לקבל אותו כלל — נחסם גם בשרת." />
        <Flag on={v.viewOnly} set={(x) => set("viewOnly", x)}
          title="צפייה בלבד"
          why="רואה הכול ואינו משנה דבר. כל בקשה שאינה קריאה נדחית." />
        <Flag on={v.admin} set={(x) => set("admin", x)}
          title="תפקיד ניהולי"
          why="נספר כתפקיד שמחזיק את המכינה — האחרון שכזה אינו נמחק." />
        <Flag on={v.all} set={(x) => set("all", x)}
          title="פותח את כל המסכים"
          why="גם מסכים שייווספו בעתיד. לראש המכינה בלבד, בדרך כלל." />
      </div>

      {/* ---------- המסכים ---------- */}
      {!v.all && (
        <>
          <Sec right={
            <span className="pill">{v.screens.length}</span>
          }>מה התפקיד פותח</Sec>
          <p className="faint">
            מקובץ לפי מודול, כדי שהבחירה תיקרא כמו התפריט.
            מסך של מודול כבוי אינו מופיע כאן כלל.
          </p>
          <div className="scroll-y" style={{ maxHeight: "38vh", marginTop: 10 }}>
            {catalog.map((m) => {
              const Icon = MI.moduleIcon(m.module);
              const keys = m.screens.map((s) => s.key);
              const allOn = keys.length > 0 && keys.every(has);
              return (
                <div key={m.module} style={{ marginBottom: 14 }}>
                  <div className="row" style={{ marginBottom: 4 }}>
                    <Icon size={15} />
                    <h4 className="grow">{m.title}</h4>
                    <button className="btn quiet sm" onClick={() => flipModule(m)}>
                      {allOn ? "ניקוי" : "הכול"}
                    </button>
                  </div>
                  <div className="auto" style={{ gap: 2 }}>
                    {m.screens.map((s) => (
                      <label key={s.key} className={"chk " + (has(s.key) ? "on" : "")}>
                        <input type="checkbox" checked={has(s.key)} onChange={() => flip(s.key)} />
                        <span className="grow trunc">{s.title}</span>
                        {s.staff && <span className="tiny">צוות</span>}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="btns" style={{ marginTop: 20 }}>
        <button className="btn" disabled={busy || !v.label.trim() || !v.slug || dupSlug}
          onClick={submit}>{busy ? "שומר…" : isNew ? "יצירת התפקיד" : "שמירה"}</button>
        <button className="btn quiet" onClick={onClose}>ביטול</button>
      </div>
    </Modal>
  );
}

/** ⚠ מתג עם **הסבר צמוד**. «צפייה בלבד» לבדו אינו אומר מה
    קורה בפועל, ומנהל שמדליק אותו בטעות נועל אדם. */
const Flag = ({ on, set, title, why }) => (
  <label className="row start" style={{ padding: "9px 4px", cursor: "pointer" }}>
    <span className="sw">
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
      <i />
    </span>
    <span className="grow">
      <div style={{ fontWeight: 600, fontSize: 14.5 }}>{title}</div>
      <div className="tiny">{why}</div>
    </span>
  </label>
);

/* ⚠ עברית אינה הופכת ל-slug תקין, ולכן שם עברי מחזיר ריק
   ומנהל המכינה מקליד מזהה בעצמו — במקום לקבל «---» שנראה
   כאילו נקלט. */
const slugify = (s) =>
  String(s || "").toLowerCase().replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "").slice(0, 31);

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
  /* ⚠⚠ **מודול שטרם נבנה אינו נדלק ואינו מוסתר.** מנהל
     שרואה «מלאי וציוד — בבנייה» יודע מה יהיה; מנהל שאינו
     רואה אותו מסיק שהמוצר אינו עושה זאת. */
  /* ⚠⚠⚠ **לכבות מותר תמיד; להדליק רק מה שנבנה.**
     הגרסה הראשונה חסמה את שני הכיוונים, והתוצאה נתפסה
     בצילום: במכינה שהדלתא שלה נכתבה לפני שהיה `built`,
     מודול שטרם נבנה יושב **דלוק ובלתי ניתן לכיבוי** —
     כלומר לשוניות שנפתחות לכלום ואין דרך להסיר אותן.
     מלכודת מושלמת, והפתרון הוא שכיבוי לעולם אינו נחסם. */
  const toggle = (k) => {
    if (cat[k].core) return;
    if (!cat[k].built && !mods[k]) return;   /* להדליק — לא. לכבות — כן. */
    setMods({ ...mods, [k]: !mods[k] });
  };

  const keys = Object.keys(cat);
  const buildable = keys.filter((k) => cat[k].built);
  const soon = keys.filter((k) => !cat[k].built);
  /* ⚠ **נספר מתוך מה שנבנה ולא מתוך הכול.** ספירה שכללה
     מודולים שדלוקים בדלתא ישנה וטרם נבנו הדפיסה «8 מתוך 6»,
     ומספר שגדול מהמכנה שלו הוא הדבר הראשון שעוצר את העין. */
  const on = buildable.filter((k) => cat[k].core || mods[k]);
  /* ⚠ מודול שטרם נבנה ודלוק בדלתא — מצב שצריך להיאמר. */
  const staleOn = soon.filter((k) => mods[k]);

  const dirty = JSON.stringify(mods) !== JSON.stringify(st.profile.modules || {});

  const Card = ({ k }) => {
    const m = cat[k];
    const need = blocked(k);
    const isOn = Boolean(m.core || mods[k]);
    const Icon = MI.moduleIcon(k);
    return (
      <div className={"card " + (isOn ? "" : "dim ") + tone(m.title)}>
        <div className="row start" style={{ marginBottom: 12 }}>
          <div className="ic"><Icon size={21} /></div>
          <span className="grow" />
          {/* ⚠ המתג מוצג גם למודול שטרם נבנה **כשהוא דלוק**,
              כדי שיהיה אפשר לכבות אותו. ראו ההערה על `toggle`. */}
          {m.built || isOn ? (
            <span className="sw">
              <input type="checkbox" aria-label={m.title}
                checked={isOn} disabled={m.core || (m.built && need.length > 0)}
                onChange={() => toggle(k)} />
              <i />
            </span>
          ) : (
            <span className="pill out">בבנייה</span>
          )}
        </div>

        <h3>{m.title}</h3>
        <p>{m.why}</p>

        <div className="row wrap" style={{ gap: 5, marginTop: "auto", paddingTop: 12 }}>
          {m.core && <span className="pill">תמיד דלוק</span>}
          {m.private && <span className="pill info">פרטי לחניך</span>}
          {isOn && m.screens.length > 0 && (
            <span className="pill tone">{m.screens.length} מסכים</span>
          )}
        </div>

        {need.length > 0 && (
          <p className="tiny" style={{ marginTop: 8, color: "var(--warn)" }}>
            דורש: {need.map((n) => cat[n].title).join(" · ")}
          </p>
        )}
        {/* ⚠ מה שהמודול פותח, בשמות — מספר לבדו אינו
            עוזר להחליט אם להדליק. */}
        {isOn && m.screens.length > 0 && (
          <p className="tiny" style={{ marginTop: 6 }}>{m.screens.join(" · ")}</p>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="head">
        <div className="eyebrow">{on.length} מתוך {buildable.length} דלוקים</div>
        <h3>מה יהיה באפליקציה שלכם</h3>
        <p className="lead">
          מה שכבוי <b>אינו קיים</b> — לא בתפריט, לא בחיפוש,
          ולא כטבלה. אפשר להדליק ולכבות בכל רגע.
        </p>
      </div>

      <div className="feat">
        {buildable.map((k) => <Card k={k} key={k} />)}
      </div>

      {/* ---------- מה שעוד נבנה ----------
          ⚠⚠ **מוצג ואינו מוסתר, ובנפרד ממה שאפשר
            להדליק.** מעורבב באותה רשת, מנהל מנסה להדליק
            מודול ולא מבין למה המתג אינו עובד. */}
      {soon.length > 0 && (
        <div className="pane sunk">
          <div className="head">
            <div className="eyebrow">בדרך</div>
            <h3>{soon.length} מודולים שעוד נבנים</h3>
            <p className="lead">
              הם ייפתחו להדלקה כשיהיו מוכנים. הדלקה עכשיו היתה
              נותנת לשוניות שאין מאחוריהן כלום.
            </p>
            {/* ⚠⚠ **מודול שנשאר דלוק מגרסה קודמת נאמר במפורש.**
                הוא נותן לשוניות בתפריט שנפתחות ל«בבנייה», וזה
                בדיוק מה שהדגל הזה נועד למנוע. */}
            {staleOn.length > 0 && (
              <div className="banner warn" style={{ marginTop: 14, marginBottom: 0 }}>
                <MI.Warn size={18} />
                <div>
                  <b>{staleOn.length} מהם דלוקים אצלכם</b> מהגדרה קודמת,
                  ונותנים לשוניות שעוד אין מאחוריהן מסך. אפשר לכבות אותם
                  כאן ולהדליק שוב כשיהיו מוכנים.
                </div>
              </div>
            )}
          </div>
          <div className="feat">
            {soon.map((k) => <Card k={k} key={k} />)}
          </div>
        </div>
      )}

      <div className="btns">
        <button className="btn lg" disabled={!dirty}
          onClick={() => save("modules", { modules: mods })}>
          <MI.Check size={18} />שמירה
        </button>
        {dirty && (
          <button className="btn quiet"
            onClick={() => setMods(st.profile.modules || {})}>ביטול השינויים</button>
        )}
      </div>
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
      <Sec>מבנה השנה</Sec>
      <div className="two" style={{ marginTop: 16 }}>
        <label className="field">
          <span>תחילת השנה<span className="req">*</span></span>
          <input type="date" value={y.start || ""}
            onChange={(e) => set("start", e.target.value)} />
        </label>
        <label className="field">
          <span>סיום השנה<span className="req">*</span></span>
          <input type="date" value={y.end || ""}
            onChange={(e) => set("end", e.target.value)} />
        </label>
      </div>

      <div className="two">
        <label className="field">
          <span>מכסת ימי חופש למחצית</span>
          <input type="number" inputMode="numeric" min="0" value={y.vacationQuota ?? ""}
            onChange={(e) => set("vacationQuota", Number(e.target.value))} />
        </label>
        <label className="field" style={{ marginBottom: 4 }}>
          <span>מינימום ימים לפני שמוצג אחוז</span>
          <input type="number" inputMode="numeric" min="1" value={y.minMarkedDays ?? ""}
            onChange={(e) => set("minMarkedDays", Number(e.target.value))} />
          {/* ⚠ ההסבר צמוד לשדה ולא בתיעוד: זה מספר שנראה
              שרירותי עד שמבינים למה הוא קיים. */}
          <div className="hint">
            בתחילת שנה «0% נוכחות» הוא מספר נכון חשבונית ושקרי במשמעותו —
            והוא הדבר הראשון שחניך רואה על עצמו. עד הסף מוצג «—».
          </div>
        </label>
      </div>

      {st.profile.modules?.inventory && (
        <>
          <Sec>תחומי המלאי</Sec>
          <p className="faint">איפה הציוד יושב אצלכם.</p>
          <div className="rows" style={{ marginTop: 10 }}>
            {areas.map((a, i) => (
              <div className="item" key={a.slug}>
                <span className="mono faint">{a.slug}</span>
                <input className="inp grow" style={{ height: 38 }} value={a.label}
                  aria-label={"שם התחום " + a.slug}
                  onChange={(e) => setAreas(areas.map((x, j) =>
                    j === i ? { ...x, label: e.target.value } : x))} />
                <button className="iconbtn" aria-label="הסרה"
                  onClick={() => setAreas(areas.filter((_, j) => j !== i))}>
                  <MI.Trash size={17} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="btns" style={{ marginTop: 22 }}>
        <button className="btn" disabled={!y.start || !y.end}
          onClick={() => save("year", { year: y, inventoryAreas: areas })}>שמירה</button>
      </div>
    </>
  );
}

/* ============================================================
   6 · הכנסת הנתונים
   ============================================================ */
function PeopleStep({ st, reload }) {
  const [kind, setKind] = useState("students");
  const order = ["students", "staff", "calendar", "courses", "teams"];
  const imp = st.importers;

  return (
    <>
      <Sec>הכנסת הנתונים</Sec>
      <p className="muted">
        קובץ אקסל, טבלה בוורד, גיליון, או רשימה שהודבקה מוואטסאפ.
        <b> תמיד רואים לפני שכותבים.</b>
      </p>

      <div className="segs" style={{ marginTop: 14 }}>
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
      <Sec>נהלים וטקסטים</Sec>
      <p className="muted">
        נערכים כאן ובמסך עצמו, תמיד. <b>בלוק שלא נכתב אינו מוצג כלל</b> —
        מסך מלא בקופסאות ריקות מלמד להתעלם מהן.
      </p>
      <div style={{ marginTop: 16 }}>
        {Object.keys(TEXT_LABELS).map((k) => (
          <label className="field" key={k}>
            <span>{TEXT_LABELS[k]} <span className="mono faint">{k}</span></span>
            <textarea rows={k === "rules.main" ? 8 : 3}
              value={t[k] || ""} onChange={(e) => setT({ ...t, [k]: e.target.value })} />
          </label>
        ))}
      </div>
      <div className="btns">
        <button className="btn" onClick={() => save("texts", { texts: t })}>שמירה</button>
      </div>
    </>
  );
}
