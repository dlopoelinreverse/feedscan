import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAbsoluteAuthUrl, getAbsoluteAppUrl } from "@/lib/domains";
import { prisma } from "@/lib/prisma";

async function redirectWithSignOut(url: string) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("[auth/callback] signOut during error redirect failed:", err);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return redirectWithSignOut(getAbsoluteAuthUrl("/login?error=missing_code"));
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      console.error(
        "[auth/callback] exchangeCodeForSession error:",
        error?.message
      );
      return redirectWithSignOut(
        getAbsoluteAuthUrl("/login?error=auth_callback_error")
      );
    }

    // Ensure a Prisma User record exists
    const user = await prisma.user.findUnique({ where: { id: data.user.id } });

    if (!user) {
      await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || null,
        },
      });
      return NextResponse.redirect(getAbsoluteAuthUrl("/onboarding"));
    }

    if (!user.businessName) {
      return NextResponse.redirect(getAbsoluteAuthUrl("/onboarding"));
    }

    return NextResponse.redirect(getAbsoluteAppUrl("/dashboard"));
  } catch (err) {
    console.error("[auth/callback] unexpected error:", err);
    return redirectWithSignOut(
      getAbsoluteAuthUrl("/login?error=auth_callback_error")
    );
  }
}
