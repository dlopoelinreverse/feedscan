import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const formId = searchParams.get("formId");
  if (!formId) {
    return NextResponse.json({ error: "Missing formId" }, { status: 400 });
  }

  const conversation = await prisma.aiConversation.findUnique({
    where: { formId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation || conversation.userId !== user.id) {
    return NextResponse.json({ conversation: null });
  }

  return NextResponse.json({ conversation });
}

const patchSchema = z.object({
  formId: z.string().min(1),
  phase: z.enum(["wizard", "angles", "chat", "validated"]).optional(),
  selectedAngles: z.array(z.any()).optional(),
  businessContext: z.any().optional(),
  generatedForm: z.any().optional(),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { formId, ...patch } = parsed.data;

  const existing = await prisma.aiConversation.findUnique({
    where: { formId },
    select: { id: true, userId: true },
  });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.aiConversation.update({
    where: { id: existing.id },
    data: patch,
  });

  return NextResponse.json({ conversation: updated });
}
