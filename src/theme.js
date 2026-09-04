// Light / dark theme preference. Values: "light" | "dark" | "system".
// The Mini App opens in LIGHT mode by default (spec: birinchi kirishda yorug'
// rejim). "Tizim" is an explicit choice the user can make later in Profil that
// follows Telegram's colorScheme inside Telegram, or the OS setting
// (prefers-color-scheme) in a plain browser.

const KEY = "tb_theme";
const DEFAULT_THEME = "light";
const listeners = new Set();

export function getThemePref() {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function setThemePref(v) {
  try {
    localStorage.setItem(KEY, v);
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

// ---- accent (brand) color ----------------------------------------------
// A user-chosen accent propagates through the whole ramp via color-mix() in
// theme.css, so any hue stays legible in both light and dark automatically.

const ACCENT_KEY = "tb_accent";
export const ACCENT_PRESETS = [
  { name: "Yashil", hex: "#17874a" },
  { name: "Ko'k", hex: "#2563eb" },
  { name: "Binafsha", hex: "#7c3aed" },
  { name: "Za'faron", hex: "#ea580c" },
  { name: "Qizil", hex: "#dc2626" },
  { name: "Feruza", hex: "#0d9488" },
];
const DEFAULT_ACCENT = ACCENT_PRESETS[0].hex;

export function getAccentPref() {
  try {
    const v = localStorage.getItem(ACCENT_KEY);
    if (v && /^#[0-9a-fA-F]{6}$/.test(v)) return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_ACCENT;
}

export function setAccentPref(hex) {
  try {
    localStorage.setItem(ACCENT_KEY, hex);
  } catch {
    /* ignore */
  }
  applyAccent();
  listeners.forEach((fn) => fn(hex));
}

export function applyAccent() {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--user-accent", getAccentPref());
}
