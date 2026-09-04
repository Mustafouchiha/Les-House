import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { fmt } from "../lib/format.js";
import { Kpi, Loader, Dialog, Toast } from "../components/ui.jsx";

const STATUS_LABEL = {
  UNPAID: "To'lanmagan",
  PARTIAL: "Qisman to'langan",
  PAID: "To'liq to'langan",
  OVERDUE: "Muddati o'tgan",
};

export default function Qarzlar() {
  const [d, setD] = useState(null);
  const [pay, setPay] = useState(null);
  const [amount, setAmount] = useState("");
  const [toast, setToast] = useState("");

  const load = () => api.get("/customers/debtors").then(setD);
  useEffect(() => { load(); }, []);
  if (!d) return <Loader />;
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2000); };

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "var(--space-4)" }}>
        <Kpi label="Umumiy qarz" value={fmt(d.total)} />
        <Kpi label="Qarzdor" value={d.debtors.length} />
        <Kpi label="Muddati o'tgan" value={d.overdue} />
      </div>
      {d.debtors.map((c) => (
        <div key={c.id} style={{ border: "1px solid var(--color-accent-300)", padding: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
            <div style={{ fontSize: 11, color: "var(--color-accent-700)" }}>{c.phone}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 20 }}>{fmt(c.debt)}</div>
              <span className={`tag ${c.status === "OVERDUE" ? "tag-danger" : "tag-warn"}`}>{STATUS_LABEL[c.status] || c.status}</span>
            </div>
            <button className="btn btn-secondary" onClick={() => setPay(c)}>To'lov</button>
          </div>
        </div>
      ))}

      {pay && (
        <Dialog
          title={`${pay.name} — to'lov`}
          onClose={() => setPay(null)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setPay(null)}>Bekor</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  await api.post(`/customers/${pay.id}/debt-payment`, {
                    amount: Number(String(amount).replace(/\s/g, "").replace(",", ".")),
                  });
                  setPay(null);
                  setAmount("");
                  flash("To'lov qabul qilindi");
                  load();
                }}
              >
                Qabul qilish
              </button>
            </>
          }
        >
          <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Qarz: {fmt(pay.debt)}</div>
          <div className="field">
            <label>Summa</label>
            <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </Dialog>
      )}
      <Toast text={toast} />
    </div>
  );
}
