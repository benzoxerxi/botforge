"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BotForgeLogo from "@/components/BotForgeLogo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Allow agents AND company_admins to access the support panel
  const canAccess = status === "authenticated" && session?.user?.role && 
    (session.user.role === "agent" || session.user.role === "company_admin");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && !canAccess) {
      // Non-agents go to dashboard
      router.push("/dashboard");
    }
  }, [status, router, session, canAccess]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!canAccess) return null;

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      {/* Minimal header */}
      <header className="sticky top-0 z-20 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-[var(--color-border)] px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <BotForgeLogo size={16} />
            <div className="flex items-baseline gap-0.5">
              <span className="text-[10px] font-bold tracking-tight" style={{color:"var(--color-foreground)"}}>Bot</span>
              <span className="text-[10px] font-bold tracking-tight gradient-text">Forge</span>
            </div>
          </div>
          <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Support Panel</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-muted-foreground)]">{session.user.name || session.user.email}</span>
          <button
            onClick={() => signOut()}
            className="text-xs px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
