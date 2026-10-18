import { NextResponse } from "next/server";
import { BIRTHDAY, fallbackHolidays, indiaHolidays, personalEvents, type CalendarMark } from "@/lib/desk-calendar";

// GET /api/desk-calendar?year=2026 → the year's Indian holidays, Diya's birthday and, when
// DESK_CALENDAR_ICS_URL is set, the events on the calendar she has made public. Each source fails
// on its own: if Google's holiday feed is down, a built-in list of holidays stands in.
export async function GET(request: Request) {
  const year = Number(new URL(request.url).searchParams.get("year"));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Ask for a year between 2000 and 2100." }, { status: 400 });
  }

  const [holidays, events] = await Promise.allSettled([indiaHolidays(year), personalEvents(year)]);
  const birthday: CalendarMark = { date: `${year}-${String(BIRTHDAY.month).padStart(2, "0")}-${String(BIRTHDAY.day).padStart(2, "0")}`, title: BIRTHDAY.title, kind: "birthday" };

  return NextResponse.json({
    year,
    marks: [
      birthday,
      ...(holidays.status === "fulfilled" ? holidays.value : fallbackHolidays(year)),
      ...(events.status === "fulfilled" ? events.value : []),
    ],
    holidaysAvailable: holidays.status === "fulfilled",
    eventsConnected: Boolean(process.env.DESK_CALENDAR_ICS_URL) && events.status === "fulfilled",
  }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
