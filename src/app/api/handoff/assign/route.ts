import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/handoff/assign — Auto-distribute handoff requests among online agents
export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId: string = session.user.id;
  const { conversationId } = await request.json();

  if (!conversationId)
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  // Get the conversation
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { companyId: true, status: true },
  });

  if (!conv || conv.status !== "handoff_requested")
    return NextResponse.json({ error: "Not a pending handoff" }, { status: 400 });

  // Find online agents in this company (heartbeat within last 15s)
  const onlineAgents = await prisma.agentSession.findMany({
    where: {
      companyId: conv.companyId,
      active: true,
      lastHeartbeat: { gte: new Date(Date.now() - 15_000) },
    },
    orderBy: { loadCount: "asc" },
  });

  if (onlineAgents.length === 0) {
    // No agents online — leave as pending, anyone can grab
    return NextResponse.json({ assigned: false, reason: "no_agents_online" });
  }

  // Pick the least-loaded agent
  const targetAgent = onlineAgents[0];

  // Assign conversation
  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        assignedAgentId: targetAgent.agentId,
        assignedAt: new Date(),
        // Keep status as handoff_requested until agent accepts
      },
    }),
    prisma.agentSession.update({
      where: { agentId: targetAgent.agentId },
      data: { loadCount: { increment: 1 } },
    }),
    prisma.message.create({
      data: {
        conversationId,
        role: "system",
        content: `Assigned to ${targetAgent.agentId}`,
        source: "system",
      },
    }),
  ]);

  console.log(`[Assign] Conversation ${conversationId} → agent ${targetAgent.agentId}`);

  return NextResponse.json({ assigned: true, agentId: targetAgent.agentId });
}
