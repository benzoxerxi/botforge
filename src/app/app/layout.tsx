"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import BotForgeLogo from "@/components/BotForgeLogo";
import { useTheme } from "@/components/ThemeProvider";

const STORAGE_KEY = "bf_agent_status";

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const statusColors: Record<string, { dot: string; label: string; bg: string }> = {
  idle: { dot: "bg-emerald-400", label: "Idle", bg: "bg-emerald-500/10 border-emerald-500/15" },
  busy: { dot: "bg-amber-400", label: "Busy", bg: "bg-amber-500/10 border-amber-500/15" },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAgentPage = pathname === "/app/agent";

  const { theme, toggle: toggleTheme } = useTheme();
  const [agentStatus, setAgentStatus] = useState<string>("idle");
  const [stats, setStats] = useState({ awaiting: 0, active: 0, closed: 0 });

  // Load status from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "busy" || saved === "idle") {
      setAgentStatus(saved);
    }
  }, []);

  // Save status to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, agentStatus);
    // Dispatch custom event so agent page picks it up
    window.dispatchEvent(new CustomEvent("agent-status-change", { detail: agentStatus }));
  }, [agentStatus]);

  // Poll stats when on agent page
  useEffect(() => {
    if (!isAgentPage || !session?.user?.companyId) return;
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/handoff?companyId=${session.user.companyId}&filter=all`);
        const data = await res.json();
        const convs = data.conversations || [];
        const userId = session.user.id;
        setStats({
          awaiting: convs.filter((c: any) =>
            c.status === "handoff_requested" && (!c.assignedAgentId || c.assignedAgentId !== userId)
          ).length,
          active: convs.filter((c: any) =>
            c.status === "handoff_active" && c.agentChats?.some((ac: any) => ac.agent?.id === userId)
          ).length,
          closed: convs.filter((c: any) => c.status === "closed").length,
        });
      } catch {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [isAgentPage, session]);

  // Allow agents AND company_admins to access the support panel
  const canAccess = status === "authenticated" && session?.user?.role && 
    (session.user.role === "agent" || session.user.role === "company_admin");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && !canAccess) {
      router.push("/dashboard");
    }
  }, [status, router, session, canAccess]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070a14]">
        <div className="w-5 h-5 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!canAccess) return null;

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      {/* === HEADER === */}
      <header className="flex-shrink-0 sticky top-0 z-20 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-card)]/90 to-[var(--color-background)]/95 backdrop-blur-2xl">
        <div className="px-5 h-12 flex items-center justify-between">
          {/* Left: logo + branding */}
          <div className="flex items-center gap-3">
            <BotForgeLogo size={16} />
            <div className="flex items-baseline gap-0.5">
              <span className="text-[10px] font-bold tracking-tight" style={{color:"var(--color-foreground)"}}>Bot</span>
              <span className="text-[10px] font-bold tracking-tight text-[#00f0ff]">Forge</span>
            </div>
            <span className="text-[11px] font-medium text-[var(--color-muted-foreground)] tracking-wide border-l border-[var(--color-border)] pl-3">
              Support Panel
            </span>
          </div>

          {/* Right: busy toggle + user + sign out */}
          <div className="flex items-center gap-3">
            {isAgentPage && (
              <>
                {/* Busy toggle — idle by default, lights up amber when busy */}
                <button
                  onClick={() => setAgentStatus(agentStatus === "busy" ? "idle" : "busy")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-medium tracking-wide uppercase transition-all duration-300 border",
                    agentStatus === "busy"
                      ? "bg-amber-500/15 border-amber-500/25 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15),inset_0_0_0_1px_rgba(251,191,36,0.2)]"
                      : "bg-[var(--color-muted)] border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  )}
                  title={agentStatus === "busy" ? "On — new chats blocked" : "Off — accepting new chats"}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    agentStatus === "busy"
                      ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                      : "bg-gray-500"
                  )} />
                  <span className="ml-1 tracking-wider">Busy</span>
                </button>
                <span className="w-px h-5 bg-[var(--color-border)]" />
              </>
            )}

            {/* Light/Dark toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-[var(--color-accent)]/40 transition-all"
              title={theme === "light" ? "Dark mode" : "Light mode"}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75 absolute pointer-events-none'}`}>
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-75 absolute pointer-events-none'}`}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <span className="text-[9px]">{theme === 'light' ? 'Light' : 'Dark'}</span>
            </button>

            <span className="text-xs text-[var(--color-muted-foreground)]">{session?.user?.name || session?.user?.email}</span>
            <button
              onClick={() => signOut()}
              className="text-[10px] font-medium px-2.5 py-1 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-red-400 hover:border-red-500/25 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</main>
    </div>
  );
}
