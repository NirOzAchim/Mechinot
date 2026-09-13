/* ============================================================
   הניווט — נבנה בשרת
   ------------------------------------------------------------
   ⚠⚠ **המסך אינו מחשב מה מותר לו.** הניווט נגזר מהמודולים
     הדלוקים ומהתפקידים של המשתמש, בדיוק מאותה פונקציה שהשרת
     אוכף בה את הגישה. שני חישובים מקבילים מתפצלים ביום
     שמישהו מכבה מודול — והמשתמש רואה לשונית שנפתחת ל-403.

     זה הלקח של «מסך של בעל תפקיד זהה למסך של המנהל»: שם זה
     נשבר פעם אחת ובאופן שקט, כי שתי מעטפות בנו את הניווט
     בנפרד ושתיהן «עבדו».

   ⚠ **קבוצות הניווט נגזרות מהמודול**, ולכן מודול חדש מופיע
     בתפריט מעצמו — בלי לגעת כאן ובלי לגעת במסך.
   ============================================================ */

import { MODULE_CATALOG, activeModules, activeScreens } from "../../core/catalog.js";
import { screensFor } from "../../core/vocab.js";

/* ⚠ סדר הקבוצות. מודול שאינו ברשימה יורד **לסוף** ואינו
   קופץ לראש — `indexOf` על מערך סגור מחזיר ‎-1‎ למה שאינו בו,
   וזו בדיוק התקלה שהעלימה קטגוריה חדשה לראש המיון במערכת
   הקודמת. */
const ORDER = [
  "people", "attendance", "requests", "lessons", "ratings", "teams",
  "inventory", "menu", "budget", "chores", "faults", "safety",
  "leadweek", "laundry", "board", "army", "projects", "content",
  "reports", "texts",
];
const rank = (m) => {
  const i = ORDER.indexOf(m);
  return i === -1 ? ORDER.length : i;
};

export async function menu({ profile, user }) {
  const mods = profile.modules || {};
  const allowed = screensFor(profile, user.roles);
  const all = allowed.includes("*");

  const may = (s) => {
    if (s.staff && !user.isStaff) return false;
    if (s.admin && !all) return false;
    return all || allowed.includes(s.key);
  };

  const groups = [];
  for (const m of activeModules(mods).sort((a, b) => rank(a) - rank(b))) {
    const def = MODULE_CATALOG[m];
    const items = (def.screens || []).filter(may)
      .map((s) => ({ key: s.key, title: s.title, module: m }));
    if (items.length) groups.push({ module: m, title: def.title, items });
  }

  return {
    groups,
    /* ⚠ רשימה שטוחה לצד הקבוצות — המסך צריך את שתיהן, ושתיהן
       נגזרות כאן כדי שלא יתפצלו. */
    screens: groups.flatMap((g) => g.items.map((i) => i.key)),
    modules: activeModules(mods),
    /* ⚠ מה **קיים במערכת** מול מה **שאני רואה**. ההפרש הוא
       בדיוק מה שמסך ההרשאות צריך להציג. */
    exists: activeScreens(mods).map((s) => s.key),
  };
}
