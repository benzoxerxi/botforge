import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/handoff/agent-assigned — Get conversations assigned to current agent
export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId: string = session.user.id;
  const companyId = session.user.companyId;
  if (!companyId)
    return NextResponse.json({ error: "No company" }, { status: 400 });

  // Fetch assigned conversations (not yet accepted)
  const assigned = await prisma.conversation.findMany({
    where: {
      companyId,
      assignedAgentId: userId,
      status: "handoff_requested",
      agentChats: { none: { agentId: userId } }, // not yet joined
    },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 20 },
      agentChats: { include: { agent: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: { assignedAt: "asc" },
  });

  return NextResponse.json({ conversations: assigned });
}
