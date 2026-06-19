"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/company/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, email, name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="relative z-10 w-full max-w-sm mx-auto px-6 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-xl font-bold mb-2">Company Created!</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
            Your company account has been set up. You can now sign in with your credentials.
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all glow-teal"
          >
            Sign In
          </a>
          <div className="mt-4 text-xs text-[var(--color-muted-foreground)]">
            Your AI bot and chat widget are ready to configure in the dashboard.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]"
        style={{ background: "radial-gradient(circle, var(--color-accent), transparent)" }}
      />

      <div className="relative z-10 w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Create Your Company</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Set up your AI chatbot in minutes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm text-red-400 bg-red-500/10 border border-red-500/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5 text-themed/70">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-themed placeholder-[var(--color-muted-foreground)] focus:outline-none focus:border-[var(--color-accent)] transition-all"
              placeholder="Your Company Ltd."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-themed/70">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-themed placeholder-[var(--color-muted-foreground)] focus:outline-none focus:border-[var(--color-accent)] transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-themed/70">Work Email</label>
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
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all disabled:opacity-50 glow-teal"
          >
            {loading ? "Creating..." : "🚀 Create Company"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Already have an account?{" "}
            <a href="/login" className="text-[var(--color-accent)] hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
