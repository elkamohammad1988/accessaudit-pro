import { ImageResponse } from "next/og";

// Site-wide default social share image (Open Graph + Twitter). Individual routes
// can override by adding their own opengraph-image. Generated at build time.
export const alt = "AccessAudit Pro — WCAG 2.2 accessibility audits for agencies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND = "#4F46E5";
const TAGS = ["WCAG 2.2 AA", "EAA / EN 301 549", "Powered by axe-core"];

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
          backgroundImage: "linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            display: "flex",
            width: "100%",
            height: 14,
            backgroundImage: `linear-gradient(90deg, ${BRAND} 0%, #818cf8 100%)`,
          }}
        />
        {/* soft brand orb, top-right, for depth */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            display: "flex",
            width: 360,
            height: 360,
            borderRadius: 9999,
            backgroundColor: "rgba(79,70,229,0.10)",
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
              fontSize: 70,
              fontWeight: 800,
              lineHeight: 1.05,
              color: "#0f172a",
              maxWidth: 960,
            }}
          >
            Accessibility audits your clients can actually read.
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#475569", maxWidth: 900 }}>
            Scan any site → prioritized WCAG report → white-label deliverable. Built for agencies.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: 14,
                backgroundImage: `linear-gradient(135deg, ${BRAND} 0%, #6366f1 100%)`,
                color: "#ffffff",
                fontSize: 30,
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
          <div style={{ display: "flex", gap: 12 }}>
            {TAGS.map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 18px",
                  borderRadius: 9999,
                  border: "1px solid rgba(79,70,229,0.25)",
                  backgroundColor: "rgba(79,70,229,0.06)",
                  color: BRAND,
                  fontSize: 20,
                  fontWeight: 600,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
