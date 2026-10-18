import o from "./old-laptop.module.css";

// Diya's old Lenovo, retired to a vertical stand with its sticker-covered lid facing the room.
// The lid is her own photo of it, straightened and cleaned up (public/concepts/desk/lenovo-lid.webp).
// Drawn in its own units like the other desk objects: (0, 0) is where the stand meets the desk.

type Placement = { x: number; y: number; scale?: number };

const LID_W = 296;
const LID_H = 202;
const LID_X = -LID_W / 2;
const LID_BOTTOM = -7;
const LID_TOP = LID_BOTTOM - LID_H;

export function OldLaptop({ x, y, scale = 1 }: Placement) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs>
      <linearGradient id="obj-lenovo-rim" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8e949c" />
        <stop offset="0.5" stopColor="#c9ced5" />
        <stop offset="1" stopColor="#dfe3e8" />
      </linearGradient>
      <linearGradient id="obj-lenovo-top" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#9aa0a8" />
        <stop offset="0.7" stopColor="#e6e9ed" />
        <stop offset="1" stopColor="#f4f5f7" />
      </linearGradient>
      <linearGradient id="obj-lenovo-shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#0d1222" stopOpacity="0.42" />
        <stop offset="0.55" stopColor="#0d1222" stopOpacity="0.16" />
        <stop offset="1" stopColor="#0d1222" stopOpacity="0.04" />
      </linearGradient>
      <radialGradient id="obj-lenovo-glow" cx="1" cy="0.75" r="0.85">
        <stop offset="0" stopColor="#ffcf7d" stopOpacity="0.34" />
        <stop offset="1" stopColor="#ffcf7d" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="obj-lenovo-sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0.38" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0.13" />
        <stop offset="0.62" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="obj-lenovo-stand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5b616b" />
        <stop offset="1" stopColor="#2c3038" />
      </linearGradient>
      <clipPath id="obj-lenovo-lid"><rect x={LID_X} y={LID_TOP} width={LID_W} height={LID_H} rx="7" /></clipPath>
    </defs>

    {/* Contact shadow, and a softer one cast away from the lamp */}
    <ellipse cx="-8" cy="0" rx="150" ry="5" fill="#000" opacity="0.32" />
    <path d={`M${LID_X - 4} -2 L${LID_X + 40} -2 L${LID_X + 10} ${LID_TOP + 40} L${LID_X - 30} ${LID_TOP + 46} Z`} fill="#000" opacity="0.12" />

    {/* Closed lid: the aluminium rim, the top edge seen from just above, then the stickered lid */}
    <rect x={LID_X - 1.6} y={LID_TOP - 1.6} width={LID_W + 3.2} height={LID_H + 3.2} rx="8.5" fill="url(#obj-lenovo-rim)" />
    <rect x={LID_X + 3} y={LID_TOP - 6.5} width={LID_W - 6} height="6" rx="3" fill="url(#obj-lenovo-top)" />
    <rect x={LID_X + 3} y={LID_TOP - 1.6} width={LID_W - 6} height="1.2" fill="#7c828b" opacity="0.7" />
    <g clipPath="url(#obj-lenovo-lid)">
      <image href="/concepts/desk/lenovo-lid.webp" x={LID_X} y={LID_TOP} width={LID_W} height={LID_H} preserveAspectRatio="none" />
      {/* Match the room: dimmer away from the lamp, warm where it reaches, a faint brushed sheen */}
      <rect x={LID_X} y={LID_TOP} width={LID_W} height={LID_H} fill="url(#obj-lenovo-shade)" />
      <rect className={o.glow} x={LID_X} y={LID_TOP} width={LID_W} height={LID_H} fill="url(#obj-lenovo-glow)" />
      <rect x={LID_X} y={LID_TOP} width={LID_W} height={LID_H} fill="url(#obj-lenovo-sheen)" />
    </g>
    <rect x={LID_X} y={LID_TOP} width={LID_W} height={LID_H} rx="7" fill="none" stroke="#f4f5f7" strokeOpacity="0.35" strokeWidth="0.8" />

    {/* Vertical stand: a low aluminium base with two padded arms gripping the hinge edge */}
    <rect x="-132" y="-8" width="264" height="8" rx="3" fill="url(#obj-lenovo-stand)" />
    <rect x="-132" y="-8" width="264" height="1.4" rx="0.7" fill="#8a909a" />
    {[-119, 101].map((ax) => <g key={ax}>
      <rect x={ax} y="-16" width="18" height="15" rx="3" fill="url(#obj-lenovo-stand)" />
      <rect x={ax} y="-16" width="18" height="2" rx="1" fill="#9aa0aa" />
      <rect x={ax + 2} y="-13" width="14" height="3" rx="1.5" fill="#1b1e24" opacity="0.6" />
    </g>)}
  </g>;
}
