import { useState } from "react";
import { useAuth } from "../store.jsx";
import { isTelegram, closeApp } from "../telegram.js";
import { getThemePref, setThemePref, getAccentPref, setAccentPref, ACCENT_PRESETS } from "../theme.js";
import { Blueprint, Segmented } from "../components/ui.jsx";

const THEME_OPTS = [
  { value: "system", label: "Tizim" },
  { value: "light", label: "Yorug'" },
  { value: "dark", label: "Qorong'i" },
];

const ROLE_LABEL = {
  ADMIN: "Administrator",
  MANAGER: "Ish boshqaruvchi",
  OPERATOR: "Operator",
  WORKER: "Sotuvchi",
  CUSTOMER: "Mijoz",
};

export default function Profil() {
  const { me, logout } = useAuth();
  const [theme, setTheme] = useState(getThemePref());
  const [accent, setAccent] = useState(getAccentPref());
  const [confirm, setConfirm] = useState(false);

  const initials =
    ((me.firstName || "?")[0] || "") + ((me.lastName || "")[0] || "");

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", display: "grid", gap: "var(--space-4)" }}>
      <Blueprint style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
        {me.photoUrl ? (
          <img
            src={me.photoUrl}
            alt=""
            style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flex: "none" }}
          />
        ) : (
          <div
            style={{
              width: 56, height: 56, flex: "none",
              display: "grid", placeItems: "center",
              border: "1px solid var(--color-accent)",
              fontFamily: "var(--font-heading)", fontSize: 20,
              color: "var(--color-accent-800)", textTransform: "uppercase",
            }}
          >
            {initials || "TB"}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, lineHeight: 1.1 }}>
            {[me.firstName, me.lastName].filter(Boolean).join(" ") || "Foydalanuvchi"}
          </div>
          {me.username && <div className="muted" style={{ fontSize: 12 }}>@{me.username}</div>}
          <span
            className="tag tag-ok"
            style={{ marginTop: 6, display: "inline-flex" }}
          >
            {ROLE_LABEL[me.role] || me.role}
          </span>
        </div>
      </Blueprint>

      <Blueprint style={{ display: "grid", gap: "var(--space-2)" }}>
        <Row label="Telefon" value={me.phoneNumber || "—"} />
        {me.branchName && <Row label="Filial" value={me.branchName} />}
        {me.department && <Row label="Bo'lim" value={me.department} />}
        {me.position && <Row label="Lavozim" value={me.position} />}
        <Row label="Telegram ID" value={me.telegramUserId} />
        {me.appVersion && <Row label="Ilova versiyasi" value={me.appVersion} />}
      </Blueprint>

      <Blueprint style={{ display: "grid", gap: "var(--space-3)" }}>
        <div className="kicker">Ko'rinish</div>
        <Segmented
          options={THEME_OPTS}
          value={theme}
          onChange={(v) => {
            setTheme(v);
            setThemePref(v);
          }}
        />
        <div className="muted" style={{ fontSize: 11 }}>
          "Tizim" — {isTelegram ? "Telegram mavzusiga" : "qurilma sozlamasiga"} moslashadi.
        </div>
      </Blueprint>

      <Blueprint style={{ display: "grid", gap: "var(--space-3)" }}>
        <div className="kicker">Rang</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {ACCENT_PRESETS.map((p) => (
            <button
              key={p.hex}
              title={p.name}
              aria-label={p.name}
              onClick={() => {
                setAccent(p.hex);
                setAccentPref(p.hex);
              }}
              style={{
                width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
                background: p.hex, flex: "none",
                border: accent.toLowerCase() === p.hex ? "2px solid var(--color-text)" : "1px solid var(--color-divider)",
                boxShadow: accent.toLowerCase() === p.hex ? "0 0 0 2px var(--color-surface) inset" : "none",
                outlineOffset: 2,
              }}
            />
          ))}
          <label
            title="O'zingiz tanlang"
            style={{
              width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
              position: "relative", overflow: "hidden", flex: "none",
              border: "1px dashed var(--color-divider)",
              display: "grid", placeItems: "center", fontSize: 14,
              background: !ACCENT_PRESETS.some((p) => p.hex === accent.toLowerCase()) ? accent : "transparent",
            }}
          >
            <span style={{ pointerEvents: "none" }}>
              {!ACCENT_PRESETS.some((p) => p.hex === accent.toLowerCase()) ? "" : "🎨"}
            </span>
            <input
              type="color"
              value={accent}
              onChange={(e) => {
                setAccent(e.target.value);
                setAccentPref(e.target.value);
              }}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            />
          </label>
        </div>
        <div className="muted" style={{ fontSize: 11 }}>
          Ilova rangi — tugmalar, sarlavhalar va yorliqlar shu rangga moslashadi.
        </div>
      </Blueprint>

      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        {isTelegram && (
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={closeApp}>
            Yopish
          </button>
        )}
        <button
          className="btn"
          style={{
            flex: 1,
            borderColor: "var(--danger)",
            color: "var(--danger)",
            background: "var(--danger-bg)",
          }}
          onClick={() => setConfirm(true)}
        >
          Hisobdan chiqish
        </button>
      </div>

      {confirm && (
        <div className="dialog-backdrop" onClick={() => setConfirm(false)}>
          <div className="dialog blueprint" onClick={(e) => e.stopPropagation()}>
            <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 20 }}>Hisobdan chiqish</div>
            <p className="muted" style={{ fontSize: 13 }}>
              Chiqqach qayta kirish uchun Telegram orqali avtorizatsiyadan o'tasiz.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
              <button className="btn btn-secondary" onClick={() => setConfirm(false)}>Bekor</button>
              <button
                className="btn btn-primary"
                onClick={logout}
                style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
              >
                Chiqish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
      <span className="muted">{label}</span>
      <span style={{ textAlign: "right", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}
