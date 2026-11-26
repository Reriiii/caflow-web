import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { one, still } from "../motion/util";

export function initClose() {
  const marquee = one("[data-marquee]");
  if (!marquee || still()) return;
  const loop = gsap.to(marquee, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
  let settle: gsap.core.Tween | null = null;
  ScrollTrigger.create({
    trigger: marquee,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
    onUpdate: (self) => {
      const boost = gsap.utils.clamp(1, 5, 1 + Math.abs(self.getVelocity()) / 500);
      settle?.kill();
      loop.timeScale(boost * (self.direction === -1 ? -1 : 1));
      settle = gsap.to(loop, { timeScale: self.direction === -1 ? -1 : 1, duration: 1.2, ease: "power2.out" });
    },
  });
  marquee.addEventListener("pointerenter", () => gsap.to(loop, { timeScale: 0.3, duration: 0.6 }));
  marquee.addEventListener("pointerleave", () => gsap.to(loop, { timeScale: 1, duration: 0.6 }));
}
