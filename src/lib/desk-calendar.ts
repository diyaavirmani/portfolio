// Server-only helpers for the desk calendar: read an iCalendar (.ics) feed and keep just the
// all-day facts the calendar shows — a date and a title. Descriptions, locations, guests and
// times are dropped, and events marked private or confidential are skipped entirely.

export type CalendarMark = { date: string; title: string; kind: "public" | "observance" | "event" | "birthday" };

// Google's public "Holidays in India" calendar. No sign-in needed; it marks each entry as a
// "Public holiday" or an "Observance" in its description.
export const INDIA_HOLIDAYS_ICS = "https://calendar.google.com/calendar/ical/en.indian%23holiday%40group.v.calendar.google.com/public/basic.ics";

export const BIRTHDAY = { month: 8, day: 14, title: "Diya's birthday" };

type RawEvent = { start: string; summary: string; description: string; rrule: string; className: string; status: string };

function unfold(ics: string) {
  return ics.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function unescape(text: string) {
  return text.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1").trim();
}

function parse(ics: string): RawEvent[] {
  const events: RawEvent[] = [];
  for (const block of unfold(ics).split("BEGIN:VEVENT").slice(1)) {
    const body = block.split("END:VEVENT")[0];
    const field = (name: string) => body.match(new RegExp(`^${name}(?:;[^:\\n]*)?:(.*)$`, "m"))?.[1] ?? "";
    events.push({
      start: field("DTSTART"),
      summary: unescape(field("SUMMARY")),
      description: unescape(field("DESCRIPTION")),
      rrule: field("RRULE"),
      className: field("CLASS").toUpperCase(),
      status: field("STATUS").toUpperCase(),
    });
  }
  return events;
}

// DTSTART is either a date (20260815) or a date-time (20260815T093000Z or a local time with a TZID).
// The calendar only needs the day, read in New Delhi time for UTC timestamps.
function dayOf(start: string): string | null {
  const date = start.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!date) return null;
  const [, y, m, d] = date;
  const time = start.match(/T(\d{2})(\d{2})(\d{2})Z$/);
  if (!time) return `${y}-${m}-${d}`;
  const utc = Date.UTC(+y, +m - 1, +d, +time[1], +time[2], +time[3]);
  const ist = new Date(utc + 330 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

function inYear(event: RawEvent, year: number): string | null {
  const day = dayOf(event.start);
  if (!day) return null;
  // Yearly repeats (birthdays, anniversaries) land on the same date every year from the first one on.
  if (/FREQ=YEARLY/.test(event.rrule) && +day.slice(0, 4) <= year) return `${year}${day.slice(4)}`;
  return day.startsWith(`${year}-`) ? day : null;
}

async function fetchIcs(url: string, revalidate: number): Promise<RawEvent[]> {
  const response = await fetch(url, { next: { revalidate } });
  if (!response.ok) throw new Error(`Calendar feed answered ${response.status}`);
  return parse(await response.text());
}

// Used when Google's feed can't be reached: the fixed-date national holidays every year, plus the
// 2026 public holidays as Google's feed listed them in October 2026.
const FIXED_HOLIDAYS: [string, string][] = [["01-26", "Republic Day"], ["08-15", "Independence Day"], ["10-02", "Mahatma Gandhi Jayanti"], ["12-25", "Christmas"]];
const PUBLIC_HOLIDAYS_2026: [string, string][] = [
  ["03-04", "Holi"], ["03-21", "Ramzan Id"], ["03-26", "Rama Navami"], ["03-31", "Mahavir Jayanti"], ["04-03", "Good Friday"],
  ["04-14", "Ambedkar Jayanti"], ["05-01", "Buddha Purnima"], ["05-28", "Bakrid"], ["06-26", "Muharram/Ashura"], ["08-26", "Milad un-Nabi"],
  ["09-04", "Janmashtami"], ["10-20", "Dussehra"], ["11-08", "Diwali/Deepavali"], ["11-24", "Guru Nanak Jayanti"],
];

export function fallbackHolidays(year: number): CalendarMark[] {
  const days = [...FIXED_HOLIDAYS, ...(year === 2026 ? PUBLIC_HOLIDAYS_2026 : [])];
  return days.map(([day, title]) => ({ date: `${year}-${day}`, title, kind: "public" }));
}

export async function indiaHolidays(year: number): Promise<CalendarMark[]> {
  const events = await fetchIcs(INDIA_HOLIDAYS_ICS, 60 * 60 * 24);
  const marks: CalendarMark[] = [];
  for (const event of events) {
    const date = inYear(event, year);
    if (!date || !event.summary) continue;
    marks.push({ date, title: event.summary, kind: event.description.startsWith("Public holiday") ? "public" : "observance" });
  }
  return marks;
}

// Diya's own events, from the public iCal address of a calendar she has deliberately made public
// for the portfolio (DESK_CALENDAR_ICS_URL), never her private one. Only titles and dates are
// kept, and nothing marked private is shown.
export async function personalEvents(year: number): Promise<CalendarMark[]> {
  const url = process.env.DESK_CALENDAR_ICS_URL;
  if (!url) return [];
  const events = await fetchIcs(url, 60 * 60);
  const marks: CalendarMark[] = [];
  for (const event of events) {
    if (event.className === "PRIVATE" || event.className === "CONFIDENTIAL" || event.status === "CANCELLED") continue;
    const date = inYear(event, year);
    if (date && event.summary) marks.push({ date, title: event.summary.slice(0, 80), kind: "event" });
  }
  return marks;
}
