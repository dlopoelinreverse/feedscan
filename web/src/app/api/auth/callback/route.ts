import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl, getAuthUrl } from "@/lib/domains";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(getAuthUrl("/login?error=missing_code"));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(getAuthUrl("/login?error=auth_callback_error"));
  }

  // Ensure a Prisma User record exists
  const user = await prisma.user.findUnique({ where: { id: data.user.id } });

  if (!user) {
    // Create Prisma user from OAuth data
    await prisma.user.create({
      data: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name || null,
      },
    });
    // New user → onboarding
    return NextResponse.redirect(getAuthUrl("/onboarding"));
  }

  // Existing user — check if onboarding is complete
  if (!user.businessName) {
    return NextResponse.redirect(getAuthUrl("/onboarding"));
  }

  return NextResponse.redirect(getAppUrl("/dashboard"));
}
