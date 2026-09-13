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

export function Placeholder({ k, nav }) {
  const [cat, setCat] = useState(null);

  /* ⚠ נטען מהסטודיו ולא מועתק לכאן — מקור אחד לתיאור. */
  useEffect(() => {
    api.studio().then((s) => setCat(s.catalog)).catch(() => setCat({}));
  }, []);

  const item = (nav?.groups || []).flatMap((g) =>
    g.items.map((i) => ({ ...i, group: g.title }))).find((i) => i.key === k);

  const why = item && cat?.[item.module]?.why;

  return (
    <div className="card lift">
      <div className="pl">
        <h3>{item?.title || k}</h3>
        {item && <p className="faint">{item.group}</p>}
        {why && <p className="why">{why}</p>}
        <div className="banner info" style={{ display: "inline-block", textAlign: "right" }}>
          המסך הזה <b>קיים במכינה שלכם</b> — ההרשאות, הנתונים והתפריט כבר מוכנים לו.
          <br />הוא עוד לא נבנה.
        </div>
      </div>
    </div>
  );
}
