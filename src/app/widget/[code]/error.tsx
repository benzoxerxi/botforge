"use client";

export default function WidgetError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Show a minimal error — this runs inside the widget iframe
  // Don't link to Dashboard, just let the user reload the widget
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: "24px",
        backgroundColor: "#08051a",
        color: "#ffffff",
        fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
        textAlign: "center",
        gap: "16px",
      }}
    >
      <div style={{ fontSize: "28px", lineHeight: 1 }}>😥</div>
      <div style={{ fontSize: "14px", fontWeight: 600 }}>Something went wrong</div>
      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", maxWidth: "260px" }}>
        {error?.message || "The widget encountered an error while loading."}
      </div>
      <button
        onClick={reset}
        style={{
          marginTop: "8px",
          padding: "10px 24px",
          borderRadius: "12px",
          fontSize: "13px",
          fontWeight: 600,
          color: "#fff",
          backgroundColor: "#7c3aed",
          border: "none",
          cursor: "pointer",
        }}
      >
        Reload widget
      </button>
    </div>
  );
}
