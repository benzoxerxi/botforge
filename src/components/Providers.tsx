"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import GlobalErrorHandler from "@/components/GlobalErrorHandler";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <GlobalErrorHandler />
      <ErrorBoundary>{children}</ErrorBoundary>
    </SessionProvider>
  );
}
