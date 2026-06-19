"use client";
export const dynamic = "force-dynamic";

import ErrorBoundary from "@/components/ErrorBoundary";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MessageSquare,
  Users,
  BarChart3,
  BookOpen,
  TrendingUp,
  Activity,
  Bot,
  Zap,
  Settings,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Analytics {
  company: { tokensUsed: number; tokenLimit: number };
  conversations: { total: number; active: number; handoff: number; recent7Days: number };
  messages: number;
  tokens: { total: number; daily: Array<{ date: string; tokens: number }> };
  knowledge: { entries: number; chunks: number };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      const companyId = session?.user?.companyId;

      if (companyId) {
        fetch(`/api/analytics?companyId=${companyId}`)
          .then((r) => r.json())
          .then(setAnalytics)
          .finally(() => setLoading(false));
      }

      if (session?.user?.role === "super_admin") {
        fetch("/api/admin/companies")
          .then((r) => r.json())
          .then(setStats)
          .catch(() => {});
      }
    }
  }, [status, router, session]);

  const isSuperAdmin = session?.user?.role === "super_admin";

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-accent)] bg-[var(--color-accent)]/5">
            <Zap className="w-3 h-3" />
            {isSuperAdmin ? "Admin Overview" : "Dashboard"}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {isSuperAdmin ? "Admin Dashboard" : session?.user?.companyName || "Dashboard"}
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1.5">
            {isSuperAdmin
              ? "Manage all companies and monitor platform usage"
              : "Your AI chatbot analytics at a glance"}
          </p>
        </div>

        {isSuperAdmin ? (
          <AdminSection />
        ) : loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-[2.5px] border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[var(--color-muted-foreground)]">Loading analytics...</span>
            </div>
          </div>
        ) : (
          <CompanyAnalytics analytics={analytics} />
        )}
      </div>
    </ErrorBoundary>
  );
}

function StatCard({ icon: Icon, label, value, trend }: { icon: any; label: string; value: string | number; trend?: string }) {
  return (
    <div className="group relative p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/20 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--color-primary)]/5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5 text-[var(--color-accent)]" />
        </div>
        {trend && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] font-medium flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5">{label}</div>
    </div>
  );
}

function CompanyAnalytics({ analytics }: { analytics: Analytics | null }) {
  if (!analytics) {
    return (
      <div className="p-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-center max-w-lg mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-primary)]/10 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-[var(--color-muted-foreground)]" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
          Start chatting with customers to see analytics here.
        </p>
        <a href="/dashboard/agent" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] text-white hover:opacity-90 transition-all">
          <MessageSquare className="w-4 h-4" />
          Go to Agent Panel
        </a>
      </div>
    );
  }

  const a = analytics;
  const maxDailyToken = Math.max(...a.tokens.daily.map((d) => d.tokens), 1);
  const tokenPercent = a.company.tokenLimit > 0 ? Math.round((a.company.tokensUsed / a.company.tokenLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Total Conversations" value={a.conversations.total} />
        <StatCard icon={Activity} label="Active Now" value={a.conversations.active} />
        <StatCard icon={Users} label="Handoff Active" value={a.conversations.handoff} />
        <StatCard icon={Bot} label="Messages Sent" value={a.messages} trend="+12%" />
      </div>

      {/* Token usage + mini stats */}
      <div className="grid md:grid-cols-5 gap-4">
        {/* Token Usage Chart */}
        <div className="md:col-span-3 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-primary)]/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[var(--color-accent)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Token Usage</h3>
                <p className="text-[10px] text-[var(--color-muted-foreground)]">Last 7 days</p>
              </div>
            </div>
            {/* Token progress */}
            {a.company.tokenLimit > 0 && (
              <div className="text-right">
                <div className="text-xs font-medium">{tokenPercent}% used</div>
                <div className="w-20 h-1.5 rounded-full bg-[var(--color-muted)] mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(tokenPercent, 100)}%`,
                      background: tokenPercent > 80
                        ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                        : "linear-gradient(90deg, var(--color-accent), var(--color-primary))",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {a.tokens.daily.length > 0 ? (
            <div className="flex items-end gap-1.5 h-32">
              {a.tokens.daily.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-100 cursor-pointer relative"
                    style={{
                      height: `${Math.max((d.tokens / maxDailyToken) * 100, 4)}%`,
                      background: "linear-gradient(180deg, var(--color-accent), var(--color-primary))",
                      opacity: i === a.tokens.daily.length - 1 ? 1 : 0.6,
                    }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-medium text-[var(--color-muted-foreground)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.tokens.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[8px] text-[var(--color-muted-foreground)]">{d.date.slice(-2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-xs text-[var(--color-muted-foreground)]">
              No token data yet
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex justify-between text-xs text-[var(--color-muted-foreground)]">
            <span>Total: <span className="font-semibold text-[var(--color-foreground)]">{a.tokens.total.toLocaleString()}</span> tokens</span>
            {a.company.tokenLimit > 0 && (
              <span>Limit: <span className="font-semibold text-[var(--color-foreground)]">{a.company.tokenLimit.toLocaleString()}</span></span>
            )}
          </div>
        </div>

        {/* Side stats */}
        <div className="md:col-span-2 space-y-4">
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-between hover:border-[var(--color-primary)]/20 transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-xl font-bold">{a.knowledge.entries}</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Knowledge Sources</div>
                <div className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">{a.knowledge.chunks} total chunks</div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-between hover:border-[var(--color-primary)]/20 transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xl font-bold">{a.conversations.recent7Days}</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Last 7 Days</div>
                <div className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">new conversations</div>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-amber-400/50" />
          </div>

          {/* Quick actions */}
          <div className="flex gap-2.5 flex-wrap pt-1">
            <a
              href="/dashboard/company"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-gradient-to-r from-[var(--color-accent)]/10 to-[var(--color-primary)]/10 text-[var(--color-accent)] hover:from-[var(--color-accent)]/20 hover:to-[var(--color-primary)]/20 transition-all border border-[var(--color-border)]"
            >
              <Settings className="w-3.5 h-3.5" />
              Bot Settings
              <ArrowRight className="w-3 h-3" />
            </a>
            <a
              href="/dashboard/agent"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all border border-[var(--color-border)]"
            >
              <Users className="w-3.5 h-3.5" />
              Agent Panel
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminSection() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/companies")
      .then((r) => r.json())
      .then((data) => setCompanies(data.companies || []))
      .finally(() => setLoading(false));
  }, []);

  const totalTokens = companies.reduce((sum: number, c: any) => sum + (c.tokensUsed || 0), 0);
  const activeCount = companies.filter((c: any) => c.active).length;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[2.5px] border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[var(--color-muted-foreground)]">Loading companies...</span>
      </div>
    </div>
  );

  return (
    <div>
      {/* Admin Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: "Total Companies", value: companies.length },
          { icon: Activity, label: "Active", value: activeCount, trend: `${((activeCount / Math.max(companies.length, 1)) * 100).toFixed(0)}%` },
          { icon: Bot, label: "Inactive", value: companies.length - activeCount },
          { icon: Zap, label: "Total Tokens Used", value: totalTokens.toLocaleString() },
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/20 transition-all">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-primary)]/10 flex items-center justify-center mb-3">
              <stat.icon className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div className="text-2xl font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div>
            <div className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Companies Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-sm font-semibold">All Companies</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
            {companies.length} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left">
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Company</th>
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Plan</th>
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Tokens</th>
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Status</th>
                <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c: any) => {
                const tokenPct = c.tokenLimit > 0 ? Math.round((c.tokensUsed / c.tokenLimit) * 100) : 0;
                return (
                  <tr key={c.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-muted)]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-accent)]">
                          {c.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-[10px] text-[var(--color-muted-foreground)]">{c.id?.slice(0, 12)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-accent)]/5 text-[var(--color-accent)] capitalize border border-[var(--color-accent)]/10">
                        {c.plan || "Free"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(tokenPct, 100)}%`,
                              background: tokenPct > 80
                                ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                                : "linear-gradient(90deg, var(--color-accent), var(--color-primary))",
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--color-muted-foreground)]">
                          {(c.tokensUsed || 0).toLocaleString()}/{(c.tokenLimit || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        c.active
                          ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                          c.active ? "bg-[var(--color-success)]" : "bg-red-400"
                        }`} />
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-[11px] px-3 py-1.5 rounded-lg font-medium bg-gradient-to-r from-[var(--color-accent)]/10 to-[var(--color-primary)]/10 text-[var(--color-accent)] hover:from-[var(--color-accent)]/20 hover:to-[var(--color-primary)]/20 transition-all border border-[var(--color-border)]">
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-muted)] flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-[var(--color-muted-foreground)]" />
                    </div>
                    <p className="text-sm text-[var(--color-muted-foreground)]">No companies registered yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
