import { useState } from "react";
import { useAuth } from "../store.jsx";
import { requestContact, isTelegram } from "../telegram.js";
import { api } from "../api/client.js";
import { Corners } from "../components/ui.jsx";

export default function Login() {
  const { me, linkPhone, completeWebLogin } = useAuth();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [conflict, setConflict] = useState(false); // phone belongs to a different Telegram account
  const [codeMode, setCodeMode] = useState(false); // switched to phone+code verification
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);

  function tick(seconds) {
    setCooldown(seconds);
    const id = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function submit(value) {
    const p = normalize(value);
    if (!/^\+998\d{9}$/.test(p)) {
      setErr("Telefon raqamini to'liq kiriting: +998 XX XXX XX XX");
      return;
    }
    setBusy(true);
    setErr(null);
    setConflict(false);
    try {
      await linkPhone(p);
    } catch (e) {
      setErr(e.message || "Xatolik");
      if (e.status === 409) {
        // phone is already registered under a different Telegram identity —
        // offer to sign in as that account instead, verified via a code sent
        // through the bot, rather than a dead end.
        setPhone(p);
        setConflict(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function viaContact() {
    const c = await requestContact();
    if (c?.phone_number) submit(c.phone_number);
    else setErr("Kontakt ulashilmadi. Raqamni qo'lda kiriting.");
  }

  async function sendCode() {
    setErr(null);
    setBusy(true);
    try {
      const r = await api.post("/auth/request-code", { phone });
      setSent(true);
      tick(r.cooldownSeconds || 45);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setErr(null);
    if (code.trim().length < 4) {
      setErr("Kodni to'liq kiriting");
      return;
    }
    setBusy(true);
    try {
      const { token } = await api.post("/auth/verify-code", { phone, code: code.trim() });
      await completeWebLogin(token);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (codeMode) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100%", padding: 24 }}>
        <div className="blueprint" style={{ padding: "var(--space-8)", maxWidth: 380, width: "100%", textAlign: "center" }}>
          <Corners />
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 22, textTransform: "uppercase" }}>
            Kod bilan kirish
          </div>
          <p className="muted" style={{ fontSize: 13, margin: "10px 0 20px" }}>
            {phone} raqamiga bog'langan Telegram akkauntga tasdiqlash kodi yuboriladi.
          </p>

          {!sent ? (
            <button className="btn btn-primary btn-block" onClick={sendCode} disabled={busy}>
              {busy ? "Yuborilmoqda…" : "Kod yuborish"}
            </button>
          ) : (
            <>
              <div className="field" style={{ textAlign: "left" }}>
                <label>Tasdiqlash kodi</label>
                <input
                  className="input"
                  inputMode="numeric"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                />
              </div>
              <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={verifyCode} disabled={busy}>
                {busy ? "Tekshirilmoqda…" : "Tasdiqlash"}
              </button>
              <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={sendCode} disabled={busy || cooldown > 0}>
                {cooldown > 0 ? `Qayta yuborish (${cooldown})` : "Kodni qayta yuborish"}
              </button>
            </>
          )}

          <button
            className="btn btn-ghost btn-block"
            style={{ marginTop: 8 }}
            onClick={() => {
              setCodeMode(false);
              setSent(false);
              setCode("");
              setErr(null);
            }}
          >
            Orqaga
          </button>

          {err && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 10 }}>{err}</div>}
        </div>
      </div>
    );
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

        {conflict && (
          <button
            className="btn btn-secondary btn-block"
            style={{ marginTop: 10 }}
            onClick={() => setCodeMode(true)}
          >
            Bu men — kod bilan tasdiqlash
          </button>
        )}
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
