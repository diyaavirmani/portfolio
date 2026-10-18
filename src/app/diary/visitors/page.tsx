import type { Metadata } from "next";
import { Caveat, Fraunces, Nunito_Sans } from "next/font/google";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DIARY_COOKIE, DIARY_PATH, diaryAccess } from "@/lib/desk-diary-auth";
import { visitStore, type DeskVisit } from "@/lib/desk-visits";
import { clearVisits } from "../actions";
import CountMe from "./count-me";
import s from "../diary.module.css";

// Diya's private visitor log: anonymous visits to the desk, newest first. Same sign-in as the diary.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Desk visitors",
  robots: { index: false, follow: false, nocache: true },
};

const display = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], variable: "--diary-display", display: "swap" });
const body = Nunito_Sans({ subsets: ["latin"], variable: "--diary-body", display: "swap" });
const hand = Caveat({ subsets: ["latin"], variable: "--diary-hand", display: "swap" });

const when = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
const countryName = new Intl.DisplayNames(["en"], { type: "region" });
const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT = 100;

function duration(ms: number) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 5) return "a few seconds";
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ${seconds % 60} s`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function place(visit: DeskVisit) {
  const country = visit.country ? (() => { try { return countryName.of(visit.country) ?? visit.country; } catch { return visit.country; } })() : "";
  return [visit.city, country].filter(Boolean).join(", ") || "Unknown place";
}

const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

function top(values: string[], limit = 5) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export default async function VisitorsPage() {
  const access = diaryAccess(cookies().get(DIARY_COOKIE)?.value);
  if (access === "closed") notFound();
  if (access === "locked") redirect(DIARY_PATH);

  return <main className={`${s.page} ${display.variable} ${body.variable} ${hand.variable}`}>
    <div className={s.book}>
      <span className={s.ribbon} aria-hidden="true" />
      <header className={s.header}>
        <p className={s.kicker}>From the desk</p>
        <h1 className={s.title}>Visitors</h1>
        <nav className={s.tabs} aria-label="Diary">
          <Link href={DIARY_PATH}>Notes</Link>
          <span aria-current="page">Visitors</span>
        </nav>
      </header>
      <Visits />
      <Link className={s.back} href="/">Back to the desk</Link>
    </div>
  </main>;
}

async function Visits() {
  const store = visitStore();
  if (!store) return <p className={s.empty}>No visit store is set up yet, so visits aren&apos;t being counted.</p>;
  let visits: DeskVisit[];
  try {
    visits = await store.list();
  } catch {
    return <p className={s.empty} role="alert">The visitor log couldn&apos;t be read just now. Try again in a moment.</p>;
  }

  const now = Date.now();
  const within = (days: number) => visits.filter((visit) => now - Date.parse(visit.startedAt) < days * DAY_MS);
  const month = within(30);

  return <>
    <p className={s.privacyNote}>Counted without names, cookies or IP addresses, and kept for 90 days. Browsers that ask not to be tracked are skipped, and so are search engine crawlers.</p>
    <dl className={s.stats}>
      <div><dt>Today</dt><dd>{within(1).length}</dd></div>
      <div><dt>Last 7 days</dt><dd>{within(7).length}</dd></div>
      <div><dt>Last 30 days</dt><dd>{month.length}</dd></div>
      <div><dt>Typical stay</dt><dd>{month.length ? duration(median(month.map((visit) => visit.activeMs))) : "–"}</dd></div>
    </dl>

    {month.length > 0 && <div className={s.tops}>
      <Top title="Where they came from" rows={top(month.map((visit) => visit.source || "Direct or unknown"))} />
      <Top title="Where they are" rows={top(month.map(place))} />
      <Top title="What they used" rows={top(month.map((visit) => `${visit.device[0].toUpperCase()}${visit.device.slice(1)} · ${visit.browser} on ${visit.os}`))} />
    </div>}

    <h2 className={s.subhead}>Recent visits</h2>
    {visits.length === 0
      ? <p className={s.empty}>No visits yet. When someone opens the desk, it shows up here.</p>
      : <ol className={s.visits}>
        {visits.slice(0, RECENT).map((visit) => <li key={visit.id} className={s.visit}>
          <time className={s.date} dateTime={visit.startedAt}>{when.format(new Date(visit.startedAt))}</time>
          <p className={s.stay}>Stayed {duration(visit.activeMs)}</p>
          <p className={s.meta}>{place(visit)} · {visit.source ? `from ${visit.source}` : "came directly"} · {visit.device}, {visit.browser} on {visit.os}</p>
        </li>)}
      </ol>}

    <div className={s.controls}>
      <CountMe />
      {visits.length > 0 && <details className={s.tearOut}>
        <summary>Clear the visitor log</summary>
        <form action={clearVisits}>
          <button type="submit">Delete every recorded visit</button>
        </form>
      </details>}
    </div>
  </>;
}

function Top({ title, rows }: { title: string; rows: [string, number][] }) {
  return <section className={s.top}>
    <h2 className={s.subhead}>{title}</h2>
    <ol>
      {rows.map(([label, count]) => <li key={label}><span>{label}</span><span>{count}</span></li>)}
    </ol>
  </section>;
}
