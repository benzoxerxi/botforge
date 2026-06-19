"use client";

import React from "react";
import Link from "next/link";

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error.message, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const errMsg = this.state.error?.message || "Unknown error";
      const errStack = this.state.error?.stack || "";
      
      // Scroll to top so user sees the error
      if (typeof window !== "undefined") {
        window.scrollTo(0, 0);
      }

      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ backgroundColor: "var(--background, #f8fafc)" }}
        >
          <div
            className="max-w-md w-full p-6 rounded-xl"
            style={{
              backgroundColor: "var(--botforge-card, #fff)",
              border: "1px solid var(--botforge-border, #e2e8f0)",
            }}
          >
            <div className="text-center mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-lg font-bold mb-2 text-center" style={{ color: "#ef4444" }}>
              Page Error
            </h2>
            <p className="text-sm mb-4 text-center" style={{ color: "var(--color-muted-foreground)" }}>
              Something went wrong while loading this page
            </p>

            <details className="mb-4">
              <summary className="text-xs cursor-pointer" style={{ color: "var(--color-muted-foreground)" }}>
                Error details
              </summary>
              <pre
                className="text-xs mt-2 p-2 rounded-lg overflow-auto"
                style={{
                  backgroundColor: "rgba(239,68,68,0.1)",
                  color: "#dc2626",
                  border: "1px solid rgba(239,68,68,0.2)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: "200px",
                }}
              >
                {errMsg}
                {"\n\n"}
                {errStack}
              </pre>
            </details>

            <div className="flex gap-2 justify-center">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: "var(--botforge-teal, #0891b2)" }}
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
              >
                🏠 Back to Dashboard
              </Link>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: "var(--botforge-card, #fff)",
                  border: "1px solid var(--botforge-border, #e2e8f0)",
                  color: "var(--foreground, #000)",
                }}
              >
                🔄 Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
