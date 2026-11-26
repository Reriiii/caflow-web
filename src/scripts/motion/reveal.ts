import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { all, still } from "./util";

export function splitHeadlines(root: ParentNode = document) {
  if (still()) return;
  for (const title of all("[data-split]", root)) {
    const immediate = title.closest("#top") !== null;
    SplitText.create(title, {
      type: "lines,words",
      mask: "lines",
      linesClass: "split-line",
      autoSplit: true,
      onSplit: (self) => {
        for (const line of self.masks as HTMLElement[]) {
          line.style.paddingBlock = "0.14em";
          line.style.marginBlock = "-0.14em";
        }
        return gsap.from(self.words, {
          yPercent: 120,
          rotation: 4,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.06,
          scrollTrigger: immediate ? undefined : { trigger: title, start: "top 85%", once: true },
        });
      },
    });
  }
}

export function rises(root: ParentNode = document) {
  if (still()) return;
  ScrollTrigger.batch(all("[data-rise]", root), {
    start: "top 88%",
    once: true,
    onEnter: (elements) => gsap.fromTo(elements, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out", stagger: 0.08, overwrite: true }),
  });
}
