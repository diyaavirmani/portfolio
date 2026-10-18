import type { Metadata } from "next";
import { Caveat, Fraunces, Nunito_Sans } from "next/font/google";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DIARY_COOKIE, VISITORS_PATH, diaryAccess } from "@/lib/desk-diary-auth";
import { noteStore, type DeskNote } from "@/lib/desk-notes";
import { removeNote, unlockDiary } from "./actions";
import s from "./diary.module.css";

// Diya's private desk diary: every note visitors leave at the desk, newest first. Only she can
// read it (see src/lib/desk-diary-auth.ts) and remove notes from it.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Desk diary",
  robots: { index: false, follow: false, nocache: true },
};

const display = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], variable: "--diary-display", display: "swap" });
const body = Nunito_Sans({ subsets: ["latin"], variable: "--diary-body", display: "swap" });
const hand = Caveat({ subsets: ["latin"], variable: "--diary-hand", display: "swap" });

const when = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

export default async function DiaryPage({ searchParams }: { searchParams: { wrong?: string } }) {
  const access = diaryAccess(cookies().get(DIARY_COOKIE)?.value);
  if (access === "closed") notFound();

  return <main className={`${s.page} ${display.variable} ${body.variable} ${hand.variable}`}>
    <div className={s.book}>
      <span className={s.ribbon} aria-hidden="true" />
      <header className={s.header}>
        <p className={s.kicker}>From the desk</p>
        <h1 className={s.title}>Desk diary</h1>
        {access === "open" && <nav className={s.tabs} aria-label="Diary">
          <span aria-current="page">Notes</span>
          <Link href={VISITORS_PATH}>Visitors</Link>
        </nav>}
      </header>
      {access === "locked" ? <Unlock wrong={searchParams.wrong} /> : <Notes />}
      <Link className={s.back} href="/">Back to the desk</Link>
    </div>
  </main>;
}

function Unlock({ wrong }: { wrong?: string }) {
  return <form className={s.unlock} action={unlockDiary}>
    <label htmlFor="diary-password">This diary is private. Enter the password to read it.</label>
    <input id="diary-password" name="password" type="password" autoComplete="current-password" required />
    {wrong === "1" && <p className={s.wrong} role="alert">That isn&apos;t the password.</p>}
    {wrong === "wait" && <p className={s.wrong} role="alert">Too many tries. Wait a few minutes and try again.</p>}
    <button type="submit">Open the diary</button>
  </form>;
}

async function Notes() {
  const store = noteStore();
  if (!store) return <p className={s.empty}>No note store is set up yet, so visitors can&apos;t leave notes.</p>;
  let notes: DeskNote[];
  try {
    notes = await store.list();
  } catch {
    return <p className={s.empty} role="alert">The diary couldn&apos;t be read just now. Try again in a moment.</p>;
  }
  if (!notes.length) return <p className={s.empty}>No notes yet. When someone leaves one at the desk, it shows up here.</p>;
  return <>
    <p className={s.count}>{notes.length === 1 ? "1 note" : `${notes.length} notes`}, newest first</p>
    <ol className={s.notes}>
      {notes.map((note) => <li key={note.id} className={s.note}>
        <time className={s.date} dateTime={note.at}>{when.format(new Date(note.at))}</time>
        <p className={s.message}>{note.message}</p>
        <p className={s.from}>{note.from ? `from ${note.from}` : "left without a name"}</p>
        <details className={s.tearOut}>
          <summary>Remove</summary>
          <form action={removeNote}>
            <input type="hidden" name="id" value={note.id} />
            <button type="submit">Remove this note for good</button>
          </form>
        </details>
      </li>)}
    </ol>
  </>;
}
