// A Platform 9¾ sign on a wrought-iron wall bracket, after Diya's Pinterest reference: a hand-painted
// maroon-and-cream roundel, curly ironwork, a fairy-light bulb on the arm and a pothos trailing past.
// Drawn in local units with the bracket post's top-left at (0, 0); about 200 × 340 in all.

const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";

const LEAVES: [number, number, number, number][] = [
  // x, y, rotation, size
  [196, 6, 28, 1],
  [178, 40, -32, 0.9],
  [204, 78, 40, 1.05],
  [186, 120, -24, 0.95],
  [214, 166, 46, 1],
  [194, 214, -18, 1.08],
  [168, 258, 34, 0.92],
  [200, 300, -40, 0.98],
  [150, 326, 22, 0.85],
];

function Leaf({ x, y, r, k }: { x: number; y: number; r: number; k: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${r}) scale(${k})`}>
    <path d="M0 0 C -14 -4, -22 12, -16 26 C -11 36, -3 42, 0 48 C 3 42, 11 36, 16 26 C 22 12, 14 -4, 0 0 Z" fill="url(#ps-leaf)" />
    <path d="M0 3 C -1 18, -1 32, 0 46" stroke="#cfe08a" strokeOpacity="0.7" strokeWidth="1.1" fill="none" />
    <path d="M-2 14 C -8 16, -11 22, -12 27 M2 20 C 8 22, 11 27, 11 31 M-1 30 C -5 32, -7 36, -7 39" stroke="#d9e98f" strokeOpacity="0.75" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <path d="M-9 8 C -12 14, -13 20, -10 26" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.4" fill="none" />
  </g>;
}

export default function PlatformSign() {
  // Nudged right and scaled a touch so the post clears the curtain and the pothos stops at the bookshelf.
  return <g transform="translate(42 0) scale(0.92)">
    <defs>
      <linearGradient id="ps-iron" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#4a4a50" />
        <stop offset="0.35" stopColor="#202024" />
        <stop offset="1" stopColor="#111114" />
      </linearGradient>
      <radialGradient id="ps-ring" cx="0.62" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#74303a" />
        <stop offset="0.7" stopColor="#4e1b23" />
        <stop offset="1" stopColor="#36121a" />
      </radialGradient>
      <radialGradient id="ps-face" cx="0.6" cy="0.32" r="0.75">
        <stop offset="0" stopColor="#fbf3dc" />
        <stop offset="1" stopColor="#e3d4ae" />
      </radialGradient>
      <linearGradient id="ps-leaf" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4f8a3c" />
        <stop offset="0.6" stopColor="#2f6328" />
        <stop offset="1" stopColor="#1f4a1d" />
      </linearGradient>
      <radialGradient id="ps-bulb-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffe7a8" stopOpacity="0.9" />
        <stop offset="0.35" stopColor="#ffcf73" stopOpacity="0.35" />
        <stop offset="1" stopColor="#ffcf73" stopOpacity="0" />
      </radialGradient>
      <filter id="ps-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="5" />
      </filter>
      <filter id="ps-paper" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
        <feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 0.22 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
      <path id="ps-arc-top" d="M38 160 A 52 52 0 0 1 142 160" />
      <path id="ps-arc-bottom" d="M30 156 A 60 60 0 0 0 150 156" />
    </defs>

    {/* Shadow of the bracket and sign on the wall */}
    <g opacity="0.45" filter="url(#ps-shadow)" transform="translate(9 10)">
      <rect x="0" y="0" width="12" height="214" fill="#000" />
      <rect x="0" y="66" width="170" height="8" fill="#000" />
      <circle cx="90" cy="160" r="68" fill="#000" />
    </g>

    {/* Wrought-iron bracket: wall post, arm with a spear finial, scrolls above the arm */}
    <rect x="-3" y="22" width="18" height="10" rx="2" fill="#1a1a1d" />
    <rect x="-3" y="182" width="18" height="10" rx="2" fill="#1a1a1d" />
    <rect x="0" y="0" width="12" height="214" rx="2" fill="url(#ps-iron)" />
    <rect x="1.5" y="2" width="2" height="210" fill="#fff" opacity="0.12" />
    <circle cx="6" cy="27" r="2" fill="#5a5a60" />
    <circle cx="6" cy="187" r="2" fill="#5a5a60" />
    <path d="M10 70 L166 70" stroke="url(#ps-iron)" strokeWidth="8" strokeLinecap="round" />
    <path d="M12 67 L164 67" stroke="#fff" strokeOpacity="0.1" strokeWidth="1.5" />
    <path d="M164 70 L178 62 L196 70 L178 78 Z" fill="#17171a" />
    <path d="M166 69 L178 64 L192 69" stroke="#fff" strokeOpacity="0.14" strokeWidth="1" fill="none" />
    <g fill="none" stroke="#18181b" strokeWidth="6.5" strokeLinecap="round">
      <path d="M12 60 C 24 30, 52 26, 60 42 C 66 54, 52 62, 44 54 C 38 48, 44 40, 50 44" />
      <path d="M58 64 C 70 36, 98 30, 110 44 C 118 54, 106 64, 98 58" />
      <path d="M106 64 C 116 46, 136 42, 146 52 C 152 58, 146 66, 140 62" />
      <path d="M12 20 C 30 16, 42 26, 36 36" />
    </g>
    <g fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="1.4" strokeLinecap="round">
      <path d="M16 56 C 26 32, 50 28, 57 40" />
      <path d="M62 60 C 72 38, 96 33, 107 44" />
    </g>
    <circle cx="50" cy="44" r="4" fill="#18181b" />
    <circle cx="98" cy="58" r="4" fill="#18181b" />
    <circle cx="140" cy="62" r="3.5" fill="#18181b" />

    {/* Hangers */}
    <rect x="52" y="72" width="5" height="22" fill="#18181b" />
    <rect x="123" y="72" width="5" height="22" fill="#18181b" />

    {/* The roundel */}
    <circle cx="90" cy="160" r="68" fill="#141215" />
    <circle cx="90" cy="160" r="64" fill="url(#ps-ring)" />
    <circle cx="90" cy="160" r="41" fill="#141215" opacity="0.55" />
    <circle cx="90" cy="160" r="40" fill="url(#ps-face)" />
    <circle cx="90" cy="160" r="64" fill="#000" filter="url(#ps-paper)" />
    <g fill="#efe3c6" fontFamily={SERIF} fontWeight="600" letterSpacing="1.6">
      <text fontSize="13.5"><textPath href="#ps-arc-top" startOffset="50%" textAnchor="middle">PLATFORM</textPath></text>
      <text fontSize="11" letterSpacing="1.2"><textPath href="#ps-arc-bottom" startOffset="50%" textAnchor="middle">HOGWARTS · EXPRESS</textPath></text>
    </g>
    <circle cx="30" cy="160" r="2" fill="#efe3c6" />
    <circle cx="150" cy="160" r="2" fill="#efe3c6" />
    <g fill="#161214" fontFamily={SERIF} fontWeight="700">
      <text x="84" y="179" fontSize="50" textAnchor="middle">9</text>
      <text x="112" y="157" fontSize="18" textAnchor="middle">3</text>
      <rect x="104" y="161" width="16" height="2" />
      <text x="112" y="180" fontSize="18" textAnchor="middle">4</text>
    </g>
    <ellipse cx="108" cy="128" rx="34" ry="14" fill="#fff" opacity="0.08" transform="rotate(-18 108 128)" />

    {/* Fairy-light wire looped over the arm, with a warm bulb by the scrolls */}
    <path d="M150 -14 C 140 20, 118 40, 112 64 C 108 80, 96 66, 84 58" stroke="#e9e4d8" strokeOpacity="0.75" strokeWidth="1.3" fill="none" />
    <circle cx="96" cy="56" r="26" fill="url(#ps-bulb-glow)" />
    <circle cx="96" cy="56" r="3.6" fill="#fff6d6" />
    <circle cx="142" cy="10" r="18" fill="url(#ps-bulb-glow)" />
    <circle cx="142" cy="10" r="3" fill="#fff6d6" />

    {/* Pothos trailing down beside the sign */}
    <path d="M196 -20 C 186 30, 214 70, 196 118 C 182 160, 220 200, 196 246 C 178 284, 210 304, 158 334" stroke="#2d5a26" strokeWidth="2" fill="none" strokeLinecap="round" />
    {LEAVES.map(([x, y, r, k]) => <Leaf key={`${x}-${y}`} x={x} y={y} r={r} k={k} />)}
  </g>;
}
