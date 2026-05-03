import type { SVGProps } from "react";

export type BrandMarkProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "xmlns"> & {
  size?: number | string;
};

/**
 * The Pulse icon: speech-bubble shape with a heartbeat/ECG mark inside,
 * filled with the brand gradient (peach → pink → violet → teal).
 * Use as the app's compact brand mark — favicons, sidebar, loading splash.
 */
export function BrandMark({ size = 32, ...rest }: BrandMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 148"
      width={size}
      height={size}
      aria-label="Pulse"
      role="img"
      {...rest}
    >
      <defs>
        <linearGradient
          id="pulse-brand-grad"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#FFC8B2" />
          <stop offset="30%" stopColor="#F2B8F2" />
          <stop offset="65%" stopColor="#C8B0F8" />
          <stop offset="100%" stopColor="#A0ECE8" />
        </linearGradient>
      </defs>
      <path
        d="M 26,0 H 134 Q 160,0 160,26 V 86 Q 160,112 134,112 H 54 L 8,144 L 30,112 H 26 Q 0,112 0,86 V 26 Q 0,0 26,0 Z"
        fill="url(#pulse-brand-grad)"
      />
      <polyline
        points="8,56 32,56 41,43 48,71 54,18 63,56 98,56"
        fill="none"
        stroke="white"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
