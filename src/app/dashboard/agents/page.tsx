"use client";
export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  Users,
  Mail,
  UserPlus,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  MoreHorizontal,
  ChevronDown,
  Loader2,
  LogOut,
} from "lucide-react";

interface Agent {
  id: string;
  name: string | null;
  email: string;
  active: boolean;
  createdAt: string;
}

export default function AgentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [status, router]);

  const fetchAgents = useCallback(async () => {
    if (!session?.user?.companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/company/agents?companyId=${session.user.companyId}`);
      const data = await res.json();
      setAgents(data.agents || []);
    } catch {}
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (session?.user?.companyId) {
      fetchAgents();
    }
  }, [fetchAgents, session?.user?.companyId]);

  const toggleActive = async (agentId: string, active: boolean) => {
    try {
      await fetch("/api/company/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, active: !active }),
      });
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, active: !a.active } : a))
      );
    } catch {}
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try {
      await fetch(`/api/company/agents?agentId=${agentId}`, { method: "DELETE" });
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
    } catch {}
  };

  const createAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!email || !password) {
      setCreateError("Email and password are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/company/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create agent");
      } else {
        setAgents((prev) => [data.agent, ...prev]);
        setShowCreate(false);
        setName("");
        setEmail("");
        setPassword("");
      }
    } catch {
      setCreateError("Network error");
    }
    setCreating(false);
  };

  const filtered = agents.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.name || "").toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  if (status !== "authenticated") return null;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-white/5 text-violet-400 bg-violet-500/10">
              <Users className="w-3 h-3" />
              Agent Management
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Agents</h1>
            <p className="text-xs text-white/40 mt-0.5">
              {agents.length} {agents.length === 1 ? "agent" : "agents"} on your team
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAgents}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-violet-500 text-white hover:bg-violet-500/90 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Agent
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name or email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/[0.02] border border-white/5 text-white placeholder-white/40 focus:outline-none focus:border-violet-400/50 transition-all"
          />
        </div>

        {/* Agent List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-white/40" />
              </div>
              <p className="text-sm text-white/40">
                {search.trim() ? "No agents match your search" : "No agents yet"}
              </p>
              {!search.trim() && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-violet-500 text-white hover:bg-violet-500/90 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add your first agent
                </button>
              )}
            </div>
          ) : (
            filtered.map((agent) => (
              <div
                key={agent.id}
                className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-violet-400/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-violet-400">
                        {(agent.name?.[0] || agent.email[0]).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {agent.name || "Unnamed"}
                        </span>
                        {agent.active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border-green-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border-slate-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-white/40">
                          <Mail className="w-3 h-3" />
                          {agent.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(agent.id, agent.active)}
                      className={`p-2 rounded-lg transition-all ${
                        agent.active
                          ? "text-amber-400 hover:bg-amber-500/10"
                          : "text-green-400 hover:bg-green-500/10"
                      }`}
                      title={agent.active ? "Deactivate" : "Activate"}
                    >
                      {agent.active ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete agent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Agent Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md p-6 rounded-2xl border border-white/5 bg-white/[0.02] shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Add New Agent</h3>
              {createError && (
                <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {createError}
                </div>
              )}
              <form onSubmit={createAgent} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                    Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Agent name"
                    className="w-full px-3 py-2 rounded-xl text-sm bg-black border border-white/5 text-white placeholder-white/40 focus:outline-none focus:border-violet-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                    Email *
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent@company.com"
                    type="email"
                    required
                    className="w-full px-3 py-2 rounded-xl text-sm bg-black border border-white/5 text-white placeholder-white/40 focus:outline-none focus:border-violet-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                    Password *
                  </label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Secure password"
                    type="password"
                    required
                    className="w-full px-3 py-2 rounded-xl text-sm bg-black border border-white/5 text-white placeholder-white/40 focus:outline-none focus:border-violet-400/50 transition-all"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowCreate(false); setCreateError(""); }}
                    className="rounded-full text-xs font-medium bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 px-4 py-2 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-violet-500 text-white hover:bg-violet-500/90 disabled:opacity-50 transition-all"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        Create Agent
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
