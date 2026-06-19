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
  // Wrap everything in try/catch to avoid breaking the host page
  try {
  var accent = "${accent}";
  var bgColor = "${bgColor}";
  var textColor = "${textColor}";
  var company = "${widget.company.name}";
  var widgetCode = "${widget.widgetCode}";

  var container = document.createElement('div');
  container.id = 'botforge-widget-container';
  container.style.cssText = 'all:initial;position:fixed!important;z-index:999999!important;${posX};${posY};bottom:16px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;transition:width 0.25s ease,height 0.25s ease;';

  var iframe = document.createElement('iframe');
  iframe.id = 'botforge-widget-iframe';
  iframe.style.cssText = 'border:none;width:380px;height:560px;max-width:calc(100vw - 32px);max-height:calc(100vh - 80px);background:transparent;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.4);transition:width 0.25s ease,height 0.25s ease;';
  iframe.allow = 'clipboard-read; clipboard-write';
  iframe.src = 'https://chat.benzos.uk/widget/' + widgetCode;

  container.appendChild(iframe);
  document.body.appendChild(container);

  // Listen for resize messages from the widget iframe
  window.addEventListener('message', function(event) {
    if (event.origin !== 'https://chat.benzos.uk') return;
    if (event.data && event.data.type === 'botforge_resize') {
      var w = event.data.width || 56;
      var h = event.data.height || 56;
      iframe.style.width = w + 'px';
      iframe.style.height = h + 'px';
      iframe.style.pointerEvents = w <= 60 ? 'none' : 'auto';
      iframe.style.boxShadow = w <= 60 ? 'none' : '0 8px 32px rgba(0,0,0,0.4)';
      iframe.style.borderRadius = w <= 60 ? '50%' : '16px';
    }
  });

  console.log("🐦 BotForge widget loaded for", company);
  } catch(e) { console.warn("BotForge widget error:", e); }
})();
`;

  return new NextResponse(js, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
