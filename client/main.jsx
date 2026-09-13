/* ============================================================
   נקודת הכניסה — שלוש כתובות, שני מוצרים בחבילה אחת
   ------------------------------------------------------------
     /console        הקונסולה — כל המכינות
     /m/<slug>/      האפליקציה של מכינה
     /               מפנה לקונסולה

   ⚠⚠ **הבחירה נעשית מהכתובת בלבד.** אין דגל, אין משתנה סביבה
     ואין «מצב». מי שפותח `/m/x/` מקבל את האפליקציה של x, ולא
     משנה מה קרה בלשונית לפני כן.

   ⚠ **השורש אינו מציג רשימת מכינות.** דף שמונה את הלקוחות
     שלי לכל מי שמגיע לכתובת הוא דליפה שאין לה שום תועלת.
     הוא מפנה לקונסולה, שמבקשת סיסמה.

   ⚠ **ושתי חבילות CSS לעולם אינן על אותו דף** — `CSS` של
     האפליקציה ו-`CONSOLE_CSS` מגדירים שניהם `:root` ו-`body`,
     והאחרון שנטען היה מנצח. הבחירה כאן היא בין **רכיבים**,
     וכל אחד מהם מזריק את שלו.
   ============================================================ */

import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { Console } from "./Console.jsx";
import { currentSlug } from "./api.js";

function Root() {
  const path = window.location.pathname;

  if (currentSlug()) return <App />;
  if (path === "/console" || path.startsWith("/console/")) return <Console />;

  /* ⚠ הפניה ולא רינדור: כך הכתובת בשורת הכתובות נכונה,
     והרענון הבא לא מחזיר אותנו לכאן. */
  window.location.replace("/console");
  return null;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode><Root /></React.StrictMode>
);
