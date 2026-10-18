"use client";

import { useEffect, useState } from "react";
import o from "./desk-objects.module.css";

// Desk objects drawn in their own coordinates: (0, 0) is the point where the object's
// base meets the desk, so each one is placed with a single translate/scale.

type Placement = { x: number; y: number; scale?: number };

const place = ({ x, y, scale = 1 }: Placement) => `translate(${x} ${y}) scale(${scale})`;

/* ---------- Sony mini speaker ---------- */

export function SonySpeaker(props: Placement) {
  return <g transform={place(props)}>
    <defs>
      <linearGradient id="obj-spk-body" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#0c0c0e" />
        <stop offset="0.35" stopColor="#2b2b30" />
        <stop offset="0.6" stopColor="#1a1a1e" />
        <stop offset="1" stopColor="#09090b" />
      </linearGradient>
      <pattern id="obj-spk-mesh" width="2.4" height="2.4" patternUnits="userSpaceOnUse">
        <rect width="2.4" height="2.4" fill="#141417" />
        <circle cx="1.2" cy="1.2" r="0.55" fill="#3a3a40" />
      </pattern>
    </defs>
    <ellipse cx="0" cy="0" rx="30" ry="3.6" fill="#000" opacity="0.35" />
    {/* base band with mesh and feet */}
    <rect x="-24" y="-12" width="48" height="11" rx="5" fill="url(#obj-spk-mesh)" />
    <rect x="-14" y="-3" width="10" height="3" rx="1.5" fill="#050506" />
    <rect x="4" y="-3" width="10" height="3" rx="1.5" fill="#050506" />
    {/* rubber body */}
    <path d="M-27 -62 Q-27 -72 -17 -72 L17 -72 Q27 -72 27 -62 L27 -20 Q27 -11 18 -11 L-18 -11 Q-27 -11 -27 -20 Z" fill="url(#obj-spk-body)" />
    <ellipse cx="0" cy="-71" rx="24" ry="5" fill="url(#obj-spk-mesh)" />
    <ellipse cx="0" cy="-71" rx="24" ry="5" fill="none" stroke="#2f2f35" strokeWidth="1" />
    <text className={o.sony} transform="translate(3.4 -24) rotate(-90)">SONY</text>
    <rect x="-20" y="-66" width="4" height="48" rx="2" fill="#fff" opacity="0.07" />
  </g>;
}

/* ---------- Desk calendar: always shows this month in New Delhi ---------- */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Today = { year: number; month: number; day: number };

function newDelhiToday(): Today {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month") - 1, day: get("day") };
}

export function DeskCalendar(props: Placement) {
  // Rendered empty on the server and filled in once mounted, so a cached build never
  // shows a stale month; it re-checks every minute and rolls over at midnight in New Delhi.
  const [today, setToday] = useState<Today | null>(null);
  useEffect(() => {
    const tick = () => setToday((current) => {
      const next = newDelhiToday();
      return current && current.day === next.day && current.month === next.month && current.year === next.year ? current : next;
    });
    tick();
    const timer = window.setInterval(tick, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const firstWeekday = today ? new Date(Date.UTC(today.year, today.month, 1)).getUTCDay() : 0;
  const daysInMonth = today ? new Date(Date.UTC(today.year, today.month + 1, 0)).getUTCDate() : 0;
  const rows = Math.ceil((firstWeekday + daysInMonth) / 7);
  const rowGap = rows > 5 ? 9.6 : 11.4;

  return <g transform={place(props)}>
    <ellipse cx="2" cy="0" rx="62" ry="4" fill="#000" opacity="0.28" />
    {/* folded paper stand with paw prints */}
    <path d="M-62 -2 L-20 -40 L-8 -2 Z" fill="#8f88c9" />
    <path d="M18 -2 L30 -40 L56 -2 Z" fill="#c9c3ef" />
    <g fill="#6b63a8" opacity="0.6">
      {[[-40, -10], [-28, -20], [-46, -22], [36, -10], [30, -22]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}><ellipse cx="0" cy="1.6" rx="2.2" ry="1.8" /><circle cx="-2.2" cy="-1.4" r="0.9" /><circle cx="0" cy="-2.2" r="0.9" /><circle cx="2.2" cy="-1.4" r="0.9" /></g>)}
    </g>
    {/* the card */}
    <g transform="rotate(-3 0 -70)">
      <rect x="-58" y="-132" width="118" height="116" rx="11" fill="#fdfcf8" stroke="#d9d4e6" strokeWidth="1" />
      <path d="M-52 -126 Q-40 -130 -28 -126 Q-16 -122 -4 -126 Q8 -130 20 -126 Q32 -122 44 -126 L54 -126 L54 -30 Q42 -26 30 -30 Q18 -34 6 -30 Q-6 -26 -18 -30 Q-30 -34 -42 -30 L-52 -30 Z" fill="#d6dcf3" />
      <text x="-46" y="-110" className={o.calMonth}>{today ? MONTHS[today.month] : ""}</text>
      <text x="51" y="-110" textAnchor="end" className={o.calYear}>{today ? today.year : ""}</text>
      {WEEKDAYS.map((name, i) => <text key={name} x={-42 + i * 15} y="-97" textAnchor="middle" className={o.calWeekday}>{name}</text>)}
      {today && Array.from({ length: daysInMonth }, (_, i) => {
        const cell = firstWeekday + i;
        const cx = -42 + (cell % 7) * 15;
        const cy = -84 + Math.floor(cell / 7) * rowGap;
        const isToday = i + 1 === today.day;
        return <g key={i}>
          {isToday && <circle cx={cx} cy={cy - 2.6} r="5.4" fill="#e5707e" />}
          <text x={cx} y={cy} textAnchor="middle" className={isToday ? `${o.calDay} ${o.calToday}` : o.calDay}>{i + 1}</text>
        </g>;
      })}
      <text x="1" y="-21" textAnchor="middle" className={o.calFoot}>DIYA · DESK</text>
    </g>
  </g>;
}
