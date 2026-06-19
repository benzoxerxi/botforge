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

  // Color helpers — same logic as SupportChat.tsx & widget page
  function hexToRgb(hex) {
    var h = hex.replace('#','');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return {
      r: parseInt(h.substring(0,2),16),
      g: parseInt(h.substring(2,4),16),
      b: parseInt(h.substring(4,6),16)
    };
  }
  function shiftColor(hex, amount) {
    var rgb = hexToRgb(hex);
    return {
      r: Math.max(0, Math.min(255, rgb.r + amount)),
      g: Math.max(0, Math.min(255, rgb.g + amount)),
      b: Math.max(0, Math.min(255, rgb.b + amount))
    };
  }
  function getAccentGradient(accentHex) {
    var accentRgb = hexToRgb(accentHex);
    var darker = shiftColor(accentHex, -40);
    var grad = 'linear-gradient(135deg, ' + accentHex + ', rgb(' + darker.r + ',' + darker.g + ',' + darker.b + '))';
    var glow = '0 0 40px rgba(' + accentRgb.r + ',' + accentRgb.g + ',' + accentRgb.b + ',0.35)';
    return { gradient: grad, glowBoxShadow: glow };
  }
  var fabGradient = getAccentGradient(accent);

  var container = document.createElement('div');
  container.id = 'botforge-widget-container';
  container.style.cssText = 'position:fixed!important;z-index:2147483647!important;${posX};${posY};bottom:20px;margin:0!important;padding:0!important;width:auto;height:auto;max-width:calc(100vw - 40px);max-height:calc(100vh - 40px);overflow:visible!important;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:transparent!important;border:none!important;outline:none!important;';

  var iframe = null;

  function makeButton(isCircle) {
    var btn = document.createElement('button');
    btn.id = 'botforge-widget-btn';
    btn.innerText = companyLetter;
    btn.setAttribute('aria-label', 'Open chat');
    btn.style.cssText = 'width:56px;height:56px;border-radius:50%;background:' + fabGradient.gradient + ';box-shadow:' + fabGradient.glowBoxShadow + ';cursor:pointer;padding:0;margin:0;border:none;text-align:center;line-height:56px;color:' + btnTextColor + ';font-size:24px;font-weight:800;transition:transform 0.15s ease,box-shadow 0.15s ease;display:block;';

    btn.addEventListener('mouseenter', function() {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = fabGradient.glowBoxShadow.replace('0.35', '0.55');
    });
    btn.addEventListener('mouseleave', function() {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = fabGradient.glowBoxShadow;
    });

    btn.addEventListener('click', function() {
      openChat();
    });

    return btn;
  }

  function makeIframe(src) {
    var el = document.createElement('iframe');
    el.id = 'botforge-widget-iframe';
    el.style.cssText = 'border:none;width:380px;height:560px;max-width:calc(100vw - 40px);max-height:calc(100vh - 120px);background:transparent;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.4);display:block;';
    el.allow = 'clipboard-read; clipboard-write';
    el.src = src;
    return el;
  }

  function openChat() {
    if (iframe) {
      // Re-expand from minimized 56px iframe
      iframe.style.width = '380px';
      iframe.style.height = '560px';
      iframe.style.borderRadius = '16px';
      iframe.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
      try {
        iframe.contentWindow.postMessage({ type: 'botforge_expand' }, 'https://chat.benzos.uk');
      } catch(e) {}
      return;
    }

    // First open: create iframe, replace button
    iframe = makeIframe('https://chat.benzos.uk/widget/' + widgetCode + '?open');

    var btn = document.getElementById('botforge-widget-btn');
    if (btn) container.replaceChild(iframe, btn);
    else container.appendChild(iframe);
  }

  function collapseToButton() {
    if (!iframe) return;
    // Remove iframe, put button back
    var btn = makeButton(false);
    container.replaceChild(btn, iframe);
    iframe = null;
  }

  // Start with button
  container.appendChild(makeButton(true));
  (document.documentElement || document.body).appendChild(container);

  // Listen for messages from widget
  window.addEventListener('message', function(event) {
    if (event.origin !== 'https://chat.benzos.uk') return;

    var d = event.data;
    if (!d || !d.type) return;

    // Widget wants to collapse back to button
    if (d.type === 'botforge_collapse') {
      collapseToButton();
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
