import { ImageResponse } from "next/og";

export const alt = "TRAZA — Gestión y trazabilidad para transporte y logística";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Imagen para compartir: misma gramática visual que la landing (ruta con
// origen hueco y llegada sólida en teal sobre fondo azul noche).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#060e1a",
          color: "#eef3fb",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <circle cx="9" cy="14" r="2.4" stroke="#3b7bf6" strokeWidth="3.4" />
            <path d="M13 14 H24" stroke="#3b7bf6" strokeWidth="3.6" strokeLinecap="round" />
            <path d="M24 14 V36" stroke="#3b7bf6" strokeWidth="3.6" strokeLinecap="round" />
            <path d="M24 14 C31 14 37 18 39 25" stroke="#3b7bf6" strokeWidth="3.6" strokeLinecap="round" fill="none" />
            <circle cx="39.5" cy="26.5" r="3.8" fill="#14b8a6" />
          </svg>
          <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.5 }}>TRAZA</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 74, fontWeight: 600, lineHeight: 1.02, letterSpacing: -2.5, maxWidth: 900 }}>
            Controlá cada movimiento de tu operación.
          </div>
          <div style={{ marginTop: 26, fontSize: 28, color: "#a6b6cc" }}>
            Vehículos, conductores, traslados, gastos y documentación en un solo registro.
          </div>
        </div>

        <svg width="1040" height="60" viewBox="0 0 1040 60" fill="none">
          <circle cx="8" cy="46" r="6" fill="#060e1a" stroke="#14b8a6" strokeWidth="3" />
          <path d="M 16 46 C 200 46 280 12 480 16 S 760 54 900 34 S 1000 12 1028 12" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
          <circle cx="1030" cy="12" r="8" fill="#14b8a6" />
        </svg>
      </div>
    ),
    size
  );
}
