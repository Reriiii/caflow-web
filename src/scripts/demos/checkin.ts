import { gsap } from "gsap";
import { all, one, still, time } from "../motion/util";

export function initCheckin() {
  const root = one("[data-checkin]");
  const button = root ? one<HTMLButtonElement>("[data-checkin-button]", root) : null;
  const label = root ? one("[data-checkin-label]", root) : null;
  const stamp = root ? one("[data-checkin-time]", root) : null;
  const flash = root ? one("[data-checkin-flash]", root) : null;
  if (!root || !button || !label || !stamp || !flash) return;
  const rows = all("[data-checkin-row]", root);
  let on = false;
  button.addEventListener("click", () => {
    on = !on;
    button.setAttribute("aria-pressed", String(on));
    button.classList.toggle("is-on", on);
    label.textContent = (on ? root.dataset.undo : root.dataset.action) ?? "";
    if (!on) {
      for (const row of rows) row.classList.remove("is-done");
      gsap.to(stamp, { autoAlpha: 0, duration: time(0.2) });
      return;
    }
    const timeline = gsap.timeline();
    timeline
      .fromTo(flash, { autoAlpha: 0.9 }, { autoAlpha: 0, duration: time(0.5), ease: "power2.out" })
      .fromTo(button, { scale: 0.88 }, { scale: 1, duration: time(0.45), ease: "back.out(3)" }, 0);
    rows.forEach((row, index) => {
      timeline.add(() => {
        row.classList.add("is-done");
        if (!still()) gsap.fromTo(one(".checkin-tick", row), { scale: 0.4 }, { scale: 1, duration: 0.35, ease: "back.out(3)" });
      }, time(0.2 + index * 0.22));
    });
    timeline.fromTo(stamp, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: time(0.3) }, time(0.9));
  });
}
