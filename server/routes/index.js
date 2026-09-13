/* ============================================================
   מפת נקודות הקצה
   ------------------------------------------------------------
   ⚠ **נתיב אמיתי לכל נקודת קצה**, ולא `?action=`. הדפוס ההוא
     נולד ממגבלת 12 הפונקציות של Vercel, וכאן אין מגבלה כזו.

   ⚠ **השער בכל שורה גלוי כאן.** `guard(...)` עוטף כל handler,
     והרשימה הזו היא המקום היחיד שבו אפשר לראות במבט אחד מי
     מוגן ומי לא. נקודת קצה בלי `guard` בולטת מיד.
   ============================================================ */

import { guard } from "../auth.js";
import * as session from "./session.js";
import * as profile from "./profile.js";
import * as people from "./people.js";
import * as attendance from "./attendance.js";

export const ROUTES = {
  /* ⚠ אלה **אינם** עטופים, ובכוונה: אי אפשר להתחבר כשמחייבים
     להיות מחובר, ו-logout חייב להצליח גם למי שהעוגייה שלו
     פגה — אחרת הוא נשאר תקוע עם עוגייה מתה. */
  "session/login": { POST: session.login },
  "session/logout": { POST: session.logout },

  /* ⚠ `me` פתוח ומחזיר `user: null` למי שאינו מחובר. הוא
     השאלה «האם אני מחובר», ו-401 עליו הופך כל טעינת דף
     לשגיאה בקונסול. */
  "session/me": { GET: session.me },

  /* ⚠ הפרופיל נקרא **בלי התחברות**: מסך הכניסה צריך את שם
     המכינה ואת הצבעים שלה לפני שיש משתמש. המיפוי כאן מפורש
     ומחזיר את החלק הציבורי בלבד. */
  "profile/public": { GET: profile.publicProfile },
  "profile/full": { GET: guard(profile.fullProfile, { staffOnly: true }) },
  "profile/update": { PUT: guard(profile.update, { screen: "settings" }) },

  "people/list": { GET: guard(people.list, { screen: "people" }) },
  "people/me": { GET: guard(people.myProfile) },

  "attendance/day": { GET: guard(attendance.day, { screen: "attendance" }) },
  "attendance/mark": { POST: guard(attendance.mark, { screen: "attendance" }) },
};
