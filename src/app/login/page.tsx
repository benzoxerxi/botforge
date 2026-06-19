"use client";

import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BotForgeLogo from "@/components/BotForgeLogo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    // Get session to check role
    try {
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      if (sessionData?.user?.role === "agent") {
        router.push("/app/agent");
      } else {
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
        style={{ background: "radial-gradient(circle, var(--color-accent), transparent)" }}
      />

      <div className="relative z-10 w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2.5">
              <BotForgeLogo size={32} />
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-bold tracking-tight" style={{color:"var(--color-foreground)"}}>Bot</span>
                <span className="text-lg font-bold tracking-tight gradient-text">Forge</span>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm text-red-400 bg-red-500/10 border border-red-500/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5 text-themed/70">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-themed placeholder-[var(--color-muted-foreground)] focus:outline-none focus:border-[var(--color-accent)] transition-all"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-themed/70">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-themed placeholder-[var(--color-muted-foreground)] focus:outline-none focus:border-[var(--color-accent)] transition-all"
              placeholder="••••••••"
              required
            />
            <div className="mt-1.5 text-right">
              <a href="/forgot-password" className="text-xs text-[var(--color-accent)] hover:underline">
                Forgot password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all disabled:opacity-50 glow-teal"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            BotForge — AI Chatbot Platform
          </p>
          <a
            href="/register"
            className="block text-xs text-[var(--color-accent)] hover:underline mt-3"
          >
            Don&apos;t have an account? Create one
          </a>
          <a
            href="/"
            className="inline-block text-xs text-[var(--color-muted-foreground)] hover:text-themed/70 mt-2"
          >
            ← Back to main site
          </a>
        </div>
      </div>
    </div>
  );
}
