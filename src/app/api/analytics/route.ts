import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/analytics?companyId=X — Get analytics data
export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId") || session.user.companyId;
  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 400 });

  // Check permissions
  const user = await prisma.user.findUnique({
    where: { id: session.user?.id || "" },
    select: { role: true, companyId: true },
  });
  if (!user || (user.role !== "super_admin" && user.companyId !== companyId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get company info
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { tokensUsed: true, tokenLimit: true },
  });

  // Get conversation stats
  const totalConversations = await prisma.conversation.count({
    where: { companyId },
  });

  const activeConversations = await prisma.conversation.count({
    where: { companyId, status: { not: "closed" } },
  });

  const handoffConversations = await prisma.conversation.count({
    where: {
      companyId,
      status: { in: ["handoff_requested", "handoff_active"] },
    },
  });

  // Total messages (non-system)
  const messageCount = await prisma.message.count({
    where: {
      conversation: { companyId },
      role: { notIn: ["system"] },
    },
  });

  // Total tokens used by this company
  const tokenAgg = await prisma.conversation.aggregate({
    where: { companyId },
    _sum: { tokenCost: true },
  });
  const totalTokens = tokenAgg._sum.tokenCost || 0;

  // KB stats
  const kbCount = await prisma.knowledgeBase.count({
    where: { companyId, active: true },
  });

  const totalChunks = await prisma.knowledgeBase.aggregate({
    where: { companyId, active: true },
    _sum: { chunkCount: true },
  });

  // Recent conversations (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentConvs = await prisma.conversation.count({
    where: {
      companyId,
      createdAt: { gte: sevenDaysAgo },
    },
  });

  // Token usage by day (last 7 days)
  const dailyTokens: Array<{ date: string; tokens: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayConvs = await prisma.conversation.findMany({
      where: {
        companyId,
        createdAt: { gte: dayStart, lte: dayEnd },
      },
      select: { tokenCost: true },
    });

    const dayTokens = dayConvs.reduce((sum, c) => sum + (c.tokenCost || 0), 0);
    dailyTokens.push({
      date: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tokens: dayTokens,
    });
  }

  return NextResponse.json({
    company: {
      tokensUsed: company?.tokensUsed || 0,
      tokenLimit: company?.tokenLimit || 0,
    },
    conversations: {
      total: totalConversations,
      active: activeConversations,
      handoff: handoffConversations,
      recent7Days: recentConvs,
    },
    messages: messageCount,
    tokens: {
      total: totalTokens,
      daily: dailyTokens,
    },
    knowledge: {
      entries: kbCount,
      chunks: totalChunks._sum.chunkCount || 0,
    },
  });
}
