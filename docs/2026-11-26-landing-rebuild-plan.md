# Landing rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `web/` as a black, cinematic, story-led landing page (approach B) with Lenis scrolling, a loader, a custom cursor, glowing particle scenes and eight story sections in English and Vietnamese.

**Architecture:** Astro static page composed from one component per section under `web/src/components/sections/`. One entry script (`web/src/scripts/landing.ts`) starts the motion system (`scripts/motion/*`), then each section's script (`scripts/sections/*`) and the carried-over demos (`scripts/demos/*`). three.js stays lazy-loaded in `scripts/three-stage.ts` with one shared renderer.

**Tech Stack:** Astro 7, Tailwind 4, GSAP 3.15 (ScrollTrigger, SplitText, Draggable, Flip), Lenis 1.3, three.js 0.187, @fontsource Anton / Lexend / Be Vietnam Pro.

**Spec:** `docs/2026-11-26-landing-rebuild-design.md`

## Global Constraints

- No comments of any kind in `web/` source (AGENTS.md rule 1).
- Every UI string in both `en` and `vi` in `web/src/copy.ts`; Vietnamese natural, with diacritics.
- Accent: `#FF8A5C` for type and glow, `#C74118` for filled surfaces; ground `#000000`; text `#F5F5F5` / `#A3A3A3`.
- Touch targets at least 44 px. Seal tilted −4°.
- Contact: Trần Kiến Quốc, `0375 081 836`, `quockientran100@gmail.com`, Zalo link from `CONTACT`. CTA "Just contact us" / "Liên hệ ngay".
- Facts only from `docs/landing-page.md` fact sheet; no invented numbers, customers or quotes.
- Loader at most 1.2 s, first visit per session only, never with reduced motion; content readable without JS.
- `prefers-reduced-motion: reduce`: no Lenis, no loader, no scrub or pin; finished states shown.
- JS under about 300 KB gzipped.
- Do not edit `package-lock.json` by hand; add deps with `npm install <pkg>` in `web/`.
- **No commits and no deploy** (owner: "dont commit anything"). Each task ends with checks, not a commit.

## Review Focus

1. Phone touch scrolling: Lenis must leave native touch scroll alone (`syncTouch: false`), and below 768 px the horizontal strip becomes a native swipe row, not a pin. Pinned sections must release at their end.
2. Vietnamese in the uppercase Anton display: stacked diacritics (Ể, Ộ, Ữ) must not be clipped by SplitText line masks or tight line-height.
3. Nav anchor links and `#hash` on load must land on the right section with Lenis and pin spacers present.
4. Without JS, or before JS runs, nothing is stuck invisible: hidden-start states are applied only by script, and the loader only exists after script adds it.
5. Resize and orientation change: ScrollTrigger refreshes after `document.fonts.ready` and on resize; WebGL canvases resize and stay crisp.

Each line has its check in the owning task (tasks 1, 3, 8 and 10).

## Shared verification

Browser checks use the user's dev server at `http://127.0.0.1:4321/` (start with `npm run dev` in `web/` if not running) and the Chrome DevTools tools. Bring the tab to front before timing anything (`select_page` with `bringToFront`). "Static checks" means, in `web/`:

```bash
npm run check          # astro check: 0 errors, 0 warnings
npm run build          # completes
cd .. && npm run lint  # Biome passes
```

plus copy-lint and perf from the design-taste-frontend skill on `web/dist/index.html` and `web/dist/vi/index.html` with `--root web/dist` (0 FAIL), and `grep -rnE "//|/\*|<!--" web/src` showing no comments (URLs inside strings are fine).

---

### Task 1: Foundation: black theme, fonts, Lenis, loader, cursor, grain

**Files:**
- Modify: `web/package.json` (via `npm install lenis @fontsource/anton`)
- Modify: `web/src/styles/global.css`
- Modify: `web/src/layouts/Base.astro`
- Create: `web/src/scripts/motion/util.ts`, `web/src/scripts/motion/smooth.ts`, `web/src/scripts/motion/loader.ts`, `web/src/scripts/motion/cursor.ts`, `web/src/scripts/motion/reveal.ts`
- Modify: `web/src/scripts/landing.ts` (move `one`, `all`, `announce`, `reduced`, `still`, `time`, `burst` into `motion/util.ts`)

**Interfaces:**
- Produces (`motion/util.ts`): `one<T>(selector, root?)`, `all<T>(selector, root?)`, `announce(target, text)`, `still(): boolean`, `time(seconds): number`, `burst(origin)`, all exported with the current signatures.
- Produces (`motion/smooth.ts`): `startSmooth(): Lenis | null` (null when reduced motion); `scrollToTarget(target: string | Element): void` (Lenis when running, else native `scrollIntoView`). Lenis runs on `gsap.ticker`, calls `ScrollTrigger.update` on scroll, `lagSmoothing(0)`, `syncTouch: false`. Intercepts `a[href^="#"]` clicks. On load with a hash, scrolls there after `document.fonts.ready`.
- Produces (`motion/loader.ts`): `runLoader(): Promise<void>`; resolves immediately when reduced motion or `sessionStorage["caflow-loaded"]` is set (wrapped in try/catch). Otherwise script inserts `#loader` (seal outline filling with persimmon, percent counter), waits for `document.fonts.ready` and the hero scene's `caflow:scene-ready` event, or 1.2 s, whichever is first, then splits away (two halves `yPercent` ±100) and removes itself.
- Produces (`motion/cursor.ts`): `startCursor(): void`; only when `(pointer: fine)`. A dot plus a ring (`#cursor`, `aria-hidden`). Over `[data-cursor]` the ring grows to 72 px and shows that attribute's text; over `a, button` it grows to 44 px. Hidden when the pointer leaves the window.
- Produces (`motion/reveal.ts`): `splitHeadlines(root: ParentNode = document): void` for `[data-split]` (SplitText lines with masks, `paddingBlock` on each mask of `0.12em` so diacritics clear, chars rise in on ScrollTrigger once); `lightWords(root: ParentNode = document): void` for `[data-light]` (words go from `opacity 0.15` to `1` scrubbed across the element's pin or `top 80%` to `bottom 40%`).
- Theme tokens in `global.css` `@theme`: `--color-night: #000`, `--color-ash: #a3a3a3`, `--color-snow: #f5f5f5`, `--color-ember: #ff8a5c`, `--color-persimmon: #c74118`, `--font-poster: "Anton", "Be Vietnam Pro", sans-serif`. Utility classes: `.poster` (Anton, uppercase, `line-height: 0.92`, `letter-spacing: -0.01em`), `.label` (12 px, uppercase, `tracking-[0.18em]`, ash), `.haze` (radial-gradient persimmon at 18 % opacity), `.grain` (fixed full-screen SVG `feTurbulence` noise at 7 % opacity, `pointer-events: none`, `z-index: 70`).

- [ ] **Step 1:** `npm install lenis @fontsource/anton` in `web/`. Import Anton `latin-400`, `latin-ext-400` and `vietnamese-400` in `global.css`; preload the latin (and on `/vi/` the vietnamese) woff2 in `Base.astro`.
- [ ] **Step 2:** Make `body` `bg-night text-snow`; `theme-color` `#000000` for both schemes; add `<div class="grain" aria-hidden="true">`. Remove the light/dark split from base styles.
- [ ] **Step 3:** Create the five `motion/*` modules with the interfaces above; have `landing.ts` call, in order, `startSmooth()`, `startCursor()`, `await runLoader()`, `splitHeadlines()`, `lightWords()`, then the existing init calls. Call `ScrollTrigger.refresh()` after `document.fonts.ready`.
- [ ] **Step 4: Verify in the browser.** Evaluate on `/`:
  - `getComputedStyle(document.body).backgroundColor === "rgb(0, 0, 0)"`
  - `document.fonts.check("400 64px Anton")` is true after load; on `/vi/` also `document.fonts.check('400 64px Anton', 'ỆỘỮ')`
  - `!!window.__lenis || document.documentElement.classList.contains("lenis")` is true (desktop)
  - after 1.5 s, `document.getElementById("loader") === null`; reload in the same tab: loader never appears
  - with `emulate` reduced motion: no `lenis` class, no loader, `[data-split]` text fully visible
  - with JavaScript disabled (navigate with `initScript` that blocks module scripts is not possible, so instead load `web/dist/index.html` via build and check the HTML): no `#loader` element and no inline `opacity:0`/`visibility:hidden` in the built HTML
  - clicking a nav `#anchor` link ends with that section's top within 80 px of the viewport top; loading `/#questions` lands on Questions
- [ ] **Step 5:** Static checks pass. No commit.

### Task 2: Copy and photos for the new story

**Files:**
- Modify: `web/src/copy.ts`
- Modify: `web/src/photos.ts`, `web/public/photos/` (new files and `credits.json`)

**Interfaces:**
- Produces the `en` shape (and `vi: typeof en`) that later tasks read. New and changed keys:
  - `nav: { problem, loop, live, trust, try, questions, other, otherHref }`
  - `loader: { label }`, `cursor: { drag, open, flip, scrub, swipe }`
  - `hero: { kicker, lines: string[], sub, cta, scroll }` with `lines` `["Every shift,", "proven."]` / `["Mỗi ca làm,", "có bằng chứng."]`
  - `problem: { label, statement, fragments: { who: string; text: string; time: string }[], answer }`. Statement covers photos lost in a busy Zalo group, paper checklists, calling staff to ask. Fragments: 5 to 7 short fake group-chat lines.
  - `loop: { label, h2, steps: { title: string; body: string }[], tasks: { business: string; title: string; time: string; photo: PhotoId }[], stamp, approvedAt }`, 3 steps, 3 tasks from a café, a shop and a clinic or office.
  - `live: { label, h2, lead, now, branches: { name: string; kind: string; total: number; people: number; behindAt: number }[], onTrack, behind, onShift, tasks, open }` where `behind` is `"{n} tasks late"` and `onShift` is `"{n} on shift"`; 3 branches.
  - `trust: { label, h2, items: { title: string; body: string }[], checkin, ai }`, 4 items: check-in by GPS, Wi-Fi and photo; late and early flags; time edits need a reason; AI only approves. `checkin` and `ai` reuse the current `more.checkin` / `more.ai` objects.
  - `try: { label, h2, hint, panels: { photos, shifts, board, money } }` where each panel title is a string; the existing `photos.demo`, `shifts.demo`, `shifts.phone`, `board.demo`, `board.phone`, `more.hours`, `more.receipts` objects move under `try` unchanged in shape.
  - `questions` unchanged in shape, answers checked against facts; `contact` gains `marquee: "Just contact us"` / `"Liên hệ ngay"`; `cta: "Just contact us"`.
  - `footer` unchanged in shape.
- Produces `PhotoId` entries for at least one shop (shelves or till) and one clinic or office image, each with `-80/140/200/320.webp` thumbnails.

- [ ] **Step 1:** Fetch 2 to 4 photos with the design-taste-frontend `photos.mjs` (Wikimedia Commons, CC0 or CC BY), into `web/public/photos/`. Generate thumbnails with the scratchpad `thumbs.mjs` approach (sharp, widths 80/140/200/320, quality 74). Add them to `PHOTOS` and `credits.json`.
- [ ] **Step 2:** Rewrite `copy.ts` to the shape above, `en` first then `vi`. Remove keys no longer used only after task 10 confirms no reference remains.
- [ ] **Step 3:** Run copy-lint on a scratch markdown dump of both languages (or after task 9 on the built page). `npm run check` passes (typed `vi: typeof en` catches missing keys).

### Task 3: Hero with the particle seal

**Files:**
- Create: `web/src/components/sections/Hero.astro`, `web/src/components/SiteNav.astro`, `web/src/scripts/sections/hero.ts`
- Modify: `web/src/scripts/three-stage.ts` (add `sealParticles(stage)`, register `data-three="seal-particles"`)
- Modify: `web/src/components/Landing.astro` (compose the new sections; old ones are removed as each replacement lands)

**Interfaces:**
- Consumes: `copy.hero`, `copy.nav`, `copy.cta`, `CONTACT.zaloHref`; `splitHeadlines`, `scrollToTarget`.
- Produces: `initHero(): void`; three-stage dispatches `window` event `caflow:scene-ready` after the first hero frame.
- `SiteNav.astro`: fixed transparent bar, small uppercase links (`.label` style, snow on hover with an underline draw), logo on dark, language switch, CTA pill (`bg-ember text-night`), mobile menu button at 44 px. A 2 px ember scroll-progress hairline on top.
- `Hero.astro`: full `100svh`, `.haze` centred behind the seal, `[data-three="seal-particles"]` host filling the section, `h1.poster` with each of `hero.lines` on its own line at `clamp(4rem, 15vw, 15rem)`, kicker `.label`, sub-line, CTA (magnetic: moves up to 10 px toward the pointer with `quickTo`), "Scroll" cue at the bottom.

- [ ] **Step 1:** `sealParticles(stage)`: sample about 6 000 points (2 500 below 768 px) inside the `seal.svg` shapes via `SVGLoader` shape triangulation area-weighted sampling; `THREE.Points` with a `ShaderMaterial` (round soft sprite, additive blending, ember `#FF8A5C` with some `#C74118`). On start, points fly in from a random sphere to the seal over 1.6 s. Idle: slow breathing noise. Pointer: points within 1.2 world units are pushed outward and spring back. Scroll: `ScrollTrigger` on `#top` scrubs a `uDisperse` uniform 0→1 so points drift up and fade by the section end. Reduced motion: points rendered at rest, no motion.
- [ ] **Step 2:** Build `SiteNav.astro`, `Hero.astro` and `initHero()` (magnetic CTA, scroll cue fade).
- [ ] **Step 3: Verify.** On `/` and `/vi/` at 1440, 768 and 390 wide: the h1 fits without horizontal scroll (`document.documentElement.scrollWidth === innerWidth`); the seal is visible (screenshot); `caflow:scene-ready` fires (listen in `initScript`); a 3-second rAF sample with the tab in front averages under 20 ms per frame at 1440 wide. Resize from 1440 to 390 and back: canvas size matches its host (`canvas.width === host.clientWidth * ratio` within 2 px).
- [ ] **Step 4:** Static checks pass.

### Task 4: The problem

**Files:**
- Create: `web/src/components/sections/Problem.astro`, `web/src/scripts/sections/problem.ts`

**Interfaces:**
- Consumes: `copy.problem`; `lightWords`.
- Produces: `initProblem(): void`.
- Layout: section pinned for `+=150%` on ≥768 px (not pinned below). `[ 01 ] label`, `problem.statement` in Lexend at `clamp(2rem, 5vw, 4.5rem)` with `data-light`. Chat fragments as small dark rounded bubbles scattered around, each with `who`, `text`, `time`; as the statement lights up they blur (`filter: blur(8px)`), drift and fade. The `answer` line lands at the end in ember.

- [ ] **Step 1:** Build markup and `initProblem()` with one scrubbed timeline on the pin.
- [ ] **Step 2: Verify.** Scroll through: at progress 0 the first word has opacity ≈ 0.15, at the end all words are 1 and fragments have opacity 0. At 390 wide: no pin (`ScrollTrigger.getAll().filter(t => t.pin).length` excludes it), and the statement is fully lit when reduced motion. Static checks pass.

### Task 5: The loop

**Files:**
- Create: `web/src/components/sections/Loop.astro`, `web/src/components/LoopPhone.astro`, `web/src/scripts/sections/loop.ts`
- Delete after replacement: `web/src/components/HeroPhone.astro`

**Interfaces:**
- Consumes: `copy.loop`; `Device.astro`; `photo`, `thumbs`.
- Produces: `initLoop(): void`.
- `LoopPhone.astro` renders three stacked screens in one `Device`: `[data-loop-screen="0"]` manager creating a task (title typed in, time, photo-required toggle), `[data-loop-screen="1"]` staff camera sending a photo of `loop.tasks[i]`, `[data-loop-screen="2"]` owner review with the seal stamping and `loop.approvedAt`.
- Layout: pinned `+=300%` on ≥768 px; left column lists the three steps with giant numbers (`.poster` 01/02/03), the active one ember, others ash; phone on the right. Each third of the scroll switches screen (crossfade plus slight y), and the business task cycles café → shop → clinic. Step 3 stamps the seal (scale 1.6→1, rotation 8→−4, ember ring pulse). Below 768 px: steps stack, each with its own static phone screen, no pin.

- [ ] **Step 1:** Build `LoopPhone.astro` and `Loop.astro`.
- [ ] **Step 2:** `initLoop()`: one scrubbed timeline with labels `step0..step2` and `snap: { snapTo: "labels", duration: 0.4 }`.
- [ ] **Step 3: Verify.** At pin progress 0.1, 0.5, 0.9 the visible `[data-loop-screen]` is 0, 1, 2 and the matching step is ember; after the pin the section releases (next section's top reaches the viewport). At 390 wide all three screens are visible in sequence with no pin. Static checks pass.

### Task 6: Your live view

**Files:**
- Create: `web/src/components/sections/Live.astro`, `web/src/scripts/sections/live.ts`

**Interfaces:**
- Consumes: `copy.live`.
- Produces: `initLive(): void`; pure helper `branchState(branch, hour: number): { done: number; late: number }` exported from `live.ts` where `done = round(total * clamp((hour - 7) / 10, 0, 1))` and `late = hour >= behindAt ? 2 : 0` for the branch with a `behindAt`, else 0.
- Layout: dark panel styled like the app overview: a company row ("Whole company", done/total, a track 07:00–17:00 with a now knob), then one row per branch: name, kind, done/total, thin track with the now knob, `onShift`, and `onTrack` (green) or `behind` (ember). A big clock readout (`.poster`) at the top. ScrollTrigger scrubs `hour` from 7 to 17 across the section (`top 70%` to `bottom 60%`); numbers count with `tabular-nums`. Clicking or pressing Enter on a branch opens a small task list for it (3 tasks with status chips), one open at a time.

- [ ] **Step 1:** Build the section and `initLive()`.
- [ ] **Step 2: Verify.** In the console: `branchState({ total: 20, behindAt: 13 }, 12)` returns `{ done: 10, late: 0 }` and at `14` returns `{ done: 14, late: 2 }`. Scroll to the end: the clock reads `17:00` and every branch shows `total/total`. Branch rows are buttons with `aria-expanded`, reachable by Tab. Static checks pass.

### Task 7: Proof you can trust

**Files:**
- Create: `web/src/components/sections/Trust.astro`, `web/src/scripts/demos/checkin.ts`, `web/src/scripts/demos/ai.ts`
- Modify: `web/src/scripts/landing.ts` (move `checkin()` and `ai()` into the demo files, exported as `initCheckin()` and `initAi()`)

**Interfaces:**
- Consumes: `copy.trust`; existing check-in and AI demo markup hooks (`data-checkin*`, `data-ai*`) moved into this section.
- Produces: `initCheckin(): void`, `initAi(): void`.
- Layout: `[ 04 ]` label, `h2.poster`, a 2×2 grid of the four `trust.items` as large dark cards with ember hairline borders, ember glow on hover (box-shadow allowed now) and a giant outlined index number; the check-in demo and AI demo sit inside the first and fourth cards.

- [ ] **Step 1:** Build markup, restyle both demos for the dark page, move their functions.
- [ ] **Step 2: Verify.** Clicking "Check in" completes the three checks and shows the check-in time; "Reset" restores; AI demo reaches "Matches the task" and "Check again" restarts. Both work by keyboard. Static checks pass.

### Task 8: Try it: horizontal strip of demos

**Files:**
- Create: `web/src/components/sections/Try.astro`, `web/src/scripts/sections/try.ts`, `web/src/scripts/demos/deck.ts`, `web/src/scripts/demos/shifts.ts`, `web/src/scripts/demos/board.ts`, `web/src/scripts/demos/money.ts`
- Modify: `web/src/components/ShiftPhone.astro`, `web/src/components/BoardPhone.astro`, `web/src/components/Device.astro` (dark-page styling only)
- Modify: `web/src/scripts/landing.ts` (move `deck`, `shifts`, `compose`, `hours`, `receipts` into the demo files as `initDeck`, `initShifts`, `initBoard`, `initHours`, `initReceipts`)

**Interfaces:**
- Consumes: `copy.try`; existing demo hooks; `startCursor` labels via `data-cursor`.
- Produces: `initTry(): ScrollTrigger | null` (null below 768 px or reduced motion), plus the five demo inits.
- Layout ≥768 px: section pinned; a track of four panels (photos deck, shift booking with phone, board composer with phone, hours and receipts), each `min(88vw, 1100px)` wide, moved with `x` on a scrubbed tween with `ease: "none"`; a panel counter `01 / 04` and a progress hairline. Panel titles enter via `containerAnimation`. Below 768 px: a native `overflow-x: auto` row with `scroll-snap-type: x mandatory`, panels `88vw`, and `data-cursor` labels ignored.
- Draggable deck inside the pinned strip must still drag horizontally: set `allowContextMenu`, and give the deck `touch-action: pan-y` so vertical page scroll still works on touch.

- [ ] **Step 1:** Move the five demo functions into their files unchanged except for imports and names; restyle their markup.
- [ ] **Step 2:** Build `Try.astro` and `initTry()`.
- [ ] **Step 3: Verify.** At 1440: scrolling through moves the track from panel 1 to panel 4 and then releases; dragging a deck card right approves it; booking a shift updates the phone list; posting adds a post to the board phone; receipts fan open. At 390: the row swipes horizontally with snap, `document.documentElement.scrollWidth === innerWidth`, and vertical scrolling over the deck still scrolls the page. Static checks pass.

### Task 9: Questions, close and footer

**Files:**
- Create: `web/src/components/sections/Questions.astro`, `web/src/components/sections/Close.astro`, `web/src/components/SiteFooter.astro`, `web/src/scripts/demos/contact.ts`, `web/src/scripts/demos/questions.ts`, `web/src/scripts/sections/close.ts`
- Modify: `web/src/scripts/three-stage.ts` (add `embers(stage)`, register `data-three="embers"`)
- Modify: `web/src/scripts/landing.ts` (move `contact()` and `questions()` as `initContact()` and `initQuestions()`)

**Interfaces:**
- Consumes: `copy.questions`, `copy.contact`, `copy.footer`, `CONTACT`; the existing contact card markup and QR generation from `Landing.astro` frontmatter.
- Produces: `initClose(): void`, `initContact(): void`, `initQuestions(): void`.
- Questions: rows with giant outlined numbers, question in Lexend, `+` that rotates to `×`; one open at a time; height animated with GSAP; `aria-expanded` and `aria-controls` kept.
- Close: `.haze` ground, `[data-three="embers"]` (about 1 200 rising ember points, additive, 400 below 768 px), a marquee of `contact.marquee` in `.poster` at `clamp(5rem, 18vw, 18rem)` running horizontally, its speed nudged by scroll velocity (`ScrollTrigger.getVelocity`), then the lead and Quốc's flip card restyled dark (card face `#111`, ember accents, QR back white for scanning).
- Footer: language switch, photo credit line from `credits.json`, `© CaFlow`.

- [ ] **Step 1:** Build the three components and move the two demo functions.
- [ ] **Step 2:** `embers(stage)` and `initClose()` (marquee loop with `gsap.to(..., { xPercent: -50, repeat: -1, ease: "none" })` and `timeScale` from velocity, clamped 1 to 4).
- [ ] **Step 3: Verify.** Questions open and close by click and keyboard; copy buttons copy the phone and email; "Show QR code" flips the card and the QR still scans (screenshot decodes with a phone, or modules count matches `qrSize`); marquee moves and speeds up while scrolling. Static checks pass.

### Task 10: Cleanup and full verification

**Files:**
- Delete: unused components and functions (`HeroPhone.astro` if not already, old section markup in `Landing.astro`, `field`/`drift`/`device`/`phone`/`icon`/`seal` stages and `THEMES` in `three-stage.ts` that nothing mounts, `clock()` and the day section, unused copy keys, unused unlayered CSS rules)
- Modify: `docs/landing-page.md` (new look, sections, moments; point to the spec)

- [ ] **Step 1:** Remove dead code; `grep -rn "data-three=\"field\"\|data-day\|more\." web/src` returns nothing.
- [ ] **Step 2:** Static checks pass; JS gzipped total under 300 KB (perf script).
- [ ] **Step 3: Browser pass**, both `/` and `/vi/`, at 1440×900, 1024×768, 768×1024 and 390×844:
  - no horizontal page scroll; every section has visible content (screenshots)
  - Vietnamese poster headlines: no clipped diacritics (screenshot of hero, loop and close at 390 and 1440)
  - nav anchors and `/#questions` land correctly
  - reduced motion: no loader, no pin, everything readable
  - orientation change 390×844 → 844×390 → back: no stuck pins, canvases resized
  - console has no errors
- [ ] **Step 4:** Report to the owner with screenshots; no commit, no deploy.
