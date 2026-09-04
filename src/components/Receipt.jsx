import { fmt, qty as qtyFmt, UNIT_LABEL } from "../lib/format.js";
import { Corners } from "./ui.jsx";

const PAY_LABEL = { CASH: "Naqd", CARD: "Karta", BANK: "Bank", DEBT: "Qarz", MIXED: "Aralash" };

export default function Receipt({ sale, width = "80" }) {
  const items = sale.items || [];
  const paid = (sale.payments || []).filter((p) => p.type !== "DEBT").reduce((a, p) => a + Number(p.amount), 0);
  const debt = (sale.payments || []).filter((p) => p.type === "DEBT").reduce((a, p) => a + Number(p.amount), 0);
  const change = Math.max(0, paid - Number(sale.finalTotal));

  return (
    <div className={`blueprint receipt receipt-${width}`} style={{ padding: "var(--space-8)", margin: "0 auto", background: "#fff" }}>
      <Corners />
      <div style={{ textAlign: "center", borderBottom: "1px solid var(--color-accent-200)", paddingBottom: "var(--space-4)" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, textTransform: "uppercase", letterSpacing: ".06em" }}>
          TAXTA BOZOR
        </div>
        <div style={{ fontSize: 12, color: "var(--color-accent-700)" }}>
          Chek № {sale.receiptNo || sale.number} · {new Date(sale.createdAt || Date.now()).toLocaleString("ru-RU")}
        </div>
        <div style={{ fontSize: 12, color: "var(--color-accent-700)" }}>
          Sotuvchi: {sale.sellerName || "—"}
          {sale.customerName ? ` · Mijoz: ${sale.customerName}` : ""}
        </div>
      </div>

      <div style={{ padding: "var(--space-4) 0" }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0", fontSize: 13 }}>
            <span>
              {it.name} × {qtyFmt(it.quantity, UNIT_LABEL[it.unit] || "")}
              {" "}× {fmt(it.unitPrice)}
            </span>
            <span style={{ whiteSpace: "nowrap" }}>{fmt(it.lineTotal ?? it.unitPrice * it.quantity)}</span>
          </div>
        ))}
      </div>

      <Line label="Oraliq" value={fmt(sale.subtotal)} />
      {Number(sale.discount) > 0 && <Line label="Chegirma" value={"−" + fmt(sale.discount)} />}
      {Number(sale.roundingDiscount) > 0 && <Line label="Yaxlitlash" value={"−" + fmt(sale.roundingDiscount)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--color-neutral-400)", paddingTop: "var(--space-3)", marginTop: 6 }}>
        <span className="kicker">Jami</span>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, color: "var(--color-accent-900)" }}>
          {fmt(sale.finalTotal)}
        </span>
      </div>

      <div style={{ marginTop: "var(--space-3)" }}>
        {(sale.payments || []).map((p, i) => (
          <Line key={i} label={PAY_LABEL[p.type] || p.type} value={fmt(p.amount)} />
        ))}
        {change > 0 && <Line label="Qaytim" value={fmt(change)} />}
        {debt > 0 && <Line label="Qarz" value={fmt(debt)} />}
      </div>

      <div style={{ textAlign: "center", marginTop: "var(--space-6)", fontSize: 12, color: "var(--color-accent-700)" }}>
        Xaridingiz uchun rahmat!
      </div>
    </div>
  );
}

function Line({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "2px 0" }}>
      <span>{label}</span>
      <span style={{ whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}
