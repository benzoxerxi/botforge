import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/handoff/status?conversationId=X — Public endpoint for widget to poll handoff status
// No auth required — uses conversationId as access token
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  }

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      status: true,
      messages: {
        where: { role: { in: ["user", "assistant", "agent", "system"] } },
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
