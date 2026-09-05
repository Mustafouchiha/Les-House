import { useEffect, useState, useCallback } from "react";
import { initTelegram } from "./telegram.js";
import { AuthProvider, CartProvider, useAuth, NAV_BY_ROLE } from "./store.jsx";
import { Loader } from "./components/ui.jsx";
import Shell from "./components/Shell.jsx";

import Login from "./pages/Login.jsx";
import WebLogin from "./pages/WebLogin.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Savdo from "./pages/Savdo.jsx";
import Ombor from "./pages/Ombor.jsx";
import Mahsulotlar from "./pages/Mahsulotlar.jsx";
import KirimChiqim from "./pages/KirimChiqim.jsx";
import Mijozlar from "./pages/Mijozlar.jsx";
import Qarzlar from "./pages/Qarzlar.jsx";
import Kassa from "./pages/Kassa.jsx";
import Hisobotlar from "./pages/Hisobotlar.jsx";
import Kalkulyator from "./pages/Kalkulyator.jsx";
import Tarix from "./pages/Tarix.jsx";
import Employees from "./pages/Employees.jsx";
import CustomerCatalog from "./pages/CustomerCatalog.jsx";
import Profil from "./pages/Profil.jsx";

const PAGES = {
  dashboard: { c: Dashboard, kicker: "Bugun", title: "Asosiy" },
  savdo: { c: Savdo, kicker: "Kassa oynasi", title: "Savdo" },
  ombor: { c: Ombor, kicker: "Qoldiqlar", title: "Ombor" },
  mahsulotlar: { c: Mahsulotlar, kicker: "Katalog", title: "Mahsulotlar" },
  kirim: { c: KirimChiqim, kicker: "Harakatlar", title: "Kirim / Chiqim" },
  mijozlar: { c: Mijozlar, kicker: "Baza", title: "Mijozlar" },
  qarzlar: { c: Qarzlar, kicker: "Debitorlar", title: "Qarzlar" },
  kassa: { c: Kassa, kicker: "Smena", title: "Kassa" },
  hisobotlar: { c: Hisobotlar, kicker: "Tahlil", title: "Hisobotlar" },
  kalkulyator: { c: Kalkulyator, kicker: "Hajm va narx", title: "Kalkulyator" },
  tarix: { c: Tarix, kicker: "Cheklar", title: "Savdo tarixi" },
  employees: { c: Employees, kicker: "Kadrlar", title: "Xodimlar" },
  profil: { c: Profil, kicker: "Hisob", title: "Profil" },
  // customer-only
  savat: { c: CustomerCatalog, kicker: "Xarid", title: "Savat", customerTab: "cart" },
  xaridlar: { c: CustomerCatalog, kicker: "Tarix", title: "Xaridlar", customerTab: "orders" },
};

function Shelled() {
  const { status, me, error, retry } = useAuth();
  const [page, setPage] = useState(null);

  const home = useCallback((role) => (NAV_BY_ROLE[role] || ["mahsulotlar"])[0], []);

  useEffect(() => {
    if (me && !page) setPage(home(me.role));
  }, [me, page, home]);

  if (status === "loading") return <Loader label="Telegram hisobi tekshirilmoqda…" />;

  if (status === "web-login") return <WebLogin />;

  if (status === "error") {
    return (
      <div style={{ display: "grid", placeItems: "center", gap: 14, padding: 40, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>Ulanib bo'lmadi</div>
        <div className="muted" style={{ fontSize: 13, maxWidth: 320 }}>
          {error?.message || "Server bilan aloqa yo'q."}
        </div>
        <button className="btn btn-primary" onClick={retry}>Qayta urinish</button>
      </div>
    );
  }

  // account gating (spec §27, §33)
  if (me.status === "BLOCKED")
    return (
      <Centered title="Account bloklangan">
        Accountingiz vaqtincha bloklangan. Administrator bilan bog'laning.
      </Centered>
    );

  if (!me.phoneNumber || me.status === "PENDING")
    return <Login />;

  if (me.role !== "CUSTOMER" && me.status === "SUSPENDED")
    return (
      <Centered title="Tasdiq kutilmoqda">
        {me.firstName} {me.lastName} sifatida ro'yxatdan o'tdingiz. Administrator
        rolni tasdiqlagach ilova ochiladi.
      </Centered>
    );

  if (!page) return <Loader />;
  const entry = PAGES[page] || PAGES[home(me.role)];
  const P = entry.c;

  return (
    <Shell page={page} setPage={setPage} title={entry.title} kicker={entry.kicker}>
      <P setPage={setPage} customerTab={entry.customerTab} />
    </Shell>
  );
}

function Centered({ title, children }) {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100%", padding: 32 }}>
      <div className="blueprint" style={{ padding: "var(--space-8)", maxWidth: 360, textAlign: "center" }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, textTransform: "uppercase", letterSpacing: ".04em" }}>
          {title}
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>{children}</p>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    initTelegram();
  }, []);
  return (
    <AuthProvider>
      <CartProvider>
        <Shelled />
      </CartProvider>
    </AuthProvider>
  );
}
