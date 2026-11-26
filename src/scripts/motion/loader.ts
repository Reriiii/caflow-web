import { gsap } from "gsap";
import { pauseSmooth } from "./smooth";
import { still } from "./util";

const KEY = "caflow-loaded";
const MINIMUM = 2600;
const LIMIT = 4000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function seen() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function remember() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    return;
  }
}

function build(label: string) {
  const root = document.createElement("div");
  root.id = "loader";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <div class="loader-half loader-top"></div>
    <div class="loader-half loader-bottom"></div>
    <div class="loader-core">
      <div class="relative h-24 w-24 -rotate-[4deg]">
        <img src="/seal.svg" alt="" width="96" height="96" class="absolute inset-0 h-full w-full opacity-15" />
        <img src="/seal.svg" alt="" width="96" height="96" class="absolute inset-0 h-full w-full" data-loader-fill style="clip-path: inset(100% 0 0 0)" />
      </div>
      <p class="poster text-ember text-[clamp(4rem,12vw,9rem)] tabular-nums" data-loader-count>0</p>
      <div class="h-px w-[min(320px,60vw)] bg-line"><div class="h-px w-full origin-left scale-x-0 bg-ember" data-loader-bar></div></div>
      <p class="label" data-loader-text></p>
    </div>`;
  const text = root.querySelector<HTMLElement>("[data-loader-text]");
  if (text) text.textContent = label;
  document.body.append(root);
  return root;
}

export function runLoader(sceneReady: Promise<unknown>) {
  if (still() || seen()) return Promise.resolve();
  const label = document.querySelector<HTMLElement>("[data-loader-label]")?.dataset.loaderLabel ?? "";
  const root = build(label);
  const fill = root.querySelector<HTMLElement>("[data-loader-fill]");
  const count = root.querySelector<HTMLElement>("[data-loader-count]");
  const bar = root.querySelector<HTMLElement>("[data-loader-bar]");
  const core = root.querySelector<HTMLElement>(".loader-core");
  pauseSmooth(true);
  const progress = { value: 0 };
  const paint = () => {
    const value = Math.round(progress.value);
    if (count) count.textContent = String(value);
    if (fill) fill.style.clipPath = `inset(${100 - value}% 0 0 0)`;
    if (bar) gsap.set(bar, { scaleX: value / 100 });
  };
  const climb = gsap.to(progress, { value: 86, duration: MINIMUM / 1000, ease: "power2.out", onUpdate: paint });
  const ready = Promise.race([Promise.all([document.fonts.ready, sceneReady, wait(MINIMUM)]), wait(LIMIT)]);
  return ready.then(
    () =>
      new Promise<void>((resolve) => {
        climb.kill();
        remember();
        gsap
          .timeline({
            onComplete: () => root.remove(),
          })
          .to(progress, { value: 100, duration: 0.5, ease: "power1.out", onUpdate: paint })
          .to(core, { autoAlpha: 0, y: -20, duration: 0.45, ease: "power2.in" }, "+=0.25")
          .add(() => {
            pauseSmooth(false);
            resolve();
          })
          .to(root.querySelector(".loader-top"), { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "<")
          .to(root.querySelector(".loader-bottom"), { yPercent: 100, duration: 1.1, ease: "expo.inOut" }, "<");
      }),
  );
}
