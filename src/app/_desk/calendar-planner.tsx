"use client";

// The desk calendar as a way in: hovering shows "click me", and clicking opens a full calendar in
// the same style as the card on the desk, with India's holidays, Diya's birthday and (when she has
// connected a calendar she made public) her own events. Data comes from /api/desk-calendar.

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { DeskCalendar } from "./desk-objects";
import { useDeskLayout } from "./editable";
import s from "./desk.module.css";
import c from "./calendar-planner.module.css";

type Kind = "birthday" | "public" | "event" | "observance";
type Mark = { date: string; title: string; kind: Kind };
type YearData = { marks: Mark[]; holidaysAvailable: boolean; eventsConnected: boolean };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const KIND_ORDER: Kind[] = ["birthday", "public", "event", "observance"];
const KIND_LABEL: Record<Kind, string> = { birthday: "Birthday", public: "Public holiday", event: "Diya's event", observance: "Festival / observance" };

function newDelhiToday() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month") - 1, day: get("day") };
}

const iso = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

function useYear(year: number) {
  const [years, setYears] = useState<Record<number, YearData | "loading" | "error">>({});
  useEffect(() => {
    if (years[year]) return;
    setYears((current) => ({ ...current, [year]: "loading" }));
    fetch(`/api/desk-calendar?year=${year}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data: YearData) => setYears((current) => ({ ...current, [year]: data })))
      .catch(() => setYears((current) => ({ ...current, [year]: "error" })));
  }, [year, years]);
  return years[year];
}

function Planner({ onClose }: { onClose: () => void }) {
  const today = newDelhiToday();
  const [view, setView] = useState({ year: today.year, month: today.month });
  const data = useYear(view.year);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => { root.style.overflow = overflow; };
  }, []);

  const step = (delta: number) => setView(({ year, month }) => {
    const next = month + delta;
    return { year: year + Math.floor(next / 12), month: ((next % 12) + 12) % 12 };
  });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { event.stopPropagation(); onClose(); return; }
    if (event.key === "ArrowLeft" && event.altKey) step(-1);
    if (event.key === "ArrowRight" && event.altKey) step(1);
    if (event.key !== "Tab" || !dialog.current) return;
    const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])"));
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const marks = typeof data === "object" ? data.marks : [];
  const prefix = `${view.year}-${String(view.month + 1).padStart(2, "0")}-`;
  const monthMarks = marks.filter((mark) => mark.date.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date) || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
  const byDay = new Map<number, Mark[]>();
  for (const mark of monthMarks) {
    const day = Number(mark.date.slice(8));
    byDay.set(day, [...(byDay.get(day) ?? []), mark]);
  }

  const firstWeekday = new Date(Date.UTC(view.year, view.month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const isThisMonth = view.year === today.year && view.month === today.month;
  const status = data === "loading" || data === undefined ? "Fetching the holidays…"
    : data === "error" ? "The calendar couldn't load right now. Try again in a moment."
    : !data.holidaysAvailable ? "Showing the main national holidays; the full list couldn't load right now." : null;

  return <div className={c.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialog} className={c.card} role="dialog" aria-modal="true" aria-labelledby="desk-planner-title" onKeyDown={onKeyDown}>
      <header className={c.band}>
        <div className={c.titleRow}>
          <h2 id="desk-planner-title" className={c.title}><span className={c.month}>{MONTHS[view.month]}</span> <span className={c.year}>{view.year}</span></h2>
          <button ref={closeButton} type="button" className={c.close} onClick={onClose} aria-label="Close the calendar">×</button>
        </div>
        <div className={c.nav}>
          <button type="button" className={c.navButton} onClick={() => step(-1)} aria-label="Previous month">‹</button>
          <button type="button" className={c.todayButton} onClick={() => setView({ year: today.year, month: today.month })} disabled={isThisMonth}>Today</button>
          <button type="button" className={c.navButton} onClick={() => step(1)} aria-label="Next month">›</button>
        </div>
      </header>

      <div className={c.grid} role="grid" aria-label={`${MONTHS[view.month]} ${view.year}`}>
        <div className={c.weekRow} role="row">
          {WEEKDAYS.map((name, i) => <span key={name} role="columnheader" className={i === 0 ? `${c.weekday} ${c.sunday}` : c.weekday}>{name}</span>)}
        </div>
        <div className={c.days}>
          {Array.from({ length: firstWeekday }, (_, i) => <span key={`pad${i}`} className={c.pad} aria-hidden="true" />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayMarks = byDay.get(day) ?? [];
            const weekday = (firstWeekday + i) % 7;
            const isToday = isThisMonth && day === today.day;
            const kinds = new Set(dayMarks.map((mark) => mark.kind));
            const classes = [c.day, weekday === 0 || kinds.has("public") ? c.red : "", kinds.has("birthday") ? c.birthday : "", isToday ? c.today : ""].filter(Boolean).join(" ");
            const label = [`${day} ${MONTHS[view.month]}`, isToday ? "today" : "", ...dayMarks.map((mark) => mark.title)].filter(Boolean).join(", ");
            const headline = dayMarks.find((mark) => mark.kind !== "observance");
            return <div key={day} role="gridcell" aria-label={label} className={classes} title={dayMarks.map((mark) => mark.title).join(" · ") || undefined}>
              <span className={c.number}>{day}</span>
              {kinds.has("birthday") && <svg className={c.heart} viewBox="0 0 16 14" aria-hidden="true"><path d="M8 13.4C3.4 10 .6 7.4.6 4.5.6 2.3 2.3.6 4.4.6c1.5 0 2.8.8 3.6 2 .8-1.2 2.1-2 3.6-2 2.1 0 3.8 1.7 3.8 3.9 0 2.9-2.8 5.5-7.4 8.9Z" /></svg>}
              {headline && headline.kind !== "birthday" && <span className={`${c.chip} ${c[headline.kind]}`}>{headline.title}</span>}
              {dayMarks.length > 0 && <span className={c.dots} aria-hidden="true">{Array.from(kinds).map((kind) => <i key={kind} className={c[kind]} />)}</span>}
            </div>;
          })}
        </div>
      </div>

      <section className={c.list} aria-labelledby="desk-planner-list">
        <h3 id="desk-planner-list" className={c.listTitle}>This month</h3>
        {status && <p className={c.status}>{status}</p>}
        {monthMarks.length === 0 && !status && <p className={c.status}>Nothing marked this month.</p>}
        <ul>
          {monthMarks.map((mark) => <li key={`${mark.date}${mark.title}`} className={c[mark.kind]}>
            <span className={c.listDate}>{Number(mark.date.slice(8))} {MONTHS[view.month].slice(0, 3)}</span>
            <span className={c.listName}>{mark.title}</span>
            <span className={c.listKind}>{KIND_LABEL[mark.kind]}</span>
          </li>)}
        </ul>
      </section>

      <footer className={c.foot}>
        <ul className={c.legend} aria-label="Key">
          {KIND_ORDER.map((kind) => <li key={kind}><i className={c[kind]} aria-hidden="true" />{KIND_LABEL[kind]}</li>)}
        </ul>
        <p className={c.source}>Holidays from Google&apos;s &ldquo;Holidays in India&rdquo; calendar. Sundays and public holidays in red.</p>
        <p className={c.sign} aria-hidden="true">DIYA · DESK</p>
      </footer>
    </div>
  </div>;
}

export function ClickableCalendar(props: { x: number; y: number; scale?: number }) {
  const { editing } = useDeskLayout();
  const trigger = useRef<SVGGElement>(null);
  const [hint, setHint] = useState<{ x: number; y: number; host: Element } | null>(null);
  const [host, setHost] = useState<Element | null>(null);

  useEffect(() => {
    if (!hint) return;
    const hide = () => setHint(null);
    window.addEventListener("scroll", hide, { passive: true });
    return () => window.removeEventListener("scroll", hide);
  }, [hint]);

  const showHint = () => {
    const card = trigger.current;
    const root = card?.closest(`.${s.root}`);
    if (!card || !root || editing || host) return;
    const box = card.getBoundingClientRect();
    setHint({ x: box.left + box.width / 2, y: box.top + box.height * 0.08, host: root });
  };

  const open = () => {
    const root = trigger.current?.closest(`.${s.root}`);
    if (!root || editing) return;
    setHint(null);
    setHost(root);
  };

  const close = useCallback(() => {
    setHost(null);
    trigger.current?.focus();
  }, []);

  const onClick = (event: MouseEvent<SVGGElement>) => {
    if (editing) return;
    event.stopPropagation();
    open();
  };

  const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (editing || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    open();
  };

  return <>
    <g ref={trigger} className={editing ? undefined : c.trigger} role={editing ? undefined : "button"} tabIndex={editing ? undefined : 0}
      aria-label={editing ? undefined : "Open Diya's calendar"} aria-haspopup={editing ? undefined : "dialog"}
      onMouseEnter={showHint} onMouseLeave={() => setHint(null)} onFocus={showHint} onBlur={() => setHint(null)} onClick={onClick} onKeyDown={onKeyDown}>
      <DeskCalendar {...props} />
    </g>
    {hint && createPortal(<span className={s.clawdHello} style={{ left: hint.x, top: hint.y }} aria-hidden="true">click me</span>, hint.host)}
    {host && createPortal(<Planner onClose={close} />, host)}
  </>;
}
