import { useState } from "react";
import { useAuth, NAV_BY_ROLE, setDevUser } from "../store.jsx";
import { isTelegram } from "../telegram.js";

const LABELS = {
  dashboard: "Asosiy",
  savdo: "Savdo",
  ombor: "Ombor",
  mahsulotlar: "Mahsulotlar",
  kirim: "Kirim / Chiqim",
  mijozlar: "Mijozlar",
  qarzlar: "Qarzlar",
  kassa: "Kassa",
  hisobotlar: "Hisobotlar",
  kalkulyator: "Kalkulyator",
  employees: "Xodimlar",
  tarix: "Savdo tarixi",
  profil: "Profil",
  savat: "Savat",
  xaridlar: "Xaridlar",
};

// phone bottom-nav shows at most 5; the rest go under "Menyu"
const PHONE_PRIMARY = {
  CUSTOMER: ["mahsulotlar", "savat", "kalkulyator", "xaridlar"],
  WORKER: ["savdo", "mijozlar", "tarix"],
  OPERATOR: ["dashboard", "savdo", "ombor", "qarzlar"],
  MANAGER: ["dashboard", "savdo", "ombor", "hisobotlar"],
  ADMIN: ["dashboard", "savdo", "ombor", "qarzlar"],
};

const DEV_USERS = [
  { id: 100001, first_name: "Demo", last_name: "Admin", username: "demo_admin", phone: "+998901234567" },
  { id: 100002, first_name: "Demo", last_name: "Manager", username: "demo_mgr", phone: "+998901111111" },
  { id: 100003, first_name: "Demo", last_name: "Operator", username: "demo_op", phone: "+998902222222" },
  { id: 100004, first_name: "Demo", last_name: "Sotuvchi", username: "demo_worker", phone: "+998903333333" },
  { id: 100005, first_name: "Demo", last_name: "Mijoz", username: "demo_customer", phone: "+998909999999" },
];

function DevBar({ me }) {
  // Vite sets import.meta.env.DEV only for `npm run dev` — a production
  // build (what Vercel serves) never renders this, even outside Telegram.
  if (!import.meta.env.DEV || isTelegram) return null;
  return (
    <div
      style={{
        background: "var(--warn-bg)",
        color: "var(--warn)",
        fontSize: 12,
        padding: "6px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        borderBottom: "1px solid #e6c88a",
      }}
    >
      <b>DEV</b>
      <span>Telegramdan tashqarida — mock auth.</span>
      <span style={{ marginLeft: "auto" }}>Kim sifatida:</span>
      <select
        className="input"
        style={{ width: "auto", minHeight: 28, padding: "2px 6px" }}
        value={me?.telegramUserId || ""}
        onChange={(e) => {
          const u = DEV_USERS.find((x) => String(x.id) === e.target.value);
          if (u) {
            setDevUser(u);
            location.reload();
          }
        }}
      >
        {DEV_USERS.map((u) => (
          <option key={u.id} value={u.id}>
            {u.last_name} ({u.phone})
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Shell({ page, setPage, title, kicker, children }) {
  const { me } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const allowed = NAV_BY_ROLE[me?.role] || [];
  const primary = (PHONE_PRIMARY[me?.role] || []).filter((k) => allowed.includes(k));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <DevBar me={me} />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* desktop sidebar */}
        <aside className="tb-sidebar">
          <div style={{ padding: "var(--space-6)", borderBottom: "1px solid var(--color-accent-200)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 19, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--sidebar-fg)" }}>
              Taxta Bozor
            </div>
            <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--sidebar-fg-dim)" }}>
              {me?.roleLabel || me?.role}
            </div>
          </div>
          <nav className="tb-sidebar-nav" style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: 2, overflow: "auto" }}>
            {allowed.map((key, i) => (
              <button
                key={key}
                onClick={() => setPage(key)}
                className="tb-navbtn"
                data-active={page === key}
              >
                <span style={{ width: 18, flex: "none", fontSize: 10, color: "var(--sidebar-fg-dim)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{LABELS[key]}</span>
              </button>
            ))}
          </nav>
          <div style={{ marginTop: "auto", padding: "var(--space-6)", borderTop: "1px solid var(--color-accent-200)", fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: "var(--sidebar-fg)" }}>{me?.firstName} {me?.lastName}</div>
            <div style={{ color: "var(--sidebar-fg-dim)" }}>{me?.branchName || "Filial belgilanmagan"}</div>
          </div>
        </aside>

        {/* main column */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <header className="tb-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <button
                onClick={() => setPage("profil")}
                title="Profil"
                aria-label="Profil"
                data-active={page === "profil"}
                style={{
                  width: 34, height: 34, flex: "none", cursor: "pointer",
                  borderRadius: "50%", overflow: "hidden", padding: 0,
                  border: "1px solid var(--color-accent-400)",
                  background: page === "profil" ? "var(--color-accent)" : "var(--color-accent-100)",
                  color: page === "profil" ? "#fff" : "var(--color-accent-800)",
                  fontFamily: "var(--font-heading)", fontSize: 13, textTransform: "uppercase",
                }}
              >
                {me?.photoUrl ? (
                  <img src={me.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  ((me?.firstName || "?")[0] || "") + ((me?.lastName || "")[0] || "")
                )}
              </button>
              <div>
                <div className="kicker">{kicker}</div>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, textTransform: "uppercase", letterSpacing: ".02em", color: "var(--color-accent-900)" }}>
                  {title}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 11, letterSpacing: ".12em", color: "var(--color-accent-700)" }}>
              {isTelegram ? "TELEGRAM" : "WEB"}
            </span>
          </header>

          <main className="tb-scroll scroll">{children}</main>

          {/* phone bottom nav */}
          <nav className="tb-bottomnav">
            {primary.map((key) => (
              <button key={key} onClick={() => setPage(key)} data-active={page === key}>
                {LABELS[key]}
              </button>
            ))}
            {allowed.length > primary.length && (
              <button onClick={() => setMenuOpen(true)}>Menyu</button>
            )}
          </nav>
        </div>
      </div>

      {menuOpen && (
        <div className="dialog-backdrop" onClick={() => setMenuOpen(false)}>
          <div className="dialog blueprint" onClick={(e) => e.stopPropagation()}>
            <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 20 }}>Barcha bo'limlar</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
              {allowed.map((key) => (
                <button
                  key={key}
                  className="btn btn-secondary"
                  onClick={() => {
                    setPage(key);
                    setMenuOpen(false);
                  }}
                >
                  {LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tb-sidebar{width:236px;flex:none;background:var(--sidebar-bg);color:var(--sidebar-fg);display:flex;flex-direction:column;border-right:1px solid var(--color-accent-200)}
        .tb-sidebar-nav{scrollbar-width:thin;scrollbar-color:var(--color-accent-400) transparent}
        .tb-sidebar-nav::-webkit-scrollbar{width:6px}
        .tb-sidebar-nav::-webkit-scrollbar-track{background:transparent}
        .tb-sidebar-nav::-webkit-scrollbar-thumb{background:var(--color-accent-300);border-radius:999px}
        .tb-sidebar-nav::-webkit-scrollbar-thumb:hover{background:var(--color-accent-500)}
        .tb-navbtn{display:flex;align-items:center;gap:var(--space-2);width:100%;padding:var(--space-3);border:0;border-radius:var(--radius-md);cursor:pointer;text-align:left;font-family:var(--font-body);font-size:13.5px;background:transparent;color:var(--sidebar-fg)}
        .tb-navbtn:hover:not([data-active="true"]){background:var(--color-accent-100)}
        .tb-navbtn[data-active="true"]{background:var(--color-accent);color:#fff;font-weight:600}
        .tb-navbtn[data-active="true"] span{color:#fff!important}
        .tb-topbar{flex:none;display:flex;align-items:flex-end;justify-content:space-between;gap:var(--space-6);padding:calc(var(--space-6) + var(--safe-top)) var(--space-8) var(--space-6);border-bottom:1px solid var(--color-divider);position:sticky;top:0;background:var(--color-bg);z-index:10}
        .tb-scroll{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;padding:var(--space-8)}
        .tb-bottomnav{display:none}
        @media (max-width: 860px){
          .tb-sidebar{display:none}
          .tb-topbar{padding:calc(var(--space-3) + var(--safe-top)) var(--space-4) var(--space-3)}
          .tb-topbar > div > div:last-child{font-size:19px}
          .tb-scroll{padding:var(--space-4);padding-bottom:calc(var(--bottomnav-h) + var(--space-4))}
          /* fixed to the viewport, not to page flow, so it can never scroll out of view */
          .tb-bottomnav{
            display:grid;grid-auto-flow:column;grid-auto-columns:1fr;
            position:fixed;left:0;right:0;bottom:0;z-index:30;
            border-top:1px solid var(--color-accent-300);background:var(--color-accent-100);
            padding-bottom:var(--safe-bottom);
          }
          .tb-bottomnav button{border:0;background:transparent;padding:var(--space-3) 2px calc(var(--space-3));cursor:pointer;color:var(--color-accent-700);font-family:var(--font-heading);font-size:12.5px}
          .tb-bottomnav button[data-active="true"]{color:var(--color-accent-900);border-top:2px solid var(--color-accent);margin-top:-1px;font-weight:600}
          .toast{bottom:calc(var(--bottomnav-h) + var(--safe-bottom) + 14px)}
        }
      `}</style>
    </div>
  );
}
