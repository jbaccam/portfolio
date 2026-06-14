"use client";

export default function ScrollHint({ visible }: { visible: boolean }) {
  return (
    <div
      className={[
        "pointer-events-none fixed bottom-7 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      aria-hidden
    >
      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-ink-dim">
        Scroll to ride
      </span>
      <span className="relative block h-9 w-px overflow-hidden bg-line">
        <span className="absolute inset-x-0 top-0 h-3 animate-[drop_1.6s_ease-in-out_infinite] bg-accent" />
      </span>
      <style jsx>{`
        @keyframes drop {
          0% {
            transform: translateY(-100%);
          }
          60%,
          100% {
            transform: translateY(300%);
          }
        }
      `}</style>
    </div>
  );
}
