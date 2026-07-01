import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const widget = await prisma.chatWidget.findUnique({
    where: { widgetCode: code },
    include: { bot: true, company: true },
  });

  if (!widget || !widget.bot.active || !widget.company.active) {
    return NextResponse.json({ error: "Widget not found" }, { status: 404 });
  }

  return NextResponse.json({
    companyId: widget.companyId,
    botId: widget.botId,
    title: widget.title,
    subtitle: widget.subtitle,
    greetingMessage: widget.greetingMessage,
    primaryColor: widget.primaryColor,
    backgroundColor: widget.backgroundColor,
    textColor: widget.textColor,
    botTextColor: widget.botTextColor,
    agentBubbleColor: widget.agentBubbleColor,
    agentTextColor: widget.agentTextColor,
    userBubbleColor: widget.userBubbleColor,
    userTextColor: widget.userTextColor,
    resetButtonColor: widget.resetButtonColor,
    resetButtonLabel: widget.resetButtonLabel,
    resetButtonTextColor: widget.resetButtonTextColor,
    endChatButtonColor: widget.endChatButtonColor,
    endChatButtonLabel: widget.endChatButtonLabel,
    endChatButtonTextColor: widget.endChatButtonTextColor,
    position: widget.position,
    companyName: widget.company.name,
  });
}
