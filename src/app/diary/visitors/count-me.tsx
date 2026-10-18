"use client";

import { useEffect, useState } from "react";
import { IGNORE_KEY } from "@/app/_desk/visit-tracker";
import s from "../diary.module.css";

// Lets Diya keep her own visits out of the log on this browser. The choice lives in this browser
// only, so it needs setting once per device.
export default function CountMe() {
  const [ignored, setIgnored] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setIgnored(window.localStorage.getItem(IGNORE_KEY) === "1");
    } catch {
      setIgnored(false);
    }
  }, []);

  if (ignored === null) return null;

  const toggle = () => {
    const next = !ignored;
    try {
      if (next) window.localStorage.setItem(IGNORE_KEY, "1");
      else window.localStorage.removeItem(IGNORE_KEY);
      setIgnored(next);
    } catch {
      // Storage is blocked in this browser, so the choice can't be remembered.
    }
  };

  return <label className={s.countMe}>
    <input type="checkbox" checked={ignored} onChange={toggle} />
    Don&apos;t count my own visits on this browser
  </label>;
}
