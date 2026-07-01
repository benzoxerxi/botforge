"use client";
export const dynamic = "force-dynamic";

import ErrorBoundary from "@/components/ErrorBoundary";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Users,
  SendHorizonal,
  RefreshCw,
  LogOut,
  X,
  Check,
  Clock,
  ChevronRight,
  User,
  Bot,
  Loader2,
  Inbox,
  CornerDownRight,
} from "lucide-react";

interface Message {
  id: string;
  role: string;
  content: string;
  source: string | null;
  createdAt: string;
}

interface AgentChat {
  id: string;
  status: string;
  joinedAt: string;
  agent: { id: string; name: string | null; email: string };
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
  agentChats: AgentChat[];
}

function StatusBadge({ status }: { status: string }) {
  const config = status === "handoff_requested"
    ? { label: "Pending", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" }
    : status === "handoff_active"
    ? { label: "Active", cls: "bg-green-500/10 text-green-400 border-green-500/20", dot: "bg-green-400" }
    : { label: "Closed", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20", dot: "bg-slate-400" };

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${config.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default function AgentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentInput, setAgentInput] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "assigned" | "active">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session.user?.role === "company_admin") {
      fetchConversations();
    }
  }, [status, router, session]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/handoff?companyId=${session?.user?.companyId}&filter=all`);
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {}
    setLoading(false);
  };

  const filteredConvs = conversations.filter(c => {
    if (filter === "pending") return c.status === "handoff_requested";
    if (filter === "active") return c.status === "handoff_active" || c.status === "handoff_requested";
    if (filter === "assigned") return c.agentChats && c.agentChats.length > 0 && c.status !== "closed";
    return true;
  });

  const joinConversation = async (convId: string) => {
    try {
      await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, action: "join" }),
      });
      fetchConversations();
    } catch {}
  };

  const closeConversation = async (convId: string) => {
    try {
      await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, action: "resolve" }),
      });
      if (selectedConv?.id === convId) setSelectedConv(null);
      fetchConversations();
    } catch {}
  };

  const sendAgentMessage = async () => {
    if (!agentInput.trim() || !selectedConv || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConv.id, action: "message", message: agentInput }),
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

  // Auto-refresh messages when a conversation is selected (poll for new user messages)
  const selectedConvRef = useRef<Conversation | null>(null);
  selectedConvRef.current = selectedConv;
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
              const existing = prev.messages.find((m) => m.id === data.message.id);
              if (existing) return prev;
              return { ...prev, messages: [...prev.messages, data.message] };
            });
          }
        } catch {}
      };
      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
      };
    } catch {}

    // Polling fallback (3s)
    const interval = setInterval(() => {
      const current = selectedConvRef.current;
      if (current) loadMessages(current);
    }, 3000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [selectedConv?.id]);

  // Auto-refresh conversation list every 10s to show new user messages in preview
  useEffect(() => {
    if (status !== "authenticated" || session.user?.role !== "company_admin") return;
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [status, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConv?.messages]);

  if (status !== "authenticated") return null;
  if (session.user?.role !== "company_admin") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
            <Users className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-sm text-amber-400">Agent panel is for company admins only.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-[var(--color-border)] text-amber-400 bg-amber-500/5">
            <Users className="w-3 h-3" />
            Live Support
          </div>
          <h1 className="text-xl font-bold tracking-tight">Agent Panel</h1>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
            {conversations.filter(c => c.status === "handoff_requested").length} pending ·{" "}
            {conversations.filter(c => c.status === "handoff_active").length} active ·{" "}
            {conversations.filter(c => c.agentChats && c.agentChats.length > 0 && c.status !== "closed").length} assigned ·{" "}
            {conversations.length} total
          </p>
        </div>
        <button
          onClick={fetchConversations}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-all text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="flex gap-4 flex-1 h-[calc(100vh-14rem)]">
        {/* Conversations sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          {/* Filters */}
          <div className="p-3 border-b border-[var(--color-border)]">
            <div className="flex gap-1 bg-[var(--color-muted)] rounded-lg p-0.5">
              {(["all", "pending", "assigned", "active"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                    filter === f
                      ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm border border-[var(--color-border)]"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  {f === "all" ? "All" : f === "pending" ? `Pending (${conversations.filter(c => c.status === "handoff_requested").length})` : f === "assigned" ? `Assigned (${conversations.filter(c => c.agentChats && c.agentChats.length > 0 && c.status !== "closed").length})` : `Active (${conversations.filter(c => c.status === "handoff_active").length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredConvs.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              const isPending = conv.status === "handoff_requested";
              const isActive = conv.status === "handoff_active";
              return (
                <button
                  key={conv.id}
                  onClick={() => { setSelectedConv(conv); loadMessages(conv); }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "border-amber-400/40 bg-amber-500/5"
                      : isPending
                      ? "border-amber-500/20 bg-amber-500/[0.02] hover:border-amber-400/30"
                      : "border-transparent hover:bg-[var(--color-muted)]/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                        isPending ? "bg-amber-500/15 text-amber-400" : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      }`}>
                        {(conv.customerEmail?.[0] || '?').toUpperCase()}
                      </div>
                      <span className="text-xs font-medium truncate">{conv.customerEmail || 'Anonymous'}</span>
                    </div>
                    <StatusBadge status={conv.status} />
                  </div>
                  <div className="flex items-center gap-1.5 ml-8">
                    <Bot className="w-2.5 h-2.5 text-[var(--color-muted-foreground)]" />
                    <span className="text-[10px] text-[var(--color-muted-foreground)] truncate">{conv.company?.name}</span>
                  </div>
                </button>
              );
            })}
            {filteredConvs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="w-8 h-8 text-[var(--color-muted-foreground)] mb-2 opacity-50" />
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {filter === "all" ? "No conversations yet" : `No ${filter} conversations`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] min-h-0 overflow-hidden">
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className="px-5 py-3.5 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-card)] to-amber-500/[0.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      selectedConv.status === "handoff_requested" ? "bg-amber-500/15 text-amber-400" : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    }`}>
                      {(selectedConv.customerEmail?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{selectedConv.customerEmail || 'Anonymous'}</span>
                        <StatusBadge status={selectedConv.status} />
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
                        <Bot className="w-3 h-3" />
                        {selectedConv.company?.name} · {selectedConv.bot?.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {selectedConv.status === "handoff_requested" && (
                      <button
                        onClick={() => joinConversation(selectedConv.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                        Join & Reply
                      </button>
                    )}
                    {selectedConv.status === "handoff_active" && (
                      <button
                        onClick={() => closeConversation(selectedConv.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-transparent via-transparent to-[var(--color-muted)]/20">
                {selectedConv.messages.map((msg) => {
                  const isAgent = msg.role === "agent";
                  const isSystem = msg.role === "system";
                  const isUser = !isAgent && !isSystem;

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="text-[10px] px-3 py-1.5 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[75%] ${
                        isAgent
                          ? "bg-amber-500/8 border border-amber-500/15 rounded-2xl rounded-bl-md"
                          : "bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-primary)]/10 border border-[var(--color-primary)]/10 rounded-2xl rounded-br-md"
                      }`}>
                        <div className="px-4 py-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            {isAgent ? (
                              <>
                                <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                                  <User className="w-2.5 h-2.5 text-amber-400" />
                                </div>
                                <span className="text-[10px] font-semibold text-amber-400">Agent</span>
                              </>
                            ) : (
                              <>
                                <span className="text-[10px] font-semibold text-[var(--color-muted-foreground)]">Customer</span>
                              </>
                            )}
                            <span className="text-[9px] text-[var(--color-muted-foreground)] ml-auto">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[var(--color-border)] bg-gradient-to-t from-[var(--color-card)] to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 relative">
                    <input
                      value={agentInput}
                      onChange={(e) => setAgentInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAgentMessage(); } }}
                      placeholder="Type your reply as agent..."
                      className="w-full pl-4 pr-3 py-2.5 rounded-xl text-sm bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder-[var(--color-muted-foreground)] focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-all"
                    />
                  </div>
                  <button
                    onClick={sendAgentMessage}
                    disabled={sending || !agentInput.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Send
                        <SendHorizonal className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-muted)] flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-[var(--color-muted-foreground)]" />
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)]">Select a conversation to manage</p>
                <p className="text-[10px] text-[var(--color-muted-foreground)] mt-1">
                  {conversations.filter(c => c.status === "handoff_requested").length} conversations waiting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
