/* ============================================================
   השרת — תהליך אחד, שלושה מוצרים
   ------------------------------------------------------------
   ⚠ **לא Vercel ולא פונקציות.** המערכת הקודמת נבנתה סביב
     מגבלת 12 הפונקציות, וכל דפוס הניתוב שלה (`?action=`)
     נולד מהמגבלה הזו ולא מהצורך. כאן זה שרת Node אחד: רץ
     על localhost, בקונטיינר, על VPS, או אצל כל ספק — בלי
     שהקוד יידע.

   ⚠ **בפיתוח Vite רץ כ-middleware באותו תהליך.** פורט אחד,
     בלי פרוקסי, בלי CORS, ובלי «למה זה עובד בבנייה ולא
     בפיתוח».

   ============================================================
   ⚠⚠⚠ שלוש משפחות של כתובות, ואין רביעית
   ------------------------------------------------------------
     /console                 הקונסולה — כל המכינות
     /api/admin/…             ה-API שלה. אין בו `tenant`.
     /m/<slug>/               האפליקציה של מכינה
     /m/<slug>/api/…          ה-API שלה. **המכינה מהנתיב.**

   **המכינה נגזרת מהנתיב ולא מכותרת, לא מפרמטר ולא מגוף
   הבקשה.** מה שהדפדפן מצהיר עליו אינו הרשאה — זה הכלל
   שחוזר בכל המערכת, וכאן הוא ההבדל בין לקוח ללקוח.

   ⚠ **`/api/…` ישן מקבל 404 שמסביר לאן זה עבר** ולא 404
     סתמי. לקוח ישן שנשאר פתוח בלשונית הוא בדיוק מי שיקבל
     אותו, ו«אין נקודת קצה» היה שולח לחפש באג שאינו קיים.
   ============================================================ */

import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

import { DataError } from "./data/store.js";
import { currentUser } from "./auth.js";
import { currentRoot, rootExists } from "./root.js";
import { tenant, listMechinot } from "./tenants.js";
import { ROUTES, ADMIN_ROUTES } from "./routes/index.js";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const DEV = process.env.NODE_ENV !== "production";
const PORT = Number(process.env.PORT || 5180);

/* ⚠ הסוד חייב להיות ארוך. בפיתוח יש ברירת מחדל קבועה, כדי
   שהעוגייה תשרוד הפעלה מחדש — אחרת כל ריסטארט מנתק באמצע
   בדיקה. בייצור אין ברירת מחדל, וחסרונו מפיל את השרת בעלייה. */
if (!process.env.SESSION_SECRET) {
  if (!DEV) {
    console.error("SESSION_SECRET חסר — השרת לא יעלה בייצור בלעדיו");
    process.exit(1);
  }
  process.env.SESSION_SECRET = "dev-only-secret-not-for-production-0123456789";
}

async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return {};
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    /* ⚠ גבול מפורש. הדבקה של גיליון היא הקלט הגדול ביותר
       במערכת, ו-2MB הם הרבה מעבר לה — אבל בלי גבול, בקשה
       אחת יכולה למלא את הזיכרון של השרת. */
    if (size > 2_000_000) throw new DataError("גוף הבקשה גדול מדי");
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch { throw new DataError("גוף הבקשה אינו JSON תקין"); }
}

const send = (res, status, body) => {
  if (res.writableEnded) return;
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
};

function fail(res, name, e) {
  /* ⚠⚠ **כל שגיאה שנושאת `status` בטווח 4xx היא תשובה ולא
     תקלה.** בגרסה הראשונה רק AuthError ו-DataError נבדקו,
     וכניסה כושלת חזרה כ-500 עם ההודעה בשדה `detail` —
     כלומר הטיפול ב-401 שבלקוח לא היה נורה לעולם, ומי
     שהסשן שלו פג היה רואה «שגיאת שרת». */
  const status = Number(e?.status);
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return send(res, status, { error: e.message });
  }
  /* ⚠ ה-stack ללוג, ההודעה ללקוח. «שגיאת שרת» לבדה שולחת
     את מי שמתחזק לחפש באפלה. */
  console.error(`[${name}]`, e);
  send(res, 500, { error: "שגיאת שרת", detail: DEV ? String(e.message) : undefined });
}

/* ============================================================
   ה-API של הקונסולה
   ⚠ **אין כאן `tenant` בהקשר, במפורש.** נקודת קצה של הקונסולה
     שתנסה לגעת במכינה חייבת לבקש אותה בשמה — ולכן אי אפשר
     לכתוב בטעות מסלול שנוגע ב«המכינה הנוכחית», שהיא מושג
     שאינו קיים כאן.
   ============================================================ */
async function handleAdmin(req, res, url) {
  const name = url.pathname.slice("/api/".length);
  const route = ADMIN_ROUTES[name];
  /* ⚠ מתויג, כדי שהלקוח יוכל להבדיל בין «אין כזו נקודה» לבין
     404 אמיתי על משאב. ראו client/api.js. */
  if (!route) return send(res, 404, { error: `אין נקודת קצה בשם «${name}»`, unknownEndpoint: true });
  const handler = route[req.method];
  if (!handler) return send(res, 405, { error: "שיטה לא נתמכת" });

  try {
    const ctx = {
      req, res,
      root: currentRoot(req),
      query: Object.fromEntries(url.searchParams),
      body: await readBody(req),
    };
    const out = await handler(ctx);
    if (res.writableEnded) return;
    send(res, 200, out ?? { ok: true });
  } catch (e) { fail(res, name, e); }
}

/* ============================================================
   ה-API של מכינה
   ============================================================ */
async function handleTenantApi(req, res, url, slug, rest) {
  const route = ROUTES[rest];
  if (!route) return send(res, 404, { error: `אין נקודת קצה בשם «${rest}»`, unknownEndpoint: true });
  const handler = route[req.method];
  if (!handler) return send(res, 405, { error: "שיטה לא נתמכת" });

  try {
    /* ⚠ מכינה שאינה קיימת היא 404 **לפני** שנקראת עוגייה או
       נטען משהו — אחרת נתיב שגוי היה נראה כמו «יש להתחבר». */
    const t = tenant(slug);
    const profile = await t.loadProfile();
    const root = currentRoot(req);
    const user = await currentUser(req, t, root);

    const ctx = {
      req, res,
      tenant: t,
      db: t.db,
      profile, user, root,
      query: Object.fromEntries(url.searchParams),
      body: await readBody(req),
    };
    const out = await handler(ctx);
    if (res.writableEnded) return;
    send(res, 200, out ?? { ok: true });
  } catch (e) { fail(res, `${slug}/${rest}`, e); }
}

/* ---------- הרמה ---------- */
let vite = null;
if (DEV) {
  const { createServer: createVite } = await import("vite");
  vite = await createVite({ root: ROOT, server: { middlewareMode: true }, appType: "spa" });
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript",
  ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png",
  ".json": "application/json", ".webmanifest": "application/manifest+json",
};

/* ⚠ `/m/<slug>/api/x/y` → ["<slug>", "/api/x/y"]. הפירוק במקום
   אחד, כדי ששלושת הקוראים לא יפרשו אותו בשלוש דרכים. */
const M_RE = /^\/m\/([a-z][a-z0-9-]{1,31})(\/.*)?$/;

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const path = url.pathname;

  if (path.startsWith("/api/admin/")) return handleAdmin(req, res, url);

  const m = M_RE.exec(path);
  if (m) {
    const [, slug, tail = "/"] = m;
    if (tail.startsWith("/api/")) {
      return handleTenantApi(req, res, url, slug, tail.slice("/api/".length));
    }
    /* מסך של מכינה — ה-SPA, שקורא את ה-slug מהכתובת */
  } else if (path.startsWith("/api/")) {
    /* ⚠ הודעה שמסבירה לאן זה עבר, ולא 404 סתמי. */
    return send(res, 404, {
      error: "ה-API של מכינה נמצא תחת /m/<מזהה>/api/… — ושל הקונסולה תחת /api/admin/…",
    });
  }

  if (vite) return vite.middlewares(req, res, () => {
    res.statusCode = 404; res.end("not found");
  });

  /* ---------- ייצור: מגישים את dist ---------- */
  const dist = resolve(ROOT, "dist");
  let file = resolve(dist, "." + path);
  if (!existsSync(file) || !extname(file)) file = resolve(dist, "index.html");
  if (!file.startsWith(dist) || !existsSync(file)) {
    res.statusCode = 404; return res.end("not found");
  }
  res.setHeader("Content-Type", MIME[extname(file)] || "application/octet-stream");
  res.end(readFileSync(file));
});

/* ============================================================
   ⚠⚠ הבאנר אומר **מה נטען**, ולא רק «השרת עלה»
   ------------------------------------------------------------
   `start.cmd` היה מריץ `npm run seed` בשקט כשחסרה `.data`,
   ואז מי שציפה למכינה אחת קיבל אחרת — בלי שום רמז. שרת
   שעולה ואינו אומר במה הוא עובד הוא שרת שאפשר לבזבז מולו
   חצי שעה על «למה השם לא נכון».
   ============================================================ */
server.listen(PORT, () => {
  const base = `http://localhost:${PORT}`;
  let rows = [];
  try { rows = listMechinot(); } catch (e) { console.error("[registry]", e.message); }

  console.log("");
  console.log("  ╭──────────────────────────────────────────────────────╮");
  console.log("  │  Mechinot                                            │");
  console.log("  ╰──────────────────────────────────────────────────────╯");
  console.log(`  קונסולה   ${base}/console`);
  if (!rootExists()) {
    console.log("            ⚠ עדיין אין מנהל-על — הקונסולה תבקש להקים אחד");
    console.log("              (או:  npm run root -- --user <שם> --pass <סיסמה>)");
  }
  console.log("");
  if (!rows.length) {
    console.log("  אין עדיין אף מכינה. פותחים אחת מהקונסולה, או:");
    console.log("    npm run seed                          מכינה מלאה לבדיקה");
    console.log('    npm run new -- "שם" --slug <מזהה>      מכינה ריקה');
  } else {
    console.log(`  ${rows.length} מכינות:`);
    for (const r of rows) {
      const flag = r.archived ? "  (בארכיון)" : "";
      console.log(`    ${base}/m/${r.slug}/   ${r.name}${flag}`);
    }
  }
  console.log("");
});
