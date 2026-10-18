"use client";

// Diya's Sprite Zero Sugar: a cut-out photo of the real 300 ml can (public/concepts/desk/sprite-zero-can.webp)
// standing on the desk, base centred on (0, 0), toned down and side-lit to sit in the lamplit room.
//
// Hovering or tapping it makes it pop: a quick squash-and-hop, a spray of bubbles from the top and a
// fizzy "pssht" with a few bubbles crackling. It also fizzes once, without sound of its own, when the
// MacBook desktop appears (desk.tsx plays the opening "psst" then). Browsers only let a page make sound
// after the visitor has clicked, tapped or pressed a key, so a hover before that pops silently; a tap
// always plays. Nothing happens in edit mode, and reduced motion keeps the can still.

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useDeskLayout } from "./editable";
import styles from "./sprite-zero-can.module.css";

type Placement = { x: number; y: number; scale?: number };

// The cut-out is 182×434 px; the can stands 80 units tall at scale 1.
const H = 80;
const W = H * (182 / 434);
const OPENING_FIZZ_MS = 9050; // matches CAN_OPEN_AT in desk.tsx, when the desktop appears
const COOLDOWN_MS = 1100; // between hover pops

// Bubbles spraying out of the top: horizontal drift, rise, size and delay.
const BUBBLES: [number, number, number, number][] = [
  [-7, -26, 1.3, 0], [5, -32, 1.1, 0.03], [-2, -38, 0.9, 0.06], [9, -22, 1.4, 0.02], [-11, -18, 1, 0.08],
  [2, -44, 0.8, 0.1], [-5, -30, 0.7, 0.12], [12, -34, 0.9, 0.05], [-14, -28, 0.8, 0.14], [7, -40, 0.7, 0.16],
  [0, -24, 1.2, 0.04], [-9, -42, 0.6, 0.18],
];

/* ---------- Sound: a short pop, then carbonation hiss with bubbles crackling ---------- */

function fizzBuffer(ctx: AudioContext) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * 1.1);
  const buffer = ctx.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  // Hiss: noise that swells in a few milliseconds and fades out.
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    const envelope = Math.min(1, t / 0.012) * Math.exp(-t / 0.32);
    data[i] = (Math.random() * 2 - 1) * 0.22 * envelope;
  }
  // Bubbles bursting: tiny decaying tones, dense at first and thinning out.
  for (let n = 0; n < 70; n++) {
    const start = Math.floor(rate * 0.9 * Math.pow(Math.random(), 1.8));
    const freq = 2600 + Math.random() * 5200;
    const amp = (0.25 + Math.random() * 0.5) * Math.exp(-start / rate / 0.45);
    const decay = 0.002 + Math.random() * 0.004;
    const span = Math.min(length - start, Math.floor(rate * decay * 6));
    for (let i = 0; i < span; i++) {
      const t = i / rate;
      data[start + i] += amp * Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / decay);
    }
  }
  return buffer;
}

function playFizzyPop(ctx: AudioContext) {
  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = 0.55;
  out.connect(ctx.destination);

  // The pop: a low thump under a short bright crack.
  const thump = ctx.createOscillator();
  thump.type = "sine";
  thump.frequency.setValueAtTime(190, now);
  thump.frequency.exponentialRampToValueAtTime(70, now + 0.07);
  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(0.0001, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.5, now + 0.004);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  thump.connect(thumpGain).connect(out);
  thump.start(now);
  thump.stop(now + 0.1);

  const crackLength = Math.floor(ctx.sampleRate * 0.05);
  const crack = ctx.createBuffer(1, crackLength, ctx.sampleRate);
  const crackData = crack.getChannelData(0);
  for (let i = 0; i < crackLength; i++) crackData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
  const crackSource = ctx.createBufferSource();
  crackSource.buffer = crack;
  const crackBand = ctx.createBiquadFilter();
  crackBand.type = "bandpass";
  crackBand.frequency.value = 1500;
  crackBand.Q.value = 1.2;
  crackSource.connect(crackBand).connect(out);
  crackSource.start(now);

  // The fizz, starting just after the pop.
  const fizz = ctx.createBufferSource();
  fizz.buffer = fizzBuffer(ctx);
  fizz.playbackRate.value = 0.95 + Math.random() * 0.1;
  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 2200;
  fizz.connect(high).connect(out);
  fizz.start(now + 0.02);
}

// One audio context, unlocked by the visitor's first click, tap or key press anywhere on the page.
function useFizzSound() {
  const ctx = useRef<AudioContext | null>(null);
  useEffect(() => {
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const unlock = () => {
      try {
        ctx.current = ctx.current ?? new AudioCtor();
        void ctx.current.resume().catch(() => undefined);
      } catch {
        ctx.current = null;
      }
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      void ctx.current?.close().catch(() => undefined);
      ctx.current = null;
    };
  }, []);
  // During a click or tap the context may still be resuming, so wait for it; a hover can't unlock it.
  return (fromGesture: boolean) => {
    const current = ctx.current;
    if (!current) return;
    if (current.state === "running") playFizzyPop(current);
    else if (fromGesture) void current.resume().then(() => { if (current.state === "running") playFizzyPop(current); }).catch(() => undefined);
  };
}

/* ---------- The can ---------- */

export default function SpriteZeroCan({ x, y, scale = 1 }: Placement) {
  const { editing } = useDeskLayout();
  const playSound = useFizzSound();
  const [hop, setHop] = useState(0);
  const [fizz, setFizz] = useState(0);
  const lastHover = useRef(-Infinity);
  const lastTap = useRef(-Infinity);

  const pop = (withHop: boolean) => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!still) {
      if (withHop) setHop((n) => n + 1);
      setFizz((n) => n + 1);
    }
  };

  // The silent fizz as the MacBook desktop appears, once per visit.
  useEffect(() => {
    const wait = OPENING_FIZZ_MS - performance.now();
    if (wait < 0) return;
    const timer = window.setTimeout(() => pop(false), wait);
    return () => window.clearTimeout(timer);
  }, []);

  const handlers = editing ? {} : {
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const now = performance.now();
      if (now - lastHover.current < COOLDOWN_MS) return;
      lastHover.current = now;
      pop(true);
      playSound(false);
    },
    // A click or tap counts as interaction, so it can always make the sound.
    onPointerDown: () => {
      const now = performance.now();
      if (now - lastTap.current < 400) return;
      lastTap.current = now;
      if (now - lastHover.current > 300) pop(true);
      playSound(true);
    },
  };

  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs>
      <clipPath id="szc-body"><rect x={-W / 2} y={-H} width={W} height={H} rx="5" /></clipPath>
      <linearGradient id="szc-light" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.42" />
        <stop offset="0.3" stopColor="#000" stopOpacity="0.08" />
        <stop offset="0.62" stopColor="#000" stopOpacity="0" />
        <stop offset="0.86" stopColor="#ffcf7d" stopOpacity="0.1" />
        <stop offset="1" stopColor="#ffcf7d" stopOpacity="0.2" />
      </linearGradient>
      <radialGradient id="szc-mist" cx="0.5" cy="0.6" r="0.5">
        <stop offset="0" stopColor="#f2fff4" stopOpacity="0.9" />
        <stop offset="1" stopColor="#f2fff4" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* contact shadow on the desk, longer away from the lamp */}
    <ellipse cx="-6" cy="0.6" rx={W * 0.95} ry="2.8" fill="#000" opacity="0.18" />
    <ellipse cx="0" cy="0.3" rx={W * 0.62} ry="2.2" fill="#000" opacity="0.34" />

    {/* Alternating between two identical animations restarts the hop without remounting the can. */}
    <g className={hop ? (hop % 2 ? styles.popA : styles.popB) : undefined} {...handlers} style={{ cursor: editing ? undefined : "pointer" }}>
      <image href="/concepts/desk/sprite-zero-can.webp" x={-W / 2} y={-H} width={W} height={H} className={styles.can} />
      <rect x={-W / 2} y={-H} width={W} height={H} fill="url(#szc-light)" clipPath="url(#szc-body)" pointerEvents="none" />
      {/* The fizz comes out of the top, so it rides along with the hop */}
      {fizz > 0 && <g key={`fizz-${fizz}`} className={styles.fizz} aria-hidden="true" pointerEvents="none">
        <ellipse className={styles.mist} cx="0" cy={-H - 4} rx="9" ry="5" fill="url(#szc-mist)" />
        {BUBBLES.map(([dx, dy, r, delay], i) => <circle key={i} className={styles.bubble} cx={(i % 5 - 2) * 1.6} cy={-H - 1} r={r}
          style={{ "--dx": `${dx}px`, "--dy": `${dy}px`, animationDelay: `${delay}s` } as CSSProperties} />)}
      </g>}
    </g>

  </g>;
}
