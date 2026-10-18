"use client";

import type { ReactNode } from "react";
import { Editable, Layer, useEditableProps } from "./editable";
import type { EditableId } from "./editable-ids";
import s from "./wall-display.module.css";

// Diya's wall display, after her reference photo: a black wire grid hung on two clear adhesive
// hooks, her prints held by wooden clothespins, a strand of warm copper micro lights wound through
// the wires, and a few things from her world. The grid
// keeps the old pegboard's footprint, so the board's saved position and size still apply.

type Pt = [number, number];

const GRID = { x: 24, y: 30, cols: 10, rows: 13, pitch: 39.6 };
const GRID_W = GRID.cols * GRID.pitch;
const GRID_H = GRID.rows * GRID.pitch;
const wireX = (i: number) => GRID.x + i * GRID.pitch;
const wireY = (j: number) => GRID.y + j * GRID.pitch;

// Grid wires as one path, so the wires and their shadow on the wall are drawn in one stroke each.
const GRID_PATH = [
  ...Array.from({ length: GRID.cols - 1 }, (_, i) => `M${wireX(i + 1)} ${GRID.y} V${GRID.y + GRID_H}`),
  ...Array.from({ length: GRID.rows - 1 }, (_, j) => `M${GRID.x} ${wireY(j + 1)} H${GRID.x + GRID_W}`),
].join(" ");

/* ---------- Prints ---------- */

// `onWall` prints hang from their own clear hook on the wall instead of clipping onto the grid.
type PrintSpec = { id: EditableId; src: string; x: number; y: number; photoW: number; photoH: number; tilt: number; onWall?: boolean };
const PRINT_BORDER = 4;
const PRINT_FOOT = 11;
// Prints are a little larger than on the old pegboard, grown about their old centres so each one
// stays where Diya placed it.
const ENLARGE = 1.15;
const PRINTS: PrintSpec[] = [
  { id: "print-messi", src: "/concepts/desk/print-messi-full.webp", x: 202.5, y: 142, photoW: 60, photoH: 80, tilt: -2 },
  { id: "print-dear-zindagi", src: "/concepts/desk/print-dear-zindagi-full.webp", x: 277.5, y: 140, photoW: 45, photoH: 80, tilt: 1.4 },
  { id: "print-snoopy", src: "/concepts/desk/print-snoopy-full.webp", x: 337.5, y: 143, photoW: 64.4, photoH: 80, tilt: -1 },
  { id: "print-gym", src: "/concepts/desk/print-gym-full.webp", x: 209.5, y: 258, photoW: 63, photoH: 56, tilt: 1.6 },
  { id: "print-octocat", src: "/concepts/desk/print-octocat-full.webp", x: 288.5, y: 256, photoW: 106.4, photoH: 56, tilt: -1.2 },
  { id: "print-taylor", src: "/concepts/desk/print-taylor-full.webp", x: -149.6, y: 156, photoW: 51.2, photoH: 80, tilt: 2.2, onWall: true },
];

// A small clear adhesive hook with a steel J, for a print hung straight on the wall; (x, y) is the
// bottom of the hook's curve.
function WallHook({ x, y }: { x: number; y: number }) {
  const hook = `M${x} ${y - 13} V${y - 3} Q${x} ${y + 3} ${x + 4.5} ${y + 2} L${x + 5.5} ${y - 1.5}`;
  return <g>
    <rect x={x - 8} y={y - 20} width="16" height="18" rx="3.5" fill="#ffffff" fillOpacity="0.1" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="0.6" />
    <path d={hook} stroke="#000" strokeOpacity="0.35" strokeWidth="1.8" fill="none" strokeLinecap="round" transform="translate(1 1.5)" />
    <path d={hook} stroke="url(#wd-steel)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </g>;
}

// A wooden mini clothespin seen from the front; (x, y) is where its jaws bite the paper's top edge.
function Clothespin({ x, y, angle = 0 }: { x: number; y: number; angle?: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <rect x="-2.6" y="-17" width="7.4" height="25" rx="1.6" fill="#000" opacity="0.32" filter="url(#wd-soft)" />
    <rect x="-3.7" y="-18.5" width="3.6" height="25" rx="1.3" fill="url(#wd-wood)" />
    <rect x="0.1" y="-18.5" width="3.6" height="25" rx="1.3" fill="url(#wd-wood-dark)" />
    <path d="M-2.6 -16 V4 M1.4 -15 V3.5 M2.6 -17 V-6" stroke="#8a5f34" strokeOpacity="0.35" strokeWidth="0.35" />
    <rect x="-4.4" y="-9.6" width="8.8" height="3.6" rx="1.4" fill="url(#wd-steel)" />
    <path d="M-3.8 -8.6 H3.8 M-3.8 -7 H3.8" stroke="#2e3238" strokeOpacity="0.55" strokeWidth="0.45" />
    <path d="M-3.5 -18 H-0.4" stroke="#fff3dc" strokeOpacity="0.55" strokeWidth="0.6" strokeLinecap="round" />
  </g>;
}

function WallPrint({ id, src, x, y, photoW, photoH, tilt, onWall }: PrintSpec) {
  const { src: image, caption } = useEditableProps(id, { src, caption: "" });
  const oldW = photoW + PRINT_BORDER * 2;
  const oldH = photoH + PRINT_BORDER + PRINT_FOOT;
  const pw = photoW * ENLARGE;
  const ph = photoH * ENLARGE;
  const w = pw + PRINT_BORDER * 2;
  const h = ph + PRINT_BORDER + PRINT_FOOT;
  const cx = x + oldW / 2;
  const top = y + oldH / 2 - h / 2;
  const left = cx - w / 2;
  const px = left + PRINT_BORDER;
  const py = top + PRINT_BORDER;
  return <Editable id={id}>
    {onWall && <WallHook x={cx} y={top - 15} />}
    <g transform={`rotate(${tilt} ${cx} ${top})`}>
      <rect x={left + 2} y={top + 3.5} width={w} height={h} rx="1" fill="#000" opacity="0.42" filter="url(#wd-soft)" />
      <rect x={left} y={top} width={w} height={h} rx="1" fill="url(#wd-paper)" />
      <rect x={px} y={py} width={pw} height={ph} fill="#fff" />
      <image href={image} x={px} y={py} width={pw} height={ph} preserveAspectRatio="xMidYMid meet" />
      <rect x={px} y={py} width={pw} height={ph} fill="url(#wd-gloss)" />
      <rect x={px + 0.25} y={py + 0.25} width={pw - 0.5} height={ph - 0.5} fill="none" stroke="#000" strokeOpacity="0.16" strokeWidth="0.5" />
      {/* the paper curls very slightly away from the wall at its lower corners */}
      <path d={`M${left} ${top + h - 6} L${left} ${top + h} L${left + 7} ${top + h}`} stroke="#000" strokeOpacity="0.12" strokeWidth="1" fill="none" />
      {caption && <text x={cx} y={top + h - 3.4} textAnchor="middle" className={s.caption}>{caption}</text>}
      <Clothespin x={cx} y={top + 2} angle={-tilt * 2.5} />
    </g>
  </Editable>;
}

/* ---------- Things from Diya's world ---------- */

// Three frames of Diya's portrait in black and white, like a photo-booth strip.
const STRIP_CROPS = ["200 140 320 363", "110 40 500 568", "270 260 210 238"];

function PhotoStrip({ id }: { id: EditableId }) {
  const x = 152;
  const y = 82;
  const fw = 42;
  const fh = 48;
  return <Editable id={id}>
    <g transform={`rotate(-6 ${x + 27} ${y})`}>
      <rect x={x + 2.4} y={y + 4} width="54" height="186" rx="1" fill="#000" opacity="0.4" filter="url(#wd-soft)" />
      <rect x={x} y={y} width="54" height="186" rx="1" fill="url(#wd-paper)" />
      <text x={x + 27} y={y + 11} textAnchor="middle" className={s.stripHead}>photo booth</text>
      {STRIP_CROPS.map((viewBox, i) => {
        const fy = y + 16 + i * (fh + 5);
        return <g key={viewBox}>
          <svg x={x + 6} y={fy} width={fw} height={fh} viewBox={viewBox} preserveAspectRatio="xMidYMid slice">
            <image href="/concepts/diya-portrait-720.webp" width="720" height="720" filter="url(#wd-bw)" />
          </svg>
          <rect x={x + 6} y={fy} width={fw} height={fh} fill="url(#wd-gloss)" />
        </g>;
      })}
      <path d={`M${x + 8} ${y + 179} H${x + 46}`} stroke="#b8b1a3" strokeWidth="0.5" />
      <Clothespin x={x + 27} y={y + 2} angle={3} />
    </g>
  </Editable>;
}

// Sunglasses hooked over the top wire by one arm.
function Sunglasses({ id }: { id: EditableId }) {
  const hx = wireX(7);
  const hy = wireY(1);
  return <Editable id={id}>
    <g transform={`rotate(-9 ${hx} ${hy})`}>
      <g opacity="0.35" filter="url(#wd-soft)" transform="translate(3 5)">
        <path d={`M${hx - 2} ${hy} L${hx - 2} ${hy + 10}`} stroke="#000" strokeWidth="2.6" />
        <path d={`M${hx - 32} ${hy + 10} h64 v6 c0 9 -6 15 -14 15 c-8 0 -12 -6 -14 -12 h-8 c-2 6 -6 12 -14 12 c-8 0 -14 -6 -14 -15 Z`} fill="#000" />
      </g>
      {/* the arm hooked over the wire */}
      <path d={`M${hx - 3.5} ${hy + 11} L${hx - 3.5} ${hy - 1.5} Q${hx - 3.5} ${hy - 5} ${hx} ${hy - 5} Q${hx + 3.5} ${hy - 5} ${hx + 3.5} ${hy - 1}`} stroke="#15161a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d={`M${hx - 4.3} ${hy + 9} L${hx - 4.3} ${hy - 1}`} stroke="#5d626b" strokeOpacity="0.6" strokeWidth="0.6" />
      {/* frame and lenses */}
      <path d={`M${hx - 33} ${hy + 9} h66 v2.4 h-66 Z`} fill="#1a1b1f" />
      {[-1, 1].map((side) => {
        const lx = hx + side * 16;
        return <g key={side}>
          <path d={`M${lx - 15} ${hy + 10} h30 v6 c0 9 -5.5 15 -13.5 15 h-3 c-8 0 -13.5 -6 -13.5 -15 Z`} fill="#1a1b1f" />
          <path d={`M${lx - 13} ${hy + 12} h26 v4.6 c0 7.4 -4.6 12.4 -11.4 12.4 h-3.2 c-6.8 0 -11.4 -5 -11.4 -12.4 Z`} fill="url(#wd-lens)" />
          <path d={`M${lx - 10} ${hy + 14} L${lx - 4} ${hy + 14} L${lx - 9} ${hy + 25}`} fill="#fff" opacity="0.13" />
        </g>;
      })}
      <path d={`M${hx - 3} ${hy + 13} Q${hx} ${hy + 10.5} ${hx + 3} ${hy + 13}`} stroke="#1a1b1f" strokeWidth="2.2" fill="none" />
      <path d={`M${hx - 32} ${hy + 9.6} h64`} stroke="#6f747d" strokeOpacity="0.55" strokeWidth="0.6" />
    </g>
  </Editable>;
}

// A Platform 9¾ ticket for the Harry Potter shelf's owner.
function Ticket({ id }: { id: EditableId }) {
  const x = 232;
  const y = 134;
  return <Editable id={id}>
    <g transform={`rotate(5 ${x + 48} ${y})`}>
      <rect x={x + 2} y={y + 3.5} width="96" height="47" rx="2" fill="#000" opacity="0.4" filter="url(#wd-soft)" />
      <rect x={x} y={y} width="96" height="47" rx="2" fill="url(#wd-ticket)" />
      <rect x={x} y={y} width="96" height="9" rx="2" fill="#7b1f22" />
      <rect x={x} y={y + 6} width="96" height="3" fill="#7b1f22" />
      <text x={x + 36} y={y + 6.6} textAnchor="middle" className={s.ticketBand}>HOGWARTS EXPRESS</text>
      <text x={x + 36} y={y + 26} textAnchor="middle" className={s.ticketBig}>Platform 9¾</text>
      <text x={x + 36} y={y + 38} textAnchor="middle" className={s.ticketSmall}>KING&apos;S CROSS · LONDON</text>
      <path d={`M${x + 73} ${y + 10} V${y + 46}`} stroke="#7b1f22" strokeOpacity="0.55" strokeWidth="0.6" strokeDasharray="1.6 1.6" />
      <text x={x + 85} y={y + 30} textAnchor="middle" className={s.ticketStub}>9¾</text>
      <text x={x + 85} y={y + 39} textAnchor="middle" className={s.ticketSmall}>ONE WAY</text>
      <rect x={x} y={y} width="96" height="47" rx="2" fill="url(#wd-gloss)" />
      <Clothespin x={x + 85} y={y + 2} angle={-4} />
    </g>
  </Editable>;
}

// An index card with a commit message in Diya's own words about engineering's messy middle.
function CommitCard({ id }: { id: EditableId }) {
  const text = useEditableProps(id, { line1: "$ git commit -m", line2: "\"the messy middle\"" });
  const x = 236;
  const y = 244;
  return <Editable id={id}>
    <g transform={`rotate(-3 ${x + 56} ${y})`}>
      <rect x={x + 2} y={y + 3.5} width="112" height="64" rx="1" fill="#000" opacity="0.4" filter="url(#wd-soft)" />
      <rect x={x} y={y} width="112" height="64" rx="1" fill="url(#wd-paper)" />
      <path d={`M${x} ${y + 13} H${x + 112}`} stroke="#d7737b" strokeOpacity="0.75" strokeWidth="0.6" />
      {[21, 29, 37, 45, 53].map((dy) => <path key={dy} d={`M${x} ${y + dy} H${x + 112}`} stroke="#8fb2d9" strokeOpacity="0.55" strokeWidth="0.4" />)}
      <text x={x + 8} y={y + 27} className={s.code}>{text.line1}</text>
      <text x={x + 8} y={y + 42} className={s.codeStrong}>{text.line2}</text>
      <Clothespin x={x + 56} y={y + 2} angle={5} />
    </g>
  </Editable>;
}

// A beaded friendship bracelet looped over a wire, with letter beads.
const BEAD_COLOURS = ["#f3b7c7", "#c9b6e8", "#f6e3a1", "#9fd3cf", "#fbf7ee", "#e98ea6", "#b7d0f2"];

function Bracelet({ id }: { id: EditableId }) {
  const { beads } = useEditableProps(id, { beads: "LOVER" });
  const hx = wireX(9);
  const hy = wireY(5);
  const rx = 21;
  const ry = 28;
  const cy = hy + ry - 1.5;
  const letters = Array.from(beads.slice(0, 7));
  // Letter cubes sit side by side along the bottom of the loop, left to right; round beads fill the rest.
  const step = 9.2 / rx;
  const span = Math.max(letters.length - 1, 0) * step;
  const at = (angle: number): Pt => [hx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry];
  const count = 30;
  const round = Array.from({ length: count }, (_, i) => -Math.PI / 2 + ((i + 0.5) / count) * Math.PI * 2)
    .filter((angle) => !letters.length || Math.abs(angle - Math.PI / 2) > span / 2 + step * 0.62);
  return <Editable id={id}>
    <g>
      <ellipse cx={hx + 3} cy={cy + 5} rx={rx} ry={ry} fill="none" stroke="#000" strokeOpacity="0.32" strokeWidth="4" filter="url(#wd-soft)" />
      {round.map((angle, i) => {
        const [bx, by] = at(angle);
        return <g key={i}>
          <circle cx={bx} cy={by} r="2.9" fill={BEAD_COLOURS[i % BEAD_COLOURS.length]} />
          <circle cx={bx - 0.8} cy={by - 0.8} r="0.8" fill="#fff" opacity="0.75" />
        </g>;
      })}
      {letters.map((letter, k) => {
        const [bx, by] = at(Math.PI / 2 + span / 2 - k * step);
        return <g key={k} transform={`translate(${bx} ${by})`}>
          <rect x="-4.2" y="-4.2" width="8.4" height="8.4" rx="1.2" fill="#fbf8f1" stroke="#cfc8b8" strokeWidth="0.4" />
          <text y="2.5" textAnchor="middle" className={s.bead}>{letter}</text>
        </g>;
      })}
    </g>
  </Editable>;
}

// A blue evil-eye charm on a keyring, hanging from a wire crossing.
function EvilEye({ id }: { id: EditableId }) {
  const hx = wireX(4);
  const hy = wireY(7);
  return <Editable id={id}>
    <g>
      <g opacity="0.35" filter="url(#wd-soft)" transform="translate(3 5)">
        <circle cx={hx} cy={hy + 4} r="6" fill="none" stroke="#000" strokeWidth="1.6" />
        <path d={`M${hx} ${hy + 10} V${hy + 26}`} stroke="#000" strokeWidth="1.6" />
        <circle cx={hx} cy={hy + 35} r="9" fill="#000" />
      </g>
      <circle cx={hx} cy={hy + 4} r="6" fill="none" stroke="url(#wd-steel)" strokeWidth="1.5" />
      {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={hx} cy={hy + 12 + i * 4} rx="1.4" ry="2.2" fill="none" stroke="url(#wd-steel)" strokeWidth="0.9" />)}
      <circle cx={hx} cy={hy + 35} r="9.2" fill="#163e8c" />
      <circle cx={hx} cy={hy + 35} r="9.2" fill="url(#wd-glass)" />
      <circle cx={hx} cy={hy + 35} r="6.2" fill="#f7f5ef" />
      <circle cx={hx} cy={hy + 35} r="4.2" fill="#6fa8e0" />
      <circle cx={hx} cy={hy + 35} r="2.1" fill="#0d1220" />
      <ellipse cx={hx - 3.4} cy={hy + 31} rx="2.6" ry="1.5" fill="#fff" opacity="0.55" transform={`rotate(-30 ${hx - 3.4} ${hy + 31})`} />
    </g>
  </Editable>;
}

/* ---------- Micro lights ---------- */

// A copper-wire string of tiny warm LEDs that winds back and forth through the grid. Bulbs are spaced evenly along the wire.
function strand(start: Pt, segments: [Pt, Pt][], spacing: number) {
  let d = `M${start[0]} ${start[1]}`;
  const bulbs: Pt[] = [];
  let from = start;
  let last = start;
  let run = spacing * 0.5;
  for (const [ctrl, end] of segments) {
    d += ` Q${ctrl[0]} ${ctrl[1]} ${end[0]} ${end[1]}`;
    for (let i = 1; i <= 48; i++) {
      const t = i / 48;
      const x = (1 - t) ** 2 * from[0] + 2 * t * (1 - t) * ctrl[0] + t * t * end[0];
      const y = (1 - t) ** 2 * from[1] + 2 * t * (1 - t) * ctrl[1] + t * t * end[1];
      run += Math.hypot(x - last[0], y - last[1]);
      last = [x, y];
      if (run >= spacing) {
        bulbs.push([Number(x.toFixed(1)), Number(y.toFixed(1))]);
        run = 0;
      }
    }
    from = end;
  }
  return { d, bulbs };
}

const LIGHTS = strand([64, -86], [
  [[46, -20], [62, 42]],
  [[170, 118], [296, 52]],
  [[400, 58], [402, 150]],
  [[280, 232], [150, 214]],
  [[40, 200], [70, 300]],
  [[220, 380], [396, 320]],
  [[430, 420], [360, 470]],
  [[260, 520], [150, 500]],
], 27);

function MicroLights({ id }: { id: EditableId }) {
  return <Editable id={id}>
    <path d={LIGHTS.d} stroke="#000" strokeOpacity="0.35" strokeWidth="1.2" fill="none" transform="translate(2 3.5)" filter="url(#wd-soft)" />
    {LIGHTS.bulbs.map(([x, y], i) => <circle key={`g${i}`} cx={x} cy={y} r="11" fill="url(#wd-led-glow)" />)}
    <path d={LIGHTS.d} stroke="url(#wd-copper)" strokeWidth="0.9" fill="none" />
    {LIGHTS.bulbs.map(([x, y], i) => <g key={i}>
      <ellipse cx={x} cy={y} rx="1.9" ry="1.5" fill="#d9a35e" opacity="0.9" />
      <circle cx={x} cy={y} r="1.35" fill="#fff6dc" />
    </g>)}
  </Editable>;
}

/* ---------- The grid ---------- */

function GridPanel() {
  const right = GRID.x + GRID_W;
  const bottom = GRID.y + GRID_H;
  const hooks = [wireX(2) + 6, wireX(8) - 6];
  return <g>
    {/* warm light from the micro lights on the wall behind the grid */}
    <ellipse cx={GRID.x + GRID_W / 2} cy={GRID.y + GRID_H / 2} rx={GRID_W * 0.66} ry={GRID_H * 0.6} fill="url(#wd-wall-glow)" />
    {/* the clear adhesive hooks it hangs from */}
    {hooks.map((hx) => <g key={hx}>
      <rect x={hx - 15} y={GRID.y - 36} width="30" height="34" rx="6" fill="#ffffff" fillOpacity="0.1" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="0.8" />
      <rect x={hx - 12} y={GRID.y - 33} width="10" height="26" rx="4" fill="#ffffff" fillOpacity="0.08" />
      <path d={`M${hx} ${GRID.y - 22} V${GRID.y - 6} Q${hx} ${GRID.y + 4} ${hx + 7} ${GRID.y + 2.5} L${hx + 8.5} ${GRID.y - 3}`} stroke="#000" strokeOpacity="0.35" strokeWidth="2.6" fill="none" strokeLinecap="round" transform="translate(2 3)" filter="url(#wd-soft)" />
      <path d={`M${hx} ${GRID.y - 22} V${GRID.y - 6} Q${hx} ${GRID.y + 4} ${hx + 7} ${GRID.y + 2.5} L${hx + 8.5} ${GRID.y - 3}`} stroke="url(#wd-steel)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </g>)}
    {/* the wires' shadow on the wall, then the wires with a soft highlight from the lights */}
    <g transform="translate(3 5.5)" opacity="0.5" filter="url(#wd-soft)">
      <path d={GRID_PATH} stroke="#000" strokeWidth="2.2" fill="none" />
      <rect x={GRID.x} y={GRID.y} width={GRID_W} height={GRID_H} rx="5" stroke="#000" strokeWidth="3.6" fill="none" />
    </g>
    <path d={GRID_PATH} stroke="#121316" strokeWidth="2" fill="none" />
    <path d={GRID_PATH} stroke="#8a7f6c" strokeOpacity="0.45" strokeWidth="0.55" fill="none" transform="translate(-0.5 -0.5)" />
    <rect x={GRID.x} y={GRID.y} width={GRID_W} height={GRID_H} rx="5" stroke="#121316" strokeWidth="3.6" fill="none" />
    <rect x={GRID.x - 0.8} y={GRID.y - 0.8} width={GRID_W} height={GRID_H} rx="5" stroke="#9b8f79" strokeOpacity="0.4" strokeWidth="0.7" fill="none" />
    <path d={`M${right} ${GRID.y + 6} V${bottom - 6}`} stroke="#000" strokeOpacity="0.4" strokeWidth="1" />
  </g>;
}

function Defs() {
  return <defs>
    <filter id="wd-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6" /></filter>
    <filter id="wd-bw" colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values="0.3 0.55 0.15 0 -0.03  0.3 0.55 0.15 0 -0.03  0.3 0.55 0.15 0 -0.03  0 0 0 1 0" />
      <feComponentTransfer><feFuncR type="linear" slope="1.12" intercept="-0.04" /><feFuncG type="linear" slope="1.12" intercept="-0.04" /><feFuncB type="linear" slope="1.08" intercept="-0.02" /></feComponentTransfer>
    </filter>
    <radialGradient id="wd-wall-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#ffc979" stopOpacity="0.2" />
      <stop offset="0.6" stopColor="#ffc979" stopOpacity="0.07" />
      <stop offset="1" stopColor="#ffc979" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="wd-led-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#ffe2a6" stopOpacity="0.55" />
      <stop offset="0.35" stopColor="#ffc56e" stopOpacity="0.18" />
      <stop offset="1" stopColor="#ffc56e" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="wd-copper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#c98b4a" />
      <stop offset="0.5" stopColor="#8a5a2c" />
      <stop offset="1" stopColor="#d49a5c" />
    </linearGradient>
    <linearGradient id="wd-paper" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stopColor="#fdfbf6" />
      <stop offset="1" stopColor="#ebe4d6" />
    </linearGradient>
    <linearGradient id="wd-gloss" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
      <stop offset="0.4" stopColor="#fff" stopOpacity="0.03" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </linearGradient>
    <linearGradient id="wd-wood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#c99a63" />
      <stop offset="1" stopColor="#e2bd8a" />
    </linearGradient>
    <linearGradient id="wd-wood-dark" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#d7ad78" />
      <stop offset="1" stopColor="#b8854f" />
    </linearGradient>
    <linearGradient id="wd-steel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#eef0f3" />
      <stop offset="0.5" stopColor="#8c929c" />
      <stop offset="1" stopColor="#d3d7dc" />
    </linearGradient>
    <linearGradient id="wd-lens" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stopColor="#3b3f48" />
      <stop offset="0.55" stopColor="#1c1e24" />
      <stop offset="1" stopColor="#4a3a2a" />
    </linearGradient>
    <linearGradient id="wd-ticket" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#f3e9d0" />
      <stop offset="1" stopColor="#e2d3b0" />
    </linearGradient>
    <radialGradient id="wd-glass" cx="0.35" cy="0.3" r="0.75">
      <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
      <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
      <stop offset="1" stopColor="#000" stopOpacity="0.3" />
    </radialGradient>
  </defs>;
}

// `id` lets the room's Layer draw the whole rack at the pegboard's saved stacking order.
export default function WallDisplay({ quote }: { id: "pegboard"; quote: ReactNode }) {
  return <Editable id="pegboard">
    <Defs />
    <GridPanel />
    <Layer name="pegboard">
      {quote}
      <PhotoStrip id="photo-strip" />
      <Sunglasses id="sunglasses" />
      <Ticket id="ticket" />
      <CommitCard id="commit-card" />
      <Bracelet id="bracelet" />
      <EvilEye id="evil-eye" />
      {PRINTS.map((print) => <WallPrint key={print.id} {...print} />)}
      <MicroLights id="micro-lights" />
    </Layer>
  </Editable>;
}
