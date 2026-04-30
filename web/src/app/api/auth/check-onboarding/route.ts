import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Verify the request belongs to a real session
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ hasBusinessName: false, authenticated: false });
    }

    const { userId, email } = await request.json().catch(() => ({}));

    // Use authoritative session values
    const targetId = authUser.id;
    const targetEmail = authUser.email ?? email;

    // Try to find existing user in Prisma
    let user = await prisma.user.findUnique({ where: { id: targetId } });

    // If no Prisma user, try by email (may have been created out-of-band)
    if (!user && targetEmail) {
      user = await prisma.user.findUnique({ where: { email: targetEmail } });
    }

    // Auto-create the Prisma user if it doesn't exist yet (covers email/password
    // signups when email confirmation is OFF — no callback runs in that case).
    if (!user && targetEmail) {
      user = await prisma.user.create({
        data: {
          id: targetId,
          email: targetEmail,
          name: authUser.user_metadata?.full_name ?? null,
        },
      });
    }

    // Silence unused warning if userId mismatches — we trust the session
    void userId;

    return NextResponse.json({
      hasBusinessName: !!user?.businessName,
      authenticated: true,
    });
  } catch {
    return NextResponse.json({ hasBusinessName: false, authenticated: false });
  }
}
