import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { fmt } from "../lib/format.js";
import { useAuth } from "../store.jsx";
import { Blueprint, Dialog, Loader, Toast } from "../components/ui.jsx";

const ROLE_LABEL = {
  ADMIN: "Administrator",
  MANAGER: "Ish boshqaruvchi",
  OPERATOR: "Operator",
  WORKER: "Sotuvchi",
  CUSTOMER: "Mijoz",
};
const ROLES = ["CUSTOMER", "WORKER", "OPERATOR", "MANAGER", "ADMIN"];
const STATUS_LABEL = { PENDING: "Kutilmoqda", ACTIVE: "Faol", SUSPENDED: "To'xtatilgan", BLOCKED: "Bloklangan" };

export default function Mijozlar() {
  const { me } = useAuth();
  const isAdmin = me?.role === "ADMIN";
  const [tab, setTab] = useState("customers");

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {isAdmin && (
        <div className="seg" style={{ alignSelf: "flex-start", flexWrap: "wrap" }}>
          <button className={`seg-opt${tab === "customers" ? " on" : ""}`} onClick={() => setTab("customers")}>Mijozlar</button>
          <button className={`seg-opt${tab === "users" ? " on" : ""}`} onClick={() => setTab("users")}>Ilova foydalanuvchilari</button>
        </div>
      )}
      {tab === "users" && isAdmin ? <AppUsers /> : <CustomerList />}
    </div>
  );
}

/* ------------------------------------------------------------------ customers */

function CustomerList() {
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
                <div style={{ fontWeight: 600 }}>
                  {c.name}
                  {c.blocked && <span className="tag tag-danger" style={{ marginLeft: 6 }}>Bloklangan</span>}
                </div>
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
  const { me } = useAuth();
  const [c, setC] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const canManage = me && ["OPERATOR", "MANAGER", "ADMIN"].includes(me.role);
  const isAdmin = me?.role === "ADMIN";

  const load = () => api.get(`/customers/${id}`).then(setC);
  useEffect(() => { load(); }, [id]);
  if (!c) return <Loader />;

  async function toggleBlock() {
    setBusy(true);
    try {
      await api.patch(`/customers/${id}`, { blocked: !c.blocked });
      flash?.(c.blocked ? "Blokdan chiqarildi" : "Bloklandi");
      load();
    } catch (e) { flash?.(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="kc-grid">
      <Blueprint>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, textTransform: "uppercase" }}>
          {c.name}
          {c.blocked && <span className="tag tag-danger" style={{ marginLeft: 8, verticalAlign: "middle" }}>Bloklangan</span>}
        </div>
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
        {canManage && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
            <button className="btn btn-ghost" onClick={() => setEditOpen(true)}>Tahrirlash</button>
            <button className="btn btn-ghost" disabled={busy} onClick={toggleBlock}>
              {c.blocked ? "Blokdan chiqarish" : "Bloklash"}
            </button>
            {isAdmin && <button className="btn btn-ghost" onClick={() => setPromoteOpen(true)}>Xodimlikka olish</button>}
            <button className="btn btn-ghost" style={{ color: "var(--danger)" }} onClick={() => setDelOpen(true)}>O'chirish</button>
          </div>
        )}
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

      {editOpen && (
        <EditCustomer
          c={c}
          onClose={() => setEditOpen(false)}
          onDone={() => { setEditOpen(false); flash?.("Saqlandi"); load(); }}
        />
      )}

      {promoteOpen && (
        <PromoteCustomer
          c={c}
          onClose={() => setPromoteOpen(false)}
          onDone={(msg) => { setPromoteOpen(false); flash?.(msg); load(); }}
        />
      )}

      {delOpen && (
        <Dialog
          title={`${c.name} — o'chirish`}
          onClose={() => !busy && setDelOpen(false)}
          actions={
            <>
              <button className="btn btn-secondary" disabled={busy} onClick={() => setDelOpen(false)}>Bekor</button>
              <button
                className="btn btn-primary"
                style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await api.del(`/customers/${id}`);
                    flash?.("Mijoz o'chirildi");
                    onBack();
                  } catch (e) {
                    flash?.(e.message);
                    setBusy(false);
                  }
                }}
              >
                {busy ? "…" : "O'chirish"}
              </button>
            </>
          }
        >
          <p className="muted" style={{ fontSize: 13 }}>
            Savdo yoki qarz tarixi bo'lsa mijozni o'chirib bo'lmaydi — bunday holatda
            uni bloklang. Tarix bo'lmasa mijoz butunlay o'chiriladi.
          </p>
        </Dialog>
      )}

      <Toast text={toast} />
      <style>{`.kc-grid{display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);gap:var(--space-4);align-items:start}
        @media(max-width:860px){.kc-grid{grid-template-columns:1fr}}`}</style>
    </div>
  );
}

function EditCustomer({ c, onClose, onDone }) {
  const [f, setF] = useState({ name: c.name, phone: c.phone, address: c.address || "", note: c.note || "" });
  const [err, setErr] = useState(null);
  return (
    <Dialog
      title="Mijozni tahrirlash"
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Bekor</button>
          <button
            className="btn btn-primary"
            onClick={async () => {
              try { await api.patch(`/customers/${c.id}`, f); onDone(); } catch (e) { setErr(e.message); }
            }}
          >
            Saqlash
          </button>
        </>
      }
    >
      {[["name", "Ism"], ["phone", "Telefon"], ["address", "Manzil"], ["note", "Izoh"]].map(([k, label]) => (
        <div className="field" key={k} style={{ marginBottom: 8 }}>
          <label>{label}</label>
          <input className="input" value={f[k]} onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))} />
        </div>
      ))}
      {err && <div style={{ color: "var(--danger)", fontSize: 12 }}>{err}</div>}
    </Dialog>
  );
}

function PromoteCustomer({ c, onClose, onDone }) {
  const [f, setF] = useState({ role: "OPERATOR", position: "", department: "", branch: "" });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      title={`${c.name} — xodimlikka olish`}
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-secondary" disabled={busy} onClick={onClose}>Bekor</button>
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await api.post(`/customers/${c.id}/promote`, f);
                onDone(r.linkedExistingAccount ? "Xodim etib tayinlandi (akkaunt yangilandi)" : "Xodim etib tayinlandi");
              } catch (e) { setErr(e.message); setBusy(false); }
            }}
          >
            {busy ? "…" : "Tayinlash"}
          </button>
        </>
      }
    >
      <div className="field" style={{ marginBottom: 8 }}>
        <label>Rol</label>
        <select className="input" value={f.role} onChange={(e) => setF((s) => ({ ...s, role: e.target.value }))}>
          {["WORKER", "OPERATOR", "MANAGER", "ADMIN"].map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
      </div>
      {[["position", "Lavozim"], ["department", "Bo'lim"], ["branch", "Filial"]].map(([k, label]) => (
        <div className="field" key={k} style={{ marginBottom: 8 }}>
          <label>{label} <span className="muted">(ixtiyoriy)</span></label>
          <input className="input" value={f[k]} onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))} />
        </div>
      ))}
      {err && <div style={{ color: "var(--danger)", fontSize: 12 }}>{err}</div>}
    </Dialog>
  );
}

/* ------------------------------------------------------------------ app users */

function AppUsers() {
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = () => api.get("/users").then((r) => setItems(r.items));
  useEffect(() => { load(); }, []);
  if (!items) return <Loader />;
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };
  const filtered = items.filter((u) => !q || `${u.name} ${u.username || ""} ${u.phone || ""}`.toLowerCase().includes(q.toLowerCase()));

  async function patch(u, body, msg) {
    // optimistic: reflect the change now, the DB round-trip (Neon) can lag ~1-2s
    setItems((list) => list.map((x) => (x.id === u.id ? { ...x, ...body } : x)));
    try { await api.patch(`/users/${u.id}`, body); flash(msg || "Yangilandi"); load(); }
    catch (e) { flash(e.message); load(); }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      const r = await api.del(`/users/${deleting.id}`);
      flash(r.outcome === "deleted" ? "Akkaunt o'chirildi" : "Tarix bor — akkaunt bloklandi");
      if (r.outcome === "deleted") setItems((list) => list.filter((x) => x.id !== deleting.id));
      setDeleting(null);
      load();
    } catch (e) { flash(e.message); } finally { setBusy(false); }
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <input className="input" placeholder="Ism, username yoki telefon" value={q} onChange={(e) => setQ(e.target.value)} />
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead><tr><th>Foydalanuvchi</th><th>Rol</th><th>Holat</th><th></th></tr></thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>
                    {u.name}
                    {u.self && <span className="tag" style={{ marginLeft: 6 }}>Siz</span>}
                    {u.isStaff && <span className="tag tag-ok" style={{ marginLeft: 6 }}>Xodim</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-accent-700)" }}>
                    {u.phone || "telefon yo'q"}{u.username ? ` · @${u.username}` : ""}
                    {u.branchName ? ` · ${u.branchName}` : ""}
                  </div>
                </td>
                <td>
                  <select
                    className="input"
                    value={u.role}
                    disabled={u.self}
                    onChange={(e) => patch(u, { role: e.target.value }, "Rol o'zgartirildi")}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                </td>
                <td>
                  <select
                    className="input"
                    value={u.status}
                    disabled={u.self}
                    onChange={(e) => patch(u, { status: e.target.value }, "Holat o'zgartirildi")}
                  >
                    {Object.entries(STATUS_LABEL).map(([s, l]) => <option key={s} value={s}>{l}</option>)}
                  </select>
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  {!u.self && u.status !== "BLOCKED" && (
                    <button className="btn btn-ghost" onClick={() => patch(u, { status: "BLOCKED" }, "Bloklandi")}>Bloklash</button>
                  )}
                  {!u.self && u.status === "BLOCKED" && (
                    <button className="btn btn-ghost" onClick={() => patch(u, { status: "ACTIVE" }, "Blokdan chiqarildi")}>Blokdan chiqarish</button>
                  )}
                  {!u.self && (
                    <button className="btn btn-ghost" style={{ color: "var(--danger)" }} onClick={() => setDeleting(u)}>O'chirish</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleting && (
        <Dialog
          title={`${deleting.name} — akkauntni o'chirish`}
          onClose={() => !busy && setDeleting(null)}
          actions={
            <>
              <button className="btn btn-secondary" disabled={busy} onClick={() => setDeleting(null)}>Bekor</button>
              <button
                className="btn btn-primary"
                style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
                disabled={busy}
                onClick={confirmDelete}
              >
                {busy ? "Bajarilmoqda…" : "O'chirish"}
              </button>
            </>
          }
        >
          <p className="muted" style={{ fontSize: 13 }}>
            Foydalanuvchi ilovaga kira olmay qoladi. Agar savdo/harakat tarixi bo'lmasa
            akkaunt butunlay o'chiriladi; bo'lsa — tarix saqlanib, faqat kirish yopiladi
            (bloklanadi).
          </p>
        </Dialog>
      )}

      <Toast text={toast} />
    </div>
  );
}
