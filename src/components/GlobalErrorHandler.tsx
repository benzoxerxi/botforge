"use client";

import { useEffect } from "react";

export default function GlobalErrorHandler() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      console.error("GLOBAL ERROR:", event.error?.message || event.message);
    };
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error("GLOBAL REJECTION:", event.reason);
    };
    window.addEventListener("error", handler);
    window.addEventListener("unhandledrejection", rejectionHandler);
    return () => {
      window.removeEventListener("error", handler);
      window.removeEventListener("unhandledrejection", rejectionHandler);
    };
  }, []);

  return null;
}
