import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : fallback;
};
const DURATION = Number(opt("seconds", "64"));
const out = path.resolve(opt("out", path.resolve(here, "../showcase/soundtrack.wav")));
const SR = 44100;
const N = Math.round(SR * DURATION);
const L = new Float32Array(N);
const R = new Float32Array(N);
const TAU = Math.PI * 2;
const BEAT = 0.5;
const BAR = 2;
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
let seed = 7654321;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 31 - 1;
};

function add(t0, seconds, gain, pan, fn) {
  const start = Math.round(t0 * SR);
  const length = Math.round(seconds * SR);
  const left = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const right = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < length; i += 1) {
    const n = start + i;
    if (n < 0 || n >= N) continue;
    const v = fn(i / SR);
    L[n] += v * left;
    R[n] += v * right;
  }
}

const pluck = (t0, midi, gain, pan = 0) => {
  const f = hz(midi);
  add(t0, 1.2, gain, pan, (t) => Math.min(1, t / 0.004) * Math.exp(-t * 4.2) * (Math.sin(TAU * f * t) + 0.45 * Math.exp(-t * 7) * Math.sin(TAU * 2 * f * t) + 0.18 * Math.sin(TAU * 3 * f * t)));
};
const pad = (t0, seconds, midis, gain) => {
  midis.forEach((midi, k) => {
    const f = hz(midi);
    add(t0, seconds + 0.6, gain, k === 0 ? -0.4 : k === 1 ? 0.4 : 0, (t) => {
      const env = Math.min(1, t / 0.35) * Math.min(1, Math.max(0, (seconds + 0.6 - t) / 0.6));
      return (env * (Math.sin(TAU * f * 0.996 * t) + Math.sin(TAU * f * 1.004 * t) + 0.25 * Math.sin(TAU * 2 * f * t))) / 2.25;
    });
  });
};
const bass = (t0, midi, seconds, gain) => {
  const f = hz(midi);
  add(t0, seconds, gain, 0, (t) => Math.min(1, t / 0.01) * Math.exp(-t * 2.2) * Math.min(1, (seconds - t) / 0.05) * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t)));
};
const kick = (t0, gain) => {
  let phase = 0;
  add(t0, 0.35, gain, 0, (t) => {
    phase += (TAU * (45 + 95 * Math.exp(-t * 28))) / SR;
    return Math.sin(phase) * Math.exp(-t * 9);
  });
};
const hat = (t0, gain, pan = 0.25) => {
  let previous = 0;
  add(t0, 0.08, gain, pan, (t) => {
    const x = noise();
    const y = x - previous;
    previous = x;
    return y * Math.exp(-t * 70);
  });
};
const clap = (t0, gain) => {
  let low = 0;
  add(t0, 0.25, gain, -0.1, (t) => {
    const bursts = (t < 0.012 ? 1 : 0) + (t > 0.014 && t < 0.024 ? 1 : 0) + (t > 0.026 ? Math.exp(-(t - 0.026) * 22) : 0);
    const x = noise();
    low += 0.35 * (x - low);
    return (x - low) * bursts;
  });
};
const whoosh = (t0, seconds, gain, pan = 0) => {
  let low = 0;
  add(t0, seconds, gain, pan, (t) => {
    const p = t / seconds;
    low += (0.03 + 0.25 * Math.sin(Math.PI * p)) * (noise() - low);
    return low * Math.sin(Math.PI * Math.min(1, p)) ** 1.6 * 3;
  });
};
const tap = (t0, gain) => add(t0, 0.06, gain, 0.1, (t) => Math.exp(-t * 120) * (0.7 * Math.sin(TAU * 1900 * t) + 0.5 * noise()));
const pop = (t0, gain, pan = 0.3) => {
  let phase = 0;
  add(t0, 0.14, gain, pan, (t) => {
    phase += (TAU * (900 - 450 * Math.min(1, t / 0.06))) / SR;
    return Math.sin(phase) * Math.exp(-t * 32);
  });
};
const shutter = (t0, gain) => {
  for (const dt of [0, 0.055]) {
    let low = 0;
    add(t0 + dt, 0.07, gain, -0.3, (t) => {
      const x = noise();
      low += 0.5 * (x - low);
      return (x * 0.6 + Math.sin(TAU * 3200 * t) * 0.4) * Math.exp(-t * 85) - low * 0.2;
    });
  }
};
const chime = (t0, midis, gain, pan = 0) => {
  midis.forEach((midi, i) => {
    const f = hz(midi);
    add(t0 + i * 0.07, 1.6, gain, pan + (i % 2 ? 0.2 : -0.2), (t) => Math.min(1, t / 0.003) * Math.exp(-t * 3.2) * (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * 2.01 * f * t) + 0.12 * Math.sin(TAU * 3.98 * f * t)));
  });
};

const CHORDS = [
  { pad: [65, 69, 72], arp: [65, 69, 72, 77], root: 41 },
  { pad: [64, 67, 72], arp: [64, 67, 72, 76], root: 36 },
  { pad: [65, 69, 74], arp: [62, 65, 69, 74], root: 38 },
  { pad: [65, 70, 74], arp: [62, 65, 70, 74], root: 34 },
];
const ARP = [0, 1, 2, 1, 3, 2, 1, 2];
const END = DURATION - 3;
const DRUMS_IN = 2.5;
const BREAK = [[22.5, 24.5]];
const inBreak = (t) => BREAK.some(([a, b]) => t >= a && t < b);
for (let bar = 0; bar * BAR < END; bar += 1) {
  const t = bar * BAR;
  const chord = CHORDS[bar % 4];
  pad(t, BAR, chord.pad, 0.07);
  ARP.forEach((index, k) => {
    const tt = t + (k * BEAT) / 2;
    if (tt < END) pluck(tt, chord.arp[index] + 12, k % 2 ? 0.04 : 0.055, k % 2 ? 0.35 : -0.35);
  });
  for (let b = 0; b < 4; b += 1) {
    const tb = t + b * BEAT;
    if (tb < DRUMS_IN || tb >= END || inBreak(tb)) continue;
    kick(tb, 0.3);
    hat(tb + BEAT / 2, 0.045);
    if (tb >= 9 && (b === 1 || b === 3)) clap(tb, 0.1);
    bass(tb, chord.root, BEAT * 0.9, 0.2);
  }
}
pad(END, 3, [65, 69, 72, 77], 0.08);
[65, 69, 72, 77, 81].forEach((midi, i) => pluck(END + i * 0.12, midi + 12, 0.055, i % 2 ? 0.3 : -0.3));
bass(END, 41, 2.5, 0.22);
kick(END, 0.32);

const cues = {
  whoosh: [7.7, 13.6, 22.65, 30.3, 34.45, 50.43, 52.88, 61.28],
  tap: [15.6, 28.65, 40.78, 44.33, 44.88, 51.23, 61.28],
  pop: [40.8, 44.9],
  shutter: [32.6],
  chime: [37.3, 15.65 + 6.2],
};
cues.whoosh.forEach((t, i) => whoosh(t - 0.15, 0.9, 0.16, i % 2 ? 0.3 : -0.3));
cues.tap.forEach((t) => tap(t, 0.22));
cues.pop.forEach((t) => pop(t + 0.05, 0.22));
cues.shutter.forEach((t) => shutter(t + 0.12, 0.3));
cues.chime.forEach((t) => chime(t, [77, 81, 84], 0.07, 0.1));

const FADE_IN = 0.4;
const FADE_OUT = 1.5;
let peak = 0;
for (let n = 0; n < N; n += 1) {
  const t = n / SR;
  const env = Math.min(1, t / FADE_IN) * Math.min(1, (DURATION - t) / FADE_OUT);
  L[n] = Math.tanh(L[n] * env * 1.1);
  R[n] = Math.tanh(R[n] * env * 1.1);
  peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
}
const gain = peak > 0 ? 0.89 / peak : 1;
const data = Buffer.alloc(N * 4);
for (let n = 0; n < N; n += 1) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * gain)) * 32767), n * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[n] * gain)) * 32767), n * 4 + 2);
}
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, Buffer.concat([header, data]));
console.log(`wrote ${out} (${DURATION} s)`);
