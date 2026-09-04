import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { fmt } from "../lib/format.js";
import { Blueprint, Dialog, Loader, Toast } from "../components/ui.jsx";

export default function Mijozlar() {
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState("");

  const load = () => api.get("/customers").then((r) => setItems(r.items));
  useEffect(() => { load(); }, []);

  if (!items) return <Loader />;
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2000); };
  const filtered = items.filter((c) => !q || (c.name + c.phone).toLowerCase().includes(q.toLowerCase()));

  if (active) return <CustomerCard id={active} onBack={() => { setActive(null); load(); }} flash={flash} toast={toast} />;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <input className="input" placeholder="Ism yoki telefon" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-secondary" onClick={() => setCreating(true)}>Yangi</button>
      </div>
      <table className="table">
        <thead><tr><th>Mijoz</th><th>Qarz</th><th></th></tr></thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "var(--color-accent-700)" }}>{c.phone} · {c.salesCount} savdo</div>
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
                <span className={`tag ${c.debt > 0 ? "tag-danger" : "tag-ok"}`}>{c.debt > 0 ? fmt(c.debt) : "Qarz yo'q"}</span>
              </td>
              <td style={{ textAlign: "right" }}>
                <button className="btn btn-ghost" onClick={() => setActive(c.id)}>Ochish</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {creating && (
        <CreateCustomer
          onClose={() => setCreating(false)}
          onDone={() => { setCreating(false); load(); flash("Mijoz qo'shildi"); }}
        />
      )}
      <Toast text={toast} />
    </div>
  );
}

function CreateCustomer({ onClose, onDone }) {
  const [f, setF] = useState({ name: "", phone: "", address: "", note: "" });
  const [err, setErr] = useState(null);
  return (
    <Dialog
      title="Yangi mijoz"
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Bekor</button>
          <button
            className="btn btn-primary"
            onClick={async () => {
              try {
                await api.post("/customers", f);
                onDone();
              } catch (e) {
                setErr(e.message);
              }
            }}
          >
            Saqlash
          </button>
        </>
      }
    >
      {["name", "phone", "address", "note"].map((k) => (
        <div className="field" key={k} style={{ marginBottom: 8 }}>
          <label>{{ name: "Ism", phone: "Telefon", address: "Manzil", note: "Izoh" }[k]}</label>
          <input className="input" value={f[k]} onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))} />
        </div>
      ))}
      {err && <div style={{ color: "var(--danger)", fontSize: 12 }}>{err}</div>}
    </Dialog>
  );
}

export function CustomerCard({ id, onBack, flash, toast }) {
  const [c, setC] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const load = () => api.get(`/customers/${id}`).then(setC);
  useEffect(() => { load(); }, [id]);
  if (!c) return <Loader />;

  return (
    <div className="kc-grid">
      <Blueprint>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, textTransform: "uppercase" }}>{c.name}</div>
        <div className="muted" style={{ fontSize: 12, marginBottom: "var(--space-6)" }}>{c.phone} · {c.address || "manzil yo'q"}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--color-accent-200)", paddingTop: "var(--space-4)" }}>
          <span className="kicker">Qarz</span>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 26, color: "var(--color-accent-900)" }}>{fmt(c.debt)}</span>
        </div>
        <div style={{ fontSize: 12, marginTop: 6 }} className="muted">
          Jami xarid {fmt(c.totalSpent)} · {c.salesCount} savdo
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onBack}>Orqaga</button>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={c.debt <= 0} onClick={() => setPayOpen(true)}>
            To'lov qabul qilish
          </button>
        </div>
      </Blueprint>

      <div>
        <div className="kicker" style={{ marginBottom: "var(--space-3)" }}>Xarid tarixi</div>
        {c.sales.map((s) => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-accent-200)" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>№ {s.number}</div>
              <div style={{ fontSize: 11, color: "var(--color-accent-700)" }}>{s.meta}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{fmt(s.finalTotal)}</div>
              <span className={`tag ${s.hasDebt ? "tag-danger" : "tag-ok"}`}>{s.payLabel}</span>
            </div>
          </div>
        ))}
      </div>

      {payOpen && (
        <Dialog
          title="To'lov qabul qilish"
          onClose={() => setPayOpen(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setPayOpen(false)}>Bekor</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  await api.post(`/customers/${id}/debt-payment`, { amount: Number(String(amount).replace(/\s/g, "").replace(",", ".")) });
                  setPayOpen(false);
                  setAmount("");
                  flash?.("To'lov qabul qilindi");
                  load();
                }}
              >
                Qabul qilish
              </button>
            </>
          }
        >
          <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>{c.name} · qarz {fmt(c.debt)}</div>
          <div className="field">
            <label>Summa</label>
            <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </Dialog>
      )}
      <Toast text={toast} />
      <style>{`.kc-grid{display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);gap:var(--space-4);align-items:start}
        @media(max-width:860px){.kc-grid{grid-template-columns:1fr}}`}</style>
    </div>
  );
}
