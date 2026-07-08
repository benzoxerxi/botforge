// POST /api/widget/typing — Widget sends user's in-progress typing content
// This is used to show a "User is typing: ..." preview in the Agent Panel
// Content is stored in-memory only (not persisted to DB), auto-clears after inactivity

import { NextResponse } from "next/server";
import { setTypingContent, clearTypingContent } from "@/lib/typing";
import { pushEvent } from "@/lib/sse";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversationId, content, companyId } = body;

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId required" }, { status: 400 });
    }

    const trimmed = (content || "").trim();

    if (trimmed.length === 0) {
      // User cleared input — remove typing state
      clearTypingContent(conversationId);
    } else {
      // Update in-memory typing state
      setTypingContent(conversationId, trimmed);
    }

    // Push typing preview to the Agent Panel via SSE (only if there's content)
    pushEvent(conversationId, {
      type: "user_typing",
      content: trimmed,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Typing API]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
