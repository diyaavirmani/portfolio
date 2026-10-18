"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type RefObject } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { FileText, Github, Linkedin, Mail, MapPin } from "lucide-react";
import { profile } from "./content";
import { SonySpeaker } from "./desk-objects";
import { ClickableCalendar } from "./calendar-planner";
import SpriteZeroCan from "./sprite-zero-can";
import { SpeakerPlayer } from "./speaker-player";
import { SiteNav } from "./site-panels";
import PlatformSign from "./platform-sign";
import WallFrame from "./wall-frame";
import KeyClicker from "./key-clicker";
import MacDesktop from "./mac-desktop";
import { OldLaptop } from "./old-laptop";
import { PenCup } from "./pen-note";
import LampBooks, { STACK_HEIGHT } from "./lamp-books";
import WallDisplay from "./wall-display";
import CubbyBookshelf from "./bookshelf";
import PolaroidSeries from "./polaroid-series";
import DigitalClock from "./digital-clock";
import { Editable, Layer, LayoutProvider, transformOf, useDeskLayout, useEditableProps } from "./editable";
import type { EditableId } from "./editable-ids";

// Edit mode is a design tool for development only; production builds never load it.
const DeskEditor = process.env.NODE_ENV === "development" ? dynamic(() => import("./editor"), { ssr: false }) : null;
import s from "./desk.module.css";

/* ---------- Deterministic scene data (identical on server and client) ---------- */

function seeded(seed: number) {
  let state = seed;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}

// Apple logo outline (24×24), from Simple Icons (CC0): https://simpleicons.org/?q=apple
const APPLE_LOGO = "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701";

// Where Diya's introduction sits on the wall (drawing units). The text itself is HTML laid over this box.
const INTRO_BOX = { x: 510, y: 44, w: 580, h: 400 };

const QUOTE = { lines: ["The more I study, the more insatiable", "do I feel my genius for it to be."], author: "Ada Lovelace" };
// The quote is staggered: each line starts under the middle of the one above. Widths are the
// lines' natural lengths in Fraunces italic (opsz 144) at 20 units, locked with textLength.
const Q_X = 54;
const Q_W1 = 293;
const Q_W2 = 233.1;

// The quote inks in quickly as the page opens, one letter after another (about 1.5 s in all).
const INK_STEP = 0.014;
const INK_LINE_1 = 0.2;
const INK_LINE_2 = 0.75;
const INK_AUTHOR = 1.25;

// The rest of the opening, in seconds from page load: the lamp, then the MacBook start-up (Apple
// logo, then "hello", then the desktop; timed in desk.module.css), then the Sprite can.
const LAMP_ON_AT = 1.8;
const CAN_OPEN_AT = 9;

function inked(text: string, start: number, Tag: "tspan" | "span") {
  return Array.from(text).map((char, i) => <Tag key={i} className={s.ink} style={{ animationDelay: `${(start + i * INK_STEP).toFixed(2)}s` }}>{char}</Tag>);
}

const SKYLINE_BACK: [number, number, number][] = [[62, 400, 64], [126, 386, 42], [166, 398, 58], [226, 382, 48], [272, 396, 56], [326, 390, 52]];
const SKYLINE_FRONT: [number, number, number][] = [[62, 372, 32], [94, 338, 28], [122, 384, 38], [160, 304, 30], [190, 356, 42], [232, 322, 30], [262, 370, 40], [302, 342, 30], [332, 388, 46]];

const CITY_WINDOWS = (() => {
  const rand = seeded(97);
  const lit: { x: number; y: number }[] = [];
  for (const [x, top, w] of SKYLINE_FRONT) {
    for (let wy = top + 8; wy < 440; wy += 11) {
      for (let wx = x + 5; wx < x + w - 6; wx += 8) {
        // The second draw used to pick blinking windows; it stays so the lit pattern is unchanged.
        if (rand() < 0.27 && rand() >= 0) lit.push({ x: wx, y: wy });
      }
    }
  }
  return lit;
})();

const STARS: [number, number, number][] = [[92, 84, 5], [150, 120, 3.5], [258, 74, 4], [104, 196, 3], [356, 196, 4.5], [196, 228, 3], [286, 170, 3], [74, 140, 2.5], [236, 128, 2.5], [344, 252, 2.5]];

/* ---------- The can's "psst" as the desktop appears ---------- */

// A short burst of filtered noise with a fast decay, like a can being opened.
function playPsst(ctx: AudioContext) {
  const length = Math.floor(ctx.sampleRate * 0.45);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 4200;
  band.Q.value = 0.8;
  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 1800;
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.42, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.09);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  source.connect(band).connect(high).connect(gain).connect(ctx.destination);
  source.start(now);
  source.stop(now + 0.45);
}

// Browsers only allow sound after the visitor has interacted with the page, so the psst plays only
// if they have clicked, tapped or pressed a key by the time the can opens; otherwise it stays silent.
function useCanPsst() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const wait = CAN_OPEN_AT * 1000 - performance.now();
    if (!AudioCtor || wait < 0) return;
    let ctx: AudioContext | null = null;
    const unlock = () => {
      try {
        ctx = ctx ?? new AudioCtor();
        void ctx.resume().catch(() => undefined);
      } catch {
        ctx = null;
      }
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    const timer = window.setTimeout(() => {
      if (ctx?.state === "running") playPsst(ctx);
    }, wait);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      const closing = ctx;
      window.setTimeout(() => void closing?.close().catch(() => undefined), 600);
    };
  }, []);
}

// The introduction is real HTML (readable, with working links) laid over the room. It follows the
// "intro" box in the drawing, so moving or resizing that box in edit mode carries the text with it.
function useIntroAnchor(svgRef: RefObject<SVGSVGElement>, introRef: RefObject<HTMLDivElement>, scale: number, editing: boolean) {
  useLayoutEffect(() => {
    const svg = svgRef.current;
    const intro = introRef.current;
    const room = intro?.parentElement;
    if (!svg || !intro || !room) return;
    let frame = 0;
    const place = () => {
      const anchor = svg.querySelector("[data-intro-anchor]");
      if (!anchor || getComputedStyle(intro).position !== "absolute") return;
      const box = anchor.getBoundingClientRect();
      const base = room.getBoundingClientRect();
      intro.style.setProperty("--intro-cx", `${box.left + box.width / 2 - base.left}px`);
      intro.style.setProperty("--intro-top", `${box.top - base.top}px`);
      intro.style.setProperty("--intro-k", String(scale));
    };
    // While arranging, follow the box every frame so the text tracks a drag.
    const follow = () => {
      place();
      frame = requestAnimationFrame(follow);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(svg);
    if (editing) frame = requestAnimationFrame(follow);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [svgRef, introRef, scale, editing]);
}

/* ---------- The room ---------- */

// The lamp stands on a stack of books, so it, its light and its cable are raised by this much.
const LAMP_LIFT = STACK_HEIGHT - 4;

// A small heart, centred on (x, y), about 2s wide.
const heart = (x: number, y: number, size: number) =>
  `M${x} ${y + size * 0.9} C ${x - size * 1.3} ${y - size * 0.1}, ${x - size * 0.7} ${y - size}, ${x} ${y - size * 0.3} C ${x + size * 0.7} ${y - size}, ${x + size * 1.3} ${y - size * 0.1}, ${x} ${y + size * 0.9} Z`;

// Clawd, Diya's desk buddy. Hovering over it shows a greeting just above its head, drawn as HTML so
// it stays readable at any size and sits above everything else in the room.
function Clawd() {
  const [spot, setSpot] = useState<{ x: number; y: number; host: Element } | null>(null);

  useEffect(() => {
    if (!spot) return;
    const hide = () => setSpot(null);
    window.addEventListener("scroll", hide, { passive: true });
    return () => window.removeEventListener("scroll", hide);
  }, [spot]);

  const show = (event: MouseEvent<SVGImageElement>) => {
    const image = event.currentTarget;
    const host = image.closest(`.${s.root}`);
    if (!host || host.hasAttribute("data-editing")) return;
    const box = image.getBoundingClientRect();
    setSpot({ x: box.left + box.width / 2, y: box.top + box.height * 0.3, host });
  };

  return <>
    <image href="/clawd-sticker.png" x="690" y="707" width="128" height="128" preserveAspectRatio="xMidYMid meet" onMouseEnter={show} onMouseLeave={() => setSpot(null)} />
    {spot && createPortal(<span className={s.clawdHello} style={{ left: spot.x, top: spot.y }} aria-hidden="true">hello, welcome to my desk</span>, spot.host)}
  </>;
}

// One pink earbud lying on the desk: the stem runs along +x from (0, 0), the head sits at its end.
// `speaker` turns the bud so its grille faces up, as in the product photo.
function Earbud({ x, y, angle, speaker }: { x: number; y: number; angle: number; speaker?: boolean }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <ellipse cx="14" cy="4.2" rx="14" ry="1.8" fill="#000" opacity="0.28" />
    <rect x="0" y="-2.3" width="18" height="4.6" rx="2.3" fill="#efbfc7" />
    <rect x="1" y="-2.1" width="16" height="1.3" rx="0.65" fill="#fbe3e7" opacity="0.8" />
    <ellipse cx="23.5" cy="-1.2" rx="8" ry="6.6" fill="#f1c4cb" />
    <ellipse cx="25" cy="1.6" rx="6.6" ry="3.6" fill="#dfa6af" opacity="0.55" />
    <ellipse cx="21.4" cy="-3.8" rx="3.6" ry="2" fill="#fde8eb" opacity="0.85" />
    {speaker
      ? <ellipse cx="24.6" cy="-1.4" rx="3.3" ry="2.4" fill="#2a2224" />
      : <rect x="27.6" y="-4.6" width="0.9" height="2.6" rx="0.45" fill="#3a2e30" opacity="0.7" />}
  </g>;
}

// Diya's white "You are my Pookie" mug with the orange cat, used as a pen stand.
function PookieMug({ id }: { id: EditableId }) {
  const text = useEditableProps(id, { small: "YOU ARE MY", big: "POOKIE" });
  return <Editable id={id}>
    <g transform="translate(132 0)">
      <ellipse cx="500" cy="731" rx="29" ry="3.6" fill="#3a3326" />
      <PenCup />
      <path d="M530 745 C 549 745, 549 783, 530 783" stroke="#e6dfd1" strokeWidth="7" fill="none" />
      <path d="M530 745 C 549 745, 549 783, 530 783" stroke="#fffdf8" strokeWidth="2" fill="none" opacity="0.6" transform="translate(-1 -1)" />
      <rect x="470" y="730" width="60" height="68" rx="7" fill="#f7f3ea" />
      <rect x="516" y="733" width="14" height="63" rx="6" fill="#e4ddcf" />
      <rect x="470" y="730" width="60" height="6" rx="3" fill="#fffdf8" />
      <text x="497" y="741" textAnchor="middle" className={s.mugSmall}>{text.small}</text>
      {/* The orange tabby on the front of the mug */}
      <g transform="translate(0 2.6)">
        <path d={heart(484, 754, 2.2)} fill="#9ccbe8" />
        <path d={heart(510.5, 750, 1.9)} fill="#9ccbe8" />
        <path d={heart(485.5, 767, 1.7)} fill="#9ccbe8" />
        <path d="M504 770 C 514 771, 515 760, 509 757.5" stroke="#f2a03f" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <ellipse cx="497" cy="764" rx="9" ry="9.5" fill="#f6a845" />
        <ellipse cx="497" cy="766" rx="5.6" ry="6.6" fill="#fbc983" />
        <path d="M490 760 l3 1.2 M489.5 764 l3 1 M504 760 l-3 1.2 M504.5 764 l-3 1" stroke="#e07f22" strokeWidth="1.1" strokeLinecap="round" />
        <path d={heart(497, 762.6, 1.8)} fill="#e0634f" />
        <ellipse cx="493" cy="773" rx="3.2" ry="2" fill="#fbc983" />
        <ellipse cx="501" cy="773" rx="3.2" ry="2" fill="#fbc983" />
        <path d="M489.6 748 L490.4 739.4 L495 745 Z M504.4 748 L503.6 739.4 L499 745 Z" fill="#f6a845" />
        <path d="M491 745.8 L491.4 741.6 L493.6 744.4 Z M503 745.8 L502.6 741.6 L500.4 744.4 Z" fill="#f4b3a6" />
        <ellipse cx="497" cy="750.5" rx="8.6" ry="7" fill="#f6a845" />
        <path d="M494.6 744.6 l0.6 2.2 M497 744 l0 2.4 M499.4 744.6 l-0.6 2.2" stroke="#e07f22" strokeWidth="1" strokeLinecap="round" />
        <circle cx="493.9" cy="750.3" r="1.35" fill="#2a2420" />
        <circle cx="500.1" cy="750.3" r="1.35" fill="#2a2420" />
        <circle cx="494.3" cy="749.8" r="0.45" fill="#fff" />
        <circle cx="500.5" cy="749.8" r="0.45" fill="#fff" />
        <path d="M496.2 752.6 L497.8 752.6 L497 753.6 Z" fill="#d9604f" />
        <path d="M495.6 754.2 Q497 755.2 498.4 754.2" stroke="#2a2420" strokeWidth="0.55" fill="none" strokeLinecap="round" />
        <ellipse cx="491.6" cy="753.2" rx="1.5" ry="0.9" fill="#f08a7a" opacity="0.55" />
        <ellipse cx="502.4" cy="753.2" rx="1.5" ry="0.9" fill="#f08a7a" opacity="0.55" />
      </g>
      <text x="497" y="791" textAnchor="middle" className={s.mugBig}>{text.big}</text>
      <rect x="470" y="730" width="60" height="68" rx="7" fill="url(#desk-mug-shade)" />
      <ellipse cx="502" cy="799" rx="34" ry="2.8" fill="#000" opacity="0.3" />
    </g>
  </Editable>;
}

/* ---------- Quote ---------- */

// The quote's second line starts under the middle of the first. The default lines use their
// measured widths; edited text is measured in the browser.
function QuoteLines() {
  const text = useEditableProps("quote", { line1: QUOTE.lines[0], line2: QUOTE.lines[1], author: QUOTE.author });
  const isDefault = text.line1 === QUOTE.lines[0] && text.line2 === QUOTE.lines[1];
  const first = useRef<SVGTextElement>(null);
  const second = useRef<SVGTextElement>(null);
  const [widths, setWidths] = useState<[number, number]>([Q_W1, Q_W2]);
  useLayoutEffect(() => {
    if (isDefault) {
      setWidths([Q_W1, Q_W2]);
      return;
    }
    setWidths([first.current?.getComputedTextLength() ?? Q_W1, second.current?.getComputedTextLength() ?? Q_W2]);
  }, [isDefault, text.line1, text.line2]);
  const [w1, w2] = widths;
  return <g className={s.svgQuote} transform="translate(49.2 48) scale(0.9) translate(-54 -100)">
    <text ref={first} x={Q_X} y="120" textLength={isDefault ? Q_W1 : undefined} lengthAdjust="spacing" className={s.svgQuoteLine}>{inked(text.line1, INK_LINE_1, "tspan")}</text>
    <text ref={second} x={Q_X + w1 / 2} y="152" textLength={isDefault ? Q_W2 : undefined} lengthAdjust="spacing" className={s.svgQuoteLine}>{inked(text.line2, INK_LINE_2, "tspan")}</text>
    <text x={Q_X + w1 / 2 + w2 / 2} y="180" className={s.svgQuoteAuthor}>{inked(`— ${text.author}`, INK_AUTHOR, "tspan")}</text>
  </g>;
}

// The lamp's light follows wherever the lamp itself has been moved, resized or turned in edit mode.
function LampGlow() {
  const { layout } = useDeskLayout();
  return <g transform={transformOf(layout.lamp)}>
    <g className={s.lampLight} transform={`translate(216 ${-LAMP_LIFT})`}>
      <circle cx="626" cy="664" r="320" fill="url(#desk-glow)" />
      <path d={`M602 670 L662 654 L760 ${800 + LAMP_LIFT} L340 ${800 + LAMP_LIFT} Z`} fill="url(#desk-cone)" />
    </g>
  </g>;
}

function Room({ time, svgRef, lampOn, onToggleLamp, frame }: { time: { h: number; m: number } | null; svgRef: RefObject<SVGSVGElement>; lampOn: boolean; onToggleLamp?: () => void; frame: { x: number; width: number } }) {
  // Hovering the wall switch shows a small reminder above it, drawn as HTML like Clawd's greeting.
  const [switchHint, setSwitchHint] = useState<{ x: number; y: number; host: Element } | null>(null);

  useEffect(() => {
    if (!switchHint) return;
    const hide = () => setSwitchHint(null);
    window.addEventListener("scroll", hide, { passive: true });
    return () => window.removeEventListener("scroll", hide);
  }, [switchHint]);

  const showSwitchHint = (event: MouseEvent<SVGGElement>) => {
    const plate = event.currentTarget;
    const host = plate.closest(`.${s.root}`);
    if (!host || host.hasAttribute("data-editing")) return;
    const box = plate.getBoundingClientRect();
    setSwitchHint({ x: box.left + box.width / 2, y: box.top, host });
  };

  return <svg ref={svgRef} className={s.roomSvg} viewBox={`${frame.x} 0 ${frame.width} 800`} role="img" aria-label="An illustrated evening study. On the left, a black wire grid hung on two clear hooks, with a strand of tiny warm lights wound through it: Diya's prints of Lionel Messi, a Dear Zindagi poster, Snoopy in a graduation cap and a G:YM card held by wooden clothespins, a black-and-white photo-booth strip of Diya, sunglasses hooked over a wire, a Platform 9¾ ticket, an index card reading git commit -m “the messy middle”, a beaded friendship bracelet and an evil-eye keyring. In the middle, a large window over a pixel-art city, under a swirling night sky. On the right, a framed All Too Well lyrics poster in a slim black frame, a Platform 9¾ sign on a wrought-iron bracket with a pothos trailing past it, a white digital clock on a small wooden ledge showing the time, date and day in New Delhi, above three floating wooden shelves holding Diya's recommended books: the seven Harry Potter books, To Kill a Mockingbird and And Then There Were None; The Housemaid face-out beside Never Lie, The Perfect Son, Then She Was Gone and The Family Upstairs, with Matthew Perry's memoir and Maybe You Should Talk to Someone lying flat; and It Ends with Us face-out beside Lauren Asher's Fine Print series, The Love Hypothesis, Twisted Love and Better Than the Movies. A black-and-white photo-booth strip of Diya, held by a mini clothespin on a length of twine between two nails, running a selfie on a MacBook screen in a classroom and two mirror selfies. On the desk: a cube of sticky notes, a silver MacBook with pink wired earphones plugged into it and lying on the desk, showing a macOS desktop that mirrors the visitor's own Mac: their clock, the browser they are using, their battery and a screenshot from today, beside it a can of Sprite Zero Sugar that pops and fizzes when hovered, a white mug with an orange cartoon cat that says YOU ARE MY POOKIE, used as a pen stand (click a pen to leave Diya a note) full of pens and a ruler, Clawd the pixel desk buddy, a clear 4-key clicker keychain with blue switches, a desk lamp standing on a stack of Diya's books (Harry Potter and the Order of the Phoenix, It Ends with Us, To Kill a Mockingbird, The Housemaid, Maybe You Should Talk to Someone and Then She Was Gone) that switches on as the page opens, the MacBook starting up after it and the Sprite can opening once the desktop appears, plugged into a switchboard on the wall, a desk calendar showing the current month (click it to open Diya's full calendar with India's holidays and her birthday), Diya's old silver Lenovo standing closed in a vertical stand, its lid covered in stickers, a stack of books with round glasses on top, a notebook and pencil, a crumpled ball of paper, and a black Sony speaker that plays a few of Diya's songs when clicked, with a handwritten note on the desk's edge saying keep listening and exploring." preserveAspectRatio="xMidYMax slice">
    <defs>
      <linearGradient id="desk-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0f1739" />
        <stop offset="0.38" stopColor="#24275c" />
        <stop offset="0.66" stopColor="#5b2a69" />
        <stop offset="0.86" stopColor="#ad3f69" />
        <stop offset="1" stopColor="#de6d78" />
      </linearGradient>
      <linearGradient id="desk-wood" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6e4a31" />
        <stop offset="1" stopColor="#4a3121" />
      </linearGradient>
      <linearGradient id="desk-curtain" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#6f4442" />
        <stop offset="0.14" stopColor="#a86f67" />
        <stop offset="0.28" stopColor="#7c4d4a" />
        <stop offset="0.44" stopColor="#b47b72" />
        <stop offset="0.6" stopColor="#82524e" />
        <stop offset="0.76" stopColor="#ab736b" />
        <stop offset="0.9" stopColor="#7a4c49" />
        <stop offset="1" stopColor="#5f3a38" />
      </linearGradient>
      <linearGradient id="desk-cone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffd88f" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ffd88f" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="desk-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffcf7d" stopOpacity="0.55" />
        <stop offset="0.45" stopColor="#f2b45a" stopOpacity="0.18" />
        <stop offset="1" stopColor="#f2b45a" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="desk-moon-halo" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffe9b0" stopOpacity="0.5" />
        <stop offset="1" stopColor="#ffe9b0" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="desk-screen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#13241f" />
        <stop offset="1" stopColor="#0b1513" />
      </linearGradient>
      <linearGradient id="desk-alu" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d9dde3" />
        <stop offset="1" stopColor="#a9afb8" />
      </linearGradient>
      <linearGradient id="desk-alu-edge" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b4bac3" />
        <stop offset="1" stopColor="#80868f" />
      </linearGradient>
      <linearGradient id="desk-wallpaper" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#1d3557" />
        <stop offset="0.55" stopColor="#4b3a78" />
        <stop offset="1" stopColor="#c76b6b" />
      </linearGradient>
      <filter id="desk-print-shadow" x="-15%" y="-15%" width="135%" height="140%"><feGaussianBlur stdDeviation="1.8" /></filter>
      <linearGradient id="desk-shelf-shadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0.45" /><stop offset="1" stopColor="#000" stopOpacity="0" /></linearGradient>
      <filter id="desk-soft-shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" /></filter>
      <linearGradient id="desk-lamp-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1c2c23" /><stop offset="0.45" stopColor="#4b735f" /><stop offset="1" stopColor="#22362b" /></linearGradient>
      <linearGradient id="desk-lamp-shade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#557f6b" /><stop offset="0.5" stopColor="#2e4a3c" /><stop offset="1" stopColor="#1b2b22" /></linearGradient>
      <radialGradient id="desk-lamp-joint" cx="0.35" cy="0.35" r="0.7"><stop offset="0" stopColor="#9cc0ac" /><stop offset="1" stopColor="#2a4236" /></radialGradient>
      <linearGradient id="desk-mug-shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.22" />
        <stop offset="0.2" stopColor="#000" stopOpacity="0" />
        <stop offset="0.36" stopColor="#fff" stopOpacity="0.4" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.8" stopColor="#000" stopOpacity="0.06" />
        <stop offset="1" stopColor="#000" stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id="desk-book-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.14" /><stop offset="0.35" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.28" /></linearGradient>
      <clipPath id="desk-glass"><rect x="62" y="52" width="316" height="396" /></clipPath>
      <mask id="desk-crescent"><rect width="944" height="800" fill="#000" /><circle cx="318" cy="110" r="25" fill="#fff" /><circle cx="330" cy="101" r="22" fill="#000" /></mask>
    </defs>

    <Layer name="room">
    {/* Window, scaled up and centred */}
    <Editable id="window">
    <g transform="translate(598.4 -18) scale(1.28)">
    <g className={s.window}>
      <rect x="40" y="30" width="360" height="440" rx="6" fill="url(#desk-wood)" />
      <g clipPath="url(#desk-glass)">
        <rect x="62" y="52" width="316" height="396" fill="url(#desk-sky)" />
        {/* Swirling night sky */}
        <g fill="none" strokeLinecap="round">
          <path d="M62 120 C 96 80, 170 66, 222 92 C 270 118, 252 178, 204 180 C 166 182, 150 148, 172 128 C 190 112, 218 122, 214 144" stroke="#7f97d8" strokeOpacity="0.42" strokeWidth="8" strokeDasharray="34 7 14 7" />
          <path d="M72 138 C 104 100, 168 90, 210 110 C 246 128, 236 166, 204 166 C 180 166, 172 146, 186 136" stroke="#b9cbf2" strokeOpacity="0.32" strokeWidth="4" strokeDasharray="20 6 8 6" />
          <path d="M84 154 C 112 124, 160 116, 192 130" stroke="#f3e6c8" strokeOpacity="0.24" strokeWidth="3" strokeDasharray="12 7" />
          <path d="M62 214 C 104 196, 146 222, 190 210 C 236 198, 268 182, 312 196 C 340 205, 360 214, 378 208" stroke="#7f97d8" strokeOpacity="0.34" strokeWidth="7" strokeDasharray="40 8 16 8" />
          <path d="M62 232 C 112 218, 150 244, 204 230 C 252 218, 300 208, 378 226" stroke="#b9cbf2" strokeOpacity="0.24" strokeWidth="4" strokeDasharray="24 7" />
          <path d="M62 268 C 120 256, 172 282, 230 266 C 284 252, 332 254, 378 268" stroke="#9fb7ea" strokeOpacity="0.2" strokeWidth="5" strokeDasharray="30 9 10 9" />
          <path d="M62 292 C 124 282, 180 304, 240 292 C 298 282, 340 288, 378 296" stroke="#f3e6c8" strokeOpacity="0.12" strokeWidth="3" strokeDasharray="16 8" />
          <circle cx="318" cy="110" r="40" stroke="#ffe9b0" strokeOpacity="0.3" strokeWidth="4" strokeDasharray="18 6 6 6" />
          <circle cx="318" cy="110" r="54" stroke="#ffe9b0" strokeOpacity="0.16" strokeWidth="4" strokeDasharray="24 8" />
          <circle cx="318" cy="110" r="68" stroke="#b9cbf2" strokeOpacity="0.12" strokeWidth="3" strokeDasharray="14 10" />
        </g>
        <circle cx="318" cy="110" r="70" fill="url(#desk-moon-halo)" />
        <rect width="944" height="800" fill="#ffe9b0" mask="url(#desk-crescent)" />
        <g fill="#fff3d2">
          {STARS.map(([x, y, r], i) => <path key={i} opacity={i % 3 ? 0.7 : 0.95} d={`M${x} ${y - r * 1.6} L${x + r * 0.35} ${y - r * 0.35} L${x + r * 1.6} ${y} L${x + r * 0.35} ${y + r * 0.35} L${x} ${y + r * 1.6} L${x - r * 0.35} ${y + r * 0.35} L${x - r * 1.6} ${y} L${x - r * 0.35} ${y - r * 0.35} Z`} />)}
        </g>
        <g shapeRendering="crispEdges">
          {SKYLINE_BACK.map(([x, top, w]) => <rect key={`b${x}`} x={x} y={top} width={w} height={448 - top} fill="#7a2f62" opacity="0.75" />)}
          {SKYLINE_FRONT.map(([x, top, w], i) => <rect key={`f${x}`} x={x} y={top} width={w} height={448 - top} fill={i % 2 ? "#2a0f2c" : "#3a1640"} />)}
          <rect x="173" y="282" width="4" height="22" fill="#2a0f2c" />
          <rect x="171" y="276" width="8" height="6" fill="#d9505f" />
          <rect x="240" y="312" width="14" height="10" fill="#2a0f2c" />
          {CITY_WINDOWS.map((w, i) => <rect key={i} x={w.x} y={w.y} width="4" height="5" fill={i % 4 ? "#e0a656" : "#f0c97e"} opacity={i % 5 ? 0.85 : 0.6} />)}
        </g>
        <path d="M62 52 L150 52 L62 170 Z" fill="#fff" opacity="0.05" />
        <path d="M226 256 L378 52 L378 120 L270 256 Z" fill="#fff" opacity="0.04" />
      </g>
      <rect x="214" y="52" width="12" height="396" fill="#5a3c28" />
      <rect x="62" y="244" width="316" height="12" fill="#5a3c28" />
      <rect x="214" y="52" width="2.5" height="396" fill="#7a5638" />
      <rect x="62" y="244" width="316" height="2.5" fill="#7a5638" />
      <rect x="62" y="52" width="316" height="396" fill="none" stroke="#000" strokeOpacity="0.32" strokeWidth="10" clipPath="url(#desk-glass)" />
      <rect x="62" y="52" width="316" height="396" fill="none" stroke="#2f1f15" strokeWidth="3" />
      <path d="M41.5 468 L41.5 31.5 L398.5 31.5" stroke="#8c6a4c" strokeWidth="2" fill="none" />
      <path d="M398.5 31.5 L398.5 468.5 L41.5 468.5" stroke="#2e1e14" strokeWidth="2" fill="none" />
      <rect x="30" y="488" width="380" height="14" fill="url(#desk-shelf-shadow)" />
      <rect x="24" y="466" width="392" height="20" rx="3" fill="#7a5236" />
      <rect x="24" y="466" width="392" height="2.5" rx="1.2" fill="#a2774f" />
      <rect x="24" y="482" width="392" height="6" rx="2" fill="#4a3121" />
    </g>
    </g>
    </Editable>

    <Editable id="curtains">
    <g transform="translate(598.4 -18) scale(1.28)">
      {/* Curtains */}
      <rect x="10" y="14" width="420" height="7" rx="3" fill="#3d2a1e" />
      <circle cx="12" cy="17.5" r="7" fill="#3d2a1e" />
      <circle cx="428" cy="17.5" r="7" fill="#3d2a1e" />
      <path d="M22 21 L96 21 C 92 120, 70 220, 64 300 C 80 360, 98 420, 104 492 L18 492 C 24 420, 38 360, 46 300 C 34 210, 22 120, 22 21 Z" fill="url(#desk-curtain)" />
      <path d="M44 24 C 46 120, 52 220, 54 300 M70 24 C 66 120, 60 220, 56 300 M54 304 C 52 380, 44 440, 40 490 M58 304 C 70 380, 80 440, 86 490" stroke="#7d4b48" strokeOpacity="0.55" strokeWidth="2.5" fill="none" />
      <path d="M418 21 L344 21 C 348 120, 370 220, 376 300 C 360 360, 342 420, 336 492 L422 492 C 416 420, 402 360, 394 300 C 406 210, 418 120, 418 21 Z" fill="url(#desk-curtain)" />
      <path d="M396 24 C 394 120, 388 220, 386 300 M370 24 C 374 120, 380 220, 384 300 M386 304 C 388 380, 396 440, 400 490 M382 304 C 370 380, 360 440, 354 490" stroke="#7d4b48" strokeOpacity="0.55" strokeWidth="2.5" fill="none" />
      <rect x="40" y="292" width="34" height="9" rx="4" fill="#b48a4f" />
      <rect x="366" y="292" width="34" height="9" rx="4" fill="#b48a4f" />
      <rect x="40" y="292" width="34" height="2.5" rx="1.2" fill="#d8b77e" />
      <rect x="366" y="292" width="34" height="2.5" rx="1.2" fill="#d8b77e" />
    </g>
    </Editable>

    <Editable id="clock"><g transform="translate(1364 107)"><DigitalClock /></g></Editable>

    {/* Platform 9¾ sign on a wrought-iron bracket, top right between the window and the bookshelf */}
    <Editable id="platform-sign"><g transform="translate(1092 58)"><PlatformSign /></g></Editable>

    {/* Diya's framed All Too Well lyrics poster, for her to place */}
    <WallFrame id="wall-frame" x={1095} y={150} />

    {/* The box Diya's introduction follows, so edit mode can move and resize the text */}
    <Editable id="intro"><rect data-intro-anchor="" x={INTRO_BOX.x} y={INTRO_BOX.y} width={INTRO_BOX.w} height={INTRO_BOX.h} className={s.introAnchor} /></Editable>

    <WallDisplay id="pegboard" quote={<Editable id="quote"><QuoteLines /></Editable>} />

    {/* Diya's own photo-booth strip, after the rack so it hangs in front of it by default */}
    <Editable id="polaroid-series"><PolaroidSeries x={70} y={300} /></Editable>

    {/* Brown cubby bookshelf with Diya's books, on the right wall */}
    <Editable id="bookshelf">
    <g transform="translate(604 150)"><CubbyBookshelf /></g>
    </Editable>

    {/* Moonlight from the window when the lamp is off */}
    <Editable id="moonlight" className={s.passThrough}><path className={s.moonbeam} d="M650 607 L1110 607 L1240 800 L610 800 Z" fill="#b9cdf5" /></Editable>

    {/* Lamp light */}
    <Editable id="lamp-glow" className={s.passThrough}><LampGlow /></Editable>

    {/* A cube of sticky notes */}
    <Editable id="sticky-cube">
      <rect x="168" y="777" width="25" height="23" rx="1.5" fill="#f6d55c" />
      <g stroke="#d9b23a" strokeWidth="0.8" opacity="0.7">
        {[782, 786, 790, 794].map((y) => <line key={y} x1="168.5" y1={y} x2="192.5" y2={y} />)}
      </g>
      <rect x="168" y="777" width="25" height="3" rx="1.5" fill="#fbe58d" />
      <rect x="166" y="799" width="29" height="3" rx="1.5" fill="#000" opacity="0.25" />
    </Editable>

    {/* Laptop: a silver MacBook, open, seen from the front */}
    <Editable id="macbook">
    <g transform="translate(36 0)">
    <g className={s.laptop}>
      <rect x="176" y="572" width="308" height="201" rx="13" fill="url(#desk-alu)" />
      <rect x="178.5" y="574.5" width="303" height="196" rx="11" fill="#0b0d12" />
      <image href="/concepts/desk/desktop-tahoe.webp" x="186" y="582" width="288" height="180" preserveAspectRatio="xMidYMid slice" />
      <MacDesktop logo={APPLE_LOGO} />
      {/* Start-up, as on a real Mac: a dark screen, the Apple logo with a progress bar, then "hello", then the desktop */}
      <g className={s.boot} aria-hidden="true">
        <rect x="186" y="582" width="288" height="180" rx="3" fill="#000" />
        <g className={s.bootLogo}>
          <path d={APPLE_LOGO} fill="#f5f5f7" transform="translate(308 626) scale(1.9)" />
          <rect x="296" y="700" width="68" height="3" rx="1.5" fill="#3a3d44" />
          <rect className={s.bootBar} x="296" y="700" width="68" height="3" rx="1.5" fill="#f5f5f7" />
        </g>
      </g>
      <g className={s.hello} aria-hidden="true">
        <rect x="186" y="582" width="288" height="180" rx="3" fill="url(#desk-wallpaper)" />
        <rect x="186" y="582" width="288" height="180" rx="3" fill="#0b0d12" opacity="0.25" />
        <path className={s.helloStroke} pathLength={1} transform="translate(259 647) scale(1.65)" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          d="M2 28 C 10 20, 16 8, 13 3 C 10 -1, 6 6, 7 14 L 6 30 C 7 22, 11 18, 15 18 C 19 18, 19 24, 19 30 C 21 31, 26 28, 29 24 C 31 21, 29 18, 26 19 C 22 20, 22 28, 26 30 C 29 31, 33 29, 35 27 C 40 22, 45 12, 44 5 C 43 0, 38 3, 38 10 C 38 18, 38 28, 42 30 C 44 31, 47 29, 49 27 C 54 22, 59 12, 58 5 C 57 0, 52 3, 52 10 C 52 18, 52 28, 56 30 C 58 31, 61 29, 63 27 C 64 22, 68 19, 72 19 C 77 19, 78 25, 76 28 C 74 31, 68 31, 67 27 C 66 23, 70 19, 74 20 C 77 21, 80 21, 84 19" />
      </g>
      <path d="M313 582 L347 582 L347 587.5 Q347 590.5, 344 590.5 L316 590.5 Q313 590.5, 313 587.5 Z" fill="#0b0d12" />
      <rect x="182" y="772" width="296" height="3" rx="1.5" fill="#2a2d33" />
      <path d="M178 775 L482 775 L498 791 L162 791 Z" fill="url(#desk-alu)" />
      <path d="M204 777 L456 777 L464 785 L196 785 Z" fill="#23262d" />
      <g stroke="#4a4f59" strokeWidth="2.2" strokeDasharray="7 1.4">
        <line x1="206" y1="779.6" x2="454" y2="779.6" />
        <line x1="200" y1="783" x2="460" y2="783" />
      </g>
      <path d="M296 786 L364 786 L366.5 790.5 L293.5 790.5 Z" fill="#c9ced6" stroke="#9aa0aa" strokeWidth="0.6" />
      <rect x="160" y="791" width="340" height="7" rx="3.5" fill="url(#desk-alu-edge)" />
      <path d="M306 791 Q330 796.5 354 791 Z" fill="#6e747e" />
      <ellipse cx="330" cy="800" rx="176" ry="3" fill="#000" opacity="0.3" />
    </g>
    {/* Diya's pink wired earphones, plugged into the MacBook's headphone jack and left lying on the desk */}
    <Editable id="earphones">
    <g>
      <path d="M143 787 C 133 789, 133 799, 146 802.5 C 168 809, 196 811, 214 806 C 232 801, 250 803, 256 807.5" stroke="#000" strokeOpacity="0.22" strokeWidth="2.4" fill="none" transform="translate(0 1.6)" />
      <path d="M143 787 C 133 789, 133 799, 146 802.5 C 168 809, 196 811, 214 806 C 232 801, 250 803, 256 807.5" stroke="#eab6bf" strokeWidth="1.9" fill="none" strokeLinecap="round" />
      <path d="M143 786.6 C 133 788.6, 133 798.6, 146 802.1 C 168 808.6, 196 810.6, 214 805.6 C 232 800.6, 250 802.6, 256 807.1" stroke="#fbe1e5" strokeWidth="0.6" fill="none" opacity="0.8" />
      <path d="M260 807.4 C 270 806, 281 803.6, 292 805" stroke="#eab6bf" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M260 808.2 C 272 812, 290 814.2, 304 812.5" stroke="#eab6bf" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="253" y="805.4" width="8" height="4.4" rx="2" fill="#efbfc7" transform="rotate(8 257 807.6)" />
      <Earbud x={292} y={805} angle={-8} />
      <Earbud x={304} y={812.5} angle={4} speaker />
      {/* The plug, pushed into the jack on the left side of the base */}
      <path d="M150 785.2 L142.6 786 L142.6 788 L150 788.8 Z" fill="#e3adb6" />
      <rect x="149.5" y="784.4" width="14" height="4.8" rx="2.3" fill="#f0c3ca" />
      <rect x="150.5" y="784.6" width="12" height="1.4" rx="0.7" fill="#fde5e9" opacity="0.85" />
      <rect x="163" y="785.4" width="2.4" height="2.8" rx="0.6" fill="#2a2d33" />
    </g>
    </Editable>
    </g>
    </Editable>

    {/* Diya's white "You are my Pookie" mug with the orange cat, used as a pen stand */}
    <PookieMug id="pookie-mug" />

    {/* Clawd, Diya's desk buddy */}
    <Editable id="clawd"><Clawd /></Editable>

    {/* Beside the MacBook: a can of Sprite Zero Sugar that pops and fizzes when you hover it */}
    <Editable id="sprite-can"><SpriteZeroCan x={566} y={800} scale={0.9} /></Editable>

    {/* Desk lamp */}
    {/* Diya's 4-key clicker keychain, between the Sprite can and the lamp */}
    <Editable id="key-clicker"><KeyClicker x={700} y={800} /></Editable>

    {/* The stack of Diya's books the lamp stands on */}
    <Editable id="lamp-books"><LampBooks x={920} y={800} /></Editable>

    <Editable id="lamp">
    <g className={s.lamp} transform={`translate(216 ${-LAMP_LIFT})`}>
      <ellipse cx="704" cy="797" rx="60" ry="6" fill="#000" opacity="0.34" filter="url(#desk-print-shadow)" />
      <path d="M660 796 C 662 778, 746 778, 748 796 Z" fill="url(#desk-lamp-metal)" />
      <path d="M668 790 C 674 782, 734 782, 740 790" stroke="#8ab29b" strokeOpacity="0.45" strokeWidth="1.5" fill="none" />
      <rect x="698" y="770" width="12" height="12" rx="3" fill="#1f3128" />
      <path d="M704 774 L746 708 L664 646" stroke="#26392f" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M702 772 L743 707 L663 645" stroke="#79a48c" strokeOpacity="0.5" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="746" cy="708" r="9" fill="url(#desk-lamp-joint)" />
      <circle cx="704" cy="774" r="7" fill="url(#desk-lamp-joint)" />
      <path d="M636 618 L700 644 L674 698 L600 678 Z" fill="url(#desk-lamp-shade)" />
      <path d="M636 618 L700 644 L694 656 L628 630 Z" fill="#4a7260" />
      <path d="M603 677 L673 696" stroke="#13201a" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse className={s.bulb} cx="638" cy="688" rx="38" ry="9" transform="rotate(16 638 688)" fill="#ffe2a3" />
    </g>
    </Editable>

    {/* Switchboard on the wall: the lamp's rocker switch (red mark shows when it's on) and the
        socket its plug sits in; clicking the plate switches the lamp. The cable runs to the lamp. */}
    <Editable id="switchboard">
      <g className={`${s.lampSwitch}${onToggleLamp ? "" : ` ${s.lampSwitchIdle}`}`} onClick={onToggleLamp} onMouseEnter={showSwitchHint} onMouseLeave={() => setSwitchHint(null)} data-lamp-switch={lampOn ? "on" : "off"}>
        <rect x="999" y="639" width="78" height="56" rx="5" fill="#000" opacity="0.2" />
        <rect x="996" y="636" width="78" height="56" rx="5" fill="#f4f1ea" stroke="#d9d3c4" strokeWidth="1.5" />
        <rect x="1004" y="644" width="22" height="40" rx="3" fill="#e9e4d8" />
        <g className={s.switchOn}>
          <rect x="1007" y="647" width="16" height="34" rx="2" fill="#fbfaf6" />
          <rect x="1007" y="664" width="16" height="17" rx="2" fill="#e2ddd0" />
          <rect x="1010" y="650" width="10" height="3" rx="1.5" fill="#e0473f" />
        </g>
        <g className={s.switchOff}>
          <rect x="1007" y="647" width="16" height="34" rx="2" fill="#fbfaf6" />
          <rect x="1007" y="647" width="16" height="17" rx="2" fill="#e2ddd0" />
        </g>
        <circle cx="1052" cy="664" r="16" fill="#e9e4d8" />
        <rect x="1042" y="651" width="20" height="26" rx="4" fill="#fbfaf6" stroke="#d6d1c4" strokeWidth="1" />
        <g stroke="#d6d1c4" strokeWidth="1">
          <line x1="1046" y1="658" x2="1058" y2="658" />
          <line x1="1046" y1="662" x2="1058" y2="662" />
        </g>
        <rect className={s.switchHover} x="993" y="633" width="84" height="62" rx="7" fill="none" stroke="#f2b45a" strokeWidth="2" />
      </g>
      {switchHint && createPortal(<span className={s.switchHint} style={{ left: switchHint.x, top: switchHint.y }} aria-hidden="true">switch it off when you&apos;re away</span>, switchHint.host)}
      <path d={`M1052 677 C 1050 707, 1002 709, 962 ${792 - LAMP_LIFT}`} stroke="#1d2333" strokeWidth="3" fill="none" strokeLinecap="round" />
    </Editable>

    {/* Diya's old Lenovo in a vertical stand at the back of the desk, its stickered lid to the room */}
    <Editable id="old-laptop"><OldLaptop x={1223} y={800} scale={0.9} /></Editable>

    {/* Books lying flat, with Diya's round glasses on top */}
    <Editable id="book-stack">
    <g transform="translate(274 0)">
      <ellipse cx="856" cy="800" rx="78" ry="3" fill="#000" opacity="0.3" />
      <rect x="786" y="780" width="140" height="20" rx="2" fill="#2f4a3c" />
      <rect x="786" y="784" width="140" height="3" fill="#3e624f" />
      <rect x="796" y="764" width="122" height="16" rx="2" fill="#f3e6c8" />
      <rect x="796" y="768" width="8" height="8" fill="#e59a8c" />
      <rect x="806" y="750" width="104" height="14" rx="2" fill="#b5523b" />
      {[[786, 780, 140, 20], [796, 764, 122, 16], [806, 750, 104, 14]].map(([bx, by, bw, bh]) => <g key={by}>
        <rect x={bx} y={by} width={bw} height={bh} rx="2" fill="url(#desk-book-shade)" />
        <rect x={bx + 2} y={by} width={bw - 4} height="1.2" fill="#fff" opacity="0.18" />
      </g>)}
      <Layer name="book-stack">
      <Editable id="glasses">
      <path d="M829 742 L816 749 M877 742 L891 749" stroke="#d6d9df" strokeWidth="2" strokeLinecap="round" />
      <g fill="#cfe0ff" fillOpacity="0.16" stroke="#d6d9df" strokeWidth="2">
        <ellipse cx="840" cy="740" rx="10.5" ry="8.5" />
        <ellipse cx="866" cy="740" rx="10.5" ry="8.5" />
      </g>
      <path d="M850.5 739 Q853 735 855.5 739" stroke="#d6d9df" strokeWidth="2" fill="none" />
      </Editable>
      </Layer>
    </g>
    </Editable>

    {/* Notebook and pencil */}
    <Editable id="notebook">
    <g transform="translate(1262 766) scale(0.85)">
      <rect x="6" y="36" width="190" height="4" rx="2" fill="#000" opacity="0.25" />
      <rect x="10" y="10" width="180" height="27" rx="3" fill="#2f4a3c" />
      <rect x="14" y="14" width="172" height="5" fill="#f3e6c8" />
      <rect x="14" y="20" width="172" height="2" fill="#d8c7a0" />
      <rect x="10" y="10" width="180" height="4" rx="2" fill="#3e624f" />
      <rect x="150" y="10" width="7" height="27" fill="#e59a8c" />
      <rect x="22" y="25" width="60" height="6" rx="1" fill="#f3e6c8" opacity="0.85" />
      <g transform="rotate(-4 120 6)">
        <rect x="70" y="2" width="62" height="7" rx="1" fill="#f2b45a" />
        <rect x="70" y="2" width="62" height="2" fill="#ffd27a" />
        <rect x="124" y="2" width="8" height="7" fill="#e59a8c" />
        <path d="M70 2 L60 5.5 L70 9 Z" fill="#e8cfa2" />
        <path d="M63 4.5 L60 5.5 L63 6.5 Z" fill="#1d2333" />
      </g>
    </g>
    </Editable>

    {/* A crumpled ball of paper */}
    <Editable id="paper-ball">
      <ellipse cx="1440" cy="799" rx="13" ry="2.5" fill="#000" opacity="0.25" />
      <path d="M1428 788 C 1426 778, 1434 773, 1441 775 C 1449 772, 1455 780, 1452 788 C 1454 796, 1444 800, 1438 798 C 1431 800, 1426 795, 1428 788 Z" fill="#efe8d8" />
      <path d="M1432 781 L1440 786 L1447 779 M1436 793 L1441 786 L1449 791 M1431 789 L1440 786" stroke="#c9bfa9" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    </Editable>

    {/* A desk calendar that always shows the current month, beside the lamp */}
    <Editable id="calendar"><ClickableCalendar x={1012} y={800} scale={0.72} /></Editable>

    {/* Sony speaker: click it to play one of Diya's songs */}
    <Editable id="speaker"><SpeakerPlayer x={1514} y={800} scale={0.95}><SonySpeaker x={1514} y={800} scale={0.95} /></SpeakerPlayer></Editable>

    </Layer>

  </svg>;
}

/* ---------- Page ---------- */

// The room is drawn on a 1600×800 canvas, but objects can be dragged past its edges in edit mode.
// Widen the frame to take in every placed object (never narrower than the canvas), so nothing is
// cut off at any screen width. Decorative light shapes don't count, and the frame holds still while
// editing so the room doesn't rescale under the pointer.
const FRAME_IGNORE = new Set(["lamp-glow", "moonlight"]);

function useRoomFrame(svgRef: RefObject<SVGSVGElement>, layout: unknown, editing: boolean) {
  const [frame, setFrame] = useState({ x: 0, width: 1600 });
  useEffect(() => {
    if (editing) return;
    let cancelled = false;
    const measure = () => {
      const svg = svgRef.current;
      const ctm = svg?.getScreenCTM();
      if (!svg || !ctm || cancelled) return;
      const toRoom = ctm.inverse();
      let min = 0;
      let max = 1600;
      for (const el of Array.from(svg.querySelectorAll<SVGGElement>("[data-edit-id]"))) {
        if (el.parentElement?.closest("[data-edit-id]") || FRAME_IGNORE.has(el.dataset.editId ?? "")) continue;
        const box = el.getBoundingClientRect();
        if (!box.width || !box.height) continue;
        min = Math.min(min, new DOMPoint(box.left, box.top).matrixTransform(toRoom).x);
        max = Math.max(max, new DOMPoint(box.right, box.top).matrixTransform(toRoom).x);
      }
      const x = Math.floor(min - (min < 0 ? 16 : 0));
      const width = Math.ceil(max + (max > 1600 ? 16 : 0)) - x;
      setFrame((old) => (old.x === x && old.width === width ? old : { x, width }));
    };
    const raf = requestAnimationFrame(measure);
    document.fonts?.ready.then(() => requestAnimationFrame(measure));
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [svgRef, layout, editing]);
  return frame;
}

export default function Desk() {
  return <LayoutProvider><DeskPage /></LayoutProvider>;
}

function DeskPage() {
  const { layout, editing, setEditing, setSelected } = useDeskLayout();
  const roomRef = useRef<SVGSVGElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const introGone = Boolean(layout.intro?.deleted || layout.intro?.hidden);
  useIntroAnchor(roomRef, introRef, layout.intro?.scale ?? 1, editing);
  const frame = useRoomFrame(roomRef, layout, editing);
  const quoteText = useEditableProps("quote", { line1: QUOTE.lines[0], line2: QUOTE.lines[1], author: QUOTE.author });
  const [lampOn, setLampOn] = useState(false);
  const [flicker, setFlicker] = useState(false);
  const [time, setTime] = useState<{ h: number; m: number } | null>(null);
  useCanPsst();

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "numeric", hourCycle: "h23" });
    const tick = () => {
      const parts = format.formatToParts(new Date());
      setTime({ h: Number(parts.find((part) => part.type === "hour")?.value ?? 0), m: Number(parts.find((part) => part.type === "minute")?.value ?? 0) });
    };
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, []);

  // The lamp switches itself on each time the page opens; without motion it is simply on.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLampOn(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setLampOn(true);
      setFlicker(true);
    }, Math.max(0, LAMP_ON_AT * 1000 - performance.now()));
    return () => window.clearTimeout(timer);
  }, []);

  const toggleLamp = () => {
    const next = !lampOn;
    setLampOn(next);
    setFlicker(next);
  };


  return <div className={s.root} data-lamp={lampOn ? "on" : "off"} data-flicker={flicker ? "true" : undefined} data-editing={editing || undefined} onAnimationEnd={(event) => { if (event.animationName.includes("flicker")) setFlicker(false); }}>
    <a className={s.skip} href="#top">Skip to main content</a>

    <header className={s.topbar}>
      <SiteNav className={s.siteNav} />
      <div className={s.controls} role="group" aria-label="Room controls">
        <button type="button" className={s.control} aria-pressed={lampOn} onClick={toggleLamp} aria-label="Desk lamp" title="Turn the desk lamp on or off">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 3h6l3 7H6l3-7Z" fill="currentColor" /><path d="M12 10v9M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <span className={s.controlText}>Lamp</span>
        </button>
        {DeskEditor && <button type="button" className={s.control} aria-pressed={editing} onClick={() => { setSelected(null); setEditing(!editing); }} title="Move, resize and rotate anything in the room (development only)">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="2" /></svg>
          <span className={s.controlText}>Edit</span>
        </button>}
      </div>
    </header>
    {DeskEditor && editing && <DeskEditor svgRef={roomRef} />}

    <main id="top">
      <section className={s.hero} aria-labelledby="desk-name">
        <div className={s.room}>
          <div ref={introRef} className={introGone ? s.srOnly : s.intro}>
            <h1 id="desk-name" className={s.introName}>{profile.name}</h1>
            <p className={s.introRole}>
              <span className={s.introUnderline}>Developer
                <svg viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M2 7 C 30 2, 70 2, 118 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
              </span>
              <span>&nbsp;· Agentic systems, RAG &amp; ML</span>
              <span className={s.introPlace}><MapPin aria-hidden="true" />{profile.location}</span>
            </p>
            <p className={s.introText}>I like to work on agentic systems, RAG pipelines, and study core ML/DL architectures.</p>
            <p className={s.introEducation}>{profile.education}</p>
            <div className={s.introActions}>
              <a className={s.introPrimary} href={profile.resume} download="Diya-Virmani-Resume.pdf"><FileText aria-hidden="true" />Résumé<span className={s.srOnly}> (PDF download)</span></a>
              <span className={s.introNote} aria-hidden="true">
                <svg viewBox="0 0 44 26" focusable="false"><path d="M3 22 C 14 22, 26 18, 38 6 M30 6 L38 6 L37 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                résumé is right here
              </span>
            </div>
            <ul className={s.introLinks} aria-label="Profiles">
              <li><a href={profile.github} target="_blank" rel="noopener noreferrer"><Github aria-hidden="true" />GitHub</a></li>
              <li><a href={profile.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin aria-hidden="true" />LinkedIn</a></li>
              <li><a href={`mailto:${profile.email}`}><Mail aria-hidden="true" />Email</a></li>
            </ul>
          </div>
          <figure className={s.heroQuote}>
            <blockquote>
              <p><span className={s.srOnly}>{quoteText.line1} {quoteText.line2}</span><span aria-hidden="true"><span className={s.heroQuoteLine}>{inked(quoteText.line1, INK_LINE_1, "span")}</span> <span className={`${s.heroQuoteLine} ${s.heroQuoteLine2}`}>{inked(quoteText.line2, INK_LINE_2, "span")}</span></span></p>
            </blockquote>
            <figcaption><span className={s.srOnly}>— {quoteText.author}</span><span aria-hidden="true">{inked(`— ${quoteText.author}`, INK_AUTHOR, "span")}</span></figcaption>
          </figure>

          <div className={s.scene}>
            <div className={s.stage} style={{ "--scene-ratio": frame.width / 800 } as CSSProperties}>
              <Room time={time} svgRef={roomRef} lampOn={lampOn} onToggleLamp={editing ? undefined : toggleLamp} frame={frame} />
            </div>
            <div className={s.deskTop} aria-hidden="true" />
          </div>
        </div>

      </section>
    </main>

    <footer className={s.footer}>
      <p>© 2026 {profile.name} · {profile.location}</p>
      <p className={s.privacy}>This site counts visits anonymously: no cookies, no names, no IP addresses.</p>
    </footer>

  </div>;
}
