/* ============================================================
   טעינת מסמך האפיון
   ------------------------------------------------------------
   ⚠ הפרופיל הוא **דלתא מעל תבנית**, ולא מסמך עצמאי. כאן
     נקראת הדלתא, נמזגת עם התבנית, ונבדקת.

   ⚠ **כישלון קריאה אינו מפיל את השרת.** נופלים לתבנית
     כמות שהיא ומדווחים בלוג — אפליקציה שעולה עם שם גנרי
     עדיפה על אפליקציה שאינה עולה, ובפיתוח זה ההבדל בין
     «מה שברתי» לבין «אה, אין עדיין דלתא».

   ⚠ **מטמון קצר.** הדלתא משתנה כשמישהו עורך הגדרות, וקריאת
     קובץ בכל בקשה מיותרת — אבל מטמון ארוך פירושו שמנהל
     שמשנה שם רואה את השינוי בעוד עשר דקות ומסיק שזה נשבר.
   ============================================================ */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import PREMIL from "../core/presets/premil.js";
import { resolveProfile, validateProfile } from "../core/profile.js";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const PRESETS = { premil: PREMIL };

export const DELTA_FILE = process.env.PROFILE_FILE
  || resolve(ROOT, ".data/profile.json");

const TTL = 5_000;
let cache = { at: 0, value: null };

/** הדלתא כמות שהיא — לעריכה */
export function readDelta() {
  if (!existsSync(DELTA_FILE)) return {};
  try { return JSON.parse(readFileSync(DELTA_FILE, "utf8")); }
  catch (e) {
    console.error("[profile] הדלתא פגומה, ממשיכים על התבנית:", e.message);
    return {};
  }
}

export function writeDelta(delta) {
  mkdirSync(dirname(DELTA_FILE), { recursive: true });
  writeFileSync(DELTA_FILE, JSON.stringify(delta, null, 2), "utf8");
  cache = { at: 0, value: null };
  return delta;
}

/** הפרופיל המאוחד — זה מה שכל הקוד קורא */
export async function loadProfile() {
  if (cache.value && Date.now() - cache.at < TTL) return cache.value;

  const delta = readDelta();
  const preset = PRESETS[delta.preset] || PREMIL;
  const merged = resolveProfile(preset, delta);

  /* ⚠ הוולידציה רצה תמיד, וכישלון שלה **אינו** מונע עלייה:
     המסך צריך להיות מסוגל להציג «האפיון חסר X» במקום להיעלם. */
  const v = validateProfile(merged);
  merged.__valid = v.ok;
  merged.__errors = v.errors;
  merged.__warnings = v.warnings;

  cache = { at: Date.now(), value: merged };
  return merged;
}

export const invalidateProfile = () => { cache = { at: 0, value: null }; };
