"use client";

import Link from "next/link";

export default function VerifyEmailSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]"
        style={{ background: "radial-gradient(circle, #22c55e, transparent)" }}
      />

      <div className="relative z-10 w-full max-w-sm mx-auto px-6 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-2xl font-bold mb-3">
          Email Verified!
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-8 leading-relaxed">
          Your account is fully activated. Your AI chatbot is ready to go — 
          head to the dashboard to customize, add knowledge, and deploy.
        </p>
        <Link
          href="/login"
          className="inline-block px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all glow-teal"
        >
          🔥 Sign In
        </Link>
        <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">
          Welcome aboard. Let&apos;s build something awesome. 🚀
        </p>
      </div>
    </div>
  );
}
