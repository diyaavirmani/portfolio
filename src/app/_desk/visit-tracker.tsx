"use client";

import { useEffect } from "react";

// Counts this visit anonymously for Diya's visitor log (see src/lib/desk-visits.ts): a random id
// kept for this tab only, plus how long the page has actually been on screen. Nothing is sent when
// the browser asks sites not to track (Global Privacy Control or Do Not Track), or when Diya has
// switched off counting for her own browser from the visitor log.
export const IGNORE_KEY = "desk-visits-ignore";
const ID_KEY = "desk-visit-id";
const BEAT_MS = 15000;

function storageGet(storage: Storage | undefined, key: string) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function visitId() {
  const saved = storageGet(window.sessionStorage, ID_KEY);
  if (saved) return saved;
  const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  try {
    window.sessionStorage.setItem(ID_KEY, id);
  } catch {
    // Without session storage each page load just counts as its own visit.
  }
  return id;
}

export default function VisitTracker() {
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.globalPrivacyControl || nav.doNotTrack === "1") return;
    if (storageGet(window.localStorage, IGNORE_KEY) === "1") return;

    const id = visitId();
    let activeMs = 0;
    let visibleSince = document.visibilityState === "visible" ? performance.now() : null;
    const active = () => activeMs + (visibleSince === null ? 0 : performance.now() - visibleSince);

    const send = (event: "start" | "beat" | "end") => {
      const body = JSON.stringify({ id, event, path: location.pathname, referrer: document.referrer, activeMs: Math.round(active()) });
      if (event === "end" && navigator.sendBeacon?.("/api/desk-visits", body)) return;
      fetch("/api/desk-visits", { method: "POST", body, keepalive: true }).catch(() => {});
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        visibleSince = performance.now();
      } else if (visibleSince !== null) {
        activeMs += performance.now() - visibleSince;
        visibleSince = null;
        send("end");
      }
    };
    const onPageHide = () => send("end");

    send("start");
    const beat = window.setInterval(() => {
      if (document.visibilityState === "visible") send("beat");
    }, BEAT_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.clearInterval(beat);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  return null;
}
