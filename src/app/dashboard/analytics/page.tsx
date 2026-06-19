"use client";
export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  BarChart3,
  MessageSquare,
  Users,
  Bot,
  TrendingUp,
  Clock,
  Star,
  RefreshCw,
  Activity,
  Database,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = ["#00f0ff", "#7c3aed", "#f59e0b", "#ef4444", "#22c55e", "#0ea5e9"];

interface AnalyticsData {
  company: { tokensUsed: number; tokenLimit: number };
  conversations: { total: number; active: number; handoff: number; recent7Days: number };
  messages: number;
  tokens: { total: number; daily: { date: string; tokens: number }[] };
  knowledge: { entries: number; chunks: number };
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [status, router]);

  const fetchAnalytics = useCallback(async () => {
    if (!session?.user?.companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?companyId=${session.user.companyId}`);
      const result = await res.json();
      setData(result);
    } catch {}
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (session?.user?.companyId) fetchAnalytics();
  }, [fetchAnalytics, session?.user?.companyId]);

  if (status !== "authenticated") return null;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const tokenUsagePercent = data.company.tokenLimit > 0
    ? Math.round((data.company.tokensUsed / data.company.tokenLimit) * 100)
    : 0;

  const conversationPie = [
    { name: "Active", value: data.conversations.active },
    { name: "Handoff", value: data.conversations.handoff },
    { name: "Closed", value: Math.max(0, data.conversations.total - data.conversations.active - data.conversations.handoff) },
  ].filter((d) => d.value > 0);

  const dailyData = data.tokens.daily || [];

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-accent)] bg-[var(--color-accent)]/5">
              <BarChart3 className="w-3 h-3" />
              Analytics
            </div>
            <h1 className="text-xl font-bold tracking-tight">Dashboard Analytics</h1>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
              Real-time stats and trends
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-all text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">Total Conversations</div>
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold">{data.conversations.total.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--color-muted-foreground)]">
              <span className="text-green-400">{data.conversations.recent7Days} this week</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">Active Chats</div>
              <div className="p-1.5 rounded-lg bg-green-500/10">
                <Activity className="w-3.5 h-3.5 text-green-400" />
              </div>
            </div>
            <div className="text-2xl font-bold">{data.conversations.active}</div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--color-muted-foreground)]">
              <span className="text-amber-400">{data.conversations.handoff} in handoff</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">Total Messages</div>
              <div className="p-1.5 rounded-lg bg-purple-500/10">
                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              </div>
            </div>
            <div className="text-2xl font-bold">{data.messages.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--color-muted-foreground)]">
              Across all conversations
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">Token Usage</div>
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <Database className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>
            <div className="text-2xl font-bold">{tokenUsagePercent}%</div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--color-muted-foreground)]">
              <span>{data.company.tokensUsed.toLocaleString()} / {data.company.tokenLimit.toLocaleString()}</span>
            </div>
            <div className="mt-2 w-full h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] transition-all"
                style={{ width: `${Math.min(tokenUsagePercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Token Usage Chart */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
              <h3 className="text-sm font-semibold">Daily Token Usage (7 days)</h3>
            </div>
            <div className="h-64">
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,14,26,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tokens"
                      stroke="#00f0ff"
                      strokeWidth={2}
                      dot={{ fill: "#00f0ff", r: 3 }}
                      activeDot={{ r: 5, fill: "#00f0ff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-[var(--color-muted-foreground)]">
                  No token data available yet
                </div>
              )}
            </div>
          </div>

          {/* Conversation Status Pie */}
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-[var(--color-accent)]" />
              <h3 className="text-sm font-semibold">Conversation Status</h3>
            </div>
            <div className="h-64 flex items-center justify-center">
              {conversationPie.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={conversationPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {conversationPie.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,14,26,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-[var(--color-muted-foreground)]">No data</div>
              )}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {conversationPie.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  />
                  <span className="text-[10px] text-[var(--color-muted-foreground)]">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Knowledge Base Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-[var(--color-accent)]" />
              <h3 className="text-sm font-semibold">Knowledge Base</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">Documents</div>
                <div className="text-xl font-bold">{data.knowledge.entries}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">Chunks</div>
                <div className="text-xl font-bold">{data.knowledge.chunks.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-4 h-4 text-[var(--color-accent)]" />
              <h3 className="text-sm font-semibold">Usage Overview</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">Total Tokens</div>
                <div className="text-xl font-bold">{data.tokens.total.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">Avg per Conv</div>
                <div className="text-xl font-bold">
                  {data.conversations.total > 0
                    ? Math.round(data.tokens.total / data.conversations.total).toLocaleString()
                    : 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
