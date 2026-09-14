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

import React, { useEffect, useState, useMemo } from "react";
import { api } from "./api.js";
import * as MI from "./icons.jsx";
import { Avatar, Empty, Failed, Loading, Segs, Sec } from "./ui.jsx";

export function People() {
  const [kind, setKind] = useState("student");
  const [q, setQ] = useState("");
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

  /* ⚠ סינון במסך ולא בשרת: הרשימה כולה כבר כאן, ובקשה לכל
     הקלדה הייתה מייצרת מרוץ בין תשובות. */
  const shown = useMemo(() => {
    const t = q.trim();
    if (!t || !data) return data?.people || [];
    return data.people.filter((p) =>
      [p.name, p.city, p.phone].filter(Boolean).some((v) => String(v).includes(t)));
  }, [q, data]);

  return (
    <>
      <div className="row wrap" style={{ marginBottom: "var(--s4)" }}>
        <Segs value={kind} onChange={setKind} options={[
          { key: "student", label: "חניכים", icon: MI.People },
          { key: "staff", label: "צוות", icon: MI.Shield },
        ]} />
        <div className="grow" />
        <div style={{ position: "relative", minWidth: 200 }}>
          <MI.Search size={17} style={{ position: "absolute", insetInlineStart: 13,
            top: 11, color: "var(--faint)" }} />
          <input className="inp" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש" aria-label="חיפוש"
            style={{ height: 40, paddingInlineStart: 38 }} />
        </div>
      </div>

      {busy && <Loading rows={6} />}
      {err && <Failed error={err} onRetry={() => setKind(kind)} />}

      {data && !busy && !err && (
        <>
          <Sec>{data.label} <span className="faint num">· {data.total}</span></Sec>

          {data.people.length === 0 ? (
            /* ⚠ ריק אמיתי — ולא כשל. שני מסכים שונים, תמיד. */
            <Empty icon={MI.People} title="אין עדיין אף אחד ברשימה">
              אפשר להדביק את המצבה בשלב «אנשים» של האפיון, או להוסיף אחד-אחד.
            </Empty>
          ) : shown.length === 0 ? (
            <Empty icon={MI.Search} title={`אין תוצאה ל«${q}»`}>
              החיפוש עובר על שם, עיר וטלפון.
            </Empty>
          ) : (
            <div className="rows">
              {shown.map((p) => (
                <div className="item" key={p.id}>
                  <Avatar name={p.name} />
                  <div className="grow" style={{ lineHeight: 1.35, minWidth: 0 }}>
                    <div className="nm trunc">{p.name}</div>
                    <div className="tiny trunc">
                      {[p.city, p.phone].filter(Boolean).join(" · ") || "\u00a0"}
                    </div>
                  </div>

                  {/* ⚠ אלרגיה **מובלטת ואינה שורה ברשימה.** זה
                      הנתון היחיד כאן שיש לו משמעות מיידית, ומי
                      שמבשל לא סורק שמונה שורות אפורות כדי
                      למצוא אותו. */}
                  {p.allergy && (
                    <span className="pill bad" title="אלרגיה">
                      <MI.Warn size={13} />{p.allergy}
                    </span>
                  )}
                  {p.roles?.length > 0 && (
                    <span className="pill" title={p.roles.join(" · ")}>
                      <MI.Shield size={13} />{p.roles.length}
                    </span>
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
