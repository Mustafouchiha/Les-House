import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client.js";
import { useAuth, useCart } from "../store.jsx";
import { fmt, qty as qtyFmt, UNIT_LABEL, parseNum, AVAILABILITY_LABEL } from "../lib/format.js";
import { Blueprint, Corners, Toast, Loader, PriceDot, priceHealth } from "../components/ui.jsx";
import Receipt from "../components/Receipt.jsx";
import { ProductThumb } from "./Mahsulotlar.jsx";

export default function Savdo() {
  const { me } = useAuth();
  const cart = useCart();
  const [step, setStep] = useState("cart"); // cart | pay | done
  const [products, setProducts] = useState(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Barchasi");
  const [cats, setCats] = useState(["Barchasi"]);
  const [toast, setToast] = useState("");
  const [lastSale, setLastSale] = useState(null);

  useEffect(() => {
    api.get("/products").then((r) => {
      setProducts(r.items);
      setCats(["Barchasi", ...Array.from(new Set(r.items.map((p) => p.categoryName).filter(Boolean)))]);
    });
  }, []);

  const flash = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter(
      (p) =>
        (cat === "Barchasi" || p.categoryName === cat) &&
        (!q || (p.name + " " + (p.sku || "")).toLowerCase().includes(q.toLowerCase()))
    );
  }, [products, q, cat]);

  if (!products) return <Loader />;

  if (step === "done" && lastSale)
    return (
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <Receipt sale={lastSale} />
        <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => window.print()}>
            Chek chiqarish
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => {
              cart.clear();
              setLastSale(null);
              setStep("cart");
            }}
          >
            Yangi savdo
          </button>
        </div>
      </div>
    );

  if (step === "pay")
    return (
      <PayStep
        cart={cart}
        onBack={() => setStep("cart")}
        onDone={(sale) => {
          setLastSale(sale);
          setStep("done");
        }}
        flash={flash}
        toast={toast}
      />
    );

  // ---- cart step ----
  return (
    <div className="pos-grid">
      <div>
        <input
          className="input"
          placeholder="Mahsulot qidirish yoki SKU"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ marginBottom: "var(--space-4)" }}
        />
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
          {cats.map((c) => (
            <button
              key={c}
              className={`seg-opt${cat === c ? " on" : ""}`}
              style={{ border: "1px solid var(--color-accent-300)", borderRadius: 3 }}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="pos-products">
          {filtered.map((p) => (
            <button
              key={p.id}
              className="pos-card"
              disabled={p.availability === "OUT"}
              onClick={() => {
                cart.add(p);
                flash(`${p.name} savatga qo'shildi`);
              }}
            >
              <ProductThumb images={p.images} size={72} />
              <span style={{ fontSize: 10, letterSpacing: ".12em", color: "var(--color-accent-600)" }}>{p.sku}</span>
              <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25 }}>{p.name}</span>
              <span style={{ marginTop: "auto", fontFamily: "var(--font-heading)", fontSize: 16, color: "var(--color-accent-800)" }}>
                {fmt(p.sellPrice)} / {UNIT_LABEL[p.unit]}
              </span>
              <span style={{ fontSize: 11, color: "var(--color-accent-700)" }}>
                {p.stockLeft != null
                  ? `qoldiq ${qtyFmt(p.stockLeft, UNIT_LABEL[p.unit])}`
                  : AVAILABILITY_LABEL[p.availability]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Blueprint style={{ position: "sticky", top: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 18, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--color-accent-900)" }}>
            Savat
          </span>
          <span style={{ fontSize: 11, color: "var(--color-accent-700)" }}>{cart.count} pozitsiya</span>
        </div>

        {cart.count === 0 ? (
          <div style={{ border: "1px dashed var(--color-accent-400)", padding: "var(--space-8)", textAlign: "center", fontSize: 13, color: "var(--color-accent-700)" }}>
            Mahsulot tanlanmagan
          </div>
        ) : (
          cart.lines.map((l) => <CartLine key={l.productId} l={l} cart={cart} me={me} />)
        )}

        <Totals cart={cart} />

        <button
          className="btn btn-primary btn-block"
          disabled={cart.count === 0}
          onClick={() => setStep("pay")}
        >
          To'lovga o'tish
        </button>
      </Blueprint>

      <Toast text={toast} />
      <style>{`
        .pos-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:var(--space-4);align-items:start}
        .pos-products{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:var(--space-3)}
        .pos-card{border:1px solid var(--color-accent-300);background:transparent;padding:var(--space-4);text-align:left;cursor:pointer;color:var(--color-text);min-height:104px;display:flex;flex-direction:column;gap:var(--space-2)}
        .pos-card:hover:not(:disabled){border-color:var(--color-accent);background:var(--color-accent-100)}
        .pos-card:disabled{opacity:.5;cursor:not-allowed}
        @media (max-width:860px){ .pos-grid{grid-template-columns:1fr} }
      `}</style>
    </div>
  );
}

function CartLine({ l, cart, me }) {
  const unit = UNIT_LABEL[l.unit];
  const canOverride = me.role === "ADMIN";
  const h = priceHealth(l.price, l.minPrice, l.startPrice);
  const remaining = l.stockLeft != null ? l.stockLeft - l.qty : null;
  const step = l.unit === "M3" ? 0.5 : 5;
  return (
    <div style={{ padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-accent-200)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</span>
        <button
          onClick={() => cart.remove(l.productId)}
          style={{ border: 0, background: "transparent", color: "var(--color-accent-700)", cursor: "pointer", fontSize: 15 }}
        >
          ×
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <button className="btn btn-icon" onClick={() => cart.update(l.productId, { qty: Math.max(0, +(l.qty - step).toFixed(3)) })}>
          −
        </button>
        <input
          className="input"
          style={{ width: 78, textAlign: "center" }}
          value={String(l.qty).replace(".", ",")}
          onChange={(e) => cart.update(l.productId, { qty: parseNum(e.target.value), mode: "qty" })}
        />
        <span style={{ fontSize: 12 }}>{unit}</span>
        <button className="btn btn-icon" onClick={() => cart.update(l.productId, { qty: +(l.qty + step).toFixed(3) })}>
          +
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <label style={{ fontSize: 11, color: "var(--color-accent-800)" }}>Narx</label>
        <input
          className="input"
          style={{ width: 110 }}
          value={String(l.price)}
          onChange={(e) => cart.setPrice(l.productId, e.target.value)}
        />
        <label style={{ fontSize: 11, color: "var(--color-accent-800)" }}>Jami</label>
        <input
          className="input"
          style={{ width: 120 }}
          value={l.mode === "total" ? Math.round(l.price * l.qty) : ""}
          placeholder={fmt(l.price * l.qty)}
          onChange={(e) => cart.setLineTotal(l.productId, e.target.value)}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <PriceDot price={l.price} minPrice={l.minPrice} startPrice={l.startPrice} />
        <span style={{ color: remaining != null && remaining < 0 ? "var(--danger)" : "var(--color-neutral-700)" }}>
          {l.stockLeft != null
            ? `omborda ${qtyFmt(l.stockLeft, unit)} · qoladi ${qtyFmt(remaining, unit)}`
            : ""}
        </span>
      </div>
      {h.blocked && (
        <div style={{ fontSize: 11, color: "var(--danger)" }}>
          Minimal narxdan past{canOverride ? " — admin sifatida tasdiqlash mumkin" : " — savdo bloklanadi"}
        </div>
      )}
    </div>
  );
}

function Totals({ cart }) {
  const [totalText, setTotalText] = useState(String(Math.round(cart.finalTotal)));
  const editingRef = useRef(false);

  useEffect(() => {
    if (!editingRef.current) setTotalText(String(Math.round(cart.finalTotal)));
  }, [cart.finalTotal]);

  return (
    <div style={{ margin: "var(--space-6) 0 var(--space-4)", display: "grid", gap: "var(--space-2)" }}>
      <Row label="Oraliq" value={fmt(cart.subtotal)} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 12 }}>Chegirma</span>
        <input className="input" style={{ width: 120 }} value={String(cart.discount)} onChange={(e) => cart.setDiscount(e.target.value)} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 12 }}>Yaxlitlash</span>
        <input className="input" style={{ width: 120 }} value={String(cart.rounding)} onChange={(e) => cart.setRounding(e.target.value)} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-accent-300)", paddingTop: "var(--space-3)" }}>
        <span className="kicker">Jami</span>
        <input
          className="input"
          style={{
            width: 150, textAlign: "right", fontFamily: "var(--font-heading)",
            fontWeight: 600, fontSize: 22, color: "var(--color-accent-900)",
          }}
          value={totalText}
          onFocus={() => { editingRef.current = true; }}
          onBlur={() => {
            editingRef.current = false;
            setTotalText(String(Math.round(cart.finalTotal)));
          }}
          onChange={(e) => {
            setTotalText(e.target.value);
            cart.setFinalTotal(e.target.value);
          }}
        />
      </div>
      <div className="muted" style={{ fontSize: 11, textAlign: "right" }}>
        Jamini o'zgartirsangiz, yaxlitlash avtomatik moslashadi
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const PAY_MODES = [
  { value: "CASH", label: "Naqd" },
  { value: "CARD", label: "Karta" },
  { value: "BANK", label: "Bank" },
  { value: "DEBT", label: "Qarz" },
  { value: "MIXED", label: "Aralash" },
];

function PayStep({ cart, onBack, onDone, flash, toast }) {
  const { me } = useAuth();
  const [mode, setMode] = useState("CASH");
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [split, setSplit] = useState({ CASH: "", CARD: "", BANK: "", DEBT: "" });
  const [note, setNote] = useState("");
  const [override, setOverride] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get("/customers").then((r) => setCustomers(r.items)).catch(() => {});
  }, []);

  const total = cart.finalTotal;
  const needsCustomer = mode === "DEBT" || (mode === "MIXED" && parseNum(split.DEBT) > 0);

  function buildPayments() {
    if (mode === "MIXED") {
      return Object.entries(split)
        .map(([type, v]) => ({ type, amount: parseNum(v) }))
        .filter((p) => p.amount > 0);
    }
    return [{ type: mode, amount: total }];
  }

  async function confirm() {
    setErr(null);
    const payments = buildPayments();
    const sum = payments.reduce((a, p) => a + p.amount, 0);
    if (Math.abs(sum - total) > 1) {
      setErr(`To'lovlar yig'indisi ${fmt(sum)}, jami ${fmt(total)} — mos kelmadi.`);
      return;
    }
    if (needsCustomer && !customerId) {
      setErr("Qarz uchun mijozni tanlang.");
      return;
    }
    setBusy(true);
    try {
      const sale = await api.post("/sales", {
        customerId: customerId || null,
        discount: parseNum(cart.discount),
        roundingDiscount: parseNum(cart.rounding),
        note,
        allowBelowMin: override,
        items: cart.lines.map((l) => ({
          productId: l.productId,
          quantity: l.qty,
          unitPrice: l.price,
        })),
        payments,
      });
      onDone(sale);
    } catch (e) {
      setErr(e.details ? `${e.message}: ${JSON.stringify(e.details)}` : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", display: "grid", gap: "var(--space-4)" }}>
      <div className="blueprint" style={{ padding: "var(--space-8)", textAlign: "center", background: "var(--color-accent-900)", color: "#fff", borderColor: "var(--color-accent-900)" }}>
        <Corners />
        <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--color-accent-300)" }}>To'lanadi</div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 42, marginTop: "var(--space-2)" }}>{fmt(total)}</div>
        <div style={{ fontSize: 12, color: "var(--color-accent-200)" }}>{cart.count} pozitsiya</div>
      </div>

      <div className="field">
        <label>To'lov turi</label>
        <div className="seg" style={{ flexWrap: "wrap" }}>
          {PAY_MODES.map((m) => (
            <button key={m.value} className={`seg-opt${mode === m.value ? " on" : ""}`} onClick={() => setMode(m.value)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "MIXED" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          {["CASH", "CARD", "BANK", "DEBT"].map((t) => (
            <div className="field" key={t}>
              <label>{PAY_MODES.find((m) => m.value === t).label}</label>
              <input className="input" value={split[t]} onChange={(e) => setSplit((s) => ({ ...s, [t]: e.target.value }))} />
            </div>
          ))}
        </div>
      )}

      {needsCustomer && (
        <div className="field">
          <label>Mijoz</label>
          <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">— tanlang —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.phone}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label>Izoh</label>
        <input className="input" placeholder="Mashina raqami, manzil…" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      {me.role === "ADMIN" && (
        <label style={{ display: "flex", gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
          Minimal narxdan past savdoga ruxsat (admin)
        </label>
      )}

      {err && <div style={{ color: "var(--danger)", fontSize: 12 }}>{err}</div>}

      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onBack} disabled={busy}>
          Orqaga
        </button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={confirm} disabled={busy}>
          {busy ? "Saqlanmoqda…" : "Tasdiqlash"}
        </button>
      </div>
      <Toast text={toast} />
    </div>
  );
}
