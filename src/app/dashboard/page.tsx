"use client";
export const dynamic = "force-dynamic";

import ErrorBoundary from "@/components/ErrorBoundary";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare, Users, BarChart3, BookOpen, TrendingUp,
  Activity, Bot, Zap, Settings, ArrowRight, Sparkles,
  Clock, Star, Timer, RefreshCw, BrainCircuit, HelpCircle,
  Lightbulb, ThumbsUp, Search, ChevronRight, AlertCircle,
  CheckCircle2, X,
} from "lucide-react";
import ManageCompanyModal from "./ManageCompanyModal";

// ─── Types ──────────────────────────────────────────
interface Analytics {
  company: { tokensUsed: number; tokenLimit: number };
  conversations: { total: number; active: number; handoff: number; recent7Days: number };
  messages: number;
  tokens: { total: number; daily: Array<{ date: string; tokens: number }> };
  knowledge: { entries: number; chunks: number };
  waitingConversations: number;
  agentResponseTime: { averageSeconds: number; formatted: string };
  botResolution: { rate: number; resolvedByBot: number; totalClosed: number };
  transferRate: { rate: number; transferred: number; total: number };
  ratings: { average: number; count: number; distribution: Record<number, number> };
  botPerformance: { totalQuestions: number; handledByBot: number; failed: number; successRate: number };
  topFailedQuestions: Array<{ question: string; count: number }>;
  knowledgeGaps: Array<{ topic: string; count: number }>;
  qualityScore: { score: number; label: string; color: string };
  activityHeatmap: Array<{ day: number; hour: number; count: number }>;
  conversationTrend: number;
  recentConversations: Array<{
    id: string; userName: string; status: string;
    lastActivity: string; duration: string;
    botMessages: number; agentMessages: number;
  }>;
}

// ─── Navigation Items ───────────────────────────────
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: Activity },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "company", label: "Bot Settings", icon: Settings },
  { key: "history", label: "Chat History", icon: MessageSquare },
  { key: "agent", label: "Agents", icon: Users },
];

// ─── Day / Hour Labels ──────────────────────────────
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_LABELS = Array.from({ length: 12 }, (_, i) => `${i === 0 ? 12 : i}${i < 6 ? 'a' : 'p'}`);

// ─── Helpers ────────────────────────────────────────
const formatNumber = (n: number) => n.toLocaleString();
const statusBadge = (status: string) => {
  switch (status) {
    case "closed": return { label: "Bot Resolved", color: "bg-green-500/10 text-green-400 border-green-500/20" };
    case "handoff_requested":
    case "handoff_active": return { label: "Agent Handoff", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    case "waiting":
    case "pending": return { label: "Waiting", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", pulse: true };
    default: return { label: "Active", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
  }
};

// ─── Main Page ──────────────────────────────────────
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("dashboard");

  const fetchData = useCallback(() => {
    const companyId = session?.user?.companyId;
    if (companyId) {
      fetch(`/api/analytics?companyId=${companyId}`)
        .then((r) => r.json())
        .then(setAnalytics)
        .catch(() => {});
    }
    if (session?.user?.role === "super_admin") {
      fetch("/api/admin/companies")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [status, router, session, fetchData]);

  const isSuperAdmin = session?.user?.role === "super_admin";
  const onNav = (key: string) => {
    setActiveNav(key);
    if (key === "dashboard") return;
    router.push(key === "analytics" ? "/dashboard/analytics" : `/dashboard/${key}`);
  };

  return (
    <ErrorBoundary>
      <div className="bg-[#000000] text-white min-h-screen">
        {/* ───── Top Navigation ───── */}
        <nav className="sticky top-0 z-50 bg-[#000000]/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold tracking-tight">BotForge</span>
                <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10 ml-1">
                  {isSuperAdmin ? "Admin" : "Dashboard"}
                </span>
              </div>

              {/* Nav Items */}
              <div className="flex items-center gap-0.5">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeNav === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => onNav(item.key)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isActive
                          ? "bg-white text-black shadow-lg"
                          : "text-white/50 hover:text-white/80 hover:bg-white/5"
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center border border-white/10">
                <span className="text-xs font-bold text-white/70">
                  {session?.user?.name?.[0]?.toUpperCase() || "A"}
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* ───── Content ───── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {isSuperAdmin ? (
            <AdminSection stats={stats} loading={loading} />
          ) : loading ? (
            <div className="flex justify-center py-32">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-[2.5px] border-violet-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-white/40">Loading analytics...</span>
              </div>
            </div>
          ) : (
            <CompanyDashboard analytics={analytics} />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

// ─── ═════════════════════════════════════════════════
//     COMPANY DASHBOARD (Redesigned)
// ─── ═════════════════════════════════════════════════
function CompanyDashboard({ analytics }: { analytics: Analytics | null }) {
  if (!analytics) {
    return (
      <div className="p-16 text-center max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-white/30" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
        <p className="text-sm text-white/40 mb-6">Start chatting with customers to see analytics here.</p>
        <a href="/dashboard/agent" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium bg-white text-black hover:opacity-90 transition-all">
          <MessageSquare className="w-4 h-4" />
          Go to Agent Panel
        </a>
      </div>
    );
  }

  const a = analytics;
  const maxDailyToken = Math.max(...a.tokens.daily.map((d) => d.tokens), 1);
  const tokenPercent = a.company.tokenLimit > 0 ? Math.round((a.company.tokensUsed / a.company.tokenLimit) * 100) : 0;
  const trendColor = a.conversationTrend >= 0 ? "text-green-400" : "text-red-400";
  const trendIcon = a.conversationTrend >= 0 ? TrendingUp : TrendingUp;

  // Rating stars
  const renderStars = (avg: number) => {
    const full = Math.floor(avg);
    const half = avg - full >= 0.5;
    return Array.from({ length: 5 }, (_, i) =>
      i < full ? "★" : (half && i === full ? "★" : "☆")
    ).join("");
  };

  return (
    <div className="space-y-6">

      {/* ───── Hero Section ───── */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-8">
        {/* Left: Welcome + KPI */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/40 tracking-wider uppercase mb-1">Welcome back</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{a.conversations.total}</h1>
          <p className="text-sm text-white/40 mt-1">Total Conversations</p>

          {/* Trend */}
          <div className="flex items-center gap-1.5 mt-2">
            <TrendingUp className={`w-3.5 h-3.5 ${trendColor}`} />
            <span className={`text-xs font-medium ${trendColor}`}>
              {a.conversationTrend >= 0 ? "+" : ""}{a.conversationTrend}%
            </span>
            <span className="text-xs text-white/30">vs last week</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 mt-4">
            <a
              href="/dashboard/company"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-white/5 text-white/70 hover:bg-white/10 transition-all border border-white/10"
            >
              <Settings className="w-3 h-3" />
              Bot Settings
              <ChevronRight className="w-3 h-3" />
            </a>
            <a
              href="/dashboard/agent"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-white/5 text-white/70 hover:bg-white/10 transition-all border border-white/10"
            >
              <Users className="w-3 h-3" />
              Agent Panel
              <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Right: Active / Messages visualization */}
        <div className="flex gap-4 shrink-0">
          {/* Active Now bar */}
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/10 p-4 flex flex-col justify-between">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">Active</div>
            <div>
              <div className="text-3xl font-bold">{a.conversations.active}</div>
              <div className="text-[11px] text-white/40">Now</div>
            </div>
          </div>

          {/* Messages bar chart (3 thin bars) */}
          <div className="w-32 h-32 rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex flex-col justify-between">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">Messages</div>
            <div>
              <div className="flex items-end gap-1.5 h-12 mb-1">
                <div className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-500/40 to-violet-400/20" style={{ height: "60%" }} />
                <div className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-500/60 to-violet-400/30" style={{ height: "85%" }} />
                <div className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-500/80 to-violet-400/40" style={{ height: "100%" }} />
                <div className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-500/50 to-violet-400/20" style={{ height: "70%" }} />
                <div className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-500/40 to-violet-400/20" style={{ height: "45%" }} />
              </div>
              <div className="text-lg font-bold">{formatNumber(a.messages)}</div>
              <div className="text-[10px] text-white/30">Sent</div>
            </div>
          </div>
        </div>
      </div>

      {/* ───── 3-Column Grid ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Token Usage Line Chart */}
        <div className="lg:col-span-1 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Token Usage</h3>
              <p className="text-[10px] text-white/40">Last 7 days</p>
            </div>
            {a.company.tokenLimit > 0 && (
              <div className="text-right">
                <div className="text-xs font-medium">{tokenPercent}% used</div>
              </div>
            )}
          </div>

          {/* Line chart area */}
          <div className="relative h-36">
            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <line x1="0" y1="75%" x2="100%" y2="75%" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <line x1="0" y1="25%" x2="100%" y2="25%" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </svg>

            {a.tokens.daily.length > 0 ? (
              <svg className="relative w-full h-full" viewBox={`0 0 ${a.tokens.daily.length * 30} 140`} preserveAspectRatio="none">
                {/* Gradient fill under line */}
                <defs>
                  <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(139,92,246,0.3)" />
                    <stop offset="100%" stopColor="rgba(139,92,246,0)" />
                  </linearGradient>
                </defs>

                {/* Area fill */}
                <path
                  d={`M 0,140 L ${a.tokens.daily.map((d: any, i: number) => {
                    const x = i * 30 + 15;
                    const y = 140 - ((d.tokens / maxDailyToken) * 120 + 4);
                    return `L ${x},${y}`;
                  }).join(" ").replace("L", "")} L ${(a.tokens.daily.length - 1) * 30 + 15},140 Z`}
                  fill="url(#tokenGrad)"
                />

                {/* Line */}
                <polyline
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={a.tokens.daily.map((d: any, i: number) => {
                    const x = i * 30 + 15;
                    const y = 140 - ((d.tokens / maxDailyToken) * 120 + 4);
                    return `${x},${y}`;
                  }).join(" ")}
                />

                {/* Dots */}
                {a.tokens.daily.map((d: any, i: number) => {
                  const x = i * 30 + 15;
                  const y = 140 - ((d.tokens / maxDailyToken) * 120 + 4);
                  return (
                    <circle key={i} cx={x} cy={y} r="3" fill="#a78bfa" stroke="#000" strokeWidth="1.5" className="hover:r-5 transition-all cursor-pointer">
                      <title>{d.tokens.toLocaleString()} tokens on {d.date}</title>
                    </circle>
                  );
                })}
              </svg>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-white/30">No token data yet</div>
            )}
          </div>

          {/* X-axis labels */}
          {a.tokens.daily.length > 0 && (
            <div className="flex justify-between mt-1.5 px-1">
              {a.tokens.daily.map((d: any, i: number) => (
                <span key={i} className="text-[8px] text-white/30">{d.date.slice(-2)}</span>
              ))}
            </div>
          )}

          {/* Total + Limit */}
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-[11px]">
            <span className="text-white/40">
              Total: <span className="font-semibold text-white/80">{formatNumber(a.tokens.total)}</span>
            </span>
            {a.company.tokenLimit > 0 && (
              <span className="text-white/40">Limit: <span className="font-semibold text-white/80">{formatNumber(a.company.tokenLimit)}</span></span>
            )}
          </div>
        </div>

        {/* Center: Activity Heatmap */}
        <div className="lg:col-span-1 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center">
              <Activity className="w-3 h-3 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Bot Activity</h3>
              <p className="text-[10px] text-white/40">By time · Last 7 days</p>
            </div>
          </div>

          {/* Heatmap grid */}
          <div className="relative">
            {/* Hour header row */}
            <div className="flex mb-1.5" style={{ paddingLeft: "36px" }}>
              {HOUR_LABELS.map((h, i) => (
                <div key={i} className="flex-1 text-[7px] text-white/20 text-center leading-none">{h}</div>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              {DAY_LABELS.map((day, dayIdx) => {
                const maxCount = Math.max(...a.activityHeatmap.map((h: any) => h.count), 1);
                return (
                  <div key={day} className="flex items-center gap-1.5">
                    <div className="w-[30px] text-[8px] text-white/30 shrink-0 text-right">{day}</div>
                    <div className="flex gap-0.5 flex-1">
                      {Array.from({ length: 12 }, (_, hourIdx) => {
                        const cell = a.activityHeatmap.find(
                          (h: any) => h.day === dayIdx && h.hour === hourIdx * 2
                        ) || a.activityHeatmap.find(
                          (h: any) => h.day === dayIdx && h.hour === (hourIdx === 0 ? 0 : hourIdx * 2 - 1)
                        ) || { count: 0 };
                        const intensity = maxCount > 0 ? cell.count / maxCount : 0;
                        const opacity = 0.08 + intensity * 0.7;
                        return (
                          <div
                            key={hourIdx}
                            className="flex-1 aspect-square rounded-sm transition-all hover:scale-125 cursor-pointer"
                            style={{
                              backgroundColor: intensity > 0
                                ? `rgba(139,92,246,${opacity})`
                                : "rgba(255,255,255,0.02)",
                            }}
                            title={`${day} ${hourIdx}:00-${hourIdx + 2}:00 — ${cell.count} conversations`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[8px] text-white/20">Low</span>
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-sm bg-white/[0.02]" />
                <div className="w-3 h-3 rounded-sm bg-violet-500/20" />
                <div className="w-3 h-3 rounded-sm bg-violet-500/40" />
                <div className="w-3 h-3 rounded-sm bg-violet-500/60" />
                <div className="w-3 h-3 rounded-sm bg-violet-500/80" />
              </div>
              <span className="text-[8px] text-white/20">High</span>
            </div>
          </div>
        </div>

        {/* Right: Recent Conversations */}
        <div className="lg:col-span-1 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center">
                <MessageSquare className="w-3 h-3 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Recent Conversations</h3>
                <p className="text-[10px] text-white/40">Latest activity</p>
              </div>
            </div>
            <a href="/dashboard/history" className="text-[10px] text-violet-400 hover:underline">View all</a>
          </div>

          <div className="space-y-2">
            {a.recentConversations.length > 0 ? (
              a.recentConversations.slice(0, 5).map((conv, i) => {
                const badge = statusBadge(conv.status);
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group cursor-pointer">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center shrink-0 border border-white/5">
                      <span className="text-xs font-medium text-white/70">
                        {conv.userName[0]?.toUpperCase() || "?"}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{conv.userName}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${badge.color} leading-none`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 mt-0.5">{conv.duration}</p>
                    </div>

                    {/* Message count */}
                    <div className="text-[10px] text-white/30 text-right shrink-0">
                      <div>{conv.botMessages} bot</div>
                      {conv.agentMessages > 0 && <div className="text-blue-400/50">{conv.agentMessages} agent</div>}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 mx-auto text-white/10 mb-2" />
                <p className="text-xs text-white/30">No conversations yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───── 4 KPI Small Cards Row ───── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Waiting */}
        <div className="p-3.5 rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold">{a.waitingConversations}</div>
            <div className="text-[10px] text-white/40 truncate">Waiting</div>
            {a.waitingConversations > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block mt-1 animate-pulse" />}
          </div>
        </div>

        {/* Response Time */}
        <div className="p-3.5 rounded-2xl border border-blue-500/10 bg-blue-500/[0.02] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Timer className="w-4 h-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold">{a.agentResponseTime.formatted}</div>
            <div className="text-[10px] text-white/40 truncate">Response Time</div>
          </div>
        </div>

        {/* Bot Resolution */}
        <div className="p-3.5 rounded-2xl border border-green-500/10 bg-green-500/[0.02] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-green-400" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold">{a.botResolution.rate}%</div>
            <div className="text-[10px] text-white/40 truncate">Bot Resolved</div>
          </div>
        </div>

        {/* Rating */}
        <div className="p-3.5 rounded-2xl border border-yellow-500/10 bg-yellow-500/[0.02] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold">
              {a.ratings.count > 0 ? (
                <span className="text-yellow-400">{a.ratings.average}</span>
              ) : (
                <span className="text-white/30">N/A</span>
              )}
            </div>
            <div className="text-[10px] text-white/40 truncate">
              {a.ratings.count > 0 ? `${a.ratings.count} reviews` : "No ratings"}
            </div>
          </div>
        </div>
      </div>

      {/* ───── Bot Performance & Quality Section ───── */}
      <div>
        <div className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-white/5 text-white/50 bg-white/[0.02]">
          <BrainCircuit className="w-3 h-3" />
          Bot Performance & Quality
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Quality Score (gauge) */}
          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="w-4 h-4" style={{ color: a.qualityScore.color }} />
              <h3 className="text-sm font-semibold">Bot Quality Score</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke={a.qualityScore.color} strokeWidth="6"
                    strokeDasharray={`${(a.qualityScore.score / 100) * 213.6} 213.6`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold" style={{ color: a.qualityScore.color }}>{a.qualityScore.score}</span>
                </div>
              </div>
              <div>
                <div className="text-base font-semibold" style={{ color: a.qualityScore.color }}>{a.qualityScore.label}</div>
                <div className="text-[10px] text-white/40 mt-1">
                  Ratings + resolution + handoff
                </div>
              </div>
            </div>
          </div>

          {/* Bot Questions */}
          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold">Bot Questions</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold">{a.botPerformance.totalQuestions}</div>
                <div className="text-[9px] text-white/40 mt-0.5">Total</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-400">{a.botPerformance.handledByBot}</div>
                <div className="text-[9px] text-white/40 mt-0.5">Answered</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-400">{a.botPerformance.failed}</div>
                <div className="text-[9px] text-white/40 mt-0.5">Failed</div>
              </div>
            </div>
            {/* Success bar */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
                <span>Success Rate</span>
                <span className="font-semibold" style={{ color: a.botPerformance.successRate >= 60 ? '#22c55e' : '#ef4444' }}>
                  {a.botPerformance.successRate}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all bg-gradient-to-r from-green-500 to-emerald-400"
                  style={{ width: `${a.botPerformance.successRate}%` }} />
              </div>
            </div>
          </div>

          {/* Transfer vs Resolve */}
          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold">Transfer vs Resolve</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] text-white/40 mb-1">
                  <span>Bot Resolution</span>
                  <span className="font-semibold text-green-400">{a.botResolution.rate}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                    style={{ width: `${a.botResolution.rate}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-white/40 mb-1">
                  <span>Transfer to Agent</span>
                  <span className="font-semibold text-purple-400">{a.transferRate.rate}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400"
                    style={{ width: `${a.transferRate.rate}%` }} />
                </div>
              </div>
              <div className="pt-1 text-[10px] text-white/30">
                {a.botResolution.resolvedByBot} closed by bot · {a.transferRate.transferred} transferred
              </div>
            </div>
          </div>
        </div>

        {/* Top Failed Questions + Knowledge Gaps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Failed */}
          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold">Top Failed Questions</h3>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">
                {a.topFailedQuestions.length}
              </span>
            </div>
            {a.topFailedQuestions.length > 0 ? (
              <div className="space-y-1.5">
                {a.topFailedQuestions.map((q, i) => (
                  <div key={i}
                    className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <span className="text-[10px] font-bold text-red-400 w-4 shrink-0 mt-0.5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] truncate">{q.question}</p>
                      <p className="text-[9px] text-white/40 mt-0.5">
                        {q.count} time{q.count > 1 ? 's' : ''} led to handoff
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-red-400 shrink-0">{q.count}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-white/30">No handoff data yet — all clear!</div>
            )}
          </div>

          {/* Knowledge Gaps */}
          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold">Suggested KB Improvements</h3>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                {a.knowledgeGaps.length}
              </span>
            </div>
            {a.knowledgeGaps.length > 0 ? (
              <div className="space-y-1.5">
                {a.knowledgeGaps.map((gap, i) => (
                  <div key={i}
                    className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <span className="text-[10px] font-bold text-amber-400 w-4 shrink-0 mt-0.5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] capitalize truncate">{gap.topic}</p>
                      <p className="text-[9px] text-white/40 mt-0.5">
                        {gap.count} conversation{gap.count > 1 ? 's' : ''} requested human help
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-400 shrink-0">{gap.count}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-white/30">No common failure patterns — KB seems solid!</div>
            )}
            {a.knowledge.entries > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
                <span>Current KB: {a.knowledge.entries} sources</span>
                <a href="/dashboard/company" className="text-violet-400 hover:underline">Manage KB →</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ═════════════════════════════════════════════════
//     ADMIN SECTION (Dark Redesign)
// ─── ═════════════════════════════════════════════════
function AdminSection({ stats, loading }: { stats: any; loading: boolean }) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [manageCompany, setManageCompany] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/admin/companies")
      .then((r) => r.json())
      .then((data) => setCompanies(data.companies || []))
      .catch(() => {});
  }, []);

  const totalTokens = companies.reduce((sum: number, c: any) => sum + (c.tokensUsed || 0), 0);
  const activeCount = companies.filter((c: any) => c.active).length;

  if (loading || companies.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[2.5px] border-violet-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-white/40">Loading companies...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Hero */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-white/40 tracking-wider uppercase mb-1">Admin</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{companies.length}</h1>
          <p className="text-sm text-white/40 mt-1">Total Companies</p>
        </div>
        <div className="flex gap-2">
          <div className="p-3 rounded-2xl border border-green-500/10 bg-green-500/[0.02] text-center">
            <div className="text-lg font-bold text-green-400">{activeCount}</div>
            <div className="text-[9px] text-white/40">Active</div>
          </div>
          <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
            <div className="text-lg font-bold">{companies.length - activeCount}</div>
            <div className="text-[9px] text-white/40">Inactive</div>
          </div>
        </div>
      </div>

      {/* Admin 4 Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Total Companies", value: companies.length },
          { icon: Activity, label: "Active", value: activeCount, trend: `${((activeCount / Math.max(companies.length, 1)) * 100).toFixed(0)}%` },
          { icon: Bot, label: "Inactive", value: companies.length - activeCount },
          { icon: Zap, label: "Total Tokens", value: formatNumber(totalTokens) },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center mb-2">
              <stat.icon className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-xl font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div>
            <div className="text-[10px] text-white/40 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Companies Table */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold">All Companies</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
            {companies.length} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">Company</th>
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">Plan</th>
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">Tokens</th>
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">Status</th>
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c: any) => {
                const tokenPct = c.tokenLimit > 0 ? Math.round((c.tokensUsed / c.tokenLimit) * 100) : 0;
                return (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center text-xs font-bold text-violet-400">
                          {c.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-[10px] text-white/30">{c.id?.slice(0, 12)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 capitalize border border-violet-500/20">
                        {c.plan || "Free"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(tokenPct, 100)}%`,
                              background: tokenPct > 80
                                ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                                : "linear-gradient(90deg, #a78bfa, #6366f1)",
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-white/30">
                          {(c.tokensUsed || 0).toLocaleString()}/{(c.tokenLimit || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        c.active
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${
                          c.active ? "bg-green-400" : "bg-red-400"
                        }`} />
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setManageCompany(c)}
                        className="text-[11px] px-3 py-1.5 rounded-full font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-all border border-white/10"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-white/20" />
                    </div>
                    <p className="text-sm text-white/30">No companies registered yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ManageCompanyModal
        company={manageCompany}
        open={!!manageCompany}
        onClose={() => setManageCompany(null)}
      />
    </div>
  );
}
