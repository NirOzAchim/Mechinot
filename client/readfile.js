/* ============================================================
   קריאת קובץ — אקסל, וורד, CSV — בלי שום חבילה
   ------------------------------------------------------------
   ⚠⚠ **הדבקה נשארת המסלול הראשי, והקובץ הוא קיצור.** מנהל
     מכינה מחזיק את הנתונים בוואטסאפ, במסמך או בגיליון,
     וההדבקה עובדת מכולם. אבל מי שמחזיק אקסל נאלץ לפתוח,
     לסמן, להעתיק — שלושה שלבים שבכל אחד אפשר להיתקע. הקובץ
     חוסך אותם, **והתוצאה שלו נכנסת לאותה תיבת הדבקה** ולא
     למסלול שני.

   ⚠⚠⚠ **הטקסט נכנס לשדה ונשאר ניתן לעריכה.** גיליון נושא
     כותרות, תאים ממוזגים ושורות ריקות, וחילוץ שטוח לעולם
     לא יהיה מושלם. הצגתו כ«הקובץ נקלט» הייתה שקר; מה שקורה
     בפועל הוא שהטקסט מופיע, המנהל רואה אותו, ומתקן.

   ⚠ **ובלי שום תלות חיצונית.** `.xlsx` ו-`.docx` הם ZIP,
     ו-`DecompressionStream("deflate-raw")` מובנה בדפדפן.
     ספריית אקסל היא 900KB לחבילה בשביל דבר שנעשה בשמונים
     שורות — **וקובץ אינו עולה לשרת בכלל**, כלומר גם אין
     נקודת קצה חדשה להגן עליה.

   ⚠ **וכישלון נאמר ואינו נבלע.** קובץ שלא נקרא מחזיר שגיאה
     מנוסחת; קובץ שנקרא ויצא ממנו כלום אומר זאת בנפרד —
     «הקובץ ריק» ו«לא הצלחנו לקרוא» הם שני מצבים שונים.
   ============================================================ */

const dec = new TextDecoder("utf-8");

/* ============================================================
   ZIP — מה שצריך ותו לא
   ------------------------------------------------------------
   ⚠ נקרא **מספריית התוכן שבסוף** ולא בסריקה לינארית מההתחלה.
     כותרת מקומית אינה נושאת את הגודל האמיתי כשהוא נכתב
     בזרימה, ואז חיתוך לפיה מחזיר נתון קטוע — בלי שגיאה.
   ============================================================ */
function u16(v, o) { return v.getUint16(o, true); }
function u32(v, o) { return v.getUint32(o, true); }

function entries(buf) {
  const v = new DataView(buf);
  /* ⚠ EOCD מהסוף אחורה: הוא בגודל משתנה (הערה בסוף הקובץ). */
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= 0 && i > buf.byteLength - 66000; i--) {
    if (u32(v, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("הקובץ אינו ZIP תקין");

  const count = u16(v, eocd + 10);
  let p = u32(v, eocd + 16);
  const out = new Map();

  for (let i = 0; i < count; i++) {
    if (u32(v, p) !== 0x02014b50) break;
    const method = u16(v, p + 10);
    const size = u32(v, p + 20);
    const nameLen = u16(v, p + 28);
    const extraLen = u16(v, p + 30);
    const commentLen = u16(v, p + 32);
    const local = u32(v, p + 42);
    const name = dec.decode(new Uint8Array(buf, p + 46, nameLen));
    out.set(name, { method, size, local });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return { v, out };
}

async function inflate(bytes) {
  const s = new Blob([bytes]).stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(s).arrayBuffer());
}

async function fileIn(buf, zip, name) {
  const e = zip.out.get(name);
  if (!e) return null;
  const { v } = zip;
  if (u32(v, e.local) !== 0x04034b50) return null;
  const start = e.local + 30 + u16(v, e.local + 26) + u16(v, e.local + 28);
  const raw = new Uint8Array(buf, start, e.size ||
    /* ⚠ גודל 0 בספרייה קורה בקבצים שנכתבו בזרימה; אז לוקחים
       עד סוף המאגר ונשענים על המפענח שיעצור לבד. */
    (buf.byteLength - start));
  const bytes = e.method === 0 ? raw : await inflate(raw);
  return dec.decode(bytes);
}

/* ============================================================
   XML — חילוץ טקסט, לא פרסור
   ⚠ `DOMParser` קיים בדפדפן ומדויק יותר מביטוי רגולרי, וזו
     הסיבה שהוא כאן: תא שיש בו `&amp;` או `<` מקודד נשבר
     בכל ניסיון לקרוא אותו בביטוי.
   ============================================================ */
const xml = (s) => new DOMParser().parseFromString(s, "application/xml");

const textOf = (node, tag) =>
  Array.from(node.getElementsByTagName(tag)).map((t) => t.textContent).join("");

/* ============================================================
   אקסל
   ------------------------------------------------------------
   ⚠⚠ **הגיליון הראשון בלבד.** חוברת עם שש לשוניות שתיקרא
     כולה מייצרת בליל שאיש לא יוכל לקרוא בתצוגה המקדימה.
     מי שצריך לשונית אחרת שומר אותה כ-CSV — וזה נאמר במסך.

   ⚠ **התא ריק נשאר ריק ואינו נדחס.** «שם, ת.ז, ,עיר» עם
     עמודה ריקה באמצע הוא בדיוק המצב שבו זיהוי לפי צורה
     צריך לראות שהעמודה ריקה.
   ============================================================ */
async function xlsx(buf) {
  const zip = entries(buf);

  /* מחרוזות משותפות — אקסל שומר כל טקסט שם ומצביע אליו במספר */
  const shared = [];
  const ss = await fileIn(buf, zip, "xl/sharedStrings.xml");
  if (ss) {
    for (const si of xml(ss).getElementsByTagName("si")) shared.push(textOf(si, "t"));
  }

  /* ⚠ שם הגיליון הראשון נקרא מ-workbook.xml.rels ולא מונח
     כ-sheet1.xml: חוברת שנוצרה בגוגל שיטס ממספרת אחרת. */
  let sheetPath = "xl/worksheets/sheet1.xml";
  if (!zip.out.has(sheetPath)) {
    const first = [...zip.out.keys()].find((k) => /^xl\/worksheets\/.*\.xml$/.test(k));
    if (!first) throw new Error("לא נמצא גיליון בקובץ");
    sheetPath = first;
  }
  const sheet = await fileIn(buf, zip, sheetPath);
  if (!sheet) throw new Error("לא הצלחנו לקרוא את הגיליון");

  const doc = xml(sheet);
  const out = [];
  for (const row of doc.getElementsByTagName("row")) {
    const cells = [];
    for (const c of row.getElementsByTagName("c")) {
      /* ⚠ העמודה נקראת מ-r ("B7") ולא ממיקום ברשימה: אקסל
         **משמיט** תאים ריקים, ובלי זה כל השורה מוסטת שמאלה. */
      const ref = c.getAttribute("r") || "";
      const col = colIndex(ref.replace(/\d+/g, ""));
      const type = c.getAttribute("t");
      let val = "";
      if (type === "s") val = shared[Number(textOf(c, "v"))] ?? "";
      else if (type === "inlineStr") val = textOf(c, "t");
      else val = textOf(c, "v");
      if (col >= 0) cells[col] = String(val).trim();
    }
    const line = Array.from(cells, (x) => x ?? "").join("\t");
    if (line.replace(/\t/g, "").trim()) out.push(line);
  }
  return out.join("\n");
}

/** "B" → 1 · "AA" → 26 */
function colIndex(letters) {
  if (!letters) return -1;
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/* ============================================================
   וורד
   ⚠ **שורת טבלה הופכת לשורה עם טאבים** ופסקה הופכת לשורה.
     מכינה ששלחה את המצבה כטבלה בוורד היא מקרה נפוץ לגמרי,
     ובלי זה כל התאים היו נדבקים למילה אחת ארוכה.
   ============================================================ */
async function docx(buf) {
  const zip = entries(buf);
  const src = await fileIn(buf, zip, "word/document.xml");
  if (!src) throw new Error("לא נמצא תוכן במסמך");

  const doc = xml(src);
  const body = doc.getElementsByTagName("w:body")[0] || doc.documentElement;
  const out = [];

  const walk = (node) => {
    for (const el of node.children) {
      if (el.tagName === "w:tbl") {
        for (const tr of el.getElementsByTagName("w:tr")) {
          const cells = Array.from(tr.getElementsByTagName("w:tc"))
            .map((tc) => textOf(tc, "w:t").trim());
          if (cells.some(Boolean)) out.push(cells.join("\t"));
        }
      } else if (el.tagName === "w:p") {
        const t = textOf(el, "w:t").trim();
        if (t) out.push(t);
      } else {
        walk(el);
      }
    }
  };
  walk(body);
  return out.join("\n");
}

/* ============================================================
   הדלת
   ⚠ **הסוג נקבע מהתוכן ולא מהסיומת בלבד.** קובץ שנשמר כ-
     `.txt` והוא בעצם אקסל, או `.xls` ישן שהוא בכלל HTML,
     הם מצבים אמיתיים; החתימה `PK` אומרת את האמת.
   ============================================================ */
export const ACCEPT = ".csv,.tsv,.txt,.xlsx,.docx";

export async function readFile(file) {
  const name = String(file?.name || "");
  const buf = await file.arrayBuffer();
  const head = new Uint8Array(buf, 0, Math.min(4, buf.byteLength));
  const isZip = head[0] === 0x50 && head[1] === 0x4b;

  if (isZip) {
    if (/\.docx$/i.test(name)) return clip(await docx(buf), name);
    if (/\.xlsx$/i.test(name)) return clip(await xlsx(buf), name);
    /* ⚠ ZIP שאינו אחד משניהם — לנסות אקסל, ואם נכשל לומר
       זאת. ניחוש שמחזיר ג׳יבריש גרוע מהודעה. */
    try { return clip(await xlsx(buf), name); }
    catch { throw new Error("סוג הקובץ אינו נתמך — אקסל, וורד, CSV או טקסט"); }
  }

  if (/\.xls$/i.test(name)) {
    throw new Error("קובץ xls ישן אינו נתמך — יש לשמור אותו כ-xlsx או כ-CSV");
  }

  const text = dec.decode(new Uint8Array(buf));
  /* ⚠ תווי בקרה פירושם קובץ בינארי שנקרא כטקסט — מוטב לומר
     זאת מאשר למלא את התיבה בג׳יבריש. */
  if (/[\u0000-\u0008\u000e-\u001f]/.test(text.slice(0, 400))) {
    throw new Error("הקובץ אינו טקסט — אקסל, וורד, CSV או טקסט");
  }
  return clip(text, name);
}

function clip(text, name) {
  const t = String(text || "").trim();
  /* ⚠ «ריק» הוא מצב משלו ואינו כישלון קריאה: קובץ שנקרא
     בהצלחה ואין בו שורות הוא בדיוק מה שקורה כשבחרו את
     הלשונית הלא-נכונה. */
  if (!t) {
    const e = new Error("הקובץ נקרא ואין בו שורות");
    e.empty = true;
    throw e;
  }
  const lines = t.split(/\r?\n/).length;
  return { text: t, name, lines };
}
