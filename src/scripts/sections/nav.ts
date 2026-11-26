import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { pauseSmooth } from "../motion/smooth";
import { all, one, time } from "../motion/util";

export function initNav() {
  const progress = one("[data-progress]");
  const ground = one("[data-nav-ground]");
  if (progress) gsap.to(progress, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
  if (ground) {
    ScrollTrigger.create({
      start: 40,
      end: "max",
      onToggle: (self) => {
        ground.style.opacity = self.isActive ? "1" : "0";
        ground.style.borderColor = self.isActive ? "rgb(255 255 255 / 0.08)" : "transparent";
      },
    });
  }
  for (const link of all<HTMLAnchorElement>("[data-spy]")) {
    const section = document.getElementById(link.dataset.spy ?? "");
    if (!section) continue;
    ScrollTrigger.create({
      trigger: section,
      start: "top center",
      end: "bottom center",
      onToggle: (self) => link.classList.toggle("is-active", self.isActive),
    });
  }
  menu();
}

function menu() {
  const toggle = one<HTMLButtonElement>("[data-menu-toggle]");
  const panel = one("[data-menu]");
  if (!toggle || !panel) return;
  const bars = all("[data-menu-bar]", toggle);
  const links = all("[data-menu-link]", panel);
  let open = false;
  const set = (next: boolean) => {
    open = next;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", (open ? toggle.dataset.closeLabel : toggle.dataset.openLabel) ?? "");
    pauseSmooth(open);
    document.documentElement.style.overflow = open ? "hidden" : "";
    for (const region of all("main, footer")) region.inert = open;
    gsap.to(bars[0] ?? null, { y: open ? 0 : -4, rotation: open ? 45 : 0, duration: time(0.3) });
    gsap.to(bars[1] ?? null, { y: open ? 0 : 4, rotation: open ? -45 : 0, duration: time(0.3) });
    if (open) {
      panel.style.display = "flex";
      gsap.fromTo(panel, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: time(0.6), ease: "expo.inOut" });
      gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: time(0.7), ease: "expo.out", stagger: 0.05, delay: time(0.2) });
      links[0]?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
    } else {
      gsap.to(panel, { clipPath: "inset(0 0 100% 0)", duration: time(0.45), ease: "expo.in", onComplete: () => { panel.style.display = ""; } });
    }
  };
  toggle.addEventListener("click", () => set(!open));
  for (const link of links) link.addEventListener("click", () => set(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) {
      set(false);
      toggle.focus();
    }
  });
  window.matchMedia("(min-width: 1280px)").addEventListener("change", (event) => {
    if (event.matches && open) set(false);
  });
}
