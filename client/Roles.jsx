/* ============================================================
   בעלי תפקידים — מי נושא מה
   ------------------------------------------------------------
   ⚠⚠ **זה המסך של «מי», ולא של «מה מותר לו».** ההגדרה של
     תפקיד — אילו מסכים הוא פותח — יושבת בהגדרות המכינה, וזו
     שאלה אחרת לגמרי. שני מסכים שעונים על שתי שאלות, ולא מסך
     אחד שמנסה את שתיהן.

   ⚠⚠ **`canAssign` מגיע מהשרת.** כפתור «הענקה» שמופיע לאיש
     צוות שאינו ראש המכינה מקבל 403 אחרי הלחיצה — וזה בדיוק
     מה שהכלל נועד למנוע.

   ⚠ **תפקיד `staffOnly` אינו מוצע לחניך בבורר**, כי הענקה
     שלו פותחת לו מסכים שאינם שלו.

   ⚠ **והשיוך הוא המצב הרצוי ולא «הוסף/הסר»** — שניים שעורכים
     את אותו אדם מקבלים תוצאה שלמה ולא חצי מכל אחד.
   ============================================================ */

import React, { useEffect, useState, useCallback } from "react";
import { api } from "./api.js";
import * as MI from "./icons.jsx";
import { Sec, Empty, Failed, Loading, Modal, useToast, tone, Avatar } from "./ui.jsx";

export function Roles() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [pick, setPick] = useState(null);

  const load = useCallback(() => {
    api.roleHolders().then((x) => { setD(x); setErr(null); })
      .catch((e) => setErr(e.offline ? "אין חיבור לשרת" : e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (err && !d) return <Failed error={err} onRetry={load} />;
  if (!d) return <Loading rows={4} />;

  const held = d.roles.filter((r) => r.people.length).length;

  return (
    <>
      <Sec>בעלי תפקידים</Sec>
      <p className="muted">
        מי נושא איזה תפקיד במכינה. <b>מה כל תפקיד פותח</b> נקבע
        בהגדרות המכינה — כאן נקבע מי נושא אותו.
      </p>

      {d.roles.length === 0 ? (
        <Empty icon={MI.Shield} title="לא הוגדרו תפקידים">
          תפקידים נוצרים בהגדרות המכינה, ואפשר להתחיל מההצעות שם.
        </Empty>
      ) : (
        <>
          <div className="band" style={{ margin: "16px 0" }}>
            <div>
              <div className="k accent">{held}</div>
              <div className="l">תפקידים מאוישים מתוך {d.roles.length}</div>
            </div>
            <div>
              <div className="k">
                {new Set(d.roles.flatMap((r) => r.people.map((p) => p.id))).size}
              </div>
              <div className="l">אנשים נושאים תפקיד</div>
            </div>
          </div>

          <div className="rows">
            {d.roles.map((r) => (
              <div className={"card tight " + tone(r.label)} key={r.slug}>
                <div className="row start">
                  <div className="tile sm"><MI.Shield size={15} /></div>
                  <div className="grow">
                    <div className="nm">
                      {r.label}
                      {r.staffOnly && <span className="pill out sm">צוות בלבד</span>}
                    </div>
                    {r.desc && <div className="tiny">{r.desc}</div>}
                  </div>
                  {d.canAssign && (
                    <button className="btn sm quiet" onClick={() => setPick(r)}>
                      <MI.Edit size={15} />שיבוץ
                    </button>
                  )}
                </div>

                {/* ⚠⚠ **תפקיד בלי נושאים אומר זאת במילים.** שורה
                    ריקה נראית כמו טעינה שנכשלה, ותפקיד לא מאויש
                    הוא בדיוק מה שמנהל צריך לראות. */}
                <div className="row wrap" style={{ gap: 7, marginTop: 10 }}>
                  {r.people.length === 0
                    ? <span className="tiny faint">אין מי שנושא את התפקיד הזה</span>
                    : r.people.map((p) => (
                      <span className="pill tone" key={p.id}>
                        <Avatar name={p.name} size="sm" />{p.name}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pick && (
        <Assign role={pick} d={d} onClose={() => setPick(null)}
          onSaved={() => { setPick(null); load(); }} />
      )}
    </>
  );
}

/* ============================================================
   השיבוץ
   ⚠ **בחירה מקומית ושמירה מפורשת, ולא סימון אופטימי.** שיוך
     תפקיד פותח מסכים; תיבה שמסומנת מיד ונכשלת בשקט משאירה
     את המנהל בטוח שהעניק הרשאה שלא ניתנה.
   ============================================================ */
function Assign({ role, d, onClose, onSaved }) {
  /* ⚠ חניך אינו מוצע לתפקיד `staffOnly` — ראו ההערה בראש. */
  const pool = role.staffOnly ? d.staff : [...d.staff, ...d.students];
  const [ids, setIds] = useState(new Set(role.people.map((p) => p.id)));
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const toast = useToast();

  const flip = (id) => {
    const next = new Set(ids);
    next.has(id) ? next.delete(id) : next.add(id);
    setIds(next);
  };

  const save = async () => {
    setBusy(true); setErr(null);
    /* ⚠⚠ נקודת הקצה מקבלת **אדם ורשימת התפקידים שלו**, ולכן
       שינוי כאן נבנה מהמצב הקיים של כל אדם שנגענו בו — ולא
       דורס לו תפקידים אחרים. */
    const before = new Set(role.people.map((p) => p.id));
    const touched = [...new Set([...before, ...ids])]
      .filter((id) => before.has(id) !== ids.has(id));
    try {
      for (const id of touched) {
        const current = d.roles.filter((r) => r.people.some((p) => p.id === id))
          .map((r) => r.slug);
        const next = ids.has(id)
          ? [...new Set([...current, role.slug])]
          : current.filter((s) => s !== role.slug);
        await api.assignRoles(id, next);
      }
      toast(touched.length ? `עודכנו ${touched.length}` : "לא השתנה דבר", "ok");
      onSaved();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  const shown = pool.filter((p) => !q || p.name.includes(q));

  return (
    <Modal title={`מי נושא: ${role.label}`} onClose={onClose}>
      {err && <div className="banner err"><MI.Warn size={17} /><div>{err}</div></div>}

      {role.staffOnly && (
        <div className="banner info">
          <MI.Info size={17} />
          <div>תפקיד של צוות — חניכים אינם מופיעים ברשימה.</div>
        </div>
      )}

      <label className="field">
        <span>חיפוש</span>
        <input className="inp" value={q} placeholder="שם"
          onChange={(e) => setQ(e.target.value)} />
      </label>

      {/* ⚠ `scroll-y` הקיימת, ולא `max-height` חדש — כלל חדש
          בתוך `rows` נבלע על ידי הכלל הכללי. */}
      <div className="rows scroll-y">
        {shown.length === 0
          ? <p className="tiny faint">אין מי שמתאים לחיפוש.</p>
          : shown.map((p) => (
            <label className="chk" key={p.id}>
              <input type="checkbox" checked={ids.has(p.id)}
                onChange={() => flip(p.id)} />
              <span>{p.name}</span>
            </label>
          ))}
      </div>

      <div className="btns">
        <button className="btn" disabled={busy} onClick={save}>
          {busy ? "שומר…" : "שמירה"}
        </button>
        <button className="btn quiet" onClick={onClose}>ביטול</button>
      </div>
    </Modal>
  );
}
