"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";

interface WidgetConfig {
  companyId: string;
  botId: string;
  title: string;
  subtitle: string;
  greetingMessage: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  position: string;
  companyName: string;
  agentBubbleColor: string;
  agentTextColor: string;
  userBubbleColor: string;
  userTextColor: string;
  resetButtonColor: string;
  resetButtonLabel: string;
  resetButtonTextColor: string;
  endChatButtonColor: string;
  endChatButtonLabel: string;
  endChatButtonTextColor: string;
}

export default function WidgetPage() {
  const params = useParams();
  const code = params?.code as string;
  if (!code) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#08051a" }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>Loading widget...</div>
      </div>
    );
  }
  return <WidgetInner code={code} />;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  return {
    r: parseInt(c.substring(0,2), 16),
    g: parseInt(c.substring(2,4), 16),
    b: parseInt(c.substring(4,6), 16),
  };
}

function getContrastColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = 0.299 * (r / 255) + 0.587 * (g / 255) + 0.114 * (b / 255);
  return luminance > 0.5 ? "#000" : "#fff";
}

/** Generate a gradient stop slightly darker/shifted for the second color */
function shiftColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.max(0, Math.min(255, r + amount));
  const ng = Math.max(0, Math.min(255, g + amount));
  const nb = Math.max(0, Math.min(255, b + amount));
  return "#" + [nr, ng, nb].map(v => v.toString(16).padStart(2, "0")).join("");
}

/** Get gradient and glow styles keyed off the accent color */
function getAccentGradient(accent: string): {
  gradient: string;
  glowBoxShadow: string;
} {
  const { r, g, b } = hexToRgb(accent);
  // Second stop: shift hue slightly toward purple/blue and darken
  const stop2 = shiftColor(accent, -30);
  const gradient = `linear-gradient(135deg, ${accent}, ${stop2})`;
  const glowBoxShadow = `0 6px 24px rgba(0,0,0,0.35), 0 0 40px rgba(${r},${g},${b},0.35)`;
  return { gradient, glowBoxShadow };
}

function WidgetInner({ code }: { code: string }) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Array<{ role: string; content: string; id?: string }>>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [handoffStatus, setHandoffStatus] = useState<string | null>(null);
  const [requestingHandoff, setRequestingHandoff] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [rating, setRating] = useState(0);
  const [submittedRating, setSubmittedRating] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [iframeReady, setIframeReady] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const resolvedRef = useRef(false);

  const resetChat = () => {
    setMessages(config ? [{ role: "assistant", content: config.greetingMessage }] : []);
    setConversationId(null);
    setInput("");
    setSending(false);
    setHandoffStatus(null);
    setRequestingHandoff(false);
    setIsResolved(false);
    setRating(0);
    setSubmittedRating(false);
    setSubmittingRating(false);
    resolvedRef.current = false;
    localStorage.removeItem(`bf_conv_${code}`);
  };

  const endChat = async () => {
    if (!conversationId) return;
    try {
      await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", conversationId }),
      });
    } catch {}
    resolvedRef.current = true;
    setHandoffStatus(null);
    setIsResolved(true);
    setMessages((prev) => {
      const alreadyShown = prev.some(m => m.role === "system" && m.content.includes("resolved"));
      if (alreadyShown) return prev;
      return [...prev, { role: "system", content: "✅ Conversation resolved" }];
    });
  };

  // Load saved conversationId on mount
  useEffect(() => {
    const saved = localStorage.getItem(`bf_conv_${code}`);
    if (saved) setConversationId(saved);
  }, [code]);

  // Save conversationId to localStorage
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(`bf_conv_${code}`, conversationId);
    }
  }, [conversationId, code]);

  // Body styling — kept minimal since we're in an iframe
  useEffect(() => {
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!code) return;
    const saved = localStorage.getItem(`bf_conv_${code}`);

    fetch(`/api/widget/${code}`)
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        if (saved) {
          setConversationId(saved);
          fetch(`/api/widget-history/${saved}`)
            .then((r) => r.json())
            .then((history) => {
              if (history.messages && history.messages.length > 0) {
                setMessages(history.messages.map((m: any) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                })));
                if (history.status === "handoff_active") setHandoffStatus("active");
                else if (history.status === "handoff_requested") setHandoffStatus("requested");
                if (history.status === "closed") {
                  resolvedRef.current = true;
                  setIsResolved(true);
                }
              } else {
                setMessages([{ role: "assistant", content: data.greetingMessage }]);
              }
            })
            .catch(() => setMessages([{ role: "assistant", content: data.greetingMessage }]));
        } else {
          setMessages([{ role: "assistant", content: data.greetingMessage }]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isResolved]);

  // Listen for agent messages via SSE, fallback to polling
  useEffect(() => {
    if (!conversationId) return;

    let eventSource: EventSource | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let sseFailed = false;

    const onConversationClosed = () => {
      resolvedRef.current = true;
      setHandoffStatus(null);
      setIsResolved(true);
      setMessages((prev) => {
        const alreadyShown = prev.some(m => m.role === "system" && m.content.includes("resolved"));
        if (alreadyShown) return prev;
        return [...prev, { role: "system", content: "✅ Conversation resolved" }];
      });
      if (pollInterval) clearInterval(pollInterval);
    };

    const poll = async () => {
      if (resolvedRef.current) return;
      try {
        const res = await fetch(`/api/handoff/status?conversationId=${conversationId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "closed") {
          onConversationClosed();
          return;
        }

        if (data.status === "handoff_active") setHandoffStatus("active");
        else if (data.status === "handoff_requested") setHandoffStatus("requested");

        const agentMsgs = (data.messages || []).filter((m: any) => m.role === "agent");
        if (agentMsgs.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.filter((m) => m.id).map((m: any) => m.id));
            const newAgentMsgs = agentMsgs.filter((m: any) => !existingIds.has(m.id));
            if (newAgentMsgs.length === 0) return prev;
            return [...prev, ...newAgentMsgs.map((m: any) => ({
              id: m.id,
              role: "agent",
              content: m.content,
            }))];
          });
        }
      } catch {}
    };

    try {
      eventSource = new EventSource(`/api/sse/${conversationId}`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "connected") sseFailed = false;

          if (data.type === "new_message" && data.message?.role === "agent") {
            setHandoffStatus("active");
            setMessages((prev) => {
              const existing = prev.find((m) => m.id === data.message.id);
              if (existing) return prev;
              return [...prev, { id: data.message.id, role: "agent", content: data.message.content }];
            });
          }
          if (data.type === "agent_joined") setHandoffStatus("active");
          if (data.type === "conversation_closed") onConversationClosed();
        } catch {}
      };
      eventSource.onerror = () => {
        sseFailed = true;
        eventSource?.close();
        eventSource = null;
        if (!pollInterval) { poll(); pollInterval = setInterval(poll, 10000); }
      };
    } catch { sseFailed = true; }

    const fallbackTimer = setTimeout(() => {
      if (sseFailed || !eventSource) {
        if (!pollInterval) { poll(); pollInterval = setInterval(poll, 10000); }
      }
    }, 2000);

    return () => {
      clearTimeout(fallbackTimer);
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [conversationId]);

  const submitRating = async (value: number) => {
    setRating(value);
    setSubmittingRating(true);
    try {
      await fetch("/api/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          rating: value,
          companyId: config?.companyId,
        }),
      });
    } catch {}
    setSubmittingRating(false);
    setSubmittedRating(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || !config || sending) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: config.companyId,
          botId: config.botId,
          message: userMsg,
          conversationId,
          channel: "widget",
        }),
      });
      const data = await res.json();
      if (!data.handoffActive) {
        const newMsgs: Array<{ role: string; content: string; id?: string }> = [{ role: "assistant", content: data.reply }];
        if (data.handoffDetected) {
          setHandoffStatus("requested");
          newMsgs.push({ role: "system", content: "🔄 Agent requested — we'll connect you shortly!" });
        }
        setMessages((prev) => [...prev, ...newMsgs]);
      }
      if (data.conversationId) setConversationId(data.conversationId);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
    }
    setSending(false);
  };

  const requestHandoff = async () => {
    if (!conversationId || requestingHandoff) return;
    setRequestingHandoff(true);
    try {
      await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", conversationId }),
      });
      setHandoffStatus("requested");
      setMessages((prev) => [...prev, { role: "system", content: "🔄 Human agent on the way! Please wait..." }]);
    } catch {}
    setRequestingHandoff(false);
  };

  const cancelHandoff = async () => {
    if (!conversationId) return;
    try {
      await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", conversationId }),
      });
      setHandoffStatus(null);
      setMessages((prev) => prev.filter((m) => m.role !== "system" || !m.content.includes("Agent")));
    } catch {}
  };

  // Check if loaded with ?open flag (embed script adds it on button click)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const open = new URLSearchParams(window.location.search).has("open");
      if (open) setIsMinimized(false);
      setIframeReady(true);
    }
  }, []);

  // Listen for expand message from parent (when minimized iframe bubble is clicked)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: MessageEvent) => {
      if (event.origin !== "https://chat.benzos.uk") return;
      if (event.data && event.data.type === "botforge_expand") {
        setIsMinimized(false);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Notify parent to resize the iframe when toggle
  useEffect(() => {
    if (!iframeReady) return;
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({
        type: isMinimized ? "botforge_collapse" : "botforge_open",
        width: isMinimized ? 56 : 380,
        height: isMinimized ? 56 : 560,
      }, "https://chat.benzos.uk");
    }
  }, [isMinimized, iframeReady]);

  if (loading) return (
    <div className="flex items-center justify-center h-full" style={{ backgroundColor: "var(--color-background, #08051a)" }}>
      <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: "var(--color-primary, #7c3aed)" }} />
    </div>
  );

  if (!config) return <div className="flex items-center justify-center h-full p-4 text-red-400 text-sm" style={{ backgroundColor: "#08051a" }}>Widget not found</div>;

  const accent = config.primaryColor || "#7c3aed";
  const isAgentActive = handoffStatus === "active";

  const fabGradient = getAccentGradient(accent);

  // ===== MINIMIZED VIEW =====
  if (isMinimized) {
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", margin: 0, padding: "20px", border: "none", overflow: "visible", pointerEvents: "auto", background: "transparent" }}>
        <button
          onClick={() => setIsMinimized(false)}
          id="botforge-minimized-btn"
          style={{ width: "56px", height: "56px", borderRadius: "50%", background: fabGradient.gradient, boxShadow: fabGradient.glowBoxShadow, cursor: "pointer", transition: "transform 0.2s ease, box-shadow 0.2s ease", padding: 0, margin: 0, border: "none", textAlign: "center", verticalAlign: "middle", lineHeight: "56px", color: getContrastColor(accent), fontSize: "24px", fontWeight: 800, userSelect: "none", overflow: "hidden", position: "relative" }}
        >
          <span style={{ color: getContrastColor(accent), fontSize: "24px", fontWeight: 800, userSelect: "none", WebkitUserSelect: "none", lineHeight: "56px" }}>
            {config.companyName?.[0] || "B"}
          </span>
          {messages.length > 1 && (
            <span style={{ position: "absolute", top: "-4px", right: "-4px", minWidth: "20px", height: "20px", padding: "0 4px", borderRadius: "50%", backgroundColor: "#ef4444", color: "#fff", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", border: "2px solid rgba(255,255,255,0.2)" }}>
              {messages.filter(m => m.role === "user" || m.role === "assistant").length}
            </span>
          )}
        </button>
      </div>
    );
  }

  // ===== FULL CHAT VIEW =====
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: config.backgroundColor || "#08051a" }}>
      {/* === STATIC HEADER === */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center gap-2.5 border-b border-white/10" style={{ background: `linear-gradient(135deg, ${accent}10, ${shiftColor(accent, -50)}10)`, backgroundColor: config.backgroundColor || "#08051a" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md" style={{ background: fabGradient.gradient }}>
          {config.companyName?.[0] || "B"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-tight truncate" style={{ color: config.textColor || "#fff" }}>
            {isResolved ? "Chat ended" : handoffStatus === "active" ? "Agent Chat" : handoffStatus === "requested" ? "Finding an agent..." : config.title || "Support"}
          </div>
          <div className="text-[11px] leading-tight mt-0.5 truncate" style={{ color: (config.textColor || "#fff") + "99" }}>
            {isResolved ? "Thanks for chatting!" : handoffStatus === "active" ? "🟢 Agent connected" : handoffStatus === "requested" ? "⏳ Waiting..." : config.subtitle || "Ask us anything"}
          </div>
        </div>

        {/* Header controls */}
        <div className="flex items-center gap-1">
          {handoffStatus === "active" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20 mr-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}

          {/* Minimize button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
            style={{ color: (config.textColor || "#fff") + "88" }}
            title="Minimize"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* End chat button */}
          {!isResolved && (
            <button
              onClick={endChat}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
              style={{ color: config.endChatButtonTextColor || (config.textColor || "#fff") + "66" }}
              title={config.endChatButtonLabel || "End chat"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* === MESSAGES === */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={msg.id || msg.content + msg.role + i} className={`flex ${msg.role === "user" ? "justify-end" : msg.role === "system" ? "justify-center" : "justify-start"}`}>
            {msg.role === "system" ? (
              <div className="text-[11px] text-white/40 italic px-2 py-1 text-center max-w-[90%]" style={{ whiteSpace: "pre-wrap" }}>
                {msg.content}
              </div>
            ) : (
              <div
                className={`max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-2xl rounded-br-sm text-white"
                    : "rounded-2xl rounded-bl-sm"
                }`}
                style={{
                  backgroundColor:
                    msg.role === "user"
                      ? config.userBubbleColor || accent
                      : msg.role === "agent"
                      ? config.agentBubbleColor || "rgba(251, 191, 36, 0.12)"
                      : config.agentBubbleColor || "rgba(255,255,255,0.06)",
                  color:
                    msg.role === "user"
                      ? config.userTextColor || "#fff"
                      : msg.role === "agent"
                      ? config.agentTextColor || "#fbbf24"
                      : config.textColor || "#fff",
                  border:
                    msg.role === "user" ? "none"
                    : msg.role === "agent" ? "1px solid rgba(251, 191, 36, 0.25)"
                    : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {msg.role === "agent" && (
                  <div className="text-[10px] text-amber-400/60 mb-1 font-medium">👤 Agent</div>
                )}
                {msg.role === "assistant" && (
                  <div className="text-[10px] text-white/40 mb-1 font-medium">🤖 Bot</div>
                )}
                <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
              </div>
            )}
          </div>
        ))}

        {/* === RATING UI (shown after conversation resolved) === */}
        {isResolved && !submittedRating && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="text-xs text-white/50">How was your experience?</div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => submitRating(star)}
                  disabled={submittingRating}
                  className="group relative"
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill={star <= rating ? "currentColor" : "none"}
                    stroke={star <= rating ? "currentColor" : "currentColor"}
                    strokeWidth="1.5"
                    className="transition-all duration-150 hover:scale-110"
                    style={{
                      color: star <= rating
                        ? "#fbbf24"
                        : "rgba(255,255,255,0.25)",
                    }}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
            {submittingRating && (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: accent }} />
            )}
          </div>
        )}

        {/* === THANKS + RESTART BUTTON (after rating submitted) === */}
        {isResolved && submittedRating && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="text-xs text-green-400">Thanks for your feedback!</span>
            </div>
            <button
              onClick={resetChat}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
              style={{ backgroundColor: config.resetButtonColor || accent, color: config.resetButtonTextColor || "#fff" }}
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                {config.resetButtonLabel || "Start new chat"}
              </span>
            </button>
          </div>
        )}

        {sending && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: accent, animationDelay: "0s" }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: accent, animationDelay: "0.15s" }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: accent, animationDelay: "0.3s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* === INPUT BAR (hidden when resolved, shown otherwise) === */}
      {!isResolved && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-white/10 space-y-2" style={{ backgroundColor: config.backgroundColor || "#08051a" }}>
          {handoffStatus === "requested" && (
            <button onClick={cancelHandoff}
              className="w-full px-3 py-1.5 rounded-lg text-xs text-white/50 border border-white/10 hover:bg-white/5 transition-all"
            >
              Cancel handoff request
            </button>
          )}
          {!handoffStatus && conversationId && (
            <button onClick={requestHandoff} disabled={requestingHandoff}
              className="w-full px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed transition-all disabled:opacity-50"
              style={{ borderColor: accent + "40", color: accent }}
            >
              {requestingHandoff ? "..." : "💬 Talk to a human"}
            </button>
          )}
          <div className="flex gap-2 items-end">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={isAgentActive ? "Reply to agent..." : "Type a message..."}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-black/30 border border-white/10 focus:outline-none focus:border-current transition-colors placeholder:text-white/30"
              style={{ color: config.textColor || "#fff" }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110 active:scale-95"
              style={{ backgroundColor: accent }}
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
