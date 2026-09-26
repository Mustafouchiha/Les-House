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

  // "bo'lim qo'sh" — let OPERATOR+ add a new category right from the product
  // form instead of asking for it to be added ahead of time.
  async function addCategory(name) {
    const c = await api.post("/categories", { name, kind: "category" });
    setCats((s) => ({ ...s, categories: [...s.categories, c].sort((a, b) => a.name.localeCompare(b.name)) }));
    return c;
  }

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
        <input className="input" placeholder="Nomi, material, o'lcham bo'yicha qidiring" value={q} onChange={(e) => setQ(e.target.value)} />
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
          onAddCategory={addCategory}
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

// `size` (px) is only passed by dense grids (e.g. the POS picker) that need a
// small fixed square and can't host click targets inside a <button> card —
// those stay to a single image. Without `size` (catalog / edit cards) it's a
// full-width square with prev/next + dots to flip through all 4 photos.
export function ProductThumb({ images, size }) {
  const list = (images || []).filter(Boolean);
  const [i, setI] = useState(0);
  const compact = !!size;
  const idx = list.length ? ((i % list.length) + list.length) % list.length : 0;

  const box = compact
    ? { width: size, height: size, background: "var(--color-accent-100)", overflow: "hidden", flex: "none" }
    : { width: "100%", aspectRatio: "1", position: "relative", background: "var(--color-accent-100)", overflow: "hidden" };

  if (!list.length) {
    return (
      <div
        style={{
          ...box, display: "grid", placeItems: "center",
          color: "var(--color-accent-400)", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase",
        }}
      >
        Rasm yo'q
      </div>
    );
  }

  return (
    <div style={box}>
      <img
        src={list[idx]}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
      />
      {!compact && list.length > 1 && (
        <>
          <span
            role="button"
            aria-label="Oldingi rasm"
            onClick={(e) => { e.stopPropagation(); setI(idx - 1); }}
            style={thumbNavStyle("left")}
          >
            ‹
          </span>
          <span
            role="button"
            aria-label="Keyingi rasm"
            onClick={(e) => { e.stopPropagation(); setI(idx + 1); }}
            style={thumbNavStyle("right")}
          >
            ›
          </span>
          <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4 }}>
            {list.map((_, di) => (
              <span
                key={di}
                style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: di === idx ? "#fff" : "rgba(255,255,255,.5)",
                  boxShadow: "0 0 2px rgba(0,0,0,.6)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function thumbNavStyle(side) {
  return {
    position: "absolute", top: "50%", [side]: 2, transform: "translateY(-50%)",
    width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,.45)", color: "#fff",
    display: "grid", placeItems: "center", fontSize: 14, lineHeight: 1, cursor: "pointer", userSelect: "none",
  };
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

export const DIM_UNITS = ["mm", "sm", "dm", "m"];
export const TO_MM = { mm: 1, sm: 10, dm: 100, m: 1000 };
const STEPS = ["Asosiy", "O'lcham", "Narx", "Qo'shimcha"];

const EMPTY_FORM = {
  name: "", categoryId: "", material: "", woodType: "", quality: "",
  unit: "PIECE",
  dimX: "", dimXUnit: "mm", dimY: "", dimYUnit: "mm", length: "", lengthUnit: "mm",
  sellPrice: "", minPrice: "", startPrice: "", cost: "",
  minStock: "", rating: "", note: "",
};

function ProductEditor({ product, categories, onAddCategory, onClose, onSaved }) {
  const isNew = !product.id;
  const [step, setStep] = useState(0);
  const [newCat, setNewCat] = useState(null); // string while the "add category" input is open
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
          dimX: product.dimX ?? "",
          dimY: product.dimY ?? "",
          length: product.length ?? "",
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
      setErr("Mahsulot nomini kiriting");
      setStep(0);
      return;
    }
    const dimKeys = [["dimX", "dimXUnit"], ["dimY", "dimYUnit"], ["length", "lengthUnit"]];
    if (dimKeys.some(([k]) => f[k] !== "" && Number(f[k]) < 0)) {
      setErr("O'lchamlar manfiy bo'lishi mumkin emas");
      setStep(1);
      return;
    }
    setBusy(true);
    setErr(null);
    const num = (v) => (v === "" || v == null ? undefined : Number(v));
    // dimensions are stored in mm; convert from each field's chosen entry unit
    const dim = (k, uk) => (num(f[k]) == null ? null : +(num(f[k]) * (TO_MM[f[uk]] || 1)).toFixed(2));
    const sell = num(f.sellPrice) ?? 0;
    const payload = {
      name: f.name.trim(),
      categoryId: f.categoryId || null,
      material: f.material || null,
      woodType: f.woodType || null,
      quality: f.quality || null,
      unit: f.unit,
      dimX: dim("dimX", "dimXUnit"),
      dimY: dim("dimY", "dimYUnit"),
      length: dim("length", "lengthUnit"),
      sellPrice: sell,
      minPrice: num(f.minPrice) ?? 0,
      startPrice: f.startPrice === "" ? sell : (num(f.startPrice) ?? sell),
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
          {step > 0 && (
            <button className="btn btn-secondary" onClick={() => setStep(step - 1)} disabled={busy}>
              Oldingi
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Keyingi</button>
          ) : (
            <button className="btn btn-primary" onClick={save} disabled={busy}>
              {busy ? "Saqlanmoqda…" : "Saqlash"}
            </button>
          )}
        </>
      }
    >
      <div className="seg" style={{ flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
        {STEPS.map((s, i) => (
          <button key={s} className={`seg-opt${step === i ? " on" : ""}`} onClick={() => setStep(i)}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: "var(--space-3)", maxHeight: "50vh", overflow: "auto", paddingRight: 4 }}>
        {step === 0 && (
          <>
            <div className="field">
              <label>Nomi *</label>
              <input className="input" value={f.name} onChange={set("name")} placeholder="Mahsulot nomini kiriting" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              <div className="field">
                <label>Kategoriya</label>
                <select
                  className="input"
                  value={f.categoryId}
                  onChange={(e) => {
                    if (e.target.value === "__new__") { setNewCat(""); return; }
                    setF((s) => ({ ...s, categoryId: e.target.value }));
                  }}
                >
                  <option value="">— tanlanmagan —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="__new__">+ Yangi kategoriya qo'shish…</option>
                </select>
                {newCat !== null && (
                  <div style={{ display: "flex", gap: "var(--space-2)", marginTop: 6 }}>
                    <input
                      className="input"
                      autoFocus
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      placeholder="Yangi kategoriya nomi"
                      onKeyDown={async (e) => {
                        if (e.key !== "Enter" || !newCat.trim()) return;
                        try {
                          const c = await onAddCategory(newCat.trim());
                          setF((s) => ({ ...s, categoryId: c.id }));
                          setNewCat(null);
                        } catch (er) {
                          setErr(er.message);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={!newCat.trim()}
                      onClick={async () => {
                        try {
                          const c = await onAddCategory(newCat.trim());
                          setF((s) => ({ ...s, categoryId: c.id }));
                          setNewCat(null);
                        } catch (er) {
                          setErr(er.message);
                        }
                      }}
                    >
                      Qo'shish
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setNewCat(null)}>Bekor</button>
                  </div>
                )}
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
                <input className="input" value={f.material} onChange={set("material")} placeholder="Masalan: Sasna, Archa" />
              </div>
              <div className="field">
                <label>Sifat</label>
                <input className="input" value={f.quality} onChange={set("quality")} placeholder="Masalan: 1-sort, Premium" />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="muted" style={{ fontSize: 12 }}>
              Har bir o'lcham uchun birlikni alohida tanlang. Bazada mm da saqlanadi.
            </div>
            {[
              ["dimX", "dimXUnit", "Qalinlik", "Masalan: 25"],
              ["dimY", "dimYUnit", "Eni", "Masalan: 150"],
              ["length", "lengthUnit", "Uzunlik", "Masalan: 3000"],
            ].map(([k, uk, label, ph]) => (
              <div className="field" key={k}>
                <label>{label}</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 84px", gap: "var(--space-2)" }}>
                  <input className="input" type="number" min="0" step="any" value={f[k]} onChange={set(k)} placeholder={ph} />
                  <select className="input" value={f[uk]} onChange={set(uk)}>
                    {DIM_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <div className="field">
              <label>Sotish narxi *</label>
              <input className="input" inputMode="decimal" value={f.sellPrice} onChange={set("sellPrice")} placeholder="Sotish narxini kiriting (so'm)" />
            </div>
            <div className="field">
              <label>Tannarx</label>
              <input className="input" inputMode="decimal" value={f.cost} onChange={set("cost")} placeholder="Tannarxni kiriting (so'm)" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              <div className="field">
                <label>Eng past narx</label>
                <input className="input" inputMode="decimal" value={f.minPrice} onChange={set("minPrice")} placeholder="Chegirmada tushmaydi (so'm)" />
              </div>
              <div className="field">
                <label>Minimal qoldiq</label>
                <input className="input" inputMode="decimal" value={f.minStock} onChange={set("minStock")} placeholder="Masalan: 10" />
              </div>
            </div>
            <div className="muted" style={{ fontSize: 11 }}>
              "Eng past narx" — sotuvchi shundan pastga tusha olmaydi. Bo'sh qoldirilsa 0.
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="field">
              <label>Ichki izoh <span className="muted">(faqat xodimlar ko'radi)</span></label>
              <textarea
                className="input"
                rows={3}
                value={f.note}
                onChange={set("note")}
                placeholder="O'zingiz uchun eslatma: yetkazib beruvchi, kelgan sana, partiya raqami…"
              />
            </div>
            <div className="field">
              <label>Reyting (0–5)</label>
              <input className="input" inputMode="decimal" value={f.rating} onChange={set("rating")} placeholder="Masalan: 4.5" />
            </div>
            <div className="field">
              <label>Rasmlar <span className="muted">(ko'pi bilan 4 ta)</span></label>
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
          </>
        )}
      </div>
      {err && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{err}</div>}
    </Dialog>
  );
}
