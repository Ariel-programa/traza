import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const targetUrl = `${baseUrl}/public/activo/${encodeURIComponent(slug)}`;

  const buffer = await QRCode.toBuffer(targetUrl, {
    type: "png",
    width: 480,
    margin: 1,
    color: { dark: "#0f1522", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
