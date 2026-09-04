// Money / quantity formatting. UZS by default; USD shown with a "$" prefix.
// fmt() mirrors the mockup's toLocaleString('ru-RU') grouping (spaces).

export function fmt(n) {
  const v = Number(n) || 0;
  return Math.round(v)
    .toLocaleString("ru-RU")
    .replace(/ /g, " ");
}

export function money(n, currency = "UZS") {
  if (currency === "USD") return "$" + (Number(n) || 0).toLocaleString("en-US");
  return fmt(n) + " so'm";
}

// qty: trim trailing zeros, comma decimal separator (uz/ru convention)
export function qty(n, unit) {
  const v = Number(n) || 0;
  const s = (Math.round(v * 1000) / 1000).toString().replace(".", ",");
  return unit ? `${s} ${unit}` : s;
}

export const UNIT_LABEL = {
  M3: "m³",
  M2: "m²",
  METER: "metr",
  PIECE: "dona",
  KG: "kg",
  SET: "komplekt",
};

// parse a user-typed number that may contain spaces and a comma decimal
export function parseNum(v) {
  if (typeof v === "number") return v;
  return parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", ".")) || 0;
}

export const AVAILABILITY_LABEL = {
  IN_STOCK: "Mavjud",
  LOW: "Kam qoldi",
  OUT: "Mavjud emas",
};

export const AVAILABILITY_TAG = {
  IN_STOCK: "tag-ok",
  LOW: "tag-warn",
  OUT: "tag-danger",
};
