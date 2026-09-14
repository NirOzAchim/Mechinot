/* ============================================================
   עזר לכלים — איזו מכינה, ואיפה הנתונים שלה
   ------------------------------------------------------------
   ⚠⚠ **כלי שאינו אומר על איזו מכינה הוא עובד הוא כלי מסוכן.**
     `start.cmd` הריץ `npm run seed` בשקט כשחסרה `.data`,
     ומי שציפה למכינה אחת קיבל אחרת. מכאן והלאה כל כלי מדפיס
     את ה-slug **לפני** שהוא נוגע בדבר.

   ⚠ **כלי שכותב על מכינה קיימת אומר זאת ודורש `--force`.**
     מחיקת שנה של נתונים בטעות הקלדה היא בדיוק מה שאין ממנו
     «בטל».
   ============================================================ */

import { createMechina, getMechina, tenant, slugProblem } from "../server/tenants.js";

export function args(argv = process.argv.slice(2)) {
  const flag = (k, d = undefined) => {
    const i = argv.indexOf("--" + k);
    return i > -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d;
  };
  const has = (k) => argv.includes("--" + k);
  const positional = argv.filter((a, i) =>
    !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--")));
  return { flag, has, positional, argv };
}

/**
 * מוודא שיש מכינה ב-slug הזה, ומחזיר את אובייקט המכינה.
 *
 * ⚠ **אינו דורס בשקט.** מכינה קיימת דורשת `--force`, ואז
 *   המסד שלה מאופס במפורש ובהודעה.
 */
export async function ensureTenant({ slug, name, preset = "premil", force = false }) {
  const problem = slugProblem(slug);
  if (problem) {
    console.error(`\n  [x] ${problem}\n`);
    process.exit(1);
  }

  const existing = getMechina(slug);
  if (existing && !force) {
    console.error("");
    console.error(`  [x] A mechina with the slug "${slug}" already exists (${existing.name}).`);
    console.error("      To overwrite it and lose its data:   --force");
    console.error("      To open another one instead:         --slug <other-slug>");
    console.error("");
    process.exit(1);
  }

  if (!existing) createMechina({ slug, name, preset });
  const t = tenant(slug);

  if (existing && force) {
    await t.db.reset();
    t.writeDelta({});
    t.invalidateProfile();
    console.log(`  [!] "${slug}" was reset before writing.`);
  }

  console.log(`  -> writing to mechina "${slug}"  (${t.paths.db})`);
  return t;
}
