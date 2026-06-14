"use client";

import { BEATS } from "@/lib/beats";

export default function ProgressRail({
  activeIndex,
  onSelect,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="fixed right-[2.2vw] top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-5 md:flex">
      {/* travel line */}
      <div className="relative h-44 w-px bg-line">
        <div
          className="absolute inset-x-0 top-0 origin-top bg-accent"
          style={{ height: "var(--rail-fill, 0%)" }}
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        {BEATS.map((b, i) => (
          <button
            key={b.id}
            onClick={() => onSelect(i)}
            className="group flex items-center gap-3"
            aria-label={`Go to ${b.label}`}
          >
            <span
              className={[
                "text-[0.58rem] font-semibold uppercase tracking-[0.2em] transition-all duration-300",
                activeIndex === i
                  ? "text-accent opacity-100"
                  : "text-muted opacity-0 group-hover:opacity-100",
              ].join(" ")}
            >
              {b.label}
            </span>
            <span
              className={[
                "h-2 w-2 rotate-45 border transition-all duration-300",
                activeIndex === i
                  ? "scale-125 border-accent bg-accent"
                  : "border-muted bg-transparent",
              ].join(" ")}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
