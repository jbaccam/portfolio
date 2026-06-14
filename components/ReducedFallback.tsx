"use client";

import { BEATS } from "@/lib/beats";
import Nav from "./Nav";

// Static, no-scrub layout for prefers-reduced-motion (and a safe
// baseline if JS/animation is unavailable). Same type & theme.
export default function ReducedFallback() {
  const goTo = (i: number) => {
    document
      .getElementById(BEATS[i].id)
      ?.scrollIntoView({ behavior: "auto", block: "center" });
  };

  return (
    <div>
      <Nav onNavigate={goTo} activeIndex={0} />

      {/* hero */}
      <section className="relative flex min-h-[90svh] items-center justify-center overflow-hidden px-[6vw]">
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_120%,#15161a,#08090a)]" />
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-95"
          autoPlay
          muted
          loop
          playsInline
          poster="/poster.jpg"
        >
          <source src="/rider.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 text-center">
          <p className="eyebrow mb-4">Software Engineer</p>
          <h1 className="font-display text-[clamp(3rem,12vw,9rem)] text-ink">
            Jeremiah Baccam
          </h1>
        </div>
      </section>

      {/* beats stacked */}
      <div className="mx-auto max-w-3xl space-y-px px-[6vw] pb-32">
        {BEATS.map((b) => (
          <section
            key={b.id}
            id={b.id}
            className="hairline border-t py-16"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="font-display text-2xl text-accent">{b.num}</span>
              <span className="h-[3px] w-12 rounded-full bg-accent" aria-hidden />
              <span className="eyebrow">{b.label}</span>
            </div>
            <h2 className="font-display text-[clamp(2.4rem,8vw,5rem)] text-ink">
              {b.headline.replace("\n", " ")}
            </h2>
            {b.sub && (
              <p className="italic-banner mt-5 text-xl text-ink-dim">{b.sub}</p>
            )}
            {b.body && (
              <p className="mt-5 text-lg leading-relaxed text-ink-dim">
                {b.body}
              </p>
            )}
            {b.roles && (
              <ul className="mt-6 space-y-4">
                {b.roles.map((r, i) => (
                  <li
                    key={`${r.org}-${i}`}
                    className="hairline flex items-baseline justify-between gap-4 border-t pt-3"
                  >
                    <div>
                      <div className="font-display text-2xl text-ink">
                        {r.org}
                        {r.note && (
                          <span className="ml-2 align-middle text-xs uppercase tracking-[0.2em] text-accent">
                            {r.note}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-muted">{r.role}</div>
                    </div>
                    {r.date && (
                      <span className="shrink-0 text-xs uppercase tracking-[0.14em] text-ink-dim">
                        {r.date}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {b.links && (
              <div className="mt-7 flex flex-wrap gap-3">
                {b.links.map((l, i) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target={l.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className={[
                      "rounded-full px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.18em]",
                      i === 0
                        ? "bg-accent text-black"
                        : "hairline border text-ink",
                    ].join(" ")}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
