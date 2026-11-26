import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

gsap.registerPlugin(ScrollTrigger);

type Kind = "seal-particles" | "embers";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
const small = () => window.matchMedia("(max-width: 767px)").matches;
const EMBER = new THREE.Color("#ff8a5c");
const PERSIMMON = new THREE.Color("#c74118");
const WARM = new THREE.Color("#ffd2b8");

let shared: THREE.WebGLRenderer | null = null;
const running = new Set<Stage>();

function renderer() {
  if (shared) return shared;
  shared = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance", premultipliedAlpha: false });
  shared.outputColorSpace = THREE.SRGBColorSpace;
  shared.setPixelRatio(1);
  shared.setClearColor(0x000000, 0);
  shared.autoClear = false;
  return shared;
}

function grow(width: number, height: number) {
  const gl = renderer();
  const size = gl.getSize(new THREE.Vector2());
  if (width > size.x || height > size.y) gl.setSize(Math.max(width, size.x), Math.max(height, size.y), false);
}

function tick() {
  for (const stage of running) stage.frame();
}

function schedule() {
  renderer().setAnimationLoop(running.size ? tick : null);
}

class Stage {
  host: HTMLElement;
  canvas = document.createElement("canvas");
  context: CanvasRenderingContext2D | null;
  pixels = new THREE.Vector2(1, 1);
  size = new THREE.Vector2(1, 1);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  pointer = new THREE.Vector2(9, 9);
  eased = new THREE.Vector2(9, 9);
  timer = new THREE.Timer();
  update: (time: number, delta: number) => void = () => undefined;
  place: (width: number, height: number) => void = () => undefined;
  visible = false;
  ratioCap = 1.5;

  constructor(host: HTMLElement, events: HTMLElement) {
    this.host = host;
    this.context = this.canvas.getContext("2d");
    this.canvas.setAttribute("aria-hidden", "true");
    this.canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0";
    host.append(this.canvas);
    new ResizeObserver(() => this.resize()).observe(host);
    new IntersectionObserver(([entry]) => {
      this.visible = Boolean(entry?.isIntersecting);
      this.loop();
    }).observe(host);
    events.addEventListener("pointermove", (event) => {
      const box = this.host.getBoundingClientRect();
      this.pointer.set((event.clientX - box.left - box.width / 2) / 100, -(event.clientY - box.top - box.height / 2) / 100);
      if (reduced.matches) this.render();
    });
    events.addEventListener("pointerleave", () => this.pointer.set(9, 9));
    reduced.addEventListener("change", () => this.loop());
  }

  resize() {
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    const ratio = Math.min(window.devicePixelRatio, this.ratioCap);
    this.size.set(width, height);
    this.pixels.set(Math.round(width * ratio), Math.round(height * ratio));
    this.canvas.width = this.pixels.x;
    this.canvas.height = this.pixels.y;
    grow(this.pixels.x, this.pixels.y);
    this.camera.aspect = width / height;
    const half = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    this.camera.position.set(0, 0, height / 100 / 2 / half);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.place(width, height);
    this.render();
  }

  loop() {
    const live = this.visible && !reduced.matches;
    if (live) running.add(this);
    else running.delete(this);
    schedule();
    if (!live) this.render();
  }

  frame() {
    this.timer.update();
    const delta = Math.min(this.timer.getDelta(), 0.05);
    this.eased.lerp(this.pointer, 1 - Math.exp(-delta * 6));
    this.update(this.timer.getElapsed(), delta);
    this.render();
  }

  render() {
    const gl = renderer();
    const { x: width, y: height } = this.pixels;
    gl.setViewport(0, 0, width, height);
    gl.setScissor(0, 0, width, height);
    gl.setScissorTest(true);
    gl.clear();
    gl.render(this.scene, this.camera);
    gl.setScissorTest(false);
    if (!this.context) return;
    const source = gl.domElement;
    this.context.clearRect(0, 0, width, height);
    this.context.drawImage(source, 0, source.height - height, width, height, 0, 0, width, height);
  }

  reveal() {
    const fallback = this.host.querySelector<HTMLElement>("[data-three-fallback]");
    this.render();
    gsap.to(this.canvas, { opacity: 1, duration: reduced.matches ? 0 : 0.8, ease: "power2.out" });
    if (fallback) gsap.to(fallback, { opacity: 0, duration: reduced.matches ? 0 : 0.6, ease: "power2.out" });
    this.loop();
  }

  dispose() {
    running.delete(this);
    schedule();
    this.canvas.remove();
  }
}

const vertex = `
uniform float uTime;
uniform float uIntro;
uniform float uDisperse;
uniform vec2 uPointer;
uniform float uSize;
uniform float uRatio;
attribute vec3 aStart;
attribute float aSeed;
attribute float aScale;
varying float vAlpha;
varying float vMix;
void main() {
  float local = clamp((uIntro * 1.6) - aSeed * 0.6, 0.0, 1.0);
  local = 1.0 - pow(1.0 - local, 3.0);
  vec3 pos = mix(aStart, position, local);
  float phase = aSeed * 6.2831;
  pos.x += sin(uTime * 0.7 + phase) * 0.006;
  pos.y += cos(uTime * 0.9 + phase * 1.3) * 0.006;
  pos.z += sin(uTime * 0.5 + phase * 2.0) * 0.04;
  vec2 away = pos.xy - uPointer;
  float reach = 0.2;
  float push = smoothstep(reach, 0.0, length(away));
  pos.xy += normalize(away + 0.0001) * push * 0.09;
  pos.z += push * 0.15;
  pos.y += uDisperse * (0.2 + aSeed * 1.2);
  pos.x += (aSeed - 0.5) * uDisperse * 1.2;
  pos.z += uDisperse * aSeed * 0.8;
  vec4 view = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * view;
  gl_PointSize = uSize * aScale * uRatio * (26.0 / -view.z) * (1.0 + push * 1.2);
  vAlpha = (0.4 + 0.6 * local) * (1.0 - uDisperse) * (0.7 + 0.3 * sin(uTime * 1.6 + phase * 3.0));
  vMix = aSeed;
}
`;

const fragment = `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
varying float vAlpha;
varying float vMix;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.5, 0.0, d);
  float glow = pow(core, 1.5);
  vec3 color = mix(uColorA, uColorB, smoothstep(0.2, 0.9, vMix));
  color = mix(color, uColorC, glow * 0.55);
  gl_FragColor = vec4(color, glow * vAlpha);
}
`;

async function sealShapes() {
  const text = await fetch("/seal.svg").then((response) => response.text());
  return new SVGLoader().parse(text).paths.flatMap((path) => path.toShapes());
}

function samplePoints(geometry: THREE.BufferGeometry, count: number) {
  const position = geometry.attributes.position;
  const index = geometry.index;
  if (!position) return new Float32Array(0);
  const triangles: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = [];
  const areas: number[] = [];
  const vertexAt = (i: number) => new THREE.Vector3(position.getX(i), position.getY(i), 0);
  const faces = index ? index.count / 3 : position.count / 3;
  let total = 0;
  for (let face = 0; face < faces; face += 1) {
    const a = vertexAt(index ? index.getX(face * 3) : face * 3);
    const b = vertexAt(index ? index.getX(face * 3 + 1) : face * 3 + 1);
    const c = vertexAt(index ? index.getX(face * 3 + 2) : face * 3 + 2);
    const area = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).length() / 2;
    total += area;
    triangles.push([a, b, c]);
    areas.push(total);
  }
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const pick = Math.random() * total;
    let low = 0;
    let high = areas.length - 1;
    while (low < high) {
      const mid = (low + high) >> 1;
      if ((areas[mid] ?? 0) < pick) low = mid + 1;
      else high = mid;
    }
    const [a, b, c] = triangles[low] ?? triangles[0]!;
    let u = Math.random();
    let v = Math.random();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    out[i * 3] = a.x + (b.x - a.x) * u + (c.x - a.x) * v;
    out[i * 3 + 1] = a.y + (b.y - a.y) * u + (c.y - a.y) * v;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
  }
  return out;
}

async function sealParticles(stage: Stage) {
  const shapes = await sealShapes();
  const shapeGeometry = new THREE.ShapeGeometry(shapes, 10);
  shapeGeometry.computeBoundingBox();
  const box = shapeGeometry.boundingBox ?? new THREE.Box3();
  const center = box.getCenter(new THREE.Vector3());
  const span = Math.max(box.max.x - box.min.x, box.max.y - box.min.y);
  shapeGeometry.translate(-center.x, -center.y, 0);
  shapeGeometry.scale(1 / span, -1 / span, 1);
  const count = small() ? 3200 : 9000;
  const target = samplePoints(shapeGeometry, count);
  shapeGeometry.dispose();
  const start = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const scales = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const direction = new THREE.Vector3().randomDirection().multiplyScalar(4 + Math.random() * 6);
    start[i * 3] = direction.x;
    start[i * 3 + 1] = direction.y;
    start[i * 3 + 2] = direction.z;
    seeds[i] = Math.random();
    scales[i] = 0.5 + Math.random() ** 3 * 2.6;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(target, 3));
  geometry.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  const uniforms = {
    uTime: { value: 0 },
    uIntro: { value: reduced.matches ? 1 : 0 },
    uDisperse: { value: 0 },
    uPointer: { value: new THREE.Vector2(9, 9) },
    uSize: { value: 3.2 },
    uRatio: { value: Math.min(window.devicePixelRatio, stage.ratioCap) },
    uColorA: { value: EMBER },
    uColorB: { value: PERSIMMON },
    uColorC: { value: WARM },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geometry, material);
  points.rotation.z = THREE.MathUtils.degToRad(-4);
  points.frustumCulled = false;
  stage.scene.add(points);
  stage.place = (width, height) => {
    const narrow = width < 768;
    const sizePx = narrow ? Math.min(width * 0.78, 380) : Math.min(Math.min(width, height) * 0.62, 620);
    points.scale.setScalar(sizePx / 100);
    points.position.set(narrow ? width * 0.18 / 100 : (0.62 - 0.5) * (width / 100), (narrow ? 0.16 : 0.04) * (height / 100), 0);
    uniforms.uRatio.value = Math.min(window.devicePixelRatio, stage.ratioCap);
  };
  const local = new THREE.Vector2();
  stage.update = (time) => {
    uniforms.uTime.value = time;
    const scale = points.scale.x || 1;
    local.set((stage.eased.x - points.position.x) / scale, (stage.eased.y - points.position.y) / scale);
    uniforms.uPointer.value.copy(local.rotateAround(new THREE.Vector2(), -points.rotation.z));
    points.rotation.y = Math.sin(time * 0.25) * 0.12 + stage.eased.x * 0.01;
    points.rotation.x = Math.cos(time * 0.2) * 0.06;
  };
  const section = stage.host.closest("section");
  if (section && !reduced.matches) {
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        uniforms.uDisperse.value = self.progress;
      },
    });
  }
  stage.resize();
  stage.reveal();
  if (!reduced.matches) gsap.to(uniforms.uIntro, { value: 1, duration: 2.6, ease: "power2.out" });
  requestAnimationFrame(() => window.dispatchEvent(new Event("caflow:scene-ready")));
}

const emberVertex = `
uniform float uTime;
uniform vec2 uArea;
uniform float uRatio;
attribute float aSeed;
attribute float aSpeed;
varying float vAlpha;
void main() {
  float h = uArea.y;
  float y = mod(position.y + uTime * aSpeed, h) - h * 0.5;
  float x = position.x + sin(uTime * 0.6 + aSeed * 20.0) * 0.35;
  vec4 view = modelViewMatrix * vec4(x, y, position.z, 1.0);
  gl_Position = projectionMatrix * view;
  float rise = (y + h * 0.5) / h;
  vAlpha = smoothstep(0.0, 0.15, rise) * (1.0 - smoothstep(0.55, 1.0, rise)) * (0.5 + 0.5 * sin(uTime * 3.0 + aSeed * 40.0));
  gl_PointSize = (2.0 + aSeed * 6.0) * uRatio * (24.0 / -view.z);
}
`;

const emberFragment = `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float glow = pow(smoothstep(0.5, 0.0, d), 2.0);
  gl_FragColor = vec4(uColor, glow * vAlpha);
}
`;

async function embers(stage: Stage) {
  stage.ratioCap = 1;
  const count = small() ? 400 : 1200;
  const position = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    position[i * 3] = (Math.random() - 0.5) * 30;
    position[i * 3 + 1] = Math.random() * 20;
    position[i * 3 + 2] = (Math.random() - 0.5) * 4;
    seeds[i] = Math.random();
    speeds[i] = 0.25 + Math.random() * 0.9;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  const uniforms = { uTime: { value: 0 }, uArea: { value: new THREE.Vector2(30, 20) }, uRatio: { value: 1 }, uColor: { value: EMBER } };
  const material = new THREE.ShaderMaterial({ vertexShader: emberVertex, fragmentShader: emberFragment, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  stage.scene.add(points);
  stage.place = (width, height) => {
    uniforms.uArea.value.set(width / 100, height / 100);
    points.scale.set(width / 100 / 30, 1, 1);
    uniforms.uRatio.value = Math.min(window.devicePixelRatio, stage.ratioCap);
  };
  stage.update = (time) => {
    uniforms.uTime.value = time + 40;
  };
  stage.update(0, 0);
  stage.resize();
  stage.reveal();
}

function webgl() {
  try {
    renderer();
    return true;
  } catch {
    return false;
  }
}

async function mount(host: HTMLElement) {
  const kind = host.dataset.three as Kind;
  const events = (host.closest("section") as HTMLElement | null) ?? host;
  const stage = new Stage(host, events);
  try {
    if (kind === "seal-particles") await sealParticles(stage);
    else if (kind === "embers") await embers(stage);
  } catch {
    stage.dispose();
    if (kind === "seal-particles") window.dispatchEvent(new Event("caflow:scene-ready"));
  }
}

export function mountAll() {
  if (!webgl()) {
    window.dispatchEvent(new Event("caflow:scene-ready"));
    return;
  }
  const watcher = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      watcher.unobserve(entry.target);
      void mount(entry.target as HTMLElement);
    }
  }, { rootMargin: "600px 0px" });
  for (const host of document.querySelectorAll<HTMLElement>("[data-three]")) watcher.observe(host);
}
