import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // Verify the user is authenticated
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, email, name, businessName, businessType } = await request.json();

    // Security: ensure the userId matches the authenticated user
    if (userId !== authUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Upsert the Prisma user record
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        name,
        businessName,
        businessType,
      },
      create: {
        id: userId,
        email: email || authUser.email!,
        name,
        businessName,
        businessType,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("complete-onboarding error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
