import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/widget-history/[conversationId]
// Public-ish — returns full message history for widget's saved conversationId
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  }

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      status: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
        select: { id: true, role: true, content: true, source: true, createdAt: true },
      },
    },
  });

  if (!conv) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: conv.status,
    messages: conv.messages,
  });
}
