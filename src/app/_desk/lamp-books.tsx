import { EB_Garamond, Oswald } from "next/font/google";
import { Editable, Layer } from "./editable";
import type { EditableId } from "./editable-ids";

// The stack of books the desk lamp stands on, composed after the photo Diya picked: paperbacks
// and one hardback lying flat with their spines to the room, each spine lettered like its edition
// (author, title, a small publisher-style mark at the end). Only books Diya recommends. By default
// they are stacked neatly, longest at the bottom; each book is its own editable object, so Diya can
// drag, rotate or reorder them in edit mode. The stack is centred on x with its base on the desk
// line y; it is STACK_HEIGHT tall, which is how far the lamp is raised.

const sans = Oswald({ subsets: ["latin"], weight: ["500", "600"], display: "swap" });
const serif = EB_Garamond({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], display: "swap" });

type Face = "sans" | "serif" | "italic";

// Rough advance width per character as a fraction of the font size, so a line that would run
// past its slot is squeezed to fit instead.
const FACES: Record<Face, { family: string; weight: number; italic?: boolean; spacing: number; k: number }> = {
  sans: { family: sans.style.fontFamily, weight: 600, spacing: 0.06, k: 0.52 },
  serif: { family: serif.style.fontFamily, weight: 600, spacing: 0.02, k: 0.5 },
  italic: { family: serif.style.fontFamily, weight: 500, italic: true, spacing: 0, k: 0.43 },
};

type Line = { text: string; face: Face; size: number; fill: string; at: number; anchor: "start" | "middle" | "end"; max: number };
type Mark = "circle" | "flower" | "keyhole" | "bird" | "leaf";

type Book = {
  id: EditableId;
  w: number; // spine length
  t: number; // thickness
  dx: number; // offset of the spine's centre from the stack's centre
  bg: string;
  edge: string; // a slightly darker colour for the worn top edge
  lines: Line[];
  mark?: { kind: Mark; fill: string; at: number };
  band?: { from: number; to: number; fill: string };
  flipped?: boolean;
};

// Bottom to top, longest first. `at` is a fraction of the spine length.
const BOOKS: Book[] = [
  {
    id: "lamp-book-phoenix", w: 150, t: 22, dx: 0, bg: "#1f2f55", edge: "#2c4072",
    lines: [
      { text: "J.K. ROWLING", face: "sans", size: 7, fill: "#e9d9a6", at: 0.05, anchor: "start", max: 34 },
      { text: "HARRY POTTER", face: "sans", size: 9.6, fill: "#f3e3b0", at: 0.53, anchor: "middle", max: 62 },
      { text: "and the Order of the Phoenix", face: "italic", size: 6.4, fill: "#e9d9a6", at: 0.53, anchor: "middle", max: 70 },
    ],
    mark: { kind: "circle", fill: "#e9d9a6", at: 0.93 },
  },
  {
    id: "lamp-book-gottlieb", w: 134, t: 19, dx: -2, bg: "#d7e8ee", edge: "#c3d9e1",
    lines: [
      { text: "LORI GOTTLIEB", face: "sans", size: 6, fill: "#c2433b", at: 0.06, anchor: "start", max: 36 },
      { text: "MAYBE YOU SHOULD", face: "serif", size: 6.6, fill: "#1f3550", at: 0.6, anchor: "middle", max: 66 },
      { text: "TALK TO SOMEONE", face: "serif", size: 7.6, fill: "#1f3550", at: 0.6, anchor: "middle", max: 66 },
    ],
    mark: { kind: "leaf", fill: "#2f6f74", at: 0.95 },
  },
  {
    id: "lamp-book-it-ends", w: 128, t: 17, dx: 2, bg: "#f6f1e8", edge: "#e6ddcd",
    band: { from: 0, to: 0.12, fill: "#e8a6b4" },
    lines: [
      { text: "IT ENDS WITH US", face: "serif", size: 8.6, fill: "#b8405f", at: 0.45, anchor: "middle", max: 60 },
      { text: "COLLEEN HOOVER", face: "sans", size: 5.4, fill: "#4b3a3e", at: 0.85, anchor: "middle", max: 29 },
    ],
    mark: { kind: "flower", fill: "#d9738b", at: 0.06 },
  },
  {
    id: "lamp-book-housemaid", w: 126, t: 18, dx: -1, bg: "#141414", edge: "#262626",
    lines: [
      { text: "FREIDA McFADDEN", face: "sans", size: 6.2, fill: "#f2c230", at: 0.06, anchor: "start", max: 40 },
      { text: "THE HOUSEMAID", face: "sans", size: 9.4, fill: "#f5f2ea", at: 0.62, anchor: "middle", max: 58 },
    ],
    mark: { kind: "keyhole", fill: "#f2c230", at: 0.94 },
  },
  {
    id: "lamp-book-mockingbird", w: 122, t: 14, dx: 1, bg: "#1b1a18", edge: "#2b2925",
    lines: [
      { text: "HARPER LEE", face: "sans", size: 5.6, fill: "#e98b3a", at: 0.04, anchor: "start", max: 29 },
      { text: "To Kill a Mockingbird", face: "serif", size: 8, fill: "#f2ead8", at: 0.55, anchor: "middle", max: 58 },
    ],
    mark: { kind: "bird", fill: "#f2ead8", at: 0.94 },
  },
  {
    id: "lamp-book-gone", w: 120, t: 15, dx: 0, bg: "#1e4b4f", edge: "#2a5f63",
    lines: [
      { text: "LISA JEWELL", face: "sans", size: 6.4, fill: "#f2d7a8", at: 0.07, anchor: "start", max: 32 },
      { text: "THEN SHE WAS GONE", face: "sans", size: 8.2, fill: "#f6f1e6", at: 0.62, anchor: "middle", max: 62 },
    ],
    mark: { kind: "circle", fill: "#f2d7a8", at: 0.94 },
  },
];

export const STACK_HEIGHT = BOOKS.reduce((sum, book) => sum + book.t, 0);

function fitted(line: Line, x: number, y: number) {
  const face = FACES[line.face];
  const estimate = line.text.length * line.size * (face.k + face.spacing);
  return <text
    x={x}
    y={y}
    textAnchor={line.anchor}
    dominantBaseline="central"
    fontFamily={face.family}
    fontWeight={face.weight}
    fontStyle={face.italic ? "italic" : undefined}
    fontSize={line.size}
    letterSpacing={`${face.spacing}em`}
    fill={line.fill}
    {...(estimate > line.max ? { textLength: line.max, lengthAdjust: "spacingAndGlyphs" } : {})}
  >{line.text}</text>;
}

function MarkShape({ kind, x, y, fill }: { kind: Mark; x: number; y: number; fill: string }) {
  switch (kind) {
    case "circle":
      return <g><circle cx={x} cy={y} r="3.2" fill="none" stroke={fill} strokeWidth="0.9" /><circle cx={x} cy={y} r="1.1" fill={fill} /></g>;
    case "flower":
      return <g fill={fill}>{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={x} cy={y - 1.8} rx="1" ry="1.8" transform={`rotate(${a} ${x} ${y})`} />)}<circle cx={x} cy={y} r="0.9" fill="#f6e7a8" /></g>;
    case "keyhole":
      return <path d={`M${x} ${y - 3.4} a2 2 0 1 1 0.01 0 Z M${x - 1} ${y - 0.6} L${x + 1} ${y - 0.6} L${x + 1.6} ${y + 3.4} L${x - 1.6} ${y + 3.4} Z`} fill={fill} />;
    case "bird":
      return <path d={`M${x - 3.4} ${y} Q${x - 1.4} ${y - 2.6} ${x} ${y - 0.4} Q${x + 1.4} ${y - 2.6} ${x + 3.4} ${y} Q${x + 1.4} ${y - 1.2} ${x} ${y + 0.8} Q${x - 1.4} ${y - 1.2} ${x - 3.4} ${y} Z`} fill={fill} />;
    case "leaf":
      return <path d={`M${x - 3} ${y + 2.6} Q${x - 3} ${y - 3}, ${x + 3} ${y - 3} Q${x + 3} ${y + 2.6}, ${x - 3} ${y + 2.6} Z`} fill={fill} />;
  }
}

function SpineBook({ book, cx, top }: { book: Book; cx: number; top: number }) {
  const x0 = cx + book.dx - book.w / 2;
  const mid = top + book.t / 2;
  // Lines that share a position stack into two rows on the spine (title over subtitle).
  const rows = new Map<number, Line[]>();
  for (const line of book.lines) rows.set(line.at, [...(rows.get(line.at) ?? []), line]);
  const content = <g>
    {book.band && <rect x={x0 + book.w * book.band.from} y={top} width={book.w * (book.band.to - book.band.from)} height={book.t} fill={book.band.fill} />}
    {Array.from(rows.entries()).flatMap(([at, lines]) => lines.map((line, i) => {
      const offset = lines.length === 1 ? 0 : (i - (lines.length - 1) / 2) * book.t * 0.42;
      return <g key={`${at}-${i}`}>{fitted(line, x0 + book.w * at, mid + offset)}</g>;
    }))}
    {book.mark && <MarkShape kind={book.mark.kind} x={x0 + book.w * book.mark.at} y={mid} fill={book.mark.fill} />}
  </g>;
  return <g>
    <rect x={x0} y={top} width={book.w} height={book.t} rx="2" fill={book.bg} />
    {book.flipped ? <g transform={`rotate(180 ${x0 + book.w / 2} ${mid})`}>{content}</g> : content}
    {/* Rounded spine: light along the top, shade underneath, darker at both ends */}
    <rect x={x0} y={top} width={book.w} height={book.t} rx="2" fill="url(#lamp-books-round)" />
    <rect x={x0} y={top} width={book.w} height={book.t} rx="2" fill="url(#lamp-books-ends)" />
    <rect x={x0} y={top} width={book.w} height={book.t} rx="2" fill="url(#lamp-books-grain)" opacity="0.35" />
    <rect x={x0 + 2} y={top + 0.4} width={book.w - 4} height="0.9" rx="0.45" fill={book.edge} opacity="0.9" />
    <rect x={x0 + 1.5} y={top + book.t - 1.2} width={book.w - 3} height="1.2" fill="#000" opacity="0.32" />
  </g>;
}

// Layer reads `id` from its direct children to apply each book's saved stacking order.
function LampBook({ id, book, cx, top }: { id: EditableId; book: Book; cx: number; top: number }) {
  return <Editable id={id}><SpineBook book={book} cx={cx} top={top} /></Editable>;
}

export default function LampBooks({ x, y }: { x: number; y: number }) {
  const tops: number[] = [];
  let top = y;
  for (const book of BOOKS) {
    top -= book.t;
    tops.push(top);
  }
  return <g>
    <defs>
      <linearGradient id="lamp-books-round" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.26" />
        <stop offset="0.28" stopColor="#fff" stopOpacity="0.04" />
        <stop offset="0.62" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.34" />
      </linearGradient>
      <linearGradient id="lamp-books-ends" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.3" />
        <stop offset="0.035" stopColor="#000" stopOpacity="0" />
        <stop offset="0.965" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.3" />
      </linearGradient>
      <pattern id="lamp-books-grain" width="96" height="96" patternUnits="userSpaceOnUse">
        <image href="/concepts/desk/books/paper-grain.png" width="96" height="96" />
      </pattern>
    </defs>
    <ellipse cx={x} cy={y + 0.5} rx="82" ry="3.4" fill="#000" opacity="0.34" />
    <Layer name="lamp-books">
      {BOOKS.map((book, i) => <LampBook key={book.id} id={book.id} book={book} cx={x} top={tops[i]} />)}
    </Layer>
  </g>;
}
