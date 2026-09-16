/* ============================================================
   לוח הנוכחות השנתי — חודש אחד בגדול
   ------------------------------------------------------------
   ⚠⚠ **חודש אחד ולא עשרה.** רשת של עשרה חודשים הופכת כל תא
     לשישה פיקסלים: קריאה כרשת, בלתי קריאה כתאריך.

   ⚠⚠⚠ **`missing` הוא מצב חזותי משלו.** יום שיש לו סוג ואיש
     לא סימן בו נראה, בלי צבע משלו, בדיוק כמו «יום ללא
     פעילות» — וזו טענה שגויה על הנתונים. זה עיקרון «כשל
     נראה אחרת מריק», בגרסה חזותית.

   ⚠ **נפתח על החודש הנוכחי, ורק בפעם הראשונה.** `mi === null`
     פירושו «עוד לא נבחר»; ברירת מחדל של 0 הייתה פותחת תמיד
     בחודש הראשון גם בפברואר, ובחירה בכל רינדור הייתה מחזירה
     את המשתמש לחודש הנוכחי אחרי שדפדף.

   ⚠ **החץ מושבת ולא מוסתר** בקצוות — כפתור שנעלם מזיז את
     הכותרת בכל דפדוף, וזה נראה כמו קפיצה.
   ============================================================ */

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "./api.js";
import * as MI from "./icons.jsx";
import { Sec, Empty, Failed, Loading, Modal, heDate } from "./ui.jsx";

const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const DOW = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

/* ⚠ הריפוד חובה: `${y}-${m}` נותן "2026-9" ולעולם לא יתאים
   ל-"2026-09" — התאמה שנכשלת בשקט ותמיד פותחת בחודש הראשון. */
const key2 = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;

/* ⚠ המצב קובע את הצבע, והמקרא אומר מה כל אחד אומר במילים —
   צבע לבדו אינו נקרא על ידי מי שאינו מבחין בגוונים. */
const CELL = {
  present: { cls: "ok", label: "נכח" },
  half: { cls: "warn", label: "חצי יום" },
  absent: { cls: "bad", label: "נעדר" },
  unmarked: { cls: "faint", label: "לא סומן" },
  missing: { cls: "dim", label: "אין שורה ליום הזה" },
  nocount: { cls: "out", label: "אינו נספר" },
  noschool: { cls: "", label: "אין מכינה" },
};

export function Year() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [who, setWho] = useState("");
  const [mi, setMi] = useState(null);
  const [open, setOpen] = useState(null);

  const load = useCallback(() => {
    api.year(who || undefined).then((x) => { setD(x); setErr(null); })
      .catch((e) => setErr(e.offline ? "אין חיבור לשרת" : e.message));
  }, [who]);
  useEffect(() => { load(); }, [load]);

  /* חודשים שיש בהם משהו */
  const months = useMemo(() => {
    if (!d) return [];
    const set = new Set(d.days.map((r) => r.date.slice(0, 7)));
    return [...set].sort();
  }, [d]);

  /* ⚠ הבחירה **אחרי** שהחודשים חושבו, ורק כשעוד לא נבחר. */
  useEffect(() => {
    if (mi !== null || !months.length) return;
    const now = new Date();
    const here = months.indexOf(key2(now.getFullYear(), now.getMonth()));
    setMi(here >= 0 ? here : months.length - 1);
  }, [months, mi]);

  if (err && !d) return <Failed error={err} onRetry={load} />;
  if (!d) return <Loading rows={5} />;

  if (!months.length) {
    return (
      <>
        <Sec>לוח הנוכחות</Sec>
        <Empty icon={MI.Calendar} title="לוח השנה עוד ריק">
          אחרי שיוזן לוח שנה ויסומן יום ראשון, הלוח יופיע כאן.
        </Empty>
      </>
    );
  }

  const cur = months[Math.min(mi ?? 0, months.length - 1)];
  const rows = d.days.filter((r) => r.date.startsWith(cur));

  return (
    <>
      <Sec right={d.people.length ? (
        <select className="inp sm" value={who} onChange={(e) => { setWho(e.target.value); }}>
          <option value="">כל המכינה</option>
          {d.people.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}
        </select>
      ) : null}>
        לוח הנוכחות{d.person ? ` — ${d.person.name}` : ""}
      </Sec>

      {/* ⚠⚠ החורים הם הדבר שהמסך קיים בשבילו, ולכן הם למעלה. */}
      {d.missingCount > 0 && (
        <div className="banner warn">
          <MI.Warn size={18} />
          <div>
            <b>{d.missingCount} ימי מכינה לא סומנו בכלל</b>
            <div className="tiny" style={{ marginTop: 3 }}>
              הם אינם נספרים לאיש — לא כנוכחות ולא כהיעדרות.
            </div>
          </div>
        </div>
      )}

      {d.unknownKinds.length > 0 && (
        <div className="banner err">
          <MI.Warn size={18} />
          <div>
            ימים נושאים סוג שאינו קיים: {d.unknownKinds.join(" · ")}.
            הם יוצאים מחישוב האחוז. כדאי לקבוע להם סוג בהגדרות.
          </div>
        </div>
      )}

      {d.summary && (
        <div className="band" style={{ margin: "16px 0" }}>
          <div>
            <div className="k accent">
              {d.summary.pct === null ? "—" : `${d.summary.pct}%`}
            </div>
            <div className="l">
              {d.summary.pct === null
                ? `עוד ${d.summary.needMore} ימים מסומנים`
                : "נוכחות"}
            </div>
          </div>
          <div>
            <div className="k">{d.summary.present}</div>
            <div className="l">נוכח מתוך {d.summary.markedDays}</div>
          </div>
          <div>
            <div className="k">{d.summary.notCounted}</div>
            <div className="l">ימים שאינם נספרים</div>
          </div>
        </div>
      )}

      {/* ---------- דפדוף ---------- */}
      <div className="row" style={{ margin: "18px 0 10px" }}>
        <button className="iconbtn" aria-label="הקודם" disabled={mi <= 0}
          onClick={() => setMi(mi - 1)}><MI.Enter size={18} /></button>
        <h2 className="grow" style={{ textAlign: "center", margin: 0 }}>
          {MONTHS[Number(cur.slice(5, 7)) - 1]} {cur.slice(0, 4)}
        </h2>
        <button className="iconbtn" aria-label="הבא" disabled={mi >= months.length - 1}
          onClick={() => setMi(mi + 1)}><MI.Leave size={18} /></button>
      </div>

      <MonthGrid month={cur} rows={rows} onPick={setOpen} person={Boolean(d.person)} />

      {/* ⚠ המקרא במילים, ולא רק בצבע. */}
      <div className="row wrap" style={{ gap: 12, marginTop: 16 }}>
        {Object.entries(CELL)
          .filter(([k]) => (d.person ? k !== "nocount" : !["present", "half", "absent"].includes(k)) || true)
          .map(([k, v]) => (
            <span className="tiny row" style={{ gap: 5 }} key={k}>
              <i className={"dot " + v.cls} />{v.label}
            </span>
          ))}
      </div>

      {open && <DayCard row={open} person={d.person} onClose={() => setOpen(null)} />}
    </>
  );
}

/* ============================================================
   רשת חודש
   ⚠ `direction:rtl` במפורש — בלעדיו הרשת נבנית משמאל לימין
     בעוד התוויות בעברית, והתאריכים יושבים על היום הלא נכון.
   ============================================================ */
function MonthGrid({ month, rows, onPick, person }) {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();

  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let dd = 1; dd <= days; dd++) {
    cells.push(`${month}-${String(dd).padStart(2, "0")}`);
  }

  return (
    <div className="yr" style={{ direction: "rtl" }}>
      {DOW.map((x) => <div className="yr-h" key={x}>{x}</div>)}
      {cells.map((date, i) => {
        if (!date) return <div key={"e" + i} />;
        const r = byDate.get(date);
        const cls = stateOf(r, person);
        return (
          <button className={"yr-c " + cls} key={date}
            disabled={!r}
            title={r ? `${heDate(date)} · ${r.kindLabel || "ללא סוג"}` : heDate(date)}
            onClick={() => r && onPick(r)}>
            {Number(date.slice(8))}
          </button>
        );
      })}
    </div>
  );
}

/* ⚠⚠ סדר ההכרעה הוא העניין: «אין שורה» חייב לגבור על «לא
   סומן», אחרת שני מצבים שונים לגמרי נראים זהים. */
function stateOf(r, person) {
  if (!r) return "";
  if (r.unknownKind) return "bad";
  if (r.school === false) return CELL.noschool.cls;
  if (r.missing) return CELL.missing.cls;
  if (r.counts === false) return CELL.nocount.cls;
  if (person) return CELL[r.status]?.cls ?? CELL.unmarked.cls;
  if (!r.total) return CELL.unmarked.cls;
  const pct = r.present / r.total;
  return pct >= 0.9 ? "ok" : pct >= 0.7 ? "warn" : "bad";
}

/* ============================================================
   פירוט היום
   ⚠ `title` אינו עובד במגע, וזה היה כל המידע שהיה בלוח —
     התא הוא כפתור שפותח את השורה הזו.
   ============================================================ */
function DayCard({ row, person, onClose }) {
  return (
    <Modal title={heDate(row.date)} onClose={onClose}>
      <div className="rows">
        <div className="item">
          <span className="l">סוג היום</span>
          <span className={row.unknownKind ? "bad" : ""}>
            {row.kindLabel || "לא נקבע"}
            {row.unknownKind && " — סוג שאינו קיים באפיון"}
          </span>
        </div>
        <div className="item">
          <span className="l">נספר באחוז</span>
          <span>{row.counts === null ? "—" : row.counts ? "כן" : "לא"}</span>
        </div>
        {person ? (
          <div className="item">
            <span className="l">המצב שלי</span>
            <span>{CELL[row.status]?.label || "לא סומן"}</span>
          </div>
        ) : (
          <div className="item">
            <span className="l">נוכחים</span>
            <span>{row.total ? `${row.present} מתוך ${row.total}` : "לא סומן"}</span>
          </div>
        )}
      </div>

      {/* ⚠ החור מוסבר, ולא רק מסומן. */}
      {row.missing && (
        <div className="banner warn" style={{ marginTop: 14 }}>
          <MI.Warn size={17} />
          <div>
            זה יום מכינה שאיש לא סימן בו נוכחות. הוא אינו נספר לאיש —
            לא כנוכחות ולא כהיעדרות.
          </div>
        </div>
      )}
    </Modal>
  );
}
