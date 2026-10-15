import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f2a4a",
          borderRadius: 8,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
          <circle cx="9" cy="14" r="2.4" stroke="white" strokeWidth="3.6" />
          <path d="M13 14 H24" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
          <path d="M24 14 V36" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
          <path d="M24 14 C31 14 37 18 39 25" stroke="white" strokeWidth="3.8" strokeLinecap="round" fill="none" />
          <circle cx="39.5" cy="26.5" r="4" fill="#17b8a6" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
