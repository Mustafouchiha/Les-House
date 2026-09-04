// Light / dark theme preference. Values: "system" | "light" | "dark".
// "system" follows Telegram's colorScheme inside Telegram, or the OS setting
// (prefers-color-scheme) in a plain browser. An explicit choice wins over both.

const KEY = "tb_theme";
const listeners = new Set();

export function getThemePref() {
  try {
    return localStorage.getItem(KEY) || "system";
  } catch {
    return "system";
  }
}

export function setThemePref(v) {
  try {
    if (v === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, v);
  } catch {
    /* ignore */
  }
  applyTheme();
  listeners.forEach((fn) => fn(v));
}

export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// The theme actually in effect right now ("light" | "dark").
export function resolvedTheme() {
  const pref = getThemePref();
  if (pref === "light" || pref === "dark") return pref;
  const tgScheme = typeof window !== "undefined" ? window.Telegram?.WebApp?.colorScheme : null;
  if (tgScheme) return tgScheme;
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

const TG_VARS = ["--color-bg", "--color-surface", "--color-text", "--color-accent"];

export function applyTheme() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const pref = getThemePref();

  if (pref === "light" || pref === "dark") {
    // drop any inline vars Telegram injected so the stylesheet palette wins
    TG_VARS.forEach((v) => root.style.removeProperty(v));
    root.setAttribute("data-theme", pref);
    return;
  }
  // system: inside Telegram pin to its scheme; on the web let CSS media queries drive
  const tgScheme = window.Telegram?.WebApp?.colorScheme;
  if (tgScheme) root.setAttribute("data-theme", tgScheme);
  else root.removeAttribute("data-theme");
}

// keep "system" in sync with OS changes on the web
if (typeof window !== "undefined" && window.matchMedia) {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener?.("change", () => {
      if (getThemePref() === "system") applyTheme();
    });
}
