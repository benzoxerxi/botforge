import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/conversations/[id] — get a single conversation with all messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      bot: { select: { name: true } },
      company: { select: { name: true } },
      ratings: true,
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check permissions
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, companyId: true },
  });

  if (!user || (user.role !== "super_admin" && user.companyId !== conversation.companyId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ conversation });
}
