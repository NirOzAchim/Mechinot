/* ============================================================
   האתר — דף הנחיתה וההרשמה
   ------------------------------------------------------------
   ⚠⚠⚠ **זו הדלת היחידה שנפתחת החוצה.** כל השאר במוצר יושב
     מאחורי סשן; כאן מגיע אדם שאינו מכיר אותנו, לרוב מקישור
     שמישהו שלח לו, לרוב בטלפון, ולרוב עם שלוש שניות של
     סבלנות. מה שהדף הזה צריך לעשות הוא לומר **מה זה** ולתת
     **להתחיל** — ותו לא.

   ⚠⚠ **ההרשמה מקימה מכינה אמיתית ומכניסה פנימה.** לא «נשלחה
     בקשה», לא «ניצור קשר». מי שממלא את הטופס נוחת בתוך
     האפליקציה שלו, מחובר, עם האשף פתוח. זה כל ההבדל בין
     מוצר שאפשר למכור לבין דף שאוסף לידים.

   ⚠ **והמספרים בדף נגזרים מהשרת ולא מוקלדים.** «14 מודולים»
     שנשאר בטקסט אחרי שנוסף החמישה־עשר הוא בדיוק מה שגורם
     לאדם להפסיק להאמין לדף. ראו server/routes/public.js.
   ============================================================ */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { SITE_CSS } from "./site-styles.js";
import { site } from "./api.js";
import * as MI from "./icons.jsx";

/* ⚠ הגיליון מוזרק פעם אחת. שלושת המוצרים לעולם אינם על אותו
   דף, וכל אחד מזריק את שלו — ראו ההערה ב-site-styles.js. */
function useSheet() {
  useEffect(() => {
    if (document.getElementById("site-css")) return;
    const s = document.createElement("style");
    s.id = "site-css";
    s.textContent = SITE_CSS;
    document.head.appendChild(s);

    if (!document.getElementById("site-font")) {
      const l = document.createElement("link");
      l.id = "site-font";
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&display=swap";
      document.head.appendChild(l);
    }
    document.documentElement.lang = "he";
    document.documentElement.dir = "rtl";
  }, []);
}

export function Site() {
  useSheet();
  const [page, setPage] = useState(
    () => (window.location.pathname === "/signup" ? "signup" : "home"));

  /* ⚠ כפתור «חזור» של הדפדפן עובד — דף נחיתה שבו הוא אינו
     עובד נראה שבור למי שהגיע אליו מחיפוש. */
  useEffect(() => {
    const onPop = () =>
      setPage(window.location.pathname === "/signup" ? "signup" : "home");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const go = useCallback((next) => {
    window.history.pushState({}, "", next === "signup" ? "/signup" : "/");
    setPage(next);
    window.scrollTo(0, 0);
  }, []);

  return page === "signup" ? <Signup onBack={() => go("home")} /> : <Home go={go} />;
}

/* ============================================================
   הרצועה העליונה
   ============================================================ */
function Nav({ go, minimal = false }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={"st-nav " + (solid ? "on" : "")}>
      <div className="st-wrap">
        <a className="st-logo" href="/" onClick={(e) => { e.preventDefault(); go("home"); }}>
          <i>מ</i>מכינות
        </a>
        {!minimal && (
          <div className="st-links st-grow">
            <a href="#what">מה זה</a>
            <a href="#own">מה אתם שולטים בו</a>
            <a href="#how">איך מתחילים</a>
            <a href="#q">שאלות</a>
          </div>
        )}
        <div className="st-row" style={{ marginInlineStart: minimal ? "auto" : 0 }}>
          <a className="st-btn sm ghost" href="/console">כניסת מנהל</a>
          {!minimal && (
            <button className="st-btn sm" onClick={() => go("signup")}>
              פתיחת מכינה
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ============================================================
   דף הנחיתה
   ============================================================ */
function Home({ go }) {
  const [plans, setPlans] = useState(null);

  /* ⚠ כישלון אינו מפיל את הדף — הוא מוריד מקטע אחד. דף נחיתה
     שמציג שגיאה במקום תוכן הוא דף שמאבד את מי שהגיע אליו. */
  useEffect(() => { site.plans().then(setPlans).catch(() => {}); }, []);

  return (
    <>
      <Nav go={go} />

      {/* ---------- הגיבור ---------- */}
      <header className="st-hero">
        <div className="st-wrap">
          <div>
            <div className="st-eyebrow st-in">
              <MI.Sparkle size={15} />
              נבנה במכינה, לא במשרד
            </div>
            <h1 className="st-h1 st-in">
              המכינה שלכם,<br />
              <em>באפליקציה משלכם</em>
            </h1>
            <p className="st-sub st-in">
              נוכחות, בקשות יציאה, תורנויות, לו״ז ושיעורים — הכול במקום אחד,
              בשמות שאתם קוראים להם, ובלי לחכות למפתח.
            </p>
            <div className="st-cta">
              <button className="st-btn lg" onClick={() => go("signup")}>
                פתיחת מכינה
                <MI.Enter size={19} />
              </button>
              <a className="st-btn lg ghost" href="#what">לראות מה יש בפנים</a>
            </div>
            <p className="st-fine">
              נפתחת בשתי דקות · <b>בלי כרטיס אשראי</b> · אפשר למחוק הכול בלחיצה
            </p>
          </div>

          <Shot />
        </div>
      </header>

      {/* ---------- רצועת המספרים ----------
          ⚠ נגזרים מהשרת. מספר שנשאר בטקסט אחרי שהמוצר השתנה
            הוא מה שגורם להפסיק להאמין לדף. */}
      <div className="st-strip">
        <div className="st-wrap">
          <div>
            <b>{plans ? plans.counts.modules : "—"}</b>
            <span>מודולים ביום הראשון</span>
          </div>
          <div>
            <b>{plans ? plans.counts.roles : "—"}</b>
            <span>תפקידים מוכנים לעריכה</span>
          </div>
          <div>
            <b>{plans ? plans.counts.vocab : "—"}</b>
            <span>מונחים שאתם קובעים</span>
          </div>
          <div>
            <b>0</b>
            <span>שורות קוד שתכתבו</span>
          </div>
        </div>
      </div>

      {/* ---------- מה יש בפנים ---------- */}
      <section className="st-sec" id="what">
        <div className="st-wrap">
          <div className="st-head">
            <div className="st-tag">מה יש בפנים</div>
            <h2 className="st-h2">לא עוד גיליון, ולא עוד קבוצת וואטסאפ</h2>
            <p className="st-lead">
              המערכת נבנתה במכינה אמיתית ורצה בה שנה שלמה — כל מסך כאן קיים
              מפני שמישהו היה צריך אותו ביום שלישי בבוקר, לא מפני שהוא נשמע טוב
              במצגת.
            </p>
          </div>

          <div className="st-grid">
            <Feature icon={MI.Check} title="נוכחות שלא משקרת">
              «טרם סומן» ו«נעדר» הם שני דברים. אחוז מוצג רק כשיש מספיק ימים
              מאחוריו — כי «0% נוכחות» בתחילת שנה הוא מספר נכון ושקרי.
            </Feature>
            <Feature icon={MI.Plane} title="בקשות יציאה בשני שלבים">
              המדריך ממליץ, ראש המכינה מכריע, והחניך רואה תשובה אחת. המכסה
              נספרת בשעות ולא בתאריכים — יציאה של 24 שעות היא יום אחד.
            </Feature>
            <Feature icon={MI.Broom} title="תורנויות הוגנות">
              טבלת מעקב שמראה מי מאחור, והמלצה על מי הבא בתור — הצעה, לא
              החלטה. אב הבית יודע דברים שהמערכת לא יודעת.
            </Feature>
            <Feature icon={MI.Book} title="לו״ז ושיעורים">
              מה מתקיים היום, מה טרם דווח, ומה לא יתקיים — ושלושתם מצבים
              שונים. חוות דעת על מרצים, ודירוג מהחניכים עצמם.
            </Feature>
            <Feature icon={MI.Box} title="מלאי, קניות ותפריט">
              כמה יש, כמה צריך להיות, ומה חסר. הכמות היא טקסט חופשי — «40
              חבילות של 10» — כי ככה סופרים במחסן אמיתי.
            </Feature>
            <Feature icon={MI.Shield} title="הרשאות שאפשר להסביר">
              כל תפקיד אומר בדיוק אילו מסכים הוא פותח, והמסך מראה לכם את זה
              כטבלה. בלי «למה הוא רואה את זה».
            </Feature>
          </div>

          {plans?.included?.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <p className="st-lead" style={{ marginBottom: 16 }}>
                וכל אלה דלוקים אצלכם ביום הראשון — ואת מה שלא רלוונטי לכם
                פשוט מכבים:
              </p>
              <div className="st-mods">
                {plans.included.map((m) => (
                  <span className={"st-mod " + (m.core ? "core" : "")} key={m.key}>
                    <i />{m.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---------- מה אתם שולטים בו ----------
          ⚠⚠ זה המקטע שמוכר. כל מכינה שראתה מערכת אחרת שואלת
            «ואם אצלנו קוראים לזה אחרת» — והתשובה כאן היא
            שהמערכת נבנתה סביב השאלה הזו. */}
      <section className="st-sec alt" id="own">
        <div className="st-wrap">
          <div className="st-head">
            <div className="st-tag">מה אתם שולטים בו</div>
            <h2 className="st-h2">אצלכם קוראים לזה אחרת? זה בדיוק העניין</h2>
            <p className="st-lead">
              רוב המערכות נבנו למקום אחד ואז נמכרו לשאר. כאן ההפך: מה שאפשר
              להגדיר — מוגדר על ידכם, מתוך האפליקציה, בלי לפתוח קריאה ובלי
              לחכות לגרסה.
            </p>
          </div>

          <div className="st-grid">
            <Feature icon={MI.Person} title="השמות שלכם">
              «חניך» או «תלמיד». «ועדה» או «צוות». «סמסטר» או «זמן». המערכת
              שומרת מפתח קבוע ומציגה את מה שכתבתם — <b>שינוי שם אינו נוגע באף
              נתון היסטורי</b>.
            </Feature>
            <Feature icon={MI.Shield} title="התפקידים שלכם">
              יוצרים תפקיד שלא קיים בשום מערכת אחרת, קובעים לו שם ואילו מסכים
              הוא פותח, ומוחקים אותו. גם «סגנית», גם «גזבר», גם «חובש».
            </Feature>
            <Feature icon={MI.Grid} title="המסכים שלכם">
              אין תורנויות? מכבים. אין מכולה? מכבים. מה שכבוי <b>אינו קיים</b> —
              לא בתפריט, לא בחיפוש, ולא כטבלה שמישהו ימצא בטעות.
            </Feature>
            <Feature icon={MI.Sparkle} title="הצבעים שלכם">
              הצבע הראשי, הרקע, הכרטיסים — נבחרים במסך אחד ונראים מיד, לפני
              שמירה. האפליקציה נראית כמו המכינה שלכם, לא כמו שלנו.
            </Feature>
            <Feature icon={MI.Doc} title="הנהלים שלכם">
              כל טקסט במערכת — נהלים, הסברים, ברכה במסך הבית — נערך מתוך
              האפליקציה על ידי ראש המכינה. <b>בלי דיפלוי.</b>
            </Feature>
            <Feature icon={MI.Upload} title="הנתונים שלכם">
              גוררים קובץ אקסל, טבלה מוורד, או מדביקים רשימה מוואטסאפ. תמיד
              רואים בדיוק מה ייכתב <b>לפני</b> שנכתב, ומה שלא נקלט מוצג עם
              הסיבה.
            </Feature>
          </div>
        </div>
      </section>

      {/* ---------- איך מתחילים ---------- */}
      <section className="st-sec" id="how">
        <div className="st-wrap">
          <div className="st-head">
            <div className="st-tag">איך מתחילים</div>
            <h2 className="st-h2">שלושה צעדים, ואתם בפנים</h2>
          </div>
          <div className="st-steps">
            <div className="st-step">
              <h3>פותחים מכינה</h3>
              <p>
                שם, כתובת וחשבון לראש המכינה. בסוף הטופס אתם כבר בתוך
                האפליקציה — לא ממתינים לאישור ולא מקבלים מייל.
              </p>
            </div>
            <div className="st-step">
              <h3>עוברים על האשף</h3>
              <p>
                הכול כבר מלא מראש מתבנית של מכינה קדם-צבאית. משנים רק את מה
                ששלכם. שלושה שלבי חובה, וכרבע שעה.
              </p>
            </div>
            <div className="st-step">
              <h3>מכניסים את המחזור</h3>
              <p>
                גוררים את הקובץ שכבר יש לכם. מכאן זו האפליקציה של המכינה, וכל
                שינוי בה נעשה מתוכה.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- שאלות ---------- */}
      <section className="st-sec alt" id="q">
        <div className="st-wrap" style={{ maxWidth: 820 }}>
          <div className="st-head">
            <div className="st-tag">שאלות</div>
            <h2 className="st-h2">מה שבאמת שואלים</h2>
          </div>
          <Q q="הנתונים שלנו מעורבבים עם מכינות אחרות?">
            לא. לכל מכינה כתובת משלה, מסד משלה ותיקייה משלה. אין טבלה משותפת
            שבה שורה אחת שייכת לשתי מכינות — וזו החלטה שנעשתה ביום הראשון,
            כי אי אפשר לתקן אותה אחר כך.
          </Q>
          <Q q="מה קורה למידע של קטינים?">
            המערכת קוראת רק את מה שהיא צריכה. כתובת מלאה, שמות הורים, קופת
            חולים ובעיה רפואית — <b>אינם נקראים, אינם מוחזרים ואינם מוצגים</b>,
            גם כשהם קיימים בקובץ שהעליתם. יש מסך שמראה לכל חניך בדיוק אילו
            נתונים יש עליו ומי רואה אותם.
          </Q>
          <Q q="אנחנו לא מנהלים ככה. נצטרך לשנות את איך שאנחנו עובדים?">
            זו השאלה שהמוצר נבנה סביבה. השמות, התפקידים, המסכים, סוגי הימים
            והנהלים — כולם שלכם, ונערכים מתוך האפליקציה. מה שלא מתאים לכם,
            מכבים.
          </Q>
          <Q q="ואם נרצה לצאת?">
            הנתונים שלכם ומיוצאים לאקסל. מכינה נמחקת בלחיצה, ומחיקה היא מחיקה.
          </Q>
          <Q q="כמה זה עולה?">
            בשלב הזה המוצר בהרצה עם מכינות ראשונות, והפתיחה חינם. מי שנכנס
            עכשיו מקבל את המחיר של מי שנכנס ראשון — נדבר על זה כשתראו שזה
            עובד אצלכם.
          </Q>
        </div>
      </section>

      {/* ---------- סיום ---------- */}
      <section className="st-end">
        <div className="st-wrap">
          <h2>המכינה שלכם יכולה להיות באוויר בעוד שתי דקות</h2>
          <p>
            פותחים, מסתכלים, ומחליטים. אם זה לא מתאים — מוחקים, ולא נשאר כלום.
          </p>
          <button className="st-btn lg" onClick={() => go("signup")}>
            פתיחת מכינה
            <MI.Enter size={19} />
          </button>
        </div>
      </section>

      <footer className="st-foot">
        <div className="st-wrap">
          <span className="st-grow">מכינות · מערכת ניהול למכינות קדם-צבאיות</span>
          <a href="/console">כניסת מנהל</a>
        </div>
      </footer>
    </>
  );
}

const Feature = ({ icon: Icon, title, children }) => (
  <div className="st-card">
    <div className="ic"><Icon size={22} /></div>
    <h3>{title}</h3>
    <p>{children}</p>
  </div>
);

const Q = ({ q, children }) => (
  <div className="st-q">
    <h3>{q}</h3>
    <p>{children}</p>
  </div>
);

/* ============================================================
   התצוגה — מצוירת ולא מצולמת
   ⚠ צילום מסך מתיישן ברגע שהמוצר משתנה, ואז הדף מוכר משהו
     שאינו קיים. מה שמצויר כאן הוא המבנה, והוא נשאר נכון.
   ============================================================ */
const Shot = () => (
  <div className="st-shot st-in">
    <div className="st-shot-bar">
      <i /><i /><i />
      <span>/m/sde-boker/</span>
    </div>
    <div className="st-shot-body">
      <div className="st-shot-side">
        <b>אנשים</b>
        <u className="on"><i />מסך הבית</u>
        <u><i />חניכים</u>
        <u><i />בעלי תפקידים</u>
        <b style={{ paddingTop: 10 }}>היום־יום</b>
        <u><i />סימון נוכחות</u>
        <u><i />בקשות יציאה</u>
        <u><i />תורנויות</u>
        <u><i />הלו״ז</u>
      </div>
      <div className="st-shot-main">
        <div className="st-shot-h">בוקר טוב, דני</div>
        <div className="st-band">
          <div><b className="g">31</b><span>נוכחים</span></div>
          <div><b className="r">2</b><span>נעדרים</span></div>
          <div><b className="n">4</b><span>ממתינות לך</span></div>
        </div>
        <div className="st-list">
          <div className="st-li"><i />
            <b>בקשות יציאה ממתינות להכרעתך</b>
            <span className="a">4</span>
          </div>
          <div className="st-li"><i />
            <b>הנוכחות של היום סומנה</b>
            <span className="g">✓</span>
          </div>
          <div className="st-li"><i />
            <b>תורנות מטבח — אורי, נועם, גיא</b>
            <span>היום</span>
          </div>
          <div className="st-li"><i />
            <b>מחשבת ישראל · 10:00</b>
            <span>טרם דווח</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ============================================================
   ההרשמה
   ------------------------------------------------------------
   ⚠⚠ **מסך אחד ולא אשף.** טופס בחמישה שלבים לפתיחת חשבון הוא
     חמישה מקומות לנטוש. האשף האמיתי מתחיל **אחרי** שנכנסים,
     כשכבר יש מה לאפיין.

   ⚠⚠ **הכתובת מוצעת מהשם ונשארת ניתנת לעריכה.** היא נשארת על
     הניירת של המכינה לשנים, ולכן היא מוצגת גדול ונבדקת תוך
     כדי הקלדה — ולא מתגלה כתפוסה אחרי שהכול מולא.
   ============================================================ */
function Signup({ onBack }) {
  const [f, setF] = useState({
    name: "", slug: "", headName: "", email: "", username: "", password: "",
    website: "",   /* ⚠ הפיתיון — ראו server/routes/public.js */
  });
  const [slugState, setSlug] = useState(null);   /* {ok, why} מהשרת */
  const [touchedSlug, setTouched] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const started = useRef(Date.now());
  const seq = useRef(0);

  const set = (k) => (e) => { setF((p) => ({ ...p, [k]: e.target.value })); setErr(null); };

  /* ⚠⚠ **הבדיקה היא מול השרת, ובהשהיה.** בדיקה בכל תו היא
     בקשה לכל תו; בדיקה במסך בלבד אינה יודעת מה תפוס.
     ⚠ ותשובה שאיחרה נזרקת — בקשה על «sde» עשויה לחזור אחרי
       זו של «sde-boker», והמסך היה מציג תשובה על מחרוזת
       שכבר לא שם. */
  useEffect(() => {
    const name = f.name.trim();
    const slug = f.slug.trim();
    if (!name && !slug) { setSlug(null); return; }

    const id = ++seq.current;
    const t = setTimeout(() => {
      site.slug({ name, slug: touchedSlug ? slug : "" })
        .then((r) => {
          if (id !== seq.current) return;
          setSlug(r);
          /* ⚠ ההצעה נכתבת לשדה רק כל עוד המשתמש לא נגע בו.
             דריסה של מה שהוא הקליד היא בדיוק הרגע שבו אנשים
             מפסיקים לסמוך על טופס. */
          if (!touchedSlug && r.slug) setF((p) => ({ ...p, slug: r.slug }));
        })
        .catch(() => { if (id === seq.current) setSlug(null); });
    }, 320);
    return () => clearTimeout(t);
  }, [f.name, f.slug, touchedSlug]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      const out = await site.signup({
        ...f,
        elapsedMs: Date.now() - started.current,
      });
      setDone(out);
      /* ⚠ **המתנה קצרה ואז ניווט מלא.** `location.assign` ולא
         ניווט פנימי: המכינה היא אפליקציה אחרת עם גיליון אחר,
         והיא חייבת להיטען מחדש. השנייה הזו היא מה שמאפשר
         לקרוא «נכנסת» לפני שהמסך מתחלף. */
      setTimeout(() => window.location.assign(out.url), 1400);
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  };

  const ready = f.name.trim() && f.headName.trim() && f.email.trim() &&
    f.username.trim() && f.password && slugState?.ok;

  if (done) {
    return (
      <>
        <Nav go={onBack} minimal />
        <section className="st-sec">
          <div className="st-wrap">
            <div className="st-form" style={{ textAlign: "center" }}>
              <div className="ic" style={{
                width: 62, height: 62, borderRadius: 20, margin: "0 auto 20px",
                display: "grid", placeItems: "center",
                background: "rgba(27,122,75,.12)", color: "var(--ok)",
              }}>
                <MI.Check size={30} />
              </div>
              <h2 className="st-h2" style={{ fontSize: 28 }}>המכינה נפתחה</h2>
              <p className="st-lead" style={{ fontSize: 16.5 }}>
                נכנסת כראש המכינה. מעבירים אותך לאפליקציה שלך…
              </p>
              <div className="st-url" style={{ marginTop: 22, justifyContent: "center" }}>
                <em>{window.location.host}</em><b>/m/{done.slug}/</b>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Nav go={onBack} minimal />
      <section className="st-sec" style={{ paddingTop: 48 }}>
        <div className="st-wrap">
          <div className="st-head" style={{ textAlign: "center", margin: "0 auto 34px" }}>
            <h1 className="st-h2">פותחים מכינה</h1>
            <p className="st-lead">
              שתי דקות, ואתם בפנים. אפשר לשנות אחר כך כל דבר חוץ מהכתובת.
            </p>
          </div>

          <form className="st-form" onSubmit={submit} noValidate>
            {err && (
              <div className="st-note bad">
                <MI.Warn size={18} />
                <div>{err}</div>
              </div>
            )}

            <label className="st-f">
              <span>שם המכינה</span>
              <input value={f.name} onChange={set("name")} autoFocus
                placeholder="מכינת שדה בוקר" autoComplete="organization" />
            </label>

            {/* ⚠ הכתובת — מוצגת גדול כי היא נשארת לשנים */}
            <label className="st-f" style={{ marginBottom: 8 }}>
              <span>
                הכתובת שלכם <u>— באנגלית, ואי אפשר לשנות אותה אחר כך</u>
              </span>
              <div className="st-url" style={{ marginBottom: 8 }}>
                <em>{window.location.host}/m/</em>
                <b>{f.slug || "…"}</b>
                <em>/</em>
              </div>
              <input className="st-mono" value={f.slug} dir="ltr"
                onChange={(e) => { setTouched(true); set("slug")(e); }}
                placeholder="sde-boker" spellCheck="false" />
            </label>
            {slugState && (
              slugState.ok
                ? <div className="st-ok" style={{ marginBottom: 20 }}>הכתובת פנויה</div>
                : <div className="st-err" style={{ marginBottom: 20 }}>{slugState.why}</div>
            )}

            <div className="st-two">
              <label className="st-f">
                <span>שם ראש המכינה</span>
                <input value={f.headName} onChange={set("headName")}
                  placeholder="דני שרעבי" autoComplete="name" />
              </label>
              <label className="st-f">
                <span>אימייל</span>
                <input value={f.email} onChange={set("email")} type="email" dir="ltr"
                  placeholder="danny@example.org" autoComplete="email" />
              </label>
            </div>
            <p className="st-hint" style={{ marginTop: -10, marginBottom: 20 }}>
              האימייל הוא הדרך היחידה לשחזר את החשבון הזה. אין «שכחתי סיסמה»
              בלעדיו.
            </p>

            <div className="st-two">
              <label className="st-f">
                <span>שם משתמש</span>
                <input value={f.username} onChange={set("username")} dir="ltr"
                  placeholder="danny" autoComplete="username" spellCheck="false" />
              </label>
              <label className="st-f">
                <span>סיסמה</span>
                <input value={f.password} onChange={set("password")} type="password"
                  autoComplete="new-password" placeholder="לפחות 8 תווים" />
              </label>
            </div>

            {/* ⚠ הפיתיון — מוסתר מהעין ומקורא המסך */}
            <input className="st-pot" tabIndex={-1} autoComplete="off"
              aria-hidden="true" value={f.website} onChange={set("website")}
              name="website" />

            <button className="st-btn block lg" disabled={!ready || busy}>
              {busy ? "פותח…" : "פתיחת המכינה"}
            </button>

            <p className="st-hint" style={{ textAlign: "center", marginTop: 16 }}>
              בלי כרטיס אשראי. אפשר למחוק את המכינה בלחיצה, ואז לא נשאר כלום.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
