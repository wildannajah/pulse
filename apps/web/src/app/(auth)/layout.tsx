import { BrandLockup } from "@pulse/ui/brand/brand-lockup";
import { BrandMark } from "@pulse/ui/brand/brand-mark";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left — gradient brand panel */}
      <aside
        className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden p-12 lg:flex"
        style={{
          background: "linear-gradient(135deg, #FFC8B2 0%, #F2B8F2 30%, #C8B0F8 65%, #A0ECE8 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="-top-20 -left-20 absolute h-[300px] w-[300px] rounded-full"
          style={{ background: "oklch(1 0 0 / 10%)" }}
        />
        <div
          className="-right-15 -bottom-15 absolute h-[240px] w-[240px] rounded-full"
          style={{ background: "oklch(1 0 0 / 8%)" }}
        />

        <div className="relative z-10 max-w-[400px] text-center">
          <div className="mb-5 flex justify-center">
            <BrandMark size={64} />
          </div>
          <h1
            className="mb-3.5 font-bold text-[32px] leading-tight tracking-tight"
            style={{ color: "#3d2f6e" }}
          >
            Manage all your social platforms in one place
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: "oklch(0.35 0.12 275)" }}>
            Schedule posts, track performance, and reply to messages — without switching tabs.
          </p>

          <div className="mt-9 flex items-center justify-center gap-3">
            <div className="flex">
              {["#FFC8B2", "#C8B0F8", "#A0ECE8", "#F2B8F2"].map((c, i) => (
                <div
                  key={c}
                  className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                  style={{ background: c, marginLeft: i === 0 ? 0 : -8 }}
                />
              ))}
            </div>
            <span className="text-[13px] font-medium" style={{ color: "oklch(0.38 0.12 275)" }}>
              Trusted by 2,400+ brands
            </span>
          </div>
        </div>
      </aside>

      {/* Right — form */}
      <div className="flex w-full flex-shrink-0 items-center justify-center p-10 lg:w-[440px]">
        <div className="flex w-full max-w-[360px] flex-col gap-6">
          <div className="text-center">
            <div className="mb-5 flex justify-center lg:hidden">
              <BrandLockup iconSize={34} />
            </div>
            <div className="hidden lg:flex lg:justify-center">
              <BrandLockup iconSize={34} />
            </div>
          </div>
          <div
            className="rounded-xl border border-border bg-card p-6"
            style={{ boxShadow: "0 4px 16px oklch(0.74 0.16 275 / 8%)" }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
