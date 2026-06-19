"use client";

import { useSession, signOut } from "next-auth/react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BotForgeLogo from "@/components/BotForgeLogo";
import { useTheme } from "@/components/ThemeProvider";
import {
  LayoutDashboard,
  Settings,
  Users,
  Bot,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  ChevronRight,
  Gauge,
  MessageSquare,
  BarChart3,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── ALL hooks must be at the top, before any early return ──
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();
  const [widgetConfig, setWidgetConfig] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [widgetMessages, setWidgetMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [widgetInput, setWidgetInput] = useState("");
  const [widgetSending, setWidgetSending] = useState(false);
  const [widgetConversationId, setWidgetConversationId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Effects ──
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user && session.user.role !== "super_admin" && session?.user?.companyId) {
      fetch(`/api/company/bot?companyId=${session.user.companyId}`)
        .then(r => r.json())
        .then(data => {
          if (data.company) {
            setWidgetConfig({
              companyId: data.company.id,
              botId: data.company.bots?.[0]?.id,
              name: data.company.bots?.[0]?.name || "Support",
              accent: data.company.chatWidgets?.[0]?.primaryColor || "#00f0ff",
              bgColor: data.company.chatWidgets?.[0]?.backgroundColor || "#0a0e1a",
              textColor: data.company.chatWidgets?.[0]?.textColor || "#ffffff",
              greeting: data.company.chatWidgets?.[0]?.greetingMessage || "Hi! How can I help you today?",
              companyName: data.company.name || "Bot",
            });
          }
        })
        .catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [widgetMessages]);

  // ── Loading / unauthenticated states ──
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  // ── Derived values ──
  const isSuperAdmin = session.user.role === "super_admin";
  const isCompanyUser = session.user.role === "company_admin" || session.user.role === "agent";
  const userRole = session.user.role;

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["super_admin", "company_admin", "agent"] },
    { href: "/dashboard/admin", label: "Admin", icon: Gauge, roles: ["super_admin"] },
    { href: "/dashboard/agent", label: "Agent Panel", icon: Users, roles: ["super_admin", "company_admin", "agent"] },
    { href: "/dashboard/company", label: "Bot Settings", icon: Bot, roles: ["super_admin", "company_admin"] },
    { href: "/dashboard/history", label: "Chat History", icon: MessageSquare, roles: ["super_admin", "company_admin", "agent"] },
    { href: "/dashboard/agents", label: "Agents", icon: Users, roles: ["super_admin", "company_admin"] },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, roles: ["super_admin", "company_admin"] },
  ];

  // ── Handlers ──
  const sendWidgetMessage = async () => {
    if (!widgetInput.trim() || !widgetConfig || widgetSending) return;
    const msg = widgetInput.trim();
    setWidgetInput("");
    setWidgetMessages(prev => [...prev, { role: "user", content: msg }]);
    setWidgetSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: widgetConfig.companyId,
          botId: widgetConfig.botId,
          message: msg,
          conversationId: widgetConversationId,
          channel: "widget",
        }),
      });
      const data = await res.json();
      setWidgetMessages(prev => [...prev, { role: "assistant", content: data.reply || "No response" }]);
      if (data.conversationId) setWidgetConversationId(data.conversationId);
    } catch {
      setWidgetMessages(prev => [...prev, { role: "assistant", content: "Something went wrong." }]);
    }
    setWidgetSending(false);
  };

  const openWidgetChat = () => {
    if (!chatOpen && widgetConfig) {
      setWidgetMessages([{ role: "assistant", content: widgetConfig.greeting }]);
    }
    setChatOpen(!chatOpen);
  };

  // ── Render ──
  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-[var(--color-background)] flex">
      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[var(--color-card)]/95 backdrop-blur-xl border-r border-[var(--color-border)] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-[var(--color-border)]">
              <a href="/dashboard" className="flex items-center gap-2.5 group">
            <BotForgeLogo size={22} />
            <div className="flex items-baseline gap-px">
              <span className="text-sm font-bold tracking-tight" style={{color:"var(--color-foreground)"}}>Bot</span>
              <span className="text-sm font-bold tracking-tight gradient-text">Forge</span>
            </div>
          </a>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems
            .filter(item => item.roles.includes(userRole))
            .map(item => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-[var(--color-accent)]/10 to-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-accent)]"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/50 border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                </a>
              );
            })}
        </nav>
        <div className="p-3 border-t border-[var(--color-border)]">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-[var(--color-border)] px-6 h-14 flex items-center justify-between">
          <button
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--color-muted)]/50 transition-all text-[var(--color-muted-foreground)]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--color-muted)]/50 transition-all text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              title={theme === "light" ? "Dark mode" : "Light mode"}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
            <span className="text-xs text-[var(--color-muted-foreground)] hidden sm:block">{session.user.name || session.user.email}</span>
            {isSuperAdmin && (
              <span className="text-[9px] px-2 py-0.5 rounded-full uppercase font-semibold tracking-wider border border-[var(--color-accent)]/20 text-[var(--color-accent)] bg-[var(--color-accent)]/5">
                Admin
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 p-5 md:p-6 lg:p-8">{children}</main>

        {/* Floating widget button - always visible for company users */}
        {!isSuperAdmin && widgetConfig && (
          <>
            {/* FAB button */}
            <button
              onClick={openWidgetChat}
              className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${widgetConfig.accent}, #8b5cf6)` }}
            >
              {chatOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              )}
            </button>

            {/* Chat overlay - exactly matches widget design */}
            {chatOpen && (
              <div className="fixed bottom-24 right-5 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden border"
                style={{ backgroundColor: widgetConfig.bgColor, borderColor: "rgba(255,255,255,0.1)" }}>
                {/* Header */}
                <div className="p-3.5 flex items-center gap-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: widgetConfig.accent }}>
                    {widgetConfig.companyName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: widgetConfig.textColor }}>
                      {widgetConfig.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-[10px]" style={{ color: widgetConfig.textColor + "88" }}>Online</span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="h-72 overflow-y-auto p-3.5 space-y-2.5" style={{ backgroundColor: widgetConfig.bgColor }}>
                  {widgetMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm border"}`}
                        style={{
                          backgroundColor: msg.role === "user" ? widgetConfig.accent : widgetConfig.bgColor + "bb",
                          color: msg.role === "user" ? "#fff" : widgetConfig.textColor,
                          border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.1)",
                        }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {widgetSending && (
                    <div className="flex justify-start">
                      <div className="px-3 py-2 rounded-xl rounded-bl-sm border"
                        style={{ backgroundColor: widgetConfig.bgColor + "bb", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full opacity-60 animate-bounce" style={{ backgroundColor: widgetConfig.accent }} />
                          <div className="w-2 h-2 rounded-full opacity-60 animate-bounce" style={{ backgroundColor: widgetConfig.accent, animationDelay: "0.15s" }} />
                          <div className="w-2 h-2 rounded-full opacity-60 animate-bounce" style={{ backgroundColor: widgetConfig.accent, animationDelay: "0.3s" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <input
                    value={widgetInput}
                    onChange={e => setWidgetInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendWidgetMessage(); } }}
                    placeholder="Type a message..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none"
                    style={{ backgroundColor: widgetConfig.bgColor + "dd", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                  <button
                    onClick={sendWidgetMessage}
                    disabled={widgetSending || !widgetInput.trim()}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all disabled:opacity-50"
                    style={{ backgroundColor: widgetConfig.accent }}
                  >
                    {widgetSending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}
