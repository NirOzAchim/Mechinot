/* ============================================================
   מנוע אחסון זמני — קובץ JSON אחד
   ------------------------------------------------------------
   ⚠ **זמני ובמכוון.** ההחלטה על מסד הנתונים נדחתה, והיא לא
     צריכה לחסום שום שלב אחר. המנוע הזה מממש את אותו חוזה
     שכל מנוע אחר יממש, ולכן החלפתו היא קובץ אחד.

   ⚠ **מה שהוא לא**: אין טרנזקציות, אין נעילה, אין אינדקסים,
     ואין שני תהליכים בו-זמנית. הוא מתאים לפיתוח ולהדגמה,
     **ולא לייצור** — וזה נאמר כאן כדי שאיש לא יגלה את זה
     בדרך הקשה.

   ⚠ **הכתיבה אטומית**: קובץ זמני ואז `rename`. קריסה באמצע
     כתיבה משאירה את הקובץ הקודם שלם במקום קובץ חצי-כתוב,
     שהוא המצב שאי אפשר להתאושש ממנו.
   ============================================================ */

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function fileEngine(file) {
  const path = resolve(file);
  let cache = null;

  const empty = () => ({ seq: 1000, data: {} });

  function load() {
    if (cache) return cache;
    if (!existsSync(path)) return (cache = empty());
    try {
      cache = JSON.parse(readFileSync(path, "utf8"));
      if (!cache.data) cache = empty();
    } catch {
      /* ⚠ קובץ פגום אינו «מסד ריק». זריקה כאן עדיפה על התחלה
         נקייה שמוחקת נתונים בלי לומר מילה. */
      throw new Error(`קובץ הנתונים פגום: ${path}`);
    }
    return cache;
  }

  function save() {
    const s = load();
    mkdirSync(dirname(path), { recursive: true });
    const tmp = path + ".tmp";
    writeFileSync(tmp, JSON.stringify(s, null, 2), "utf8");
    renameSync(tmp, path);
  }

  const table = (entity) => {
    const s = load();
    if (!s.data[entity]) s.data[entity] = {};
    return s.data[entity];
  };

  return {
    name: "file",
    path,

    async all(entity) {
      /* עותק, כדי שמי שמקבל שורה לא יוכל לשנות את המצב בטעות */
      return Object.values(table(entity)).map((r) => ({ ...r }));
    },

    async insert(entity, row) {
      const s = load();
      const id = String(++s.seq);
      const full = { id, ...row };
      table(entity)[id] = full;
      save();
      return { ...full };
    },

    async update(entity, id, patch) {
      const t = table(entity);
      if (!t[id]) return null;
      t[id] = { ...t[id], ...patch, id };
      save();
      return { ...t[id] };
    },

    async remove(entity, id) {
      delete table(entity)[id];
      save();
    },

    async reset() {
      cache = empty();
      save();
    },
  };
}
