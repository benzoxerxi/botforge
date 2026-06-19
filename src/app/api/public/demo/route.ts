import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public endpoint - returns Super Admin's support bot config for the landing page chat
export async function GET() {
  const company = await prisma.company.findUnique({
    where: { slug: "botforge-support" },
    include: {
      bots: {
        where: { active: true },
        take: 1,
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: "Support company not found" }, { status: 404 });
  }

  return NextResponse.json({
    companyId: company.id,
    botId: company.bots[0]?.id || null,
  });
}
