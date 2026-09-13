/* ============================================================
   שלד האפליקציה
   ------------------------------------------------------------
   ⚠ **הכול נגזר מהאפיון.** שם המכינה, הצבעים, המונחים ואילו
     מסכים קיימים — כולם מגיעים מהשרת. אין כאן שם מכינה אחד
     מקובע, וזה ההבדל בין מוצר לבין אפליקציה של לקוח אחד.

   ⚠ **כשל טעינה נראה אחרת מ«אין נתונים»**, בכל מסך.
   ============================================================ */

import React, { useEffect, useState, useCallback } from "react";
import { api, setUnauthorizedHandler } from "./api.js";
import { CSS, applyColors } from "./styles.js";
import { Login } from "./Login.jsx";
import { Home } from "./Home.jsx";
import { People } from "./People.jsx";
import { Attendance } from "./Attendance.jsx";

export function App() {
  const [brand, setBrand] = useState(null);
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [failed, setFailed] = useState(null);
  const [notice, setNotice] = useState(null);
  const [screen, setScreen] = useState("home");

  /* ⚠ המותג נטען **לפני** הכניסה: מסך כניסה בלי שם המכינה
     נראה כמו מסך של אף אחד. */
  const boot = useCallback(async () => {
    setFailed(null);
    try {
      const b = await api.publicProfile();
      setBrand(b);
      applyColors(b.colors);
      document.title = b.name || "מכינות";
      const { user: u } = await api.me();
      setUser(u);
    } catch (e) {
      setFailed(e.offline ? "אין חיבור לשרת" : e.message);
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => { boot(); }, [boot]);

  useEffect(() => {
    setUnauthorizedHandler((msg) => {
      setUser(null);
      setNotice(msg || "הסשן פג, יש להתחבר שוב");
    });
  }, []);

  const onOut = async () => {
    try { await api.logout(); } finally { setUser(null); setScreen("home"); }
  };

  if (booting) {
    return <><style>{CSS}</style><div className="wrap" style={{ paddingTop: 40 }}>
      <div className="skel" /><div className="skel" /><div className="skel" />
    </div></>;
  }

  /* ⚠ כשל בטעינת השלד הוא מסך משלו עם כפתור «נסה שוב» —
     ולא מסך ריק שנראה כמו מכינה בלי נתונים. */
  if (failed) {
    return <><style>{CSS}</style><div className="wrap" style={{ paddingTop: 48 }}>
      <div className="banner err">לא הצלחנו לטעון את המערכת — {failed}</div>
      <button className="btn" onClick={() => { setBooting(true); boot(); }}>
        נסה שוב
      </button>
    </div></>;
  }

  if (!user) {
    return <><style>{CSS}</style>
      <Login brand={brand} notice={notice} onIn={(u) => { setNotice(null); setUser(u); }} />
    </>;
  }

  const may = (s) => user.screens.includes("*") || user.screens.includes(s);
  const TABS = [
    { key: "home", label: "בית" },
    { key: "attendance", label: "נוכחות" },
    { key: "people", label: brand?.peopleLabel || "אנשים" },
  ].filter((tb) => tb.key === "home" || may(tb.key));

  return (
    <>
      <style>{CSS}</style>

      <header className="top">
        <div className="wrap">
          <div>
            <div className="nm">{brand?.name || "מכינות"}</div>
            <div className="sub">{user.name} · {user.roleLabels.join(" · ") || user.kindLabel}</div>
          </div>
          <div className="grow" />
          <button onClick={onOut}>יציאה</button>
        </div>
      </header>

      <nav className="wrap" style={{ display: "flex", gap: 8, padding: "14px 16px 0" }}>
        {TABS.map((tb) => (
          <button
            key={tb.key}
            className={"btn " + (screen === tb.key ? "" : "ghost")}
            style={{ padding: "8px 16px", fontSize: 15 }}
            onClick={() => setScreen(tb.key)}
          >{tb.label}</button>
        ))}
      </nav>

      <main className="wrap" style={{ padding: "18px 16px 60px" }}>
        {/* ⚠ החיווי על צפייה בלבד חייב להופיע — מי שכל כפתור
            מחזיר לו 403 יסיק שהמערכת שבורה. */}
        {user.viewOnly && (
          <div className="banner info">החשבון שלך בצפייה בלבד — אפשר לראות הכול ולא לשנות</div>
        )}
        {screen === "home" && <Home user={user} brand={brand} go={setScreen} />}
        {screen === "attendance" && may("attendance") && <Attendance user={user} />}
        {screen === "people" && may("people") && <People />}
      </main>
    </>
  );
}
