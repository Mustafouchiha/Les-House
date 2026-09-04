// Thin wrapper over the Telegram WebApp SDK with a browser dev fallback.

import { applyTheme, getThemePref } from "./theme.js";

const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;

export const isTelegram = !!(tg && tg.initData);

export function initTelegram() {
  applyTheme(); // apply the saved light/dark preference (works with or without Telegram)
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    applyTelegramColors();
    tg.onEvent?.("themeChanged", () => {
      applyTelegramColors();
      applyTheme();
    });
    tg.onEvent?.("viewportChanged", () => {
      document.documentElement.style.setProperty(
        "--tg-viewport-height",
        (tg.viewportStableHeight || window.innerHeight) + "px"
      );
    });
  } catch {
    /* not fatal */
  }
}

// Pull Telegram's palette into our color vars, but only while the user hasn't
// forced light/dark themselves.
function applyTelegramColors() {
  if (!tg || getThemePref() !== "system") return;
  const p = tg.themeParams || {};
  const root = document.documentElement;
  const map = {
    "--color-bg": p.bg_color,
    "--color-surface": p.secondary_bg_color || p.bg_color,
    "--color-text": p.text_color,
    "--color-accent": p.button_color,
  };
  for (const [k, v] of Object.entries(map)) if (v) root.style.setProperty(k, v);
}

// Telegram initData string for server-side validation (empty in the browser).
export function getInitData() {
  return tg?.initData || "";
}

export function getInitDataUnsafe() {
  return tg?.initDataUnsafe || null;
}

// Ask the user to share their phone number. Resolves to the contact object,
// or null if declined / unsupported.
export function requestContact() {
  return new Promise((resolve) => {
    if (!tg || !tg.requestContact) return resolve(null);
    try {
      tg.requestContact((ok, ev) => {
        if (!ok) return resolve(null);
        const c =
          ev?.responseUnsafe?.contact ||
          ev?.response?.contact ||
          tg.initDataUnsafe?.user ||
          null;
        resolve(c);
      });
    } catch {
      resolve(null);
    }
  });
}

export function hapticImpact(style = "light") {
  try {
    tg?.HapticFeedback?.impactOccurred(style);
  } catch {
    /* noop */
  }
}

export function closeApp() {
  tg?.close?.();
}
