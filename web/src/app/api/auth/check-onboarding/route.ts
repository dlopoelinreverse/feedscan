import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json();

    if (!userId) {
      return NextResponse.json({ hasBusinessName: false });
    }

    // Try to find existing user in Prisma
    let user = await prisma.user.findUnique({ where: { id: userId } });

    // If no Prisma user, try by email (may have been created differently)
    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    return NextResponse.json({
      hasBusinessName: !!user?.businessName,
    });
  } catch {
    return NextResponse.json({ hasBusinessName: false });
  }
}
