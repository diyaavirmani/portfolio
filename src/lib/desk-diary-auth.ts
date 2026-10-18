import { createHmac, timingSafeEqual } from "node:crypto";

// Access to Diya's desk diary and visitor log. In development they're always open; in production they need the
// DESK_DIARY_PASSWORD env var, checked on the server, and a cookie derived from it.
export const DIARY_COOKIE = "desk-diary";
export const DIARY_PATH = "/diary";
// Under the diary path so the same sign-in cookie covers it.
export const VISITORS_PATH = `${DIARY_PATH}/visitors`;

export const diaryToken = (password: string) => createHmac("sha256", password).update("desk-diary-v1").digest("hex");

export function sameSecret(a: string, b: string) {
  const left = createHmac("sha256", "compare").update(a).digest();
  const right = createHmac("sha256", "compare").update(b).digest();
  return timingSafeEqual(left, right);
}

export type DiaryAccess = "open" | "locked" | "closed";

export function diaryAccess(cookie: string | undefined): DiaryAccess {
  if (process.env.NODE_ENV === "development") return "open";
  const password = process.env.DESK_DIARY_PASSWORD;
  if (!password) return "closed";
  return cookie && sameSecret(cookie, diaryToken(password)) ? "open" : "locked";
}
