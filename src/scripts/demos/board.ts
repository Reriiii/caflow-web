import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { all, announce, one, still, time } from "../motion/util";

gsap.registerPlugin(Flip);

export function initBoard() {
  const root = one("[data-compose]");
  const grid = root ? one("[data-grid]", root) : null;
  const feed = one("[data-board-feed]");
  const status = root ? one("[data-status]", root) : null;
  const add = root ? one<HTMLButtonElement>("[data-add]", root) : null;
  const remove = root ? one<HTMLButtonElement>("[data-remove]", root) : null;
  const post = root ? one<HTMLButtonElement>("[data-post]", root) : null;
  const template = grid ? one("[data-tile]", grid) : null;
  if (!root || !grid || !feed || !status || !add || !remove || !post || !template) return;
  const data = root.dataset;
  const limit = 12;
  let count = all("[data-tile]", grid).length;
  const pool: { src: string; srcset: string; position: string }[] = JSON.parse(data.pool ?? "[]");
  const makeTile = (index: number) => {
    const tile = template.cloneNode(true) as HTMLElement;
    tile.dataset.tile = String(index);
    one(".more", tile)?.remove();
    const image = one<HTMLImageElement>("img", tile);
    const source = pool[index % Math.max(1, pool.length)];
    if (image && source) {
      image.srcset = source.srcset;
      image.src = source.src;
      image.style.objectPosition = source.position;
    }
    return tile;
  };
  const paint = () => {
    const tiles = all("[data-tile]", grid);
    for (const tile of tiles) one(".more", tile)?.remove();
    const last = tiles[3];
    if (count > 4 && last) {
      const more = document.createElement("span");
      more.className = "more absolute inset-0 flex items-center justify-center rounded-xl bg-black/70 text-lg font-semibold text-white";
      more.textContent = `+${count - 3}`;
      last.append(more);
    }
    remove.disabled = count === 0;
    add.disabled = count >= limit;
  };
  add.addEventListener("click", () => {
    if (count >= limit) return;
    count += 1;
    if (count <= 4) {
      const state = Flip.getState(all("[data-tile]", grid));
      const tile = makeTile(count - 1);
      grid.append(tile);
      Flip.from(state, { duration: time(0.45), ease: "power2.inOut" });
      gsap.fromTo(tile, { scale: 0, rotation: -12 }, { scale: 1, rotation: 0, duration: time(0.5), ease: "back.out(2.2)" });
    }
    paint();
    const more = one(".more", grid);
    if (more) gsap.fromTo(more, { scale: 1.4 }, { scale: 1, duration: time(0.3), ease: "back.out(3)" });
  });
  remove.addEventListener("click", () => {
    if (count === 0) return;
    count -= 1;
    if (count < 4) {
      const tiles = all("[data-tile]", grid);
      const gone = tiles[tiles.length - 1];
      gone?.removeAttribute("data-tile");
      if (gone) gsap.to(gone, { scale: 0, autoAlpha: 0, duration: time(0.25), ease: "power2.in", onComplete: () => { gone.remove(); paint(); } });
    } else paint();
  });
  post.addEventListener("click", () => {
    const photos = count;
    const item = document.createElement("article");
    item.className = "rounded-2xl border border-persimmon/40 bg-paper p-3";
    const head = document.createElement("div");
    head.className = "flex items-center gap-2";
    const avatar = document.createElement("span");
    avatar.className = "flex h-7 w-7 items-center justify-center rounded-full bg-persimmon text-[11px] font-semibold text-white";
    avatar.textContent = (data.you ?? "").slice(0, 1);
    const who = document.createElement("span");
    who.className = "text-[12px] font-semibold";
    who.textContent = data.you ?? "";
    const when = document.createElement("span");
    when.className = "text-[10.5px] text-neutral-500";
    when.textContent = data.now ?? "";
    head.append(avatar, who, when);
    const text = document.createElement("p");
    text.className = "mt-2 text-[12px] leading-snug";
    text.textContent = data.text ?? "";
    item.append(head, text);
    if (photos > 0) {
      const shown = Math.min(photos, photos > 4 ? 4 : photos);
      const gallery = document.createElement("div");
      gallery.className = `mt-2 grid gap-1.5 ${shown > 1 ? "grid-cols-2" : "grid-cols-1"}`;
      for (let index = 0; index < shown; index += 1) {
        const source = pool[index % Math.max(1, pool.length)];
        const cell = document.createElement("span");
        cell.className = `relative block overflow-hidden rounded-xl ${shown > 1 ? "aspect-square" : "aspect-[16/9]"}`;
        const image = document.createElement("img");
        image.srcset = source?.srcset ?? "";
        image.sizes = shown > 1 ? "110px" : "230px";
        image.src = source?.src ?? "";
        image.alt = "";
        image.className = "h-full w-full object-cover";
        image.style.objectPosition = source?.position ?? "50% 50%";
        cell.append(image);
        if (index === 3 && photos > 4) {
          const more = document.createElement("span");
          more.className = "absolute inset-0 flex items-center justify-center bg-ink/60 text-[15px] font-semibold text-white";
          more.textContent = `+${photos - 3}`;
          cell.append(more);
        }
        gallery.append(cell);
      }
      item.append(gallery);
    }
    const replies = document.createElement("p");
    replies.className = "mt-2 flex items-center gap-2 text-[11px] font-semibold text-persimmon";
    const label = document.createElement("span");
    label.textContent = (data.replies ?? "").replace("{n}", "0");
    const dot = document.createElement("span");
    dot.className = "h-2 w-2 rounded-full bg-persimmon";
    replies.append(label, dot);
    item.append(replies);
    feed.prepend(item);
    while (feed.children.length > 4) feed.lastElementChild?.remove();
    gsap.from(item, { y: -24, scale: 0.94, autoAlpha: 0, duration: time(0.55), ease: "back.out(1.8)" });
    const counter = { n: 0 };
    gsap.to(counter, {
      n: 3,
      duration: time(2.4),
      delay: time(0.6),
      ease: "steps(3)",
      onUpdate: () => {
        const n = Math.round(counter.n);
        label.textContent = n === 1 ? data.reply ?? "" : (data.replies ?? "").replace("{n}", String(n));
      },
    });
    gsap.fromTo(dot, { scale: 0 }, { scale: 1, duration: time(0.4), delay: time(0.8), ease: "back.out(3)", repeat: still() ? 0 : 2, yoyo: true });
    announce(status, data.msgPosted ?? "");
  });
  paint();
}
