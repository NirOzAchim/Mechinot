/* ============================================================
   מפת נקודות הקצה
   ------------------------------------------------------------
   ⚠ **נתיב אמיתי לכל נקודת קצה**, ולא `?action=`. הדפוס ההוא
     נולד ממגבלת 12 הפונקציות של Vercel, וכאן אין מגבלה כזו.

   ⚠⚠ **השער של כל שורה גלוי כאן.** `guard(...)` עוטף כל
     handler, והרשימה הזו היא המקום היחיד שבו אפשר לראות
     במבט אחד מי מוגן ומי לא — נקודת קצה בלי `guard` בולטת
     מיד. `npm run check` נכשל על אחת כזו.

   ⚠ **`admin: true` הוא ראש המכינה בלבד.** האפיון משנה את
     האפליקציה כולה, ומי שמדליק בטעות מודול משנה מה שכל
     המכינה רואה.
   ============================================================ */

import { guard } from "../auth.js";
import { rootGuard } from "../root.js";
import * as admin from "./admin.js";
import * as session from "./session.js";
import * as profile from "./profile.js";
import * as people from "./people.js";
import * as attendance from "./attendance.js";
import * as studio from "./studio.js";
import * as nav from "./nav.js";

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

  /* ⚠ הפרופיל הציבורי נקרא **בלי התחברות**: מסך הכניסה צריך
     את שם המכינה ואת הצבעים שלה לפני שיש משתמש. */
  "profile/public": { GET: profile.publicProfile },

  /* ⚠ הניווט נבנה **בשרת** מהמודולים ומהתפקידים, ולא במסך.
     מסך שיחשב את זה בעצמו יתפצל מהשרת ביום שמישהו יכבה
     מודול — והמשתמש יראה לשונית שנפתחת ל-403. */
  "nav": { GET: guard(nav.menu) },

  "profile/full": { GET: guard(profile.fullProfile, { staffOnly: true }) },
  "profile/update": { PUT: guard(profile.update, { screen: "settings" }) },

  /* ---------- הסטודיו ---------- */
  "studio/state": { GET: guard(studio.state, { screen: "settings" }) },
  "studio/save": { PUT: guard(studio.save, { screen: "settings" }) },
  /* ⚠ preview אינו כותב דבר — ולכן הוא POST ולא PUT, והשרת
     מבדיל ביניהם בשמות ולא בדגל. */
  "studio/preview": { POST: guard(studio.preview, { screen: "settings" }) },
  "studio/commit": { POST: guard(studio.commit, { screen: "settings" }) },
  "studio/invite": { POST: guard(studio.invite, { screen: "settings" }) },

  /* ---------- אנשים ---------- */
  "people/list": { GET: guard(people.list, { screen: "people" }) },
  "people/me": { GET: guard(people.myProfile) },

  /* ---------- נוכחות ---------- */
  "attendance/day": { GET: guard(attendance.day, { screen: "attendance" }) },
  "attendance/mark": { POST: guard(attendance.mark, { screen: "attendance" }) },
  "attendance/summary": { GET: guard(attendance.mySummary) },
};

/* ============================================================
   הקונסולה — מפה נפרדת, ובכוונה
   ------------------------------------------------------------
   ⚠⚠ **אלה אינם נתיבים של מכינה.** הם יושבים תחת `/api/admin/…`
     ולא תחת `/m/<slug>/api/…`, ואין להם `tenant` בהקשר כלל.
     ערבוב שתי המפות היה מאפשר לנתיב של מכינה להגיע לפעולה
     של הקונסולה בטעות — וזו הטעות שאי אפשר לתקן אחר כך.

   ⚠ **`rootGuard` ולא `guard`.** שני שערים שונים לשתי זהויות
     שונות; `guard` אינו יודע דבר על מנהל-על, ו-`rootGuard`
     אינו יודע דבר על משתמשי מכינה.
   ============================================================ */
export const ADMIN_ROUTES = {
  /* ⚠ שלושה פתוחים ובכוונה: «האם יש מנהל-על», הקמה ראשונה
     (מ-localhost בלבד), וכניסה. יציאה חייבת להצליח גם למי
     שהעוגייה שלו פגה. */
  "admin/state": { GET: admin.state },
  "admin/setup": { POST: admin.setup },
  "admin/login": { POST: admin.login },
  "admin/logout": { POST: admin.logout },

  "admin/create": { POST: rootGuard(admin.create) },
  "admin/update": { PUT: rootGuard(admin.update) },
  "admin/delete": { POST: rootGuard(admin.remove) },
  "admin/account": { POST: rootGuard(admin.account) },
  "admin/enter": { POST: rootGuard(admin.enter) },
};
