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

  // Inject animation + badge styles
  var style = document.createElement('style');
  style.textContent = '@keyframes bf-bounce-in{0%{transform:scale(0.3);opacity:0}50%{transform:scale(1.1)}70%{transform:scale(0.9)}100%{transform:scale(1);opacity:1}}@keyframes bf-spring-open{0%{opacity:0;transform:translateY(20px)scale(0.85)}40%{opacity:1;transform:translateY(0)scale(1.05)}70%{transform:scale(0.97)}100%{opacity:1;transform:scale(1)}}@keyframes bf-spring-close{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:translateY(10px)scale(0.85)}}.bf-bounce{animation:bf-bounce-in 0.45s ease}.bf-spring-open{animation:bf-spring-open 0.35s ease forwards}.bf-spring-close{animation:bf-spring-close 0.18s ease forwards}';
  document.head.appendChild(style);

  var container = document.createElement('div');
  container.id = 'botforge-widget-container';
  container.style.cssText = 'position:fixed!important;z-index:2147483647!important;${posX};${posY};bottom:20px;margin:0!important;padding:0!important;width:auto;height:auto;max-width:calc(100vw - 40px);max-height:calc(100vh - 40px);overflow:visible!important;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:transparent!important;border:none!important;outline:none!important;';

  var iframe = null;
  var unreadBadge = null;
  var preloadedIframe = null;

  // Enable absolute positioning for children (FAB + preloaded iframe)
  container.style.position = 'relative';

  function makeButton(isCircle) {
    var btn = document.createElement('button');
    btn.id = 'botforge-widget-btn';
    btn.innerText = companyLetter;
    btn.setAttribute('aria-label', 'Open chat');
    btn.style.cssText = 'width:56px;height:56px;border-radius:50%;background:${fabGradient};background-image:${fabGradient};box-shadow:${fabGlow};cursor:pointer;padding:0;margin:0;border:none;display:flex;align-items:center;justify-content:center;color:' + btnTextColor + ';font-size:24px;font-weight:800;transition:transform 0.15s ease,box-shadow 0.15s ease;background-color:transparent!important;';
    btn.classList.add('bf-bounce');

    var preloaded = false;
    btn.addEventListener('mouseenter', function() {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '${fabGlowHover}';
      // Preload iframe content on first hover (instant open on click!)
      if (!preloadedIframe && !iframe) {
        preloadedIframe = makeIframe('https://chat.benzos.uk/widget/' + widgetCode);
        preloadedIframe.style.position = 'absolute';
        preloadedIframe.style.bottom = '0';
        preloadedIframe.style.right = '0';
        preloadedIframe.style.visibility = 'hidden';
        preloadedIframe.style.pointerEvents = 'none';
        preloadedIframe.style.opacity = '0';
        preloadedIframe.style.transform = 'translateY(20px) scale(0.85)';
        container.appendChild(preloadedIframe);
      }
      if (!preloaded) {
        preloaded = true;
        var preloadLink = document.createElement('link');
        preloadLink.rel = 'prefetch';
        preloadLink.href = 'https://chat.benzos.uk/widget/' + widgetCode;
        document.head.appendChild(preloadLink);
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
    el.style.cssText = 'border:none;width:380px;height:560px;max-width:calc(100vw - 40px);max-height:calc(100vh - 120px);background-color:${bgColor};border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.4);display:block;opacity:0;transform:translateY(20px)scale(0.85);';
    el.allow = 'clipboard-read; clipboard-write';
    el.src = src;
    return el;
  }

  function openChat() {
    if (iframe) {
      // Re-expand (safety net — collapseToButton sets iframe=null)
      iframe.classList.remove('bf-spring-close');
      iframe.classList.add('bf-spring-open');
      container.style.position = 'relative';
      return;
    }

    // Use preloaded iframe (started loading on hover) for instant open
    if (preloadedIframe) {
      iframe = preloadedIframe;
      preloadedIframe = null;
      // Reset preload positioning → normal flow inside container
      iframe.style.position = '';
      iframe.style.bottom = '';
      iframe.style.right = '';
      iframe.style.visibility = 'visible';
      iframe.style.pointerEvents = '';
      // Start from hidden state for the animation
      iframe.style.opacity = '0';
      iframe.style.transform = 'translateY(20px) scale(0.85)';
    } else {
      // Fallback: no hover path (touch devices)
      iframe = makeIframe('https://chat.benzos.uk/widget/' + widgetCode);
    }

    var btn = document.getElementById('botforge-widget-btn');
    if (btn) btn.remove();
    if (iframe.parentElement !== container) {
      container.appendChild(iframe);
    }
    container.style.position = 'relative';

    // Force reflow so the animation picks up the start state
    void iframe.offsetHeight;
    iframe.classList.add('bf-spring-open');
  }

  function collapseToButton() {
    if (!iframe) {
      // Clean up stale preloaded iframe if any
      if (preloadedIframe) {
        preloadedIframe.remove();
        preloadedIframe = null;
      }
      return;
    }

    // Reset unread badge on minimize
    updateBadge(0);
    // Also clean up stale preload
    if (preloadedIframe) {
      preloadedIframe.remove();
      preloadedIframe = null;
    }

    // Spring close animation, then remove
    iframe.classList.remove('bf-spring-open');
    iframe.classList.add('bf-spring-close');
    setTimeout(function() {
      iframe.remove();
      iframe = null;
      container.style.boxShadow = 'none';
      container.style.borderRadius = '0';
      container.style.background = 'transparent';
      container.style.backgroundColor = 'transparent';
      container.style.width = 'auto';
      container.style.height = 'auto';
      container.style.position = 'relative';
      var btn = makeButton(false);
      container.appendChild(btn);
    }, 180);
  }

  function updateBadge(count) {
    if (count > 0 && !unreadBadge) {
      unreadBadge = document.createElement('div');
      unreadBadge.style.cssText = 'position:absolute;top:-4px;right:-4px;width:20px;height:20px;border-radius:50%;background:#ef4444;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;z-index:2147483647;pointer-events:none;box-shadow:0 0 6px rgba(239,68,68,0.5);line-height:1;';
      container.appendChild(unreadBadge);
    }
    if (unreadBadge) {
      if (count > 0) {
        unreadBadge.textContent = count > 99 ? '99+' : String(count);
        unreadBadge.style.display = 'flex';
      } else {
        unreadBadge.style.display = 'none';
      }
    }
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
    } else if (d.type === 'botforge_unread') {
      updateBadge(d.count || 0);
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
