// Diya's 4-key clicker keychain: clear acrylic keycaps on blue switches, with its silver chain and
// ring lying on the desk. The body is a cut-out photo (public/concepts/desk/key-clicker.webp); the ring
// in that photo dangles, so it is clipped off and redrawn lying flat. Base-left corner at (0, 0); the
// body is ~8 cm long, scaled against the Sprite can (~12 cm ≈ 70 units at the can's 0.9 scale).
//
// Like the real thing, each key can be pressed: the cap sinks, the LED under it lights up and the blue
// switch clicks (once going down, once coming back up). The clicks are Diya's own recording of a
// mechanical key, cut into a press and a release clip (public/concepts/desk/sounds/). Several keys can
// be held at once, and quick presses overlap instead of cutting each other off. The caps are cut out of
// the photo so each one can move on its own. Outside edit mode only; the sound needs no prompt because
// it follows a click.

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useDeskLayout } from "./editable";
import styles from "./key-clicker.module.css";

type Placement = { x: number; y: number; scale?: number };
type Pt = [number, number];

const PX = 55 / 520; // photo pixels → room units
const BODY_BOTTOM = 230 * PX;
const TRAVEL = 2; // how far a cap sinks, in room units
const at = ([px, py]: Pt): Pt => [px * PX, -BODY_BOTTOM + py * PX];
const pt = (p: Pt) => at(p).map((n) => n.toFixed(2)).join(",");
const poly = (points: Pt[]) => points.map(pt).join(" ");

// Measured on the photo (520 px wide): each keycap, the area that answers a click (cap and housing),
// and the centre of its blue switch, where the LED sits.
const KEYS: { cap: Pt[]; hit: Pt[]; led: Pt }[] = [
  { cap: [[-5, -5], [119, -5], [121, 108], [-5, 100]], hit: [[0, 0], [120, 0], [122, 190], [0, 178]], led: [65, 58] },
  { cap: [[119, -5], [222, -5], [224, 122], [121, 108]], hit: [[120, 0], [223, 0], [225, 205], [122, 190]], led: [165, 70] },
  { cap: [[222, -5], [329, -5], [331, 134], [224, 122]], hit: [[223, 0], [330, 0], [332, 222], [225, 205]], led: [270, 84] },
  { cap: [[329, -5], [449, -5], [449, 146], [331, 134]], hit: [[330, 0], [449, 0], [449, 240], [332, 222]], led: [378, 100] },
];

const CLIPS = { down: "/concepts/desk/sounds/key-down.wav", up: "/concepts/desk/sounds/key-up.wav" };
type Clip = keyof typeof CLIPS;
type Sound = { ctx: AudioContext; buffers: Promise<Record<Clip, AudioBuffer>> };

// Each click is a fresh source, so a burst of presses plays every click. A slight random change in
// pitch and level keeps repeated presses from sounding identical.
function useClickSound() {
  const sound = useRef<Sound | null>(null);
  useEffect(() => () => void sound.current?.ctx.close().catch(() => undefined), []);
  return (clip: Clip) => {
    try {
      if (!sound.current) {
        const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtor) return;
        const ctx = new AudioCtor();
        const load = (url: string) => fetch(url).then((response) => response.arrayBuffer()).then((data) => ctx.decodeAudioData(data));
        const buffers = Promise.all([load(CLIPS.down), load(CLIPS.up)]).then(([down, up]) => ({ down, up }));
        sound.current = { ctx, buffers };
      }
      const { ctx, buffers } = sound.current;
      if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
      void buffers.then((loaded) => {
        const source = ctx.createBufferSource();
        source.buffer = loaded[clip];
        source.playbackRate.value = 0.96 + Math.random() * 0.08;
        const gain = ctx.createGain();
        gain.gain.value = 0.85 + Math.random() * 0.15;
        source.connect(gain).connect(ctx.destination);
        source.start();
      }).catch(() => undefined);
    } catch {
      // No sound is fine; the key still presses and lights up.
    }
  };
}

export default function KeyClicker({ x, y, scale = 1 }: Placement) {
  const { editing } = useDeskLayout();
  const [pressed, setPressed] = useState<number[]>([]);
  // Which key each pointer (mouse button or finger) is holding down.
  const held = useRef(new Map<number, number>());
  const click = useClickSound();
  const sync = () => setPressed(Array.from(new Set(held.current.values())));

  const press = (key: number) => (event: PointerEvent<SVGPolygonElement>) => {
    if (event.button !== 0 || held.current.has(event.pointerId)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    held.current.set(event.pointerId, key);
    sync();
    click("down");
  };
  // Pointer up, cancel and lost capture can all arrive for one press; only the first releases it.
  const release = (event: PointerEvent<SVGPolygonElement>) => {
    if (!held.current.delete(event.pointerId)) return;
    sync();
    click("up");
  };

  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs>
      <clipPath id="kc-body"><rect x="0" y={-BODY_BOTTOM} width={449 * PX} height={242 * PX} rx="2" /></clipPath>
      <mask id="kc-housing" maskUnits="userSpaceOnUse" x="-5" y="-40" width="70" height="50">
        <rect x="-5" y="-40" width="70" height="50" fill="#fff" />
        {KEYS.map((key, i) => <polygon key={i} points={poly(key.cap)} fill="#000" />)}
      </mask>
      {KEYS.map((key, i) => <clipPath key={i} id={`kc-cap-${i}`}><polygon points={poly(key.cap)} /></clipPath>)}
      <linearGradient id="kc-steel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f4f6f8" />
        <stop offset="0.5" stopColor="#9ea4ab" />
        <stop offset="1" stopColor="#e2e5e9" />
      </linearGradient>
      <radialGradient id="kc-led" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.25" stopColor="#c9f0ff" stopOpacity="0.95" />
        <stop offset="0.6" stopColor="#62c8ff" stopOpacity="0.45" />
        <stop offset="1" stopColor="#3aa8ff" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="25" cy="0.6" rx="29" ry="2.4" fill="#000" opacity="0.32" />
    <ellipse cx="25" cy="0.2" rx="22" ry="1.2" fill="#000" opacity="0.25" />
    {/* light from the lit key spilling onto the desk */}
    {KEYS.map((key, i) => <ellipse key={i} className={styles.spill} data-lit={pressed.includes(i) || undefined} cx={key.led[0] * PX} cy="0.8" rx="11" ry="2.4" fill="#8fdcff" />)}
    {/* the housings, with the caps cut away so each cap can move on its own */}
    <g clipPath="url(#kc-body)">
      <image href="/concepts/desk/key-clicker.webp" x="0" y={-BODY_BOTTOM} width="55" height={347 * PX} mask="url(#kc-housing)" preserveAspectRatio="none" />
    </g>
    {KEYS.map((key, i) => <g key={i} className={styles.cap} style={pressed.includes(i) ? { transform: `translateY(${TRAVEL}px)` } : undefined}>
      <image href="/concepts/desk/key-clicker.webp" x="0" y={-BODY_BOTTOM} width="55" height={347 * PX} clipPath={`url(#kc-cap-${i})`} preserveAspectRatio="none" />
    </g>)}
    {/* the LED under each switch: a bright core inside the clear cap and a soft halo around it */}
    {KEYS.map((key, i) => {
      const [lx, ly] = at(key.led);
      return <g key={i} className={styles.led} data-lit={pressed.includes(i) || undefined} style={pressed.includes(i) ? { transform: `translateY(${TRAVEL}px)` } : undefined}>
        <circle cx={lx} cy={ly} r="14" fill="url(#kc-led)" opacity="0.75" />
        <circle cx={lx} cy={ly + 0.6} r="5.4" fill="url(#kc-led)" />
      </g>;
    })}
    {/* chain from the last key down to the ring lying on the desk */}
    <g fill="none" stroke="url(#kc-steel)" strokeWidth="0.9">
      <ellipse cx="47.6" cy="-9.6" rx="1.3" ry="1.9" />
      <ellipse cx="48.8" cy="-6.6" rx="1.9" ry="1.2" />
      <ellipse cx="50.2" cy="-3.8" rx="1.3" ry="1.9" />
      <ellipse cx="52" cy="-1.4" rx="1.9" ry="1.1" />
    </g>
    <ellipse cx="61" cy="-0.9" rx="8.4" ry="2.3" fill="none" stroke="url(#kc-steel)" strokeWidth="1.6" />
    <path d="M53.4 -1.6 C 55 -2.4, 56.4 -2.2, 57.2 -1.4" stroke="#c9ced4" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <ellipse cx="61" cy="0.9" rx="9" ry="1.2" fill="#000" opacity="0.22" />
    {/* invisible press areas, one per key; in edit mode clicks go to the editor instead */}
    {!editing && KEYS.map((key, i) => <polygon key={i} className={styles.hit} points={poly(key.hit)}
      onPointerDown={press(i)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} />)}
  </g>;
}
