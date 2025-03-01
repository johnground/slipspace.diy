import React from 'react';

interface SlipSpaceLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export function SlipSpaceLogo({ className = '', size = 48, color = 'currentColor' }: SlipSpaceLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="50 80 120 60"
      className={className}
      role="img"
      aria-label="AI8 Logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="cyber-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(var(--cyber-blue))" />
          <stop offset="100%" stopColor="rgb(var(--cyber-neon))" />
        </linearGradient>
        <filter id="cyber-glow">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feFlood floodColor="rgb(var(--cyber-blue))" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g id="logo-group" transform="translate(0, -5)">
        {/* A */}
        <text
          className="logo-text"
          style={{
            fontFamily: "'.DecoType Naskh PUA'",
            fontSize: "20px",
            fill: "url(#cyber-gradient)",
            filter: "url(#cyber-glow)",
            stroke: "url(#cyber-gradient)",
            strokeWidth: "0.2"
          }}
          x="70"
          y="115"
        >
          A
        </text>

        {/* I */}
        <text
          className="logo-text"
          style={{
            fontFamily: "'.DecoType Naskh PUA'",
            fontSize: "20px",
            fill: "url(#cyber-gradient)",
            filter: "url(#cyber-glow)",
            stroke: "url(#cyber-gradient)",
            strokeWidth: "0.2"
          }}
          x="85"
          y="115"
        >
          I
        </text>

        {/* 8 */}
        <text
          className="logo-text"
          style={{
            fontFamily: "'.DecoType Naskh PUA'",
            fontSize: "50px",
            fill: "url(#cyber-gradient)",
            filter: "url(#cyber-glow)",
            stroke: "url(#cyber-gradient)",
            strokeWidth: "0.3"
          }}
          x="100"
          y="120"
        >
          8
        </text>
      </g>

      <style>{`
        .logo-text {
          animation: logo-pulse 4s ease-in-out infinite;
        }

        @keyframes logo-pulse {
          0%, 100% {
            filter: url(#cyber-glow) drop-shadow(0 0 2px rgba(var(--cyber-blue), 0.3));
          }
          50% {
            filter: url(#cyber-glow) drop-shadow(0 0 8px rgba(var(--cyber-neon), 0.7));
          }
        }
      `}</style>
    </svg>
  );
}
