/* ============================================================
   שכבת הגישה לנתונים — הממשק, לא המנוע
   ------------------------------------------------------------
   ⚠⚠ **החוזה הוא פעלים, לא שאילתות.** במערכת הקודמת התפר מול
     המחסן היה `gql(מחרוזת GraphQL)`, ולכן אי אפשר היה לשים
     מאחוריו שום דבר אחר בלי לכתוב מנוע GraphQL. כאן החוזה
     הוא `list · get · create · update · remove`, ומאחוריו
     אפשר לשים קובץ, SQLite או Postgres בלי שאף מסלול יידע.

   ⚠ **הוולידציה יושבת כאן ולא במנוע.** היא נגזרת מהסכימה,
     והיא חייבת לחול זהה בכל מנוע — אחרת החלפת מנוע משנה
     בשקט מה מותר לכתוב.

   ⚠ **שדה שאינו בסכימה נדחה ברעש.** «התעלמות שקטה» פירושה
     שדה שנשלח, נראה כאילו נשמר, ואינו קיים — וזו בדיוק
     משפחת הבאגים שאי אפשר לאתר.
   ============================================================ */

import { ENTITIES, ENUMS } from "../../core/schema.js";

export class DataError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** בדיקת ערך יחיד מול הגדרת השדה. מחזיר את הערך המנורמל. */
function coerce(entity, field, def, value) {
  const where = `${entity}.${field}`;

  if (value === null || value === undefined || value === "") {
    if (def.required) throw new DataError(`${where}: שדה חובה`);
    /* ⚠ **ריק הוא `null` ולא מחרוזת ריקה ולא 0.** «לא יודעים»
       ו«אפס» הם שני דברים, וערבוב שלהם מייצר מספרים שקריים
       בכל מסך שמסכם. */
    return null;
  }

  switch (def.type) {
    case "id":
    case "text":
    case "longtext":
      return String(value);

    case "int": {
      const n = Number(value);
      if (!Number.isInteger(n)) throw new DataError(`${where}: אינו מספר שלם`);
      if (def.min != null && n < def.min) throw new DataError(`${where}: קטן מ-${def.min}`);
      if (def.max != null && n > def.max) throw new DataError(`${where}: גדול מ-${def.max}`);
      return n;
    }

    case "decimal": {
      const n = Number(value);
      /* ⚠ `Number.isFinite` ולא `!isNaN`: `Number("שלוש")` הוא
         NaN, וכל השוואה מולו היא `false` — כלומר האכיפה
         מתבטלת בשקט. זה קרה במערכת הקודמת שלוש פעמים. */
      if (!Number.isFinite(n)) throw new DataError(`${where}: אינו מספר`);
      return n;
    }

    case "bool":
      return value === true || value === "true" || value === 1 || value === "1";

    case "date":
      if (!DATE_RE.test(String(value))) throw new DataError(`${where}: תאריך אינו תקין`);
      return String(value);

    case "time":
      if (!TIME_RE.test(String(value))) throw new DataError(`${where}: שעה אינה תקינה`);
      return String(value);

    case "datetime":
      return new Date(value).toISOString();

    case "enum": {
      const allowed = ENUMS[def.enum];
      if (!allowed) throw new DataError(`${where}: רשימת ערכים לא מוכרת (${def.enum})`);
      if (!allowed.includes(value)) {
        throw new DataError(`${where}: «${value}» אינו אחד מ-${allowed.join(" · ")}`);
      }
      return value;
    }

    case "ref":
      return String(value);

    case "refs":
      if (!Array.isArray(value)) throw new DataError(`${where}: נדרשת רשימה`);
      return value.map(String);

    case "json":
      return value;

    default:
      throw new DataError(`${where}: טיפוס לא מוכר (${def.type})`);
  }
}

/** בדיקת שורה שלמה. `partial` — לעדכון, שבו לא כל שדה נשלח. */
export function validateRow(entity, fields, { partial = false } = {}) {
  const ent = ENTITIES[entity];
  if (!ent) throw new DataError(`ישות לא מוכרת: ${entity}`, 404);

  const out = {};
  for (const [k, v] of Object.entries(fields)) {
    if (k === "id") continue;
    const def = ent.fields[k];
    if (!def) throw new DataError(`${entity}: אין שדה בשם «${k}»`);
    out[k] = coerce(entity, k, def, v);
  }

  if (!partial) {
    for (const [k, def] of Object.entries(ent.fields)) {
      if (k === "id" || k in out) continue;
      if (def.required) throw new DataError(`${entity}.${k}: שדה חובה`);
      out[k] = def.default !== undefined ? def.default : null;
    }
  }
  return out;
}

/* ------------------------------------------------------------
   סינון
   ⚠ סט אופרטורים סגור. מנוע SQL יתרגם אותם ל-WHERE; מנוע
     הקובץ מסנן בזיכרון. שניהם חייבים להסכים על **המשמעות**.
   ------------------------------------------------------------ */
const OPS = {
  eq: (a, b) => a === b,
  ne: (a, b) => a !== b,
  lt: (a, b) => a < b,
  lte: (a, b) => a <= b,
  gt: (a, b) => a > b,
  gte: (a, b) => a >= b,
  in: (a, b) => Array.isArray(b) && b.includes(a),
  has: (a, b) => Array.isArray(a) && a.includes(b),
  like: (a, b) => String(a ?? "").includes(String(b)),
};

export function matches(row, where = {}) {
  for (const [field, cond] of Object.entries(where)) {
    const val = row[field];
    if (cond === null || typeof cond !== "object" || Array.isArray(cond)) {
      if (!OPS.eq(val, cond)) return false;
      continue;
    }
    for (const [op, arg] of Object.entries(cond)) {
      const fn = OPS[op];
      if (!fn) throw new DataError(`אופרטור לא מוכר: ${op}`);
      if (!fn(val, arg)) return false;
    }
  }
  return true;
}

/* ============================================================
   החנות
   ============================================================ */
export function createStore(engine) {
  const check = (entity) => {
    if (!ENTITIES[entity]) throw new DataError(`ישות לא מוכרת: ${entity}`, 404);
  };

  return {
    engine: engine.name,

    async list(entity, { where = {}, order, desc = false, limit } = {}) {
      check(entity);
      let rows = await engine.all(entity);
      rows = rows.filter((r) => matches(r, where));
      if (order) {
        rows.sort((a, b) => {
          const x = a[order], y = b[order];
          if (x === y) return 0;
          if (x === null || x === undefined) return 1;
          if (y === null || y === undefined) return -1;
          return (x < y ? -1 : 1) * (desc ? -1 : 1);
        });
      }
      return limit ? rows.slice(0, limit) : rows;
    },

    async get(entity, id) {
      check(entity);
      if (!id) return null;
      return (await engine.all(entity)).find((r) => r.id === String(id)) || null;
    },

    /** השורה הראשונה שמתאימה, או null */
    async find(entity, where) {
      const [row] = await this.list(entity, { where, limit: 1 });
      return row || null;
    },

    async create(entity, fields) {
      check(entity);
      const row = validateRow(entity, fields);
      await this.assertUnique(entity, row, null);
      return engine.insert(entity, row);
    },

    async update(entity, id, fields) {
      check(entity);
      const existing = await this.get(entity, id);
      if (!existing) throw new DataError("השורה אינה נמצאת", 404);
      const patch = validateRow(entity, fields, { partial: true });
      await this.assertUnique(entity, patch, String(id));
      return engine.update(entity, String(id), patch);
    },

    async remove(entity, id) {
      check(entity);
      const existing = await this.get(entity, id);
      if (!existing) throw new DataError("השורה אינה נמצאת", 404);
      await engine.remove(entity, String(id));
      return { id: String(id) };
    },

    /** ⚠ ייחודיות נאכפת כאן, כי מנוע קובץ אינו יודע לאכוף אותה. */
    async assertUnique(entity, row, selfId) {
      const ent = ENTITIES[entity];
      for (const [k, def] of Object.entries(ent.fields)) {
        if (!def.unique || !(k in row) || row[k] === null) continue;
        const hit = await this.find(entity, { [k]: row[k] });
        if (hit && hit.id !== selfId) {
          throw new DataError(`${entity}.${k}: הערך כבר קיים`, 409);
        }
      }
    },

    /** יצירה או עדכון לפי שדה מזהה — לזריעה ולייבוא */
    async upsert(entity, keyField, fields) {
      const existing = await this.find(entity, { [keyField]: fields[keyField] });
      return existing
        ? this.update(entity, existing.id, fields)
        : this.create(entity, fields);
    },

    async count(entity, where = {}) {
      return (await this.list(entity, { where })).length;
    },

    reset: () => engine.reset(),
  };
}
