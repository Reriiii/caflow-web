import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { all, one, stick } from "../motion/util";

interface LoopTask {
  business: string;
  title: string;
  time: string;
  sent: string;
  src: string;
  srcset: string;
  position: string;
}

export function initLoop(media: gsap.MatchMedia) {
  const section = one("[data-loop]");
  if (!section) return;
  const tasks: LoopTask[] = JSON.parse(section.dataset.tasks ?? "[]");
  const screens = all("[data-loop-screen]", section);
  const steps = all("[data-loop-step]", section);
  const picks = all<HTMLButtonElement>("[data-loop-pick]", section);
  const typed = one("[data-loop-type]", section);
  const caret = one("[data-loop-caret]", section);
  const sentChip = one("[data-loop-sent]", section);
  const review = one("[data-loop-review]", section);
  const stamp = one("[data-loop-stamp]", section);
  const ring = one("[data-loop-ring]", section);
  const flash = one("[data-loop-flash]", section);
  const shutter = one("[data-loop-shutter]", section);
  const approve = one("[data-loop-approve]", section);
  const save = one("[data-loop-save]", section);
  const approvedTime = section.dataset.approvedTime ?? "";
  let task = tasks[0];
  let active = -1;

  const setStep = (index: number) => {
    if (index === active) return;
    active = index;
    steps.forEach((step, position) => step.classList.toggle("is-active", position === index));
  };

  const typing = { chars: task?.title.length ?? 0 };
  const paintTyping = () => {
    if (typed && task) typed.textContent = task.title.slice(0, Math.round(typing.chars));
  };

  const fillTask = (next: LoopTask) => {
    task = next;
    for (const node of all("[data-loop-business]", section)) node.textContent = next.business;
    for (const node of all("[data-loop-title]", section)) node.textContent = next.title;
    for (const node of all("[data-loop-time]", section)) node.textContent = next.time;
    for (const node of all("[data-loop-due]", section)) node.textContent = (node.dataset.template ?? "").replace("{time}", next.time);
    if (sentChip) sentChip.textContent = (sentChip.dataset.template ?? "").replace("{time}", next.sent);
    for (const image of all<HTMLImageElement>("[data-loop-photo]", section)) {
      image.srcset = next.srcset;
      image.src = next.src;
      image.style.objectPosition = next.position;
    }
    typing.chars = Math.min(typing.chars, next.title.length);
    paintTyping();
  };

  picks.forEach((button, index) => {
    button.addEventListener("click", () => {
      const next = tasks[index];
      if (!next) return;
      for (const other of picks) {
        const on = other === button;
        other.setAttribute("aria-pressed", String(on));
        other.classList.toggle("bg-ember", on);
        other.classList.toggle("text-night", on);
        other.classList.toggle("border-ember", on);
        other.classList.toggle("text-snow", !on);
        other.classList.toggle("border-line", !on);
      }
      gsap.fromTo(screens, { scale: 0.97 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
      fillTask(next);
    });
  });

  let reviewed: boolean | null = null;
  const setReview = (done: boolean) => {
    if (!review || reviewed === done) return;
    reviewed = done;
    review.textContent = done ? (review.dataset.done ?? "").replace("{time}", approvedTime) : review.dataset.pending ?? "";
    review.classList.toggle("text-green-700", done);
    review.classList.toggle("font-semibold", done);
  };

  const build = (scrollTrigger?: ScrollTrigger.Vars) => {
    const timeline = gsap.timeline({ defaults: { ease: "power2.inOut" }, scrollTrigger });
    timeline
      .addLabel("step0")
      .set(screens, { autoAlpha: 0 })
      .set(screens[0] ?? null, { autoAlpha: 1 })
      .set([stamp, sentChip], { autoAlpha: 0 })
      .fromTo(typing, { chars: 0 }, { chars: () => task?.title.length ?? 0, duration: 1.4, ease: "none", onUpdate: paintTyping })
      .fromTo(save, { scale: 1 }, { scale: 0.94, duration: 0.15, yoyo: true, repeat: 1 })
      .addLabel("step1", "+=0.2")
      .to(screens[0] ?? null, { autoAlpha: 0, y: -20, duration: 0.4 }, "step1")
      .fromTo(screens[1] ?? null, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "step1")
      .fromTo(shutter, { scale: 1 }, { scale: 0.85, duration: 0.15, yoyo: true, repeat: 1 }, "+=0.5")
      .fromTo(flash, { autoAlpha: 0.7 }, { autoAlpha: 0, duration: 0.35 })
      .fromTo(sentChip, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "back.out(2)" })
      .addLabel("step2", "+=0.4")
      .to(screens[1] ?? null, { autoAlpha: 0, y: -20, duration: 0.4 }, "step2")
      .fromTo(screens[2] ?? null, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "step2")
      .fromTo(approve, { scale: 1 }, { scale: 0.92, duration: 0.15, yoyo: true, repeat: 1 }, "+=0.4")
      .fromTo(stamp, { autoAlpha: 0, scale: 2.2, rotation: 18 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2.2)" })
      .fromTo(ring, { scale: 0.7, autoAlpha: 0.9 }, { scale: 1.9, autoAlpha: 0, duration: 0.7, ease: "power2.out" }, "<0.3")
      .addLabel("stamped", "<")
      .addLabel("end", "+=0.6");
    const at = (label: string) => timeline.labels[label] ?? 0;
    timeline.eventCallback("onUpdate", () => {
      const now = timeline.time();
      setStep(now >= at("step2") + 0.25 ? 2 : now >= at("step1") + 0.25 ? 1 : 0);
      setReview(now >= at("stamped"));
    });
    return timeline;
  };

  media.add({ wide: "(min-width: 768px)", motion: "(prefers-reduced-motion: no-preference)" }, (context) => {
    const { wide, motion } = context.conditions as { wide: boolean; motion: boolean };
    if (caret) gsap.to(caret, { autoAlpha: 0, duration: 0.5, repeat: -1, yoyo: true, ease: "steps(1)" });
    if (!motion) {
      gsap.set(screens, { autoAlpha: 0 });
      gsap.set(screens[2] ?? null, { autoAlpha: 1 });
      gsap.set(stamp, { autoAlpha: 1 });
      setStep(2);
      setReview(true);
      return;
    }
    if (wide) {
      const stage = one("[data-loop-stage]", section);
      const release = stage ? stick(section, stage, () => window.innerHeight * 2.8) : () => undefined;
      build({ trigger: section, start: "top top", end: "bottom bottom", scrub: 0.6 });
      return release;
    }
    const timeline = build();
    timeline.repeat(-1).repeatDelay(1.6).pause();
    ScrollTrigger.create({ trigger: section, start: "top 70%", end: "bottom 20%", onToggle: (self) => (self.isActive ? timeline.play() : timeline.pause()) });
  }, section);
}
