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
  const companyLetter = widget.company.name?.[0] || "B";
  const [posX, posY] = position === "bottom-left"
    ? ["left: 16px", "right: auto"]
    : ["right: 16px", "left: auto"];

  // Calculate contrast color for button text
  let c = accent.replace("#", "");
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  const btnTextColor = luminance > 0.5 ? "#000" : "#fff";

  const js = `
(function() {
  try {
  var accent = "${accent}";
  var bgColor = "${bgColor}";
  var textColor = "${textColor}";
  var btnTextColor = "${btnTextColor}";
  var companyLetter = "${companyLetter}";
  var company = "${widget.company.name}";
  var widgetCode = "${widget.widgetCode}";

  // Container
  var container = document.createElement('div');
  container.id = 'botforge-widget-container';
  container.style.cssText = 'position:fixed!important;z-index:2147483647!important;${posX};${posY};bottom:20px;margin:0!important;padding:0!important;width:auto;height:auto;max-width:calc(100vw - 40px);max-height:calc(100vh - 40px);overflow:visible!important;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:transparent!important;border:none!important;outline:none!important;';

  // ---- INITIAL BUTTON ----
  var btn = document.createElement('button');
  btn.id = 'botforge-widget-btn';
  btn.innerText = companyLetter;
  btn.setAttribute('aria-label', 'Open chat');
  btn.style.cssText = 'width:56px;height:56px;border-radius:50%;background-color:' + accent + ';box-shadow:0 6px 24px rgba(0,0,0,0.35);cursor:pointer;padding:0;margin:0;border:none;text-align:center;line-height:56px;color:' + btnTextColor + ';font-size:24px;font-weight:800;transition:transform 0.15s ease,box-shadow 0.15s ease;display:block;';

  // Hover effect
  btn.addEventListener('mouseenter', function() {
    btn.style.transform = 'scale(1.1)';
    btn.style.boxShadow = '0 8px 30px rgba(0,0,0,0.45)';
  });
  btn.addEventListener('mouseleave', function() {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 6px 24px rgba(0,0,0,0.35)';
  });

  container.appendChild(btn);
  (document.documentElement || document.body).appendChild(container);

  var iframe = null;
  var isOpen = false;

  // ---- BUTTON CLICK: create iframe & load chat ----
  btn.addEventListener('click', function() {
    if (isOpen && iframe) {
      // Re-expand minimized iframe via postMessage
      iframe.style.width = '380px';
      iframe.style.height = '560px';
      iframe.style.borderRadius = '16px';
      iframe.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
      try {
        iframe.contentWindow.postMessage({ type: 'botforge_expand' }, 'https://chat.benzos.uk');
      } catch(e) {}
      return;
    }

    isOpen = true;

    // Create iframe — loads widget in expanded mode
    iframe = document.createElement('iframe');
    iframe.id = 'botforge-widget-iframe';
    iframe.style.cssText = 'border:none;width:380px;height:560px;max-width:calc(100vw - 40px);max-height:calc(100vh - 120px);background:transparent;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.4);display:block;';
    iframe.allow = 'clipboard-read; clipboard-write';
    iframe.src = 'https://chat.benzos.uk/widget/' + widgetCode + '?open';

    container.replaceChild(iframe, btn);
    btn = null;
  });

  // ---- POSTMESSAGE LISTENER ----
  window.addEventListener('message', function(event) {
    if (event.origin !== 'https://chat.benzos.uk') return;

    var d = event.data;
    if (!d || !d.type) return;

    if (!iframe) return;

    if (d.type === 'botforge_resize') {
      var w = d.width || 56;
      var h = d.height || 56;
      iframe.style.width = w + 'px';
      iframe.style.height = h + 'px';
      iframe.style.pointerEvents = 'auto';
      iframe.style.boxShadow = w <= 60 ? 'none' : '0 8px 32px rgba(0,0,0,0.4)';
      iframe.style.borderRadius = w <= 60 ? '50%' : '16px';
    }

    if (d.type === 'botforge_open') {
      isOpen = true;
    }

    if (d.type === 'botforge_collapse') {
      isOpen = false;
    }
  });

  console.log("🐦 BotForge ready for", company);
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
