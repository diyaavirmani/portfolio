"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DIARY_COOKIE, DIARY_PATH, VISITORS_PATH, diaryAccess, diaryToken, sameSecret } from "@/lib/desk-diary-auth";
import { noteStore } from "@/lib/desk-notes";
import { visitStore } from "@/lib/desk-visits";

// Password tries per IP, in memory: enough to stop someone guessing in a loop.
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const ATTEMPT_LIMIT = 8;
const attempts = new Map<string, number[]>();

function tooManyAttempts() {
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() || headers().get("x-real-ip") || "local";
  const now = Date.now();
  const times = (attempts.get(ip) ?? []).filter((time) => now - time < ATTEMPT_WINDOW_MS);
  times.push(now);
  if (attempts.size > 5000) attempts.clear();
  attempts.set(ip, times);
  return times.length > ATTEMPT_LIMIT;
}

export async function unlockDiary(formData: FormData) {
  if (tooManyAttempts()) redirect(`${DIARY_PATH}?wrong=wait`);
  const password = process.env.DESK_DIARY_PASSWORD;
  const attempt = formData.get("password");
  if (!password || typeof attempt !== "string" || !sameSecret(attempt, password)) redirect(`${DIARY_PATH}?wrong=1`);
  cookies().set(DIARY_COOKIE, diaryToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: DIARY_PATH,
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(DIARY_PATH);
}

const isDiya = () => diaryAccess(cookies().get(DIARY_COOKIE)?.value) === "open";

export async function removeNote(formData: FormData) {
  const id = formData.get("id");
  if (isDiya() && typeof id === "string" && id.length <= 64) await noteStore()?.remove(id);
  redirect(DIARY_PATH);
}

export async function clearVisits() {
  if (isDiya()) await visitStore()?.clear();
  redirect(VISITORS_PATH);
}
