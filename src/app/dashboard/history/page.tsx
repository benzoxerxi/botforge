"use client";
export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Bot,
  User,
} from "lucide-react";

interface Conversation {
  id: string;
  status: string;
  channel: string;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: string;
  tokenCost: number;
  messageCount: number;
  bot: { name: string | null };
  messages: { role: string; content: string; createdAt: string }[];
  _count: { messages: number };
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [convMessages, setConvMessages] = useState<any[]>([]);
  const [convLoading, setConvLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [status, router]);

  const fetchConversations = useCallback(async () => {
    if (!session?.user?.companyId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        companyId: session.user.companyId,
        page: String(page),
        limit: "20",
        status: statusFilter,
      });
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/conversations?${params}`);
      const data = await res.json();
      setConversations(data.conversations || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  }, [session, page, statusFilter, search]);

  useEffect(() => {
    if (session?.user?.companyId) {
      fetchConversations();
    }
  }, [fetchConversations, session?.user?.companyId]);

  const openConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    setConvLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conv.id}`);
      const data = await res.json();
      setConvMessages(data.conversation?.messages || []);
    } catch {}
    setConvLoading(false);
  };

  const closeConv = () => {
    setSelectedConv(null);
    setConvMessages([]);
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { label: string; cls: string; dot: string }> = {
      active: { label: "Active", cls: "bg-green-500/10 text-green-400 border-green-500/20", dot: "bg-green-400" },
      handoff_requested: { label: "Pending", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
      handoff_active: { label: "Live", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400" },
      closed: { label: "Closed", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20", dot: "bg-slate-400" },
    };
    const c = config[status] || config.closed;
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${c.cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  if (status !== "authenticated") return null;

  // ── Detail view ──
  if (selectedConv) {
    return (
      <ErrorBoundary>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={closeConv}
              className="p-2 rounded-lg hover:bg-white/5 transition-all text-white/40"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-white">Conversation Details</h2>
              <p className="text-xs text-white/40">
                {selectedConv.customerEmail || selectedConv.customerName || "Anonymous"} · {selectedConv.bot?.name}
              </p>
            </div>
          </div>

          {/* Conversation details card */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-[10px] text-white/30 uppercase tracking-wider">Status</div>
                <div className="mt-1">{statusBadge(selectedConv.status)}</div>
              </div>
              <div>
                <div className="text-[10px] text-white/30 uppercase tracking-wider">Channel</div>
                <div className="mt-1 text-xs font-medium text-white/70 capitalize">{selectedConv.channel}</div>
              </div>
              <div>
                <div className="text-[10px] text-white/30 uppercase tracking-wider">Messages</div>
                <div className="mt-1 text-xs font-medium text-white/70">{selectedConv._count?.messages || convMessages.length}</div>
              </div>
              <div>
                <div className="text-[10px] text-white/30 uppercase tracking-wider">Tokens</div>
                <div className="mt-1 text-xs font-medium text-white/70">{selectedConv.tokenCost.toLocaleString()}</div>
              </div>
            </div>
            <div className="text-[10px] text-white/40 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Created {new Date(selectedConv.createdAt).toLocaleString()}
            </div>
          </div>

          {/* Messages */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-white/40" />
              <span className="text-sm font-semibold text-white">Messages</span>
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {convLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : convMessages.length === 0 ? (
                <p className="text-sm text-white/40 text-center py-8">No messages</p>
              ) : (
                convMessages.map((msg: any) => {
                  const isAssistant = msg.role === "assistant" || msg.role === "agent";
                  const isSystem = msg.role === "system";
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="text-[10px] px-3 py-1 rounded-full bg-white/5 text-white/40">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id} className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-xl text-sm text-white/70 ${
                          isAssistant
                            ? "bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 rounded-bl-md"
                            : "bg-gradient-to-br from-violet-500/30 to-indigo-600/30 rounded-br-md"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {isAssistant ? (
                            <>
                              <Bot className="w-3 h-3 text-violet-400" />
                              <span className="text-[10px] font-semibold text-violet-400">Bot</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 text-white" />
                              <span className="text-[10px] font-semibold text-white/40">User</span>
                            </>
                          )}
                          <span className="text-[9px] text-white/40 ml-auto">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // ── List view ──
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-white/5 text-violet-400 bg-violet-400/5">
              <MessageSquare className="w-3 h-3" />
              Chat History
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Conversations</h1>
            <p className="text-xs text-white/40 mt-0.5">{total} total conversations</p>
          </div>
          <button
            onClick={fetchConversations}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-violet-400/50 transition-all"
            />
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "handoff_requested", label: "Pending" },
              { id: "handoff_active", label: "Live" },
              { id: "closed", label: "Closed" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => { setStatusFilter(f.id); setPage(1); }}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  statusFilter === f.id
                    ? "bg-violet-400/10 text-violet-400"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-12 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-white/40" />
              </div>
              <p className="text-sm text-white/40">No conversations found</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className="w-full text-left p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-violet-400/30 hover:bg-violet-400/[0.02] transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-violet-400">
                        {(conv.customerEmail?.[0] || conv.customerName?.[0] || "?").toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {conv.customerEmail || conv.customerName || "Anonymous"}
                        </span>
                        {statusBadge(conv.status)}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-[10px] text-white/40">
                          <Bot className="w-3 h-3" />
                          {conv.bot?.name || "Bot"}
                        </div>
                        <span className="text-[10px] text-white/40">·</span>
                        <div className="text-[10px] text-white/40 capitalize">
                          {conv.channel}
                        </div>
                        <span className="text-[10px] text-white/40">·</span>
                        <div className="text-[10px] text-white/40">
                          {conv._count?.messages || conv.messageCount} msgs
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/40 whitespace-nowrap shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(conv.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {conv.messages?.[0] && (
                  <div className="mt-2 ml-13 pl-13">
                    <p className="text-xs text-white/40 line-clamp-1">
                      <span className="font-medium text-white/60">
                        {conv.messages[0].role === "assistant" ? "Bot: " : "User: "}
                      </span>
                      {conv.messages[0].content}
                    </p>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-full text-xs font-medium bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 px-3 py-1.5 disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="text-xs text-white/40">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-full text-xs font-medium bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 px-3 py-1.5 disabled:opacity-40 transition-all"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
