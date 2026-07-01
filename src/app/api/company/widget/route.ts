import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });

    if (!user || (user.role !== "company_admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      companyId,
      title,
      subtitle,
      greetingMessage,
      primaryColor,
      backgroundColor,
      textColor,
      botTextColor,
      agentBubbleColor,
      agentTextColor,
      userBubbleColor,
      userTextColor,
      resetButtonColor,
      resetButtonLabel,
      resetButtonTextColor,
      endChatButtonColor,
      endChatButtonLabel,
      endChatButtonTextColor,
      position,
    } = body;

    // Permission check: company_admin can only edit own company
    if (user.role === "company_admin" && user.companyId !== companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { chatWidgets: true, bots: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Update or create widget
    const widget = company.chatWidgets?.[0];
    const data: any = {};

    if (title !== undefined) data.title = title;
    if (subtitle !== undefined) data.subtitle = subtitle;
    if (greetingMessage !== undefined) data.greetingMessage = greetingMessage;
    if (primaryColor !== undefined) data.primaryColor = primaryColor;
    if (backgroundColor !== undefined) data.backgroundColor = backgroundColor;
    if (textColor !== undefined) data.textColor = textColor;
    if (botTextColor !== undefined) data.botTextColor = botTextColor;
    if (agentBubbleColor !== undefined) data.agentBubbleColor = agentBubbleColor;
    if (agentTextColor !== undefined) data.agentTextColor = agentTextColor;
    if (userBubbleColor !== undefined) data.userBubbleColor = userBubbleColor;
    if (userTextColor !== undefined) data.userTextColor = userTextColor;
    if (resetButtonColor !== undefined) data.resetButtonColor = resetButtonColor;
    if (resetButtonLabel !== undefined) data.resetButtonLabel = resetButtonLabel;
    if (resetButtonTextColor !== undefined) data.resetButtonTextColor = resetButtonTextColor;
    if (endChatButtonColor !== undefined) data.endChatButtonColor = endChatButtonColor;
    if (endChatButtonLabel !== undefined) data.endChatButtonLabel = endChatButtonLabel;
    if (endChatButtonTextColor !== undefined) data.endChatButtonTextColor = endChatButtonTextColor;
    if (position !== undefined) data.position = position;

    let updated;
    if (widget) {
      updated = await prisma.chatWidget.update({
        where: { id: widget.id },
        data,
      });
    } else {
      // Create widget for first time
      updated = await prisma.chatWidget.create({
        data: {
          botId: company.bots?.[0]?.id || "",
          companyId,
          ...data,
        },
      });
    }

    return NextResponse.json({ success: true, widget: updated });
  } catch (error) {
    console.error("Widget update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
