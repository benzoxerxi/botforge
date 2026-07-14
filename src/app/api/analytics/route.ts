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

  // 30-day window for recent stats
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // ====== ✔️ 1. Waiting conversations (handoff requested, no agent yet) =====
  const waitingConversations = await prisma.conversation.count({
    where: {
      companyId,
      status: "handoff_requested",
    },
  });

  // ====== ✔️ 2. Agent Response Time (avg seconds from last user msg to first agent reply) =====
  let avgResponseTimeSeconds = 0;
  try {
    const result: any = await prisma.$queryRawUnsafe(`
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (first_agent."createdAt" - prev_user."createdAt"))), 0) as avg_seconds
      FROM (
        SELECT DISTINCT ON (m."conversationId")
          m."conversationId",
          m."createdAt"
        FROM "Message" m
        JOIN "Conversation" c ON c.id = m."conversationId"
        WHERE m.role = 'agent'
          AND c."companyId" = $1
          AND c."createdAt" >= $2
        ORDER BY m."conversationId", m."createdAt" ASC
      ) first_agent
      JOIN LATERAL (
        SELECT m2."createdAt"
        FROM "Message" m2
        WHERE m2."conversationId" = first_agent."conversationId"
          AND m2.role = 'user'
          AND m2."createdAt" < first_agent."createdAt"
        ORDER BY m2."createdAt" DESC
        LIMIT 1
      ) prev_user ON true
    `, companyId, thirtyDaysAgo);
    avgResponseTimeSeconds = Math.round(Number(result?.[0]?.avg_seconds) || 0);
  } catch (e) {
    console.error("Agent response time query failed:", e);
  }

  // ====== ✔️ 3-4. Bot Resolution + Transfer Rate =====
  const totalClosedConversations = await prisma.conversation.count({
    where: { companyId, status: "closed" },
  });

  // Conversations that ever had agent messages (transferred to human)
  const transferredMsgs = await prisma.message.findMany({
    where: {
      role: "agent",
      conversation: { companyId },
    },
    select: { conversationId: true },
    distinct: ["conversationId"],
  });
  const uniqueTransferredConvs = transferredMsgs.length;

  // Count closed conversations that have NO agent messages (bot-resolved)
  let botResolvedConversations = 0;
  try {
    const botRes: any = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as cnt FROM "Conversation" c
      WHERE c."companyId" = $1
        AND c.status = 'closed'
        AND NOT EXISTS (
          SELECT 1 FROM "Message" m
          WHERE m."conversationId" = c.id AND m.role = 'agent'
        )
    `, companyId);
    botResolvedConversations = Number(botRes?.[0]?.cnt) || 0;
  } catch (e) {
    console.error("Bot resolution query failed:", e);
  }

  const totalConvs = await prisma.conversation.count({
    where: { companyId },
  });

  const botResolutionRate = totalClosedConversations > 0
    ? Math.round((botResolvedConversations / totalClosedConversations) * 100)
    : 0;

  const transferRate = totalConvs > 0
    ? Math.round((uniqueTransferredConvs / totalConvs) * 100)
    : 0;

  // ====== ✔️ 5. Ratings / Customer Satisfaction =====
  const ratings = await prisma.rating.findMany({
    where: { companyId },
    select: { rating: true },
  });

  const ratingCount = ratings.length;
  const averageRating = ratingCount > 0
    ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratingCount) * 10) / 10
    : 0;

  // Rating distribution (1-5 stars)
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    }
  });

  // ====== Existing stat queries =====
  // Get conversation stats (last 30 days)
  const totalConversations = await prisma.conversation.count({
    where: { companyId, createdAt: { gte: thirtyDaysAgo } },
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

  // Messages sent in the last 30 days
  const messageCount = await prisma.message.count({
    where: {
      conversation: { companyId },
      role: { notIn: ["system"] },
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // Total tokens used (all-time for billing accuracy)
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

  // ====== 🧠 Bot Performance Analytics =====
  // Count user messages with bot responses (within 30 days)
  let botHandledQuestions = 0;
  let botFailedQuestions = 0;
  let topFailedQuestions: Array<{ question: string; count: number }> = [];
  let knowledgeGaps: Array<{ topic: string; count: number }> = [];

  try {
    // Count user messages where bot (assistant) replied — "handled"
    const handledRes: any = await prisma.$queryRawUnsafe(`
      SELECT COUNT(DISTINCT m."id") as cnt
      FROM "Message" m
      JOIN "Conversation" c ON c.id = m."conversationId"
      WHERE m.role = 'user'
        AND c."companyId" = $1
        AND c."createdAt" >= $2
        AND EXISTS (
          SELECT 1 FROM "Message" m2
          WHERE m2."conversationId" = m."conversationId"
            AND m2.role = 'assistant'
            AND m2."createdAt" > m."createdAt"
        )
    `, companyId, thirtyDaysAgo);
    botHandledQuestions = Number(handledRes?.[0]?.cnt) || 0;

    // Count user messages from conversations that triggered handoff = "failed"
    const failedRes: any = await prisma.$queryRawUnsafe(`
      SELECT COUNT(DISTINCT m."id") as cnt
      FROM "Message" m
      JOIN "Conversation" c ON c.id = m."conversationId"
      WHERE m.role = 'user'
        AND c."companyId" = $1
        AND c."createdAt" >= $2
        AND (
          c.status IN ('handoff_requested', 'handoff_active')
          OR EXISTS (
            SELECT 1 FROM "Message" m3
            WHERE m3."conversationId" = c.id
              AND m3.role = 'system'
              AND m3.content LIKE '%handoff%'
          )
        )
    `, companyId, thirtyDaysAgo);
    botFailedQuestions = Number(failedRes?.[0]?.cnt) || 0;

    // Top Failed Questions — first user message from handoff conversations, grouped by content
    const topFailedRes: any = await prisma.$queryRawUnsafe(`
      SELECT q."content" as question, COUNT(*)::int as cnt
      FROM (
        SELECT DISTINCT ON (m."conversationId")
          m."conversationId",
          LEFT(m."content", 120) as "content"
        FROM "Message" m
        JOIN "Conversation" c ON c.id = m."conversationId"
        WHERE m.role = 'user'
          AND c."companyId" = $1
          AND c."createdAt" >= $2
          AND (
            c.status IN ('handoff_requested', 'handoff_active')
            OR EXISTS (
              SELECT 1 FROM "Message" m3
              WHERE m3."conversationId" = c.id
                AND m3.role = 'system'
                AND m3.content LIKE '%handoff%'
            )
          )
        ORDER BY m."conversationId", m."createdAt" ASC
      ) q
      GROUP BY q."content"
      ORDER BY cnt DESC
      LIMIT 10
    `, companyId, thirtyDaysAgo);
    if (topFailedRes && Array.isArray(topFailedRes)) {
      topFailedQuestions = topFailedRes.map((r: any) => ({
        question: r.question || "",
        count: Number(r.cnt) || 0,
      })).filter((r: any) => r.question);
    }

    // Knowledge Gaps — same failed questions but grouped by topic (first 3-4 words)
    const gapRes: any = await prisma.$queryRawUnsafe(`
      SELECT q."topic" as topic, COUNT(*)::int as cnt
      FROM (
        SELECT DISTINCT ON (m."conversationId")
          m."conversationId",
          LEFT(REGEXP_REPLACE(
            LOWER(REGEXP_REPLACE(m."content", '[^a-zA-Zა-ჰ0-9\\s]', '', 'g')),
            '^(hi|hello|hey|გამარჯობა|გასალმება|help|დახმარება|question|შეკითხვა|i need|მინდა|can you|შეგიძლია|how|როგორ|what|რა|where|სად|when|როდის|why|რატომ)\\s+',
            '',
            'g'
          ), 60) as "topic"
        FROM "Message" m
        JOIN "Conversation" c ON c.id = m."conversationId"
        WHERE m.role = 'user'
          AND c."companyId" = $1
          AND c."createdAt" >= $2
          AND m."content" != ''
          AND (
            c.status IN ('handoff_requested', 'handoff_active')
            OR EXISTS (
              SELECT 1 FROM "Message" m3
              WHERE m3."conversationId" = c.id
                AND m3.role = 'system'
                AND m3.content LIKE '%handoff%'
            )
          )
        ORDER BY m."conversationId", m."createdAt" ASC
      ) q
      WHERE q."topic" != ''
      GROUP BY q."topic"
      ORDER BY cnt DESC
      LIMIT 8
    `, companyId, thirtyDaysAgo);
    if (gapRes && Array.isArray(gapRes)) {
      knowledgeGaps = gapRes.map((r: any) => ({
        topic: r.topic || "",
        count: Number(r.cnt) || 0,
      })).filter((r: any) => r.topic);
    }
  } catch (e) {
    console.error("Bot performance queries failed:", e);
  }

  // Bot Quality Score — composite (0-100)
  const ratingScore = averageRating * 20; // 5*20 = 100 max
  const resolutionScore = botResolutionRate; // 0-100
  const handoffScore = totalConvs > 0
    ? Math.round((1 - uniqueTransferredConvs / totalConvs) * 100)
    : 100;
  const qualityScore = Math.round((ratingScore * 0.2) + (resolutionScore * 0.4) + (handoffScore * 0.4));

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
    // New analytics
    waitingConversations,
    agentResponseTime: {
      averageSeconds: avgResponseTimeSeconds,
      formatted: avgResponseTimeSeconds > 0
        ? avgResponseTimeSeconds >= 60
          ? `${Math.floor(avgResponseTimeSeconds / 60)}m ${avgResponseTimeSeconds % 60}s`
          : `${avgResponseTimeSeconds}s`
        : "N/A",
    },
    botResolution: {
      rate: botResolutionRate,
      resolvedByBot: botResolvedConversations,
      totalClosed: totalClosedConversations,
    },
    transferRate: {
      rate: transferRate,
      transferred: uniqueTransferredConvs,
      total: totalConvs,
    },
    ratings: {
      average: averageRating,
      count: ratingCount,
      distribution: ratingDistribution,
    },
    // Bot Performance
    botPerformance: {
      totalQuestions: botHandledQuestions + botFailedQuestions,
      handledByBot: botHandledQuestions,
      failed: botFailedQuestions,
      successRate: (botHandledQuestions + botFailedQuestions) > 0
        ? Math.round((botHandledQuestions / (botHandledQuestions + botFailedQuestions)) * 100)
        : 0,
    },
    topFailedQuestions,
    knowledgeGaps,
    qualityScore: {
      score: qualityScore,
      label: qualityScore >= 80 ? "Excellent" : qualityScore >= 60 ? "Good" : qualityScore >= 40 ? "Fair" : "Needs Improvement",
      color: qualityScore >= 80 ? "#22c55e" : qualityScore >= 60 ? "#f59e0b" : "#ef4444",
    },
  });
}
