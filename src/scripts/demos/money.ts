import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { all, one, still, time } from "../motion/util";

export function initHours(container?: gsap.core.Animation | null) {
  const root = one("[data-hours]");
  const hoursValue = root ? one("[data-hours-value]", root) : null;
  const payValue = root ? one("[data-pay-value]", root) : null;
  if (!root || !hoursValue || !payValue || still()) return;
  const bars = all("[data-hours-bar]", root);
  const format = root.dataset.format ?? "{h}:{m}";
  const money = new Intl.NumberFormat(root.dataset.locale, { style: "currency", currency: "VND", maximumFractionDigits: 0 });
  const targetHours = Number(hoursValue.dataset.to);
  const targetPay = Number(payValue.dataset.to);
  const show = (value: number, pay: number) => {
    const minutes = Math.round(value * 60);
    hoursValue.textContent = format.replace("{h}", String(Math.floor(minutes / 60))).replace("{m}", String(minutes % 60));
    payValue.textContent = money.format(Math.round(pay / 250) * 250);
  };
  const state = { value: 0, pay: 0 };
  show(0, 0);
  gsap.set(bars, { scaleY: 0 });
  ScrollTrigger.create({
    trigger: root,
    start: container ? "left 85%" : "top 85%",
    containerAnimation: container ?? undefined,
    once: true,
    onEnter: () => {
      gsap.to(state, { value: targetHours, pay: targetPay, duration: 1.6, ease: "power2.out", onUpdate: () => show(state.value, state.pay) });
      gsap.to(bars, { scaleY: 1, duration: 0.8, ease: "back.out(1.6)", stagger: 0.07 });
    },
  });
}

export function initReceipts(container?: gsap.core.Animation | null) {
  const root = one("[data-receipts]");
  const row = root ? one("[data-receipt-row]", root) : null;
  const toggle = root ? one<HTMLButtonElement>("[data-receipt-toggle]", root) : null;
  if (!root || !row || !toggle) return;
  const slips = all("[data-receipt]", row);
  let spread = false;
  const place = (open: boolean, instant: boolean) => {
    spread = open;
    const width = row.clientWidth;
    const slip = slips[0]?.offsetWidth ?? 0;
    const step = slips.length > 1 ? (width - slip) / (slips.length - 1) : 0;
    slips.forEach((item, index) => {
      gsap.to(item, { x: open ? index * step : index * 16, y: open ? 0 : index * -6, zIndex: open ? 1 : slips.length - index, duration: instant ? 0 : time(0.6), delay: instant || !open ? 0 : time(index * 0.06), ease: "power3.out" });
    });
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = (open ? root.dataset.close : root.dataset.open) ?? "";
  };
  place(still(), true);
  toggle.addEventListener("click", () => place(!spread, false));
  new ResizeObserver(() => place(spread, true)).observe(row);
  if (!still()) ScrollTrigger.create({ trigger: root, start: container ? "left 75%" : "top 75%", containerAnimation: container ?? undefined, once: true, onEnter: () => place(true, false) });
}
