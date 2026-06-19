import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/knowledge - List knowledge bases for a company
export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId") || session.user.companyId;

  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 400 });

  const knowledge = await prisma.knowledgeBase.findMany({
    where: { companyId, active: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ knowledge });
}

// POST /api/knowledge - Add knowledge base entry
export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, type, botId, qaData, sourceUrl } = body;
  const companyId = body.companyId || session.user.companyId;

  if (!name || !type || !companyId) {
    return NextResponse.json({ error: "name, type, and companyId required" }, { status: 400 });
  }

  let finalQaData = qaData ? JSON.stringify(qaData) : null;
  let finalChunkCount = qaData && Array.isArray(qaData) ? qaData.length : 0;
  let finalSourceUrl = sourceUrl || null;

  // For crawl type: actually fetch and extract content
  if (type === "crawl" && sourceUrl) {
    try {
      const res = await fetch(sourceUrl, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "BotForge-Crawler/1.0" },
      });
      const html = await res.text();

      // Simple HTML to text extraction
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5000);

      if (text.length > 100) {
        finalQaData = JSON.stringify([
          { question: `Website content from ${name}`, answer: text },
        ]);
        finalChunkCount = 1;
      }
    } catch (e: any) {
      console.error("[Crawl error]", sourceUrl, e.message);
    }
  }

  // Find any bot for this company (required by schema)
  const companyBotId = botId || (
    await prisma.bot.findFirst({
      where: { companyId, active: true },
      select: { id: true },
    })
  )?.id;

  const kb = await prisma.knowledgeBase.create({
    data: {
      name,
      type,
      companyId,
      botId: companyBotId || "",  // fallback empty string if no bot exists
      qaData: finalQaData,
      sourceUrl: finalSourceUrl,
      chunkCount: finalChunkCount,
    },
  });

  return NextResponse.json({
    knowledge: kb,
    crawlStatus:
      type === "crawl"
        ? finalQaData && finalQaData.length > 10
          ? "✅ Website crawled and content extracted"
          : "⚠️ Could not fetch content — check that the URL is accessible"
        : undefined,
  });
}

// PUT /api/knowledge - Edit knowledge base entry
export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, name, qaData, sourceUrl } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updateData: any = {};
  if (name) updateData.name = name;
  if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl;
  if (qaData !== undefined) {
    updateData.qaData = JSON.stringify(qaData);
    updateData.chunkCount = Array.isArray(qaData) ? qaData.length : 0;
  }
  updateData.updatedAt = new Date();

  const kb = await prisma.knowledgeBase.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ knowledge: kb });
}

// DELETE /api/knowledge - Remove knowledge base entry
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.knowledgeBase.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}
