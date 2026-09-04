import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../store.jsx";
import { fmt, qty as qtyFmt, UNIT_LABEL, AVAILABILITY_LABEL, AVAILABILITY_TAG } from "../lib/format.js";
import { Blueprint, Loader } from "../components/ui.jsx";

export default function Mahsulotlar() {
  const { me } = useAuth();
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const staff = me.role !== "CUSTOMER" && me.role !== "WORKER";

  useEffect(() => {
    api.get("/products").then((r) => setItems(r.items));
  }, []);

  if (!items) return <Loader />;
  const filtered = items.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <input className="input" placeholder="Nomi, material, o'lcham" value={q} onChange={(e) => setQ(e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "var(--space-4)" }}>
        {filtered.map((p) => (
          <Blueprint key={p.id} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <div style={{ fontSize: 10, letterSpacing: ".12em", color: "var(--color-accent-600)" }}>{p.sku}</div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 19, lineHeight: 1.15, color: "var(--color-accent-900)" }}>{p.name}</div>
            <div style={{ fontSize: 12, color: "var(--color-neutral-800)" }}>
              {[p.categoryName, p.material, p.quality, p.sizeLabel].filter(Boolean).join(" · ")}
            </div>
            <div style={{ fontSize: 12 }}>⭐ {p.rating?.toFixed(1) ?? "—"} / 5</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "var(--space-3)", borderTop: "1px solid var(--color-accent-200)", paddingTop: "var(--space-3)" }}>
              <span className="kicker">Narx</span>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--color-accent-800)" }}>
                {fmt(p.sellPrice)} / {UNIT_LABEL[p.unit]}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span className={`tag ${AVAILABILITY_TAG[p.availability]}`}>{AVAILABILITY_LABEL[p.availability]}</span>
              {staff && p.stockLeft != null && (
                <span className="muted">{qtyFmt(p.stockLeft, UNIT_LABEL[p.unit])}</span>
              )}
            </div>
            {staff && (
              <div style={{ fontSize: 11, color: "var(--color-accent-700)" }}>
                Tannarx {p.cost != null ? fmt(p.cost) : "—"} · min {p.minPrice != null ? fmt(p.minPrice) : "—"}
              </div>
            )}
          </Blueprint>
        ))}
      </div>
    </div>
  );
}
