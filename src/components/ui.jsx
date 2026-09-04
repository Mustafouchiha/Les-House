// Small shared UI primitives.

export function Corners() {
  return (
    <>
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
    </>
  );
}

export function Blueprint({ children, style, className = "", ...rest }) {
  return (
    <div
      className={`blueprint ${className}`}
      style={{ padding: "var(--space-6)", ...style }}
      {...rest}
    >
      <Corners />
      {children}
    </div>
  );
}

export function Kpi({ label, value, note }) {
  return (
    <Blueprint style={{ background: "var(--color-accent-100)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 26, lineHeight: 1, color: "var(--color-accent-900)" }}>
        {value}
      </div>
      {note ? <div style={{ fontSize: 12, color: "var(--color-neutral-800)" }}>{note}</div> : null}
    </Blueprint>
  );
}

export function Dialog({ title, children, onClose, actions }) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog blueprint" onClick={(e) => e.stopPropagation()}>
        <Corners />
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 20 }}>{title}</div>
        <div>{children}</div>
        {actions ? (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

export function Toast({ text }) {
  if (!text) return null;
  return <div className="toast">{text}</div>;
}

export function Loader({ label = "Yuklanmoqda…" }) {
  return (
    <div style={{ display: "grid", placeItems: "center", gap: 12, padding: 48 }}>
      <div className="spin" />
      <div className="muted" style={{ fontSize: 13 }}>{label}</div>
    </div>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        return (
          <button
            key={val}
            className={`seg-opt${value === val ? " on" : ""}`}
            onClick={() => onChange(val)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// Price-health indicator (spec §7): green ≥ start, yellow between min and start,
// red within 3% of min, and blocking below min.
export function priceHealth(price, minPrice, startPrice) {
  if (minPrice == null) return { color: "var(--ok)", label: "—", blocked: false };
  if (price < minPrice) return { color: "var(--danger)", label: "Minimaldan past", blocked: true };
  if (startPrice != null && price >= startPrice)
    return { color: "var(--ok)", label: "Yaxshi", blocked: false };
  if (price <= minPrice * 1.03)
    return { color: "var(--danger)", label: "Minimalga yaqin", blocked: false };
  return { color: "var(--warn)", label: "Boshlang'ichdan past", blocked: false };
}

export function PriceDot({ price, minPrice, startPrice }) {
  const h = priceHealth(price, minPrice, startPrice);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: h.color }}>
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: h.color }} />
      {h.label}
    </span>
  );
}
