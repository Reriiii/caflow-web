import { gsap } from "gsap";
import { all, finePointer, one, still } from "../motion/util";

export function initHero() {
  const section = one("[data-hero]");
  if (!section || still()) return;
  gsap.from(all("[data-hero-rise]", section), { y: 30, autoAlpha: 0, duration: 1, ease: "power3.out", stagger: 0.1, delay: 0.35 });
  const cue = one("[data-scroll-cue]", section);
  if (cue) gsap.fromTo(cue, { yPercent: -120 }, { yPercent: 280, duration: 1.4, ease: "power2.inOut", repeat: -1 });
  const title = one("h1", section);
  if (title) {
    gsap.to(title, { yPercent: -18, autoAlpha: 0.15, ease: "none", scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true } });
  }
  const haze = one("[data-hero-haze]", section);
  if (haze) {
    gsap.to(haze, { scale: 1.08, duration: 4, ease: "sine.inOut", repeat: -1, yoyo: true });
    if (finePointer()) {
      const toX = gsap.quickTo(haze, "x", { duration: 1.6, ease: "power3" });
      const toY = gsap.quickTo(haze, "y", { duration: 1.6, ease: "power3" });
      section.addEventListener("pointermove", (event) => {
        toX((event.clientX / window.innerWidth - 0.5) * 120);
        toY((event.clientY / window.innerHeight - 0.5) * 80);
      });
    }
  }
}
