import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { all, announce, one, still, time } from "../motion/util";

gsap.registerPlugin(Draggable, ScrollTrigger);

export function initDeck() {
  const root = one("[data-deck]");
  const pile = root ? one("[data-deck-pile]", root) : null;
  const queue = root ? one("[data-deck-queue]", root) : null;
  const status = root ? one("[data-deck-status]", root) : null;
  const done = root ? one("[data-deck-done]", root) : null;
  const yes = root ? one<HTMLButtonElement>('[data-deck-act="yes"]', root) : null;
  const no = root ? one<HTMLButtonElement>('[data-deck-act="no"]', root) : null;
  const again = root ? one<HTMLButtonElement>("[data-deck-again]", root) : null;
  if (!root || !pile || !queue || !status || !done || !yes || !no || !again) return;
  const data = root.dataset;
  const original = all("[data-deck-card]", pile).reverse();
  const dots = all("[data-deck-dot]", root);
  let cards: HTMLElement[] = [];
  let busy = false;
  let drag: Draggable | null = null;
  const layout = (instant: boolean) => {
    cards.forEach((card, index) => {
      gsap.to(card, { y: index * 20, scale: 1 - index * 0.06, zIndex: 10 - index, autoAlpha: index < 3 ? 1 : 0, duration: instant ? 0 : time(0.35), ease: "power2.out" });
    });
  };
  const count = () => {
    queue.textContent = (data.queue ?? "").replace("{n}", String(cards.length));
    yes.disabled = cards.length === 0;
    no.disabled = cards.length === 0;
    gsap.to(done, { autoAlpha: cards.length === 0 ? 1 : 0, duration: time(0.3) });
  };
  const decide = (ok: boolean) => {
    const top = cards[0];
    if (!top || busy) return;
    busy = true;
    drag?.kill();
    drag = null;
    const dot = dots[original.indexOf(top)];
    dot?.classList.remove("bg-white/20");
    dot?.classList.add(ok ? "bg-green-600" : "bg-red-600");
    const finish = () => {
      cards.shift();
      busy = false;
      layout(false);
      count();
      bind();
    };
    const timeline = gsap.timeline({ onComplete: finish });
    timeline.to(all("[data-deck-yes],[data-deck-no]", top), { autoAlpha: 0, duration: time(0.15) });
    if (ok) {
      timeline
        .fromTo(one("[data-deck-stamp]", top), { autoAlpha: 0, scale: 2.4, rotation: -24 }, { autoAlpha: 1, scale: 1, rotation: -4, duration: time(0.4), ease: "back.out(2.4)" })
        .to(top, { x: 560, rotation: 12, autoAlpha: 0, duration: time(0.5), ease: "power2.in" }, `+=${time(0.3)}`);
    } else {
      timeline
        .fromTo(one("[data-deck-tag]", top), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: time(0.3), ease: "back.out(2)" })
        .to(top, { x: -560, rotation: -12, autoAlpha: 0, duration: time(0.5), ease: "power2.in" }, `+=${time(0.35)}`);
    }
    announce(status, ((ok ? data.msgApproved : data.msgRetaken) ?? "").replace("{task}", top.dataset.task ?? ""));
  };
  const bind = () => {
    const top = cards[0];
    if (!top) return;
    const yesBadge = one("[data-deck-yes]", top);
    const noBadge = one("[data-deck-no]", top);
    drag = Draggable.create(top, {
      type: "x",
      allowNativeTouchScrolling: true,
      onDrag() {
        const lean = gsap.utils.clamp(-1, 1, this.x / 140);
        gsap.set(top, { rotation: lean * 7 });
        if (yesBadge) gsap.set(yesBadge, { autoAlpha: Math.max(0, lean) });
        if (noBadge) gsap.set(noBadge, { autoAlpha: Math.max(0, -lean) });
      },
      onDragEnd() {
        if (this.x > 110) decide(true);
        else if (this.x < -110) decide(false);
        else {
          gsap.to(top, { x: 0, rotation: 0, duration: time(0.45), ease: "back.out(2)" });
          gsap.to([yesBadge, noBadge], { autoAlpha: 0, duration: time(0.2) });
        }
      },
    })[0] ?? null;
  };
  const reset = () => {
    drag?.kill();
    drag = null;
    busy = false;
    cards = [...original];
    for (const card of cards) {
      gsap.set(card, { x: 0, rotation: 0, autoAlpha: 1 });
      gsap.set(all("[data-deck-yes],[data-deck-no],[data-deck-stamp],[data-deck-tag]", card), { autoAlpha: 0 });
    }
    for (const dot of dots) {
      dot.classList.remove("bg-green-600", "bg-red-600");
      dot.classList.add("bg-white/20");
    }
    status.textContent = "";
    layout(true);
    count();
    bind();
  };
  yes.addEventListener("click", () => decide(true));
  no.addEventListener("click", () => decide(false));
  again.addEventListener("click", () => {
    reset();
    yes.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
  });
  reset();
  if (!still()) {
    ScrollTrigger.create({
      trigger: pile,
      start: "top 85%",
      once: true,
      onEnter: () => gsap.from(original.slice(0, 3), { y: "+=90", autoAlpha: 0, duration: 0.7, ease: "power3.out", stagger: 0.09 }),
    });
  }
}
