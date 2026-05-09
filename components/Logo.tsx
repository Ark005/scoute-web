"use client";

type Props = {
  size?: number;
  animated?: boolean;
  wordmark?: boolean;
  variant?: "light" | "dark";
  className?: string;
};

export default function Logo({
  size = 32,
  animated = true,
  wordmark = true,
  variant = "light",
  className,
}: Props) {
  const text = variant === "light" ? "#FFFFFF" : "#111827";
  const blue = "#1B4DFF";
  const orange = "#FF6B1B";

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: 8, lineHeight: 1 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="scouteCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={blue} stopOpacity="1" />
            <stop offset="100%" stopColor={blue} stopOpacity="0.85" />
          </radialGradient>
          <filter id="scouteGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Орбита: наклонный эллипс — путь маршрута */}
        <g transform="rotate(-22 32 32)">
          <ellipse
            cx="32"
            cy="32"
            rx="28"
            ry="11"
            stroke={blue}
            strokeOpacity="0.55"
            strokeWidth="1.6"
            fill="none"
          />
          {/* Электрон-POI бежит по орбите */}
          <circle r="3.2" fill={orange} filter="url(#scouteGlow)">
            {animated ? (
              <animateMotion
                dur="6s"
                repeatCount="indefinite"
                path="M 60 32 A 28 11 0 1 1 4 32 A 28 11 0 1 1 60 32 Z"
                rotate="auto"
              />
            ) : (
              <animateMotion path="M 60 32" />
            )}
          </circle>
        </g>

        {/* Ядро — стилизованная «e» */}
        <g>
          <circle cx="32" cy="32" r="11" fill="url(#scouteCore)" />
          <text
            x="32"
            y="38.5"
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto"
            fontWeight="800"
            fontSize="16"
            fill="#FFFFFF"
            letterSpacing="-0.5"
          >
            e
          </text>
        </g>
      </svg>

      {wordmark && (
        <span
          style={{
            color: text,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            fontSize: Math.round(size * 0.62),
          }}
        >
          scout
          <span style={{ color: blue }}>e</span>
        </span>
      )}
    </span>
  );
}
