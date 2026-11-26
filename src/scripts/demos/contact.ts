import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { all, burst, one, still, time } from "../motion/util";

export function initContact() {
  const card = one("[data-contact-card]");
  const face = card ? one("[data-contact-tilt]", card) : null;
  const flip = card ? one("[data-contact-flip]", card) : null;
  const front = card ? one("[data-contact-front]", card) : null;
  const back = card ? one("[data-contact-back]", card) : null;
  if (!card || !face || !flip || !front || !back) return;
  const seal = one("[data-contact-seal]", card);
  const ring = one("[data-contact-ring]", card);
  const live = one("[data-copy-status]", card);
  const toast = one("[data-copy-toast]", card);
  const cells = all<SVGRectElement>("[data-qr-cell]", back);
  for (const button of all<HTMLButtonElement>("[data-copy]", card)) {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy ?? "");
      } catch {
        return;
      }
      if (live) live.textContent = card.dataset.copied ?? "";
      gsap.fromTo(button, { scale: 0.82 }, { scale: 1, duration: time(0.4), ease: "back.out(3)" });
      if (!still()) burst(button);
      if (toast) {
        gsap.timeline()
          .fromTo(toast, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: time(0.25), ease: "power2.out" })
          .to(toast, { y: 10, autoAlpha: 0, duration: time(0.25), ease: "power2.in" }, "+=1.2");
      }
    });
  }
  const turn = (toBack: boolean) => {
    gsap.to(flip, { rotationY: toBack ? 180 : 0, duration: time(0.9), ease: "power3.inOut" });
    back.inert = !toBack;
    back.setAttribute("aria-hidden", String(!toBack));
    front.inert = toBack;
    front.setAttribute("aria-hidden", String(toBack));
    if (toBack && !still()) {
      gsap.fromTo(cells, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.35, ease: "back.out(2.5)", stagger: { amount: 0.9, from: "random" }, delay: 0.35 });
    }
    const target = one<HTMLButtonElement>(`[data-contact-turn="${toBack ? "front" : "back"}"]`, card);
    window.setTimeout(() => target?.focus({ preventScroll: true, focusVisible: false } as FocusOptions), still() ? 0 : 500);
  };
  for (const button of all<HTMLButtonElement>("[data-contact-turn]", card)) {
    button.addEventListener("click", () => turn(button.dataset.contactTurn === "back"));
  }
  gsap.set(flip, { transformPerspective: 1600 });
  if (still()) return;
  if (window.matchMedia("(hover: hover)").matches) {
    const turnX = gsap.quickTo(face, "rotationX", { duration: 0.7, ease: "power3" });
    const turnY = gsap.quickTo(face, "rotationY", { duration: 0.7, ease: "power3" });
    const layers = all("[data-depth]", card).map((layer) => ({
      depth: Number(layer.dataset.depth ?? 0),
      x: gsap.quickTo(layer, "x", { duration: 0.7, ease: "power3" }),
      y: gsap.quickTo(layer, "y", { duration: 0.7, ease: "power3" }),
    }));
    card.addEventListener("pointermove", (event) => {
      const box = card.getBoundingClientRect();
      const across = (event.clientX - box.left) / box.width - 0.5;
      const down = (event.clientY - box.top) / box.height - 0.5;
      turnY(across * 14);
      turnX(-down * 10);
      for (const layer of layers) {
        layer.x(across * layer.depth);
        layer.y(down * layer.depth);
      }
    });
    card.addEventListener("pointerleave", () => {
      turnX(0);
      turnY(0);
      for (const layer of layers) {
        layer.x(0);
        layer.y(0);
      }
    });
  }
  const name = one("[data-contact-name]", card);
  const rows = all("[data-contact-row]", card);
  ScrollTrigger.create({
    trigger: card,
    start: "top 82%",
    once: true,
    onEnter: () => {
      const timeline = gsap.timeline();
      timeline.from(face, { y: 70, rotationX: 24, rotationY: -12, autoAlpha: 0, duration: 1, ease: "power3.out" });
      if (name) {
        const split = SplitText.create(name, { type: "chars" });
        timeline.from(split.chars, { yPercent: 80, autoAlpha: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.025, onComplete: () => split.revert() }, 0.35);
      }
      timeline.fromTo(rows, { x: -24, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out", stagger: 0.08, clearProps: "transform" }, 0.5);
      if (seal) timeline.fromTo(seal, { autoAlpha: 0, scale: 2.8, rotation: -36 }, { autoAlpha: 1, scale: 1, rotation: -4, duration: 0.55, ease: "back.out(2.2)" }, 0.6);
      if (ring) timeline.fromTo(ring, { scale: 0.7, autoAlpha: 0.9 }, { scale: 1.9, autoAlpha: 0, duration: 0.8, ease: "power2.out" }, 0.95);
    },
  });
  if (seal && ring) {
    seal.parentElement?.addEventListener("pointerenter", () => {
      gsap.fromTo(seal, { scale: 0.86 }, { scale: 1, rotation: -4, duration: 0.5, ease: "elastic.out(1, 0.4)" });
      gsap.fromTo(ring, { scale: 0.8, autoAlpha: 0.8 }, { scale: 1.7, autoAlpha: 0, duration: 0.7, ease: "power2.out" });
    });
  }
}
