import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* ⚠ Vite מגיש את הלקוח בלבד. ה-API נמצא באותו תהליך
   (server/index.js) ולכן אין פרוקסי ואין CORS. */
export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist" },
});
