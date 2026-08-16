import { ImageResponse } from "next/og";
import { getSiteData } from "@/lib/get-site-data";

// v4 Phase P3 — every delivered site's shared link rendered a blank preview
// before this (no OG image at all). Real per-lead business name + real hero
// photo when one exists; falls back to a brand-color gradient card (the
// same --primary token every other premium component already derives from)
// when it doesn't, never a generic placeholder.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { leadSlug: string } }) {
  const result = await getSiteData(params.leadSlug);
  const payload = result?.payload;

  const businessName = payload?.businessName ?? "BarakahSoft";
  const headline = payload?.headline ?? "";
  const heroImageUrl = payload?.heroImageUrl ?? null;
  const brandHsl = payload?.brandColorHsl ?? "222 89% 55%";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          position: "relative",
          backgroundImage: heroImageUrl
            ? undefined
            : `linear-gradient(135deg, hsl(${brandHsl}), hsl(${brandHsl.split(" ")[0]} ${brandHsl.split(" ")[1]} 20%))`,
          backgroundColor: "#111",
        }}
      >
        {heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImageUrl}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.35) 100%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", padding: "64px" }}>
          <div style={{ fontSize: 56, fontWeight: 700, color: "white", lineHeight: 1.1, display: "flex" }}>{businessName}</div>
          {headline && (
            <div style={{ fontSize: 30, color: "rgba(255,255,255,0.85)", marginTop: 16, display: "flex", maxWidth: 900 }}>
              {headline}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
