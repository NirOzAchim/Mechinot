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

export function Login({ brand, notice, onIn }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const name = brand?.name || "מכינות";
  const initial = (brand?.shortName || name).trim().charAt(0) || "מ";

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
    <div className="login">
      <div className="box">
        <div className="brand">
          <div className="mark">{initial}</div>
          <h1>{name}</h1>
          <p>{brand?.tagline || "מערכת הניהול"}</p>
        </div>

        {/* ⚠ האפיון שטרם הושלם נאמר במפורש. מסך כניסה בלי שם
            מכינה נראה שבור, והסיבה האמיתית היא שלב שלא נעשה. */}
        {brand?.setupNeeded?.length > 0 && (
          <div className="banner info">
            האפיון טרם הושלם — חסרים: {brand.setupNeeded.join(" · ")}
          </div>
        )}

        {notice && <div className="banner info">{notice}</div>}
        {err && <div className="banner err">{err}</div>}

        <form className="card lift" onSubmit={submit}>
          <label className="field">
            <span>שם משתמש או אימייל</span>
            <input
              id="login-user" value={user} autoComplete="username"
              onChange={(e) => setUser(e.target.value)} autoFocus
            />
          </label>
          <label className="field">
            <span>סיסמה</span>
            <input
              id="login-pass" type="password" value={pass}
              autoComplete="current-password"
              onChange={(e) => setPass(e.target.value)}
            />
          </label>
          <button className="btn block" disabled={busy || !user.trim() || !pass}>
            {busy ? "רגע…" : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
