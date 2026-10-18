"use client";

import { Editable, useEditableProps } from "./editable";
import type { EditableId } from "./editable-ids";

// Diya's framed "All Too Well" lyrics poster: a slim black frame with a cream mat, hung on the
// wall. The picture can be swapped in edit mode; (x, y) is the frame's top-left corner.
const POSTER = { w: 120, h: 183 };
const MAT = 12;
const MOULDING = 7;

export default function WallFrame({ id, x, y }: { id: EditableId; x: number; y: number }) {
  const { src } = useEditableProps(id, { src: "/concepts/desk/frame-all-too-well.webp" });
  const matW = POSTER.w + MAT * 2;
  const matH = POSTER.h + MAT * 2;
  const w = matW + MOULDING * 2;
  const h = matH + MOULDING * 2;
  const px = MOULDING + MAT;
  const py = MOULDING + MAT;
  return <Editable id={id}>
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <filter id="wall-frame-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <linearGradient id="wall-frame-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="0.38" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="0.62" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.07" />
        </linearGradient>
        <linearGradient id="wall-frame-mould" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b3a3e" />
          <stop offset="0.5" stopColor="#1d1c20" />
          <stop offset="1" stopColor="#111013" />
        </linearGradient>
      </defs>

      {/* Soft shadow on the wall */}
      <rect x="3" y="7" width={w} height={h} rx="2" fill="#05070d" opacity="0.55" filter="url(#wall-frame-shadow)" />

      {/* Moulding, with a lit top-left edge and a darker bottom-right edge */}
      <rect width={w} height={h} rx="1.5" fill="url(#wall-frame-mould)" />
      <path d={`M0.8 ${h - 0.8} V0.8 H${w - 0.8}`} stroke="#5a585e" strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d={`M${MOULDING - 0.5} ${h - MOULDING + 0.5} H${w - MOULDING + 0.5} V${MOULDING - 0.5}`} stroke="#4a484e" strokeWidth="0.8" fill="none" opacity="0.6" />

      {/* Cream mat with its bevelled window */}
      <rect x={MOULDING} y={MOULDING} width={matW} height={matH} fill="#f3eee3" />
      <rect x={MOULDING} y={MOULDING} width={matW} height="3" fill="#000" opacity="0.08" />
      <rect x={px - 1.6} y={py - 1.6} width={POSTER.w + 3.2} height={POSTER.h + 3.2} fill="#fffaf1" />
      <path d={`M${px - 1.6} ${py + POSTER.h + 1.6} V${py - 1.6} H${px + POSTER.w + 1.6}`} stroke="#d9d1c1" strokeWidth="1.2" fill="none" />

      <image href={src} x={px} y={py} width={POSTER.w} height={POSTER.h} preserveAspectRatio="xMidYMid slice" />
      <rect x={px} y={py} width={POSTER.w} height="2.5" fill="#000" opacity="0.12" />

      {/* Glass over the mat and poster */}
      <rect x={MOULDING} y={MOULDING} width={matW} height={matH} fill="url(#wall-frame-glass)" />
      <path d={`M${MOULDING + 10} ${MOULDING} L${MOULDING + 46} ${MOULDING} L${MOULDING} ${MOULDING + 70} L${MOULDING} ${MOULDING + 16} Z`} fill="#ffffff" opacity="0.06" />
    </g>
  </Editable>;
}
