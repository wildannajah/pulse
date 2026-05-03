import { BrandMark } from "./brand-mark";

export type BrandLockupProps = {
  iconSize?: number;
  className?: string;
  wordmarkClassName?: string;
};

/**
 * Pulse brand mark + "Pulse" wordmark in a horizontal lockup.
 * Use in the app sidebar header and the marketing/auth pages.
 *
 * The wordmark uses Geist (the app's brand sans) at 700 weight to keep us in
 * one type family — the original logo SVG ships a Nunito wordmark, but
 * substituting Geist avoids an extra font import for one word.
 */
export function BrandLockup({ iconSize = 28, className, wordmarkClassName }: BrandLockupProps) {
  return (
    <div className={className} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <BrandMark size={iconSize} />
      <span
        className={wordmarkClassName}
        style={{
          fontWeight: 700,
          fontSize: Math.round(Number(iconSize) * 0.65),
          letterSpacing: "-0.01em",
          color: "#5A5A8E",
        }}
      >
        Pulse
      </span>
    </div>
  );
}
