import { ImageResponse } from "next/og";

// Apple touch icon (home-screen bookmark), generated at build.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#4F46E5",
          color: "#ffffff",
          fontSize: 120,
          fontWeight: 800,
        }}
      >
        A
      </div>
    ),
    { ...size },
  );
}
