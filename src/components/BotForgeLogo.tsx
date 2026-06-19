export default function BotForgeLogo({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: "drop-shadow(0 0 8px rgba(8,145,178,0.3))" }}
    >
      <defs>
        <linearGradient id="bf-mark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="bf-mark-sub" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0891B2" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {/* === Hexagon base (the forge / anvil) === */}
      <path
        d="M50 4 L86 26 L86 74 L50 96 L14 74 L14 26 Z"
        fill="url(#bf-mark)"
        opacity="0.12"
        stroke="url(#bf-mark)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* === Chat bubble notch (handoff / conversation) === */}
      <path
        d="M50 68 C35 68 24 58 24 46 C24 34 35 24 50 24 C65 24 76 34 76 46 C76 54 70 61 60 64 L54 68 L58 61 C64 59 68 54 68 48 Z"
        fill="url(#bf-mark-sub)"
        opacity="0.15"
      />

      {/* === Bolt / Spark (AI energy through the mark) === */}
      <path
        d="M56 30 L44 48 L52 48 L44 70"
        stroke="url(#bf-mark)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* === Highlight dot (AI spark) === */}
      <circle
        cx="56"
        cy="30"
        r="3.5"
        fill="url(#bf-mark)"
      />

      {/* === Outer ring accent === */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="url(#bf-mark)"
        strokeWidth="1"
        opacity="0.25"
      />
    </svg>
  );
}
