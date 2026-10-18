"use client";

import { useEffect, useRef, useState } from "react";
import s from "./mac-desktop.module.css";

// The macOS desktop on the MacBook's screen (x 186–474, y 582–762 in room units), drawn over
// the wallpaper. It mirrors the visitor's own Mac as far as a browser can tell: their clock and
// date format, the browser they are using (in the menu bar and the Dock), their battery where the
// browser shares it, and their light or dark appearance. Nothing leaves the page.
const SCREEN = { x: 186, y: 582, w: 288, h: 180 };
// Menus stop at the camera notch, and the clock gets this much room before the status icons move left.
const MENU_END = 311;
const CLOCK_ROOM = 51;

type App = { name: string; icon: string | null; menus: string[] };

const FINDER: App = { name: "Finder", icon: null, menus: ["File", "Edit", "View", "Go", "Window", "Help"] };
const BROWSERS: Record<string, App> = {
  safari: { name: "Safari", icon: null, menus: ["File", "Edit", "View", "History", "Bookmarks", "Window", "Help"] },
  chrome: { name: "Chrome", icon: "chrome", menus: ["File", "Edit", "View", "History", "Bookmarks", "Profiles", "Tab", "Window", "Help"] },
  firefox: { name: "Firefox", icon: "firefox", menus: ["File", "Edit", "View", "History", "Bookmarks", "Tools", "Window", "Help"] },
  edge: { name: "Microsoft Edge", icon: "edge", menus: ["File", "Edit", "View", "History", "Favorites", "Tab", "Window", "Help"] },
};

function detectBrowser(ua: string): App {
  if (/Edg\//.test(ua)) return BROWSERS.edge;
  if (/Firefox\//.test(ua)) return BROWSERS.firefox;
  if (/Chrome\//.test(ua)) return BROWSERS.chrome;
  if (/Safari\//.test(ua)) return BROWSERS.safari;
  return FINDER;
}

type Battery = { level: number; charging: boolean };
type BatteryManager = Battery & EventTarget;

type Visitor = { clock: string; today: Date | null; app: App; dark: boolean; battery: Battery | null };

function useVisitor(): Visitor {
  // Generic on the server; filled in once mounted so the markup matches during hydration.
  const [visitor, setVisitor] = useState<Visitor>({ clock: "", today: null, app: FINDER, dark: false, battery: null });
  useEffect(() => {
    const update = (patch: Partial<Visitor>) => setVisitor((current) => ({ ...current, ...patch }));
    update({ app: detectBrowser(navigator.userAgent) });

    // The visitor's own time zone and locale, formatted the way the macOS menu bar shows them.
    const format = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    const tick = () => {
      const now = new Date();
      update({ today: now, clock: format.format(now).replace(/,/g, "").replace(/\b(am|pm)\b/i, (part) => part.toUpperCase()) });
    };
    tick();
    const timer = window.setInterval(tick, 15000);

    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => update({ dark: scheme.matches });
    onScheme();
    scheme.addEventListener("change", onScheme);

    // Only Chromium browsers share the battery; elsewhere the icon stays generic.
    let battery: BatteryManager | null = null;
    const onBattery = () => battery && update({ battery: { level: battery.level, charging: battery.charging } });
    const getBattery = (navigator as Navigator & { getBattery?: () => Promise<BatteryManager> }).getBattery;
    getBattery?.call(navigator).then((manager) => {
      battery = manager;
      onBattery();
      manager.addEventListener("levelchange", onBattery);
      manager.addEventListener("chargingchange", onBattery);
    }).catch(() => {});

    return () => {
      window.clearInterval(timer);
      scheme.removeEventListener("change", onScheme);
      battery?.removeEventListener("levelchange", onBattery);
      battery?.removeEventListener("chargingchange", onBattery);
    };
  }, []);
  return visitor;
}

function Folder({ cx, top, arrow = false }: { cx: number; top: number; arrow?: boolean }) {
  return <g>
    <path d={`M${cx - 7} ${top + 2.6} q0 -1.4 1.2 -1.4 h4 l1.4 1.4 h6.2 q1.2 0 1.2 1.2 v1.2 h-14 z`} fill="#7cc6fa" />
    <rect x={cx - 7} y={top + 3.4} width="14" height="9.6" rx="1.2" fill="url(#mac-folder)" />
    <rect x={cx - 7} y={top + 3.4} width="14" height="1" rx="0.5" fill="#c4e8ff" opacity="0.9" />
    {arrow && <path d={`M${cx} ${top + 5.6} v4.4 M${cx - 1.9} ${top + 8.2} l1.9 1.9 l1.9 -1.9`} stroke="#fff" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
  </g>;
}

function Screenshot({ cx, top }: { cx: number; top: number }) {
  return <g>
    <rect x={cx - 7.2} y={top + 2.4} width="14.4" height="9.6" rx="0.6" fill="#fff" />
    <rect x={cx - 6.5} y={top + 3.1} width="13" height="8.2" fill="url(#mac-shot)" />
    <ellipse cx={cx - 2} cy={top + 9.4} rx="2.2" ry="1" fill="#55616b" />
    <ellipse cx={cx + 3.4} cy={top + 10.2} rx="2.8" ry="1.1" fill="#6b757e" />
  </g>;
}

function Label({ cx, y, lines }: { cx: number; y: number; lines: string[] }) {
  return <g>
    {lines.map((line, i) => <g key={line}>
      <text x={cx + 0.25} y={y + i * 4.4 + 0.3} textAnchor="middle" className={s.labelShadow}>{line}</text>
      <text x={cx} y={y + i * 4.4} textAnchor="middle" className={s.label}>{line}</text>
    </g>)}
  </g>;
}

// Dock icons, each drawn in a 10×10 box.
function DockIcon({ name, month = "", day = "" }: { name: string; month?: string; day?: string }) {
  switch (name) {
    case "finder":
      return <g>
        <rect width="10" height="10" rx="2.3" fill="#1d84f2" />
        <path d="M5.4 0 H7.7 Q10 0 10 2.3 V7.7 Q10 10 7.7 10 H4.5 C5.5 7.6 4.3 5.4 5.4 0 Z" fill="#dcefff" />
        <rect x="2.9" y="2.8" width="0.75" height="1.9" rx="0.35" fill="#0b2a4a" />
        <rect x="6.5" y="2.8" width="0.75" height="1.9" rx="0.35" fill="#0b2a4a" />
        <path d="M2.3 6.5 Q5 8.6 7.7 6.5" stroke="#0b2a4a" strokeWidth="0.6" fill="none" strokeLinecap="round" />
      </g>;
    case "safari":
      return <g>
        <rect width="10" height="10" rx="2.3" fill="#f4f6f9" />
        <circle cx="5" cy="5" r="3.9" fill="url(#mac-safari)" />
        <path d="M5 5 L7.7 2.3 L5.7 5.7 Z" fill="#ff3b30" />
        <path d="M5 5 L2.3 7.7 L4.3 4.3 Z" fill="#fff" />
      </g>;
    case "messages":
      return <g>
        <rect width="10" height="10" rx="2.3" fill="url(#mac-messages)" />
        <ellipse cx="5" cy="4.7" rx="3.3" ry="2.6" fill="#fff" />
        <path d="M3 6.5 L2.2 8.1 L4.4 7.1 Z" fill="#fff" />
      </g>;
    case "mail":
      return <g>
        <rect width="10" height="10" rx="2.3" fill="url(#mac-mail)" />
        <rect x="2" y="3" width="6" height="4.2" rx="0.5" fill="#fff" />
        <path d="M2.2 3.2 L5 5.5 L7.8 3.2" stroke="#1a7bf0" strokeWidth="0.5" fill="none" />
      </g>;
    case "music":
      return <g>
        <rect width="10" height="10" rx="2.3" fill="url(#mac-music)" />
        <path d="M4 7.2 V3.2 L7 2.4 V6.4" stroke="#fff" strokeWidth="0.7" fill="none" strokeLinejoin="round" />
        <circle cx="3.3" cy="7.3" r="1" fill="#fff" />
        <circle cx="6.3" cy="6.5" r="1" fill="#fff" />
      </g>;
    case "notes":
      return <g>
        <rect width="10" height="10" rx="2.3" fill="#fdfdfb" />
        <path d="M0 2.3 Q0 0 2.3 0 H7.7 Q10 0 10 2.3 V2.8 H0 Z" fill="#f9cf3c" />
        {[4.6, 6, 7.4].map((y) => <line key={y} x1="1.6" y1={y} x2="8.4" y2={y} stroke="#d6d6d6" strokeWidth="0.4" />)}
      </g>;
    case "photos":
      return <g>
        <rect width="10" height="10" rx="2.3" fill="#fdfdfd" />
        {["#f9a23b", "#f6d743", "#8fd14f", "#3fc0a6", "#3c8ff2", "#8a6bf0", "#e65cb8", "#f2564f"].map((color, n) => <ellipse key={color} cx="5" cy="3.1" rx="1.15" ry="1.9" fill={color} opacity="0.85" transform={`rotate(${n * 45} 5 5)`} />)}
      </g>;
    case "calendar":
      return <g>
        <rect width="10" height="10" rx="2.3" fill="#fdfdfd" />
        <text x="5" y="3.3" textAnchor="middle" className={s.calMonth}>{month}</text>
        <text x="5" y="8.6" textAnchor="middle" className={s.calDay}>{day}</text>
      </g>;
    case "chrome":
      return <g>
        <rect width="10" height="10" rx="2.3" fill="#f4f6f9" />
        <path d="M5 5 L1.54 3 A4 4 0 0 1 8.46 3 Z" fill="#e94235" />
        <path d="M5 5 L8.46 3 A4 4 0 0 1 5 9 Z" fill="#fbbc04" />
        <path d="M5 5 L5 9 A4 4 0 0 1 1.54 3 Z" fill="#34a853" />
        <circle cx="5" cy="5" r="1.9" fill="#fff" />
        <circle cx="5" cy="5" r="1.45" fill="#4285f4" />
      </g>;
    case "firefox":
      return <g>
        <rect width="10" height="10" rx="2.3" fill="#f4f6f9" />
        <circle cx="5" cy="5.2" r="3.9" fill="url(#mac-firefox-globe)" />
        <path d="M2 3.4 C 2.6 1.6, 4.8 0.8, 6.6 1.6 C 5.4 1.6, 4.4 2.4, 4.4 3.4 C 6.4 3.2, 8 4.6, 7.6 6.6 C 7.2 8.6, 5 9.6, 3.2 8.8 C 1.6 8.1, 0.8 6, 1.6 4.4 Z" fill="url(#mac-firefox-fox)" />
      </g>;
    case "edge":
      return <g>
        <rect width="10" height="10" rx="2.3" fill="#f4f6f9" />
        <circle cx="5" cy="5" r="3.9" fill="url(#mac-edge)" />
        <path d="M2.4 6.2 C 2.4 3.8, 4.8 2.6, 6.6 3.4 C 8 4, 8.2 5.6, 7 6.2 C 6.2 6.6, 4.6 6.4, 4.4 5.4 C 4 6.8, 5.4 8.4, 7.4 8.2 C 5.2 9.4, 2.4 8.4, 2.4 6.2 Z" fill="#f4f6f9" opacity="0.92" />
      </g>;
    case "settings":
      return <g>
        <rect width="10" height="10" rx="2.3" fill="url(#mac-settings)" />
        <circle cx="5" cy="5" r="3.2" fill="none" stroke="#5f646c" strokeWidth="1.3" strokeDasharray="1 0.9" />
        <circle cx="5" cy="5" r="2.6" fill="#6c7179" />
        <circle cx="5" cy="5" r="1.1" fill="#c9ccd2" />
      </g>;
    case "trash":
      return <g>
        <path d="M2.3 2.6 H7.7 L7.1 9.4 Q7 9.9 6.5 9.9 H3.5 Q3 9.9 2.9 9.4 Z" fill="#e9ecf0" opacity="0.92" />
        {[3.8, 5, 6.2].map((x) => <line key={x} x1={x} y1="3.6" x2={x} y2="9" stroke="#b6bcc5" strokeWidth="0.35" />)}
        <rect x="1.8" y="1.7" width="6.4" height="1.1" rx="0.5" fill="#f6f7f9" />
      </g>;
    default:
      return null;
  }
}

// The apps a new Mac keeps in its Dock.
const DEFAULT_DOCK = ["finder", "safari", "messages", "mail", "photos", "calendar", "notes", "music", "settings"];

export default function MacDesktop({ logo }: { logo: string }) {
  const { clock, today, app, dark, battery } = useVisitor();
  const DOCK = app.icon ? [...DEFAULT_DOCK, app.icon] : DEFAULT_DOCK;
  const RUNNING = new Set(["finder", app.icon ?? (app === BROWSERS.safari ? "safari" : "finder")]);
  const month = today ? today.toLocaleDateString(undefined, { month: "short" }).toUpperCase() : "";
  const day = today ? String(today.getDate()) : "";
  const isoDate = today ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}` : "";
  const { x, y, w } = SCREEN;
  const menuRef = useRef<SVGTextElement>(null);
  const clockRef = useRef<SVGTextElement>(null);
  const [menuCount, setMenuCount] = useState(app.menus.length);
  const [iconShift, setIconShift] = useState(0);

  // As on a real MacBook, a menu that would run under the notch is left out entirely, and a longer
  // clock (e.g. "Sun Oct 18 11:02 AM") pushes the status icons left.
  useEffect(() => {
    const spans = menuRef.current?.querySelectorAll("tspan");
    if (spans) {
      let count = 0;
      for (let i = 1; i < spans.length; i++) {
        const box = spans[i].getBBox();
        if (box.x + box.width > MENU_END) break;
        count = i;
      }
      setMenuCount(count);
    }
    setIconShift(Math.max(0, (clockRef.current?.getComputedTextLength() ?? 0) - CLOCK_ROOM));
  }, [app, clock]);

  const iconX = x + w - 18;
  const size = 10;
  const gap = 1.6;
  const dockW = (DOCK.length + 2) * size + (DOCK.length + 1) * gap + 3 + 6;
  const dockX = x + w / 2 - dockW / 2;
  const dockY = 745;
  const iconLeft = (i: number) => dockX + 3 + i * (size + gap) + (i >= DOCK.length ? 3 : 0);

  return <g className={s.desktop} aria-hidden="true">
    <defs>
      <linearGradient id="mac-folder" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#62b8f6" />
        <stop offset="1" stopColor="#2f8fe0" />
      </linearGradient>
      <linearGradient id="mac-shot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2d7fd6" />
        <stop offset="0.5" stopColor="#5fb9e8" />
        <stop offset="0.55" stopColor="#2fb4b1" />
        <stop offset="1" stopColor="#1f8f9c" />
      </linearGradient>
      <linearGradient id="mac-safari" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3fb4f0" />
        <stop offset="1" stopColor="#1a6fe0" />
      </linearGradient>
      <linearGradient id="mac-messages" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#63f37a" />
        <stop offset="1" stopColor="#12c13c" />
      </linearGradient>
      <linearGradient id="mac-mail" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#21b5ff" />
        <stop offset="1" stopColor="#0a6dee" />
      </linearGradient>
      <linearGradient id="mac-music" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fd6a83" />
        <stop offset="1" stopColor="#f8243c" />
      </linearGradient>
      <linearGradient id="mac-firefox-globe" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#9059ff" />
        <stop offset="1" stopColor="#3a1d8f" />
      </linearGradient>
      <linearGradient id="mac-firefox-fox" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffbd4f" />
        <stop offset="0.5" stopColor="#ff7139" />
        <stop offset="1" stopColor="#e31587" />
      </linearGradient>
      <linearGradient id="mac-edge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#36c26b" />
        <stop offset="0.5" stopColor="#1a9fd9" />
        <stop offset="1" stopColor="#1250a8" />
      </linearGradient>
      <clipPath id="mac-menus"><rect x="186" y="582" width="126" height="9" /></clipPath>
      <linearGradient id="mac-settings" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d3d6db" />
        <stop offset="1" stopColor="#8e939b" />
      </linearGradient>
    </defs>

    {/* Menu bar: Apple menu, Finder's menus (the notch hides the rest), status icons and clock */}
    <rect x={x} y={y} width={w} height="9" fill="#0b1a2e" opacity="0.2" />
    <path d={logo} fill="#fff" transform={`translate(${x + 5} ${y + 1.5}) scale(0.25)`} />
    <text ref={menuRef} x={x + 14} y={y + 6.3} className={s.menu} clipPath="url(#mac-menus)">
      <tspan className={s.app}>{app.name}</tspan>
      {app.menus.map((menu, i) => <tspan key={menu} dx="4.5" visibility={i < menuCount ? "visible" : "hidden"}>{menu}</tspan>)}
    </text>
    <g stroke="#fff" fill="none" strokeLinecap="round" transform={`translate(${-iconShift} 0)`}>
      <rect x="370" y="584.4" width="10" height="4.8" rx="1.4" strokeWidth="0.55" />
      <rect x="371" y="585.4" width={battery ? Math.max(0.8, 6.4 * battery.level) : 6.4} height="2.8" rx="0.7" fill={battery && battery.level < 0.2 && !battery.charging ? "#ff453a" : "#fff"} stroke="none" />
      {battery?.charging && <path d="M375.3 584.9 L373.4 587.2 H375 L374.2 589.3 L376.3 586.7 H374.7 Z" fill="#0b1a2e" stroke="none" />}
      <rect x="380.4" y="586" width="0.9" height="1.6" rx="0.4" fill="#fff" stroke="none" opacity="0.7" />
      <path d="M385.5 586.6 A 4.2 4.2 0 0 1 391.5 586.6" strokeWidth="0.75" />
      <path d="M386.7 587.8 A 2.6 2.6 0 0 1 390.3 587.8" strokeWidth="0.75" />
      <circle cx="388.5" cy="589.2" r="0.7" fill="#fff" stroke="none" />
      <circle cx="398.6" cy="586.3" r="1.9" strokeWidth="0.7" />
      <line x1="400" y1="587.7" x2="401.6" y2="589.3" strokeWidth="0.8" />
      <rect x="405.5" y="584" width="7" height="2.2" rx="1.1" strokeWidth="0.5" />
      <circle cx="406.7" cy="585.1" r="0.75" fill="#fff" stroke="none" />
      <rect x="405.5" y="587" width="7" height="2.2" rx="1.1" strokeWidth="0.5" />
      <circle cx="411.3" cy="588.1" r="0.75" fill="#fff" stroke="none" />
    </g>
    <text ref={clockRef} x={x + w - 5} y={y + 6.3} textAnchor="end" className={s.clock}>{clock}</text>

    {/* Desktop: a screenshot taken today, like on most Macs */}
    {today && <g>
      <Screenshot cx={iconX} top={596} />
      <Label cx={iconX} y={614.2} lines={["Screenshot", isoDate]} />
    </g>}

    {/* Pointer */}
    <path d="M0 0 V8.6 L2.1 6.6 L3.5 9.8 L4.9 9.2 L3.5 6.1 L6.3 6.1 Z" fill="#111" stroke="#fff" strokeWidth="0.5" strokeLinejoin="round" transform="translate(352 668) scale(0.9)" />

    {/* Dock */}
    <rect x={dockX} y={dockY} width={dockW} height="14" rx="4.5" fill={dark ? "#1c1c1e" : "#fff"} opacity={dark ? 0.42 : 0.24} />
    <rect x={dockX + 0.25} y={dockY + 0.25} width={dockW - 0.5} height="13.5" rx="4.3" fill="none" stroke="#fff" strokeOpacity={dark ? 0.2 : 0.45} strokeWidth="0.4" />
    {DOCK.map((name, i) => <g key={name} transform={`translate(${iconLeft(i)} ${dockY + 1.6})`}>
      <rect x="0.3" y="0.6" width="10" height="10" rx="2.3" fill="#000" opacity="0.18" />
      <DockIcon name={name} month={month} day={day} />
      {RUNNING.has(name) && <circle cx="5" cy="11.6" r="0.55" fill="#fff" opacity="0.85" />}
    </g>)}
    <line x1={iconLeft(DOCK.length) - 2.3} y1={dockY + 2.5} x2={iconLeft(DOCK.length) - 2.3} y2={dockY + 11.5} stroke="#fff" strokeOpacity="0.4" strokeWidth="0.4" />
    <g transform={`translate(${iconLeft(DOCK.length)} ${dockY + 1.6})`}>
      <rect x="0.3" y="0.6" width="10" height="10" rx="2.3" fill="#000" opacity="0.12" />
      <Folder cx={5} top={-1.6} arrow />
    </g>
    <g transform={`translate(${iconLeft(DOCK.length + 1)} ${dockY + 1.6})`}>
      <DockIcon name="trash" />
    </g>
  </g>;
}
