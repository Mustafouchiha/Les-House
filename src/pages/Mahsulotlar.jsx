import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../store.jsx";
import { fmt, qty as qtyFmt, UNIT_LABEL, AVAILABILITY_LABEL, AVAILABILITY_TAG } from "../lib/format.js";
import { Blueprint, Loader, Dialog, Toast } from "../components/ui.jsx";

const UNITS = ["M3", "M2", "METER", "PIECE", "KG", "SET"];

export default function Mahsulotlar() {
  const { me } = useAuth();
  const [items, setItems] = useState(null);
  const [cats, setCats] = useState({ categories: [], types: [] });
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // product being edited, or {} for new
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const staff = me.role !== "CUSTOMER" && me.role !== "WORKER";
  const canEdit = ["OPERATOR", "MANAGER", "ADMIN"].includes(me.role);

  const load = () => api.get("/products").then((r) => setItems(r.items));
  useEffect(() => {
    load();
    api.get("/categories").then(setCats).catch(() => {});
  }, []);

  if (!items) return <Loader />;
  const filtered = items.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  async function confirmDelete() {
    setBusy(true);
    try {
      await api.del(`/products/${deleting.id}`);
      flash(`${deleting.name} o'chirildi`);
      setDeleting(null);
      load();
    } catch (e) {
      flash(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <input className="input" placeholder="Nomi, material, o'lcham" value={q} onChange={(e) => setQ(e.target.value)} />
        {canEdit && (
          <button className="btn btn-secondary" style={{ flex: "none" }} onClick={() => setEditing({})}>
            + Yangi mahsulot
          </button>
        )}
      </div>
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
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditing(p)}>
                  Tahrirlash
                </button>
                <button className="btn btn-ghost" style={{ color: "var(--danger)" }} onClick={() => setDeleting(p)}>
                  O'chirish
                </button>
              </div>
            )}
          </Blueprint>
        ))}
      </div>

      {editing && (
        <ProductEditor
          product={editing}
          categories={cats.categories}
          onClose={() => setEditing(null)}
          onSaved={(isNew) => {
            setEditing(null);
            load();
            flash(isNew ? "Mahsulot qo'shildi" : "Saqlandi");
          }}
        />
      )}

      {deleting && (
        <Dialog
          title={`${deleting.name} — o'chirish`}
          onClose={() => !busy && setDeleting(null)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleting(null)} disabled={busy}>Bekor</button>
              <button
                className="btn btn-primary"
                style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
                onClick={confirmDelete}
                disabled={busy}
              >
                {busy ? "Bajarilmoqda…" : "O'chirish"}
              </button>
            </>
          }
        >
          <p className="muted" style={{ fontSize: 13 }}>
            Mahsulot katalog va POS'dan yashiriladi. Oldingi savdo tarixi saqlanib qoladi.
          </p>
        </Dialog>
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

// Downscale + compress a picked photo client-side so 4 images stay well
// under the API's body limit, then hand back a data: URL (no external image
// hosting is wired up, so this is stored straight in the product record).
function fileToDataUrl(file, maxDim = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Fayl o'qilmadi"));
    reader.onload = () => {
      img.onerror = () => reject(new Error("Rasm ochilmadi"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const EMPTY_FORM = {
  name: "", categoryId: "", material: "", woodType: "", quality: "",
  unit: "PIECE", sellPrice: "", minPrice: "", startPrice: "", cost: "",
  minStock: "", rating: "", note: "",
};

function ProductEditor({ product, categories, onClose, onSaved }) {
  const isNew = !product.id;
  const [f, setF] = useState(() => ({
    ...EMPTY_FORM,
    ...(isNew
      ? {}
      : {
          name: product.name ?? "",
          categoryId: product.categoryId ?? "",
          material: product.material ?? "",
          woodType: product.woodType ?? "",
          quality: product.quality ?? "",
          unit: product.unit ?? "PIECE",
          sellPrice: product.sellPrice ?? "",
          minPrice: product.minPrice ?? "",
          startPrice: product.startPrice ?? "",
          cost: product.cost ?? "",
          minStock: product.minStock ?? "",
          rating: product.rating ?? "",
          note: product.note ?? "",
        }),
  }));
  const [images, setImages] = useState(() => {
    const arr = (product.images || []).slice(0, 4);
    while (arr.length < 4) arr.push(null);
    return arr;
  });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function pickImage(i, file) {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setImages((arr) => arr.map((x, idx) => (idx === i ? dataUrl : x)));
    } catch (e) {
      setErr(e.message);
    }
  }

  async function save() {
    if (!f.name.trim()) {
      setErr("Nomi kiritilishi shart");
      return;
    }
    setBusy(true);
    setErr(null);
    const num = (v) => (v === "" || v == null ? undefined : Number(v));
    const payload = {
      name: f.name.trim(),
      categoryId: f.categoryId || null,
      material: f.material || null,
      woodType: f.woodType || null,
      quality: f.quality || null,
      unit: f.unit,
      sellPrice: num(f.sellPrice) ?? 0,
      minPrice: num(f.minPrice) ?? 0,
      startPrice: num(f.startPrice) ?? 0,
      cost: num(f.cost) ?? 0,
      minStock: num(f.minStock) ?? 0,
      rating: f.rating === "" ? null : num(f.rating),
      note: f.note || null,
      images: images.filter(Boolean).slice(0, 4),
    };
    try {
      if (isNew) await api.post("/products", payload);
      else await api.patch(`/products/${product.id}`, payload);
      onSaved(isNew);
    } catch (e) {
      setErr(e.details ? `${e.message}` : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      title={isNew ? "Yangi mahsulot" : `${product.name} — tahrirlash`}
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
      <div style={{ display: "grid", gap: "var(--space-3)", maxHeight: "60vh", overflow: "auto", paddingRight: 4 }}>
        <div className="field">
          <label>Nomi *</label>
          <input className="input" value={f.name} onChange={set("name")} placeholder="Masalan: Brus 100×100×4000" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div className="field">
            <label>Kategoriya</label>
            <select className="input" value={f.categoryId} onChange={set("categoryId")}>
              <option value="">— tanlanmagan —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>O'lchov birligi</label>
            <select className="input" value={f.unit} onChange={set("unit")}>
              {UNITS.map((u) => (
                <option key={u} value={u}>{UNIT_LABEL[u]}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div className="field">
            <label>Material</label>
            <input className="input" value={f.material} onChange={set("material")} />
          </div>
          <div className="field">
            <label>Sifat</label>
            <input className="input" value={f.quality} onChange={set("quality")} placeholder="1-sort, Premium…" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div className="field">
            <label>Sotish narxi</label>
            <input className="input" value={f.sellPrice} onChange={set("sellPrice")} placeholder="0" />
          </div>
          <div className="field">
            <label>Boshlang'ich narx</label>
            <input className="input" value={f.startPrice} onChange={set("startPrice")} placeholder="0" />
          </div>
          <div className="field">
            <label>Minimal narx</label>
            <input className="input" value={f.minPrice} onChange={set("minPrice")} placeholder="0" />
          </div>
          <div className="field">
            <label>Tannarx</label>
            <input className="input" value={f.cost} onChange={set("cost")} placeholder="0" />
          </div>
          <div className="field">
            <label>Minimal qoldiq</label>
            <input className="input" value={f.minStock} onChange={set("minStock")} placeholder="0" />
          </div>
          <div className="field">
            <label>Reyting (0–5)</label>
            <input className="input" value={f.rating} onChange={set("rating")} placeholder="4.5" />
          </div>
        </div>

        <div className="field">
          <label>Izoh</label>
          <textarea className="input" value={f.note} onChange={set("note")} />
        </div>

        <div className="field">
          <label>Rasmlar (galereyadan, ko'pi bilan 4 ta)</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "var(--space-2)" }}>
            {images.map((img, i) => (
              <label
                key={i}
                style={{
                  aspectRatio: "1", position: "relative", cursor: "pointer",
                  border: "1px dashed var(--color-accent-400)", overflow: "hidden",
                  display: "grid", placeItems: "center", background: "var(--color-accent-100)",
                }}
              >
                {img ? (
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 22, color: "var(--color-accent-400)" }}>+</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => pickImage(i, e.target.files?.[0])}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                />
                {img && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setImages((arr) => arr.map((x, idx) => (idx === i ? null : x)));
                    }}
                    style={{
                      position: "absolute", top: 2, right: 2, width: 20, height: 20,
                      border: 0, borderRadius: "50%", background: "rgba(0,0,0,.6)", color: "#fff",
                      fontSize: 12, lineHeight: "20px", padding: 0, cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                )}
              </label>
            ))}
          </div>
        </div>
      </div>
      {err && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{err}</div>}
    </Dialog>
  );
}
