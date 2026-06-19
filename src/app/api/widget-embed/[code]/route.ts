import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const widget = await prisma.chatWidget.findUnique({
    where: { widgetCode: code },
    include: { company: true },
  });

  if (!widget) {
    return new NextResponse("console.error('BotForge: Widget not found')", {
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const accent = widget.primaryColor || "#00f0ff";
  const bgColor = widget.backgroundColor || "#0a0e1a";
  const textColor = widget.textColor || "#ffffff";
  const position = widget.position || "bottom-right";
  const [posX, posY] = position === "bottom-left" 
    ? ["left: 16px", "right: auto"] 
    : ["right: 16px", "left: auto"];

  const js = `
(function() {
  var accent = "${accent}";
  var bgColor = "${bgColor}";
  var textColor = "${textColor}";
  var company = "${widget.company.name}";
  var widgetCode = "${widget.widgetCode}";

  var container = document.createElement('div');
  container.id = 'botforge-widget-container';
  container.style.cssText = 'all:initial;position:fixed!important;z-index:999999!important;${posX};${posY};bottom:16px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;';

  var iframe = document.createElement('iframe');
  iframe.style.cssText = 'border:none;width:380px;height:560px;max-width:100vw;background:transparent;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.4);';
  iframe.allow = 'clipboard-read; clipboard-write';
  iframe.src = 'https://chat.benzos.uk/widget/' + widgetCode;

  container.appendChild(iframe);
  document.body.appendChild(container);

  console.log("🐦 BotForge widget loaded for", company);
})();
`;

  return new NextResponse(js, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
