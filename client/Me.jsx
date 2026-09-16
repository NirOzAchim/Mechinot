/* ============================================================
   הפרופיל שלי — מסך אחד
   ------------------------------------------------------------
   ⚠⚠ **הכול על עצמי במסך אחד.** במערכת הקודמת היו כאן שתי
     לשוניות באותו שם — אחת לזהות ואחת לצבא ולמיונים —
     והחניך היה צריך לנחש איזו מהן מחזיקה את מה שהוא מחפש.

   ⚠⚠ **ת.ז, שם ומגדר לקריאה בלבד, והמסך אומר למי לפנות.**
     הם מזהים את האדם מול המכינה, ושינוי שלהם היה מנתק אותו
     מהשיבוצים, מהנוכחות ומהבקשות. «אי אפשר» לבדו שולח
     לחפש; «פונים לראש המכינה» הוא תשובה.

   ⚠ **והאכיפה בשרת** — `SELF_FIELDS` ב-server/routes/people.js
     היא הרשימה, וזו אינה הסתרה במסך.

   ⚠ **אחוז נוכחות מוצג רק מעל הסף.** בתחילת שנה «0%» הוא
     מספר נכון חשבונית ושקרי במשמעותו — והוא הדבר הראשון
     שהחניך רואה על עצמו.
   ============================================================ */

import React, { useEffect, useState, useCallback } from "react";
import { api } from "./api.js";
import * as MI from "./icons.jsx";
import { Sec, Avatar, Failed, Loading, useToast, Bar, heDate } from "./ui.jsx";

/* ⚠ הרשימה כאן חייבת להתאים ל-`SELF_FIELDS` בשרת. שדה
   שיופיע כאן ולא שם ייראה כאילו נשמר ולא ייכתב. */
const EDITABLE = [
  { key: "phone", label: "טלפון", type: "tel", ph: "052-1234567" },
  { key: "email", label: "אימייל", type: "email", ph: "you@example.com" },
  { key: "city", label: "עיר מגורים", type: "text", ph: "" },
  { key: "shirtSize", label: "מידת חולצה", type: "text", ph: "L" },
  /* ⚠ האלרגיה מובלטת ואינה שורה ברשימה — זה הנתון היחיד כאן
     שיש לו משמעות מיידית למי שמבשל. */
  { key: "allergy", label: "אלרגיה או רגישות", type: "text", ph: "אין" },
];

/* ⚠ **לקריאה בלבד, ונאמר למה.** ראו ההערה בראש. */
const LOCKED = [
  { key: "name", label: "שם מלא" },
  { key: "nationalId", label: "תעודת זהות" },
  { key: "birthDate", label: "תאריך לידה" },
];

export function Me() {
  const [d, setD] = useState(null);
  const [att, setAtt] = useState(null);
  const [err, setErr] = useState(null);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(() => {
    api.myProfile()
      .then((x) => { setD(x); setErr(null); })
      .catch((e) => setErr(e.offline ? "אין חיבור לשרת" : e.message));
    /* ⚠⚠ **הנוכחות נטענת בנפרד ואינה מפילה את המסך.** מכינה
       שכיבתה את מודול הנוכחות, או קריאה שנכשלה, משאירות את
       הפרופיל עובד — «מה שנכשל מוצג, ומה שריק אינו מוצג». */
    api.summary().then(setAtt).catch(() => setAtt({ failed: true }));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (err && !d) return <Failed error={err} onRetry={load} />;
  if (!d) return <Loading rows={4} />;

  /* ⚠ מנהל-על אינו אדם במכינה, ואין לו פרופיל. `null` מפורש
     ולא מסך ריק שנראה כמו תקלה. */
  if (d.notAPerson || !d.person) {
    return (
      <>
        <Sec>הפרופיל שלי</Sec>
        <div className="banner info">
          <MI.Info size={18} />
          <div>נכנסתם כמנהל-על של המערכת, ואין לכם שורה במצבת המכינה הזו.</div>
        </div>
      </>
    );
  }

  const p = d.person;

  const save = async () => {
    setBusy(true);
    try {
      const r = await api.updateMe(edit);
      /* ⚠ אומר **מה** השתנה ולא «נשמר» — שדה שנשלח זהה לקיים
         אינו שינוי, והמסך אומר אמת. */
      toast(r.same ? "לא השתנה דבר" : `עודכן: ${r.changed.join(" · ")}`, "ok");
      setEdit(null);
      load();
    } catch (e) { toast(e.message, "err"); }
    finally { setBusy(false); }
  };

  return (
    <>
      <Sec right={edit === null ? (
        <button className="btn sm quiet" onClick={() => setEdit({})}>
          <MI.Edit size={16} />עריכת הפרטים
        </button>
      ) : null}>הפרופיל שלי</Sec>

      {/* ---------- הכותרת ---------- */}
      <div className="card lift row start" style={{ gap: 16 }}>
        <Avatar name={p.name} size="lg" />
        <div className="grow">
          <div className="nm lg">{p.name}</div>
          <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {d.roles.length === 0
              ? <span className="pill out">{p.kind === "staff" ? "צוות" : "חניך"}</span>
              : d.roles.map((r) => (
                <span className="pill tone" key={r.slug}>{r.label}</span>
              ))}
          </div>
          {/* ⚠ מובלט, ולא שורה ברשימה. */}
          {p.allergy && (
            <div className="banner warn" style={{ marginTop: 12 }}>
              <MI.Warn size={17} />
              <div><b>אלרגיה או רגישות:</b> {p.allergy}</div>
            </div>
          )}
        </div>
      </div>

      {/* ---------- נוכחות ---------- */}
      <Attendance att={att} />

      {/* ---------- הפרטים ---------- */}
      <Sec>הפרטים שלי</Sec>

      {edit === null ? (
        <div className="rows">
          {EDITABLE.map((f) => (
            <div className="item" key={f.key}>
              <span className="l">{f.label}</span>
              {/* ⚠ **ריק אינו «—»**: «טרם מולא» אומר שאפשר למלא,
                  ומקף נראה כמו נתון שאינו קיים במערכת. */}
              <span className={p[f.key] ? "" : "faint"}>
                {p[f.key] || "טרם מולא"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rows">
          {EDITABLE.map((f) => (
            <label className="field" key={f.key}>
              <span>{f.label}</span>
              <input className="inp" type={f.type} placeholder={f.ph}
                dir={f.type === "tel" || f.type === "email" ? "ltr" : undefined}
                value={edit[f.key] !== undefined ? edit[f.key] : (p[f.key] || "")}
                onChange={(e) => setEdit({ ...edit, [f.key]: e.target.value })} />
            </label>
          ))}
          <div className="btns">
            <button className="btn" disabled={busy} onClick={save}>
              {busy ? "שומר…" : "שמירה"}
            </button>
            <button className="btn quiet" disabled={busy}
              onClick={() => setEdit(null)}>ביטול</button>
          </div>
        </div>
      )}

      {/* ---------- מה שאי אפשר לשנות ---------- */}
      <Sec>הזהות שלי</Sec>
      <div className="rows">
        {LOCKED.map((f) => p[f.key] ? (
          <div className="item" key={f.key}>
            <span className="l">{f.label}</span>
            {/* ⚠ תאריך בנוסח עברי ולא ISO — «2008-09-11» נראה כמו
                שדה שלא עובד, ומי שקורא אותו צריך לתרגם בראש. */}
            <span className="mono">
              {f.key === "birthDate" ? heDate(p[f.key]) : p[f.key]}
            </span>
          </div>
        ) : null)}
      </div>
      <p className="tiny muted" style={{ marginTop: 10 }}>
        <MI.Lock size={13} />{" "}
        שם, תעודת זהות ותאריך לידה מזהים אתכם מול המכינה, ושינוי שלהם
        מנתק אתכם מהנוכחות ומהבקשות. אם משהו כאן אינו נכון —
        <b> פונים לראש המכינה</b>.
      </p>
    </>
  );
}

/* ============================================================
   הנוכחות שלי
   ⚠⚠ **שלושה מצבים ולא שניים**: נטען · נכשל · אין מספיק ימים.
     כשל טעינה שנראה כמו «אין נתונים» הוא הבאג שחי יומיים
     בייצור במערכת הקודמת.
   ============================================================ */
function Attendance({ att }) {
  if (!att) return null;
  if (att.failed) {
    return (
      <div className="banner warn" style={{ marginTop: 16 }}>
        <MI.Warn size={17} />
        <div>לא הצלחנו לטעון את נתוני הנוכחות. שאר הפרטים כאן מעודכנים.</div>
      </div>
    );
  }
  if (att.notAPerson || !att.summary) return null;

  const s = att.summary;
  const { quota, used, left } = att;

  return (
    <>
      <Sec>הנוכחות שלי</Sec>
      <div className="band">
        <div>
          {/* ⚠ **האחוז מוצג רק מעל הסף** — ראו ההערה בראש. */}
          <div className="k accent">{s.pct === null ? "—" : `${s.pct}%`}</div>
          <div className="l">
            {s.pct === null
              ? `עוד ${s.needMore} ימים מסומנים ויוצג אחוז`
              : "נוכחות"}
          </div>
        </div>
        <div>
          <div className="k">{s.present}</div>
          <div className="l">נוכח מתוך {s.markedDays} ימים שסומנו</div>
        </div>
        {/* ⚠⚠ **`left === null` אינו אפס.** מכינה שאין בה
            מודול בקשות, או שלא הגדירה מכסה, אינה מקבלת
            «נותרו 0» — המספר פשוט אינו מוצג. */}
        {left !== null && left !== undefined && (
          <div>
            <div className="k">{left}</div>
            <div className="l">ימי חופש שנותרו מתוך {quota}</div>
          </div>
        )}
      </div>

      {left !== null && left !== undefined && quota ? (
        <div style={{ marginTop: 10 }}>
          <Bar value={used} max={quota} tone={left === 0 ? "bad" : ""} />
        </div>
      ) : null}

      {/* ⚠⚠ **הימים שאינם נספרים נאמרים.** חניך שרואה 27 ימים
          במקום 30 ואינו יודע למה מסיק שהמערכת טועה. */}
      {s.notCounted > 0 && (
        <p className="tiny muted" style={{ marginTop: 8 }}>
          {s.notCounted} ימים אינם נספרים באחוז — טיולים, חופשות וימים
          שהמכינה סימנה שאין בהם שגרה.
        </p>
      )}

      {/* ⚠ סוג יום שנמחק משאיר ימים שיוצאים מהמכנה בשקט.
          כאן זה נאמר, כדי שלא ייראה כמו אחוז שהשתנה מעצמו. */}
      {s.unknownKind > 0 && (
        <div className="banner warn" style={{ marginTop: 8 }}>
          <MI.Warn size={17} />
          <div>
            {s.unknownKind} ימים נושאים סוג יום שאינו קיים ואינם נספרים.
            כדאי לומר לראש המכינה.
          </div>
        </div>
      )}
    </>
  );
}
