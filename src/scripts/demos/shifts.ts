import { gsap } from "gsap";
import { all, announce, one, still, time } from "../motion/util";

export function initShifts() {
  const root = one("[data-shifts]");
  const status = root ? one("[data-status]", root) : null;
  if (!root || !status) return;
  const data = root.dataset;
  const cells = all<HTMLButtonElement>(".shift-cell", root);
  const list = one("[data-shift-list]");
  const empty = one("[data-shift-empty]");
  const filledText = one("[data-shift-filled]");
  const bar = one("[data-shift-bar]");
  const tally = () => {
    let filled = 0;
    let total = 0;
    for (const cell of cells) {
      const cap = Number(cell.dataset.cap);
      const others: string[] = JSON.parse(cell.dataset.people ?? "[]");
      total += cap;
      filled += Math.min(cap, others.length + (cell.classList.contains("is-mine") ? 1 : 0));
    }
    if (filledText) filledText.textContent = (filledText.dataset.template ?? "").replace("{n}", String(filled)).replace("{total}", String(total));
    if (bar) gsap.to(bar, { scaleX: filled / total, duration: time(0.5), ease: "power2.out" });
    if (empty && list) gsap.to(empty, { autoAlpha: list.children.length ? 0 : 1, duration: time(0.25) });
    for (const cell of cells) {
      const mini = one(`[data-mini-key="${cell.dataset.key}"]`);
      if (!mini) continue;
      const mine = cell.classList.contains("is-mine");
      const full = !mine && cell.classList.contains("is-full");
      const changed = mini.classList.contains("is-mine") !== mine;
      mini.classList.toggle("is-mine", mine);
      mini.classList.toggle("is-full", full);
      mini.classList.toggle("is-open", !mine && !full);
      if (changed && !still()) gsap.fromTo(mini, { scale: 0.6 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
    }
  };
  const addBooking = (cell: HTMLButtonElement) => {
    if (!list) return;
    const item = document.createElement("li");
    item.dataset.key = cell.dataset.key ?? "";
    item.className = "flex items-center gap-3 rounded-2xl border border-green-300 bg-green-50 p-2.5";
    const day = document.createElement("span");
    day.className = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-[12px] font-semibold text-green-900";
    day.textContent = cell.dataset.shiftDay ?? "";
    const shift = document.createElement("span");
    shift.className = "min-w-0 flex-1 truncate text-[12px] font-semibold text-green-900";
    shift.textContent = cell.dataset.shiftName ?? "";
    const badge = document.createElement("span");
    badge.className = "shrink-0 rounded-full bg-green-600 px-2 py-1 text-[10px] font-semibold text-white";
    badge.textContent = list.dataset.booked ?? "";
    item.append(day, shift, badge);
    const after = [...list.children].find((other) => (other as HTMLElement).dataset.key! > item.dataset.key!);
    list.insertBefore(item, after ?? null);
    gsap.from(item, { x: 40, autoAlpha: 0, scale: 0.9, duration: time(0.45), ease: "back.out(2)" });
  };
  const dropBooking = (cell: HTMLButtonElement) => {
    const item = list ? [...list.children].find((other) => (other as HTMLElement).dataset.key === cell.dataset.key) : null;
    if (!item) return;
    gsap.to(item, { x: -40, autoAlpha: 0, duration: time(0.3), ease: "power2.in", onComplete: () => { item.remove(); tally(); } });
  };
  const render = (cell: HTMLButtonElement, cap: number, names: string[], mine: boolean) => {
    const names_ = one("[data-names]", cell);
    const left = one("[data-left]", cell);
    const full = names.length >= cap;
    cell.classList.toggle("is-mine", mine);
    cell.classList.toggle("is-full", full && !mine);
    cell.setAttribute("aria-pressed", String(mine));
    if (names_) names_.textContent = names.length ? names.join(", ") : data.open ?? "";
    if (left) left.textContent = full ? data.full ?? "" : (data.left ?? "").replace("{n}", String(cap - names.length));
  };
  for (const cell of cells) {
    cell.addEventListener("click", () => {
      const cap = Number(cell.dataset.cap);
      const others: string[] = JSON.parse(cell.dataset.people ?? "[]");
      const mine = cell.classList.contains("is-mine");
      if (mine) {
        render(cell, cap, others, false);
        dropBooking(cell);
        tally();
        gsap.fromTo(cell, { scale: 0.92 }, { scale: 1, duration: time(0.4), ease: "back.out(3)" });
        announce(status, data.msgDropped ?? "");
        return;
      }
      if (others.length >= cap) {
        gsap.fromTo(cell, { x: 0 }, { keyframes: { x: [0, -7, 7, -5, 5, 0] }, duration: time(0.4), ease: "none" });
        announce(status, data.msgRefused ?? "");
        return;
      }
      render(cell, cap, [...others, data.you ?? ""], true);
      addBooking(cell);
      tally();
      gsap.fromTo(cell, { scale: 0.88 }, { scale: 1, duration: time(0.45), ease: "back.out(3)" });
      announce(status, data.msgBooked ?? "");
    });
  }
}
