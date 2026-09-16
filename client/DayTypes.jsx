/* ============================================================
   סוגי הימים — העורך
   ------------------------------------------------------------
   ⚠⚠⚠ **שני דגלים ולא אחד, והמסך אומר מה כל אחד עושה.**
     «יש מכינה» ו«נספר באחוז» נראים כמו אותה שאלה ואינם:
     בטיול היו כולם ואין רשימת נוכחות, ולכן הוא יום מכינה
     שאינו נספר. מנהל שיסמן «נספר» על יום שאין בו מכינה
     מוריד את האחוז של כולם על יום שלא היה — ולכן הצירוף
     הזה נחסם בשרת **ומוסבר כאן**.

   ⚠⚠ **הספירה מוצגת לצד כל סוג.** מי שעומד למחוק צריך לדעת
     אם מאחוריו יום אחד או ארבעים ושלושה — «יש שימוש» לבדו
     אינו מאפשר להחליט.

   ⚠ **ומזהה שנקבע אינו משתנה.** הוא נשמר על כל שורה בלוח
     השנה, ושינוי שלו היה מיתם את כולן בשקט.
   ============================================================ */

import React, { useState, useEffect, useCallback } from "react";
import { api } from "./api.js";
import * as MI from "./icons.jsx";
import { Sec, Empty, Failed, Loading, Confirm, useToast, tone } from "./ui.jsx";

const slugify = (s) =>
  String(s || "").toLowerCase().replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "").slice(0, 31);

export function DayTypes() {
  const [d, setD] = useState(null);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const toast = useToast();

  const load = useCallback(() => {
    api.dayTypes()
      .then((x) => { setD(x); setRows(x.types.map((t) => ({ ...t }))); setErr(null); })
      .catch((e) => setErr(e.offline ? "אין חיבור לשרת" : e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (err && !d) return <Failed error={err} onRetry={load} />;
  if (!d) return <Loading rows={4} />;

  const patch = (i, f) => setRows(rows.map((r, j) => (j === i ? { ...r, ...f } : r)));
  const add = () => setRows([...rows,
    { slug: "", label: "", school: true, counts: true, days: 0, isNew: true }]);

  const save = async (force = false) => {
    setBusy(true); setErr(null);
    try {
      const r = await api.dayTypesSave(
        rows.map(({ slug, label, school, counts }) => ({ slug, label, school, counts })),
        force);
      /* ⚠ אומר מה השתנה **בפועל** ולא «נשמר» — הוספה ומחיקה
         הן שתי פעולות שונות, ומחיקה היא זו שצריך לשים לב אליה. */
      const said = [
        r.added.length && `נוספו ${r.added.length}`,
        r.removed.length && `נמחקו ${r.removed.length}`,
      ].filter(Boolean).join(" · ");
      toast(said || "נשמר", "ok");
      setConfirm(null);
      load();
    } catch (e) {
      /* ⚠ 409 הוא «יש ימים מאחורי הסוג» — מצב שאפשר לאשר,
         ולכן הוא הופך לדיאלוג ולא לשגיאה אדומה. */
      if (e.status === 409) setConfirm(e.message);
      else setErr(e.message);
    } finally { setBusy(false); }
  };

  const dirty = JSON.stringify(rows.map(({ slug, label, school, counts }) =>
    ({ slug, label, school, counts }))) !== JSON.stringify(d.types.map(
    ({ slug, label, school, counts }) => ({ slug, label, school, counts })));

  return (
    <>
      <Sec right={d.canEdit ? (
        <button className="btn sm" onClick={add}><MI.Plus size={16} />סוג חדש</button>
      ) : null}>סוגי הימים</Sec>

      <p className="muted">
        איך המכינה שלכם מחלקת את השנה. כל סוג אומר שני דברים:
        <b> האם מתקיימת בו מכינה</b>, ו<b>האם הוא נספר באחוז הנוכחות</b> —
        ושתי השאלות אינן זהות.
      </p>

      {err && <div className="banner err"><MI.Warn size={18} /><div>{err}</div></div>}

      {/* ⚠⚠ סוג יתום — שורות בלוח השנה שנושאות סוג שאינו קיים.
          הן יוצאות מהמכנה בשקט, ולכן זה הדבר הראשון במסך. */}
      {d.orphans.length > 0 && (
        <div className="banner warn">
          <MI.Warn size={18} />
          <div>
            <b>יש ימים בלוח השנה עם סוג שאינו קיים</b>
            <div className="tiny" style={{ marginTop: 3 }}>
              {d.orphans.map((o) => `«${o.slug}» — ${o.days} ימים`).join(" · ")}
              {" · "}הם אינם נספרים באחוז הנוכחות. כדאי לקבוע להם סוג.
            </div>
          </div>
        </div>
      )}

      <div className="rows" style={{ marginTop: 16 }}>
        {rows.map((r, i) => (
          <div className={"card tight " + tone(r.label || r.slug || "x")} key={i}>
            <div className="row start wrap">
              <div className="tile sm"><MI.Calendar size={15} /></div>

              <label className="grow" style={{ minWidth: 150 }}>
                <input className="inp" style={{ height: 40 }} value={r.label}
                  placeholder="יום מיון" aria-label="שם סוג היום"
                  disabled={!d.canEdit}
                  onChange={(e) => patch(i, {
                    label: e.target.value,
                    /* ⚠ המזהה נגזר מהשם **רק בסוג חדש**. גזירה
                       תמידית הייתה משנה מזהה קיים בשינוי שם,
                       ומייתמת את כל השורות שנושאות אותו. */
                    ...(r.isNew && !r.touched ? { slug: slugify(e.target.value) } : {}),
                  })} />
              </label>

              <label style={{ width: 150 }}>
                <input className="inp mono" style={{ height: 40 }} dir="ltr"
                  value={r.slug} placeholder="miyun" aria-label="מזהה"
                  /* ⚠ מזהה קיים אינו ניתן לשינוי — ראו ההערה בראש. */
                  disabled={!d.canEdit || !r.isNew}
                  onChange={(e) => patch(i, { slug: slugify(e.target.value), touched: true })} />
              </label>

              <span className="pill num" title="ימים בלוח השנה">
                {r.days ?? 0} ימים
              </span>

              {d.canEdit && (
                <button className="iconbtn" aria-label="מחיקה"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                  <MI.Trash size={17} />
                </button>
              )}
            </div>

            <div className="row wrap" style={{ marginTop: 10, gap: 18 }}>
              <label className="chk" style={{ flex: "none" }}>
                <input type="checkbox" checked={Boolean(r.school)} disabled={!d.canEdit}
                  onChange={(e) => patch(i, {
                    school: e.target.checked,
                    /* ⚠ «נספר» בלי «יש מכינה» הוא צירוף שהשרת
                       חוסם — מכבים אותו כאן ולא נותנים למישהו
                       להגיע ל-400 אחרי שכבר שמר. */
                    counts: e.target.checked ? r.counts : false,
                  })} />
                <span>מתקיימת מכינה</span>
              </label>

              <label className={"chk " + (r.school ? "" : "dim")} style={{ flex: "none" }}>
                <input type="checkbox" checked={Boolean(r.counts)}
                  disabled={!d.canEdit || !r.school}
                  onChange={(e) => patch(i, { counts: e.target.checked })} />
                <span>נספר באחוז הנוכחות</span>
              </label>

              <span className="tiny grow">
                {!r.school ? "אי אפשר לסמן נוכחות ביום כזה, והוא מחוץ לאחוז."
                  : r.counts ? "יום שסופרים — נוכחות נספרת בו."
                    : "יש מכינה ואין רשימה — כמו טיול. מחוץ לאחוז."}
              </span>
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 && (
        <Empty icon={MI.Calendar} title="אין סוגי ימים">
          בלי סוג יום אחד לפחות אי אפשר לבנות לוח שנה.
        </Empty>
      )}

      {d.canEdit && (
        <div className="btns" style={{ marginTop: 20 }}>
          <button className="btn" disabled={busy || !dirty} onClick={() => save(false)}>
            {busy ? "שומר…" : "שמירה"}
          </button>
          {dirty && (
            <button className="btn quiet" onClick={load}>ביטול השינויים</button>
          )}
        </div>
      )}

      {confirm && (
        <Confirm
          title="מחיקת סוג שיש לו ימים"
          danger
          cta="למחוק בכל זאת"
          body={confirm}
          onYes={() => save(true)}
          onClose={() => setConfirm(null)} />
      )}
    </>
  );
}
