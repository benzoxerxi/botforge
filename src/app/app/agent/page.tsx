"use client";
export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: string;
  content: string;
  source: string | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  status: string;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
  bot: { name: string | null };
  company: { name: string | null };
  messages: Message[];
  agentChats: { id: string; status: string; agent: { id: string; name: string | null; email: string } }[];
}

export default function AgentPanel() {
  const { data: session, status: sessionStatus } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentInput, setAgentInput] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"pending" | "active" | "all">("pending");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll conversations every 5 seconds — always fetch ALL so local filter keeps working
  const filterRef = useRef(filter);
  filterRef.current = filter;

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;

    const fetchConversations = async () => {
      try {
        const res = await fetch(`/api/handoff?companyId=${session?.user?.companyId}&filter=all`);
        const data = await res.json();
        setConversations(data.conversations || []);
      } catch {}
      setLoading(false);
    };

    fetchConversations();
    pollRef.current = setInterval(fetchConversations, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sessionStatus, session]);

  // Keep the conversations list synced when filter tab switches
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    const fetchForFilter = async () => {
      try {
        const res = await fetch(`/api/handoff?companyId=${session?.user?.companyId}&filter=all`);
        const data = await res.json();
        setConversations(data.conversations || []);
      } catch {}
    };
    fetchForFilter();
  }, [filter, sessionStatus, session]);

  // Poll selected conversation messages via SSE + polling fallback
  const appConvRef = useRef<Conversation | null>(null);
  appConvRef.current = selectedConv;
  useEffect(() => {
    if (!selectedConv) return;

    // SSE for instant delivery of new messages
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/sse/${selectedConv.id}`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_message") {
            setSelectedConv((prev) => {
              if (!prev) return prev;
              const existing = prev.messages.find((m: any) => m.id === data.message.id);
              if (existing) return prev;
              return { ...prev, messages: [...prev.messages, data.message] };
            });
          }
          if (data.type === "conversation_closed") {
            setSelectedConv(null);
          }
        } catch {}
      };
      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
      };
    } catch {}

    // Polling fallback (3s)
    const interval = setInterval(async () => {
      const current = appConvRef.current;
      if (!current) return;
      try {
        const res = await fetch(`/api/handoff/status?conversationId=${current.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages) {
          setSelectedConv((prev) => {
            if (!prev) return prev;
            return { ...prev, messages: data.messages };
          });
        }
      } catch {}
    }, 3000);
    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [selectedConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConv?.messages]);

  const joinConversation = async (convId: string) => {
    try {
      await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, action: "join" }),
      });
      // Update local state immediately so UI shows correct buttons
      setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, status: "handoff_active" } : c));
      setSelectedConv((prev) => prev?.id === convId ? { ...prev, status: "handoff_active" } : prev);
      // Auto-switch to Active tab so conversation stays visible
      setFilter("active");
    } catch {}
  };

  const closeConversation = async (convId: string) => {
    try {
      await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, action: "resolve" }),
      });
    } catch {}
  };

  const sendAgentMessage = async () => {
    if (!agentInput.trim() || !selectedConv || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          action: "message",
          message: agentInput,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setSelectedConv((prev) => {
          if (!prev) return prev;
          return { ...prev, messages: [...prev.messages, data.message] };
        });
        setAgentInput("");
      }
    } catch {}
    setSending(false);
  };

  const loadMessages = async (conv: Conversation) => {
    try {
      const res = await fetch(`/api/handoff/status?conversationId=${conv.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.messages) {
        setSelectedConv((prev) => {
          if (!prev) return prev;
          return { ...prev, messages: data.messages };
        });
      }
    } catch {}
  };

  const filteredConvs = conversations.filter((c) => {
    if (filter === "pending") return c.status === "handoff_requested";
    if (filter === "active") return c.status === "handoff_active";
    return true;
  });

  if (sessionStatus !== "authenticated") return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-[var(--color-border)] flex flex-col bg-[var(--color-card)]">
        {/* Filter tabs */}
        <div className="flex border-b border-[var(--color-border)]">
          {(["pending", "active", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all ${
                filter === f
                  ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {f === "pending" ? "🟡 Pending" : f === "active" ? "🟢 Active" : "All"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConvs.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                setSelectedConv(conv);
                loadMessages(conv);
              }}
              className={`w-full text-left p-3 border-b border-[var(--color-border)] transition-all hover:bg-[var(--color-background)] ${
                selectedConv?.id === conv.id ? "bg-[var(--color-background)]" : ""
              }`}
            >
              <div className="text-xs font-medium truncate text-[var(--color-foreground)]">
                {conv.customerEmail || "Anonymous"}
              </div>
              <div className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
                {conv.bot?.name || "Bot"}
              </div>
              <div className="text-[10px] text-[var(--color-muted-foreground)]">
                {new Date(conv.createdAt).toLocaleString()}
              </div>
              {conv.status === "handoff_requested" && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                  awaiting agent
                </span>
              )}
              {conv.status === "handoff_active" && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400">
                  in progress
                </span>
              )}
            </button>
          ))}
          {filteredConvs.length === 0 && (
            <div className="text-xs text-[var(--color-muted-foreground)] text-center py-12">
              No {filter !== "all" ? filter : ""} conversations
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-background)]/80">
              <div>
                <div className="text-sm font-medium text-[var(--color-foreground)]">
                  {selectedConv.customerEmail || "Anonymous"}
                </div>
                <div className="text-[10px] text-[var(--color-muted-foreground)]">
                  {selectedConv.company?.name} · {selectedConv.bot?.name}
                </div>
              </div>
              <div className="flex gap-2">
                {selectedConv.status === "handoff_requested" && (
                  <button
                    onClick={() => joinConversation(selectedConv.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-accent)] text-white hover:opacity-90 transition-all"
                  >
                    Take Over
                  </button>
                )}
                {selectedConv.status === "handoff_active" && (
                  <button
                    onClick={() => closeConversation(selectedConv.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    Resolve
                  </button>
                )}
                {selectedConv.status === "closed" && (
                  <span className="text-xs text-[var(--color-muted-foreground)] py-1">Closed</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedConv.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "agent" ? "justify-start" : msg.role === "system" ? "justify-center" : "justify-end"}`}
                >
                  {msg.role === "system" ? (
                    <div className="text-[10px] text-[var(--color-muted-foreground)] italic px-2 py-1">{msg.content}</div>
                  ) : (
                    <div
                      className={`max-w-[70%] p-3 rounded-xl text-sm leading-relaxed ${
                        msg.role === "agent"
                          ? "bg-amber-500/10 text-[var(--color-foreground)] border border-amber-500/20"
                          : "bg-[var(--color-accent)]/10 text-[var(--color-foreground)] border border-[var(--color-accent)]/20"
                      }`}
                      style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    >
                      <div className="text-[10px] text-[var(--color-muted-foreground)] mb-1">
                        {msg.role === "agent" ? "You" : "Customer"}
                      </div>
                      <div>{msg.content}</div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input — only show if active */}
            {(selectedConv.status === "handoff_active" || selectedConv.status === "handoff_requested") && (
              <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-background)]/80">
                <div className="flex gap-2">
                  <input
                    value={agentInput}
                    onChange={(e) => setAgentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendAgentMessage();
                      }
                    }}
                    placeholder={selectedConv.status === "handoff_requested" ? "Join first to reply..." : "Type a reply..."}
                    disabled={selectedConv.status === "handoff_requested"}
                    className="flex-1 px-3 py-2 rounded-lg text-sm bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder-[var(--color-muted-foreground)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                  />
                  <button
                    onClick={() => {
                      if (selectedConv.status === "handoff_requested") {
                        joinConversation(selectedConv.id);
                      } else {
                        sendAgentMessage();
                      }
                    }}
                    disabled={selectedConv.status === "handoff_requested" ? false : (sending || !agentInput.trim())}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--color-accent)] hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {selectedConv.status === "handoff_requested" ? "Join & Reply" : sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--color-muted-foreground)] text-sm">
            Select a conversation to start supporting
          </div>
        )}
      </div>
    </div>
  );
}
