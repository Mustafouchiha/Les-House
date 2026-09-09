import { useState } from "react";
import { api } from "../api/client.js";

// Fetches the sale's receipt PDF (with auth) and opens it in a new tab.
export default function ReceiptPdfButton({ saleId, style }) {
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    try {
      const blob = await api.blob(`/sales/${saleId}/receipt.pdf`);
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      if (!w) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `chek-${saleId}.pdf`;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      /* ignore — bot delivery is the primary path */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-secondary" style={style} onClick={open} disabled={busy}>
      {busy ? "…" : "PDF"}
    </button>
  );
}
