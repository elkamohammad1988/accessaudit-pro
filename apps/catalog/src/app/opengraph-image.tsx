import { ImageResponse } from "next/og";

// Social share card (1200×630), generated at build. A calm cream sheet with the
// Verdant leaf mark, wordmark and tagline — auto-attached to every page's metadata.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Verdant — a curated catalogue of considered goods";

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
          padding: 88,
          background: "linear-gradient(135deg, #f8fff8 0%, #eafaf0 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: "linear-gradient(140deg, #22c55e, #15803d)",
              borderRadius: 24,
            }}
          >
            <svg viewBox="0 0 24 24" width={62} height={62} fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2.5c-5.3 3-8 7.4-6.4 12.9.3 1 .8 2 1.5 2.9C9 15.7 11.4 12.7 15 10.8c-2.7 2.6-4.6 5.7-5.6 9.4 4.9 1.3 9.2-1.4 10.2-6.6C20.6 7.7 17.4 3.6 12 2.5Z"
                fill="#ffffff"
              />
            </svg>
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, color: "#14532d", letterSpacing: -1 }}>
            Verdant
          </div>
        </div>

        {/* Headline + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 76,
              fontWeight: 800,
              color: "#0f2a1a",
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            <span>Considered things,</span>
            <span>for a considered home.</span>
          </div>
          <div style={{ fontSize: 30, color: "#3f6b52", maxWidth: 900 }}>
            A curated catalogue of design objects, furniture, lighting and living things.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
