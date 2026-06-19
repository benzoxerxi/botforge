import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalCompanies = companies.length;
  const totalTokens = companies.reduce((sum, c) => sum + c.tokensUsed, 0);
  const totalBots = await prisma.bot.count();

  return NextResponse.json({
    totalCompanies,
    totalTokens,
    totalBots,
    activeChats: 0,
    companies,
  });
}
