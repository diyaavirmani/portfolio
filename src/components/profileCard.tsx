"use client";

import { useEffect, useState } from "react";
import { Github, Linkedin, Mail } from "lucide-react";
import { profile } from "@/lib/portfolio";

export default function ProfileCard() {
  const [time, setTime] = useState<Date | null>(null);
  useEffect(() => {
    setTime(new Date());
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-6 flex-1 shadow-xl">
    <div className="flex items-center gap-4 mb-6">
      <img className="w-16 h-16 rounded-3xl object-cover" src={profile.portrait} alt="Diya Virmani — illustrated portrait" />
      <div><h1 className="text-xl font-bold text-white">{profile.name}</h1><p className="text-sm text-white/90">{profile.email}</p></div>
    </div>
    <div className="mb-6 text-sm text-white/90">
      <p className="mb-2">📍 {profile.location}</p>
      <p className="mb-2">{profile.introduction}</p>
      <p>{profile.education}</p>
    </div>
    <div className="flex justify-between items-end">
      <div className="flex gap-3">
        <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub"><Github /></a>
        <a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin /></a>
        <a href={`mailto:${profile.email}`} aria-label="Email"><Mail /></a>
      </div>
      <div className="text-right">
        <div className="text-lg font-mono text-white">{time ? time.toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour12: false }) : "--:--:--"}</div>
        <div className="text-sm text-white/80">{time ? time.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", weekday: "long" }) : "Loading..."}</div>
      </div>
    </div>
  </div>;
}
