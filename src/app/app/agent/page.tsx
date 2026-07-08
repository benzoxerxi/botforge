"use client";
export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  agent: { id: string; name: string | null; email: string };
}

interface Conversation {
  id: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  customerName: string | null;
  customerEmail: string | null;
  bot: { name: string | null };
  company: { name: string | null };
  messages: Message[];
  agentChats: AgentChat[];
  assignedAgentId?: string | null;
  assignedAt?: string | null;
}

const STORAGE_KEY = "bf_agent_status";

// === Elegant Inline SVG Icons ===
const Icons = {
  Bell: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
  ),
  UserCheck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
  ),
  MessageCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
  ),
  Customer: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  AgentIcon: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  MessageSquare: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  ),
  Send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
  ),
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
  ),
  BarChart3: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>
  ),
};

interface TabConfig {
  id: string;
  label: string;
  icon: () => React.ReactNode;
  filter: (c: Conversation, userId: string) => boolean;
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleDateString();
}

export default function AgentPanel() {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id || "";
  const companyId = session?.user?.companyId || "";

  // Data
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [assignedConvs, setAssignedConvs] = useState<Conversation[]>([]);
  const [closedConvs, setClosedConvs] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [typingPreview, setTypingPreview] = useState<string | null>(null);
  const [agentInput, setAgentInput] = useState("");
  const [sending, setSending] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<string>("awaiting");
  const [loading, setLoading] = useState(true);
  const [agentOnline, setAgentOnline] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string>("idle"); // idle | busy
  const [closedSince, setClosedSince] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // === Heartbeat: keep agent online ===
  useEffect(() => {
    if (sessionStatus !== "authenticated" || !companyId) return;
    const heartbeat = async () => {
      try {
        await fetch("/api/handoff/agent-heartbeat", { method: "POST" });
        setAgentOnline(true);
      } catch {}
    };
    heartbeat();
    const interval = setInterval(heartbeat, 10_000);
    return () => {
      clearInterval(interval);

    };
  }, [sessionStatus, companyId, agentStatus]);

  // === Poll conversations ===
  // === Poll active conversations ===
  const pollAll = useCallback(async () => {
    if (!companyId) return;
    try {
      const [allRes, assignedRes] = await Promise.all([
        fetch(`/api/handoff?companyId=${companyId}&filter=all`),
        fetch("/api/handoff/agent-assigned"),
      ]);
      const allData = await allRes.json();
      const assignedData = await assignedRes.json();
      setConversations(allData.conversations || []);
      setAssignedConvs(assignedData.conversations || []);
    } catch {}
    setLoading(false);
  }, [companyId]);

  // === Fetch closed conversations (separate state) ===
  const closedSinceRef = useRef(closedSince);
  closedSinceRef.current = closedSince;
  const fetchClosed = useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/handoff?companyId=${companyId}&filter=closed&closedSince=${closedSinceRef.current}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.conversations) setClosedConvs(data.conversations);
    } catch {}
  }, [companyId]);

  useEffect(() => {
    fetchClosed();
  }, [fetchClosed, closedSince]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    pollAll();
    const interval = setInterval(pollAll, 5000);
    return () => clearInterval(interval);
  }, [sessionStatus, pollAll]);

  // === Auto-distribute new handoff requests ===
  useEffect(() => {
    if (agentStatus === "busy") return;
    const pending = conversations.filter(c => c.status === "handoff_requested");
    for (const conv of pending) {
      // Skip if already assigned
      if (conv.assignedAgentId) continue;
      // Trigger assign
      fetch("/api/handoff/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conv.id }),
      }).catch(() => {});
    }
  }, [conversations, agentStatus]);

  // === 30s expiry check for assigned conversations ===
  useEffect(() => {
    if (agentStatus === "busy") return;
    const interval = setInterval(async () => {
      for (const conv of assignedConvs) {
        if (!conv.assignedAt) continue;
        const elapsed = Date.now() - new Date(conv.assignedAt).getTime();
        if (elapsed > 30_000) {
          await fetch("/api/handoff/assigned-expiry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId: conv.id }),
          });
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [assignedConvs]);

  // === Poll selected conversation messages ===
  const convRef = useRef(selectedConv);
  convRef.current = selectedConv;
  useEffect(() => {
    if (!selectedConv) return;
    // Poll messages
    const msgInterval = setInterval(async () => {
      const cur = convRef.current;
      if (!cur) return;
      try {
        const res = await fetch(`/api/handoff/status?conversationId=${cur.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages) {
          setSelectedConv(prev => prev ? { ...prev, messages: data.messages } : prev);
          setTypingPreview(null);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(msgInterval);
  }, [selectedConv?.id]);

  // Poll typing preview every 2s
  useEffect(() => {
    if (!selectedConv) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/widget/typing/get?conversationId=${selectedConv.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.content && data.content.length > 0) {
          setTypingPreview(data.content);
        } else {
          setTypingPreview(null);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedConv?.id]);

  // Scroll only when a NEW message arrives AFTER initial load
  const initialMsgsRef = useRef<string | null>(null);
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    const curCount = selectedConv?.messages?.length || 0;
    // Skip initial set (0→N when selecting a conversation)
    if (initialMsgsRef.current !== selectedConv?.id) {
      initialMsgsRef.current = selectedConv?.id || null;
      prevMsgCountRef.current = curCount;
      return;
    }
    // Only scroll if count increased after initial load
    if (curCount > prevMsgCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMsgCountRef.current = curCount;
  }, [selectedConv?.messages, selectedConv?.id]);

  // === Actions ===
  const takeConversation = async (id: string) => {
    await fetch("/api/handoff", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: id, action: "join" }),
    });
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, status: "handoff_active" } : c
    ));
    setAssignedConvs(prev => prev.filter(c => c.id !== id));
    setSelectedConv(prev =>
      prev?.id === id ? { ...prev, status: "handoff_active", assignedAgentId: null } : prev
    );
    setActiveTab("active");
  };

  const resolveConversation = async (id: string) => {
    await fetch("/api/handoff", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: id, action: "resolve" }),
    });
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, status: "closed" } : c
    ));
    setSelectedConv(prev =>
      prev?.id === id ? { ...prev, status: "closed" } : prev
    );
  };

  const sendMessage = async () => {
    if (!agentInput.trim() || !selectedConv || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/handoff", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          action: "message",
          message: agentInput,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setSelectedConv(prev =>
          prev ? { ...prev, messages: [...prev.messages, data.message] } : prev
        );
        setAgentInput("");
        setTypingPreview(null);
      }
    } catch {}
    setSending(false);
  };

  // === Tab config ===
  const TABS: TabConfig[] = [
    {
      id: "awaiting",
      label: "Awaiting",
      icon: Icons.Bell,
      filter: (c) => c.status === "handoff_requested" && (!c.assignedAgentId || c.assignedAgentId !== userId),
    },
    {
      id: "assigned",
      label: "Assigned",
      icon: Icons.UserCheck,
      filter: (c) => false, // separate data source
    },
    {
      id: "active",
      label: "Active",
      icon: Icons.MessageCircle,
      filter: (c) => c.status === "handoff_active" && c.agentChats?.some(ac => ac.agent?.id === userId),
    },
    {
      id: "closed",
      label: "Closed",
      icon: Icons.CheckCircle,
      filter: (c) => c.status === "closed",
    },
  ];

  const tabStatusTags: Record<string, { bg: string; text: string; label: string }> = {
    handoff_requested: { bg: "bg-amber-500/8", text: "text-amber-400", label: "awaiting" },
    handoff_active:    { bg: "bg-emerald-500/8", text: "text-emerald-400", label: "active" },
    closed:            { bg: "bg-blue-500/8", text: "text-blue-400", label: "closed" },
  };

  // Compute counts
  const awaitingCount = conversations.filter(c =>
    c.status === "handoff_requested" && (!c.assignedAgentId || c.assignedAgentId !== userId)
  ).length;
  const assignedCount = assignedConvs.length;
  const activeCount = conversations.filter(c =>
    c.status === "handoff_active" && c.agentChats?.some(ac => ac.agent?.id === userId)
  ).length;
  const closedCount = closedConvs.length;

  // Closed date filter options
  const closedDateOptions: { value: string; label: string }[] = [
    { value: "1",    label: "24h" },
    { value: "7",    label: "7d" },
    { value: "30",   label: "30d" },
    { value: "365",  label: "1y" },
    { value: "all",  label: "All" },
  ];

  // Determine which conversations to show
  let displayConvs: Conversation[] = [];
  if (activeTab === "assigned") {
    displayConvs = assignedConvs.filter(c => c.status === "handoff_requested");
  } else if (activeTab === "closed") {
    displayConvs = closedConvs;
  } else if (activeTab === "awaiting") {
    displayConvs = conversations.filter(c => TABS[0].filter(c, userId));
  } else {
    const tab = TABS.find(t => t.id === activeTab);
    if (tab) displayConvs = conversations.filter(c => tab.filter(c, userId));
  }

  // === Browser Notifications ===
  // Request permission on mount
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Track awaiting count changes — notify when new handoff arrives & page not focused
  const prevAwaitingRef = useRef(awaitingCount);
  useEffect(() => {
    if (awaitingCount <= prevAwaitingRef.current) {
      prevAwaitingRef.current = awaitingCount;
      return;
    }
    // awaitingCount increased
    const diff = awaitingCount - prevAwaitingRef.current;
    prevAwaitingRef.current = awaitingCount;
    if (document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("BotForge — New Request" + (diff > 1 ? ` (${diff})` : ""), {
        body: `${diff} conversation${diff > 1 ? "s are" : " is"} awaiting assignment`,
        icon: "/favicon.ico",
        tag: "botforge-handoff",
      });
    }
  }, [awaitingCount]);

  // Sync status from localStorage (set by layout header)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "busy" || saved === "idle") {
      setAgentStatus(saved);
    }
    const handler = (e: CustomEvent) => {
      setAgentStatus(e.detail);
    };
    window.addEventListener("agent-status-change", handler as EventListener);
    return () => window.removeEventListener("agent-status-change", handler as EventListener);
  }, []);

  if (sessionStatus !== "authenticated") return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-4 text-[var(--color-muted-foreground)]">
          <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-wider uppercase">Loading panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 h-full bg-[var(--color-background)] relative overflow-hidden">
      {/* === TAB STRIP (vertical, left) — sticky below header (h-12 = 48px) === */}
      <div className="w-[52px] flex-shrink-0 flex flex-col items-center gap-1.5 py-3 border-r border-[var(--color-border)] bg-[var(--color-card)]/40 self-start sticky top-[48px]">
        {TABS.map((tab) => {
          const count = tab.id === "awaiting" ? awaitingCount
            : tab.id === "assigned" ? assignedCount
            : tab.id === "active" ? activeCount
            : closedCount;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 w-10 py-2 text-[9px] font-medium tracking-wide transition-all duration-200 rounded-lg",
                activeTab === tab.id
                  ? "text-[var(--color-foreground)] bg-[var(--color-muted)] shadow-[inset_0_0_0_1px_rgba(0,240,255,0.1)]"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]/50"
              )}
            >
              <tab.icon />
              <span>{tab.label}</span>
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 flex items-center justify-center bg-[#00f0ff] text-[black] text-[7px] font-bold rounded-full">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* === CONVERSATION LIST (sidebar, nested) — independent, not tied to main chat === */}
      <div className="w-[232px] flex-shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-card)]/30 min-h-0 overflow-y-hidden" style={{ height: "calc(100vh - 48px)" }}>
        {/* Closed date filter — sticky in sidebar */}
        {activeTab === "closed" && (
          <div className="flex-shrink-0 px-2 py-2.5 border-b border-[var(--color-border)] flex gap-1">
            {closedDateOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setClosedSince(opt.value)}
                className={cn(
                  "flex-1 text-[10px] px-1.5 py-1 rounded-md font-medium transition-all",
                  closedSince === opt.value
                    ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]/50 border border-transparent"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-scroll px-2 pb-2 space-y-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.10) transparent" }}>
          <AnimatePresence initial={false} mode="popLayout">
            {displayConvs.map(conv => {
              const tag = tabStatusTags[conv.status] || tabStatusTags.handoff_requested;
              const lastMsg = conv.messages?.[conv.messages.length - 1];
              const preview = lastMsg?.content?.slice(0, 60) || "No messages";
              const isAssignedTab = activeTab === "assigned";
              return (
                <motion.button
                  key={conv.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setSelectedConv(conv)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all duration-200 border",
                    selectedConv?.id === conv.id
                      ? "bg-[var(--color-muted)] border-[var(--color-border)] shadow-[inset_0_0_0_1px_rgba(0,240,255,0.08)]"
                      : "bg-transparent border-transparent hover:bg-[var(--color-muted)]/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium truncate" style={{color:"var(--color-foreground)"}}>
                      {conv.customerEmail || "Anonymous"}
                    </span>
                    <span className={cn(
                      "whitespace-nowrap text-[9px] px-2 py-0.5 rounded-full font-medium leading-relaxed",
                      tag.bg, tag.text
                    )}>
                      {tag.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--color-muted-foreground)] truncate mt-1">{preview}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[9px] text-[var(--color-muted-foreground)]">{formatTime(conv.createdAt)}</span>
                    {isAssignedTab && conv.assignedAt && (
                      <span className="text-[9px] text-amber-400/50">
                        {Math.max(0, 30 - Math.floor((Date.now() - new Date(conv.assignedAt).getTime()) / 1000))}s
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
            {displayConvs.length === 0 && <EmptyState tabId={activeTab} />}
          </AnimatePresence>
        </div>
      </div>

      {/* === MAIN CHAT — only messages scroll, header + input are fixed === */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full bg-[var(--color-background)] relative overflow-hidden">
        {selectedConv ? (
          <>
            {/* Header — fixed at top */}
            <div className="flex-shrink-0 px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-card)]/30 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00f0ff]/12 to-[#7c3aed]/12 flex items-center justify-center border border-white/[0.05] text-[#00f0ff]/40">
                  <Icons.Customer />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{color:"var(--color-foreground)"}}>
                    {selectedConv.customerEmail || "Anonymous"}
                  </div>
                  <div className="text-[10px] text-[var(--color-muted-foreground)] flex items-center gap-2">
                    <span>{selectedConv.bot?.name || "Bot"}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
                    <span>{formatTime(selectedConv.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedConv.status === "handoff_requested" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => takeConversation(selectedConv.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#00f0ff] to-[#7c3aed] hover:opacity-90 transition-all shadow-lg shadow-[#00f0ff]/8"
                  >
                    Take Over
                  </motion.button>
                )}
                {selectedConv.status === "handoff_active" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => resolveConversation(selectedConv.id)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--color-muted-foreground)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] hover:text-red-400 hover:border-red-500/25 transition-all"
                  >
                    Resolve
                  </motion.button>
                )}
                {selectedConv.status === "closed" && (
                  <span className="text-xs text-[var(--color-muted-foreground)] px-3 py-2 rounded-xl bg-[var(--color-muted)] border border-[var(--color-border)]">
                    Closed
                  </span>
                )}
              </div>
            </div>

            {/* Messages — only this scrolls */}
            <div className="flex-1 min-h-0 overflow-y-scroll px-5 py-4 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.10) transparent" }}>
              <AnimatePresence initial={false}>
                {selectedConv.messages.map((msg, idx) => {
                  const isAgent = msg.role === "agent";
                  const isSystem = msg.role === "system";
                  const showAvatar = !isSystem && (idx === 0 || selectedConv.messages[idx - 1]?.role !== msg.role);
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "flex w-full",
                        isSystem ? "justify-center" : isAgent ? "justify-start" : "justify-end"
                      )}
                    >
                      {isSystem ? (
                        <div className="max-w-[70%] text-[10px] text-[var(--color-muted-foreground)] italic px-3 py-1.5 rounded-lg bg-[var(--color-muted)] border border-[var(--color-border)]">
                          {msg.content}
                        </div>
                      ) : (
                        <div className={cn(
                          "flex gap-2 max-w-[75%]",
                          isAgent ? "flex-row" : "flex-row-reverse"
                        )}>
                          <div className={cn(
                            "w-7 h-7 mt-1 rounded-full flex items-center justify-center flex-shrink-0 border",
                            isAgent
                              ? "bg-gradient-to-br from-amber-400/12 to-amber-600/8 border-amber-500/12 text-amber-300/50"
                              : "bg-gradient-to-br from-[#00f0ff]/12 to-[#7c3aed]/12 border-[#00f0ff]/12 text-[#00f0ff]/40",
                            showAvatar ? "" : "invisible"
                          )}>
                            {isAgent ? <Icons.AgentIcon /> : <Icons.Customer />}
                          </div>
                          <div className={cn(
                            "p-3 rounded-2xl text-sm leading-relaxed border",
                            isAgent
                              ? "bg-gradient-to-br from-amber-500/6 to-amber-400/3 border-amber-500/8 rounded-tl-sm"
                              : "bg-gradient-to-br from-[#00f0ff]/5 to-[#7c3aed]/4 border-[#00f0ff]/6 rounded-tr-sm"
                          )}
                            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                          >
                            <div className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted-foreground)] mb-1.5">
                              {isAgent ? "Agent" : selectedConv.customerEmail || "Customer"}
                            </div>
                            <div className="leading-relaxed" style={{color:"var(--color-foreground)"}}>{msg.content}</div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {/* Typing preview */}
                {typingPreview && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] border border-amber-500/12 bg-amber-500/[0.03] rounded-2xl rounded-bl-md px-4 py-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        <span className="text-[10px] font-semibold text-amber-400/60">Customer typing...</span>
                      </div>
                      <p className="text-xs leading-relaxed italic text-[var(--color-muted-foreground)]" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {typingPreview}
                      </p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input — always at bottom */}
            {(selectedConv.status === "handoff_active" || selectedConv.status === "handoff_requested") && (
              <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-card)]/30 backdrop-blur-xl">
                <div className="flex gap-2 items-center bg-[var(--color-muted)] rounded-2xl border border-[var(--color-border)] px-3 py-2 focus-within:border-[var(--color-accent)]/25 transition-all duration-200">
                  <input
                    value={agentInput}
                    onChange={e => setAgentInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={selectedConv.status === "handoff_requested" ? "Take over to reply..." : "Type a reply..."}
                    disabled={selectedConv.status === "handoff_requested"}
                    className="flex-1 bg-transparent text-sm text-[var(--color-foreground)] placeholder-[var(--color-muted-foreground)] focus:outline-none disabled:opacity-30"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      selectedConv.status === "handoff_requested"
                        ? takeConversation(selectedConv.id)
                        : sendMessage()
                    }
                    disabled={selectedConv.status === "handoff_active" && (sending || !agentInput.trim())}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#00f0ff] to-[#7c3aed] text-white hover:opacity-90 disabled:opacity-30 transition-all"
                  >
                    {selectedConv.status === "handoff_requested" ? (
                      <>Take Over <Icons.ArrowRight /></>
                    ) : sending ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Icons.Send />
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-xs">
              <div className="mb-5 flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/10">
                  <Icons.MessageSquare />
                </div>
              </div>
              <h3 className="text-base font-medium text-white/40 mb-2">No conversation selected</h3>
              <p className="text-xs text-white/12 leading-relaxed">
                Choose a conversation from the sidebar to begin assisting customers.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tabId }: { tabId: string }) {
  const messages: Record<string, { icon: () => React.ReactNode; text: string }> = {
    awaiting:  { icon: Icons.Bell,        text: "No conversations awaiting assignment" },
    assigned:  { icon: Icons.UserCheck,   text: "No conversations assigned to you" },
    active:    { icon: Icons.MessageCircle, text: "No active conversations" },
    closed:    { icon: Icons.CheckCircle,  text: "No closed conversations" },
  };
  const info = messages[tabId] || messages.awaiting;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-white/10 mb-3"><info.icon /></span>
      <span className="text-[11px] text-white/12">{info.text}</span>
    </div>
  );
}
