# Landing page plan

Astro (static) + Tailwind 4. English at `/`, Vietnamese at `/vi/`. Local only until a deploy is asked for.
Design: `docs/2026-11-26-landing-rebuild-design.md` (approach B, approved 2026-11-26).

## Kind and look

- **Kind:** software (an app sold to businesses of any kind). Page type `software`, site kind `software`.
- **Look:** a black, cinematic page in the style of lenis.dev and darkroom.engineering. Ground `#000000`, persimmon
  `#FF8A5C` for type and glow, `#C74118` for filled surfaces. Glow, haze, film grain and frosted glass are allowed on
  the website (owner, 2026-11-26). Headlines in Anton (uppercase, Vietnamese subset), everything else in Be Vietnam
  Pro. The app screens inside the phone frames stay light, as in the real app.
- **Motion:** Lenis inertia scrolling on the GSAP ticker, a first-visit loader (seal fills, at most 1.2 s), a custom
  cursor on fine pointers, SplitText headline reveals, pinned scroll scenes on screens 768 px and wider.
- **WebGL:** one shared three.js renderer. The hero seal is made of glowing particles that assemble, push away from
  the pointer and disperse on scroll; embers rise behind the close.
- **Reduced motion:** no Lenis, loader, pins or scrub; every section shows its finished state.

## Fact sheet

| Field | Content |
|---|---|
| What it is | A Zalo Mini App for shift tasks with photo proof, for cafés, shops, pharmacies, clinics and offices in Vietnam |
| For whom | Owners and managers; staff use it on their phones |
| Today instead | Photos lost in a busy Zalo group, paper checklists, calling staff to ask |
| True difference | Runs inside Zalo (nothing to install); a photo per task approved with one tap; staff book their own shifts; one view of every branch |
| Numbers | Up to 5 checklist items a task; up to 50 photos a post; check-in opens 15 minutes before a shift |
| Checks | Check-in by GPS, Wi-Fi and photo; late, early and missing flagged against a grace period; time edits need a reason and the staff member is told; optional AI only approves |
| A limit | Everyone needs a Zalo account; companies start from an activation link we send |
| Offer | Contact only: Zalo chat, phone or email to Trần Kiến Quốc. No price on the page |

## Sections

1. `top`: "Every shift, proven." with the particle seal, sub-line, "Just contact us".
2. `problem`: the Zalo-group problem lit word by word while chat bubbles blur away (pinned).
3. `loop`: set the task → staff send the photo → you stamp it, on one phone; café, shop or pharmacy switch (pinned).
4. `live`: the owner overview; scrolling runs the clock from 07:00 to 17:00, one branch falls behind (pinned).
5. `trust`: four cards: check-in demo, late and early flags, edit with a reason, AI check demo.
6. `try`: a sideways strip of demos: review photos, book a shift, post to the board, hours and receipts (pinned; a
   swipe row on phones).
7. `questions`: six answers.
8. `contact`: "Just contact us" marquee, embers, Quốc's flip card with the Zalo QR on the back.

Main action, word for word in the nav, hero and close: "Just contact us" / "Liên hệ ngay".
Photo stand-ins (Wikimedia Commons, credited in the footer): espresso and bar frames, a store shelf, a pharmacy shelf.
