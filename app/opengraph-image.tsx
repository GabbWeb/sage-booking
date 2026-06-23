import { ImageResponse } from "next/og";

// Imagen de preview al compartir el link (Open Graph / Twitter). Generada con la
// paleta Apothecary. 1200x630.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Sage Essence, book your clean";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f7f4ec",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            border: "2px solid #c9a372",
            borderRadius: 28,
            padding: "64px 96px",
            backgroundColor: "#f2eee5",
          }}
        >
          <div
            style={{
              fontSize: 26,
              letterSpacing: 10,
              textTransform: "uppercase",
              color: "#a67c52",
            }}
          >
            Sage Essence
          </div>
          <div style={{ fontSize: 96, color: "#1f1810", marginTop: 18 }}>
            Book your clean
          </div>
          <div style={{ fontSize: 30, color: "#5e674f", marginTop: 20 }}>
            Non toxic home cleaning in Austin
          </div>
        </div>
      </div>
    ),
    size,
  );
}
