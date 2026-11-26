import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { still } from "./util";

let lenis: Lenis | null = null;

const anchorOf = (element: Element) => (element.parentElement?.classList.contains("pin-spacer") ? element.parentElement : element) as HTMLElement;

export function scrollToTarget(target: string | Element) {
  const element = typeof target === "string" ? document.querySelector(target) : target;
  if (!element) return;
  if (lenis) {
    lenis.scrollTo(anchorOf(element), { duration: 1.4 });
    return;
  }
  element.scrollIntoView({ behavior: still() ? "auto" : "smooth", block: "start" });
}

export function startSmooth() {
  if (!still()) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, syncTouch: false, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((seconds) => lenis?.raf(seconds * 1000));
    gsap.ticker.lagSmoothing(0);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
  }
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]:not(.skip)')) {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href")?.slice(1) ?? "";
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      event.preventDefault();
      setTimeout(() => scrollToTarget(target), 0);
      history.replaceState(null, "", `#${id}`);
    });
  }
  return lenis;
}

export function scrollToHash() {
  const hash = decodeURIComponent(location.hash.slice(1));
  const target = hash ? document.getElementById(hash) : null;
  if (!target) return;
  const padding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const top = anchorOf(target).getBoundingClientRect().top + window.scrollY - padding;
  if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
  else window.scrollTo(0, top);
}

export function pauseSmooth(paused: boolean) {
  if (!lenis) return;
  if (paused) lenis.stop();
  else lenis.start();
}
