"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const errorMessages: Record<string, { title: string; message: string }> = {
  "missing-token": {
    title: "Invalid Link",
    message: "This verification link is missing the verification code. Please check the link you clicked.",
  },
  "invalid-token": {
    title: "Link Not Found",
    message: "This verification link wasn't found in our system. It may be old or mistyped.",
  },
  "already-used": {
    title: "Already Verified",
    message: "This email has already been verified. You're all set — go ahead and sign in!",
  },
  "expired": {
    title: "Link Expired",
    message: "This verification link has expired (valid for 24 hours). Sign in to request a new one.",
  },
  "server-error": {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again or contact support.",
  },
};

function VerifyEmailErrorContent() {
  const params = useSearchParams();
  const reason = params.get("reason") || "unknown";
  const info = errorMessages[reason] || {
    title: "Verification Failed",
    message: "Something went wrong during email verification.",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]"
        style={{ background: "radial-gradient(circle, #ef4444, transparent)" }}
      />

      <div className="relative z-10 w-full max-w-sm mx-auto px-6 text-center">
        {reason === "already-used" ? (
          <div className="text-6xl mb-6">✅</div>
        ) : (
          <div className="text-6xl mb-6">😬</div>
        )}
        <h1 className="text-2xl font-bold mb-3">
          {info.title}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-8 leading-relaxed">
          {info.message}
        </p>
        <Link
          href="/login"
          className="inline-block px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all glow-teal"
        >
          Go to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]"><p className="text-sm text-[var(--color-muted-foreground)]">Loading...</p></div>}>
      <VerifyEmailErrorContent />
    </Suspense>
  );
}
