import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/company/bot?companyId=X
export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId") || session.user.companyId;

  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 400 });

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      bots: { where: { active: true } },
      chatWidgets: true,
    },
  });

  return NextResponse.json({ company });
}

// PUT /api/company/bot - Update bot config
export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { botId, name, systemPrompt, temperature, maxTokens, useRag } = body;

  if (!botId) return NextResponse.json({ error: "botId required" }, { status: 400 });

  const bot = await prisma.bot.update({
    where: { id: botId },
    data: {
      ...(name && { name }),
      ...(systemPrompt !== undefined && { systemPrompt }),
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens !== undefined && { maxTokens }),
      ...(useRag !== undefined && { useRag }),
    },
  });

  return NextResponse.json({ bot });
}
