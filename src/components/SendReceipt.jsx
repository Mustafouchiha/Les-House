import { useState } from "react";
import { api } from "../api/client.js";
import { Dialog } from "./ui.jsx";

// "Chekni Telegram orqali yuborish" — enter a phone, the receipt goes to that
// number's Telegram account (via the bot) and the person is saved as a customer.
// No phone → the send button stays disabled.
export default function SendReceipt({ saleId, defaultPhone = "", defaultName = "", onSent, block = false }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(defaultPhone || "");
  const [name, setName] = useState(defaultName || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const valid = phone.replace(/\D/g, "").length >= 9;

  async function send() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.post(`/sales/${saleId}/send-receipt`, {
        phone,
        customerName: name.trim() || undefined,
      });
      setMsg({ ok: true, text: r.message });
      onSent?.(r);
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className={block ? "btn btn-secondary btn-block" : "btn btn-secondary"}
        onClick={() => setOpen(true)}
      >
        Telegram'ga yuborish
      </button>
      {open && (
        <Dialog
          title="Chekni Telegram orqali yuborish"
          onClose={() => !busy && setOpen(false)}
          actions={
            <>
              <button className="btn btn-secondary" disabled={busy} onClick={() => setOpen(false)}>
                Yopish
              </button>
              <button className="btn btn-primary" disabled={!valid || busy} onClick={send}>
                {busy ? "Yuborilmoqda…" : "Yuborish"}
              </button>
            </>
          }
        >
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Telefon raqami *</label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              inputMode="tel"
            />
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Mijoz ismi <span className="muted">(ixtiyoriy)</span></label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <p className="muted" style={{ fontSize: 12 }}>
            Raqam egasi Telegram botga ulangan bo'lsa, chek unga yuboriladi. Raqam
            mijozlar bazasiga ham saqlanadi. Raqamsiz yuborib bo'lmaydi.
          </p>
          {msg && (
            <div
              style={{
                fontSize: 12,
                marginTop: 8,
                color: msg.ok ? "var(--color-accent-800)" : "var(--danger)",
              }}
            >
              {msg.text}
            </div>
          )}
        </Dialog>
      )}
    </>
  );
}
