import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth, useCart } from "../store.jsx";
import { fmt, qty as qtyFmt, UNIT_LABEL, AVAILABILITY_LABEL, AVAILABILITY_TAG } from "../lib/format.js";
import { Blueprint, Loader } from "../components/ui.jsx";

// Customer-facing: catalog + estimate cart + purchase history + profile.
// Never shows cost, min price, supplier, margins (spec §11, §34).
export default function CustomerCatalog({ customerTab = "catalog" }) {
  const { me } = useAuth();
  const cart = useCart();
  const [products, setProducts] = useState(null);
  const [orders, setOrders] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.items));
    if (customerTab === "orders" || customerTab === "me")
      api.get("/me/purchases").then((r) => setOrders(r.items)).catch(() => setOrders([]));
  }, [customerTab]);

  if (!products) return <Loader />;

  if (customerTab === "cart") {
    return (
      <div style={{ display: "grid", gap: "var(--space-4)", maxWidth: 520, margin: "0 auto" }}>
        <div className="kicker">Taxminiy xarid hisobi</div>
        {cart.count === 0 ? (
          <p className="muted">Savat bo'sh. Katalogdan mahsulot tanlang.</p>
        ) : (
          <Blueprint>
            {cart.lines.map((l) => (
              <div key={l.productId} style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-accent-200)" }}>
                <span style={{ fontSize: 13 }}>{l.name} × {qtyFmt(l.qty, UNIT_LABEL[l.unit])}</span>
                <span>{fmt(l.price * l.qty)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-4)", fontFamily: "var(--font-heading)", fontSize: 22 }}>
              <span>Jami</span>
              <span>{fmt(cart.subtotal)}</span>
            </div>
            <button className="btn btn-secondary btn-block" style={{ marginTop: "var(--space-3)" }} onClick={cart.clear}>Tozalash</button>
          </Blueprint>
        )}
      </div>
    );
  }

  if (customerTab === "orders" || customerTab === "me") {
    return (
      <div style={{ display: "grid", gap: "var(--space-4)", maxWidth: 560, margin: "0 auto" }}>
        {customerTab === "me" && (
          <Blueprint>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{me.firstName} {me.lastName}</div>
            <div className="muted" style={{ fontSize: 12 }}>{me.phoneNumber}</div>
          </Blueprint>
        )}
        <div className="kicker">Xaridlar tarixi</div>
        {!orders ? <Loader /> : orders.length === 0 ? (
          <p className="muted">Hozircha xarid yo'q.</p>
        ) : (
          orders.map((o) => (
            <div key={o.id} style={{ border: "1px solid var(--color-accent-200)", padding: "var(--space-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b>№ {o.number}</b>
                <span>{fmt(o.finalTotal)}</span>
              </div>
              <div className="muted" style={{ fontSize: 12 }}>{new Date(o.createdAt).toLocaleDateString("ru-RU")}</div>
              {o.items.map((it, i) => (
                <div key={i} style={{ fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                  <span>{it.name} × {qtyFmt(it.quantity, UNIT_LABEL[it.unit])}</span>
                  <span>{fmt(it.lineTotal)}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    );
  }

  // default: catalog
  const filtered = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <input className="input" placeholder="Mahsulot qidirish" value={q} onChange={(e) => setQ(e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "var(--space-3)" }}>
        {filtered.map((p) => (
          <Blueprint key={p.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 17, color: "var(--color-accent-900)" }}>{p.name}</div>
            <div style={{ fontSize: 12 }} className="muted">
              {[p.sizeLabel, p.material, p.quality].filter(Boolean).join(" · ")}
            </div>
            <div style={{ fontSize: 12 }}>⭐ {p.rating?.toFixed(1) ?? "—"} / 5</div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, color: "var(--color-accent-800)" }}>
              {fmt(p.sellPrice)} / {UNIT_LABEL[p.unit]}
            </div>
            <span className={`tag ${AVAILABILITY_TAG[p.availability]}`} style={{ alignSelf: "start" }}>
              {AVAILABILITY_LABEL[p.availability]}
            </span>
            <button
              className="btn btn-secondary btn-block"
              disabled={p.availability === "OUT"}
              onClick={() => cart.add(p, p.unit === "M3" ? 1 : 1)}
            >
              Savatga
            </button>
          </Blueprint>
        ))}
      </div>
    </div>
  );
}
