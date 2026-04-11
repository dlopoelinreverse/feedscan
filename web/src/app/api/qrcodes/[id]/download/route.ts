import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getAbsoluteFormUrl } from "@/lib/domains";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const qrCode = await prisma.qRCode.findUnique({
    where: { id },
    include: { form: { select: { userId: true, slug: true, title: true } } },
  });

  if (!qrCode || qrCode.form.userId !== user.id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = `${getAbsoluteFormUrl(qrCode.form.slug)}?qr=${qrCode.uniqueCode}`;

  // Generate high-resolution PNG with label text below
  const qrBuffer = await QRCode.toBuffer(url, {
    type: "png",
    width: 1024,
    margin: 2,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
    errorCorrectionLevel: "H",
  });

  return new NextResponse(new Uint8Array(qrBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qrcode-${qrCode.label
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase()}.png"`,
    },
  });
}
