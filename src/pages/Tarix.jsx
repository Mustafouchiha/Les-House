import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../store.jsx";
import { fmt } from "../lib/format.js";
import { Loader, Dialog, Toast } from "../components/ui.jsx";
import Receipt from "../components/Receipt.jsx";

const PAY_LABEL = { CASH: "Naqd", CARD: "Karta", BANK: "Bank", DEBT: "Qarz", MIXED: "Aralash" };
const STATUS_LABEL = { COMPLETED: "Yakunlangan", REFUNDED: "Qaytarilgan", CANCELLED: "Bekor qilingan" };
const STATUS_TAG = { COMPLETED: "tag-ok", REFUNDED: "tag-warn", CANCELLED: "tag-danger" };
const CAN_REFUND_ROLES = ["OPERATOR", "MANAGER", "ADMIN"];

export default function Tarix() {
  const { me } = useAuth();
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(null);
  const [refunding, setRefunding] = useState(null); // sale row being confirmed
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = () => api.get("/sales?limit=50").then((r) => setItems(r.items));
  useEffect(() => { load(); }, []);
  if (!items) return <Loader />;

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const canRefund = CAN_REFUND_ROLES.includes(me.role);

  async function confirmRefund() {
    setBusy(true);
    try {
      await api.post(`/sales/${refunding.id}/refund`, { reason: reason || undefined });
      flash(`№ ${refunding.number} bekor qilindi — mahsulot omborga qaytdi`);
      setRefunding(null);
      setReason("");
      load();
    } catch (e) {
      flash(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead><tr><th>Chek</th><th>Mijoz</th><th>To'lov</th><th>Holat</th><th>Summa</th><th></th></tr></thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>№ {s.number}</div>
                  <div style={{ fontSize: 11, color: "var(--color-accent-700)" }}>{new Date(s.createdAt).toLocaleString("ru-RU")} · {s.sellerName}</div>
                </td>
                <td>{s.customerName || "—"}</td>
                <td><span className={`tag ${s.hasDebt ? "tag-danger" : "tag-ok"}`}>{PAY_LABEL[s.payType] || s.payType}</span></td>
                <td><span className={`tag ${STATUS_TAG[s.status] || "tag-ok"}`}>{STATUS_LABEL[s.status] || s.status}</span></td>
                <td style={{ whiteSpace: "nowrap" }}>{fmt(s.finalTotal)}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="btn btn-ghost" onClick={() => api.get(`/sales/${s.id}`).then(setOpen)}>Chek</button>
                  {canRefund && s.status === "COMPLETED" && (
                    <button className="btn btn-ghost" style={{ color: "var(--danger)" }} onClick={() => setRefunding(s)}>
                      Bekor qilish
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Dialog
          title={`Chek № ${open.number}`}
          onClose={() => setOpen(null)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => window.print()}>Chop etish</button>
              <button className="btn btn-primary" onClick={() => setOpen(null)}>Yopish</button>
            </>
          }
        >
          <Receipt sale={open} />
        </Dialog>
      )}

      {refunding && (
        <Dialog
          title={`№ ${refunding.number} — bekor qilish`}
          onClose={() => !busy && setRefunding(null)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setRefunding(null)} disabled={busy}>
                Yopish
              </button>
              <button
                className="btn btn-primary"
                style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
                onClick={confirmRefund}
                disabled={busy}
              >
                {busy ? "Bajarilmoqda…" : "Qaytarish"}
              </button>
            </>
          }
        >
          <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
            Mahsulotlar omborga qaytariladi, naqd/karta/bank to'lovi kassadan chiqariladi,
            qarz bo'lsa mijozning qarzi bekor qilinadi. Bu amalni ortga qaytarib bo'lmaydi.
          </p>
          <div className="field">
            <label>Sabab (ixtiyoriy)</label>
            <textarea
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mijoz qaytardi, xato kiritildi…"
            />
          </div>
        </Dialog>
      )}

      <Toast text={toast} />
    </div>
  );
}
