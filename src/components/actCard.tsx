"use client";

import { music } from "@/lib/portfolio";
import { ArrowUpRight } from "lucide-react";

export default function ActivityCard() {
  return <div className="flex flex-col gap-4 w-full h-full text-white p-4">
    <div><p className="text-sm text-white/70">Currently learning</p><h2 className="text-xl">Backend engineering</h2><p className="text-sm text-white/80">From first principles.</p></div>
    <div className="relative overflow-hidden rounded-2xl">
      <img src={music.cover} alt={music.album} className="w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black p-4">
        <h3>{music.title}</h3><p className="text-sm">{music.artist}</p>
        <a className="mt-3 inline-flex" href={music.youtube} target="_blank" rel="noopener noreferrer" aria-label={`Listen to ${music.title} on YouTube`}><ArrowUpRight /></a>
      </div>
    </div>
  </div>;
}
