import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { pushEvent } from "@/lib/sse";
import { NextResponse } from "next/server";

// GET /api/handoff?companyId=X — Get active/pending handoff conversations
export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId: string = session.user.id;

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId") || session.user.companyId;
  const filter = searchParams.get("filter") || "pending"; // pending | active | all

  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 400 });

  // Check role: company_admin and agent can view their company's handoffs
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, companyId: true },
  });
  if (!user || (user.role !== "super_admin" && user.companyId !== companyId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let statusFilter: string[];
  if (filter === "pending") statusFilter = ["handoff_requested"];
  else if (filter === "active") statusFilter = ["handoff_active"];
  else statusFilter = ["handoff_requested", "handoff_active"];

  const conversations = await prisma.conversation.findMany({
    where: {
      companyId,
      status: { in: statusFilter },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 50,
      },
      agentChats: {
        include: { agent: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ conversations });
}

// POST /api/handoff — Request handoff, join conversation, send message
export async function POST(request: Request) {
  const body = await request.json();
  const { action, conversationId, companyId, message } = body;

  switch (action) {
    // ===== CUSTOMER REQUESTS HANDOFF (no auth needed, from widget) =====
    case "request": {
      if (!conversationId) {
        return NextResponse.json({ error: "conversationId required" }, { status: 400 });
      }

      const conv = await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: "handoff_requested" },
      });

      await prisma.message.create({
        data: {
          conversationId,
          role: "system",
          content: "🔄 Customer requested a human agent",
          source: "system",
        },
      });

      return NextResponse.json({ status: "handoff_requested", conversation: conv });
    }

    // ===== AGENT JOINS CONVERSATION =====
    case "join": {
      const session = await auth();
      if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const userId: string = session.user.id;

      if (!conversationId) {
        return NextResponse.json({ error: "conversationId required" }, { status: 400 });
      }

      const existing = await prisma.agentChat.findUnique({
        where: {
          agentId_conversationId: {
            agentId: userId,
            conversationId,
          },
        },
      });

      if (!existing) {
        await prisma.agentChat.create({
          data: {
            agentId: userId,
            conversationId,
            status: "active",
          },
        });
      }

      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: "handoff_active",
          agentId: userId,
        },
      });

      const sysMsg = await prisma.message.create({
        data: {
          conversationId,
          role: "system",
          content: `👤 Agent ${session.user.name || "support"} has joined the conversation`,
          source: "system",
        },
      });

      // Push agent-joined event via SSE
      pushEvent(conversationId, {
        type: "agent_joined",
        message: {
          id: sysMsg.id,
          role: "system",
          content: sysMsg.content,
          createdAt: sysMsg.createdAt.toISOString(),
        },
      });

      return NextResponse.json({ status: "joined" });
    }

    // ===== AGENT SENDS MESSAGE =====
    case "message": {
      const session = await auth();
      if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const userId: string = session.user.id;

      if (!conversationId || !message) {
        return NextResponse.json({ error: "conversationId and message required" }, { status: 400 });
      }

      const msg = await prisma.message.create({
        data: {
          conversationId,
          role: "agent",
          content: message,
          source: "human",
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          messageCount: { increment: 1 },
          status: "handoff_active",
        },
      });

      // Push new message via SSE — instant delivery to widget
      pushEvent(conversationId, {
        type: "new_message",
        message: {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
        },
      });

      return NextResponse.json({ message: msg });
    }

    // ===== AGENT RESOLVES CONVERSATION =====
    case "resolve": {
      const session = await auth();
      if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const userId: string = session.user.id;

      if (!conversationId) {
        return NextResponse.json({ error: "conversationId required" }, { status: 400 });
      }

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: "closed" },
      });

      await prisma.agentChat.updateMany({
        where: { conversationId, agentId: userId },
        data: { status: "resolved", resolvedAt: new Date() },
      });

      const resolveMsg = await prisma.message.create({
        data: {
          conversationId,
          role: "system",
          content: "✅ Conversation resolved",
          source: "system",
        },
      });

      // Push conversation-closed event via SSE
      pushEvent(conversationId, {
        type: "conversation_closed",
        message: {
          id: resolveMsg.id,
          role: "system",
          content: resolveMsg.content,
          createdAt: resolveMsg.createdAt.toISOString(),
        },
      });

      return NextResponse.json({ status: "resolved" });
    }

    // ===== CUSTOMER CANCELS HANDOFF =====
    case "cancel": {
      if (!conversationId) {
        return NextResponse.json({ error: "conversationId required" }, { status: 400 });
      }

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: "active" },
      });

      return NextResponse.json({ status: "active" });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
