/* ============================================================
   רשימת האנשים
   ------------------------------------------------------------
   ⚠ הכותרת מגיעה מהשרת (`label`) ולא מקובעת כאן — מכינה
     שקוראת לחניכים «תלמידים» רואה «תלמידים» בכל מקום, בלי
     שאף מסך יידע על כך.

   ⚠ **אלרגיה מובלטת ואינה שורה ברשימה.** זה הנתון היחיד
     כאן שיש לו משמעות מיידית, ומי שמבשל לא סורק שמונה
     שורות אפורות כדי למצוא אותו.
   ============================================================ */

import React, { useEffect, useState } from "react";
import { api } from "./api.js";

export function People() {
  const [kind, setKind] = useState("student");
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    setBusy(true); setErr(null);
    api.people(kind)
      .then(setData)
      .catch((e) => setErr(e.offline ? "אין חיבור לשרת" : e.message))
      .finally(() => setBusy(false));
  }, [kind]);

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button className={"btn " + (kind === "student" ? "" : "ghost")}
          style={{ padding: "8px 16px", fontSize: 15 }}
          onClick={() => setKind("student")}>חניכים</button>
        <button className={"btn " + (kind === "staff" ? "" : "ghost")}
          style={{ padding: "8px 16px", fontSize: 15 }}
          onClick={() => setKind("staff")}>צוות</button>
      </div>

      {busy && <><div className="skel" /><div className="skel" /><div className="skel" /></>}
      {err && <div className="banner err">לא הצלחנו לטעון — {err}</div>}

      {data && !busy && !err && (
        <>
          <h2 style={{ marginBottom: 10 }}>
            {data.label} <span className="faint">· {data.total}</span>
          </h2>

          {data.people.length === 0 ? (
            /* ⚠ ריק אמיתי — ולא כשל. שני מסכים שונים, תמיד. */
            <div className="card"><div className="empty">
              <h3>אין עדיין אף אחד ברשימה</h3>
              <p className="muted">אפשר להוסיף בשלב «אנשים» של האפיון.</p>
            </div></div>
          ) : (
            <div className="rows">
              {data.people.map((p) => (
                <div className="row" key={p.id}>
                  <div className="grow">
                    <div className="nm">{p.name}</div>
                    <div className="faint">
                      {[p.city, p.phone].filter(Boolean).join(" · ") || " "}
                    </div>
                  </div>
                  {p.allergy && (
                    <span className="pill half" title="אלרגיה">⚠ {p.allergy}</span>
                  )}
                  {p.roles?.length > 0 && (
                    <span className="pill unmarked">{p.roles.length} תפקידים</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
