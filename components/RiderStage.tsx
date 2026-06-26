"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { BEATS, HOLDS, FRAME_COUNT, framePath } from "@/lib/beats";
import TextBeat from "./TextBeat";
import Nav from "./Nav";
import ProgressRail from "./ProgressRail";
import ScrollHint from "./ScrollHint";
import ReducedFallback from "./ReducedFallback";

gsap.registerPlugin(useGSAP, Observer);

// frames that must be in before we hand over control (covers RIDE → LIFT)
const REVEAL_AT = 120;
// fixed glide time per beat — every transition is identical regardless of input
const TRANSITION = 1.4;

export default function RiderStage() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const frames = useRef<HTMLImageElement[]>([]);
  const navTo = useRef<(i: number) => void>(() => {});

  const [active, setActive] = useState(0);
  const [hint, setHint] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [loadPct, setLoadPct] = useState(0);
  const [ready, setReady] = useState(false);

  // ---- preload the frame sequence (in order, small concurrency pool) ----
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    const imgs: HTMLImageElement[] = new Array(FRAME_COUNT);
    frames.current = imgs;

    let next = 0;
    let done = 0;
    // More inflight requests fill the pipe faster on fast connections; the
    // browser still caps real concurrency per-host, so this is a safe ceiling.
    const POOL = 12;

    const loadOne = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        // Get the opening frames on the wire first so the gate lifts sooner.
        if (i < REVEAL_AT) img.setAttribute("fetchpriority", "high");
        imgs[i] = img;
        const finish = () => resolve();
        img.onload = () => {
          // Decode NOW, off the main thread, so the very first drawImage of
          // each frame never triggers a synchronous decode mid-glide — the
          // single biggest source of dropped frames in a canvas scrubber.
          if (typeof img.decode === "function") img.decode().then(finish, finish);
          else finish();
        };
        img.onerror = finish;
        img.src = framePath(i + 1);
      });

    const worker = async () => {
      while (!cancelled && next < FRAME_COUNT) {
        await loadOne(next++);
        if (cancelled) return;
        done++;
        setLoadPct(done / FRAME_COUNT);
        if (done >= REVEAL_AT) setReady(true);
      }
    };
    for (let w = 0; w < POOL; w++) worker();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- the engine: paint frames + run the Observer beat machine ----
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setReduced(true);
        return;
      }
      if (!ready) return;

      // Lock native scrolling so every wheel/touch event reaches the Observer
      // uniformly — otherwise the browser scrolls some regions itself and the
      // input only "works" when the cursor is over certain parts of the page.
      const html = document.documentElement;
      const body = document.body;
      const prev = {
        htmlOverflow: html.style.overflow,
        bodyOverflow: body.style.overflow,
        overscroll: html.style.overscrollBehavior,
      };
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      html.style.overscrollBehavior = "none";

      const cv = canvas.current!;
      // alpha:false — frames are cover-fit so they always fill the canvas
      // opaquely; dropping the alpha channel lets the compositor skip blending.
      // desynchronized — opt into the low-latency present path, fewer stalls.
      const ctx = cv.getContext("2d", {
        alpha: false,
        desynchronized: true,
      })!;
      const proxy = { p: HOLDS[0] };
      let activeIdx = 0;
      let animating = false;
      let cooling = false;
      let cool: gsap.core.Tween | null = null;

      const setVar = (n: string, v: string) =>
        document.documentElement.style.setProperty(n, v);

      // text timeline, seeked by absolute progress (0..1)
      const tl = gsap.timeline({ paused: true });
      BEATS.forEach((b, i) => {
        const el = panels.current[i];
        if (!el) return;
        tl.fromTo(
          el,
          { x: 180, autoAlpha: 0, filter: "blur(14px)" },
          {
            x: 0,
            autoAlpha: 1,
            filter: "blur(0px)",
            ease: "power3.out",
            duration: Math.max(0.001, b.in1 - b.in0),
          },
          b.in0
        );
        if (b.out0 < 1) {
          tl.to(
            el,
            {
              x: -360,
              autoAlpha: 0,
              filter: "blur(14px)",
              ease: "power2.in",
              duration: Math.max(0.001, b.out1 - b.out0),
            },
            b.out0
          );
        }
      });

      // nearest already-decoded frame to idx (graceful during background load)
      const nearestLoaded = (idx: number) => {
        const arr = frames.current;
        const ok = (j: number) => arr[j]?.complete && arr[j].naturalWidth > 0;
        if (ok(idx)) return idx;
        for (let r = 1; r < FRAME_COUNT; r++) {
          if (idx - r >= 0 && ok(idx - r)) return idx - r;
          if (idx + r < FRAME_COUNT && ok(idx + r)) return idx + r;
        }
        return -1;
      };

      // Cover-fit geometry is identical for every frame (they share one size)
      // and only changes on resize — compute it once and reuse, so the hot
      // paint path is just a clamp + lookup + drawImage.
      let drawn = -1;
      const dest = { dx: 0, dy: 0, dw: 0, dh: 0 };
      const computeDest = (img: HTMLImageElement) => {
        const cw = cv.width;
        const ch = cv.height;
        const ir = img.naturalWidth / img.naturalHeight;
        if (cw / ch > ir) {
          dest.dw = cw;
          dest.dh = cw / ir;
          dest.dx = 0;
          dest.dy = (ch - dest.dh) / 2;
        } else {
          dest.dh = ch;
          dest.dw = ch * ir;
          dest.dx = (cw - dest.dw) / 2;
          dest.dy = 0;
        }
      };

      // paint with cover-fit (we manage scaling, so no CSS object-fit needed)
      let geomReady = false;
      const paint = (p: number) => {
        const idx = Math.max(
          0,
          Math.min(FRAME_COUNT - 1, Math.round(p * (FRAME_COUNT - 1)))
        );
        const use = nearestLoaded(idx);
        if (use < 0 || use === drawn) return;
        const img = frames.current[use];
        if (!geomReady) {
          computeDest(img);
          geomReady = true;
        }
        ctx.drawImage(img, dest.dx, dest.dy, dest.dw, dest.dh);
        drawn = use;
      };

      const applyResize = () => {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(window.innerWidth * dpr);
        cv.height = Math.round(window.innerHeight * dpr);
        drawn = -1;
        geomReady = false; // canvas dimensions changed → recompute cover-fit
        paint(proxy.p);
      };
      applyResize();

      // Coalesce resize bursts into a single repaint on the next frame so a
      // window drag doesn't reallocate the canvas backing store dozens of times.
      let resizeRaf = 0;
      const resize = () => {
        if (resizeRaf) return;
        resizeRaf = requestAnimationFrame(() => {
          resizeRaf = 0;
          applyResize();
        });
      };
      window.addEventListener("resize", resize);

      // Writing a custom property on :root invalidates style for the whole
      // document, so only write when the rounded value actually changes —
      // otherwise we'd trigger a recalc on every one of ~84 glide frames for
      // values that often haven't visibly moved.
      let lastP = proxy.p;
      let lastSpeed = -1;
      let lastFill = -1;
      const render = () => {
        const p = proxy.p;
        paint(p);
        tl.seek(p, false);
        const speed = +Math.min(1, Math.abs(p - lastP) * 120).toFixed(3);
        if (speed !== lastSpeed) {
          setVar("--speed", String(speed));
          lastSpeed = speed;
        }
        const fill = +(p * 100).toFixed(2);
        if (fill !== lastFill) {
          setVar("--rail-fill", `${fill}%`);
          lastFill = fill;
        }
        lastP = p;
      };
      render();

      // glide to one beat — fixed duration, so it's smooth at any input speed
      const goTo = (idx: number) => {
        const target = Math.max(0, Math.min(BEATS.length - 1, idx));
        if (target === activeIdx) return;
        animating = true;
        activeIdx = target;
        setActive(target);
        setHint(target === 0);
        gsap.to(proxy, {
          p: HOLDS[target],
          duration: TRANSITION,
          // near-constant frame velocity (soft start/stop, no mid-glide spike)
          // so the clip plays back evenly instead of "slow then fast"
          ease: "sine.inOut",
          overwrite: true,
          onUpdate: render,
          onComplete: () => {
            animating = false;
            setVar("--speed", "0");
            lastSpeed = 0;
          },
        });
      };
      navTo.current = goTo;

      // One step, then a fixed cooldown. The cooldown is set ONCE per step and
      // is never re-armed by later events, so a flick's inertial tail can't
      // sneak a second step in — but a trackpad's continuous event stream can't
      // deadlock it either (that bug made relentless scrolling do nothing).
      const COOLDOWN = TRANSITION + 0.45; // glide time + inertia-absorbing gap
      const intent = (dir: number) => {
        if (cooling || animating) return;
        const target = Math.max(0, Math.min(BEATS.length - 1, activeIdx + dir));
        if (target === activeIdx) return; // at an end — don't burn a cooldown
        cooling = true;
        cool = gsap.delayedCall(COOLDOWN, () => {
          cooling = false;
        });
        goTo(target);
      };

      // Wheel/trackpad: an explicit window-level non-passive listener so events
      // are caught globally no matter what element the cursor is over. (Relying
      // on Observer's wheel target made scrolling only "work" over some parts.)
      //
      // We accumulate deltaY and only step once the NET movement crosses a
      // threshold, instead of reacting to every raw event. Trackpads emit noisy
      // streams with stray opposite-sign deltas (especially momentum/bounce), so
      // single-event handling let the "dead" direction at an end beat trigger a
      // reverse step — e.g. scrolling down on STAND jumping back to CONTROL.
      const SENSITIVITY = 50; // net deltaY needed to commit a step (higher = less twitchy)
      let acc = 0;
      let lastWheel = 0;
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const now = performance.now();
        if (now - lastWheel > 180) acc = 0; // a fresh gesture starts clean
        lastWheel = now;
        if (cooling || animating) {
          acc = 0; // ignore (and don't bank) input during a glide + cooldown
          return;
        }
        acc += e.deltaY;
        if (Math.abs(acc) >= SENSITIVITY) {
          const dir = acc > 0 ? 1 : -1;
          acc = 0;
          intent(dir);
        }
      };
      window.addEventListener("wheel", onWheel, { passive: false });

      // Observer handles touch (mobile swipe) only; wheel is the listener above.
      const obs = Observer.create({
        target: window,
        type: "touch",
        tolerance: 8, // bigger swipe needed before a step commits
        preventDefault: true,
        onUp: () => intent(1), // swipe toward the bottom → next beat
        onDown: () => intent(-1),
      });

      const onKey = (e: KeyboardEvent) => {
        if (["ArrowDown", "PageDown", " ", "ArrowRight"].includes(e.key)) {
          e.preventDefault();
          intent(1);
        } else if (["ArrowUp", "PageUp", "ArrowLeft"].includes(e.key)) {
          e.preventDefault();
          intent(-1);
        } else if (e.key === "Home") {
          e.preventDefault();
          goTo(0);
        } else if (e.key === "End") {
          e.preventDefault();
          goTo(BEATS.length - 1);
        }
      };
      window.addEventListener("keydown", onKey);

      return () => {
        obs.kill();
        tl.kill();
        cool?.kill();
        gsap.killTweensOf(proxy);
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("resize", resize);
        window.removeEventListener("keydown", onKey);
        html.style.overflow = prev.htmlOverflow;
        body.style.overflow = prev.bodyOverflow;
        html.style.overscrollBehavior = prev.overscroll;
      };
    },
    { scope: root, dependencies: [ready] }
  );

  if (reduced) {
    return <ReducedFallback />;
  }

  return (
    <div ref={root}>
      <Nav onNavigate={(i) => navTo.current(i)} activeIndex={active} />
      <ProgressRail activeIndex={active} onSelect={(i) => navTo.current(i)} />
      <ScrollHint visible={hint && ready} />

      {/* fixed full-viewport stage — the motion takes over the scroll */}
      <div
        className="fixed inset-0 h-[100svh] w-full overflow-hidden bg-base"
        style={{
          backgroundImage: "url(/poster.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* the rider — frame sequence painted to canvas */}
        <canvas ref={canvas} className="absolute inset-0 z-10 h-full w-full" />

        {/* feather the clip edges into the page so seams disappear */}
        <div
          className="pointer-events-none absolute inset-0 z-[11] shadow-[inset_0_0_140px_40px_#08090a]"
          aria-hidden
        />

        {/* directional readability scrim — darkens only the side the copy sits
            on and fades into the rider, so text is always grounded while the
            photo still reads. Crossfades as the active beat changes side. */}
        <div
          className="pointer-events-none absolute inset-0 z-[15] transition-opacity duration-700 ease-out"
          style={{
            opacity: BEATS[active]?.side === "left" ? 1 : 0,
            background:
              "linear-gradient(to right, rgba(8,9,10,0.9) 0%, rgba(8,9,10,0.62) 26%, rgba(8,9,10,0.22) 48%, transparent 66%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[15] transition-opacity duration-700 ease-out"
          style={{
            opacity: BEATS[active]?.side === "right" ? 1 : 0,
            background:
              "linear-gradient(to left, rgba(8,9,10,0.9) 0%, rgba(8,9,10,0.62) 26%, rgba(8,9,10,0.22) 48%, transparent 66%)",
          }}
          aria-hidden
        />

        <div className="streaks z-20" aria-hidden />

        {/* big ghosted maneuver word behind everything */}
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
          <span
            className="font-display select-none text-[26vw] leading-none text-white/[0.025]"
            aria-hidden
          >
            {BEATS[active]?.label}
          </span>
        </div>

        {/* text beats */}
        {BEATS.map((b, i) => (
          <TextBeat
            key={b.id}
            beat={b}
            ref={(el) => {
              panels.current[i] = el;
            }}
          />
        ))}

        {/* loader — holds the gate until the ride can run smooth */}
        {!ready && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-base/75 backdrop-blur-sm">
            <span className="eyebrow">Loading the ride</span>
            <div className="h-px w-44 overflow-hidden bg-line">
              <div
                className="h-full bg-accent transition-[width] duration-200 ease-linear"
                style={{ width: `${Math.round(loadPct * 100)}%` }}
              />
            </div>
            <span className="font-display text-sm tabular-nums text-ink/70">
              {Math.round(loadPct * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
