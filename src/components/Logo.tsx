import React from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`shrink-0 drop-shadow-[0_0_12px_rgba(167,139,250,0.35)] ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Rich multi-colour base gradient */}
        <linearGradient id="logoAppBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#22D3EE" />
          <stop offset="18%" stop-color="#34D399" />
          <stop offset="35%" stop-color="#A3E635" />
          <stop offset="50%" stop-color="#FDE047" />
          <stop offset="65%" stop-color="#FB923C" />
          <stop offset="80%" stop-color="#F472B6" />
          <stop offset="92%" stop-color="#A78BFA" />
          <stop offset="100%" stop-color="#60A5FA" />
        </linearGradient>

        {/* Cyan / turquoise top-left bloom */}
        <radialGradient id="logoAppCyanGlow" cx="12%" cy="12%" r="70%">
          <stop offset="0%" stop-color="#06B6D4" stop-opacity="1" />
          <stop offset="28%" stop-color="#22D3EE" stop-opacity="0.95" />
          <stop offset="58%" stop-color="#34D399" stop-opacity="0.65" />
          <stop offset="100%" stop-color="#34D399" stop-opacity="0" />
        </radialGradient>

        {/* Lime / green upper-middle bloom */}
        <radialGradient id="logoAppLimeGlow" cx="48%" cy="8%" r="58%">
          <stop offset="0%" stop-color="#BEF264" stop-opacity="0.9" />
          <stop offset="45%" stop-color="#4ADE80" stop-opacity="0.65" />
          <stop offset="100%" stop-color="#4ADE80" stop-opacity="0" />
        </radialGradient>

        {/* Warm yellow / orange right-side bloom */}
        <radialGradient id="logoAppAmberGlow" cx="92%" cy="58%" r="70%">
          <stop offset="0%" stop-color="#FACC15" stop-opacity="1" />
          <stop offset="38%" stop-color="#FB923C" stop-opacity="0.9" />
          <stop offset="68%" stop-color="#F97316" stop-opacity="0.65" />
          <stop offset="100%" stop-color="#F97316" stop-opacity="0" />
        </radialGradient>

        {/* Pink / magenta lower-right bloom */}
        <radialGradient id="logoAppPinkGlow" cx="78%" cy="95%" r="65%">
          <stop offset="0%" stop-color="#EC4899" stop-opacity="1" />
          <stop offset="38%" stop-color="#F472B6" stop-opacity="0.85" />
          <stop offset="70%" stop-color="#C084FC" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#C084FC" stop-opacity="0" />
        </radialGradient>

        {/* Violet / indigo lower-left bloom */}
        <radialGradient id="logoAppVioletGlow" cx="8%" cy="88%" r="72%">
          <stop offset="0%" stop-color="#8B5CF6" stop-opacity="1" />
          <stop offset="35%" stop-color="#A78BFA" stop-opacity="0.9" />
          <stop offset="65%" stop-color="#6366F1" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#6366F1" stop-opacity="0" />
        </radialGradient>

        {/* Blue accent between violet and cyan */}
        <radialGradient id="logoAppBlueGlow" cx="28%" cy="55%" r="58%">
          <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.75" />
          <stop offset="55%" stop-color="#60A5FA" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#60A5FA" stop-opacity="0" />
        </radialGradient>

        <clipPath id="logoAppSquircleClip">
          <rect x="36" y="36" width="440" height="440" rx="128" ry="128" />
        </clipPath>
      </defs>

      {/* Outer squircle with layered colour blooms */}
      <g clipPath="url(#logoAppSquircleClip)">
        <rect x="36" y="36" width="440" height="440" fill="url(#logoAppBaseGrad)" />
        <rect x="36" y="36" width="440" height="440" fill="url(#logoAppCyanGlow)" />
        <rect x="36" y="36" width="440" height="440" fill="url(#logoAppLimeGlow)" />
        <rect x="36" y="36" width="440" height="440" fill="url(#logoAppAmberGlow)" />
        <rect x="36" y="36" width="440" height="440" fill="url(#logoAppPinkGlow)" />
        <rect x="36" y="36" width="440" height="440" fill="url(#logoAppVioletGlow)" />
        <rect x="36" y="36" width="440" height="440" fill="url(#logoAppBlueGlow)" />
      </g>

      {/* Inner Bento center void */}
      <rect x="184" y="184" width="144" height="144" rx="42" ry="42" fill="#070A10" />
    </svg>
  );
};
