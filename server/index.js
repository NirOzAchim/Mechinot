/* ============================================================
   השרת — תהליך אחד, בלי ספק ענן
   ------------------------------------------------------------
   ⚠ **לא Vercel ולא פונקציות.** המערכת הקודמת נבנתה סביב
     מגבלת 12 הפונקציות, וכל דפוס הניתוב שלה (`?action=`)
     נולד מהמגבלה הזו ולא מהצורך. כאן זה שרת Node אחד: רץ
     על localhost, בקונטיינר, על VPS, או אצל כל ספק — בלי
     שהקוד יידע.

   ⚠ **בפיתוח Vite רץ כ-middleware באותו תהליך.** פורט אחד,
     בלי פרוקסי, בלי CORS, ובלי «למה זה עובד בבנייה ולא
     בפיתוח».
   ============================================================ */

import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

import { fileEngine } from "./data/file-engine.js";
import { createStore, DataError } from "./data/store.js";
import { currentUser, AuthError } from "./auth.js";
import { loadProfile } from "./profile-store.js";
import { ROUTES } from "./routes/index.js";

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

const db = createStore(fileEngine(process.env.DATA_FILE || resolve(ROOT, ".data/db.json")));

async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return {};
  const chunks = [];
  for await (const c of req) chunks.push(c);
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

async function handleApi(req, res, url) {
  const name = url.pathname.slice("/api/".length);
  const route = ROUTES[name];
  if (!route) return send(res, 404, { error: `אין נקודת קצה בשם «${name}»` });

  const handler = route[req.method];
  if (!handler) return send(res, 405, { error: "שיטה לא נתמכת" });

  try {
    const profile = await loadProfile(db);
    const user = await currentUser(req, db);
    const ctx = {
      req, res, db, profile, user,
      query: Object.fromEntries(url.searchParams),
      body: await readBody(req),
    };
    const out = await handler(ctx);
    if (res.writableEnded) return;
    send(res, 200, out ?? { ok: true });
  } catch (e) {
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
    console.error(`[api/${name}]`, e);
    send(res, 500, { error: "שגיאת שרת", detail: DEV ? String(e.message) : undefined });
  }
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

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);

  if (vite) return vite.middlewares(req, res, () => {
    res.statusCode = 404; res.end("not found");
  });

  /* ---------- ייצור: מגישים את dist ---------- */
  const dist = resolve(ROOT, "dist");
  let file = resolve(dist, "." + url.pathname);
  if (!existsSync(file) || !extname(file)) file = resolve(dist, "index.html");
  if (!file.startsWith(dist) || !existsSync(file)) {
    res.statusCode = 404; return res.end("not found");
  }
  res.setHeader("Content-Type", MIME[extname(file)] || "application/octet-stream");
  res.end(readFileSync(file));
});

server.listen(PORT, () => {
  console.log("");
  console.log("  ╭──────────────────────────────────────────────╮");
  console.log("  │  Mechinot — שרת פיתוח                        │");
  console.log(`  │  http://localhost:${PORT}                       │`);
  console.log("  ╰──────────────────────────────────────────────╯");
  console.log("");
});
