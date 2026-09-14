/* ============================================================
   מסך שקיים ועוד לא נבנה
   ------------------------------------------------------------
   ⚠⚠ **אומר את האמת, ולא נעלם.** האפשרות האחרת הייתה להסתיר
     מסך שטרם מומש — וזו בדיוק הטעות: מנהל שהדליק מודול ולא
     רואה את המסך יסיק שההדלקה לא עבדה, ויחפש באג שאינו קיים.

     מסך שאומר «זה קיים · זה מה שהוא יעשה · הוא עוד לא נבנה»
     הוא אמת. מסך שנעלם הוא שקר.

   ⚠ וההסבר מגיע מ-`why` שבקטלוג — אותו משפט שמנהל המכינה
     קרא באשף כשהחליט להדליק. אם הם יתפצלו, המשפט באשף הוא
     הבטחה שהמסך אינו מקיים.
   ============================================================ */

import React, { useEffect, useState } from "react";
import { api } from "./api.js";
import { screenIcon } from "./icons.jsx";
import * as MI from "./icons.jsx";
import { tone } from "./ui.jsx";

export function Placeholder({ k, nav }) {
  const [cat, setCat] = useState(null);

  /* ⚠ נטען מהסטודיו ולא מועתק לכאן — מקור אחד לתיאור. */
  useEffect(() => {
    api.studio().then((s) => setCat(s.catalog)).catch(() => setCat({}));
  }, []);

  const item = (nav?.groups || []).flatMap((g) =>
    g.items.map((i) => ({ ...i, group: g.title }))).find((i) => i.key === k);

  const why = item && cat?.[item.module]?.why;
  const Icon = screenIcon(k);
  const title = item?.title || k;

  return (
    <div className={"card lift edge " + tone(title)} style={{ textAlign: "center" }}>
      <div style={{ padding: "var(--s5) var(--s3) var(--s4)" }}>
        <div className="tile lg" style={{ margin: "0 auto var(--s4)" }}>
          <Icon size={24} />
        </div>
        <h2>{title}</h2>
        {item && <p className="faint" style={{ marginTop: 2 }}>{item.group}</p>}
        {why && (
          <p className="muted" style={{ maxWidth: "44ch", margin: "var(--s4) auto 0" }}>
            {why}
          </p>
        )}

        <div className="banner info" style={{ maxWidth: 460, margin: "var(--s5) auto 0",
          textAlign: "start" }}>
          <MI.Info size={18} />
          <div>
            המסך הזה <b>קיים במכינה שלכם</b> — ההרשאות, הנתונים והתפריט
            כבר מוכנים לו. הוא עוד לא נבנה.
          </div>
        </div>
      </div>
    </div>
  );
}
