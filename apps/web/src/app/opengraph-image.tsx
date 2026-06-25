import { ImageResponse } from "next/og";

// Site-wide default social share image (Open Graph + Twitter). Individual routes
// can override by adding their own opengraph-image. Generated at build time.
export const alt = "AccessAudit Pro — WCAG 2.2 accessibility audits for agencies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND = "#4F46E5";

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
          backgroundColor: "#ffffff",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 14,
            backgroundColor: BRAND,
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: BRAND,
          }}
        >
          WCAG 2.2 · EAA / EN 301 549
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              color: "#0f172a",
              maxWidth: 940,
            }}
          >
            Accessibility audits your clients can actually read.
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#475569", maxWidth: 880 }}>
            Scan any site → prioritized WCAG report → white-label deliverable. Built for agencies.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 12,
              backgroundColor: BRAND,
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            A
          </div>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#0f172a" }}>
            <span>AccessAudit&nbsp;</span>
            <span style={{ color: BRAND }}>Pro</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
