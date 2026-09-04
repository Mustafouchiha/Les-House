import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { fmt } from "../lib/format.js";
import { Loader, Dialog } from "../components/ui.jsx";
import Receipt from "../components/Receipt.jsx";

const PAY_LABEL = { CASH: "Naqd", CARD: "Karta", BANK: "Bank", DEBT: "Qarz", MIXED: "Aralash" };

export default function Tarix() {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => { api.get("/sales?limit=50").then((r) => setItems(r.items)); }, []);
  if (!items) return <Loader />;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <table className="table">
        <thead><tr><th>Chek</th><th>Mijoz</th><th>To'lov</th><th>Summa</th><th></th></tr></thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id}>
              <td>
                <div style={{ fontWeight: 600 }}>№ {s.number}</div>
                <div style={{ fontSize: 11, color: "var(--color-accent-700)" }}>{new Date(s.createdAt).toLocaleString("ru-RU")} · {s.sellerName}</div>
              </td>
              <td>{s.customerName || "—"}</td>
              <td><span className={`tag ${s.hasDebt ? "tag-danger" : "tag-ok"}`}>{PAY_LABEL[s.payType] || s.payType}</span></td>
              <td style={{ whiteSpace: "nowrap" }}>{fmt(s.finalTotal)}{s.status !== "COMPLETED" ? ` (${s.status})` : ""}</td>
              <td style={{ textAlign: "right" }}>
                <button className="btn btn-ghost" onClick={() => api.get(`/sales/${s.id}`).then(setOpen)}>Chek</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {open && (
        <Dialog
          title={`Chek № ${open.number}`}
          onClose={() => setOpen(null)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => window.print()}>Chop etish</button>
              <button className="btn btn-primary" onClick={() => setOpen(null)}>Yopish</button>
            </>
          }
        >
          <Receipt sale={open} />
        </Dialog>
      )}
    </div>
  );
}
