"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const params = useParams();
  const token = params.token as string;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset/confirm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Reset failed");
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
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold mb-2">Password Reset!</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
            Your password has been reset successfully.
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all glow-teal"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
        style={{ background: "radial-gradient(circle, var(--color-accent), transparent)" }}
      />

      <div className="relative z-10 w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold">Set New Password</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm text-red-400 bg-red-500/10 border border-red-500/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5 text-themed/70">New Password</label>
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

          <div>
            <label className="block text-sm font-medium mb-1.5 text-themed/70">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-themed placeholder-[var(--color-muted-foreground)] focus:outline-none focus:border-[var(--color-accent)] transition-all"
              placeholder="Repeat password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all disabled:opacity-50 glow-teal"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/login" className="text-xs text-[var(--color-accent)] hover:underline">
            ← Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
