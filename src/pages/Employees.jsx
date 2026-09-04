import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { Loader, Dialog, Toast } from "../components/ui.jsx";

const ROLES = ["ADMIN", "MANAGER", "OPERATOR", "WORKER"];
const STATUS = ["ACTIVE", "SUSPENDED", "BLOCKED"];
const STATUS_LABEL = { ACTIVE: "Faol", SUSPENDED: "To'xtatilgan", BLOCKED: "Bloklangan" };

export default function Employees() {
  const [items, setItems] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = () => api.get("/employees").then((r) => setItems(r.items));
  useEffect(() => { load(); }, []);
  if (!items) return <Loader />;
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2000); };

  async function confirmDelete() {
    setBusy(true);
    try {
      await api.del(`/employees/${deleting.id}`);
      flash(`${deleting.firstName} o'chirildi — akkaunt bloklandi`);
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
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-secondary" onClick={() => setCreating(true)}>Yangi xodim</button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead><tr><th>Xodim</th><th>Rol</th><th>Bo'lim / Filial</th><th>Holat</th><th></th></tr></thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{e.firstName} {e.lastName}</div>
                  <div style={{ fontSize: 11, color: "var(--color-accent-700)" }}>{e.phone} · {e.position || "—"}</div>
                </td>
                <td>
                  <select className="input" value={e.role} onChange={async (ev) => { await api.patch(`/employees/${e.id}`, { role: ev.target.value }); flash("Yangilandi"); load(); }}>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td style={{ fontSize: 12 }}>{[e.department, e.branchName].filter(Boolean).join(" · ") || "—"}</td>
                <td>
                  <select className="input" value={e.status} onChange={async (ev) => { await api.patch(`/employees/${e.id}`, { status: ev.target.value }); flash("Yangilandi"); load(); }}>
                    {STATUS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-ghost" style={{ color: "var(--danger)" }} onClick={() => setDeleting(e)}>
                    O'chirish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <CreateEmployee onClose={() => setCreating(false)} onDone={() => { setCreating(false); load(); flash("Xodim qo'shildi"); }} />
      )}

      {deleting && (
        <Dialog
          title={`${deleting.firstName} ${deleting.lastName || ""} — akkauntni o'chirish`}
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
            Xodim ro'yxatdan olib tashlanadi va Telegram akkaunti bloklanadi — u endi
            tizimga kira olmaydi. Agar oldingi savdo/harakat tarixi bo'lmasa, akkaunt
            butunlay o'chiriladi; bo'lsa — tarix saqlanib, faqat kirish huquqi yopiladi.
          </p>
        </Dialog>
      )}

      <Toast text={toast} />
    </div>
  );
}

function CreateEmployee({ onClose, onDone }) {
  const [f, setF] = useState({ firstName: "", lastName: "", phone: "", position: "", department: "", role: "WORKER" });
  const [err, setErr] = useState(null);
  return (
    <Dialog
      title="Yangi xodim"
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Bekor</button>
          <button
            className="btn btn-primary"
            onClick={async () => {
              try { await api.post("/employees", f); onDone(); } catch (e) { setErr(e.message); }
            }}
          >
            Saqlash
          </button>
        </>
      }
    >
      {[["firstName", "Ism"], ["lastName", "Familiya"], ["phone", "Telefon"], ["position", "Lavozim"], ["department", "Bo'lim"]].map(([k, label]) => (
        <div className="field" key={k} style={{ marginBottom: 8 }}>
          <label>{label}</label>
          <input className="input" value={f[k]} onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))} />
        </div>
      ))}
      <div className="field">
        <label>Rol</label>
        <select className="input" value={f.role} onChange={(e) => setF((s) => ({ ...s, role: e.target.value }))}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      {err && <div style={{ color: "var(--danger)", fontSize: 12 }}>{err}</div>}
    </Dialog>
  );
}
