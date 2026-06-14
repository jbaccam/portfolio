"use client";

import { BEATS } from "@/lib/beats";

export default function Nav({
  onNavigate,
  activeIndex,
}: {
  onNavigate: (index: number) => void;
  activeIndex: number;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-[4vw] py-6">
        <button
          onClick={() => onNavigate(0)}
          className="flex items-center gap-2"
          aria-label="Jeremiah Baccam — top"
        >
          <span className="font-display text-2xl leading-none text-ink">JB</span>
          <span className="h-4 w-[3px] rounded-full bg-accent" aria-hidden />
          <span className="hidden text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-ink sm:inline">
            Baccam
          </span>
        </button>

        <ul className="flex items-center gap-1 sm:gap-2">
          {BEATS.map((b, i) => (
            <li key={b.id}>
              <button
                onClick={() => onNavigate(i)}
                className={[
                  "rounded-full px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.24em] transition-opacity sm:text-[0.7rem]",
                  activeIndex === i ? "text-ink opacity-100" : "text-ink opacity-55 hover:opacity-100",
                ].join(" ")}
              >
                {b.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
