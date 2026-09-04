import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../store.jsx";
import { fmt } from "../lib/format.js";
import { Kpi, Loader } from "../components/ui.jsx";

export default function Dashboard({ setPage }) {
  const { me } = useAuth();
  const [d, setD] = useState(null);

  useEffect(() => {
    api.get("/reports/dashboard").then(setD).catch(() => setD({ error: true }));
  }, []);

  if (!d) return <Loader />;
  if (d.error) return <p className="muted">Ma'lumot hozircha yo'q.</p>;

  const full = me.role === "MANAGER" || me.role === "ADMIN";

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "var(--space-4)" }}>
        <Kpi label="Bugungi savdo" value={fmt(d.today.revenue)} note={`${d.today.count} chek`} />
        <Kpi label="Kassada naqd" value={fmt(d.cashBalance)} />
        {full && <Kpi label="Bugungi sof foyda" value={fmt(d.today.netProfit)} />}
        <Kpi label="Mijoz qarzi" value={fmt(d.customerDebt)} note={`${d.debtorCount} mijoz`} />
        {full && <Kpi label="Ombor qiymati" value={fmt(d.inventoryValue)} />}
      </div>

      <div className="blueprint" style={{ padding: "var(--space-6)" }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, textTransform: "uppercase", marginBottom: "var(--space-4)" }}>
          Kam qolgan mahsulotlar
        </div>
        {d.lowStock.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>Hammasi yetarli.</p>
        ) : (
          d.lowStock.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-accent-200)" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
              <span className="tag tag-danger">{p.stockLabel}</span>
            </div>
          ))
        )}
        <button className="btn btn-ghost btn-block" style={{ marginTop: "var(--space-4)" }} onClick={() => setPage("kirim")}>
          Kirim qo'shish
        </button>
      </div>

      {full && d.topProducts?.length > 0 && (
        <div className="blueprint" style={{ padding: "var(--space-6)" }}>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, textTransform: "uppercase", marginBottom: "var(--space-4)" }}>
            Eng ko'p foyda bergan (30 kun)
          </div>
          <table className="table">
            <thead>
              <tr><th>Mahsulot</th><th>Sotildi</th><th>Foyda</th><th>%</th></tr>
            </thead>
            <tbody>
              {d.topProducts.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.qtyLabel}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmt(r.profit)}</td>
                  <td>{r.marginPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
