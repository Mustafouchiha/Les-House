import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { fmt } from "../lib/format.js";
import { Kpi, Loader, Segmented } from "../components/ui.jsx";

const PERIODS = [
  { value: "today", label: "Bugun" },
  { value: "7d", label: "7 kun" },
  { value: "30d", label: "30 kun" },
  { value: "90d", label: "3 oy" },
  { value: "365d", label: "1 yil" },
];

export default function Hisobotlar() {
  const [period, setPeriod] = useState("30d");
  const [d, setD] = useState(null);

  useEffect(() => {
    setD(null);
    api.get(`/reports/products?period=${period}`).then(setD).catch(() => setD({ rows: [], kpis: {} }));
  }, [period]);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <Segmented options={PERIODS} value={period} onChange={setPeriod} />
      {!d ? (
        <Loader />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "var(--space-4)" }}>
            <Kpi label="Tushum" value={fmt(d.kpis.revenue)} />
            <Kpi label="Tannarx" value={fmt(d.kpis.cogs)} />
            <Kpi label="Yalpi foyda" value={fmt(d.kpis.profit)} />
            <Kpi label="Marja" value={`${d.kpis.marginPct ?? 0}%`} />
          </div>
          <table className="table">
            <thead>
              <tr><th>Mahsulot</th><th>Sotildi</th><th>Tushum</th><th>Tannarx</th><th>Foyda</th><th>%</th></tr>
            </thead>
            <tbody>
              {d.rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.qtyLabel}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmt(r.revenue)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmt(r.cogs)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmt(r.profit)}</td>
                  <td>{r.marginPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
