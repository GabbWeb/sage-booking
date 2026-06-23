import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Imagen de preview al compartir el link (Open Graph / Twitter). Replica la
// estetica del landing: paleta Apothecary, Cormorant Garamond para el titular y
// Jost para los rotulos, con el monograma de marca. 1200x630.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Sage Essence, non-toxic home cleaning in Austin, TX";

const C = {
  ink: "#1F1810",
  sage: "#77816B",
  sageDeep: "#5E674F",
  amber: "#A67C52",
  amberLight: "#C9A372",
  cream: "#F2EEE5",
  paper: "#F7F4EC",
};

async function font(file: string) {
  return readFile(join(process.cwd(), "assets/fonts", file));
}

export default async function OpengraphImage() {
  const [cormorant500, cormorant600, jost400, jost500] = await Promise.all([
    font("CormorantGaramond-500.ttf"),
    font("CormorantGaramond-600.ttf"),
    font("Jost-400.ttf"),
    font("Jost-500.ttf"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          backgroundColor: C.paper,
          backgroundImage: `linear-gradient(150deg, ${C.cream} 0%, ${C.paper} 55%, ${C.cream} 100%)`,
          fontFamily: "Jost",
          position: "relative",
        }}
      >
        {/* Marco fino de marca */}
        <div
          style={{
            position: "absolute",
            top: 26,
            left: 26,
            right: 26,
            bottom: 26,
            border: `1.5px solid ${C.amberLight}`,
            borderRadius: 20,
          }}
        />

        {/* Encabezado: monograma + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 78,
              height: 78,
              borderRadius: 18,
              backgroundColor: C.sageDeep,
              color: C.cream,
              fontFamily: "Cormorant Garamond",
              fontWeight: 600,
              fontSize: 50,
            }}
          >
            S
          </div>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 14,
              textTransform: "uppercase",
              color: C.amber,
              fontWeight: 500,
            }}
          >
            Sage Essence
          </div>
        </div>

        {/* Cuerpo: eyebrow + titular */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 27,
              letterSpacing: 7,
              textTransform: "uppercase",
              color: C.sageDeep,
              fontWeight: 500,
              marginBottom: 22,
            }}
          >
            Non-Toxic Home Care in Austin, TX
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Cormorant Garamond",
              fontWeight: 500,
              fontSize: 96,
              lineHeight: 1.04,
              color: C.ink,
              maxWidth: 920,
            }}
          >
            A home that&#39;s truly clean, and truly safe.
          </div>
        </div>

        {/* Pie: linea, sublede y dominio */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", height: 1, backgroundColor: C.amberLight, opacity: 0.6 }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", fontSize: 24, color: C.sage, fontWeight: 400, maxWidth: 640 }}>
              Botanical-grade cleaning, designed around your health.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                letterSpacing: 3,
                color: C.amber,
                fontWeight: 500,
              }}
            >
              thesageessence.com
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Cormorant Garamond", data: cormorant500, weight: 500, style: "normal" },
        { name: "Cormorant Garamond", data: cormorant600, weight: 600, style: "normal" },
        { name: "Jost", data: jost400, weight: 400, style: "normal" },
        { name: "Jost", data: jost500, weight: 500, style: "normal" },
      ],
    },
  );
}
