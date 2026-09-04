import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../store.jsx";
import { fmt, qty as qtyFmt, UNIT_LABEL, AVAILABILITY_LABEL, AVAILABILITY_TAG } from "../lib/format.js";
import { Blueprint, Loader, Dialog, Toast } from "../components/ui.jsx";

export default function Mahsulotlar() {
  const { me } = useAuth();
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");
  const staff = me.role !== "CUSTOMER" && me.role !== "WORKER";
  const canEdit = ["OPERATOR", "MANAGER", "ADMIN"].includes(me.role);

  const load = () => api.get("/products").then((r) => setItems(r.items));
  useEffect(() => { load(); }, []);

  if (!items) return <Loader />;
  const filtered = items.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <input className="input" placeholder="Nomi, material, o'lcham" value={q} onChange={(e) => setQ(e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "var(--space-4)" }}>
        {filtered.map((p) => (
          <Blueprint key={p.id} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <ProductThumb images={p.images} />
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
            {canEdit && (
              <button className="btn btn-ghost btn-block" onClick={() => setEditing(p)}>
                Rasmlarni tahrirlash
              </button>
            )}
          </Blueprint>
        ))}
      </div>

      {editing && (
        <ImageEditor
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
            flash("Rasmlar saqlandi");
          }}
        />
      )}
      <Toast text={toast} />
    </div>
  );
}

export function ProductThumb({ images, size = 150 }) {
  const url = images?.[0];
  if (!url) {
    return (
      <div
        style={{
          height: size, display: "grid", placeItems: "center",
          background: "var(--color-accent-100)", color: "var(--color-accent-400)",
          fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase",
        }}
      >
        Rasm yo'q
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      style={{ height: size, width: "100%", objectFit: "cover", background: "var(--color-accent-100)" }}
      onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
    />
  );
}

// Up to 4 image URLs per product (spec: "postlar rasmi 1-4gacha"). No file
// storage is wired up yet, so admins paste a hosted image link per slot.
function ImageEditor({ product, onClose, onSaved }) {
  const initial = (product.images && product.images.length ? product.images : [""]).slice(0, 4);
  while (initial.length < 4) initial.push("");
  const [urls, setUrls] = useState(initial);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const images = urls.map((u) => u.trim()).filter(Boolean).slice(0, 4);
      await api.patch(`/products/${product.id}`, { images });
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      title={`${product.name} — rasmlar`}
      onClose={() => !busy && onClose()}
      actions={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>Bekor</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? "Saqlanmoqda…" : "Saqlash"}
          </button>
        </>
      }
    >
      <div style={{ display: "grid", gap: "var(--space-3)" }}>
        {urls.map((u, i) => (
          <div key={i} style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <div style={{ width: 40, height: 40, flex: "none" }}>
              <ProductThumb images={u ? [u] : []} size={40} />
            </div>
            <input
              className="input"
              placeholder={`${i + 1}-rasm URL manzili`}
              value={u}
              onChange={(e) => setUrls((s) => s.map((x, idx) => (idx === i ? e.target.value : x)))}
            />
          </div>
        ))}
      </div>
      <div className="muted" style={{ fontSize: 11, marginTop: 10 }}>
        Rasm faylni biror joyga (Telegram, Imgur, hosting) yuklab, havolasini shu yerga qo'ying. Ko'pi bilan 4 ta.
      </div>
      {err && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{err}</div>}
    </Dialog>
  );
}
