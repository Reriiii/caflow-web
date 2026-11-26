import { gsap } from "gsap";
import { finePointer, still } from "./util";

export function startCursor() {
  if (!finePointer() || still()) return;
  const cursor = document.createElement("div");
  cursor.id = "cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = '<span class="cursor-ring"><span data-cursor-text></span></span><span class="cursor-dot"></span>';
  document.body.append(cursor);
  document.documentElement.classList.add("has-cursor");
  const ring = cursor.querySelector<HTMLElement>(".cursor-ring");
  const dot = cursor.querySelector<HTMLElement>(".cursor-dot");
  const text = cursor.querySelector<HTMLElement>("[data-cursor-text]");
  if (!ring || !dot || !text) return;
  gsap.set(cursor, { autoAlpha: 0 });
  const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" });
  const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });
  const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
  const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
  let shown = false;
  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    if (!shown) {
      shown = true;
      gsap.set([dot, ring], { x: event.clientX, y: event.clientY });
      gsap.to(cursor, { autoAlpha: 1, duration: 0.3 });
    }
    dotX(event.clientX);
    dotY(event.clientY);
    ringX(event.clientX);
    ringY(event.clientY);
    const target = event.target instanceof Element ? event.target : null;
    const labelled = target?.closest<HTMLElement>("[data-cursor]");
    const link = target?.closest("a, button, summary, [role='button'], label");
    const label = labelled?.dataset.cursor ?? "";
    cursor.classList.toggle("is-label", Boolean(label));
    cursor.classList.toggle("is-link", !label && Boolean(link));
    if (text.textContent !== label) text.textContent = label;
  });
  document.documentElement.addEventListener("pointerleave", () => {
    shown = false;
    gsap.to(cursor, { autoAlpha: 0, duration: 0.2 });
  });
  window.addEventListener("pointerdown", () => gsap.to(ring, { scale: 0.8, duration: 0.15 }));
  window.addEventListener("pointerup", () => gsap.to(ring, { scale: 1, duration: 0.3, ease: "back.out(3)" }));
}
