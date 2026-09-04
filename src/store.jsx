import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { api, setToken, getToken } from "./api/client.js";
import { getInitData, getInitDataUnsafe, isTelegram } from "./telegram.js";
import { parseNum } from "./lib/format.js";

const AuthCtx = createContext(null);
const CartCtx = createContext(null);

// ---- role → permitted nav sections (spec §26) ----
export const NAV_BY_ROLE = {
  CUSTOMER: ["mahsulotlar", "savat", "kalkulyator", "xaridlar", "profil"],
  WORKER: ["savdo", "mijozlar", "tarix", "profil"],
  OPERATOR: [
    "dashboard",
    "savdo",
    "ombor",
    "kirim",
    "mahsulotlar",
    "mijozlar",
    "qarzlar",
    "kassa",
    "tarix",
    "profil",
  ],
  MANAGER: [
    "dashboard",
    "savdo",
    "ombor",
    "mahsulotlar",
    "kirim",
    "mijozlar",
    "qarzlar",
    "hisobotlar",
    "kassa",
    "tarix",
    "profil",
  ],
  ADMIN: [
    "dashboard",
    "savdo",
    "ombor",
    "mahsulotlar",
    "kirim",
    "mijozlar",
    "qarzlar",
    "kassa",
    "hisobotlar",
    "kalkulyator",
    "employees",
    "tarix",
    "profil",
  ],
};

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: "loading", me: null, error: null });

  const loadMe = useCallback(async () => {
    const me = await api.get("/me");
    setState({ status: "ready", me, error: null });
    return me;
  }, []);

  const bootstrap = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      if (getToken()) {
        try {
          await loadMe();
          return;
        } catch {
          setToken(null);
        }
      }
      const initData = getInitData();
      const body = initData
        ? { initData }
        : { devUser: pickDevUser() };
      const { token } = await api.post("/auth/telegram", body);
      setToken(token);
      await loadMe();
    } catch (e) {
      setState({ status: "error", me: null, error: e });
    }
  }, [loadMe]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const linkPhone = useCallback(
    async (phone) => {
      await api.post("/auth/phone", { phone });
      return loadMe();
    },
    [loadMe]
  );

  const logout = useCallback(() => {
    setToken(null);
    setState({ status: "loading", me: null, error: null });
    bootstrap();
  }, [bootstrap]);

  const value = useMemo(
    () => ({ ...state, reload: loadMe, retry: bootstrap, linkPhone, logout }),
    [state, loadMe, bootstrap, linkPhone, logout]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
}

// In the browser (no Telegram), let the tester choose which seeded person to be.
// Persisted so reloads keep the same identity.
export function pickDevUser() {
  if (isTelegram) return getInitDataUnsafe()?.user;
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem("tb_dev_user") || "null");
  } catch {
    /* ignore */
  }
  return (
    saved || {
      id: 100001,
      first_name: "Demo",
      last_name: "Admin",
      username: "demo_admin",
      phone: "+998901234567", // matches the seeded ADMIN employee
    }
  );
}

export function setDevUser(u) {
  try {
    localStorage.setItem("tb_dev_user", JSON.stringify(u));
  } catch {
    /* ignore */
  }
  setToken(null);
}

// ---- cart ----
export function CartProvider({ children }) {
  const [lines, setLines] = useState([]); // {productId, name, unit, price, minPrice, startPrice, cost, stockLeft, qty, mode}
  const [discount, setDiscount] = useState(0);
  const [rounding, setRounding] = useState(0);

  const add = useCallback((p, addQty) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === p.id);
      if (i > -1) {
        const next = prev.slice();
        next[i] = { ...next[i], qty: +(next[i].qty + (addQty ?? 1)).toFixed(3) };
        return next;
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          unit: p.unit,
          price: p.sellPrice ?? p.startPrice ?? 0,
          minPrice: p.minPrice ?? null,
          startPrice: p.startPrice ?? null,
          cost: p.cost ?? null,
          stockLeft: p.stockLeft ?? null,
          qty: addQty ?? (p.unit === "M3" ? 1 : 10),
          mode: "qty",
        },
      ];
    });
  }, []);

  const update = useCallback((productId, patch) => {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l))
    );
  }, []);

  // set a line by total sum: qty = sum / price  (spec §20)
  const setLineTotal = useCallback((productId, totalStr) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.productId !== productId) return l;
        const total = parseNum(totalStr);
        const q = l.price > 0 ? +(total / l.price).toFixed(3) : 0;
        return { ...l, qty: q, mode: "total" };
      })
    );
  }, []);

  const setPrice = useCallback((productId, priceStr) => {
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId ? { ...l, price: parseNum(priceStr) } : l
      )
    );
  }, []);

  const remove = useCallback(
    (productId) => setLines((prev) => prev.filter((l) => l.productId !== productId)),
    []
  );
  const clear = useCallback(() => {
    setLines([]);
    setDiscount(0);
    setRounding(0);
  }, []);

  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const finalTotal = Math.max(0, subtotal - parseNum(discount) - parseNum(rounding));

  const value = useMemo(
    () => ({
      lines,
      add,
      update,
      setLineTotal,
      setPrice,
      remove,
      clear,
      discount,
      setDiscount,
      rounding,
      setRounding,
      subtotal,
      finalTotal,
      count: lines.length,
    }),
    [lines, add, update, setLineTotal, setPrice, remove, clear, discount, rounding, subtotal, finalTotal]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const v = useContext(CartCtx);
  if (!v) throw new Error("useCart outside provider");
  return v;
}
