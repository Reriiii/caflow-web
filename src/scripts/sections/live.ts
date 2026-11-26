import { gsap } from "gsap";
import { all, one, stick, time } from "../motion/util";

const START = 7;
const END = 17;

export function branchState(branch: { total: number; behindAt: number }, hour: number) {
  const share = gsap.utils.clamp(0, 1, (hour - START) / (END - START));
  const late = branch.behindAt > 0 && hour >= branch.behindAt ? 2 : 0;
  return { done: Math.round(branch.total * share), late };
}

export function initLive(media: gsap.MatchMedia) {
  const section = one("[data-live]");
  if (!section) return;
  const clock = one("[data-live-clock]", section);
  const doneAll = one("[data-live-done-all]", section);
  const lateAll = one("[data-live-late-all]", section);
  const fill = one("[data-live-fill]", section);
  const knob = one("[data-live-knob]", section);
  const onTrack = section.dataset.onTrack ?? "";
  const behind = section.dataset.behind ?? "";
  const rows = all("[data-live-branch]", section).map((row) => ({
    row,
    total: Number(row.dataset.total ?? 0),
    behindAt: Number(row.dataset.behindAt ?? 0),
    done: one("[data-live-done]", row),
    bar: one("[data-live-bar]", row),
    state: one("[data-live-state]", row),
    late: -1,
  }));

  const paint = (hour: number) => {
    const whole = Math.floor(hour);
    const minutes = Math.floor((hour - whole) * 60 / 5) * 5;
    if (clock) clock.textContent = `${String(whole).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    const share = gsap.utils.clamp(0, 1, (hour - START) / (END - START));
    if (fill) gsap.set(fill, { scaleX: share });
    if (knob) gsap.set(knob, { x: share * (knob.parentElement?.clientWidth ?? 0) });
    let sum = 0;
    let lateSum = 0;
    for (const item of rows) {
      const state = branchState(item, hour);
      sum += state.done;
      lateSum += state.late;
      if (item.done) item.done.textContent = String(state.done);
      if (item.bar) gsap.set(item.bar, { scaleX: state.done / item.total });
      if (state.late !== item.late) {
        item.late = state.late;
        const isLate = state.late > 0;
        item.bar?.classList.toggle("bg-ember", isLate);
        item.bar?.classList.toggle("bg-green-500", !isLate);
        if (item.state) {
          item.state.textContent = isLate ? behind.replace("{n}", String(state.late)) : onTrack;
          item.state.classList.toggle("bg-ember/15", isLate);
          item.state.classList.toggle("text-ember", isLate);
          item.state.classList.toggle("bg-green-500/15", !isLate);
          item.state.classList.toggle("text-green-300", !isLate);
          if (isLate) gsap.fromTo(item.state, { scale: 0.7 }, { scale: 1, duration: time(0.45), ease: "back.out(3)" });
        }
      }
    }
    if (doneAll) doneAll.textContent = String(sum);
    if (lateAll) {
      lateAll.textContent = (lateAll.dataset.template ?? "").replace("{n}", String(lateSum));
      lateAll.style.opacity = lateSum > 0 ? "1" : "0";
    }
  };

  for (const item of rows) {
    const toggle = one<HTMLButtonElement>("[data-live-toggle]", item.row);
    const panel = one("[data-live-panel]", item.row);
    const plus = one("[data-live-plus]", item.row);
    if (!toggle || !panel) continue;
    toggle.addEventListener("click", () => {
      const opening = toggle.getAttribute("aria-expanded") !== "true";
      for (const other of rows) {
        const otherToggle = one<HTMLButtonElement>("[data-live-toggle]", other.row);
        const otherPanel = one("[data-live-panel]", other.row);
        const otherPlus = one("[data-live-plus]", other.row);
        if (!otherToggle || !otherPanel || otherToggle.getAttribute("aria-expanded") !== "true") continue;
        otherToggle.setAttribute("aria-expanded", "false");
        if (otherPlus) otherPlus.style.transform = "";
        gsap.to(otherPanel, { height: 0, duration: time(0.3), ease: "power2.inOut", onComplete: () => { otherPanel.classList.add("hidden"); gsap.set(otherPanel, { clearProps: "height" }); } });
      }
      if (!opening) return;
      toggle.setAttribute("aria-expanded", "true");
      if (plus) plus.style.transform = "rotate(45deg)";
      panel.classList.remove("hidden");
      gsap.fromTo(panel, { height: 0 }, { height: "auto", duration: time(0.4), ease: "power2.out", onComplete: () => { gsap.set(panel, { clearProps: "height" }); } });
      gsap.fromTo(all("li", panel), { x: -16, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: time(0.35), stagger: 0.05, ease: "power2.out" });
    });
  }

  media.add({ wide: "(min-width: 1024px)", motion: "(prefers-reduced-motion: no-preference)" }, (context) => {
    const { wide, motion } = context.conditions as { wide: boolean; motion: boolean };
    if (!motion) {
      paint(14.5);
      return;
    }
    const stage = wide ? one("[data-live-stage]", section) : null;
    const release = stage ? stick(section, stage, () => window.innerHeight * 1.4) : () => undefined;
    const state = { hour: START };
    paint(START);
    gsap.to(state, {
      hour: END,
      ease: "none",
      onUpdate: () => paint(state.hour),
      scrollTrigger: wide
        ? { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.4 }
        : { trigger: section, start: "top 55%", end: "bottom 75%", scrub: 0.4 },
    });
    return release;
  }, section);
}
