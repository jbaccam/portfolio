// ------------------------------------------------------------------
//  Beat configuration
//
//  The ride is a 337-frame JPG sequence (public/frames/f_001..f_337),
//  painted to a <canvas> and scrubbed by an Observer-driven beat
//  machine — one scroll gesture glides to exactly one beat. Each beat
//  is a maneuver paired with a slab of copy that drifts in from the
//  right, holds on the hero pose, then swipes off LEFT.
//
//  Progress is 0..1 across the sequence and maps 1:1 onto frame index.
//  `hold` is the frame the motion SNAPS to (the readable still),
//  expressed via f(frameNumber). Hero frames picked off the sheet:
//    f_072 riding · f_100 rising wheelie (copy-readable) ·
//    f_204 stoppy · f_316 settled / chill.
// ------------------------------------------------------------------

export const FRAME_COUNT = 337;

/** frame number (1-based) -> progress 0..1 */
const f = (frame: number) => (frame - 1) / (FRAME_COUNT - 1);

export type BeatLink = { label: string; href: string };
export type BeatRole = {
  role: string;
  org: string;
  date?: string;
  note?: string;
};

export interface Beat {
  id: string;
  num: string;
  label: string;
  side: "left" | "right";
  kind: "intro" | "about" | "work" | "contact";
  /** snap target (progress 0..1) — the readable still for this beat */
  hold: number;
  /** text enters between in0..in1, exits between out0..out1 (progress) */
  in0: number;
  in1: number;
  out0: number;
  out1: number;
  headline: string; // use \n for line breaks
  sub?: string;
  body?: string;
  roles?: BeatRole[];
  links?: BeatLink[];
}

export const BEATS: Beat[] = [
  {
    id: "intro",
    num: "01",
    label: "Ride",
    side: "left",
    kind: "intro",
    hold: f(72), // composed riding hero, foot on the peg
    in0: 0.0,
    in1: 0.12,
    out0: 0.25,
    out1: 0.31,
    headline: "Jeremiah\nBaccam",
    sub: "Software engineer. I ride fast and ship faster.",
  },
  {
    id: "about",
    num: "02",
    label: "Lift",
    side: "right",
    kind: "about",
    hold: f(144), // wheelie APEX — ascent ends here, next beat is pure descent
    in0: 0.33,
    in1: 0.41,
    out0: 0.45,
    out1: 0.54,
    headline: "More\nThan Code",
    body: "Off the clock I’m chasing a better sear in the kitchen, hanging with my cats and family, and getting after it in the gym — I love to lift. I used to ride; bikeless for now (maybe an incoming Ducati??), and a new car’s on the list too.",
  },
  {
    id: "work",
    num: "03",
    label: "Control",
    side: "left",
    kind: "work",
    hold: f(204), // stoppy — front planted, rear up
    in0: 0.52,
    in1: 0.59,
    out0: 0.66,
    out1: 0.73,
    headline: "Where I’ve\nWorked",
    roles: [
      {
        org: "Capital One",
        role: "Software Engineer Intern",
        date: "May – Aug 2026",
        note: "Now",
      },
      {
        org: "John Deere",
        role: "Software Engineer Intern",
        date: "Apr 2025 – Present",
      },
      {
        org: "Iowa State University",
        role: "Software Engineering Peer Mentor",
        date: "Aug 2025 – May 2026",
      },
      {
        org: "Iowa State University",
        role: "Teaching Assistant · SE 1850 / 1860",
        date: "Aug 2025 – May 2026",
      },
    ],
  },
  {
    id: "contact",
    num: "04",
    label: "Stand",
    side: "right",
    kind: "contact",
    hold: f(316), // settled, planted — the chill closer
    in0: 0.86,
    in1: 0.925,
    out0: 2, // never exits — holds at the end
    out1: 2,
    headline: "Let’s\nBuild",
    sub: "Always up for a good problem or a good ride.",
    links: [
      { label: "Email", href: "mailto:jjaybaccam@gmail.com" },
      { label: "GitHub", href: "https://github.com/jbaccam" },
      { label: "LinkedIn", href: "https://linkedin.com/in/jeremiah-baccam" },
    ],
  },
];

/** Progress targets the motion snaps to, one per beat (ascending). */
export const HOLDS = BEATS.map((b) => b.hold);

/** Frame path for a given 1-based frame number. */
export const framePath = (frame: number) =>
  `/frames/f_${String(frame).padStart(3, "0")}.webp`;
