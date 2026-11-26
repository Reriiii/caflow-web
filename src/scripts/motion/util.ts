import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

export const still = () => reduced.matches;
export const time = (seconds: number) => (still() ? 0 : seconds);
export const wide = () => window.matchMedia("(min-width: 768px)").matches;
export const finePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export function one<T extends Element = HTMLElement>(selector: string, root: ParentNode = document) {
  return root.querySelector<T>(selector);
}

export function all<T extends Element = HTMLElement>(selector: string, root: ParentNode = document) {
  return [...root.querySelectorAll<T>(selector)];
}

export function announce(target: HTMLElement, text: string) {
  target.textContent = text;
  gsap.fromTo(target, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: time(0.3), ease: "power2.out", overwrite: true });
}

export function burst(origin: HTMLElement) {
  const box = origin.getBoundingClientRect();
  for (let index = 0; index < 14; index += 1) {
    const dot = document.createElement("span");
    dot.setAttribute("aria-hidden", "true");
    dot.className = "pointer-events-none fixed z-[96] h-2 w-2 rounded-full bg-ember";
    dot.style.left = `${box.left + box.width / 2 - 4}px`;
    dot.style.top = `${box.top + box.height / 2 - 4}px`;
    dot.style.boxShadow = "0 0 12px 2px rgb(255 138 92 / 0.8)";
    document.body.append(dot);
    const angle = (index / 14) * Math.PI * 2 + Math.random() * 0.4;
    const reach = 30 + Math.random() * 30;
    gsap.to(dot, {
      x: Math.cos(angle) * reach,
      y: Math.sin(angle) * reach,
      scale: 0.2,
      autoAlpha: 0,
      duration: 0.6 + Math.random() * 0.3,
      ease: "power3.out",
      onComplete: () => dot.remove(),
    });
  }
}

export function magnetic(element: HTMLElement, strength = 0.3) {
  if (!finePointer() || still()) return;
  const toX = gsap.quickTo(element, "x", { duration: 0.5, ease: "power3" });
  const toY = gsap.quickTo(element, "y", { duration: 0.5, ease: "power3" });
  element.addEventListener("pointermove", (event) => {
    const box = element.getBoundingClientRect();
    toX(gsap.utils.clamp(-14, 14, (event.clientX - (box.left + box.width / 2)) * strength));
    toY(gsap.utils.clamp(-10, 10, (event.clientY - (box.top + box.height / 2)) * strength));
  });
  element.addEventListener("pointerleave", () => {
    toX(0);
    toY(0);
  });
}

export function stick(section: HTMLElement, stage: HTMLElement, extra: () => number) {
  const apply = () => {
    section.style.height = `${window.innerHeight + Math.max(0, extra())}px`;
  };
  Object.assign(stage.style, { position: "sticky", top: "0px", height: "100vh" });
  apply();
  ScrollTrigger.addEventListener("refreshInit", apply);
  return () => {
    ScrollTrigger.removeEventListener("refreshInit", apply);
    section.style.height = "";
    Object.assign(stage.style, { position: "", top: "", height: "" });
  };
}
