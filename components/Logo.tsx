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
  const textColor = variant === "light" ? "#FFFFFF" : "#0B0F1A";
  const blue = "#1B4DFF";
  const orange = "#FF6B1B";

  if (!wordmark) {
    // icon-only — для favicon/OG: только буква-планета с орбитой и электронами
    const iconSide = size;
    return (
      <svg
        width={iconSide}
        height={iconSide}
        viewBox="170 18 80 84"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Scoute"
      >
        <defs>
          <clipPath id="scouteIconClip">
            <text
              x="172"
              y="85"
              fontFamily="'Plus Jakarta Sans', ui-sans-serif"
              fontWeight="800"
              fontStyle="italic"
              fontSize="80"
              letterSpacing="-2.4"
            >
              e
            </text>
          </clipPath>
        </defs>
        <text
          x="172"
          y="85"
          fontFamily="'Plus Jakarta Sans', ui-sans-serif"
          fontWeight="800"
          fontStyle="italic"
          fontSize="80"
          letterSpacing="-2.4"
          fill={blue}
        >
          e
        </text>
        <g clipPath="url(#scouteIconClip)" stroke="#FFFFFF" fill="none">
          <ellipse cx="216" cy="60" rx="26" ry="34" strokeOpacity=".22" strokeWidth="1" />
          <ellipse cx="216" cy="60" rx="18" ry="34" strokeOpacity=".22" strokeWidth="1" />
          <ellipse cx="216" cy="60" rx="9" ry="34" strokeOpacity=".22" strokeWidth="1" />
          <line x1="216" y1="24" x2="216" y2="96" strokeOpacity=".4" strokeWidth="1.1" />
          <line x1="184" y1="42" x2="248" y2="42" strokeOpacity=".22" strokeWidth="1" />
          <line x1="180" y1="60" x2="252" y2="60" strokeOpacity=".55" strokeWidth="1.4" />
          <line x1="184" y1="78" x2="248" y2="78" strokeOpacity=".22" strokeWidth="1" />
          <path d="M 200 48 Q 208 44 215 50 Q 215 58 207 58 Q 198 56 200 48 Z" fill="#FFFFFF" opacity=".7" />
          <path d="M 224 70 Q 232 68 234 74 Q 232 80 226 78 Q 222 75 224 70 Z" fill="#FFFFFF" opacity=".7" />
        </g>
        {/* линия орбиты — внутри буквы */}
        <g clipPath="url(#scouteIconClip)">
          <g transform="rotate(45 216 60)">
            <ellipse
              cx="216"
              cy="60"
              rx="22"
              ry="33"
              fill="none"
              stroke={orange}
              strokeOpacity=".95"
              strokeWidth="1.7"
            />
          </g>
        </g>

        {/* электроны — без клипа */}
        <g transform="rotate(45 216 60)">
          <circle r="3.6" fill="#FFFFFF" stroke={orange} strokeWidth=".8">
            {animated && (
              <animateMotion
                dur="4s"
                repeatCount="indefinite"
                path="M 238 60 A 22 33 0 1 1 194 60 A 22 33 0 1 1 238 60 Z"
                rotate="auto"
              />
            )}
          </circle>
          <circle r="3" fill={blue} stroke="#FFFFFF" strokeWidth=".7">
            {animated && (
              <animateMotion
                dur="4s"
                begin="-2s"
                repeatCount="indefinite"
                path="M 238 60 A 22 33 0 1 1 194 60 A 22 33 0 1 1 238 60 Z"
                rotate="auto"
              />
            )}
          </circle>
        </g>
      </svg>
    );
  }

  // wordmark — полная версия: scout + e (планета) + орбита + 2 электрона
  // viewBox 0 0 450 140, естественный аспект ~3.21:1
  const aspect = 450 / 140;
  return (
    <svg
      width={Math.round(size * aspect)}
      height={size}
      viewBox="0 0 450 140"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Scoute"
    >
      <defs>
        <clipPath id="scouteEClip">
          <text
            x="172"
            y="85"
            fontFamily="'Plus Jakarta Sans', ui-sans-serif"
            fontWeight="800"
            fontStyle="italic"
            fontSize="80"
            letterSpacing="-2.4"
          >
            e
          </text>
        </clipPath>
      </defs>

      <g transform="translate(18 0) skewX(-12)">
        <text
          x="0"
          y="85"
          fontFamily="'Plus Jakarta Sans', ui-sans-serif"
          fontWeight="800"
          fontStyle="italic"
          fontSize="80"
          letterSpacing="-2.4"
        >
          <tspan fill={textColor} textLength="172" lengthAdjust="spacingAndGlyphs">
            scout
          </tspan>
          <tspan fill={blue}>e</tspan>
        </text>

        {/* сетка планеты */}
        <g clipPath="url(#scouteEClip)" stroke="#FFFFFF" fill="none">
          <ellipse cx="216" cy="60" rx="26" ry="34" strokeOpacity=".22" strokeWidth="1" />
          <ellipse cx="216" cy="60" rx="18" ry="34" strokeOpacity=".22" strokeWidth="1" />
          <ellipse cx="216" cy="60" rx="9" ry="34" strokeOpacity=".22" strokeWidth="1" />
          <line x1="216" y1="24" x2="216" y2="96" strokeOpacity=".4" strokeWidth="1.1" />
          <line x1="184" y1="42" x2="248" y2="42" strokeOpacity=".22" strokeWidth="1" />
          <line x1="180" y1="60" x2="252" y2="60" strokeOpacity=".55" strokeWidth="1.4" />
          <line x1="184" y1="78" x2="248" y2="78" strokeOpacity=".22" strokeWidth="1" />
          <path d="M 200 48 Q 208 44 215 50 Q 215 58 207 58 Q 198 56 200 48 Z" fill="#FFFFFF" opacity=".7" />
          <path d="M 224 70 Q 232 68 234 74 Q 232 80 226 78 Q 222 75 224 70 Z" fill="#FFFFFF" opacity=".7" />
        </g>

        {/* линия орбиты — внутри буквы (через клип) */}
        <g clipPath="url(#scouteEClip)">
          <g transform="rotate(45 216 60)">
            <ellipse
              cx="216"
              cy="60"
              rx="22"
              ry="33"
              fill="none"
              stroke={orange}
              strokeOpacity=".95"
              strokeWidth="1.7"
            />
          </g>
        </g>

        {/* электроны — без клипа, всегда оба видны */}
        <g transform="rotate(45 216 60)">
          <circle r="3.6" fill="#FFFFFF" stroke={orange} strokeWidth=".8">
            {animated && (
              <animateMotion
                dur="4s"
                repeatCount="indefinite"
                path="M 238 60 A 22 33 0 1 1 194 60 A 22 33 0 1 1 238 60 Z"
                rotate="auto"
              />
            )}
          </circle>
          <circle r="3" fill={blue} stroke="#FFFFFF" strokeWidth=".7">
            {animated && (
              <animateMotion
                dur="4s"
                begin="-2s"
                repeatCount="indefinite"
                path="M 238 60 A 22 33 0 1 1 194 60 A 22 33 0 1 1 238 60 Z"
                rotate="auto"
              />
            )}
          </circle>
        </g>
      </g>
    </svg>
  );
}
