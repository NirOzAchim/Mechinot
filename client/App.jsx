/* ============================================================
   שלד האפליקציה
   ------------------------------------------------------------
   ⚠⚠ **הניווט מגיע מהשרת ואינו מחושב כאן.** `GET /api/nav`
     בונה אותו מאותה פונקציה שהשרת אוכף בה את הגישה. שני
     חישובים מקבילים מתפצלים ביום שמישהו מכבה מודול, והמשתמש
     רואה לשונית שנפתחת ל-403.

   ⚠⚠ **אפיון חסר פותח את הסטודיו ולא את מסך הבית.** מנהל
     שנכנס למכינה שטרם אופיינה צריך לראות את מה שחסר ואת
     הדרך להשלים אותו — ולא מסך בית ריק שנראה כמו תקלה.

   ⚠ **כשל טעינה נראה אחרת מ«אין נתונים»**, בכל מסך.
   ============================================================ */

import React, { useEffect, useState, useCallback } from "react";
import { api, setUnauthorizedHandler } from "./api.js";
import { CSS, applyColors } from "./styles.js";
import { Login } from "./Login.jsx";
import { Home } from "./Home.jsx";
import { People } from "./People.jsx";
import { Attendance } from "./Attendance.jsx";
import { Studio } from "./Studio.jsx";
import { Placeholder } from "./Placeholder.jsx";

export function App() {
  const [brand, setBrand] = useState(null);
  const [user, setUser] = useState(null);
  const [nav, setNav] = useState(null);
  const [booting, setBooting] = useState(true);
  const [failed, setFailed] = useState(null);
  const [notice, setNotice] = useState(null);
  const [screen, setScreen] = useState("home");
  const [drawer, setDrawer] = useState(false);

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
      if (u) setNav(await api.nav());
    } catch (e) {
      setFailed(e.offline ? "אין חיבור לשרת" : e.message);
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => { boot(); }, [boot]);

  useEffect(() => {
    setUnauthorizedHandler((msg) => {
      setUser(null); setNav(null);
      setNotice(msg || "הסשן פג, יש להתחבר שוב");
    });
  }, []);

  const afterLogin = async (u) => {
    setNotice(null); setUser(u);
    try { setNav(await api.nav()); } catch { /* המסך יאמר */ }
  };

  const onOut = async () => {
    try { await api.logout(); } finally {
      setUser(null); setNav(null); setScreen("home");
    }
  };

  const go = (k) => { setScreen(k); setDrawer(false); window.scrollTo(0, 0); };

  if (booting) return <><style>{CSS}</style><div className="wrap" style={{ paddingTop: 40 }}>
    <div className="skel" /><div className="skel" /><div className="skel" />
  </div></>;

  /* ⚠ כשל בטעינת השלד הוא מסך משלו עם «נסה שוב» — ולא מסך
     ריק שנראה כמו מכינה בלי נתונים. */
  if (failed) return <><style>{CSS}</style><div className="wrap" style={{ paddingTop: 48 }}>
    <div className="banner err">לא הצלחנו לטעון את המערכת — {failed}</div>
    <button className="btn" onClick={() => { setBooting(true); boot(); }}>נסה שוב</button>
  </div></>;

  if (!user) return <><style>{CSS}</style>
    <Login brand={brand} notice={notice} onIn={afterLogin} />
  </>;

  const setupNeeded = (brand?.setupNeeded || []).length > 0;
  const mayStudio = nav?.screens?.includes("settings");

  /* ⚠⚠ אפיון חסר + הרשאה = הסטודיו הוא המסך. לא הצעה בצד. */
  if (setupNeeded && mayStudio) {
    return <><style>{CSS}</style>
      <Header brand={brand} user={user} onOut={onOut} />
      <main className="wrap" style={{ padding: "18px 16px 60px" }}>
        <Studio onDone={() => { setBooting(true); boot(); }} />
      </main>
    </>;
  }

  const groups = nav?.groups || [];
  const flat = groups.flatMap((g) => g.items);
  const current = flat.find((i) => i.key === screen);

  return (
    <>
      <style>{CSS}</style>
      <Header brand={brand} user={user} onOut={onOut}
        onMenu={() => setDrawer(!drawer)} />

      {/* ⚠ אם מנהל סיים אפיון אבל משהו עדיין חסר — נאמר, ולא
          נחסם. חסימה על שלב לא-חובה היא בדיוק מה שמתסכל. */}
      {setupNeeded && !mayStudio && (
        <div className="wrap"><div className="banner info" style={{ marginTop: 14 }}>
          האפיון של המכינה עוד לא הושלם. ראש המכינה יכול להשלים אותו בהגדרות.
        </div></div>
      )}

      <main className="wrap" style={{ padding: "18px 16px 60px" }}>
        {user.viewOnly && (
          <div className="banner info">
            החשבון שלך בצפייה בלבד — אפשר לראות הכול ולא לשנות
          </div>
        )}

        {/* ---------- מגירת הניווט ---------- */}
        {(drawer || !current) && (
          <div className="card" style={{ marginBottom: 16 }}>
            {groups.length === 0 && (
              <div className="empty">אין מסכים פתוחים לחשבון הזה.</div>
            )}
            {groups.map((g) => (
              <div className="navg" key={g.module}>
                <h4>{g.title}</h4>
                <div className="chips">
                  {g.items.map((i) => (
                    <button key={i.key}
                      className={"chip " + (screen === i.key ? "on" : "")}
                      onClick={() => go(i.key)}>{i.title}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Screen k={screen} user={user} brand={brand} nav={nav} go={go}
          reboot={() => { setBooting(true); boot(); }} />
      </main>
    </>
  );
}

function Header({ brand, user, onOut, onMenu }) {
  return (
    <header className="top">
      <div className="wrap">
        <div>
          <div className="nm">{brand?.name || "מכינות"}</div>
          <div className="sub">
            {user.name}{user.roleLabels?.length ? " · " + user.roleLabels.join(" · ") : ""}
          </div>
        </div>
        <div className="grow" />
        {onMenu && <button onClick={onMenu}>תפריט</button>}
        <button onClick={onOut}>יציאה</button>
      </div>
    </header>
  );
}

/* ============================================================
   ניתוב המסכים
   ⚠⚠ **מסך שקיים במודול אך טרם נבנה אומר זאת במפורש.**
     אפשרות אחרת הייתה להסתיר אותו — וזו בדיוק הטעות: מנהל
     שהדליק מודול ולא רואה את המסך יסיק שההדלקה לא עבדה.
     מסך שאומר «זה קיים, זה מה שהוא יעשה, הוא עוד לא נבנה»
     הוא אמת, ומסך שנעלם הוא שקר.
   ============================================================ */
function Screen({ k, user, brand, nav, go, reboot }) {
  switch (k) {
    case "home": return <Home user={user} brand={brand} nav={nav} go={go} />;
    case "people": return <People />;
    case "attendance": return <Attendance />;
    case "settings": return <Studio onDone={reboot} embedded />;
    default: return <Placeholder k={k} nav={nav} />;
  }
}
