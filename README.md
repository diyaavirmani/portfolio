# Diya Virmani — portfolio

Personal portfolio built with Next.js, based on the [pFolio template](https://github.com/mohakchakraborty2004/pFolio). The first page is the portfolio overview; clicking the portrait opens the detailed page.

## Run locally

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:3000/.

## Deployment note

The detailed page uses Diya's static night-street image in production. A separate four-second Paris video was used only for local evaluation; it is **not** included in this repository because [Motion Places' terms](https://www.motionplaces.com/license-and-terms/) require a paid licence for public use. Obtain the appropriate licence and add an authorized copy before enabling that video in a public deployment.

Vercel deployment has not been configured or triggered yet.

The inherited dependencies still have unresolved `npm audit` advisories after nonbreaking fixes, including a critical advisory in Next.js 14. Upgrade and retest the framework and Tailwind CSS before a public deployment.
