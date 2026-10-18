"use client";

import { Editable, useEditableProps } from "./editable";
import type { EditableId } from "./editable-ids";
import s from "./wall-display.module.css";

// Diya's own photos printed as a black-and-white photo-booth strip, held by a mini binder clip that
// hangs from a clear adhesive hook on the wall. The strip is its own editable unit inside the series.
// Its bottom edge stays where the shorter strip ended, so saved layouts still line up; the extra
// length goes upwards.

const HANG_Y = -97;
// Narrow paper with tall 3:4 frames, so each photo shows the whole subject, and a printed footer.
const FRAME_W = 66;
const FRAME_H = 88;
const SIDE = 5;
const TOP = 5;
const GAP = 4;
const FOOT = 24;
const W = FRAME_W + SIDE * 2;
const H = TOP + FRAME_H * 3 + GAP * 2 + FOOT;

type Strip = {
  id: EditableId;
  at: number;
  tilt: number;
  frames: string[];
  caption: string;
};

const frame = (photo: number) => `/concepts/desk/strip-${photo}-tall.webp`;

const STRIPS: Strip[] = [
  { id: "polaroid-2", at: 220, tilt: 2, frames: [frame(2), frame(3), frame(1)], caption: "PHOTOBOOTH" },
];

const PAPER = { fill: "#161514", ink: "#f2efe8" };

function Defs() {
  return <defs>
    <filter id="strip-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.8" /></filter>
    <filter id="strip-mono" colorInterpolationFilters="sRGB">
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer><feFuncR type="linear" slope="1.12" intercept="-0.05" /><feFuncG type="linear" slope="1.12" intercept="-0.05" /><feFuncB type="linear" slope="1.12" intercept="-0.05" /></feComponentTransfer>
    </filter>
    <linearGradient id="strip-gloss" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
      <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
    </linearGradient>
    <linearGradient id="strip-steel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#d6dade" />
      <stop offset="1" stopColor="#868c94" />
    </linearGradient>
  </defs>;
}

// A clear adhesive hook stuck to the wall, with a small black binder clip hanging from it by its
// folded wire handles; (x, y) is where the clip's jaws bite the top of the paper.
function HookAndClip({ x, y }: { x: number; y: number }) {
  return <g>
    <rect x={x - 5.2} y={y - 22} width="12" height="13" rx="3" fill="#000" opacity="0.25" filter="url(#strip-soft)" />
    <rect x={x - 6} y={y - 23} width="12" height="13" rx="3" fill="#fff" fillOpacity="0.14" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.6" />
    <path d={`M${x - 3.6} ${y - 21.6} H${x + 1.5}`} stroke="#fff" strokeOpacity="0.45" strokeWidth="0.6" strokeLinecap="round" />
    <path d={`M${x} ${y - 11} v3.4 q0 3 2.8 3 q2.5 0 2.5 -2.5`} stroke="#fff" strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <path d={`M${x - 5} ${y - 1} L${x + 1.4} ${y - 4.8} M${x + 5} ${y - 1} L${x + 1.8} ${y - 4.8}`} stroke="url(#strip-steel)" strokeWidth="0.9" strokeLinecap="round" />
    <path d={`M${x - 7.5} ${y - 1.5} H${x + 7.5} L${x + 6.6} ${y + 6} H${x - 6.6} Z`} fill="#1b1c20" />
    <path d={`M${x - 7.2} ${y - 1.1} H${x + 7.2}`} stroke="#5d6068" strokeWidth="0.6" />
    <rect x={x - 6.6} y={y + 6} width="13.2" height="0.9" fill="#000" opacity="0.35" />
  </g>;
}

function PhotoStrip({ id, at, tilt, frames, caption }: Strip) {
  const { caption: footer } = useEditableProps(id, { caption });
  const paper = PAPER;
  const pinY = HANG_Y;
  const left = at - W / 2;
  const top = pinY - 3;
  return <Editable id={id}>
    <g transform={`rotate(${tilt} ${at} ${top})`}>
      <rect x={left + 2.5} y={top + 4} width={W} height={H} rx="0.8" fill="#000" opacity="0.4" filter="url(#strip-soft)" />
      <rect x={left} y={top} width={W} height={H} rx="0.8" fill={paper.fill} />
      {frames.map((src, i) => {
        const y = top + TOP + i * (FRAME_H + GAP);
        return <g key={src}>
          <image href={src} x={left + SIDE} y={y} width={FRAME_W} height={FRAME_H} preserveAspectRatio="xMidYMid slice" filter="url(#strip-mono)" />
          <rect x={left + SIDE} y={y} width={FRAME_W} height={FRAME_H} fill="url(#strip-gloss)" />
          <rect x={left + SIDE + 0.25} y={y + 0.25} width={FRAME_W - 0.5} height={FRAME_H - 0.5} fill="none" stroke="#000" strokeOpacity="0.2" strokeWidth="0.5" />
        </g>;
      })}
      {footer && <text x={at} y={top + H - 9} textAnchor="middle" className={s.caption}
        style={{ fontFamily: "var(--desk-body), system-ui, sans-serif", fontStyle: "normal", fontWeight: 800, fontSize: 7, letterSpacing: "0.12em", fill: paper.ink }}>{footer}</text>}
      {/* the paper lifts very slightly off the wall at its lower corners */}
      <path d={`M${left} ${top + H - 7} L${left} ${top + H} L${left + 8} ${top + H}`} stroke="#000" strokeOpacity="0.14" strokeWidth="1" fill="none" />
      <HookAndClip x={at} y={top} />
    </g>
  </Editable>;
}

export default function PolaroidSeries({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <Defs />
    {STRIPS.map((strip) => <PhotoStrip key={strip.id} {...strip} />)}
  </g>;
}
