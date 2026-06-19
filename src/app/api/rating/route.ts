import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, rating, companyId } = body;

    if (!conversationId || !rating || !companyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Check if already rated
    const existing = await prisma.rating.findFirst({
      where: { conversationId },
    });

    if (existing) {
      return NextResponse.json({ error: "Already rated" }, { status: 409 });
    }

    const saved = await prisma.rating.create({
      data: {
        conversationId,
        companyId,
        rating,
      },
    });

    return NextResponse.json({ success: true, id: saved.id });
  } catch (error) {
    console.error("Rating error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
