import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { one, time } from "../motion/util";

export function initAi() {
  const root = one("[data-ai]");
  const line = root ? one("[data-ai-line]", root) : null;
  const stamp = root ? one("[data-ai-stamp]", root) : null;
  const status = root ? one("[data-ai-status]", root) : null;
  const again = root ? one<HTMLButtonElement>("[data-ai-again]", root) : null;
  const frame = line?.parentElement;
  if (!root || !line || !stamp || !status || !again || !frame) return;
  let timeline: gsap.core.Timeline | null = null;
  const run = () => {
    timeline?.kill();
    status.textContent = status.dataset.scanning ?? "";
    status.classList.remove("text-green-400");
    gsap.set(stamp, { autoAlpha: 0 });
    timeline = gsap.timeline()
      .set(line, { autoAlpha: 1, y: 0 })
      .to(line, { y: () => frame.clientHeight - 2, duration: time(0.9), ease: "sine.inOut", repeat: 1, yoyo: true })
      .set(line, { autoAlpha: 0 })
      .fromTo(stamp, { autoAlpha: 0, scale: 2.2, rotation: -20 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: time(0.4), ease: "back.out(2.4)" })
      .add(() => {
        status.textContent = status.dataset.match ?? "";
        status.classList.add("text-green-400");
      });
  };
  again.addEventListener("click", run);
  ScrollTrigger.create({ trigger: root, start: "top 80%", once: true, onEnter: run });
}
