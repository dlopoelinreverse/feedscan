import { prisma } from "@/lib/prisma";
import { handleOptions, jsonWithCors } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

interface VisitorInput {
  cookieId?: string | null;
  fingerprintHash?: string | null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VisitorInput;
    const { cookieId, fingerprintHash } = body;

    let visitor = null;

    // 1. Try matching by cookieId
    if (cookieId) {
      visitor = await prisma.visitor.findUnique({
        where: { cookieId },
      });
    }

    // 2. Try matching by fingerprint if no cookie match
    if (!visitor && fingerprintHash) {
      visitor = await prisma.visitor.findFirst({
        where: { fingerprintHash },
      });

      // Update cookieId on the existing visitor
      if (visitor && cookieId && visitor.cookieId !== cookieId) {
        visitor = await prisma.visitor.update({
          where: { id: visitor.id },
          data: { cookieId, lastSeenAt: new Date() },
        });
      }
    }

    // 3. Create a new visitor
    if (!visitor) {
      visitor = await prisma.visitor.create({
        data: {
          cookieId: cookieId ?? null,
          fingerprintHash: fingerprintHash ?? null,
        },
      });
    } else {
      // Touch lastSeenAt
      await prisma.visitor.update({
        where: { id: visitor.id },
        data: { lastSeenAt: new Date() },
      });
    }

    return jsonWithCors(request, { visitorId: visitor.id });
  } catch (err) {
    console.error("visitors POST error", err);
    return jsonWithCors(
      request,
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
