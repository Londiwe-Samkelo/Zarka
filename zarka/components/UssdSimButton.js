"use client";
import { useState } from "react";

const SIM_URL = "http://localhost:4000/ussd/sim";

export default function UssdSimButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", right: 16, bottom: 90, zIndex: 50,
          background: "#ff6a00", color: "#fff", border: "none",
          borderRadius: 999, padding: "12px 16px", fontWeight: 700,
          boxShadow: "0 4px 12px rgba(0,0,0,.4)",
        }}
      >
        USSD
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,.7)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#111", borderRadius: 16, padding: 12, width: "min(400px, 92vw)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", marginBottom: 8 }}>
              <strong>USSD Simulator</strong>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: "#fff", fontSize: 20 }}
              >
                ×
              </button>
            </div>
            <iframe
              src={SIM_URL}
              title="USSD simulator"
              style={{ width: "100%", height: 480, border: "none", borderRadius: 8, background: "#111" }}
            />
          </div>
        </div>
      )}
    </>
  );
}