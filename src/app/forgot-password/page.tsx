"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
        style={{ background: "radial-gradient(circle, var(--color-accent), transparent)" }}
      />

      <div className="relative z-10 w-full max-w-sm mx-auto px-6">
        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📧</div>
            <h1 className="text-xl font-bold mb-2">Check Your Email</h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
              If an account exists with that email, we&apos;ve sent a password reset link.
              Check your inbox (and spam folder).
            </p>
            <a
              href="/login"
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              ← Back to sign in
            </a>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-xl font-bold">Reset Password</h1>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Enter your email and we&apos;ll send you a reset link
              </p>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all disabled:opacity-50 glow-teal"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="/login" className="text-xs text-[var(--color-accent)] hover:underline">
                ← Back to sign in
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
