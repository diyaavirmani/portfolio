# Diya Virmani: portfolio

A single-page portfolio set in an illustrated evening study: a desk with a MacBook, a lamp, books, a wire grid of prints, and a short introduction. The navbar opens panels with About me, Projects, Experience, Tech stack and Socials. Built with Next.js (app router), React and CSS modules. The repository was originally scaffolded from the [pFolio template](https://github.com/mohakchakraborty2004/pFolio).

## Run locally

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:3000/.

## Where things live

- `src/app/page.tsx`: the homepage; it renders the desk.
- `src/app/_desk/`: everything in the room (`desk.tsx` and one file per object), the navbar panels (`site-panels.tsx`) and the site's content (`content.ts`, built on `src/lib/portfolio.ts`).
- `src/app/_desk/desk-layout.json`: where each object sits. Edit mode writes this file.
- `src/app/diary/`: Diya's private diary of visitor notes, and the visitor log at `/diary/visitors`.
- `src/app/api/`: routes for saving the layout (development only), visitor notes, anonymous visit stats and the calendar.

## Edit mode (development only)

With `npm run dev`, an **Edit** button appears next to Lamp. Click any object to move, resize, rotate, hide or delete it, then **Save layout** to write `desk-layout.json`. The button and the save route don't exist in production builds.

## The diary

Notes left with the pen in the Pookie mug, and anonymous visit stats, are read at `/diary`. In development it's open; in production it needs a password and nobody else can read it.

## Environment variables (production)

| Variable | What it does |
| --- | --- |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) | Upstash Redis / Vercel KV, where notes and visit stats are stored. Without it, notes say "not open yet" and visits aren't counted. |
| `DESK_DIARY_PASSWORD` | Password for `/diary`. Without it, the diary returns "not found" in production. |
| `DESK_CALENDAR_ICS_URL` | Optional. The public iCal address of a Google Calendar Diya deliberately made public; its events show on the desk calendar (date and title only). Never use the "secret address". |

Locally, notes and visits are stored in `data/` (git-ignored).

## Third-party images and media

Some pictures in `public/concepts/desk/` come from elsewhere: the Pinterest prints (Messi, Dear Zindagi, Snoopy, Taylor Swift, the gym card, the Octocat), the All Too Well poster, the album and book covers, the macOS wallpaper, the Sprite can photo and the key clicker photo. Check you have the right to use each one before publishing. Songs play through Spotify's official embeds and are not hosted here.
