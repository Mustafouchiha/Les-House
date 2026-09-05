import { useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../store.jsx";
import { Corners } from "../components/ui.jsx";

// Non-Telegram entry point: a desktop/computer browser can't produce Telegram
// WebApp initData, so signing in here goes phone -> one-time code (delivered
// by the bot to that phone's Telegram chat) -> code -> JWT.
const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || "";

export default function WebLogin() {
  const { completeWebLogin } = useAuth();
  const [step, setStep] = useState("phone"); // phone | code
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [notRegistered, setNotRegistered] = useState(false);
  const [cooldown, setCooldown] = useState(0);

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

  async function sendCode() {
    setErr(null);
    setNotRegistered(false);
    const p = normalize(phone);
    if (!/^\+998\d{9}$/.test(p)) {
      setErr("Telefon raqamini to'liq kiriting: +998 XX XXX XX XX");
      return;
    }
    setBusy(true);
    try {
      const r = await api.post("/auth/request-code", { phone: p });
      setPhone(p);
      setStep("code");
      tick(r.cooldownSeconds || 45);
    } catch (e) {
      if (e.code === "not_registered") setNotRegistered(true);
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
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

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100%", padding: 24 }}>
      <div className="blueprint" style={{ padding: "var(--space-8)", maxWidth: 380, width: "100%", textAlign: "center" }}>
        <Corners />
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 26, textTransform: "uppercase", letterSpacing: ".05em" }}>
          Taxta Bozor
        </div>
        <p className="muted" style={{ fontSize: 13, margin: "10px 0 20px" }}>
          Kompyuterdan kirish uchun telefon raqamingizni tasdiqlang. Tasdiqlash
          kodi Telegram bot orqali yuboriladi.
        </p>

        {step === "phone" && (
          <>
            <div className="field" style={{ textAlign: "left" }}>
              <label>Telefon raqam</label>
              <input
                className="input"
                inputMode="tel"
                placeholder="+998 90 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendCode()}
              />
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={sendCode} disabled={busy}>
              {busy ? "Yuborilmoqda…" : "Kod yuborish"}
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
              {phone} raqamiga bog'langan Telegram akkauntingizga kod yuborildi.
            </p>
            <div className="field" style={{ textAlign: "left" }}>
              <label>Tasdiqlash kodi</label>
              <input
                className="input"
                inputMode="numeric"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verify()}
              />
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={verify} disabled={busy}>
              {busy ? "Tekshirilmoqda…" : "Tasdiqlash"}
            </button>
            <button
              className="btn btn-ghost btn-block"
              style={{ marginTop: 8 }}
              onClick={sendCode}
              disabled={busy || cooldown > 0}
            >
              {cooldown > 0 ? `Qayta yuborish (${cooldown})` : "Kodni qayta yuborish"}
            </button>
            <button
              className="btn btn-ghost btn-block"
              onClick={() => {
                setStep("phone");
                setCode("");
                setErr(null);
              }}
            >
              Raqamni o'zgartirish
            </button>
          </>
        )}

        {err && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 10 }}>{err}</div>}

        {notRegistered && (
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Avval Telegram'da botni ochib ro'yxatdan o'ting:{" "}
            {BOT_USERNAME ? (
              <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noreferrer">
                @{BOT_USERNAME}
              </a>
            ) : (
              "Taxta Bozor boti"
            )}
          </div>
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
