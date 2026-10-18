"use client";

import { useEffect, useState } from "react";

// A white tabletop digital clock after Diya's Pinterest reference: rounded white plastic body with a
// wireless-charging pad on top, a black LCD with ice-blue segment digits, and month/date and day on
// the right. It stands on a small floating wooden ledge on the wall. Shows New Delhi time; the server
// render (and the first paint) shows dashes until the real time is known. (0, 0) is the body's centre.

type Now = { h: string; m: string; month: string; date: string; day: string; pm: boolean };

const ZONE = "Asia/Kolkata";

function readNow(): Now {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: ZONE, hour: "numeric", minute: "2-digit", month: "numeric", day: "numeric", weekday: "short", hour12: true }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { h: get("hour"), m: get("minute"), month: get("month"), date: get("day"), day: get("weekday").toUpperCase(), pm: get("dayPeriod").toUpperCase() === "PM" };
}

function useDelhiNow() {
  const [now, setNow] = useState<Now | null>(null);
  useEffect(() => {
    const tick = () => setNow(readNow());
    tick();
    // Re-read just after each minute turns over, so the display changes when a real clock would.
    let timer = window.setTimeout(function next() {
      tick();
      timer = window.setTimeout(next, 60_000 - (Date.now() % 60_000) + 50);
    }, 60_000 - (Date.now() % 60_000) + 50);
    return () => window.clearTimeout(timer);
  }, []);
  return now;
}

/* ---------- Segment displays ---------- */

const LIT = "#c9d8ff";
const GHOST = "#111521";

const hseg = (x1: number, x2: number, y: number, t: number) =>
  `${x1},${y} ${x1 + t / 2},${y - t / 2} ${x2 - t / 2},${y - t / 2} ${x2},${y} ${x2 - t / 2},${y + t / 2} ${x1 + t / 2},${y + t / 2}`;
const vseg = (x: number, y1: number, y2: number, t: number) =>
  `${x},${y1} ${x + t / 2},${y1 + t / 2} ${x + t / 2},${y2 - t / 2} ${x},${y2} ${x - t / 2},${y2 - t / 2} ${x - t / 2},${y1 + t / 2}`;

const DIGITS: Record<string, string> = {
  "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg", "-": "g", " ": "",
};

// A seven-segment digit with its top-left corner at (x, y); unlit segments stay faintly visible.
type Seg = { ch: string; x: number; y: number; w: number; h: number; t: number; ghost?: boolean };

function Digit({ ch, x, y, w, h, t, ghost = true }: Seg) {
  const g = t * 0.2;
  const segments: Record<string, string> = {
    a: hseg(x + t / 2 + g, x + w - t / 2 - g, y + t / 2, t),
    g: hseg(x + t / 2 + g, x + w - t / 2 - g, y + h / 2, t),
    d: hseg(x + t / 2 + g, x + w - t / 2 - g, y + h - t / 2, t),
    f: vseg(x + t / 2, y + t / 2 + g, y + h / 2 - g, t),
    b: vseg(x + w - t / 2, y + t / 2 + g, y + h / 2 - g, t),
    e: vseg(x + t / 2, y + h / 2 + g, y + h - t / 2 - g, t),
    c: vseg(x + w - t / 2, y + h / 2 + g, y + h - t / 2 - g, t),
  };
  const on = DIGITS[ch] ?? "";
  return <g>
    {Object.entries(segments).map(([name, points]) => (on.includes(name) || ghost) && <polygon key={name} points={points} fill={on.includes(name) ? LIT : GHOST} />)}
  </g>;
}

// Fourteen-segment letters for the weekday, drawn as thin strokes.
const LETTERS: Record<string, string[]> = {
  S: ["a", "f", "g1", "g2", "c", "d"], U: ["f", "e", "d", "c", "b"], N: ["f", "e", "b", "c", "h", "m"], M: ["f", "e", "b", "c", "h", "j"],
  O: ["a", "b", "c", "d", "e", "f"], T: ["a", "i", "l"], E: ["a", "f", "e", "d", "g1"], W: ["f", "e", "b", "c", "k", "m"],
  D: ["a", "b", "c", "d", "i", "l"], H: ["f", "e", "b", "c", "g1", "g2"], F: ["a", "f", "e", "g1"], R: ["a", "f", "e", "b", "g1", "g2", "m"],
  I: ["a", "d", "i", "l"], A: ["a", "b", "c", "e", "f", "g1", "g2"], P: ["a", "b", "f", "e", "g1", "g2"], "/": ["k", "j"],
};

function Letter({ ch, x, y, w, h, t, ghost = true }: Seg) {
  const p = { tl: [x, y], tr: [x + w, y], ml: [x, y + h / 2], mr: [x + w, y + h / 2], bl: [x, y + h], br: [x + w, y + h], tc: [x + w / 2, y], mc: [x + w / 2, y + h / 2], bc: [x + w / 2, y + h] };
  const strokes: Record<string, [number[], number[]]> = {
    a: [p.tl, p.tr], b: [p.tr, p.mr], c: [p.mr, p.br], d: [p.bl, p.br], e: [p.ml, p.bl], f: [p.tl, p.ml], g1: [p.ml, p.mc], g2: [p.mc, p.mr],
    h: [p.tl, p.mc], i: [p.tc, p.mc], j: [p.tr, p.mc], k: [p.mc, p.bl], l: [p.mc, p.bc], m: [p.mc, p.br],
  };
  const on = LETTERS[ch] ?? [];
  const gap = 0.16;
  return <g strokeWidth={t} strokeLinecap="round">
    {Object.entries(strokes).map(([name, [[x1, y1], [x2, y2]]]) => {
      const dx = (x2 - x1) * gap;
      const dy = (y2 - y1) * gap;
      if (!on.includes(name) && !ghost) return null;
      return <line key={name} x1={x1 + dx} y1={y1 + dy} x2={x2 - dx} y2={y2 - dy} stroke={on.includes(name) ? LIT : GHOST} strokeOpacity={on.includes(name) ? 1 : 0.7} />;
    })}
  </g>;
}

// `glow` draws only the lit segments, for the soft bloom layer under the crisp readout.
function Readout({ now, glow = false }: { now: Now | null; glow?: boolean }) {
  const hour = now ? now.h.padStart(2, " ") : "--";
  const minute = now ? now.m : "--";
  const month = now ? now.month.padStart(2, " ") : "--";
  const date = now ? now.date.padStart(2, " ") : "--";
  const day = now ? now.day.slice(0, 3) : "   ";
  const ghost = !glow;
  const big = { y: -17, w: 17, h: 34, t: 3.4, ghost };
  const small = { y: -13, w: 5, h: 9.5, t: 1.35, ghost };
  return <g>
    <Digit ch={hour[0]} x={-61} {...big} />
    <Digit ch={hour[1]} x={-40} {...big} />
    <polygon points={hseg(-19.4, -15.4, -7, 3.4)} fill={now ? LIT : GHOST} transform="rotate(90 -17.4 -7)" />
    <polygon points={hseg(-19.4, -15.4, 7, 3.4)} fill={now ? LIT : GHOST} transform="rotate(90 -17.4 7)" />
    <Digit ch={minute[0]} x={-12} {...big} />
    <Digit ch={minute[1]} x={9} {...big} />
    <text x="-63" y="-19.5" fontSize="3.6" fontWeight="700" fill={now?.pm ? LIT : GHOST} style={{ fontFamily: "system-ui, sans-serif" }}>PM</text>
    <line x1="33" y1="-19" x2="33" y2="19" stroke={LIT} strokeOpacity="0.55" strokeWidth="0.6" />
    <g fill={LIT} fillOpacity="0.8" style={{ fontFamily: "system-ui, sans-serif", fontSize: "2.6px", fontWeight: 700, letterSpacing: "0.06em" }}>
      <text x="37" y="-15.5">MONTH</text>
      <text x="51.5" y="-15.5">DATE</text>
      <text x="37" y="2.5">DAY</text>
    </g>
    <Digit ch={month[0]} x={37} {...small} />
    <Digit ch={month[1]} x={42.6} {...small} />
    <Letter ch="/" x={48.6} y={-13} w={3.4} h={9.5} t={1.1} ghost={ghost} />
    <Digit ch={date[0]} x={52.8} {...small} />
    <Digit ch={date[1]} x={58.4} {...small} />
    <line x1="36" y1="-0.6" x2="64" y2="-0.6" stroke={LIT} strokeOpacity="0.4" strokeWidth="0.5" />
    {Array.from(day.padEnd(3, " ")).map((ch, i) => <Letter key={i} ch={ch} x={37.5 + i * 9} y={5} w={6.6} h={11} t={1.25} ghost={ghost} />)}
  </g>;
}

export default function DigitalClock() {
  const now = useDelhiNow();
  return <g>
    <defs>
      <filter id="dclock-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" /></filter>
      <filter id="dclock-glow" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="1.1" /></filter>
      <linearGradient id="dclock-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fbfaf7" />
        <stop offset="0.55" stopColor="#efece5" />
        <stop offset="1" stopColor="#d3cec4" />
      </linearGradient>
      <linearGradient id="dclock-sides" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.14" />
        <stop offset="0.12" stopColor="#000" stopOpacity="0" />
        <stop offset="0.88" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.18" />
      </linearGradient>
      <linearGradient id="dclock-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.09" />
        <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="dclock-ledge" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7a5236" />
        <stop offset="1" stopColor="#4a3020" />
      </linearGradient>
    </defs>

    {/* Floating wooden ledge it stands on, with its shadow on the wall */}
    <rect x="-92" y="50" width="190" height="12" rx="3" fill="#000" opacity="0.4" filter="url(#dclock-soft)" />
    <rect x="-96" y="42" width="192" height="4.5" rx="1" fill="#8d6444" />
    <rect x="-96" y="46" width="192" height="9" rx="1.2" fill="url(#dclock-ledge)" />
    <path d="M-96 46.3 H96" stroke="#b08260" strokeOpacity="0.55" strokeWidth="0.7" />
    <path d="M-80 50 C -40 49, 10 51.5, 60 50 M-60 52.5 C -20 51.5, 30 53.5, 84 52" stroke="#3a2416" strokeOpacity="0.35" strokeWidth="0.5" fill="none" />

    {/* Shadow on the wall and contact shadow on the ledge */}
    <rect x="-74" y="-32" width="156" height="76" rx="20" fill="#000" opacity="0.35" filter="url(#dclock-soft)" />
    <ellipse cx="0" cy="43" rx="70" ry="2.4" fill="#000" opacity="0.4" filter="url(#dclock-glow)" />

    {/* Feet */}
    <path d="M-60 36 h12 l-1.6 7 q-0.4 1.4 -1.8 1.4 h-5.2 q-1.4 0 -1.8 -1.4 Z" fill="#e2ded6" />
    <path d="M48 36 h12 l-1.6 7 q-0.4 1.4 -1.8 1.4 h-5.2 q-1.4 0 -1.8 -1.4 Z" fill="#d9d4cb" />

    {/* Body */}
    <rect x="-78" y="-38" width="156" height="76" rx="20" fill="url(#dclock-body)" />
    <rect x="-78" y="-38" width="156" height="76" rx="20" fill="url(#dclock-sides)" />
    <rect x="-77.3" y="-37.3" width="154.6" height="74.6" rx="19.4" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="0.9" />
    <path d="M-62 -36.6 H62" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
    {/* Wireless-charging pad on top */}
    <ellipse cx="0" cy="-37.4" rx="22" ry="2.6" fill="#f7f5f0" stroke="#cfc9be" strokeWidth="0.6" />
    <path d="M-2.4 -38.4 l1.6 -0.9 l1.2 0.9 l1.6 -0.9" stroke="#b9b2a6" strokeWidth="0.5" fill="none" />

    {/* LCD */}
    <rect x="-69" y="-28" width="138" height="56" rx="9.5" fill="#d8d3ca" />
    <rect x="-68" y="-27" width="136" height="54" rx="9" fill="#06070a" />
    <g filter="url(#dclock-glow)" opacity="0.7"><Readout now={now} glow /></g>
    <Readout now={now} />
    <rect x="-68" y="-27" width="136" height="54" rx="9" fill="url(#dclock-glass)" />
    <path d="M-60 -26.2 H60" stroke="#fff" strokeOpacity="0.06" strokeWidth="0.8" />
  </g>;
}
