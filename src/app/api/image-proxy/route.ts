import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Server-side image proxy to convert any external image URL to base64 data URI
// and bypass browser cross-origin CORS restrictions during high-res canvas exports.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing image url" }, { status: 400 });
  }

  try {
    let fullUrl = imageUrl.trim();
    if (fullUrl.startsWith("/")) {
      const origin = new URL(req.url).origin;
      fullUrl = `${origin}${fullUrl}`;
    }

    const res = await fetch(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BarakahSoft/1.0)",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Image fetch failed: ${res.status}` }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${contentType};base64,${base64}`;

    return NextResponse.json(
      {
        dataUri,
        contentType,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      }
    );
  } catch (err) {
    console.error("[image-proxy] error fetching", imageUrl, err);
    return NextResponse.json({ error: "Could not fetch image" }, { status: 500 });
  }
}
