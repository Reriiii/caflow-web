# CaFlow landing page

The public website for CaFlow, a Zalo Mini App that helps small Vietnamese cafés and shops run shifts with photo proof.
English is at `/` and Vietnamese at `/vi/`.

Built with Astro (static output), Tailwind 4, GSAP with ScrollTrigger, Lenis and three.js. It deploys as an
assets-only Cloudflare Worker named `caflow-web`.

## Commands

Node 22.23.4 or newer.

| Task | Command |
|---|---|
| Install | `npm ci` |
| Dev server | `npm run dev` (http://127.0.0.1:4321) |
| Type check | `npm run check` |
| Build | `npm run build` (output in `dist/`) |
| Preview the build | `npm run preview` (http://127.0.0.1:4322) |
| Deploy | `npm run deploy` (check, build, then `cf deploy ./dist`) |

## Showcase video

`scripts/showcase.mjs` records a scripted tour of the built page in headless Chrome and encodes it with ffmpeg.
`scripts/showcase-audio.mjs` writes the matching soundtrack. Both write to `showcase/`, which git ignores.

```bash
npm run build
node scripts/showcase.mjs --lang en
node scripts/showcase-audio.mjs --seconds 63.933
```

Personal contact details are blurred in the recording by default; pass `--blur off` to show them.

## Layout

| Path | What it is |
|---|---|
| `src/copy.ts` | Every string, in `en` and `vi` |
| `src/components/sections/` | One component per page section |
| `src/scripts/landing.ts` | Entry script: smooth scroll, loader, then each section |
| `src/scripts/motion/` | Shared motion helpers (Lenis, loader, cursor, reveals) |
| `src/scripts/sections/`, `src/scripts/demos/` | Section scroll scenes and the interactive demos |
| `src/scripts/three-stage.ts` | The shared three.js renderer (particle seal, embers) |
| `public/photos/` | Licensed photographs and `credits.json` |
| `docs/` | Design, plan and notes for the current page |
