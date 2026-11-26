import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../dist");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : fallback;
};
const lang = opt("lang", "en");
const out = path.resolve(opt("out", path.resolve(here, `../showcase/caflow-landing-${lang}.mp4`)));
const limit = Number(opt("seconds", "0"));
const FPS = 60;
const W = Number(opt("width", "1920"));
const H = Math.round((W * 9) / 16);
const SCALE = 1920 / W;
const STEP = 1000 / FPS;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".json": "application/json", ".ico": "image/x-icon" };

const server = http.createServer((request, response) => {
  const url = decodeURIComponent(new URL(request.url, "http://x").pathname);
  let file = path.join(root, url);
  if (!file.startsWith(root)) {
    response.writeHead(403).end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const chromePath = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", path.join(process.env.LOCALAPPDATA ?? "", "Google/Chrome/Application/chrome.exe")].find((candidate) => candidate && fs.existsSync(candidate));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "caflow-showcase-"));
const chrome = spawn(chromePath, ["--headless=new", `--user-data-dir=${profile}`, "--remote-debugging-port=0", "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--hide-scrollbars", "--mute-audio", "--ignore-gpu-blocklist", "--use-angle=d3d11", "--enable-gpu-rasterization", `--window-size=${W},${H}`, "about:blank"], { stdio: "ignore", windowsHide: true });
const stopChrome = () => {
  if (chrome.exitCode != null) return;
  try {
    execFileSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" });
  } catch {
    chrome.kill();
  }
};

const virtualTime = `(() => {
  const start = Date.now();
  let now = 0;
  let rafs = new Map();
  let rafId = 0;
  let timerId = 0;
  const timers = new Map();
  performance.now = () => now;
  Date.now = () => start + now;
  window.requestAnimationFrame = (callback) => { rafId += 1; rafs.set(rafId, callback); return rafId; };
  window.cancelAnimationFrame = (id) => { rafs.delete(id); };
  window.setTimeout = (callback, ms = 0, ...rest) => { timerId += 1; timers.set(timerId, { due: now + Math.max(0, Number(ms) || 0), callback, rest, every: 0 }); return timerId; };
  window.clearTimeout = (id) => { timers.delete(id); };
  window.setInterval = (callback, ms = 0, ...rest) => { timerId += 1; const every = Math.max(1, Number(ms) || 1); timers.set(timerId, { due: now + every, callback, rest, every }); return timerId; };
  window.clearInterval = (id) => { timers.delete(id); };
  window.__vt = {
    step(ms) {
      const end = now + ms;
      for (;;) {
        let next = null;
        for (const entry of timers) if (entry[1].due <= end && (!next || entry[1].due < next[1].due)) next = entry;
        if (!next) break;
        const [id, timer] = next;
        if (timer.every) timer.due += timer.every; else timers.delete(id);
        now = Math.max(now, timer.due - (timer.every || 0));
        try { if (typeof timer.callback === "function") timer.callback(...timer.rest); } catch (error) { console.error(error); }
      }
      now = end;
      const callbacks = [...rafs.values()];
      rafs = new Map();
      for (const callback of callbacks) { try { callback(now); } catch (error) { console.error(error); } }
      return now;
    },
  };
})();`;

const privacy = `document.addEventListener("DOMContentLoaded", () => {
  const style = document.createElement("style");
  style.textContent = "[data-contact-name] { filter: blur(16px); } [data-contact-row] a span, [data-contact-row] a[href^='mailto'] { filter: blur(10px); } [data-contact-back] svg { filter: blur(14px); }";
  document.head.append(style);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const hits = [];
  while (walker.nextNode()) if (/Quốc/.test(walker.currentNode.nodeValue.normalize("NFC"))) hits.push(walker.currentNode);
  for (const node of hits) {
    const parts = node.nodeValue.normalize("NFC").split(/(Quốc)/);
    const fragment = document.createDocumentFragment();
    for (const part of parts) {
      if (part === "Quốc") {
        const veil = document.createElement("span");
        veil.textContent = part;
        veil.style.filter = "blur(9px)";
        veil.style.display = "inline-block";
        fragment.append(veil);
      } else if (part) fragment.append(part);
    }
    node.replaceWith(fragment);
  }
});`;

let ws;
let sessionId;
const pending = new Map();
let messageId = 0;
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    messageId += 1;
    pending.set(messageId, (message) => (message.error ? reject(new Error(`${method}: ${message.error.message}`)) : resolve(message.result)));
    ws.send(JSON.stringify({ id: messageId, method, params, sessionId }));
  });
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;

const state = { y: 0, x: W * 0.82, cy: H * 0.86, down: false, shown: false, frames: 0, appliedY: -1 };
let encoder;

async function frame() {
  const snapped = Math.round(state.y * SCALE) / SCALE;
  if (snapped !== state.appliedY) {
    state.appliedY = snapped;
    await evaluate(`window.__lenis ? window.__lenis.scrollTo(${state.appliedY}, { immediate: true, force: true }) : window.scrollTo(0, ${state.appliedY}); 1`);
  }
  if (state.shown) await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: state.x, y: state.cy, button: state.down ? "left" : "none", buttons: state.down ? 1 : 0 });
  await evaluate(`window.__vt.step(${STEP})`);
  const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 93, optimizeForSpeed: true });
  const ok = encoder.stdin.write(Buffer.from(shot.data, "base64"));
  if (!ok) await new Promise((resolve) => encoder.stdin.once("drain", resolve));
  state.frames += 1;
  if (state.frames % 120 === 0) process.stdout.write(`  ${(state.frames / FPS).toFixed(0)}s\n`);
}

const ease = {
  inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2),
  out: (p) => 1 - (1 - p) ** 3,
  line: (p) => p,
  smooth: (p) => p * p * (3 - 2 * p),
};

async function place(target) {
  if (typeof target === "string") {
    const box = await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(target)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    if (!box) throw new Error(`no element ${target}`);
    return box;
  }
  return target;
}

async function scrollY(target) {
  if (typeof target === "number") return target;
  return evaluate(`(() => { ${target} })()`);
}

const spacerTop = (id) => `const s = document.getElementById("${id}"); const a = s.parentElement.classList.contains("pin-spacer") ? s.parentElement : s; return a.getBoundingClientRect().top + window.scrollY`;
const pinAt = (id, share) => `const s = document.getElementById("${id}"); const a = s.parentElement.classList.contains("pin-spacer") ? s.parentElement : s; const top = a.getBoundingClientRect().top + window.scrollY; return top + (a.offsetHeight - innerHeight) * ${share}`;
const topOf = (id, offset = 0) => `return document.getElementById("${id}").getBoundingClientRect().top + window.scrollY + ${offset}`;

async function move({ scroll, cursor, seconds, curve = ease.inOut, path: route }) {
  const y0 = state.y;
  const y1 = scroll === undefined ? y0 : await scrollY(scroll);
  const x0 = state.x;
  const c0 = state.cy;
  let goal = cursor === undefined ? { x: x0, y: c0 } : await place(cursor);
  if (cursor !== undefined) state.shown = true;
  const count = Math.max(1, Math.round(seconds * FPS));
  for (let index = 1; index <= count; index += 1) {
    const p = curve(index / count);
    if (typeof cursor === "string" && (index % 6 === 0 || index >= count - 2)) goal = await place(cursor);
    state.y = y0 + (y1 - y0) * p;
    if (route) {
      const point = route(index / count);
      state.x = point.x;
      state.cy = point.y;
    } else {
      state.x = x0 + (goal.x - x0) * p;
      state.cy = c0 + (goal.y - c0) * p;
    }
    await frame();
    if (limit && state.frames >= limit * FPS) throw new Error("limit");
  }
}

const hold = (seconds) => move({ seconds, curve: ease.line });

async function click() {
  if (process.env.SHOWCASE_DEBUG) console.log("click", Math.round(state.x), Math.round(state.cy), await evaluate(`(() => { const e = document.elementFromPoint(${state.x}, ${state.cy}); return e ? e.tagName + "." + String(e.className).slice(0, 40) : "none"; })()`));
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: state.x, y: state.cy, button: "left", buttons: 1, clickCount: 1 });
  await frame();
  await frame();
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: state.x, y: state.cy, button: "left", buttons: 0, clickCount: 1 });
  await frame();
}

async function press(down) {
  state.down = down;
  await send("Input.dispatchMouseEvent", { type: down ? "mousePressed" : "mouseReleased", x: state.x, y: state.cy, button: "left", buttons: down ? 1 : 0, clickCount: 1 });
  await frame();
}

const chapters = [
  ["hero", async () => {
    await hold(2.6);
    await move({ cursor: { x: W * 0.66, y: H * 0.5 }, seconds: 1.3, curve: ease.out });
    const cx = W * 0.62;
    const cy = H * 0.5;
    await move({ seconds: 2.2, path: (p) => ({ x: cx + Math.cos(p * Math.PI * 2.2) * 150 * (1 - p * 0.4), y: cy + Math.sin(p * Math.PI * 2.2) * 110 * (1 - p * 0.4) }) });
    await move({ cursor: "#top .btn-ember", seconds: 0.9 });
    await hold(0.7);
  }],
  ["problem", async () => {
    await move({ scroll: spacerTop("problem"), cursor: { x: W * 0.84, y: H * 0.7 }, seconds: 1.3 });
    await move({ scroll: pinAt("problem", 1), seconds: 4.6, curve: ease.smooth });
  }],
  ["loop", async () => {
    await move({ scroll: spacerTop("loop"), seconds: 1.2 });
    await move({ cursor: '[data-loop-pick="1"]', seconds: 0.8 });
    await click();
    await move({ scroll: pinAt("loop", 1), cursor: { x: W * 0.9, y: H * 0.55 }, seconds: 7, curve: ease.smooth });
  }],
  ["live", async () => {
    await move({ scroll: spacerTop("live"), seconds: 1.1 });
    await move({ scroll: pinAt("live", 0.82), seconds: 4, curve: ease.smooth });
    await move({ cursor: '[data-live-branch="1"] [data-live-toggle]', seconds: 0.9 });
    await click();
    await hold(1.6);
  }],
  ["trust", async () => {
    await move({ scroll: topOf("trust", 330), cursor: { x: W * 0.5, y: H * 0.85 }, seconds: 1.5 });
    await move({ cursor: "[data-checkin-button]", seconds: 0.8 });
    await click();
    await hold(1.8);
  }],
  ["try", async () => {
    await move({ scroll: spacerTop("try"), seconds: 1.3 });
    await move({ cursor: "[data-deck-pile] article:last-of-type", seconds: 0.8 });
    await press(true);
    const sx = state.x;
    const sy = state.cy;
    await move({ seconds: 0.7, path: (p) => ({ x: sx + ease.inOut(p) * 280, y: sy - Math.sin(p * Math.PI) * 30 }) });
    await press(false);
    await hold(1.1);
    await move({ scroll: pinAt("try", 1 / 3), cursor: { x: W * 0.5, y: H * 0.9 }, seconds: 1.6 });
    await move({ cursor: '.shift-cell[data-key="2-0"]', seconds: 0.8 });
    await click();
    await hold(1.2);
    await move({ scroll: pinAt("try", 2 / 3), cursor: { x: W * 0.5, y: H * 0.9 }, seconds: 1.6 });
    await move({ cursor: "[data-add]", seconds: 0.7 });
    await click();
    await move({ cursor: "[data-post]", seconds: 0.5 });
    await click();
    await hold(1.4);
    await move({ scroll: pinAt("try", 1), cursor: { x: W * 0.8, y: H * 0.8 }, seconds: 1.8 });
    await hold(0.8);
  }],
  ["questions", async () => {
    await move({ scroll: topOf("questions", -40), seconds: 1.5 });
    await move({ cursor: "[data-faq]:nth-of-type(2) summary", seconds: 0.8 });
    await click();
    await hold(1.6);
  }],
  ["contact", async () => {
    await move({ scroll: topOf("contact", -60), cursor: { x: W * 0.5, y: H * 0.45 }, seconds: 1.8 });
    await hold(1.8);
    await move({ scroll: topOf("contact", 520), seconds: 1.8 });
    await move({ cursor: "[data-contact-front]", seconds: 0.9 });
    const fx = state.x;
    const fy = state.cy;
    await move({ seconds: 1.4, path: (p) => ({ x: fx + Math.sin(p * Math.PI * 2) * 140, y: fy + Math.cos(p * Math.PI * 2) * 60 - 60 }) });
    await move({ cursor: '[data-contact-turn="back"]', seconds: 0.7 });
    await click();
    await hold(2.6);
  }],
];

async function tour() {
  const from = opt("from", "hero");
  const index = Math.max(0, chapters.findIndex(([name]) => name === from));
  if (index > 0) {
    const anchor = { problem: spacerTop("problem"), loop: spacerTop("loop"), live: spacerTop("live"), trust: topOf("trust", 0), try: spacerTop("try"), questions: topOf("questions", -400), contact: topOf("contact", -400) }[from];
    state.y = await scrollY(anchor);
    await hold(1.5);
  }
  for (const [, run] of chapters.slice(index)) await run();
}

const watchdog = setTimeout(() => {
  console.error("showcase: timed out");
  stopChrome();
  process.exit(2);
}, 40 * 60 * 1000);

try {
  const portFile = path.join(profile, "DevToolsActivePort");
  let port = null;
  for (let index = 0; index < 150 && !port; index += 1) {
    await sleep(100);
    try {
      port = Number.parseInt(fs.readFileSync(portFile, "utf8"), 10) || null;
    } catch {
      port = null;
    }
  }
  if (!port) throw new Error("Chrome did not start");
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  const events = [];
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    } else events.forEach((listener) => listener(message));
  });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  ({ sessionId } = await send("Target.attachToTarget", { targetId, flatten: true }));
  await send("Page.enable");
  await send("Runtime.enable");
  events.push((message) => {
    if (message.method === "Runtime.exceptionThrown") console.error("page error:", message.params.exceptionDetails.exception?.description?.split("\n")[0]);
  });
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: SCALE, mobile: false });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: virtualTime });
  if (opt("blur", "on") !== "off") await send("Page.addScriptToEvaluateOnNewDocument", { source: privacy });
  const loaded = new Promise((resolve) => events.push((message) => message.method === "Page.loadEventFired" && resolve()));
  await send("Page.navigate", { url: `${base}${lang === "vi" ? "/vi/" : "/"}` });
  await Promise.race([loaded, sleep(20000)]);
  await evaluate("document.fonts.ready.then(() => 1)");
  await sleep(3000);
  const gpu = await evaluate(`(() => { const c = document.createElement("canvas").getContext("webgl"); if (!c) return "none"; const i = c.getExtension("WEBGL_debug_renderer_info"); return i ? c.getParameter(i.UNMASKED_RENDERER_WEBGL) : "webgl"; })()`);
  console.log(`webgl: ${gpu}`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  encoder = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const started = Date.now();
  try {
    await tour();
  } catch (error) {
    if (error.message !== "limit") throw error;
  }
  encoder.stdin.end();
  await new Promise((resolve) => encoder.on("close", resolve));
  console.log(`wrote ${out}: ${state.frames} frames, ${(state.frames / FPS).toFixed(1)} s, captured in ${((Date.now() - started) / 1000).toFixed(0)} s`);
} finally {
  clearTimeout(watchdog);
  stopChrome();
  server.close();
  try {
    fs.rmSync(profile, { recursive: true, force: true });
  } catch {
    process.exitCode = process.exitCode ?? 0;
  }
}
