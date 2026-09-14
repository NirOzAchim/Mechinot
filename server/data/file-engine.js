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

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function fileEngine(file) {
  const path = resolve(file);
  let cache = null;
  let stamp = 0;

  const empty = () => ({ seq: 1000, data: {} });

  /* ⚠⚠ **המטמון נבדק מול זמן השינוי של הקובץ.**
     בגרסה הראשונה הוא נטען פעם אחת וחי לנצח, ואז סקריפט
     שכתב לקובץ בזמן שהשרת רץ היה בלתי נראה לחלוטין: המסך
     הציג נתונים שכבר לא קיימים, ואיש לא היה מקשר את זה
     לכלום. זה בדיוק «המטמון יושב בתהליך אחר», ובגרסה
     הגרועה — כי כאן זה אותו קובץ.

     ⚠ אינו פותר ריצה מקבילה של שני **כותבים**; המנוע הזה
       מוצהר כזמני ולא לייצור. */
  function fresh() {
    try { return statSync(path).mtimeMs; } catch { return 0; }
  }

  function load() {
    if (cache && stamp === fresh()) return cache;
    if (!existsSync(path)) { stamp = 0; return (cache = empty()); }
    try {
      cache = JSON.parse(readFileSync(path, "utf8"));
      stamp = fresh();
      if (!cache.data) cache = empty();
    } catch {
      /* ⚠ קובץ פגום אינו «מסד ריק». זריקה כאן עדיפה על התחלה
         נקייה שמוחקת נתונים בלי לומר מילה. */
      throw new Error(`קובץ הנתונים פגום: ${path}`);
    }
    return cache;
  }

  /* ⚠⚠⚠ **המצב לכתיבה מגיע כארגומנט, ולא מ-`load()`.**
     בגרסה הראשונה `save()` קרא ל-`load()` תמיד, ו-`reset()`
     שהחליף את המטמון באובייקט ריק **נמחק על ידי הקריאה
     הזו**: בתהליך טרי `stamp` הוא 0, `load()` החליט שהקובץ
     השתנה מבחוץ, קרא אותו מהדיסק חזרה לתוך המטמון — וכתב
     את כל הנתונים הישנים בחזרה.

     התוצאה הייתה `--force` ש**מדפיס «אופס» ואינו מאפס**:
     זריעה חוזרת הכפילה 240 שורות תורנות ו-115 מפגשים, בלי
     שום שגיאה ובלי שום סימן. סקריפט שיוצא 0 אינו עדות לכך
     שהוא עבד. */
  function save(state) {
    const s = state || load();
    mkdirSync(dirname(path), { recursive: true });
    const tmp = path + ".tmp";
    writeFileSync(tmp, JSON.stringify(s, null, 2), "utf8");
    renameSync(tmp, path);
    /* ⚠ אחרי כתיבה — לעדכן את החותמת, אחרת הקריאה הבאה
       תחשוב שהקובץ השתנה מבחוץ ותטען אותו מחדש בכל פעם. */
    stamp = fresh();
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
      /* ⚠ מועבר במפורש — ראו ההערה על `save`. */
      save(cache);
    },
  };
}
