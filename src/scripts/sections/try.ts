import { gsap } from "gsap";
import { all, one, stick } from "../motion/util";

export function initTry(media: gsap.MatchMedia) {
  const section = one("[data-try]");
  const track = section ? one("[data-try-track]", section) : null;
  const count = section ? one("[data-try-count]", section) : null;
  const progress = section ? one("[data-try-progress]", section) : null;
  if (!section || !track) return null;
  const panels = all(".try-panel", track);
  const setCount = (index: number) => {
    if (count) count.textContent = String(index + 1).padStart(2, "0");
  };
  track.addEventListener("scroll", () => {
    const center = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    panels.forEach((panel, index) => {
      const mid = panel.offsetLeft + panel.offsetWidth / 2;
      const best = panels[nearest];
      if (best && Math.abs(mid - center) < Math.abs(best.offsetLeft + best.offsetWidth / 2 - center)) nearest = index;
    });
    setCount(nearest);
  }, { passive: true });
  let strip: gsap.core.Tween | null = null;
  media.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 64);
    const stage = one("[data-try-stage]", section);
    const release = stage ? stick(section, stage, distance) : () => undefined;
    strip = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          setCount(Math.min(panels.length - 1, Math.round(self.progress * (panels.length - 1))));
          if (progress) gsap.set(progress, { scaleX: self.progress });
        },
      },
    });
    const trigger = strip.scrollTrigger;
    const onFocus = (event: FocusEvent) => {
      const panel = (event.target as HTMLElement).closest<HTMLElement>(".try-panel");
      if (!panel || !trigger) return;
      const share = gsap.utils.clamp(0, 1, (panel.offsetLeft - 32) / Math.max(1, distance()));
      const top = trigger.start + share * (trigger.end - trigger.start);
      if (Math.abs(window.scrollY - top) > 4) window.scrollTo(0, top);
    };
    track.addEventListener("focusin", onFocus);
    for (const panel of panels.slice(1)) {
      gsap.from(panel.querySelectorAll("h3, .label, p"), {
        y: 30,
        autoAlpha: 0,
        stagger: 0.05,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: { trigger: panel, containerAnimation: strip, start: "left 75%", toggleActions: "play none none reverse" },
      });
    }
    return () => {
      track.removeEventListener("focusin", onFocus);
      release();
      strip = null;
    };
  }, section);
  return strip;
}
