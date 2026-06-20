// Widget-specific layout — dark fullscreen bg from SSR, no JS dependency
// Prevents white/purple flash before React hydrates the page
export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#08051a",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
