# AGENTS.md — CaFlow landing page

Rules for every coding agent working in this repository.

## Hard rules

1. **No comments in source code.** Do not add comments of any kind (`//`, `/* */`, `{/* */}`, `<!-- -->`) to any
   file under `src/`, `scripts/`, `public/` or config files, and do not leave commented-out code. Explain decisions in
   names, commit messages and `docs/` instead.
2. Keep secrets unread and unprinted, including `.env*`.
3. **Free plan only.** Cloudflare Workers Free, no paid services, no new paid dependencies.
4. **Ask before outward actions:** commit, push, merge to `main`, deploy. Approval for one does not carry to the next.
5. **Every UI string goes into both `en` and `vi`** in `src/copy.ts`. English is the default. Write natural
   Vietnamese with diacritics.
6. **Do not edit `package-lock.json` by hand** (change `package.json` and run `npm install`).

## Design

Black ground `#000000`, one accent: persimmon `#FF8A5C` on dark (`#C74118` on light). 44 px touch targets.
Headlines in Anton (uppercase), everything else in Be Vietnam Pro. Respect `prefers-reduced-motion`: no smooth
scroll, loader or pinned sections. See `docs/landing-page.md` for the current page.

## Done means verified

`npm run check` and `npm run build` pass, and the change was seen working in a browser at 1440 and 390 px wide,
in both languages.
