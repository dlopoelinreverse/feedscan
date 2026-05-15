import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { PRESETS } from "@/lib/themes/presets";
import type { ThemePresetId } from "@/lib/themes/types";

const VALID_PRESETS: ReadonlySet<ThemePresetId> = new Set([
  "minimal",
  "warm",
  "bold",
  "elegant",
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      userId,
      email,
      name,
      businessName,
      businessType,
      themePreset,
    } = await request.json();

    if (userId !== authUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const presetId: ThemePresetId =
      typeof themePreset === "string" && VALID_PRESETS.has(themePreset as ThemePresetId)
        ? (themePreset as ThemePresetId)
        : "minimal";

    await prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: userId },
        update: { name, businessName, businessType },
        create: {
          id: userId,
          email: email || authUser.email!,
          name,
          businessName,
          businessType,
        },
      });

      const existing = await tx.theme.findFirst({
        where: { userId, isDefault: true },
        select: { id: true },
      });
      if (!existing) {
        const any = await tx.theme.findFirst({
          where: { userId },
          select: { id: true },
        });
        if (any) {
          await tx.theme.update({
            where: { id: any.id },
            data: { isDefault: true },
          });
        } else {
          await tx.theme.create({
            data: {
              userId,
              name: "Mon premier thème",
              config: PRESETS[presetId] as unknown as object,
              isDefault: true,
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("complete-onboarding error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
