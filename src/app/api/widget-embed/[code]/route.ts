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
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const dr = Math.max(0, Math.min(255, r - 40));
  const dg = Math.max(0, Math.min(255, g - 40));
  const db = Math.max(0, Math.min(255, b - 40));
  const fabGradient = `linear-gradient(135deg, ${accent}, rgb(${dr},${dg},${db}))`;
  const fabGlow = `0 0 40px rgba(${r},${g},${b},0.35)`;
  const fabGlowHover = `0 0 40px rgba(${r},${g},${b},0.55)`;
  const luminance = 0.299 * (r / 255) + 0.587 * (g / 255) + 0.114 * (b / 255);
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

  // Preconnect for faster iframe load
  var preconnectLink = document.createElement('link');
  preconnectLink.rel = 'preconnect';
  preconnectLink.href = 'https://chat.benzos.uk';
  document.head.appendChild(preconnectLink);

  var container = document.createElement('div');
  container.id = 'botforge-widget-container';
  container.style.cssText = 'position:fixed!important;z-index:2147483647!important;${posX};${posY};bottom:20px;margin:0!important;padding:0!important;width:auto;height:auto;max-width:calc(100vw - 40px);max-height:calc(100vh - 40px);overflow:visible!important;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:transparent!important;border:none!important;outline:none!important;';

  var iframe = null;

  function makeButton(isCircle) {
    var btn = document.createElement('button');
    btn.id = 'botforge-widget-btn';
    btn.innerText = companyLetter;
    btn.setAttribute('aria-label', 'Open chat');
    btn.style.cssText = 'width:56px;height:56px;border-radius:50%;background:${fabGradient};background-image:${fabGradient};box-shadow:${fabGlow};cursor:pointer;padding:0;margin:0;border:none;display:flex;align-items:center;justify-content:center;color:' + btnTextColor + ';font-size:24px;font-weight:800;transition:transform 0.15s ease,box-shadow 0.15s ease;background-color:transparent!important;';

    var preloaded = false;
    btn.addEventListener('mouseenter', function() {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '${fabGlowHover}';
      // Prefetch iframe on first hover for instant open
      if (!preloaded) {
        preloaded = true;
        var preload = document.createElement('link');
        preload.rel = 'prefetch';
        preload.href = 'https://chat.benzos.uk/widget/' + widgetCode;
        document.head.appendChild(preload);
      }
    });
    btn.addEventListener('mouseleave', function() {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '${fabGlow}';
    });

    btn.addEventListener('click', function() {
      openChat();
    });

    return btn;
  }

  function makeIframe(src) {
    var el = document.createElement('iframe');
    el.id = 'botforge-widget-iframe';
    el.style.cssText = 'border:none;width:380px;height:560px;max-width:calc(100vw - 40px);max-height:calc(100vh - 120px);background-color:${bgColor};border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.4);display:block;opacity:0;transform:scale(0.95);transition:opacity 0.2s ease,transform 0.2s ease;';
    el.allow = 'clipboard-read; clipboard-write';
    el.src = src;
    return el;
  }

  function openChat() {
    if (iframe) {
      // Re-expand (safety net — collapseToButton sets iframe=null)
      iframe.style.opacity = '1';
      iframe.style.transform = 'scale(1)';
      return;
    }

    // First open: create iframe, replace button
    iframe = makeIframe('https://chat.benzos.uk/widget/' + widgetCode);

    var btn = document.getElementById('botforge-widget-btn');
    if (btn) {
      btn.remove();
      container.appendChild(iframe);
    } else {
      container.appendChild(iframe);
    }

    // Trigger entrance animation (fade+scale)
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        iframe.style.opacity = '1';
        iframe.style.transform = 'scale(1)';
      });
    });
  }

  function collapseToButton() {
    if (!iframe) return;

    // Animate out, then remove
    iframe.style.opacity = '0';
    iframe.style.transform = 'scale(0.95)';
    setTimeout(function() {
      iframe.remove();
      iframe = null;
      // Reset container to button-only state
      container.style.boxShadow = 'none';
      container.style.borderRadius = '0';
      container.style.background = 'transparent';
      container.style.backgroundColor = 'transparent';
      container.style.width = 'auto';
      container.style.height = 'auto';
      var btn = makeButton(false);
      container.appendChild(btn);
    }, 150);
  }

  // Start with button
  container.appendChild(makeButton(true));
  document.documentElement.appendChild(container);

  // Listen for messages from widget
  window.addEventListener('message', function(event) {
    if (event.origin !== 'https://chat.benzos.uk') return;
    var d = event.data;
    if (!d || !d.type) return;
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
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
