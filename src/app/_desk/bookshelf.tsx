import { EB_Garamond, Oswald } from "next/font/google";

// Floating wooden wall shelves (after the reference Diya picked) holding only the books she
// recommends, drawn large enough that every title can be read. Spine colours and lettering follow
// the editions' own covers, thicknesses follow their page counts, and two books stand face-out
// with their real covers. Drawn in the same local coordinates as the shelf it replaced
// (x 588–936, y 34–506), so Diya's saved bookshelf offset still places it where she put it. No
// animation; the room's lamp filter dims it with everything else.

const sans = Oswald({ subsets: ["latin"], weight: ["500", "600"], display: "swap" });
const serif = EB_Garamond({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], display: "swap" });

type Face = "sans" | "serif" | "italic";

// Rough advance width per character as a fraction of the font size, used to shrink a line that
// would not fit its spine.
const FACES: Record<Face, { family: string; weight: number; italic?: boolean; spacing: number; k: number }> = {
  sans: { family: sans.style.fontFamily, weight: 600, spacing: 0.02, k: 0.5 },
  serif: { family: serif.style.fontFamily, weight: 600, spacing: 0, k: 0.47 },
  italic: { family: serif.style.fontFamily, weight: 500, italic: true, spacing: 0, k: 0.43 },
};

type Text = { text: string; size: number; face: Face; fill: string };
type Mark = "bolt" | "flower" | "bird" | "house" | "keyhole";

type Spine = {
  kind: "spine";
  key: string;
  w: number;
  h: number;
  bg: string;
  lines: Text[];
  band?: string;
  num?: { n: number; fill: string };
  mark?: { kind: Mark; fill: string };
  lean?: number;
};

type Cover = { kind: "cover"; key: string; src: string; w: number; h: number; depth: number; alt: string };

type Flat = { key: string; len: number; t: number; bg: string; lines: Text[]; band?: string };

type Item = Spine | Cover;

const LEFT = 588;
const RIGHT = 936;
const START = 596;
const PLANK = 11;
const ROWS = [186, 336, 486];
const GAP = 1;

const sansT = (text: string, size: number, fill: string): Text => ({ text, size, face: "sans", fill });
const serifT = (text: string, size: number, fill: string): Text => ({ text, size, face: "serif", fill });
const italicT = (text: string, size: number, fill: string): Text => ({ text, size, face: "italic", fill });

// Bloomsbury paperbacks, thickness from each book's page count.
const HP_GOLD = "#f5d77a";
const HARRY_POTTER: Spine[] = ([
  ["Philosopher's Stone", "#b8322b", 24], ["Chamber of Secrets", "#2f7a3f", 26], ["Prisoner of Azkaban", "#563d86", 30],
  ["Goblet of Fire", "#1e5c96", 46], ["Order of the Phoenix", "#d0601c", 53], ["Half-Blood Prince", "#2b7d6f", 44], ["Deathly Hallows", "#8c2330", 44],
] as const).map(([sub, bg, w], i) => ({
  kind: "spine", key: `hp${i + 1}`, w, h: 124, bg,
  lines: [sansT("HARRY POTTER", 13, HP_GOLD), italicT(`and the ${sub}`, 8, "#fbeec4")],
  num: { n: i + 1, fill: HP_GOLD },
  mark: { kind: "bolt", fill: HP_GOLD },
}));

const CLASSICS: Spine[] = [
  { kind: "spine", key: "mockingbird", w: 30, h: 120, bg: "#c84a2b", band: "#1d1a17", lines: [italicT("To Kill a", 12.5, "#f6ead2"), italicT("Mockingbird", 12.5, "#f6ead2"), sansT("HARPER LEE", 6.6, "#f6ead2")], mark: { kind: "bird", fill: "#f6ead2" } },
  { kind: "spine", key: "christie", w: 27, h: 118, bg: "#141414", lines: [sansT("AGATHA CHRISTIE", 9.6, "#f2efe6"), serifT("And Then There Were None", 9.6, "#e04436")] },
];

const THRILLERS: Item[] = [
  { kind: "cover", key: "housemaid", src: "/concepts/desk/books/housemaid.webp", w: 77, h: 118, depth: 6, alt: "The Housemaid by Freida McFadden" },
  { kind: "spine", key: "neverlie", w: 30, h: 120, bg: "#121212", lines: [sansT("NEVER LIE", 15, "#d0262d"), sansT("FREIDA McFADDEN", 7.4, "#f4f4f4")] },
  { kind: "spine", key: "perfectson", w: 32, h: 122, bg: "#0f1420", lines: [sansT("THE PERFECT SON", 12.6, "#f2d23c"), sansT("FREIDA McFADDEN", 7.4, "#f4f4f4")] },
  { kind: "spine", key: "thenshe", w: 34, h: 124, bg: "#1f4e5a", lines: [sansT("THEN SHE WAS GONE", 11.4, "#e9c547"), sansT("LISA JEWELL", 8, "#ffffff")] },
  { kind: "spine", key: "familyupstairs", w: 33, h: 124, bg: "#16304f", lines: [sansT("THE FAMILY UPSTAIRS", 10.4, "#f0c64a"), sansT("LISA JEWELL", 8, "#f2c6c6")] },
];

const ROMANCE: Item[] = [
  { kind: "cover", key: "itends", src: "/concepts/desk/books/itends.webp", w: 77, h: 118, depth: 6, alt: "It Ends with Us by Colleen Hoover" },
  { kind: "spine", key: "fineprint", w: 36, h: 120, bg: "#e8eceb", lines: [italicT("The Fine Print", 14, "#2c5249"), sansT("LAUREN ASHER", 7, "#2c5249")], band: "#9fb8b0" },
  { kind: "spine", key: "terms", w: 33, h: 120, bg: "#5f8f76", lines: [italicT("Terms and", 12, "#ffffff"), italicT("Conditions", 12, "#ffffff"), sansT("LAUREN ASHER", 6.4, "#e7f0ea")], band: "#cfe0d6" },
  { kind: "spine", key: "finaloffer", w: 42, h: 120, bg: "#3f7c6c", lines: [italicT("Final Offer", 15, "#ffffff"), sansT("LAUREN ASHER", 7.6, "#e2efe9")], band: "#b9d5cb" },
  { kind: "spine", key: "lovehyp", w: 35, h: 122, bg: "#3aa0b8", lines: [italicT("the Love Hypothesis", 12.6, "#f9c3d2"), sansT("ALI HAZELWOOD", 7.2, "#ffffff")] },
  { kind: "spine", key: "twisted", w: 37, h: 124, bg: "#f3f6f9", lines: [sansT("TWISTED LOVE", 14, "#3b86c9"), sansT("ANA HUANG", 7.6, "#5b6b7c")] },
  { kind: "spine", key: "bettermovies", w: 34, h: 118, bg: "#6cc3ea", lines: [sansT("BETTER THAN", 12, "#ffe23a"), sansT("THE MOVIES", 12, "#ffe23a"), sansT("LYNN PAINTER", 6.4, "#ffffff")], lean: 10 },
];

// Lying flat, bottom to top: long titles read better across the shelf.
const NONFICTION: Flat[] = [
  { key: "talk", len: 112, t: 38, bg: "#45b6e6", lines: [sansT("MAYBE YOU SHOULD", 10.6, "#111111"), sansT("TALK TO SOMEONE", 10.6, "#111111"), serifT("Lori Gottlieb", 9, "#ffffff")], band: "#f08a24" },
  { key: "perry", len: 106, t: 32, bg: "#141414", lines: [sansT("MATTHEW PERRY", 12.6, "#ffffff"), italicT("Friends, Lovers, and the", 7.2, "#e8e2d6"), italicT("Big Terrible Thing", 7.2, "#e8e2d6")] },
];

function fit(line: Text, avail: number) {
  const f = FACES[line.face];
  const needed = line.text.length * line.size * (f.k + f.spacing);
  return needed > avail ? Math.max(line.size * 0.8, (line.size * avail) / needed) : line.size;
}

// Lines run along `avail` and are stacked across `room` (the spine's width or the book's thickness).
function Lines({ lines, avail, room }: { lines: Text[]; avail: number; room: number }) {
  let gap = lines.length > 2 ? 1.6 : 2.4;
  let sizes = lines.map((line) => fit(line, avail));
  let total = sizes.reduce((sum, size) => sum + size, 0) + gap * (lines.length - 1);
  if (total > room) {
    const k = room / total;
    sizes = sizes.map((size) => size * k);
    gap *= k;
    total = room;
  }
  let at = -total / 2;
  return <>{lines.map((line, i) => {
    const f = FACES[line.face];
    const size = sizes[i];
    const y = at + size / 2;
    at += size + gap;
    const tooLong = line.text.length * size * (f.k + f.spacing) > avail;
    return <text key={line.text} x={0} y={y} fontSize={size} fill={line.fill} textAnchor="middle" dominantBaseline="central"
      style={{ fontFamily: f.family, fontWeight: f.weight, fontStyle: f.italic ? "italic" : undefined, letterSpacing: `${f.spacing}em` }}
      {...(tooLong ? { textLength: avail, lengthAdjust: "spacingAndGlyphs" } : {})}>{line.text}</text>;
  })}</>;
}

function MarkGlyph({ kind, x, y, fill }: { kind: Mark; x: number; y: number; fill: string }) {
  switch (kind) {
    case "bolt": return <path d={`M${x + 1.8} ${y - 5} L${x - 2.6} ${y + 0.6} L${x} ${y + 0.6} L${x - 1.8} ${y + 5} L${x + 2.6} ${y - 0.9} L${x} ${y - 0.9} Z`} fill={fill} />;
    case "flower": return <g fill={fill}>{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={x} cy={y - 2.6} rx="1.7" ry="2.8" transform={`rotate(${a} ${x} ${y})`} />)}<circle cx={x} cy={y} r="1.3" fill="#f6d36a" /></g>;
    case "bird": return <path d={`M${x - 4} ${y + 0.6} C ${x - 2} ${y - 2.6}, ${x + 1.4} ${y - 2.6}, ${x + 4} ${y - 0.6} L${x + 5.2} ${y - 1.8} L${x + 4.4} ${y + 0.6} C ${x + 1.4} ${y + 2.6}, ${x - 2} ${y + 2.2}, ${x - 4} ${y + 0.6} Z`} fill={fill} />;
    case "house": return <path d={`M${x - 3.4} ${y + 3.2} V${y - 0.5} L${x} ${y - 3.6} L${x + 3.4} ${y - 0.5} V${y + 3.2} Z`} fill={fill} />;
    case "keyhole": return <path d={`M${x} ${y - 4} a2.4 2.4 0 1 1 0.01 0 Z M${x - 1.4} ${y - 1} L${x + 1.4} ${y - 1} L${x + 2} ${y + 4} L${x - 2} ${y + 4} Z`} fill={fill} />;
  }
}

// Paperback finish shared by spines and flat books: the rounded fold, a little sheen, paper grain.
function Finish({ x, y, w, h, flat }: { x: number; y: number; w: number; h: number; flat?: boolean }) {
  return <>
    <rect x={x} y={y} width={w} height={h} rx="1.8" fill={flat ? "url(#bs-flat)" : "url(#bs-spine)"} />
    <rect x={x} y={y} width={w} height={h} rx="1.8" fill="url(#bs-grain-paper)" opacity="0.3" />
  </>;
}

// A paperback standing spine-out, lettered top to bottom as English spines are.
function SpineBook({ b, x, bottom }: { b: Spine; x: number; bottom: number }) {
  const y = bottom - b.h;
  const head = b.num ? 18 : 9;
  const foot = b.mark ? 16 : 9;
  const avail = b.h - head - foot;
  const body = <g>
    <rect x={x} y={y} width={b.w} height={b.h} rx="1.8" fill={b.bg} />
    {b.band && <>
      <rect x={x} y={y + 4} width={b.w} height="3" fill={b.band} opacity="0.9" />
      <rect x={x} y={bottom - 7} width={b.w} height="3" fill={b.band} opacity="0.9" />
    </>}
    <g transform={`translate(${x + b.w / 2} ${y + head + avail / 2}) rotate(90)`}>
      <Lines lines={b.lines} avail={avail} room={b.w - 5} />
    </g>
    {b.num && <>
      <circle cx={x + b.w / 2} cy={y + 9.5} r="5.6" fill="none" stroke={b.num.fill} strokeWidth="0.9" />
      <text x={x + b.w / 2} y={y + 9.8} fontSize="7.4" fill={b.num.fill} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: FACES.sans.family, fontWeight: 600 }}>{b.num.n}</text>
    </>}
    {b.mark && <MarkGlyph kind={b.mark.kind} x={x + b.w / 2} y={bottom - 8.5} fill={b.mark.fill} />}
    <Finish x={x} y={y} w={b.w} h={b.h} />
    {/* worn corners at the head and tail */}
    <rect x={x + 0.6} y={y + 0.4} width={b.w - 1.2} height="0.9" rx="0.45" fill="#fff" opacity="0.18" />
    <rect x={x + 0.6} y={bottom - 1.3} width={b.w - 1.2} height="0.9" rx="0.45" fill="#000" opacity="0.25" />
  </g>;
  return b.lean ? <g transform={`rotate(${-b.lean} ${x + b.w} ${bottom})`}>{body}</g> : body;
}

// A book standing face-out, leaning back on the wall: the real cover, its page block just
// visible on the right.
function CoverBook({ c, x, bottom }: { c: Cover; x: number; bottom: number }) {
  const y = bottom - c.h;
  const clip = `bs-clip-${c.key}`;
  return <g>
    <path d={`M${x + c.w} ${y + 1} L${x + c.w + c.depth} ${y + 3.5} L${x + c.w + c.depth} ${bottom - 0.5} L${x + c.w} ${bottom} Z`} fill="#efe6d2" />
    {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${x + c.w} ${y + 3 + i * ((c.h - 6) / 9)} L${x + c.w + c.depth} ${y + 5 + i * ((c.h - 8) / 9)}`} stroke="#cbbd9c" strokeWidth="0.4" />)}
    <clipPath id={clip}><rect x={x} y={y} width={c.w} height={c.h} rx="1.6" /></clipPath>
    <image href={c.src} x={x} y={y} width={c.w} height={c.h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clip})`}>
      <title>{c.alt}</title>
    </image>
    <rect x={x} y={y} width={c.w} height={c.h} rx="1.6" fill="url(#bs-cover-sheen)" />
    <rect x={x} y={y} width="2.2" height={c.h} fill="#000" opacity="0.22" />
    <rect x={x} y={y} width={c.w} height={c.h} rx="1.6" fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="0.6" />
  </g>;
}

// A book lying flat, spine towards the room, pages showing at its right end.
function FlatBook({ b, x, y }: { b: Flat; x: number; y: number }) {
  const pages = 6;
  const avail = b.len - pages - 12;
  return <g>
    <rect x={x} y={y} width={b.len} height={b.t} rx="2" fill={b.bg} />
    {b.band && <rect x={x + 4} y={y} width="3.2" height={b.t} fill={b.band} />}
    <rect x={x + b.len - pages} y={y + 2} width={pages} height={b.t - 4} fill="#efe6d2" />
    {Array.from({ length: Math.floor((b.t - 6) / 2.2) }, (_, i) => <rect key={i} x={x + b.len - pages} y={y + 3.2 + i * 2.2} width={pages} height="0.5" fill="#cbbd9c" />)}
    <g transform={`translate(${x + (b.len - pages) / 2 + 2} ${y + b.t / 2})`}>
      <Lines lines={b.lines} avail={avail} room={b.t - 5} />
    </g>
    <Finish x={x} y={y} w={b.len - pages} h={b.t} flat />
  </g>;
}

// The leaning book rests on its bottom-right corner with its top against its left neighbour.
function leanLeft(b: Spine, neighbourRight: number) {
  const a = ((b.lean ?? 0) * Math.PI) / 180;
  return neighbourRight + b.w * Math.cos(a) + b.h * Math.sin(a) - b.w;
}

function Row({ items, bottom, after }: { items: Item[]; bottom: number; after?: (x: number) => JSX.Element }) {
  let x = START;
  const placed = items.map((item) => {
    const at = item.kind === "spine" && item.lean ? leanLeft(item, x - GAP) : x;
    x = at + item.w + (item.kind === "cover" ? item.depth + 5 : GAP);
    return { item, at };
  });
  return <g>
    {/* Soft shadow the books throw on the wall, the lamp being to their left */}
    <g filter="url(#bs-soft)" opacity="0.34">
      {placed.map(({ item, at }) => <rect key={item.key} x={at + 3.5} y={bottom - item.h + 2} width={item.w + (item.kind === "cover" ? item.depth : 0)} height={item.h - 2} fill="#000"
        transform={item.kind === "spine" && item.lean ? `rotate(${-item.lean} ${at + item.w} ${bottom})` : undefined} />)}
    </g>
    {placed.map(({ item, at }) => item.kind === "spine"
      ? <SpineBook key={item.key} b={item} x={at} bottom={bottom} />
      : <CoverBook key={item.key} c={item} x={at} bottom={bottom} />)}
    {/* contact shadow where the books meet the shelf */}
    <rect x={START - 2} y={bottom - 2.2} width={x - START + 2} height="2.2" fill="url(#bs-contact)" />
    {after?.(x)}
  </g>;
}

function Plank({ top }: { top: number }) {
  return <g>
    <rect x={LEFT} y={top + PLANK} width={RIGHT - LEFT} height="18" fill="url(#bs-under)" />
    <rect x={LEFT} y={top} width={RIGHT - LEFT} height={PLANK} rx="1.5" fill="url(#bs-wood)" />
    <rect x={LEFT} y={top} width={RIGHT - LEFT} height={PLANK} rx="1.5" fill="url(#bs-grain)" opacity="0.5" />
    <rect x={LEFT} y={top} width={RIGHT - LEFT} height="1.4" rx="0.7" fill="#d9a074" opacity="0.7" />
    <rect x={LEFT} y={top + PLANK - 1.6} width={RIGHT - LEFT} height="1.6" fill="#3a1d0e" opacity="0.55" />
  </g>;
}

export default function FloatingBookshelf() {
  const [r1, r2, r3] = ROWS;
  return <g>
    <defs>
      <linearGradient id="bs-spine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.38" />
        <stop offset="0.07" stopColor="#000" stopOpacity="0.05" />
        <stop offset="0.24" stopColor="#fff" stopOpacity="0.2" />
        <stop offset="0.42" stopColor="#fff" stopOpacity="0.04" />
        <stop offset="0.8" stopColor="#000" stopOpacity="0.1" />
        <stop offset="0.94" stopColor="#000" stopOpacity="0.28" />
        <stop offset="1" stopColor="#000" stopOpacity="0.45" />
      </linearGradient>
      <linearGradient id="bs-flat" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
        <stop offset="0.25" stopColor="#fff" stopOpacity="0.05" />
        <stop offset="0.7" stopColor="#000" stopOpacity="0.06" />
        <stop offset="1" stopColor="#000" stopOpacity="0.36" />
      </linearGradient>
      <linearGradient id="bs-cover-sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
        <stop offset="0.35" stopColor="#fff" stopOpacity="0.04" />
        <stop offset="1" stopColor="#000" stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="bs-contact" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.45" />
      </linearGradient>
      <pattern id="bs-grain-paper" width="96" height="96" patternUnits="userSpaceOnUse">
        <image href="/concepts/desk/books/paper-grain.png" width="96" height="96" />
      </pattern>
      <linearGradient id="bs-wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a8643d" />
        <stop offset="0.5" stopColor="#8a4f2e" />
        <stop offset="1" stopColor="#5e3219" />
      </linearGradient>
      <pattern id="bs-grain" width="120" height="11" patternUnits="userSpaceOnUse">
        <path d="M0 3 C 30 2, 60 4.5, 120 3 M0 6.5 C 40 5.5, 80 8, 120 6.5 M0 9 C 25 8.4, 70 9.8, 120 8.8" stroke="#3a1d0e" strokeWidth="0.6" fill="none" opacity="0.6" />
        <ellipse cx="78" cy="5.4" rx="5" ry="1.4" fill="none" stroke="#3a1d0e" strokeWidth="0.5" opacity="0.5" />
      </pattern>
      <linearGradient id="bs-under" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.42" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </linearGradient>
      <filter id="bs-soft" x="-10%" y="-10%" width="130%" height="130%">
        <feGaussianBlur stdDeviation="1.8" />
      </filter>
    </defs>

    {/* Top shelf: the Harry Potter set, then two classics */}
    <Row items={[...HARRY_POTTER, ...CLASSICS]} bottom={r1} />
    <Plank top={r1} />

    {/* Middle shelf: the thrillers, and two memoir-ish reads lying flat */}
    <Row items={THRILLERS} bottom={r2} after={(x) => {
      const [talk, perry] = NONFICTION;
      const at = x + 6;
      return <g>
        <g filter="url(#bs-soft)" opacity="0.3">
          <rect x={at + 3.5} y={r2 - talk.t - perry.t + 2} width={talk.len} height={talk.t + perry.t - 2} fill="#000" />
        </g>
        <FlatBook b={talk} x={at} y={r2 - talk.t} />
        <FlatBook b={perry} x={at + 3} y={r2 - talk.t - perry.t} />
      </g>;
    }} />
    <Plank top={r2} />

    {/* Bottom shelf: the romances, the last one leaning */}
    <Row items={ROMANCE} bottom={r3} />
    <Plank top={r3} />
  </g>;
}
