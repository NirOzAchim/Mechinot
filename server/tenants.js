/* ============================================================
   המרשם — מי המכינות, ואיפה הנתונים של כל אחת
   ------------------------------------------------------------
   ⚠⚠ **זו הנקודה שבה המוצר מפסיק להיות פריסה אחת.** עד כאן
     היה `.data/db.json` אחד, וכל הקוד הניח אותו. מרגע שיש
     קונסולה שמנהלת **כל** המכינות, כל מצב גלובלי הוא באג
     שמחכה: מטמון פרופיל ברמת המודול משמעו שמכינה א׳ רואה
     את השם של מכינה ב׳, ואיש לא יבין למה.

     לכן: **אין כאן שום מצב ברמת המודול חוץ מהמרשם עצמו.**
     המסד, הדלתא, המטמון והפרופיל — כולם תלויים באובייקט
     המכינה, ומי שאין לו אובייקט מכינה אין לו נתונים.

   ⚠⚠ **המכינה נגזרת מהנתיב ולא מגוף הבקשה.** `/m/<slug>/api/…`.
     הדפוס הזה חוזר בכל המערכת הקודמת («התחום נלקח מהפריט
     ולא מהבקשה»), ומאותה סיבה: מה שהדפדפן מצהיר עליו אינו
     הרשאה.

   ⚠ **תיקיה לכל מכינה, ולא טבלה משותפת עם עמודת `tenant`.**
     טבלה משותפת פירושה שכל שאילתה בכל מסך חייבת לזכור לסנן,
     ומי שיוסיף את הבאה לא יזכור. תיקיה נפרדת היא הפרדה
     שאי אפשר לשכוח.

   ⚠ **ומה שזה לא**: אין כאן איזון עומסים, גיבוי או מסד
     אמיתי. המנוע עדיין קובץ JSON לכל מכינה. מה שכן יש הוא
     **הגבול** — ולכן החלפת המנוע היא עדיין קובץ אחד.
   ============================================================ */

import {
  readFileSync, writeFileSync, existsSync, mkdirSync,
  renameSync, readdirSync, statSync,
} from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { fileEngine } from "./data/file-engine.js";
import { createStore } from "./data/store.js";
import PREMIL from "../core/presets/premil.js";
import { resolveProfile, validateProfile } from "../core/profile.js";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");

export const DATA_DIR = process.env.DATA_DIR || resolve(ROOT, ".data");
const REGISTRY = join(DATA_DIR, "registry.json");
const MECHINOT_DIR = join(DATA_DIR, "m");

const PRESETS = { premil: PREMIL };
export const PRESET_NAMES = Object.keys(PRESETS);

/* ⚠ **התבנית נגזרת מהדלתא ואינה מוקלדת בכל קורא.** שלושה
   מסלולים כתבו `resolveProfile(PREMIL, …)` ישירות; זה נכון
   כל עוד יש תבנית אחת, ושקט לגמרי ברגע שתהיה שנייה —
   מכינה על תבנית «ישיבתית» הייתה נבדקת מול הקדם-צבאית
   ועוברת, ואז מקבלת מסכים שאינם שלה. */
export const presetOf = (delta) => PRESETS[delta?.preset] || PREMIL;

/* ============================================================
   ה-slug
   ------------------------------------------------------------
   ⚠⚠ **ה-slug הוא הנתיב, שם התיקיה ומפתח הסשן — ולכן הוא
     לטיניות בלבד ואינו ניתן לשינוי.** שם המכינה («מכינת
     מיתרים לכיש») משתנה מתי שרוצים; ה-slug לא. זה בדיוק
     הכלל של «`slug` נשמר, `label` מוצג», והפעם ברמת המוצר
     כולו.

   ⚠ **ושמות שמורים נחסמים.** מכינה בשם `api`, `console` או
     `m` הייתה מתנגשת בנתיב עצמו — כלומר יוצרת מכינה שאי
     אפשר להיכנס אליה, בלי שום שגיאה.
   ============================================================ */
export const SLUG_RE = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/;
const RESERVED = new Set([
  "api", "console", "admin", "m", "assets", "static", "public",
  "root", "new", "login", "logout", "health", "www",
]);

export function slugProblem(slug) {
  const s = String(slug || "");
  if (!s) return "חסר מזהה למכינה";
  if (!SLUG_RE.test(s)) {
    return "המזהה חייב להיות באנגלית קטנה, 3–32 תווים, ולהתחיל באות (מותר מקף באמצע)";
  }
  if (RESERVED.has(s)) return `«${s}» שמור למערכת ואי אפשר להשתמש בו`;
  return null;
}

/** הצעה ל-slug משם עברי — נקודת פתיחה בלבד, המנהל עורך. */
/* ============================================================
   ⚠⚠⚠ תעתיק עברי — בלעדיו אין הצעה לאף מכינה
   ------------------------------------------------------------
   הגרסה הראשונה זרקה כל תו שאינו לטיני, ולכן **כל שם עברי
   החזיר מחרוזת ריקה** — כלומר ההצעה עבדה בדיוק על השמות
   שאין להם. נתפס בהרשמה: «מכינת שדה בוקר» הציעה כלום, וראש
   מכינה שרק רצה להירשם נאלץ להמציא כתובת באנגלית ברגע שבו
   הוא הכי קרוב לוותר.

   ⚠⚠ **עברית אינה מנוקדת, ולכן תעתיק אות-אות אינו יכול
     להיות טוב.** «שדה» הוא sdh בלי תנועות, ואף אחד לא יקרא
     את זה. לכן שתי שכבות:

       1. **מילון מילים** — יש כשישים מכינות בארץ, והשמות
          שלהן חוזרים על אוצר מילים קטן: שדה · בית · עין ·
          אורות · רוח · יהודה · ישראל · נגב · גליל. מילה
          שבמילון מקבלת את הכתיב המקובל שלה, לא ניחוש.
       2. **נפילה אות-אות** לכל השאר, עם שתי היוריסטיקות
          שעושות את רוב ההבדל: ה׳ בסוף מילה היא a, ובין שני
          עיצורים נשתלת e.

   ⚠ **וזה תעתיק ולא תרגום.** «שדה בוקר» הוא sde-boker ולא
     morning-field. מה שצריך מהכתובת הוא שתיקרא ותיזכר.

   ⚠⚠ **וההצעה היא הצעה.** המסך מציג אותה בשדה שאפשר לערוך,
     ומי שלא אוהב אותה מקליד את שלו. תעתיק שנכפה היה מייצר
     כתובות שאיש לא בחר — וכתובת היא מה שנשאר על הניירת של
     המכינה לשנים.
   ============================================================ */
const HE_WORDS = {
  "שדה": "sde", "בוקר": "boker", "בית": "beit", "עין": "ein",
  "ראש": "rosh", "אורות": "orot", "רוח": "ruach", "נחשון": "nachshon",
  "יהודה": "yehuda", "ישראל": "israel", "צבאית": "tzvait", "הצבאית": "tzvait",
  "בני": "bnei", "הר": "har", "גליל": "galil", "נגב": "negev",
  "ים": "yam", "עוז": "oz", "ניר": "nir", "אמונה": "emuna",
  "תורה": "tora", "ארץ": "eretz", "מעלה": "maale", "במעלה": "bemaale",
  "דרך": "derech", "הדרך": "haderech", "לכיש": "lachish", "מיתרים": "meitarim",
  "קשת": "keshet", "צהלי": "tzahali", "עלי": "eli", "פרת": "prat",
  "יעקב": "yaakov", "אליהו": "eliyahu", "נריה": "neria", "עצמונה": "atzmona",
  "כרמים": "kramim", "מצפה": "mitzpe", "רמון": "ramon", "ערד": "arad",
  "חדרה": "hadera", "יובל": "yuval", "אלון": "alon", "תלם": "telem",
  "חברותא": "chevruta", "נוה": "neve", "נווה": "neve", "כפר": "kfar",
  "משואות": "masuot", "יצחק": "yitzchak", "עמיחי": "amichai", "רעות": "reut",
  "אדרת": "aderet", "צפון": "tzafon", "דרום": "darom", "מערב": "maarav",
  "מזרח": "mizrach", "חורב": "chorev", "סיני": "sinai", "תבור": "tavor",
};

const HE_MAP = {
  "א": "", "ב": "b", "ג": "g", "ד": "d", "ה": "h", "ו": "o", "ז": "z",
  "ח": "ch", "ט": "t", "י": "i", "כ": "k", "ך": "ch", "ל": "l", "מ": "m",
  "ם": "m", "נ": "n", "ן": "n", "ס": "s", "ע": "", "פ": "p", "ף": "f",
  "צ": "tz", "ץ": "tz", "ק": "k", "ר": "r", "ש": "sh", "ת": "t",
};

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

function translit(word) {
  const parts = [];
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const last = i === word.length - 1;

    /* ⚠ ה׳ בסוף מילה היא תנועה ולא עיצור: «יהודה» הוא yehuda
       ולא yehudh, ו«שדה» הוא sde ולא shdh. */
    if (ch === "ה" && last) { parts.push("a"); continue; }
    /* ⚠ ו׳ בתחילת מילה נשמעת v ובאמצעה o — בלי ההבחנה «ורד»
       הופך ל-ored ו«ניר עוז» ל-nir-vz. */
    if (ch === "ו") { parts.push(i === 0 ? "v" : "o"); continue; }
    /* ⚠ יו״ד כפולה היא i אחת — «בנייה» ולא bniiah. */
    if (ch === "י" && word[i + 1] === "י") { parts.push("i"); i++; continue; }
    /* ⚠ א׳ ו-ע׳ בתחילת מילה **נושאות תנועה** ואינן שקטות:
       «עליון» הוא elyon ולא lion, ו«אדם» הוא adam ולא dm.
       באמצע מילה הן כן נבלעות, ושם השתלת e עושה את העבודה. */
    if (i === 0 && (ch === "א" || ch === "ע")) {
      if (word[1] !== "ו" && word[1] !== "י") parts.push(ch === "א" ? "a" : "e");
      continue;
    }
    const t = HE_MAP[ch];
    if (t === undefined) continue;
    if (t) parts.push(t);
  }

  /* ⚠⚠ **e בין שני עיצורים.** בלי זה «פרת» הוא prt ו«נחשון»
     הוא nchshn — מחרוזות שאיש אינו יכול להקריא בטלפון, וזו
     בדיוק הבדיקה שכתובת צריכה לעבור. */
  let out = "";
  for (let i = 0; i < parts.length; i++) {
    const cur = parts[i], next = parts[i + 1];
    out += cur;
    const curIsVowel = VOWELS.has(cur[cur.length - 1]);
    const nextIsVowel = next && VOWELS.has(next[0]);
    if (next && !curIsVowel && !nextIsVowel && i < parts.length - 2) out += "e";
  }
  return out;
}

export function suggestSlug(name) {
  const raw = String(name || "")
    /* ⚠ «מכינת» יורדת — כל מכינה נקראת כך, וכתובת שמתחילה
       ב-mechinat- בכולן אינה מבדילה בין אף שתיים. */
    /* ⚠ **גם כשהיא כל המחרוזת.** «מכינת» לבדה אינה שם, והצעה
       ממנה («mkinat») נראית כמו כתובת תקינה — כלומר בדיוק
       ההצעה שמישהו יאשר בלי להסתכל. אחרי ההסרה לא נשאר דבר,
       ואז אין הצעה. */
    .replace(/^\s*(מכינת|מכינה|המכינה)(\s+|$)/, "")
    .replace(/["'״׳`]/g, "")
    .trim();

  const s = raw
    .split(/[\s\u2013\u2014\-־]+/)
    .filter(Boolean)
    .map((w) => {
      if (/^[A-Za-z0-9]+$/.test(w)) return w.toLowerCase();
      /* ⚠ המילון קודם — הוא הכתיב המקובל, והתעתיק הוא ניחוש. */
      return HE_WORDS[w] || HE_WORDS[w.replace(/^ה/, "")] || translit(w);
    })
    .filter(Boolean)
    .join("-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    /* ⚠ חיתוך ל-32 עלול להשאיר מקף בסוף, ו-SLUG_RE דוחה אותו. */
    .replace(/-+$/, "");

  return SLUG_RE.test(s) ? s : "";
}


/* ============================================================
   המרשם
   ============================================================ */
const emptyRegistry = () => ({ version: 1, mechinot: [] });

function readRegistry() {
  if (!existsSync(REGISTRY)) return emptyRegistry();
  try {
    const r = JSON.parse(readFileSync(REGISTRY, "utf8"));
    if (!Array.isArray(r.mechinot)) return emptyRegistry();
    return r;
  } catch (e) {
    /* ⚠ מרשם פגום אינו «אין מכינות». התחלה נקייה כאן מוחקת
       את הרשימה של כל הלקוחות בלי לומר מילה. */
    throw new Error(`המרשם פגום: ${REGISTRY} — ${e.message}`);
  }
}

function writeRegistry(reg) {
  mkdirSync(dirname(REGISTRY), { recursive: true });
  const tmp = REGISTRY + ".tmp";
  writeFileSync(tmp, JSON.stringify(reg, null, 2), "utf8");
  renameSync(tmp, REGISTRY);
  cache.clear();
}

/* ============================================================
   ⚠⚠ אימוץ חד-פעמי של הפריסה הישנה
   ------------------------------------------------------------
   עד השינוי הזה הנתונים ישבו ב-`.data/db.json`. מי שמושך
   את הגרסה הזו על עותק קיים היה מוצא **מערכת ריקה** — לא
   שגיאה, לא הודעה: פשוט מכינה שנעלמה. זה בדיוק «כשל טעינה
   נראה כמו אין נתונים», ובגרסה שאי אפשר להתאושש ממנה בלי
   לדעת איפה לחפש.

   ⚠ **רץ פעם אחת בלבד ומדווח ברעש.** קבצים מוזזים ולא
     מועתקים, כדי שלא יישאר עותק שני שמישהו יערוך בטעות.
   ============================================================ */
function adoptLegacy(reg) {
  const oldDb = join(DATA_DIR, "db.json");
  if (!existsSync(oldDb)) return reg;

  const slug = "mechina";
  const dir = join(MECHINOT_DIR, slug);
  mkdirSync(dir, { recursive: true });

  let name = "המכינה שלי";
  const oldProfile = join(DATA_DIR, "profile.json");
  try {
    const d = JSON.parse(readFileSync(oldProfile, "utf8"));
    name = d?.identity?.name || d?.identity?.shortName || name;
  } catch { /* שם ברירת מחדל */ }

  renameSync(oldDb, join(dir, "db.json"));
  if (existsSync(oldProfile)) renameSync(oldProfile, join(dir, "profile.json"));

  reg.mechinot.push({
    slug, name, preset: "premil",
    createdAt: new Date().toISOString(),
    archived: false, adopted: true,
  });
  writeRegistry(reg);

  console.log("");
  console.log(`  ⚠  אומצה הפריסה הקודמת: .data/db.json → .data/m/${slug}/`);
  console.log(`     היא מופיעה בקונסולה בשם «${name}» ובכתובת /m/${slug}/`);
  console.log("");
  return reg;
}

let adopted = false;
function registry() {
  const reg = readRegistry();
  if (!adopted) { adopted = true; return adoptLegacy(reg); }
  return reg;
}

/* ============================================================
   פעולות המרשם
   ============================================================ */
export function listMechinot({ withArchived = true } = {}) {
  const reg = registry();
  return reg.mechinot
    .filter((m) => withArchived || !m.archived)
    .map((m) => ({ ...m }));
}

export function getMechina(slug) {
  return registry().mechinot.find((m) => m.slug === slug) || null;
}

export function createMechina({ slug, name, preset = "premil", source = "console" }) {
  const problem = slugProblem(slug);
  if (problem) throw new TenantError(problem, 400);
  if (!String(name || "").trim()) throw new TenantError("חסר שם למכינה", 400);
  if (!PRESETS[preset]) throw new TenantError(`תבנית לא מוכרת: ${preset}`, 400);

  const reg = registry();
  if (reg.mechinot.some((m) => m.slug === slug)) {
    throw new TenantError(`כבר יש מכינה במזהה «${slug}»`, 409);
  }

  /* ⚠ תיקיה שקיימת בלי רישום במרשם היא שרידים של מכינה
     שנמחקה — ודריסה שלה מוחקת נתונים אמיתיים בשקט. */
  const dir = join(MECHINOT_DIR, slug);
  if (existsSync(dir) && readdirSync(dir).length) {
    throw new TenantError(
      `יש כבר תיקיית נתונים במזהה «${slug}» שאינה במרשם — יש לבדוק אותה לפני שיוצרים מחדש`, 409);
  }
  mkdirSync(dir, { recursive: true });

  const entry = {
    slug, name: String(name).trim(), preset,
    createdAt: new Date().toISOString(),
    archived: false,
    /* ⚠ **נקבע ביצירה ואינו ניתן לעריכה.** «מי הגיע לבד
       מהאתר» הוא נתון תפעולי אמיתי — הוא ההבדל בין לקוח
       שצריך ליווי לבין אחד שכבר מתנסה — ושדה שאפשר לערוך
       אותו אחר כך מפסיק לענות על השאלה הזו. */
    source: source === "signup" ? "signup" : "console",
  };
  reg.mechinot.push(entry);
  writeRegistry(reg);
  return { ...entry };
}

export function updateMechina(slug, patch) {
  const reg = registry();
  const m = reg.mechinot.find((x) => x.slug === slug);
  if (!m) throw new TenantError(`אין מכינה במזהה «${slug}»`, 404);

  /* ⚠⚠ **ה-slug אינו ברשימה, במכוון.** הוא הנתיב ושם התיקיה;
     שינוי שלו שובר כל קישור שמישהו שמר, וכל סשן פתוח. השם
     משתנה חופשי — הוא תווית. */
  for (const k of ["name", "notes", "contact"]) {
    if (patch[k] !== undefined) m[k] = String(patch[k] || "").trim();
  }
  if (patch.archived !== undefined) m.archived = Boolean(patch.archived);
  writeRegistry(reg);
  return { ...m };
}

/**
 * יומן כניסות מנהל-על.
 *
 * ⚠ **פונקציה משלה ולא שדה ב-`updateMechina`**, כי רשימת
 *   השדות שם היא רשימה סגורה של מה ש**עורכים** — ויומן אינו
 *   דבר שמישהו עורך. מסלול נפרד הוא מה ששומר על הרשימה
 *   ההיא קריאה כחוזה.
 */
export function setRootEntries(slug, entries) {
  const reg = registry();
  const m = reg.mechinot.find((x) => x.slug === slug);
  if (!m) throw new TenantError(`אין מכינה במזהה «${slug}»`, 404);
  m.rootEntries = entries;
  writeRegistry(reg);
  return entries;
}

/**
 * ⚠⚠ **מחיקה דורשת את ה-slug כאישור, והנתונים עוברים
 *   לארכיון ולא נמחקים.** מכינה שנמחקה היא שנה של נוכחות,
 *   בקשות ותיקי חניכים — ואין «בטל». התיקיה מועברת ל-
 *   `.data/trash/<slug>-<חותמת>`, ומי שבאמת רוצה למחוק עושה
 *   זאת בשרת ובידיים.
 */
export function deleteMechina(slug, { confirm } = {}) {
  if (confirm !== slug) {
    throw new TenantError("כדי למחוק יש להקליד את מזהה המכינה במדויק", 400);
  }
  const reg = registry();
  const i = reg.mechinot.findIndex((x) => x.slug === slug);
  if (i < 0) throw new TenantError(`אין מכינה במזהה «${slug}»`, 404);

  const dir = join(MECHINOT_DIR, slug);
  let movedTo = null;
  if (existsSync(dir)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    movedTo = join(DATA_DIR, "trash", `${slug}-${stamp}`);
    mkdirSync(dirname(movedTo), { recursive: true });
    renameSync(dir, movedTo);
  }

  reg.mechinot.splice(i, 1);
  writeRegistry(reg);
  cache.delete(slug);
  return { slug, movedTo };
}

export class TenantError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

/* ============================================================
   אובייקט המכינה — מסד, דלתא ופרופיל
   ------------------------------------------------------------
   ⚠⚠ **המטמון תלוי במכינה ולא במודול.** בגרסה הקודמת
     `profile-store.js` החזיק `let cache` ברמת הקובץ, וזה
     היה נכון כל עוד פריסה = מכינה. כאן זה היה הבאג הראשון
     והשקט ביותר: מכינה ב׳ מקבלת את הצבעים והשם של מכינה א׳
     למשך חמש שניות, ואז מתקנת את עצמה — כלומר תקלה שאי
     אפשר לשחזר.
   ============================================================ */
const cache = new Map();

export function tenant(slug) {
  const meta = getMechina(slug);
  if (!meta) throw new TenantError(`אין מכינה במזהה «${slug}»`, 404);

  const hit = cache.get(slug);
  if (hit) { hit.meta = meta; return hit; }

  const dir = join(MECHINOT_DIR, slug);
  mkdirSync(dir, { recursive: true });
  const dbFile = join(dir, "db.json");
  const deltaFile = join(dir, "profile.json");

  const db = createStore(fileEngine(dbFile));
  let pCache = { at: 0, value: null };

  const readDelta = () => {
    if (!existsSync(deltaFile)) return {};
    try { return JSON.parse(readFileSync(deltaFile, "utf8")); }
    catch (e) {
      /* ⚠ דלתא פגומה אינה מפילה את המכינה — נופלים לתבנית
         ומדווחים. אפליקציה שעולה עם שם גנרי עדיפה על
         אפליקציה שאינה עולה, כי דרכה אפשר לתקן. */
      console.error(`[${slug}] הדלתא פגומה, ממשיכים על התבנית:`, e.message);
      return {};
    }
  };

  const writeDelta = (delta) => {
    mkdirSync(dir, { recursive: true });
    const tmp = deltaFile + ".tmp";
    writeFileSync(tmp, JSON.stringify(delta, null, 2), "utf8");
    renameSync(tmp, deltaFile);
    pCache = { at: 0, value: null };
    return delta;
  };

  const invalidateProfile = () => { pCache = { at: 0, value: null }; };

  const loadProfile = async () => {
    if (pCache.value && Date.now() - pCache.at < 5_000) return pCache.value;

    const delta = readDelta();
    const preset = presetOf(delta);
    const merged = resolveProfile(preset, delta);

    /* ⚠ שם המכינה במרשם הוא מה שהקונסולה מציגה, והשם
       באפיון הוא מה שהאפליקציה מציגה. הם **שני דברים**
       ולא אחד: המנהל משנה את שלו באשף, ואני את שלי
       בקונסולה. מה שכן — כשהאפיון עדיין ריק, עדיף להציג
       את שם המרשם מאשר כלום. */
    if (!merged.identity?.name) {
      merged.identity = { ...(merged.identity || {}), registryName: meta.name };
    }

    const v = validateProfile(merged);
    merged.__valid = v.ok;
    merged.__errors = v.errors;
    merged.__warnings = v.warnings;

    pCache = { at: Date.now(), value: merged };
    return merged;
  };

  const t = {
    slug, meta, dir,
    paths: { db: dbFile, delta: deltaFile },
    db, readDelta, writeDelta, loadProfile, invalidateProfile,
  };
  cache.set(slug, t);
  return t;
}

/** ⚠ נקרא אחרי כתיבה למרשם — אחרת שם ישן נשאר במטמון. */
export const forgetTenant = (slug) => cache.delete(slug);

/* ============================================================
   מה יש בכל מכינה — לקונסולה
   ⚠ **נקרא בזהירות ולעולם אינו מפיל את הרשימה.** מכינה אחת
     עם קובץ פגום אינה סיבה שהקונסולה לא תעלה — היא בדיוק
     המכינה שצריך לראות ברשימה כדי לטפל בה.
   ============================================================ */
export async function mechinaSummary(m) {
  const base = {
    slug: m.slug, name: m.name, preset: m.preset,
    createdAt: m.createdAt, archived: Boolean(m.archived),
    notes: m.notes || "", contact: m.contact || "",
    adopted: Boolean(m.adopted),
    /* ⚠ היומן יוצא לקונסולה במלואו — הוא הרישום של הגישה
       שלי עצמי, ואין סיבה להסתיר אותו ממני. */
    rootEntries: Array.isArray(m.rootEntries) ? m.rootEntries : [],
  };
  try {
    const t = tenant(m.slug);
    const p = await t.loadProfile();
    const { missingSteps, WIZARD_STEPS } = await import("../core/profile.js");
    const { activeModules } = await import("../core/catalog.js");

    let bytes = 0;
    try { bytes = statSync(t.paths.db).size; } catch { /* טרם נכתב */ }

    return {
      ...base,
      appName: p.identity?.name || "",
      colors: p.identity?.colors || {},
      /* ⚠ בשמות ולא במפתחות — ראו server/routes/profile.js. */
      setupNeeded: missingSteps(p).map((k) =>
        WIZARD_STEPS.find((s) => s.key === k)?.title || k),
      modules: activeModules(p.modules || {}).length,
      counts: {
        student: await t.db.count("person", { kind: "student" }),
        staff: await t.db.count("person", { kind: "staff" }),
        account: await t.db.count("account"),
      },
      bytes,
      ok: true,
    };
  } catch (e) {
    /* ⚠ כשל טעינה נראה אחרת מ«מכינה ריקה» — גם ברשימה. */
    return { ...base, ok: false, error: e.message };
  }
}
