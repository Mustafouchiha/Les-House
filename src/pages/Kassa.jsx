import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { fmt } from "../lib/format.js";
import { Blueprint, Loader } from "../components/ui.jsx";

export default function Kassa() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/cash/today").then(setD).catch(() => setD({ rows: [], balance: 0 })); }, []);
  if (!d) return <Loader />;

  return (
    <div className="kc-grid">
      <Blueprint>
        <div className="kicker">Bugungi kassa</div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 30, margin: "var(--space-2) 0", color: "var(--color-accent-900)" }}>
          {fmt(d.balance)}
        </div>
        <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
          <Row label="Naqd tushum" value={fmt(d.cashIn)} />
          <Row label="Karta" value={fmt(d.cardIn)} />
          <Row label="Bank" value={fmt(d.bankIn)} />
          <Row label="Qarzdan tushdi" value={fmt(d.debtIn)} />
          <Row label="Chiqim" value={"−" + fmt(d.out)} />
        </div>
      </Blueprint>
      <div>
        <div className="kicker" style={{ marginBottom: "var(--space-3)" }}>Bugungi harakatlar</div>
        <table className="table">
          <thead><tr><th>Vaqt</th><th>Izoh</th><th>Summa</th></tr></thead>
          <tbody>
            {d.rows.map((r) => (
              <tr key={r.id}>
                <td>{r.time}</td>
                <td>{r.note}</td>
                <td style={{ whiteSpace: "nowrap" }}>{fmt(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`.kc-grid{display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);gap:var(--space-4);align-items:start}
        @media(max-width:860px){.kc-grid{grid-template-columns:1fr}}`}</style>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span className="muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
