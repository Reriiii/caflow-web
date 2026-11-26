import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { initAi } from "./demos/ai";
import { initBoard } from "./demos/board";
import { initCheckin } from "./demos/checkin";
import { initContact } from "./demos/contact";
import { initDeck } from "./demos/deck";
import { initHours, initReceipts } from "./demos/money";
import { initQuestions } from "./demos/questions";
import { initShifts } from "./demos/shifts";
import { startCursor } from "./motion/cursor";
import { runLoader } from "./motion/loader";
import { rises, splitHeadlines } from "./motion/reveal";
import { scrollToHash, startSmooth } from "./motion/smooth";
import { all, magnetic } from "./motion/util";
import { initClose } from "./sections/close";
import { initHero } from "./sections/hero";
import { initLive } from "./sections/live";
import { initLoop } from "./sections/loop";
import { initNav } from "./sections/nav";
import { initProblem } from "./sections/problem";
import { initTry } from "./sections/try";

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, Draggable);

const sceneReady = new Promise((resolve) => window.addEventListener("caflow:scene-ready", resolve, { once: true }));
void import("./three-stage").then((stage) => stage.mountAll());

async function main() {
  startSmooth();
  startCursor();
  for (const element of all("[data-magnetic]")) magnetic(element);
  initShifts();
  initBoard();
  initCheckin();
  initQuestions();

  await runLoader(sceneReady);

  const media = gsap.matchMedia();
  initHero();
  initProblem(media);
  initLoop(media);
  initLive(media);
  const strip = initTry(media);
  splitHeadlines();
  rises();
  initNav();
  initDeck();
  initHours(strip);
  initReceipts(strip);
  initAi();
  initContact();
  initClose();

  let holdUntil = location.hash ? performance.now() + 6000 : 0;
  const release = () => {
    holdUntil = 0;
  };
  for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) window.addEventListener(type, release, { once: true, passive: true });
  ScrollTrigger.addEventListener("refresh", () => {
    if (performance.now() < holdUntil) scrollToHash();
  });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

void main();
