import { gsap } from "gsap";
import { all, one, time } from "../motion/util";

export function initQuestions() {
  for (const item of all<HTMLDetailsElement>("[data-faq]")) {
    const summary = one("summary", item);
    const body = one("[data-faq-body]", item);
    if (!summary || !body) continue;
    let wanted = item.open;
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      wanted = !wanted;
      if (!wanted) {
        gsap.to(body, {
          height: 0,
          overwrite: true,
          duration: time(0.35),
          ease: "power2.inOut",
          onComplete: () => { item.open = false; gsap.set(body, { clearProps: "height" }); },
        });
        return;
      }
      const from = item.open ? body.getBoundingClientRect().height : 0;
      item.open = true;
      gsap.fromTo(body, { height: from }, { height: "auto", overwrite: true, duration: time(0.45), ease: "power2.out", onComplete: () => { gsap.set(body, { clearProps: "height" }); } });
      if (from === 0) gsap.fromTo(one("p", body), { y: -8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: time(0.4), ease: "power2.out" });
    });
  }
}
