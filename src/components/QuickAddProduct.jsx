import { useState } from "react";
import { api } from "../api/client.js";
import { Dialog } from "./ui.jsx";
import { UNIT_LABEL } from "../lib/format.js";
import { DIM_UNITS, TO_MM } from "../pages/Mahsulotlar.jsx";

const UNITS = ["PIECE", "M3", "M2", "METER", "KG", "SET"];
const DIM_FIELDS = [
  ["dimX", "dimXUnit", "Qalinlik"],
  ["dimY", "dimYUnit", "Eni"],
  ["length", "lengthUnit", "Uzunlik"],
];

// Katalogga hali kiritilmagan mahsulotni to'g'ridan-to'g'ri savdoga qo'shish:
// nomi + narxi + (ixtiyoriy) o'lchami bilan. Ortidan mahsulot avtomatik
// yaratiladi (keyinroq Mahsulotlar bo'limida to'ldirsa bo'ladi) va aynan shu
// miqdorda kirim qilinadi — savdo mexanizmi (stok tekshiruvi) o'zgarmaydi.
export default function QuickAddProduct({ onClose, onAdded }) {
  const [f, setF] = useState({
    name: "", unit: "PIECE", qty: "1", sellPrice: "", cost: "",
    dimX: "", dimXUnit: "mm", dimY: "", dimYUnit: "mm", length: "", lengthUnit: "mm",
  });
  const [costTouched, setCostTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function save() {
    const price = Number(f.sellPrice);
    const qty = Number(f.qty);
    const cost = Number(costTouched && f.cost !== "" ? f.cost : f.sellPrice);
    if (!f.name.trim()) return setErr("Mahsulot nomini kiriting");
    if (!(price > 0)) return setErr("Narxni kiriting");
    if (!(qty > 0)) return setErr("Miqdorni kiriting");

    setBusy(true);
    setErr(null);
    const dim = (v, u) => (v === "" ? null : +(Number(v) * (TO_MM[u] || 1)).toFixed(2));
    try {
      const product = await api.post("/products", {
        name: f.name.trim(),
        unit: f.unit,
        sellPrice: price,
        startPrice: price,
        minPrice: 0,
        cost,
        dimX: dim(f.dimX, f.dimXUnit),
        dimY: dim(f.dimY, f.dimYUnit),
        length: dim(f.length, f.lengthUnit),
        note: "Savdo ekranidan tezkor qo'shildi",
      });
      await api.post("/inventory/entry", { productId: product.id, quantity: qty, unitCost: cost });
      onAdded({ ...product, stockLeft: qty }, qty);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      title="Yo'q mahsulot qo'shish"
      onClose={() => !busy && onClose()}
      actions={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>Bekor</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? "Qo'shilmoqda…" : "Savatga qo'shish"}
          </button>
        </>
      }
    >
      <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
        Katalogda yo'q mahsulotni shu yerdan sotib yuborish mumkin — u avtomatik
        yaratiladi, qolgan ma'lumotlarini (rasm, kategoriya…) keyinroq Mahsulotlar
        bo'limida to'ldirasiz.
      </p>
      <div className="field" style={{ marginBottom: 8 }}>
        <label>Nomi *</label>
        <input className="input" value={f.name} onChange={set("name")} placeholder="Mahsulot nomini kiriting" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: 8 }}>
        <div className="field">
          <label>Narxi *</label>
          <input
            className="input"
            inputMode="decimal"
            value={f.sellPrice}
            onChange={(e) => {
              const v = e.target.value;
              setF((s) => ({ ...s, sellPrice: v, cost: costTouched ? s.cost : v }));
            }}
            placeholder="Narxni kiriting (so'm)"
          />
        </div>
        <div className="field">
          <label>Miqdori *</label>
          <input className="input" inputMode="decimal" value={f.qty} onChange={set("qty")} placeholder="Miqdorni kiriting" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: 10 }}>
        <div className="field">
          <label>O'lchov birligi</label>
          <select className="input" value={f.unit} onChange={set("unit")}>
            {UNITS.map((u) => <option key={u} value={u}>{UNIT_LABEL[u]}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Tannarx <span className="muted">(ixtiyoriy)</span></label>
          <input
            className="input"
            inputMode="decimal"
            value={f.cost}
            onChange={(e) => { setCostTouched(true); setF((s) => ({ ...s, cost: e.target.value })); }}
            placeholder="Bo'sh qoldirsa narxga teng"
          />
        </div>
      </div>
      <div className="field">
        <label>O'lcham <span className="muted">(ixtiyoriy)</span></label>
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          {DIM_FIELDS.map(([k, uk, label]) => (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "68px 1fr 74px", gap: "var(--space-2)", alignItems: "center" }}>
              <span style={{ fontSize: 12 }}>{label}</span>
              <input className="input" type="number" min="0" step="any" value={f[k]} onChange={set(k)} placeholder="Masalan: 25" />
              <select className="input" value={f[uk]} onChange={set(uk)}>
                {DIM_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      {err && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{err}</div>}
    </Dialog>
  );
}
