import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useCart } from "../store.jsx";
import { fmt, parseNum, UNIT_LABEL } from "../lib/format.js";
import { Blueprint, Loader, Toast } from "../components/ui.jsx";

export default function Kalkulyator({ setPage }) {
  const cart = useCart();
  const [products, setProducts] = useState(null);
  const [pid, setPid] = useState("");
  const [f, setF] = useState({ t: "25", w: "150", l: "3000", n: "120" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.get("/products").then((r) => {
      setProducts(r.items);
      setPid(r.items[0]?.id || "");
    });
  }, []);

  const p = useMemo(() => products?.find((x) => x.id === pid), [products, pid]);

  // m³ = (t/1000)·(w/1000)·(l/1000)·n   (ported from the mockup)
  const volume = (parseNum(f.t) / 1000) * (parseNum(f.w) / 1000) * (parseNum(f.l) / 1000) * parseNum(f.n);
  const price = p ? (p.unit === "M3" ? volume * p.sellPrice : parseNum(f.n) * p.sellPrice) : 0;

  if (!products) return <Loader />;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", display: "grid", gap: "var(--space-4)" }}>
      <Blueprint style={{ display: "grid", gap: "var(--space-4)" }}>
        <div className="field">
          <label>Mahsulot</label>
          <select className="input" value={pid} onChange={(e) => setPid(e.target.value)}>
            {products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-3)" }}>
          {[["t", "Qalinlik, mm"], ["w", "Kenglik, mm"], ["l", "Uzunlik, mm"]].map(([k, label]) => (
            <div className="field" key={k}>
              <label>{label}</label>
              <input className="input" value={f[k]} onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="field">
          <label>Dona soni</label>
          <input className="input" value={f.n} onChange={(e) => setF((s) => ({ ...s, n: e.target.value }))} />
        </div>
        <div style={{ borderTop: "1px solid var(--color-accent-200)", paddingTop: "var(--space-4)", display: "grid", gap: "var(--space-2)" }}>
          <Row label="Hajm" value={volume.toFixed(3).replace(".", ",") + " m³"} />
          <Row label="Taxminiy narx" value={fmt(price)} />
        </div>
        <div className="muted" style={{ fontSize: 11 }}>* Natija taxminiy hisob.</div>
        <button
          className="btn btn-primary btn-block"
          onClick={() => {
            cart.add(p, p.unit === "M3" ? +volume.toFixed(2) : parseNum(f.n));
            setToast("Savatga qo'shildi");
            setTimeout(() => setPage?.("savdo"), 700);
          }}
        >
          Savatga qo'shish
        </button>
      </Blueprint>
      <Toast text={toast} />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span className="kicker">{label}</span>
      <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, color: "var(--color-accent-900)" }}>{value}</span>
    </div>
  );
}
