import { ImageResponse } from "next/og";

// Touch icon for iOS home-screen / bookmarks — the Verdant leaf on an emerald tile.
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
          backgroundImage: "linear-gradient(140deg, #22c55e, #15803d)",
          borderRadius: 40,
        }}
      >
        <svg viewBox="0 0 24 24" width={112} height={112} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2.5c-5.3 3-8 7.4-6.4 12.9.3 1 .8 2 1.5 2.9C9 15.7 11.4 12.7 15 10.8c-2.7 2.6-4.6 5.7-5.6 9.4 4.9 1.3 9.2-1.4 10.2-6.6C20.6 7.7 17.4 3.6 12 2.5Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
