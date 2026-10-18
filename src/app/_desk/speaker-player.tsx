"use client";

// The Sony speaker plays a few of Diya's songs. Clicking it opens a small player in the corner of the
// screen with her picks; choosing one loads that track in Spotify's player (a 30-second preview, or the
// full song for visitors signed in to Spotify) and starts it. Closing the player folds it into a small
// "now playing" pill so the song keeps going while the visitor explores; the pill has pause/play, a
// way back to the list, and a stop button. Nothing loads from Spotify until a song is chosen. A
// handwritten note on the desk points to the speaker.
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDeskLayout } from "./editable";
import styles from "./speaker-player.module.css";

type Song = { title: string; artist: string; spotify: string };

// Spotify track ids, each checked against Spotify's oEmbed and the artist's own catalogue. (Most of
// the official YouTube videos refuse to play when embedded on another site, so Spotify it is.)
const SONGS: Song[] = [
  { title: "Love Story (Taylor's Version)", artist: "Taylor Swift", spotify: "6YvqWjhGD8mB5QXcbcUKtx" },
  { title: "The Prophecy", artist: "Taylor Swift", spotify: "18WFFUIsewmA8g31KAeo3e" },
  { title: "Thode Hum Thode Tum", artist: "Nanku, HVSH", spotify: "2c5fWhWzYK10mPoWALCXiU" },
  { title: "positions", artist: "Ariana Grande", spotify: "35mvY5S1H3J2QZyna3TFe0" },
  { title: "Stuck with U", artist: "Ariana Grande & Justin Bieber", spotify: "4HBZA5flZLE435QTztThqH" },
  { title: "Shaayar", artist: "Bharat Chauhan & Seedhe Maut", spotify: "1Y7FQSN29oNXHZBGMkADeH" },
];

const embedUrl = (id: string) => `https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0`;

// Spotify's iFrame API (https://developer.spotify.com/documentation/embeds/references/iframe-api)
// lets the page start, pause and swap tracks in its embed, so the song can keep playing with the
// panel folded away and still be paused from the pill.
type EmbedController = {
  loadUri: (uri: string) => void;
  play: () => void;
  togglePlay: () => void;
  destroy: () => void;
  addListener: (event: string, callback: (event: { data?: { isPaused?: boolean } }) => void) => void;
};
type SpotifyIFrameAPI = {
  createController: (element: HTMLElement, options: { uri: string; width?: string | number; height?: string | number }, callback: (controller: EmbedController) => void) => void;
};

declare global {
  interface Window { onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void }
}

let spotifyApi: Promise<SpotifyIFrameAPI> | null = null;

function loadSpotifyApi() {
  spotifyApi ??= new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = resolve;
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => { spotifyApi = null; reject(new Error("Spotify's player didn't load")); };
    document.body.appendChild(script);
  });
  return spotifyApi;
}

const PlayIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" /></svg>;
const PauseIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" /><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" /></svg>;
const OpenIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 14.5 12 8.5l6 6" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;

// Wraps the speaker drawing (`children`, placed at x/y/scale like the other desk objects): makes it a
// button, adds its status light and the "keep listening" note below it on the desk.
export function SpeakerPlayer({ x, y, scale, children }: { x: number; y: number; scale: number; children: ReactNode }) {
  const { editing } = useDeskLayout();
  const button = useRef<SVGGElement>(null);
  const [host, setHost] = useState<Element | null>(null);
  const [open, setOpen] = useState(false);
  const [listOpen, setListOpen] = useState(true);
  const [playing, setPlaying] = useState<Song | null>(null);
  const [paused, setPaused] = useState(false);
  // If Spotify's iFrame API can't load, fall back to a plain embed (controlled from Spotify's own button).
  const [plainEmbed, setPlainEmbed] = useState(false);
  const controller = useRef<EmbedController | null>(null);
  const embedHost = useRef<HTMLDivElement>(null);
  const firstTrack = useRef<HTMLButtonElement>(null);
  const listToggle = useRef<HTMLButtonElement>(null);
  const pauseButton = useRef<HTMLButtonElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);

  useEffect(() => { setHost(button.current?.closest("[data-lamp]") ?? null); }, []);

  useEffect(() => {
    if (open && listOpen) firstTrack.current?.focus();
  }, [open, listOpen]);

  const stop = () => {
    controller.current?.destroy();
    controller.current = null;
    embedHost.current?.replaceChildren();
    setPlaying(null);
    setPaused(false);
    setOpen(false);
  };

  useEffect(() => {
    if (editing) stop();
  }, [editing]);

  // Fold the panel into the pill; the song keeps playing.
  const collapse = () => {
    setOpen(false);
    requestAnimationFrame(() => (pauseButton.current ?? openButton.current)?.focus());
  };

  const close = () => {
    if (playing) { collapse(); return; }
    setOpen(false);
    button.current?.focus();
  };

  const stopAndFocusSpeaker = () => {
    stop();
    button.current?.focus();
  };

  const start = (song: Song) => {
    setPlaying(song);
    setPaused(false);
    setListOpen(false);
    requestAnimationFrame(() => listToggle.current?.focus());
    if (plainEmbed) return;
    const uri = `spotify:track:${song.spotify}`;
    if (controller.current) {
      controller.current.loadUri(uri);
      controller.current.play();
      return;
    }
    loadSpotifyApi().then((api) => {
      const target = embedHost.current;
      if (!target || controller.current) return;
      const element = document.createElement("div");
      target.replaceChildren(element);
      api.createController(element, { uri, width: "100%", height: 152 }, (embed) => {
        controller.current = embed;
        embed.addListener("ready", () => embed.play());
        embed.addListener("playback_update", (event) => setPaused(Boolean(event.data?.isPaused)));
      });
    }).catch(() => setPlainEmbed(true));
  };

  // Escape hides the list while a song plays, then folds the player away (the song keeps going); with
  // no song it just closes. Listening on the window keeps this working after focus fell to the page.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (playing && listOpen) setListOpen(false);
      else close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const toggle = () => {
    if (editing) return;
    if (open) { close(); return; }
    setListOpen(!playing);
    setOpen(true);
  };

  const onSpeakerKey = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  };

  const sounding = Boolean(playing) && !paused;

  return <>
    <g
      ref={button}
      className={styles.speaker}
      role={editing ? undefined : "button"}
      tabIndex={editing ? undefined : 0}
      aria-label={editing ? undefined : playing ? `Speaker, ${paused ? "paused on" : "playing"} ${playing.title}. Open the player` : "Speaker. Choose a song to play"}
      aria-expanded={editing ? undefined : open}
      onClick={toggle}
      onKeyDown={editing ? undefined : onSpeakerKey}
    >
      {children}
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <circle cx="12" cy="-17" r="4.5" className={styles.ledGlow} data-on={sounding || undefined} />
        <circle cx="12" cy="-17" r="1.6" className={styles.led} data-on={sounding || undefined} />
      </g>
    </g>

    {/* The handwritten note on the desk's front edge, pointing up at the speaker. It reads leftwards
        from the arrow so it stays on screen when the speaker sits near the right edge. */}
    <g className={styles.hint} transform={`translate(${x} ${y})`} aria-hidden="true">
      <path className={styles.hintArrow} pathLength={1} d="M-36 62 C -58 54, -60 34, -42 28 C -28 24, -24 38, -36 40 C -50 42, -40 18, -12 10" />
      <path className={styles.hintArrowHead} pathLength={1} d="M-24 6 L-11 9.5 L-17 21" />
      <text className={styles.hintText} x="-30" y="74" textAnchor="end">keep listening and exploring</text>
    </g>

    {host && (open || playing) && createPortal(
      <section className={styles.player} aria-label={open ? "Songs on the speaker" : "Now playing"} data-compact={(open && !listOpen) || undefined} data-mini={!open || undefined}>
        {open && <header className={styles.head}>
          <p className={styles.label}>{playing ? (paused ? "Paused" : "Now playing") : "On the speaker"}</p>
          <div className={styles.headButtons}>
            {playing && <button ref={listToggle} type="button" className={styles.textButton} aria-expanded={listOpen} onClick={() => setListOpen(!listOpen)}>{listOpen ? "Hide list" : "Change song"}</button>}
            <button type="button" className={styles.close} onClick={close} aria-label={playing ? "Close the player; the song keeps playing" : "Close the song list"}>×</button>
          </div>
        </header>}

        {!open && playing && <div className={styles.mini}>
          <span className={styles.miniLed} data-on={sounding || undefined} aria-hidden="true" />
          <span className={styles.trackText}><span className={styles.title}>{playing.title}</span><span className={styles.artist}>{playing.artist}</span></span>
          {!plainEmbed && <button ref={pauseButton} type="button" className={styles.iconButton} onClick={() => controller.current?.togglePlay()} aria-label={paused ? `Play ${playing.title}` : `Pause ${playing.title}`}>{paused ? <PlayIcon /> : <PauseIcon />}</button>}
          <button ref={openButton} type="button" className={styles.iconButton} onClick={() => { setListOpen(false); setOpen(true); }} aria-label="Open the player"><OpenIcon /></button>
          <button type="button" className={styles.close} onClick={stopAndFocusSpeaker} aria-label="Stop the music">×</button>
        </div>}

        {/* Spotify's player. It stays mounted while the panel is folded away, so the music never stops. */}
        <div ref={embedHost} className={styles.screen} data-empty={!playing || plainEmbed || undefined} />
        {plainEmbed && playing && <div className={styles.screen}>
          <iframe
            key={playing.spotify}
            src={embedUrl(playing.spotify)}
            title={`Spotify player: ${playing.title} by ${playing.artist}`}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        </div>}

        {open && listOpen && <ol className={styles.tracks}>
          {SONGS.map((song, i) => <li key={song.spotify}>
            <button
              ref={i === 0 ? firstTrack : undefined}
              type="button"
              className={styles.track}
              aria-current={playing?.spotify === song.spotify || undefined}
              onClick={() => start(song)}
            >
              <span className={styles.number}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.trackText}><span className={styles.title}>{song.title}</span><span className={styles.artist}>{song.artist}</span></span>
            </button>
          </li>)}
        </ol>}
      </section>,
      host,
    )}
  </>;
}
