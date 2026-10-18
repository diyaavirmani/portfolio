"use client";

// The pens in Diya's Pookie mug double as a way to leave her a note. Hovering lifts them a little,
// clicking one pulls it out of the mug, and a sticky note flies out with a short form. Keyboard and
// screen-reader users get the same note from a plain button that appears when focused.
//
// Where notes go: they're POSTed to /api/desk-notes, which files them in Diya's desk diary
// (read at /diary). Nothing is emailed.

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { useDeskLayout } from "./editable";
import styles from "./pen-note.module.css";

const MAX_MESSAGE = 280;
const MAX_FROM = 60;

type Note = { message: string; from: string; website: string };
type Outcome = "sent" | "closed" | "busy";

async function sendNote(note: Note): Promise<Outcome> {
  const response = await fetch("/api/desk-notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(note) });
  if (response.status === 503) return "closed";
  if (response.status === 429) return "busy";
  if (!response.ok) throw new Error(`Desk notes answered ${response.status}`);
  return "sent";
}

// The four writing tools in the mug, drawn in the mug's own coordinates. `hit` is the strip of the
// bundle that picks each one, so the thin pens are easy to click.
const PENS = [
  { name: "pencil", rotate: "rotate(-13 486 742)", hit: [470, 488], parts: [
    { x: 483, y: 676, w: 6, h: 66, rx: 1, fill: "#f2b45a" },
    { x: 483, y: 676, w: 6, h: 7, rx: 1, fill: "#e59a8c" },
    { x: 483, y: 683, w: 6, h: 3, rx: 0, fill: "#c9ced6" },
  ] },
  { name: "black pen", rotate: "rotate(-4 494 742)", hit: [488, 501], parts: [
    { x: 492, y: 666, w: 5, h: 76, rx: 2.5, fill: "#1d2333" },
    { x: 492, y: 666, w: 5, h: 10, rx: 2.5, fill: "#7f97d8" },
    { x: 495.4, y: 678, w: 1.6, h: 22, rx: 0.8, fill: "#c9ced6" },
  ] },
  { name: "blue pen", rotate: "rotate(7 508 742)", hit: [501, 513], parts: [
    { x: 505, y: 670, w: 5, h: 72, rx: 2.5, fill: "#3d6fd8" },
    { x: 505, y: 670, w: 5, h: 9, rx: 2.5, fill: "#f3e6c8" },
  ] },
  { name: "highlighter", rotate: "rotate(14 514 742)", hit: [513, 530], parts: [
    { x: 510, y: 682, w: 9, h: 60, rx: 2, fill: "#e5707e" },
    { x: 510, y: 682, w: 9, h: 13, rx: 2, fill: "#f7a8b8" },
  ] },
];

const RULER_TICKS = [668, 676, 684, 692, 700, 708];

type Origin = { x: number; y: number };

export function PenCup() {
  const { editing } = useDeskLayout();
  const [host, setHost] = useState<Element | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [hint, setHint] = useState<Origin | null>(null);
  const [taken, setTaken] = useState<number | null>(null);
  const [returning, setReturning] = useState<number | null>(null);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [thanks, setThanks] = useState(false);
  const anchor = useRef<SVGGElement>(null);
  const opener = useRef<HTMLElement | SVGElement | null>(null);
  const timer = useRef<number>();

  useEffect(() => {
    setHost(anchor.current?.closest("[data-lamp]") ?? null);
    return () => window.clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (!hint) return;
    const hide = () => setHint(null);
    window.addEventListener("scroll", hide, { passive: true });
    return () => window.removeEventListener("scroll", hide);
  }, [hint]);

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const take = (index: number, from: Element) => {
    if (taken !== null || origin) return;
    const box = from.getBoundingClientRect();
    opener.current = null;
    setHint(null);
    setTaken(index);
    timer.current = window.setTimeout(() => setOrigin({ x: box.left + box.width / 2, y: box.top }), reduced() ? 0 : 380);
  };

  const openFromButton = (button: HTMLButtonElement) => {
    if (origin) return;
    const pens = anchor.current?.getBoundingClientRect();
    opener.current = button;
    setTaken(1);
    setOrigin(pens ? { x: pens.left + pens.width / 2, y: pens.top } : { x: window.innerWidth / 2, y: window.innerHeight / 2 });
  };

  const close = (sent: boolean) => {
    const pen = taken;
    setOrigin(null);
    setTaken(null);
    setReturning(pen);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setReturning(null), 450);
    if (sent) setThanks(true);
    const back = opener.current;
    if (back && "focus" in back) back.focus();
  };

  useEffect(() => {
    if (!thanks) return;
    const id = window.setTimeout(() => setThanks(false), 4200);
    return () => window.clearTimeout(id);
  }, [thanks]);

  const enter = (index: number, event: PointerEvent<SVGRectElement>) => {
    setHovered(index);
    if (taken !== null || origin) return;
    const box = anchor.current?.getBoundingClientRect();
    if (box && event.pointerType === "mouse") setHint({ x: box.left + box.width / 2, y: box.top });
  };

  const live = !editing;
  return <>
    <g ref={anchor} className={live ? styles.live : undefined}>
      {PENS.slice(0, 2).map((pen, i) => <Pen key={pen.name} pen={pen} index={i} hovered={hovered} taken={taken} returning={returning} />)}
      <g transform="rotate(2 501 742)">
        <rect x="498" y="660" width="8" height="82" rx="1" fill="#f3e6c8" />
        {RULER_TICKS.map((y) => <rect key={y} x="498" y={y} width={y % 16 === 12 ? 4 : 2.5} height="1" fill="#8a7a62" />)}
      </g>
      {PENS.slice(2).map((pen, i) => <Pen key={pen.name} pen={pen} index={i + 2} hovered={hovered} taken={taken} returning={returning} />)}
      {live && PENS.map((pen, i) => <rect key={pen.name} className={styles.hit} x={pen.hit[0]} y="650" width={pen.hit[1] - pen.hit[0]} height="82" fill="transparent"
        onPointerEnter={(event) => enter(i, event)} onPointerLeave={() => { setHovered(null); setHint(null); }}
        onClick={(event) => take(i, event.currentTarget.parentElement?.children[i < 2 ? i : i + 1] ?? event.currentTarget)} />)}
    </g>
    {host && live && createPortal(<>
      <button type="button" className={styles.keyboardButton} onClick={(event) => openFromButton(event.currentTarget)}>Leave Diya a note</button>
      {hint && <span className={styles.hint} style={{ left: hint.x, top: hint.y }} aria-hidden="true">take a pen, leave a note</span>}
      {origin && <NoteCard origin={origin} onClose={close} />}
      {thanks && <p className={styles.thanks} role="status">Thanks. Your note is tucked into Diya&apos;s diary.</p>}
    </>, host)}
  </>;
}

function Pen({ pen, index, hovered, taken, returning }: { pen: (typeof PENS)[number]; index: number; hovered: number | null; taken: number | null; returning: number | null }) {
  const state = taken === index ? styles.taken : returning === index ? styles.returning : hovered === index ? styles.lifted : "";
  return <g className={`${styles.pen} ${state}`} style={{ transitionDelay: `${index * 30}ms` }}>
    <g transform={pen.rotate}>
      {pen.parts.map((part, i) => <rect key={i} x={part.x} y={part.y} width={part.w} height={part.h} rx={part.rx} fill={part.fill} />)}
    </g>
  </g>;
}

function NoteCard({ origin, onClose }: { origin: Origin; onClose: (sent: boolean) => void }) {
  const [message, setMessage] = useState("");
  const [from, setFrom] = useState("");
  const [trap, setTrap] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "closed" | "busy">("idle");
  const [leaving, setLeaving] = useState(false);
  const card = useRef<HTMLFormElement>(null);
  const text = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const countId = useId();

  useEffect(() => {
    text.current?.focus({ preventScroll: true });
  }, []);

  const dx = origin.x - window.innerWidth / 2;
  const dy = origin.y - window.innerHeight / 2;

  const finish = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return onClose(true);
    setLeaving(true);
    window.setTimeout(() => onClose(true), 520);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const note = { message: message.trim(), from: from.trim(), website: trap };
    if (!note.message || status === "sending") return;
    if (trap) return finish();
    setStatus("sending");
    try {
      const outcome = await sendNote(note);
      if (outcome === "sent") finish();
      else setStatus(outcome);
    } catch {
      setStatus("error");
    }
  };

  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose(false);
      return;
    }
    if (event.key !== "Tab" || !card.current) return;
    const focusable = Array.from(card.current.querySelectorAll<HTMLElement>("textarea, input:not([tabindex='-1']), button")).filter((el) => !el.hasAttribute("disabled"));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const left = MAX_MESSAGE - message.length;
  return <div className={styles.backdrop} onKeyDown={keys} onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(false); }}>
    <form ref={card} className={`${styles.note} ${leaving ? styles.leaving : ""}`} style={{ ["--dx" as string]: `${dx}px`, ["--dy" as string]: `${dy}px` }}
      role="dialog" aria-modal="true" aria-labelledby={titleId} onSubmit={submit}>
      <span className={styles.tape} aria-hidden="true" />
      <h2 id={titleId} className={styles.title}>A note for Diya</h2>
      <label className={styles.srOnly} htmlFor={`${titleId}-message`}>Your note</label>
      <textarea id={`${titleId}-message`} ref={text} className={styles.message} value={message} maxLength={MAX_MESSAGE} rows={5} required
        placeholder="Share anything, She isn't judgemental." aria-describedby={countId}
        onChange={(event) => { setMessage(event.target.value); if (status !== "sending") setStatus("idle"); }} />
      <p id={countId} className={styles.count} aria-live="polite">{left <= 40 ? `${left} characters left` : `Up to ${MAX_MESSAGE} characters`}</p>
      <label className={styles.fromLabel} htmlFor={`${titleId}-from`}>From <span>(optional: your name, or how to reach you)</span></label>
      <input id={`${titleId}-from`} className={styles.from} value={from} maxLength={MAX_FROM} autoComplete="name" onChange={(event) => setFrom(event.target.value)} />
      <input className={styles.trap} tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={trap} onChange={(event) => setTrap(event.target.value)} />
      {status === "error" && <p className={styles.error} role="alert">That didn&apos;t go through. Try again in a moment.</p>}
      {status === "busy" && <p className={styles.error} role="alert">That&apos;s a lot of notes at once. Give it a few minutes and try again.</p>}
      {status === "closed" && <p className={styles.closed} role="status">Notes aren&apos;t open yet. Keep this one and try again soon.</p>}
      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={() => onClose(false)}>Put the pen back</button>
        <button type="submit" className={styles.send} disabled={!message.trim() || status === "sending"}>{status === "sending" ? "Sending…" : "Send note"}</button>
      </div>
    </form>
  </div>;
}
