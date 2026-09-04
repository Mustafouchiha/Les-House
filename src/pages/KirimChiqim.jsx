import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { fmt, parseNum, UNIT_LABEL } from "../lib/format.js";
import { Blueprint, Toast, Loader } from "../components/ui.jsx";

const EXIT_REASONS = ["Buzildi", "Sinib qoldi", "Namlandi", "O'zimiz ishlatdik", "Qaytarildi", "Boshqa"];

export default function KirimChiqim() {
  const [tab, setTab] = useState("kirim");
  const [products, setProducts] = useState(null);
  const [moves, setMoves] = useState([]);
  const [f, setF] = useState({ productId: "", quantity: "", price: "", counter: "", note: "" });
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const load = () => {
    api.get("/products").then((r) => {
      setProducts(r.items);
      setF((s) => ({ ...s, productId: s.productId || r.items[0]?.id || "" }));
    });
    api.get("/inventory/movements?limit=12").then((r) => setMoves(r.items)).catch(() => {});
  };
  useEffect(load, []);

  if (!products) return <Loader />;
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const sum = parseNum(f.quantity) * parseNum(f.price);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      if (tab === "kirim") {
        await api.post("/inventory/entry", {
          productId: f.productId,
          quantity: parseNum(f.quantity),
          unitCost: parseNum(f.price),
          supplierName: f.counter,
          note: f.note,
        });
      } else {
        await api.post("/inventory/exit", {
          productId: f.productId,
          quantity: parseNum(f.quantity),
          reason: f.counter || "Boshqa",
          note: f.note,
        });
      }
      flash(tab === "kirim" ? "Kirim qayd etildi" : "Chiqim qayd etildi");
      setF((s) => ({ ...s, quantity: "", price: "", note: "" }));
      load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="kc-grid">
      <Blueprint style={{ display: "grid", gap: "var(--space-4)" }}>
        <div className="seg">
          <button className={`seg-opt${tab === "kirim" ? " on" : ""}`} onClick={() => setTab("kirim")}>Kirim</button>
          <button className={`seg-opt${tab === "chiqim" ? " on" : ""}`} onClick={() => setTab("chiqim")}>Chiqim</button>
        </div>
        <div className="field">
          <label>Mahsulot</label>
          <select className="input" value={f.productId} onChange={(e) => setF((s) => ({ ...s, productId: e.target.value }))}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({UNIT_LABEL[p.unit]})</option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
          <div className="field">
            <label>Miqdor</label>
            <input className="input" value={f.quantity} onChange={(e) => setF((s) => ({ ...s, quantity: e.target.value }))} placeholder="0,00" />
          </div>
          {tab === "kirim" && (
            <div className="field">
              <label>Tannarx (1 birlik)</label>
              <input className="input" value={f.price} onChange={(e) => setF((s) => ({ ...s, price: e.target.value }))} placeholder="0" />
            </div>
          )}
        </div>
        <div className="field">
          <label>{tab === "kirim" ? "Ta'minotchi" : "Sabab"}</label>
          {tab === "kirim" ? (
            <input className="input" value={f.counter} onChange={(e) => setF((s) => ({ ...s, counter: e.target.value }))} />
          ) : (
            <select className="input" value={f.counter} onChange={(e) => setF((s) => ({ ...s, counter: e.target.value }))}>
              <option value="">— tanlang —</option>
              {EXIT_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          )}
        </div>
        <div className="field">
          <label>Izoh</label>
          <input className="input" value={f.note} onChange={(e) => setF((s) => ({ ...s, note: e.target.value }))} placeholder="Yuk xati, mashina…" />
        </div>
        {tab === "kirim" && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--color-accent-200)", paddingTop: "var(--space-4)" }}>
            <span className="kicker">Summa</span>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 22 }}>{fmt(sum)}</span>
          </div>
        )}
        {err && <div style={{ color: "var(--danger)", fontSize: 12 }}>{err}</div>}
        <button className="btn btn-primary btn-block" onClick={submit} disabled={busy}>Saqlash</button>
      </Blueprint>

      <div>
        <div className="kicker" style={{ marginBottom: "var(--space-3)" }}>Oxirgi harakatlar</div>
        {moves.map((m) => (
          <div key={m.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-accent-200)" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{m.productName}</div>
              <div style={{ fontSize: 11, color: "var(--color-accent-700)" }}>{m.meta}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{m.deltaLabel}</div>
              <span className={`tag ${m.type === "IN" ? "tag-ok" : "tag-warn"}`}>{m.typeLabel}</span>
            </div>
          </div>
        ))}
      </div>

      <Toast text={toast} />
      <style>{`.kc-grid{display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);gap:var(--space-4);align-items:start}
        @media(max-width:860px){.kc-grid{grid-template-columns:1fr}}`}</style>
    </div>
  );
}
