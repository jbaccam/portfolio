"use client";

import { forwardRef } from "react";
import type { Beat } from "@/lib/beats";

function Headline({ text }: { text: string }) {
  return (
    <h2 className="font-display text-ink text-[clamp(3.2rem,11vw,9.5rem)]">
      {text.split("\n").map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
    </h2>
  );
}

const TextBeat = forwardRef<HTMLDivElement, { beat: Beat }>(function TextBeat(
  { beat },
  ref
) {
  const alignLeft = beat.side === "left";

  return (
    <div
      ref={ref}
      data-beat={beat.id}
      className={[
        "copy-legible pointer-events-none absolute top-1/2 z-30 w-[min(92vw,40rem)] -translate-y-1/2 will-change-transform",
        alignLeft
          ? "left-[4vw] text-left md:left-[6vw]"
          : "right-[4vw] text-right md:right-[6vw]",
      ].join(" ")}
      style={{ opacity: 0 }}
    >
      {/* eyebrow row */}
      <div
        className={[
          "mb-5 flex items-center gap-3",
          alignLeft ? "justify-start" : "justify-end",
        ].join(" ")}
      >
        {!alignLeft && <span className="eyebrow">{beat.label}</span>}
        <span className="font-display text-accent text-2xl leading-none">
          {beat.num}
        </span>
        <span className="h-[3px] w-12 rounded-full bg-accent" aria-hidden />
        {alignLeft && <span className="eyebrow">{beat.label}</span>}
      </div>

      <Headline text={beat.headline} />

      {/* supporting copy */}
      <div
        className={[
          "mt-7 max-w-[34rem]",
          alignLeft ? "mr-auto" : "ml-auto",
        ].join(" ")}
      >
        {beat.sub && (
          <p className="italic-banner text-[clamp(1.05rem,1.7vw,1.4rem)] text-ink-dim">
            {beat.sub}
          </p>
        )}

        {beat.body && (
          <p className="text-[clamp(1rem,1.4vw,1.18rem)] leading-relaxed text-ink-dim">
            {beat.body}
          </p>
        )}

        {beat.roles && (
          <ul className="mt-1 space-y-3">
            {beat.roles.map((r, i) => (
              <li
                key={`${r.org}-${i}`}
                className="hairline flex items-baseline gap-4 border-t pt-2.5"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-display text-[clamp(1.2rem,2vw,1.7rem)] leading-none text-ink">
                      {r.org}
                    </span>
                    {r.note && (
                      <span className="rounded-full border border-accent/60 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-accent">
                        {r.note}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[0.82rem] tracking-wide text-muted">
                    {r.role}
                  </div>
                </div>
                {r.date && (
                  <span className="shrink-0 font-body text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-dim">
                    {r.date}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {beat.links && (
          <div
            className={[
              "pointer-events-auto mt-7 flex flex-wrap gap-3",
              alignLeft ? "justify-start" : "justify-end",
            ].join(" ")}
          >
            {beat.links.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className={[
                  "group inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] transition-colors duration-300",
                  i === 0
                    ? "border-accent bg-accent text-black hover:bg-transparent hover:text-accent"
                    : "hairline border text-ink hover:border-accent hover:text-accent",
                ].join(" ")}
              >
                {l.label}
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default TextBeat;
