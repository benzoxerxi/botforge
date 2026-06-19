"use client";

import { useState, useRef, useEffect } from "react";

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: "👋 Hey! Got questions about BotForge? Ask me anything — I'm the AI assistant!" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<{ companyId: string; botId: string | null } | null>(null);

  // Load Demo company data for the support chat
  useEffect(() => {
    loadConfig().then((cfg) => {
      configRef.current = cfg;
      if (cfg) setReady(true);
    });
  }, []);

  const loadConfig = async (): Promise<{ companyId: string; botId: string | null } | null> => {
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch("/api/public/demo");
        if (!r.ok) continue;
        const data = await r.json();
        if (data.companyId) {
          return { companyId: data.companyId, botId: data.botId || null };
        }
      } catch {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
    return null;
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    const cfg = configRef.current;
    if (!cfg || !ready) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⏳ Still initializing... tap send again in 1 sec." },
      ]);
      // retry config
      loadConfig().then((c) => {
        configRef.current = c;
        if (c) setReady(true);
      });
      return;
    }
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: cfg.companyId,
          botId: cfg.botId,
          message: msg,
          conversationId: convId,
          channel: "widget",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${data.error || "Error"}` }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        if (data.conversationId) setConvId(data.conversationId);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "❌ Network error. Check your connection." }]);
    }
    setSending(false);
  };

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-all glow-teal"
        style={{ boxShadow: "0 0 40px rgba(0,240,255,0.3)" }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 w-[360px] max-w-[calc(100vw-40px)] rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-in"
          style={{
            animation: "slideUp 0.2s ease-out",
            background: "linear-gradient(180deg, #0a0e1a 0%, #05080f 100%)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,240,255,0.1)",
          }}
        >
          {/* Header */}
          <div className="p-4 flex items-center gap-3 border-b border-white/5" style={{ background: "linear-gradient(135deg, rgba(0,240,255,0.1), rgba(124,58,237,0.1))" }}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] flex items-center justify-center text-sm font-bold">
              B
            </div>
            <div>
              <div className="text-sm font-semibold">BotForge Support</div>
              <div className="text-[10px] text-[var(--color-muted-foreground)]">Powered by AI ⚡</div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] text-white rounded-br-sm"
                      : "bg-white/5 text-white/80 border border-white/[0.06] rounded-bl-sm"
                  }`}
                >
                  <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="px-3 py-2.5 rounded-xl rounded-bl-sm bg-white/5 border border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] opacity-60 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] opacity-60 animate-bounce" style={{ animationDelay: "0.15s" }} />
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] opacity-60 animate-bounce" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about BotForge..."
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--color-accent)] transition-all"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all disabled:opacity-40"
            >
              {sending ? "..." : "➤"}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
