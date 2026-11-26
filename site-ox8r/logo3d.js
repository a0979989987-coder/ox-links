/* OX 官網 v4 的 3D 宇宙：一張固定在背景的畫布，滑到哪一段就畫哪一個世界。
   v4 原則（永盛 11/26）：不堆方塊圓錐圓球，世界用光、細線、粒子做，每個世界只有一個主角；最重要是順。
   做法：全站只有一個動畫循環（loop.js）；開場時先把每個世界的材質準備好（不會滑到才頓一下）；
   畫面太慢就自動降解析度。
   世界：logo（開場／收尾）、天秤、K 線天際線、六角光環隧道、藍圖實驗室、四座光雕、光路（新手學院）、電影院、星座、金庫。 */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = matchMedia("(pointer: coarse)").matches || Math.min(screen.width, screen.height) < 700;
const Q = isMobile ? .6 : 1;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeIO = t => { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

const canvas = document.getElementById("world");
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false, powerPreference: "high-performance" }); }
catch (e) { document.documentElement.classList.add("no-world"); throw e; }
const PR_MAX = Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 1.75);
let PR = Math.min(PR_MAX, isMobile ? 1.2 : 1.5);
renderer.setPixelRatio(PR);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), .04).texture;
const camera = new THREE.PerspectiveCamera(50, 1, .1, 600);
const uPR = { value: PR };              // 所有粒子共用：解析度變了，粒子大小跟著變

// ---------- 共用的光、線、粒子 ----------
const hexPts = (r, rot = Math.PI / 2) => Array.from({ length: 6 }, (_, i) => [Math.cos(rot + i * Math.PI / 3) * r, Math.sin(rot + i * Math.PI / 3) * r]);
function hexFrameGeo(r, w, rot) {
  const s = new THREE.Shape(), h = new THREE.Path();
  hexPts(r, rot).forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath();
  hexPts(r - w, rot).forEach(([x, y], i) => i ? h.lineTo(x, y) : h.moveTo(x, y)); h.closePath();
  s.holes.push(h); return new THREE.ShapeGeometry(s);
}
function segs(pos, color, opacity, additive = true) {
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: true }));
}
function hexLoop(r, rot, z = 0) { const p = hexPts(r, rot), o = []; for (let i = 0; i < 6; i++) { const a = p[i], b = p[(i + 1) % 6]; o.push(a[0], a[1], z, b[0], b[1], z); } return o; }
function hexGrid(size, radius, y, color, opacity, additive = true) {
  const pos = [], n = Math.ceil(radius / size);
  for (let q = -n; q <= n; q++) for (let r = -n; r <= n; r++) {
    const x = size * 1.5 * q, z = size * Math.sqrt(3) * (r + q / 2); if (x * x + z * z > radius * radius) continue;
    const p = hexPts(size, 0);
    for (let i = 0; i < 6; i++) { const a = p[i], b = p[(i + 1) % 6]; pos.push(x + a[0], y, z + a[1], x + b[0], y, z + b[1]); }
  }
  return segs(pos, color, opacity, additive);
}
// 粒子：圓點、會微微閃，additive＝暗底發光、normal＝亮底上的金粉
const DOT_VS = `attribute float aSize; attribute float aSeed; attribute vec3 aColor; uniform float uPR, uSize, uTime; varying vec3 vC; varying float vA;
void main(){ vC=aColor; vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv;
  vA=.72+.28*sin(uTime*(1.2+aSeed*2.)+aSeed*40.); gl_PointSize=max(1., uPR*uSize*aSize*(28./max(.5,-mv.z))); }`;
const DOT_FS = `uniform float uOpacity, uAdd; varying vec3 vC; varying float vA;
void main(){ vec2 d=gl_PointCoord-.5; float r=length(d); float a=smoothstep(.5,.0,r); a=a*a*vA*uOpacity; if(a<.003) discard;
  gl_FragColor = uAdd>.5 ? vec4(vC*a, a) : vec4(vC, a); }`;
function dotMat(size, opacity, additive = true) {
  return new THREE.ShaderMaterial({ vertexShader: DOT_VS, fragmentShader: DOT_FS, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uPR, uSize: { value: size }, uTime: { value: 0 }, uOpacity: { value: opacity }, uAdd: { value: additive ? 1 : 0 } } });
}
function dots(n, gen, size = 1, opacity = 1, additive = true) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n), sd = new Float32Array(n), c = new THREE.Color();
  for (let i = 0; i < n; i++) { const o = gen(i); pos.set(o.p, i * 3); c.set(o.c ?? 0xffffff); col.set([c.r, c.g, c.b], i * 3); sz[i] = o.s ?? 1; sd[i] = rnd(); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1)); g.setAttribute("aSeed", new THREE.BufferAttribute(sd, 1));
  const p = new THREE.Points(g, dotMat(size, opacity, additive)); p.frustumCulled = false; return p;
}
// 流動的粒子：每顆在 A→B 之間沿弧線一直跑（全在顯示卡裡算，不佔手機的主執行緒）
const FLOW_VS = `attribute vec3 aA, aB, aColor; attribute float aSeed, aSize, aSpd; uniform float uPR, uSize, uTime, uSpeed; uniform vec3 uLift, uOffB; varying vec3 vC; varying float vA;
void main(){ float f=fract(uTime*uSpeed*aSpd+aSeed); vec3 b=aB+uOffB; vec3 m=(aA+b)*.5+uLift*(.6+aSeed*.8);
  vec3 p=mix(mix(aA,m,f),mix(m,b,f),f); vC=aColor; vA=smoothstep(0.,.12,f)*smoothstep(1.,.82,f);
  vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=max(1., uPR*uSize*aSize*(28./max(.5,-mv.z))); }`;
function flow(n, gen, size, opacity, speed, lift = [0, 0, 0], additive = true) {
  const A = new Float32Array(n * 3), B = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n), sd = new Float32Array(n), sp = new Float32Array(n), c = new THREE.Color();
  for (let i = 0; i < n; i++) { const o = gen(i); A.set(o.a, i * 3); B.set(o.b, i * 3); c.set(o.c ?? 0xffffff); col.set([c.r, c.g, c.b], i * 3); sz[i] = o.s ?? 1; sd[i] = rnd(); sp[i] = .6 + rnd() * .8; }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(A.slice(), 3)); g.setAttribute("aA", new THREE.BufferAttribute(A, 3)); g.setAttribute("aB", new THREE.BufferAttribute(B, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3)); g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1)); g.setAttribute("aSeed", new THREE.BufferAttribute(sd, 1)); g.setAttribute("aSpd", new THREE.BufferAttribute(sp, 1));
  const m = new THREE.ShaderMaterial({ vertexShader: FLOW_VS, fragmentShader: DOT_FS, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uPR, uSize: { value: size }, uTime: { value: 0 }, uSpeed: { value: speed }, uOpacity: { value: opacity }, uAdd: { value: additive ? 1 : 0 }, uLift: { value: new THREE.Vector3(...lift) }, uOffB: { value: new THREE.Vector3() } } });
  const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
}
// 光條：四邊都柔的一條光（天秤的橫桿、光束的邊）
function lightBar(w, h, color, opacity = 1) {
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uC: { value: new THREE.Color(color) }, uO: { value: opacity } },
    vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: "uniform vec3 uC; uniform float uO; varying vec2 vUv; void main(){ float y=1.-abs(vUv.y-.5)*2.; float x=smoothstep(0.,.06,vUv.x)*smoothstep(1.,.94,vUv.x); float a=pow(y,2.5)*x*uO; gl_FragColor=vec4(uC*a,a); }" });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}
let _glowTex;
function glowTex() {
  if (_glowTex) return _glowTex;
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.18, "rgba(255,255,255,.45)"); gr.addColorStop(.5, "rgba(255,255,255,.08)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); _glowTex = new THREE.CanvasTexture(c); return _glowTex;
}
function glow(color, size, opacity = 1, additive = true) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity, depthWrite: false, fog: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending })); s.scale.setScalar(size); return s; }
function gradTex(stops) {
  const c = document.createElement("canvas"); c.width = 4; c.height = 256; const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function beamMat(color, strength = .5) {
  return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uC: { value: new THREE.Color(color) }, uS: { value: strength } },
    vertexShader: "varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }",
    fragmentShader: "uniform vec3 uC; uniform float uS; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float edge=pow(abs(dot(vN,vV)),1.8); float fall=pow(vUv.y,1.5); gl_FragColor=vec4(uC*uS*edge*fall,1.); }" });
}
const LOGO = [
  { c: "d", d: "M534 16L503 8L476 8L461 11L434 22L93 221L78 232L64 246L57 255L45 277L38 301L36 332L36 663L41 693L53 719L74 745L93 759L180 812L190 812L196 809L202 802L207 788L207 557L211 532L216 515L232 481L251 454L272 431L326 378L361 353L394 337L432 326L468 322L501 324L524 329L545 337L564 347L582 360L619 397L634 405L647 408L668 407L690 398L703 388L711 379L722 359L727 335L727 187L724 163L715 140L701 120L687 107L584 44Z" },
  { c: "b", d: "M800 168L789 168L782 172L774 185L772 196L773 399L770 428L762 458L746 494L729 521L680 576L652 602L625 622L590 641L556 652L518 657L481 655L459 650L433 640L410 627L398 618L371 590L362 583L351 577L338 573L312 574L291 583L277 594L269 603L259 621L253 644L253 796L257 816L266 838L278 855L298 873L444 961L460 967L480 971L512 969L536 961L885 760L903 747L912 738L925 721L934 704L940 686L943 663L943 317L941 299L936 281L928 264L919 250L905 234L887 220Z" }
];
function logoShape(d, scale = 2) {
  const s = new THREE.Shape(); let first = true;
  for (const m of d.matchAll(/([ML])(\d+) (\d+)/g)) { const x = (+m[2] / 980 - .5) * scale, y = -(+m[3] / 980 - .5) * scale; if (first) { s.moveTo(x, y); first = false; } else s.lineTo(x, y); }
  s.closePath(); return s;
}
const timed = [];   // 需要每格更新 uTime 的材質
const T = m => { timed.push(m); return m; };

// ---------- 世界 ----------
const W = {};

// 開場／收尾：金屬 logo（白半亮銀、藍半藍色金屬漆）
W.logo = (() => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020306); scene.environment = envTex;
  const g = new THREE.Group(), halves = {}; scene.add(g);
  const mats = {
    d: new THREE.MeshPhysicalMaterial({ color: 0xf1f1f3, metalness: 1, roughness: .2, clearcoat: .6, clearcoatRoughness: .15, envMapIntensity: 1.25 }),
    b: new THREE.MeshPhysicalMaterial({ color: 0x23a6ea, metalness: .55, roughness: .26, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: 1.1 })
  };
  for (const { c, d } of LOGO) { const geo = new THREE.ExtrudeGeometry(logoShape(d), { depth: .2, bevelEnabled: true, bevelThickness: .035, bevelSize: .022, bevelSegments: 4, curveSegments: 1 }); geo.translate(0, 0, -.1); const m = new THREE.Mesh(geo, mats[c]); g.add(m); halves[c] = m; }
  const key = new THREE.DirectionalLight(0xffd9a0, 2.2); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0x23a6ea, 30, 20); rim.position.set(3, -2, 3); scene.add(rim);
  const seam = new THREE.PointLight(0xfff1d0, 0, 6); seam.position.set(0, 0, 1.2); scene.add(seam);
  const stars = dots(Math.round(900 * Q), () => { const v = new THREE.Vector3().randomDirection().multiplyScalar(30 + rnd() * 40); return { p: [v.x, v.y, v.z], c: 0xbfc7d6, s: .6 + rnd() * .9 }; }, 1.6, .8);
  T(stars.material); scene.add(stars);
  scene.add(hexGrid(.9, 22, -2.2, 0x6f7fa0, .14));
  function update({ mode, t, p, time }) {
    let open, rotY, camZ, flash = 0;
    if (mode === "intro") { const a = easeIO(t / 1.1); open = 1 - a; flash = Math.max(0, 1 - Math.abs(t - 1.15) / .25); rotY = (1 - a) * -1.2 + smooth((t - 1.3) / 1.1) * .6; camZ = lerp(4.2, 9, smooth((t - 1.4) / 1)); }
    else { open = 1 - easeIO(p / .6); rotY = Math.sin(time * .4) * .35 + (1 - p) * .8; camZ = lerp(10, camera.aspect < 1 ? 7.4 : 5.6, ease(p)); flash = Math.max(0, 1 - Math.abs(p - .62) / .1) * .8; }
    const lookY = mode === "intro" ? 0 : -.75 * smooth(p / .5) - clamp((p - .7) / .3, 0, 1) * 2 * camZ * Math.tan(22.5 * Math.PI / 180);
    halves.d.position.set(-open * 2.6, open * 1.6, -open * 1.5); halves.d.rotation.set(open * .6, open * -1.1, open * .4);
    halves.b.position.set(open * 2.6, -open * 1.6, -open * 1.5); halves.b.rotation.set(-open * .5, open * 1.1, -open * .3);
    g.rotation.y = rotY; g.rotation.x = Math.sin(time * .5) * .08; seam.intensity = flash * 40; stars.rotation.y = time * .01;
    camera.fov = 45; camera.position.set(0, .2 + lookY, camZ); camera.lookAt(0, lookY, 0);
  }
  return { scene, update };
})();

// ---------- 排程：v5 起這張 3D 畫布只管金屬 logo（開場和收尾）；其他世界是先渲染好的畫面，由 seq.js 播放 ----------
const outroEl = document.querySelector('[data-world="outro"]');
if (outroEl) OX.track(outroEl);
let rw = 0, rh = 0;
// iPhone 滑動時網址列收合只會讓高度變一點點：這種不重建畫布（重建一次會卡一下）
function resize() { const w = innerWidth, h = Math.max(innerHeight, document.documentElement.clientHeight); if (w === rw && Math.abs(h - rh) < 160) return; rw = w; rh = h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();
let intro = null, shown = null;
function setShown(v) { if (v !== shown) { shown = v; canvas.style.visibility = v ? "visible" : "hidden"; } }
const t0 = performance.now();
OX.add((S, now) => {
  const time = reduce ? 3 : (now - t0) / 1000;
  timed.forEach(m => m.uniforms.uTime.value = time);
  if (intro) {
    const t = (now - intro.start) / 1000; setShown(true);
    W.logo.update({ mode: "intro", t: Math.min(t, 2.4), time }); renderer.render(W.logo.scene, camera);
    if (t > 2.4 || intro.skip) { intro.done(); intro = null; }
    return;
  }
  if (!outroEl) { setShown(false); return; }
  const r = OX.rect(outroEl), mid = S.vh / 2;
  if (!(r.top <= mid && r.bottom > mid)) { setShown(false); return; }
  setShown(true);
  const p = clamp((S.vh - r.top) / (r.height + S.vh), 0, 1);
  W.logo.update({ mode: "outro", p, time }); camera.updateProjectionMatrix(); renderer.render(W.logo.scene, camera);
});
function runIntro() {
  let seen = false; try { seen = localStorage.getItem("ox-intro") === "1"; } catch (e) { }
  if (reduce || seen || location.hash || new URLSearchParams(location.search).has("nointro")) return;
  const root = document.documentElement; root.classList.add("intro");
  const skip = document.querySelector(".intro-skip");
  intro = { start: performance.now(), skip: false, done() { root.classList.add("intro-out"); setTimeout(() => root.classList.remove("intro", "intro-out"), 700); try { localStorage.setItem("ox-intro", "1"); } catch (e) { } dispatchEvent(new Event("oxintrodone")); } };
  if (skip) skip.addEventListener("click", () => { if (intro) intro.skip = true; });
}
runIntro();
