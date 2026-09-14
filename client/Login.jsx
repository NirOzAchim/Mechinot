/* ============================================================
   מסך הכניסה
   ------------------------------------------------------------
   ⚠ **דלת אחת.** שדה אחד לשם משתמש **או** אימייל. אדם שאיפס
     סיסמה דרך המייל מנסה להיכנס עם אותה כתובת — זה מה שהיה
     מול העיניים שלו לפני שנייה. אין התנגשות: שם משתמש אינו
     יכול להכיל `@`.

   ⚠ **הודעה אחת לכל כישלון.** ההפרדה בין «אין משתמש» ל«סיסמה
     שגויה» הופכת את הטופס למנוע בדיקה של מי רשום.

   ⚠ **המכינה מזוהה לפני הכניסה** — שם, צבעים ואות ראשונה.
     מסך כניסה גנרי אינו נראה כמו המערכת של המכינה שלך.
   ============================================================ */

import React, { useState } from "react";
import { api } from "./api.js";
import * as MI from "./icons.jsx";
import { initials } from "./ui.jsx";

export function Login({ brand, notice, onIn }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  /* ⚠ נופל לשם שבמרשם לפני שהאפיון נשמר — ראו
     server/routes/profile.js. */
  const name = brand?.name || brand?.registryName || "מכינות";

  const submit = async (e) => {
    e.preventDefault();
    if (busy || !user.trim() || !pass) return;
    setBusy(true); setErr(null);
    try {
      await api.login(user.trim(), pass);
      const { user: me } = await api.me();
      onIn(me);
    } catch (e2) {
      setErr(e2.offline ? "אין חיבור לשרת" : e2.message);
      setPass("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100%", display: "grid", placeItems: "center",
      padding: "var(--s5) var(--s4) var(--s7)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* ---------- זהות המכינה ----------
            ⚠ שם, צבעים ואות ראשונה **לפני** הכניסה. מסך כניסה
            גנרי אינו נראה כמו המערכת של המכינה שלך, והצבעים
            כבר הוחלו מהאפיון. */}
        <div style={{ textAlign: "center", marginBottom: "var(--s5)" }}>
          <div className="ava lg" style={{ margin: "0 auto var(--s3)",
            background: "var(--accent)", color: "var(--a-ink)",
            boxShadow: "0 10px 30px -12px var(--a-glow)" }}>
            {initials(brand?.shortName || name)}
          </div>
          <h1 style={{ marginBottom: 2 }}>{name}</h1>
          <p className="muted">{brand?.tagline || "מערכת הניהול"}</p>
        </div>

        {/* ⚠ האפיון שטרם הושלם נאמר במפורש. מסך כניסה בלי שם
            מכינה נראה שבור, והסיבה האמיתית היא שלב שלא נעשה. */}
        {brand?.setupNeeded?.length > 0 && (
          <div className="banner warn">
            <MI.Warn size={18} />
            <div>האפיון טרם הושלם — חסרים: {brand.setupNeeded.join(" · ")}</div>
          </div>
        )}

        {notice && <div className="banner info"><MI.Info size={18} /><div>{notice}</div></div>}
        {err && <div className="banner err"><MI.Warn size={18} /><div>{err}</div></div>}

        <form className="card lift" onSubmit={submit}>
          <label className="field">
            <span>שם משתמש או אימייל</span>
            <input id="login-user" value={user} autoComplete="username"
              onChange={(e) => setUser(e.target.value)} autoFocus />
          </label>
          <label className="field">
            <span>סיסמה</span>
            <input id="login-pass" type="password" value={pass}
              autoComplete="current-password"
              onChange={(e) => setPass(e.target.value)} />
          </label>
          <button className="btn block lg" disabled={busy || !user.trim() || !pass}>
            {busy ? "רגע…" : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
