import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { all, one, stick } from "../motion/util";

export function initProblem(media: gsap.MatchMedia) {
  const section = one("[data-problem]");
  const statement = section ? one("[data-problem-statement]", section) : null;
  const answer = section ? one("[data-problem-answer]", section) : null;
  if (!section || !statement || !answer) return;
  const fragments = all("[data-fragment]", section);
  media.add({ wide: "(min-width: 768px)", motion: "(prefers-reduced-motion: no-preference)" }, (context) => {
    const { wide, motion } = context.conditions as { wide: boolean; motion: boolean };
    if (!motion) return;
    const stage = wide ? one("[data-problem-stage]", section) : null;
    const release = stage ? stick(section, stage, () => window.innerHeight * 1.6) : () => undefined;
    const split = SplitText.create(statement, { type: "words" });
    gsap.set(split.words, { opacity: 0.14 });
    gsap.set(answer, { autoAlpha: 0, y: 40 });
    const timeline = gsap.timeline({
      scrollTrigger: wide
        ? { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.5 }
        : { trigger: statement, start: "top 80%", end: "bottom 35%", scrub: 0.5 },
    });
    timeline.to(split.words, { opacity: 1, stagger: 0.08, ease: "none", duration: 0.6 }, 0);
    fragments.forEach((fragment, index) => {
      gsap.set(fragment, { autoAlpha: 0, y: 30 });
      timeline.to(fragment, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, index * 0.6);
      timeline.to(fragment, { autoAlpha: 0, filter: "blur(10px)", y: -60 - index * 10, x: (index % 2 ? 1 : -1) * 40, duration: 1.2, ease: "power1.in" }, 3.2 + index * 0.25);
    });
    timeline.to(answer, { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out" }, ">-0.6");
    return () => {
      split.revert();
      release();
    };
  }, section);
}
