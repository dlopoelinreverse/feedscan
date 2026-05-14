import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  suggestions: z.array(z.string()).optional(),
});

const postSchema = z.object({
  messages: z.array(messageSchema).min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await prisma.aiConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, userId: true },
  });

  if (!conversation || conversation.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const created = await prisma.aiMessage.createManyAndReturn({
    data: parsed.data.messages.map((m) => ({
      conversationId,
      role: m.role,
      content: m.content,
      suggestions: m.suggestions ?? Prisma.JsonNull,
    })),
  });

  return NextResponse.json({ messages: created });
}
