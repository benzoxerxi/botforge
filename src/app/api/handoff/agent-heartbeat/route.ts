import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/handoff/agent-heartbeat — Register agent online status
export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId: string = session.user.id;
  const companyId = session.user.companyId;

  if (!companyId)
    return NextResponse.json({ error: "No company" }, { status: 400 });

  // Upsert heartbeat — create or refresh session
  const agentSession = await prisma.agentSession.upsert({
    where: { agentId: userId },
    create: {
      agentId: userId,
      companyId,
      loadCount: 0,
      lastHeartbeat: new Date(),
      active: true,
    },
    update: {
      lastHeartbeat: new Date(),
      active: true,
    },
  });

  return NextResponse.json({
    agentId: userId,
    loadCount: agentSession.loadCount,
    lastHeartbeat: agentSession.lastHeartbeat,
  });
}

// DELETE /api/handoff/agent-heartbeat — Agent goes offline
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId: string = session.user.id;

  await prisma.agentSession.update({
    where: { agentId: userId },
    data: { active: false },
  });

  return NextResponse.json({ offline: true });
}
