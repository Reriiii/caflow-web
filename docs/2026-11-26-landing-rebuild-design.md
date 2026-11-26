# Landing page rebuild: a cinematic, story-led CaFlow site

Status: draft for approval (2026-11-26). Supersedes the look and section plan in `docs/landing-page.md`.

## Why

The current page (`web/`, Astro + Tailwind 4, `/` English, `/vi/` Vietnamese) works but reads as a list of feature
demos on paper white. The owner wants it more insightful, interactive and attractive, in the style of lenis.dev,
darkroom.engineering, loreobsessed.com and locomotive.ca. CaFlow has also moved from "cafés" to any business (shops,
clinics, offices, small chains); the page's café-only demos and missing owner view undersell that.

## Goals

1. The look of the references: black page, one loud persimmon accent, giant display type, glow and grain, inertia
   scrolling, scroll-told story, WebGL particles, a short loading screen and a custom cursor.
2. Insight: the page tells a story (the problem, the loop, the owner's live view, why the proof can be trusted), not a
   feature list.
3. Interaction: every section has something to touch, scrub or drag.
4. Any business, not only cafés: demos mix a café, a shop and a clinic or office.

## Non-goals

- No sound, no multi-page transitions, no CMS, no price on the page, no new contact channels.
- No change to the Zalo Mini App or the Worker. No commit and no deploy until asked.
- No light theme for the landing page: it is black in every colour scheme, like the references.

## Anti-goals (a failure even if it works)

- Vietnamese headlines break: diacritics clipped, lines overlap, or the display face lacks Vietnamese glyphs.
- Scrolling feels broken on a phone (fighting touch scroll, pinned sections that trap the user, jank below ~50 fps on a
  mid-range Android).
- The loading screen delays content noticeably (more than about 1.2 s) or hides it from no-JS readers and crawlers.
- Invented numbers, customers or quotes.
- Text on the dark page falls below WCAG AA contrast.

## Constraints

- Hard rules in `AGENTS.md`: no comments in source, both `en` and `vi` for every string, free plan, ask before
  outward actions, never edit `package-lock.json` by hand.
- Brand rule change (owner, 2026-11-26): "no gradients, no shadows, no frosted glass, sentence case" is deleted.
  Kept: persimmon `#C74118` / `#FF8A5C` as the one accent, ink `#171717`, black `#000000`, 44 px touch targets,
  the seal tilted −4°.
- Contact stays: Trần Kiến Quốc, Zalo, 0375 081 836, quockientran100@gmail.com. CTA "Just contact us".
- Facts only from the fact sheet in `docs/landing-page.md`.
- `prefers-reduced-motion`: no Lenis, no loader, no scrub; everything shown in its finished state.

## Approaches

| | Approach | Trade-off |
|---|---|---|
| A | Reference look inside the old brand rules (flat, no glow, sentence case) | Consistent with the app; less atmospheric |
| **B** | **Full reference look: glow, grain, gradient haze, uppercase display, loader, custom cursor** | **Closest to the references; the website departs from the app's flat look** |
| C | A plus glow on the hero only | Middle ground; one exception to track |

The owner chose **B** on 2026-11-26.

## Decisions

### Look

- Ground `#000000`; text `#F5F5F5` and `#A3A3A3`; accent `#FF8A5C` for type and glow, `#C74118` for filled
  surfaces. Soft persimmon radial haze behind key moments; a fixed film-grain overlay (SVG noise, low opacity).
- Display type: a condensed heavy face with a Vietnamese subset, self-hosted via `@fontsource` (my pick: Anton),
  set in uppercase at up to the full viewport width. Secondary display: Lexend (wide, as in Lenis' "SMOOTH SCROLL").
  Body: Be Vietnam Pro. Small UI labels in uppercase with tracking, darkroom-style.
- Thin persimmon hairline rules and bracketed labels (`[ 01 ] THE PROBLEM`) frame sections.

### Motion system

- Lenis (MIT, free) for inertia scrolling, driven by the GSAP ticker so ScrollTrigger stays in sync.
- Loading screen: CaFlow seal fills while fonts and the hero scene load; capped at about 1.2 s, then it splits away.
  Rendered over real content; skipped on reduced motion and on repeat visits in the same session.
- Custom cursor: a small dot plus a persimmon ring that grows and labels itself ("Drag", "Open") over interactive
  elements. Fine-pointer devices only.
- Headlines enter with SplitText masks; story paragraphs light up word by word as they scroll past.
- A scroll progress hairline at the top; magnetic buttons.

### WebGL

- One shared three.js renderer (the existing `three-stage.ts` pattern), additive blending allowed.
- Hero: a field of glowing persimmon particles that assembles into the seal on load, breathes, scatters away from the
  pointer and disperses into the next section on scroll.
- Two more scenes at most (for example ember dust behind the close). Fewer particles on phones; paused off screen.

### Story (sections, top to bottom)

1. **Hero.** Giant uppercase line naming the category and buyer (for example "EVERY SHIFT, PROVEN."), one sub-line
   ("Shift tasks with photo proof, inside Zalo, for any business"), CTA "Just contact us", the particle seal.
2. **The problem.** A pinned statement that lights up word by word: photos lost in a busy Zalo group, paper
   checklists, calling staff to ask. Floating Zalo-chat fragments blur away as the words land.
3. **The loop.** Pinned, scrubbed three-step: set the task → staff send the photo → you stamp it. A phone in the
   centre changes screen per step; the seal stamps on step 3. Mixed businesses: a café task, a shop task, a clinic
   or office task.
4. **Your live view.** The owner overview: branch rows with progress bars and a "now" knob, which branch is behind.
   A scrubbed clock moves through the day and the bars fill; tapping a branch opens its tasks.
5. **Proof you can trust.** Check-in by GPS, Wi-Fi and photo; late and early flags; time edits need a reason; AI
   check only approves, never asks for retakes. Interactive check-in demo carried over.
6. **Try it.** A horizontal pinned strip (Locomotive-style) of hands-on demos carried over and restyled: drag to
   approve photos, book a shift, post to the board, hours and pay, receipts.
7. **Questions.** Accordion with giant numbers.
8. **Close.** Giant marquee "JUST CONTACT US", ember particles, Quốc's flip card (QR back) restyled for the dark page.
   Footer with language switch and photo credits.

### Content

- All copy rewritten in `web/src/copy.ts` for `en` and `vi`; Vietnamese natural and with diacritics, checked in the
  uppercase display face.
- New photos for non-café tasks from Wikimedia Commons (free licences), credited in the footer line.

### Quality bar

- `npm run check`, `npm run build`, Biome lint, copy-lint and perf script pass; checked in the browser at 1440, 1024,
  768 and 390 wide in both languages, with and without reduced motion.
- JS under about 300 KB gzipped; LCP text visible without JS.

## Left to the builder

- Exact headline wording within the facts; exact display face if Anton fails a Vietnamese check.
- Particle counts, timings and eases; which old demos merge into the horizontal strip.
- Component split inside `web/src/components/` and `web/src/scripts/`.
