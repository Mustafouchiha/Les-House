import { useState } from "react";
import { useAuth } from "../store.jsx";
import { requestContact, isTelegram } from "../telegram.js";
import { Corners } from "../components/ui.jsx";

export default function Login() {
  const { me, linkPhone } = useAuth();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function submit(value) {
    const p = normalize(value);
    if (!/^\+998\d{9}$/.test(p)) {
      setErr("Telefon raqamini to'liq kiriting: +998 XX XXX XX XX");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await linkPhone(p);
    } catch (e) {
      setErr(e.message || "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  async function viaContact() {
    const c = await requestContact();
    if (c?.phone_number) submit(c.phone_number);
    else setErr("Kontakt ulashilmadi. Raqamni qo'lda kiriting.");
  }

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100%", padding: 24 }}>
      <div className="blueprint" style={{ padding: "var(--space-8)", maxWidth: 380, width: "100%", textAlign: "center" }}>
        <Corners />
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 28, textTransform: "uppercase", letterSpacing: ".05em" }}>
          Taxta Bozor
        </div>
        <p className="muted" style={{ fontSize: 13, margin: "10px 0 22px" }}>
          Salom, {me?.firstName || "mehmon"}! Davom etish uchun telefon raqamingizni
          tasdiqlang. Xodim bo'lsangiz, rolingiz avtomatik biriktiriladi.
        </p>

        {isTelegram && (
          <button className="btn btn-primary btn-block" onClick={viaContact} disabled={busy}>
            Telegram orqali raqamni ulashish
          </button>
        )}

        <div className="field" style={{ textAlign: "left", marginTop: 14 }}>
          <label>Telefon raqam</label>
          <input
            className="input"
            inputMode="tel"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 12 }}
          onClick={() => submit(phone)}
          disabled={busy}
        >
          {busy ? "Tekshirilmoqda…" : "Tasdiqlash"}
        </button>

        {err && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 10 }}>{err}</div>}
      </div>
    </div>
  );
}

function normalize(v) {
  let s = String(v || "").replace(/[^\d+]/g, "");
  if (s.startsWith("998")) s = "+" + s;
  if (/^\d{9}$/.test(s)) s = "+998" + s;
  return s;
}
