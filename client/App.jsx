/* ============================================================
   שלד האפליקציה
   ------------------------------------------------------------
   ⚠⚠ **הניווט מגיע מהשרת ואינו מחושב כאן.** `GET nav` בונה
     אותו מאותה פונקציה שהשרת אוכף בה את הגישה. שני חישובים
     מקבילים מתפצלים ביום שמישהו מכבה מודול, והמשתמש רואה
     לשונית שנפתחת ל-403.

   ⚠⚠ **אפיון חסר פותח את הסטודיו ולא את מסך הבית.** מנהל
     שנכנס למכינה שטרם אופיינה צריך לראות את מה שחסר ואת
     הדרך להשלים אותו — ולא מסך בית ריק שנראה כמו תקלה.

   ⚠ **כשל טעינה נראה אחרת מ«אין נתונים»**, בכל מסך.
   ============================================================ */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { api, setUnauthorizedHandler } from "./api.js";
import { CSS, applyTheme, FONT_HREF } from "./styles.js";
import { Toasts, Failed, Loading, Avatar, initials } from "./ui.jsx";
import * as MI from "./icons.jsx";
import { screenIcon, moduleIcon } from "./icons.jsx";

import { Login } from "./Login.jsx";
import { Home } from "./Home.jsx";
import { People } from "./People.jsx";
import { Attendance } from "./Attendance.jsx";
import { Requests } from "./Requests.jsx";
import { Studio } from "./Studio.jsx";
import { Rules, Texts } from "./Texts.jsx";
import { Me } from "./Me.jsx";
import { Roles } from "./Roles.jsx";
import { Year } from "./Year.jsx";
import { Faults } from "./Faults.jsx";
import { Board, Quotes } from "./Board.jsx";
import { Placeholder } from "./Placeholder.jsx";

/* ⚠⚠ **הפונט נטען פעם אחת, בקוד ולא ב-index.html.** אותו
   `index.html` משרת את הקונסולה ואת כל המכינות, ותג בראשו
   היה נטען גם למי שאינו צריך אותו — אבל הסיבה האמיתית היא
   אחרת: הגרסה הראשונה **לא טענה את הפונט בכלל**, רק ביקשה
   אותו בשם, וכל המערכת רצה על Segoe UI. מה שיושב בקוד לצד
   ה-`font-family` אי אפשר לשכוח. */
function useFont() {
  useEffect(() => {
    if (document.getElementById("mx-font")) return;
    const l = document.createElement("link");
    l.id = "mx-font"; l.rel = "stylesheet"; l.href = FONT_HREF;
    document.head.appendChild(l);
  }, []);
}

/* ⚠ ארבעת היעדים היומיים ברצועה התחתונה, **שונים לצוות
   ולחניך**: הצוות פותח בקשות וחניכים, החניך פותח את הלו״ז
   ואת מה שביקש. רצועה אחת לשניהם הייתה נכונה לאיש מהם. */
const TAB_STAFF = ["home", "requests", "people", "attendance"];
const TAB_STUDENT = ["home", "agenda", "requests", "chores"];

export function App() {
  useFont();

  const [brand, setBrand] = useState(null);
  const [user, setUser] = useState(null);
  const [nav, setNav] = useState(null);
  const [booting, setBooting] = useState(true);
  const [failed, setFailed] = useState(null);
  const [notice, setNotice] = useState(null);
  const [screen, setScreen] = useState(
    () => new URLSearchParams(window.location.search).get("screen") || "home");
  const [drawer, setDrawer] = useState(false);

  const boot = useCallback(async () => {
    setFailed(null);
    try {
      const b = await api.publicProfile();
      setBrand(b);
      applyTheme(b.colors);
      document.title = b.name || b.registryName || "מכינות";
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

  const go = useCallback((k) => {
    setScreen(k); setDrawer(false); window.scrollTo(0, 0);
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

  const groups = nav?.groups || [];
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const current = flat.find((i) => i.key === screen);

  if (booting) return <Frame><div className="wrap" style={{ paddingTop: 40 }}>
    <Loading rows={4} />
  </div></Frame>;

  /* ⚠ כשל בטעינת השלד הוא מסך משלו עם «נסה שוב» — ולא מסך
     ריק שנראה כמו מכינה בלי נתונים. */
  if (failed) return <Frame><div className="wrap narrow" style={{ paddingTop: 48 }}>
    <Failed error={failed} onRetry={() => { setBooting(true); boot(); }} />
  </div></Frame>;

  if (!user) return <Frame>
    <Login brand={brand} notice={notice} onIn={afterLogin} />
  </Frame>;

  const setupNeeded = (brand?.setupNeeded || []).length > 0;
  const maySettings = nav?.screens?.includes("settings");

  /* ⚠⚠ אפיון חסר + הרשאה = הסטודיו הוא המסך. לא הצעה בצד. */
  if (setupNeeded && maySettings) {
    return <Frame>
      <Toasts>
        <div className="app">
          <Bar brand={brand} user={user} onOut={onOut} />
          <main className="main"><div className="wrap">
            <RootBanner user={user} />
            <Studio onDone={() => { setBooting(true); boot(); }} />
          </div></main>
        </div>
      </Toasts>
    </Frame>;
  }

  const tabKeys = (user.isStaff ? TAB_STAFF : TAB_STUDENT)
    .filter((k) => flat.some((i) => i.key === k));

  return (
    <Frame>
      <Toasts>
        <div className={"app " + (groups.length ? "has-side" : "")}>
          <Side brand={brand} user={user} groups={groups} screen={screen}
            go={go} onOut={onOut} />

          <Bar brand={brand} user={user} onOut={onOut}
            title={current?.title}
            onMenu={groups.length ? () => setDrawer(true) : null} />

          <main className="main">
            <div className="wrap">
              <RootBanner user={user} />

              {user.viewOnly && (
                <div className="banner info">
                  <MI.Info size={18} />
                  <div>החשבון שלך בצפייה בלבד — אפשר לראות הכול ולא לשנות.</div>
                </div>
              )}

              {/* ⚠ אפיון חסר למי שאינו רשאי לתקן — נאמר, ולא
                  נחסם. חסימה על שלב לא-חובה היא בדיוק מה
                  שמתסכל. */}
              {setupNeeded && !maySettings && (
                <div className="banner warn">
                  <MI.Warn size={18} />
                  <div>האפיון של המכינה עוד לא הושלם. ראש המכינה יכול להשלים אותו בהגדרות.</div>
                </div>
              )}

              <Screen k={screen} user={user} brand={brand} nav={nav} go={go}
                reboot={() => { setBooting(true); boot(); }} />
            </div>
          </main>

          {tabKeys.length > 1 && (
            <nav className="tabs">
              {tabKeys.map((k) => {
                const it = flat.find((i) => i.key === k);
                const Icon = screenIcon(k);
                return (
                  <button key={k} className={"tab " + (screen === k ? "on" : "")}
                    onClick={() => go(k)}>
                    <Icon size={21} />
                    <span>{it.title}</span>
                  </button>
                );
              })}
              <button className={"tab " + (drawer ? "on" : "")}
                onClick={() => setDrawer(true)}>
                <MI.Grid size={21} /><span>עוד</span>
              </button>
            </nav>
          )}

          {drawer && (
            <Drawer groups={groups} screen={screen} go={go}
              onClose={() => setDrawer(false)} />
          )}
        </div>
      </Toasts>
    </Frame>
  );
}

/* ============================================================
   ⚠ המעטפת מזריקה את ה-CSS פעם אחת
   ------------------------------------------------------------
   הגרסה הראשונה הזריקה אותו בחמישה מקומות — כניסה, הקמה,
   שלד — ומי שמוסיף מסך ומעדכן ארבעה מהם מקבל מסך שנראה
   תקין בכניסה ושבור אחריה.
   ============================================================ */
const Frame = ({ children }) => (<><style>{CSS}</style>{children}</>);

/* ⚠⚠ מי שנכנס כמנהל-על חייב לראות את זה **בכל מסך**. בלי
   הרצועה הוא ישכח שהוא בו, ויערוך נתונים אמיתיים בטוח שהוא
   בדמו. */
const RootBanner = ({ user }) => user.isRoot ? (
  <div className="banner err">
    <MI.Shield size={18} />
    <div>אתה כאן כ<b>מנהל-על</b> ולא כאיש צוות של המכינה. כל שינוי נוגע
      בנתונים אמיתיים, והכניסה נרשמה ביומן.</div>
  </div>
) : null;

/* ============================================================
   הכותרת העליונה
   ============================================================ */
function Bar({ brand, user, onOut, onMenu, title }) {
  return (
    <header className="top">
      <div className="top-in">
        {/* ⚠ **מוסתר כשהסרגל נראה.** כפתור תפריט לצד תפריט
            פתוח הוא שני ניווטים לאותו דבר. */}
        {onMenu && (
          <button className="iconbtn hide-lg" onClick={onMenu} aria-label="תפריט"
            style={{ marginInlineStart: -6 }}>
            <MI.Menu size={21} />
          </button>
        )}
        <div className="grow">
          {/* ⚠ במסך רחב הכותרת היא שם המסך, ושם המכינה יושב
              בסרגל. שני מקומות שאומרים את אותו שם הם בזבוז
              של השורה היחידה שתמיד נראית. */}
          <div className="nm trunc">{title || brand?.name || brand?.registryName || "מכינות"}</div>
          <div className="sub trunc">
            {user.name}{user.roleLabels?.length ? " · " + user.roleLabels.join(" · ") : ""}
          </div>
        </div>
        {/* ⚠ מנהל-על אינו «יוצא» — הוא חוזר לקונסולה. כפתור
            יציאה היה מנקה עוגייה שאינה שלו ומשאיר אותו תקוע. */}
        {user.isRoot
          ? <button className="btn ghost sm" onClick={() => { window.location.href = "/console"; }}>
              <MI.Leave size={16} />לקונסולה
            </button>
          : <button className="iconbtn" onClick={onOut} aria-label="יציאה">
              <MI.Logout size={20} />
            </button>}
      </div>
    </header>
  );
}

/* ============================================================
   סרגל הצד — מסך רחב
   ============================================================ */
function Side({ brand, user, groups, screen, go, onOut }) {
  if (!groups.length) return null;
  const name = brand?.name || brand?.registryName || "מכינות";
  return (
    <aside className="side">
      <div className="side-top">
        <Avatar name={name} />
        <div className="grow" style={{ lineHeight: 1.25 }}>
          <div style={{ fontWeight: 800, letterSpacing: "-.02em" }} className="trunc">{name}</div>
          <div className="tiny trunc">{brand?.tagline || "מערכת הניהול"}</div>
        </div>
      </div>
      <div className="side-nav">
        <NavGroups groups={groups} screen={screen} go={go} />
      </div>
      <div className="side-foot">
        <button className="navlink" onClick={onOut}>
          <MI.Logout size={18} />
          <span className="grow">{user.isRoot ? "חזרה לקונסולה" : "יציאה"}</span>
        </button>
      </div>
    </aside>
  );
}

const NavGroups = ({ groups, screen, go }) => (
  <>
    {groups.map((g) => {
      const GIcon = moduleIcon(g.module);
      return (
        <div className="navgroup" key={g.module}>
          <h4><GIcon size={13} />{g.title}</h4>
          {g.items.map((i) => {
            const Icon = screenIcon(i.key);
            return (
              <button key={i.key} className={"navlink " + (screen === i.key ? "on" : "")}
                onClick={() => go(i.key)}>
                <Icon size={18} />
                <span className="grow trunc">{i.title}</span>
              </button>
            );
          })}
        </div>
      );
    })}
  </>
);

/* ============================================================
   המגירה — טלפון
   ⚠ **המפה המלאה, ולא רק מה שלא נכנס לרצועה.** מגירה
     שמציגה "את השאר" מכריחה לזכור מה כבר ברצועה.
   ============================================================ */
function Drawer({ groups, screen, go, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true"
        style={{ maxHeight: "82vh", overflowY: "auto" }}>
        <div className="row" style={{ marginBottom: 14 }}>
          <h2 className="grow">כל המסכים</h2>
          <button className="iconbtn" onClick={onClose} aria-label="סגירה">
            <MI.Close size={19} />
          </button>
        </div>
        <NavGroups groups={groups} screen={screen} go={go} />
      </div>
    </div>
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
    case "requests": return <Requests />;
    case "me": return <Me />;
    case "roles": return <Roles />;
    case "attendance-year": return <Year />;
    case "settings": return <Studio onDone={reboot} embedded />;
    /* ⚠ שני מסכי התקלות הם **אותו רכיב**, והשרת מכריע
       מה נפתח בו. שני רכיבים לאותו דבר הם בדיוק הבאג שבו
       אב הבית נחת על מסך הקריאה ולא היה לו כפתור עריכה. */
    case "faults":
    case "faults-admin": return <Faults />;
    case "board": return <Board />;
    case "quotes": return <Quotes />;
    /* ⚠ שני מסכים שמוזנים מ-`core/content.js` — הנהלים לכולם,
       והמפה למי שעורך. ראו client/Texts.jsx. */
    case "rules": return <Rules />;
    case "texts": return <Texts />;
    default: return <Placeholder k={k} nav={nav} />;
  }
}
