"use client";

import { useSession, signOut } from "next-auth/react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Settings,
  Users,
  Bot,
  Bot as BotIcon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  MessageSquare,
  BarChart3,
  Activity,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/company", label: "Bot Settings", icon: Settings },
  { href: "/dashboard/history", label: "Chat History", icon: MessageSquare },
  { href: "/dashboard/agents", label: "Agents", icon: Users },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [widgetMessages, setWidgetMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [widgetInput, setWidgetInput] = useState("");
  const [widgetSending, setWidgetSending] = useState(false);
  const [widgetConversationId, setWidgetConversationId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000000]">
        <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const isSuperAdmin = session.user.role === "super_admin";

  const isActiveNav = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname?.startsWith(href) ?? false;
  };

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

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#000000] text-white">
        {/* ── NEW Top Navigation ── */}
        <nav className="sticky top-0 z-50 bg-[#000000]/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Left: Logo + Mobile menu */}
              <div className="flex items-center gap-2">
                {/* Mobile hamburger */}
                <button
                  className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 transition-all text-white/50"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </button>

                <a href="/dashboard" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <BotIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold tracking-tight">BotForge</span>
                  <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10 ml-1">
                    {isSuperAdmin ? "Admin" : "Dashboard"}
                  </span>
                </a>
              </div>

              {/* Center: Nav items */}
              <div className="hidden md:flex items-center gap-0.5">
                {NAV_ITEMS.map((item) => {
                  const active = isActiveNav(item.href);
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        active
                          ? "bg-white text-black shadow-lg"
                          : "text-white/50 hover:text-white/80 hover:bg-white/5"
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>

              {/* Right: User info + theme toggle + logout */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => signOut()}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center border border-white/10">
                  <span className="text-xs font-bold text-white/70">
                    {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* ── Mobile Nav Drawer ── */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-64 z-50 bg-[#0a0a0a] border-r border-white/5 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <a href="/dashboard" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <BotIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold">BotForge</span>
                </a>
                <button
                  className="p-1.5 rounded-lg hover:bg-white/5 text-white/50"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const active = isActiveNav(item.href);
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? "bg-white/10 text-white border border-white/10"
                          : "text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                      {active && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                    </a>
                  );
                })}
              </nav>

              <button
                onClick={() => { setSidebarOpen(false); signOut(); }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </>
        )}

        {/* ── Main Content ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>

        {/* ── Floating Widget ── */}
        {!isSuperAdmin && widgetConfig && (
          <>
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

            {chatOpen && (
              <div className="fixed bottom-24 right-5 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden border"
                style={{ backgroundColor: widgetConfig.bgColor, borderColor: "rgba(255,255,255,0.1)" }}>
                <div className="p-3.5 flex items-center gap-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: widgetConfig.accent }}>
                    {widgetConfig.companyName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: widgetConfig.textColor }}>{widgetConfig.name}</div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-[10px]" style={{ color: widgetConfig.textColor + "88" }}>Online</span>
                    </div>
                  </div>
                </div>
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
    </ErrorBoundary>
  );
}
