// GET /api/widget/typing/get?conversationId=X — Get current typing preview for a conversation
// Used by the Agent Panel to show what the user is typing

import { NextResponse } from "next/server";
import { getTypingContent, sweepStaleTyping } from "@/lib/typing";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  }

  sweepStaleTyping();

  const session = getTypingContent(conversationId);

  return NextResponse.json({
    content: session?.content || null,
    lastUpdate: session?.lastUpdate || null,
  });
}
