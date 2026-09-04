import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { fmt, qty as qtyFmt, UNIT_LABEL, AVAILABILITY_LABEL, AVAILABILITY_TAG } from "../lib/format.js";
import { Kpi, Loader } from "../components/ui.jsx";

export default function Ombor() {
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/inventory").then((r) => setItems(r.items)).catch(() => setItems([]));
  }, []);

  if (!items) return <Loader />;

  const filtered = items.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  const low = items.filter((p) => p.availability !== "IN_STOCK").length;
  const value = items.reduce((a, p) => a + (p.stockValue || 0), 0);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "var(--space-4)" }}>
        <Kpi label="Pozitsiya" value={items.length} />
        <Kpi label="Ombor qiymati" value={fmt(value)} />
        <Kpi label="Kam qolgan" value={low} />
      </div>
      <input className="input" placeholder="Mahsulot qidirish" value={q} onChange={(e) => setQ(e.target.value)} />
      <table className="table">
        <thead>
          <tr><th>Mahsulot</th><th>Kelgan</th><th>Sotilgan</th><th>Qoldiq</th><th>Tannarx</th><th>Holat</th></tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "var(--color-accent-700)" }}>{p.sku} · {p.categoryName}</div>
              </td>
              <td>{qtyFmt(p.received, UNIT_LABEL[p.unit])}</td>
              <td>{qtyFmt(p.sold, UNIT_LABEL[p.unit])}</td>
              <td style={{ whiteSpace: "nowrap" }}>{qtyFmt(p.stockLeft, UNIT_LABEL[p.unit])}</td>
              <td style={{ whiteSpace: "nowrap" }}>{p.cost != null ? fmt(p.cost) : "—"}</td>
              <td><span className={`tag ${AVAILABILITY_TAG[p.availability]}`}>{AVAILABILITY_LABEL[p.availability]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
