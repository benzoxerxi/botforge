import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/handoff/assigned-expiry — Check and expire stale assignments (30s)
// Called by client periodically + server-side check on session join
export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await request.json();

  if (!conversationId)
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { assignedAgentId: true, assignedAt: true, status: true },
  });

  if (!conv || !conv.assignedAgentId || conv.status !== "handoff_requested")
    return NextResponse.json({ expired: false });

  // 30s timeout
  const ASSIGNMENT_TIMEOUT = 30_000;
  const stale = conv.assignedAt &&
    (Date.now() - new Date(conv.assignedAt).getTime()) > ASSIGNMENT_TIMEOUT;

  if (!stale)
    return NextResponse.json({ expired: false });

  // Expire: clear assignment, return to pool
  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedAgentId: null, assignedAt: null },
    }),
    prisma.agentSession.update({
      where: { agentId: conv.assignedAgentId },
      data: { loadCount: { decrement: 1 } },
    }),
  ]);

  console.log(`[Expiry] Conversation ${conversationId} expired from ${conv.assignedAgentId}`);

  return NextResponse.json({ expired: true });
}
