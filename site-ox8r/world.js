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

// 天秤：左邊青色粒子（買方）、右邊桃紅粒子（賣方）各自流進一個六角秤盤；中間一根光做的橫桿，滑動時倒向一邊
W.balance = (() => {
  const scene = new THREE.Scene(); scene.background = gradTex([[0, "#03050c"], [.6, "#060a1a"], [1, "#04060f"]]); scene.fog = new THREE.FogExp2(0x04060f, .04);
  scene.add(hexGrid(1.2, 42, -3.2, 0x2c3a66, .28));
  const post = segs([0, -3.2, 0, 0, 1.2, 0], 0xf6ecd2, .55); scene.add(post);
  const postGlow = lightBar(4.4, .5, 0xffe9c0, .25); postGlow.position.y = -1; postGlow.rotation.z = Math.PI / 2; scene.add(postGlow);
  const beam = new THREE.Group(); beam.position.y = 1.2; scene.add(beam);
  const bar = lightBar(7.6, .22, 0xfff1d0, 1.1); beam.add(bar);
  beam.add(segs([-3.7, 0, 0, 3.7, 0, 0], 0xffffff, .9));
  const pivot = glow(0xfff1d0, .7, .9); beam.add(pivot);
  const pans = [-3.5, 3.5].map((x, i) => {
    const col = i ? 0xff3078 : 0x00b8d4, g = new THREE.Group(); g.position.x = x; beam.add(g);
    g.add(segs([0, 0, 0, -.8, -1.6, 0, 0, 0, 0, .8, -1.6, 0, 0, 0, 0, 0, -1.6, .8], 0xd8dce6, .35));
    const ring = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(hexLoop(.95, 0), 3)), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: .95, blending: THREE.AdditiveBlending }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = -1.6; g.add(ring);
    const ring2 = ring.clone(); ring2.scale.setScalar(.7); ring2.material = ring.material.clone(); ring2.material.opacity = .4; g.add(ring2);
    const gl = glow(col, 2.2, .35); gl.position.y = -1.6; g.add(gl);
    return g;
  });
  const N = Math.round(1500 * Q);
  const mk = (side, col) => flow(N, () => {
    const a = rnd() * Math.PI * 2, r = 4 + rnd() * 9;
    return { a: [side * (7 + rnd() * 10), Math.sin(a) * r * .5, Math.cos(a) * r - 4], b: [side * 3.5 + (rnd() - .5) * 1.2, -.4 + (rnd() - .5) * .25, (rnd() - .5) * 1.2], c: col, s: .7 + rnd() * .8 };
  }, 1.3, .9, .045, [0, 2.2, 0]);
  const L = mk(-1, 0x00b8d4), R = mk(1, 0xff3078); scene.add(L, R); T(L.material); T(R.material);
  const dust = dots(Math.round(500 * Q), () => ({ p: [(rnd() - .5) * 40, (rnd() - .3) * 14, -rnd() * 30], c: rnd() < .5 ? 0x8fdcef : 0xffb3cc, s: .5 + rnd() * .6 }), 1, .5); T(dust.material); scene.add(dust);
  const v = new THREE.Vector3();
  function update({ p, time }) {
    const tilt = Math.sin(p * Math.PI * 2.2 - .4) * .2 + Math.sin(time * .7) * .015;
    beam.rotation.z = tilt; pans.forEach(g => g.rotation.z = -tilt);
    // 粒子的終點跟著秤盤走
    L.material.uniforms.uOffB.value.set(0, -Math.sin(tilt) * 3.5, 0);
    R.material.uniforms.uOffB.value.set(0, Math.sin(tilt) * 3.5, 0);
    const a = -.35 + p * .7 + Math.sin(time * .1) * .05, d = camera.aspect < 1 ? 14 : 11;
    camera.fov = 55; camera.position.set(Math.sin(a) * d, 1.4 + p * 1.5, Math.cos(a) * d); camera.lookAt(0, .2, 0);
  }
  return { scene, update };
})();

// OX 台股：金色晨光裡一層層 K 線天際線（每根是一片光影剪影，越遠越淡），鏡頭慢慢往前推，盡頭一道金色六角門
W.city = (() => {
  const scene = new THREE.Scene(); scene.background = gradTex([[0, "#ead6ad"], [.42, "#f6ead2"], [.56, "#fbf5ea"], [1, "#efe2c6"]]);
  scene.fog = new THREE.Fog(0xf8efdf, 12, 120);
  const sun = glow(0xfff1d2, 70, .85, false); sun.position.set(6, 9, -112); scene.add(sun);
  const sunCore = glow(0xffffff, 16, .9, false); sunCore.position.set(6, 9, -111); scene.add(sunCore);
  // 地面：細細的金線格往地平線收
  const gp = [];
  for (let z = 12; z >= -120; z -= 3.2) gp.push(-90, 0, z, 90, 0, z);
  for (let x = -90; x <= 90; x += 3.2) gp.push(x, 0, 12, x * 1.0, 0, -120);
  scene.add(segs(gp, 0xb08a3c, .22, false));
  const layers = [[-14, .9, 1], [-26, .75, .8], [-40, .6, .62], [-58, .48, .45], [-82, .4, .3]];
  const bodyGeo = new THREE.PlaneGeometry(1, 1), mat = new THREE.MeshBasicMaterial({ fog: true });
  const list = [];
  layers.forEach(([z, w, near], li) => {
    let price = 5 + rnd() * 4; const span = 46 + li * 14;
    for (let x = -span; x <= span; x += 1.9 + li * .35) {
      const o = price, ch = (rnd() - .48) * 2.6; price = clamp(price + ch, 1.5, 15 + li * 2);
      const kind = li === 0 && rnd() < .3 ? (ch >= 0 ? "up" : "dn") : "base";
      list.push({ x: x + (rnd() - .5) * .5, z: z + (rnd() - .5) * 2, lo: Math.min(o, price), hi: Math.max(o, price) + .8, w: w * 1.4, kind, near, li });
    }
  });
  const body = new THREE.InstancedMesh(bodyGeo, mat, list.length), wick = new THREE.InstancedMesh(bodyGeo, mat, list.length);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), cBase = [new THREE.Color(0xe9d3a0), new THREE.Color(0xd9be82), new THREE.Color(0xf3e4c2)];
  list.forEach((b, i) => {
    const h = b.hi; M.compose(new THREE.Vector3(b.x, h / 2, b.z), q, new THREE.Vector3(b.w, h, 1)); body.setMatrixAt(i, M);
    if (b.kind === "up") col.set(0xd98572); else if (b.kind === "dn") col.set(0x7fb69b); else col.copy(cBase[(i * 7) % 3]).multiplyScalar(.86 + b.near * .1);
    body.setColorAt(i, col);
    const wh = 1.2 + rnd() * 2.2; M.compose(new THREE.Vector3(b.x, h + wh / 2, b.z), q, new THREE.Vector3(.09, wh, 1)); wick.setMatrixAt(i, M); wick.setColorAt(i, col);
  });
  scene.add(body, wick);
  const portal = new THREE.Group(); portal.position.set(0, 7.5, -36); scene.add(portal);
  portal.add(segs(hexLoop(6.2, Math.PI / 2), 0xb8913f, .95, false));
  portal.add(segs(hexLoop(5.6, Math.PI / 2), 0xd6b465, .45, false));
  const pg = glow(0xfff3d6, 12, .7, false); pg.position.z = -.2; portal.add(pg);
  const dust = dots(Math.round(600 * Q), () => ({ p: [(rnd() - .5) * 50, rnd() * 16, 10 - rnd() * 90], c: rnd() < .6 ? 0xc79a3e : 0xffffff, s: .5 + rnd() * .8 }), 1.1, .55, false);
  T(dust.material); scene.add(dust);
  function update({ p, time }) {
    const z = lerp(14, -14, easeIO(p)), por = camera.aspect < 1;
    camera.fov = por ? 64 : 50; camera.position.set(Math.sin(time * .15) * .4, (por ? 6 : 4.2) + p * 2.2, z); camera.lookAt(0, 6.5 + p * 1.5, z - 40);
    portal.rotation.z = Math.sin(time * .2) * .04; dust.position.y = Math.sin(time * .3) * .25;
  }
  return { scene, update };
})();

// OX 加密：細細的六角光環一圈圈往後排，青和桃紅交替，光點往鏡頭衝
W.tunnel = (() => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020309); scene.fog = new THREE.Fog(0x020309, 4, 64);
  const N = 60, gap = 2.6, L = N * gap;
  const rings = new THREE.InstancedMesh(hexFrameGeo(5.2, .035, 0), new THREE.MeshBasicMaterial({ transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), N);
  const C = [new THREE.Color(0x00b8d4), new THREE.Color(0xff3078), new THREE.Color(0x7b8cff)];
  for (let i = 0; i < N; i++) rings.setColorAt(i, C[i % 5 === 4 ? 2 : i % 2]);
  scene.add(rings);
  const S = Math.round(1300 * Q);
  const streak = flow(S, () => { const a = rnd() * Math.PI * 2, r = 1.2 + rnd() * 3.6; return { a: [Math.cos(a) * r, Math.sin(a) * r, -L], b: [Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1, 4], c: rnd() < .5 ? 0x5fe2f5 : 0xff6fa3, s: .5 + rnd() * .8 }; }, 1.1, .9, .09);
  T(streak.material); scene.add(streak);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3();
  function update({ p, time }) {
    const travel = p * 120 + time * 2.4;
    for (let i = 0; i < N; i++) { const z = -((((i * gap - travel) % L) + L) % L); e.set(0, 0, i * .07 + time * .05); q.setFromEuler(e); M.compose(pos.set(0, 0, z), q, one); rings.setMatrixAt(i, M); }
    rings.instanceMatrix.needsUpdate = true;
    camera.fov = 70; camera.position.set(Math.sin(time * .3) * .4, Math.cos(time * .23) * .3, 2); camera.lookAt(0, 0, -20); camera.rotateZ(Math.sin(p * 3) * .12);
  }
  return { scene, update };
})();

// 製作中：藍圖實驗室，細格線、線框手機和螢幕、尺寸標線，一道掃描光
W.lab = (() => {
  const scene = new THREE.Scene(); scene.background = gradTex([[0, "#03101f"], [.6, "#062039"], [1, "#03101f"]]); scene.fog = new THREE.Fog(0x041528, 8, 46);
  scene.add(hexGrid(1, 36, -2.5, 0x23a6ea, .3));
  const wp = [];
  for (let x = -30; x <= 30; x += 1.5) wp.push(x, -2.5, -14, x, 16, -14);
  for (let y = -2.5; y <= 16; y += 1.5) wp.push(-30, y, -14, 30, y, -14);
  scene.add(segs(wp, 0x23a6ea, .1));
  const lm = new THREE.LineBasicMaterial({ color: 0x8fd6ff, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false });
  const objs = [];
  const add = (geo, x, y, z, s) => { const o = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), lm); o.position.set(x, y, z); o.scale.setScalar(s); scene.add(o); objs.push(o); return o; };
  const phone = add(new THREE.BoxGeometry(1, 2.1, .08), -4.8, 1.2, -3, 1.4);
  add(new THREE.BoxGeometry(3, 1.8, .06), -7.4, 4.6, -9, 1.3);
  add(new THREE.CylinderGeometry(1, 1, 1.4, 6), 5, .6, -4, 1.1);
  // 尺寸標線（像設計圖）
  const dim = segs([-5.6, -.4, -3, -4, -.4, -3, -5.6, -.55, -3, -5.6, -.25, -3, -4, -.55, -3, -4, -.25, -3, -3.6, -.3, -3, -3.6, 2.7, -3, -3.75, -.3, -3, -3.45, -.3, -3, -3.75, 2.7, -3, -3.45, 2.7, -3], 0x5fb8e8, .6);
  scene.add(dim);
  const scan = lightBar(70, .5, 0x5cc8ff, .9); scan.position.z = -13.9; scene.add(scan);
  const motes = dots(Math.round(380 * Q), () => ({ p: [(rnd() - .5) * 30, rnd() * 12 - 2, -rnd() * 14], c: 0x8fd6ff, s: .5 + rnd() * .5 }), 1, .6); T(motes.material); scene.add(motes);
  function update({ p, time }) {
    objs.forEach((o, i) => { o.rotation.y = time * (.12 + i * .03) + p * 1.6; o.rotation.x = Math.sin(time * .3 + i) * .15; });
    phone.rotation.y = Math.sin(time * .4) * .5 + p;
    scan.position.y = -2 + ((time * 2.2) % 18);
    camera.fov = camera.aspect < 1 ? 64 : 55; camera.position.set(Math.sin(p * 1.6 - .8) * 6, 2.2, 9 - p * 2); camera.lookAt(0, 1.4, -4);
  }
  return { scene, update };
})();

// 交易法：亮天空裡四座光雕（金色六角框裡用線畫出天秤、訂單塊、水平線、一根大 K 棒），慢慢浮著轉
W.islands = (() => {
  const scene = new THREE.Scene(); scene.background = gradTex([[0, "#d6e3f4"], [.55, "#f4f2ec"], [1, "#efe5cf"]]); scene.fog = new THREE.Fog(0xf2efe7, 18, 70);
  const GOLD = 0xb8913f, BLUE = 0x176ed0, RED = 0xd13c5b, INK = 0x4b5563;
  const L = (pos, c, o = .9) => segs(pos, c, o, false);
  const rect = (x, y, w, h, z = 0) => [x, y, z, x + w, y, z, x + w, y, z, x + w, y + h, z, x + w, y + h, z, x, y + h, z, x, y + h, z, x, y, z];
  const sculpt = [];
  const spots = [[-6.5, 1.2, -6], [6, 2.2, -11], [-5, 3, -19], [7, 1.4, -25]];
  spots.forEach((s, i) => { const g = new THREE.Group(); g.position.set(...s); scene.add(g); g.add(L(hexLoop(2.8, Math.PI / 2), GOLD, .9)); g.add(L(hexLoop(2.55, Math.PI / 2), GOLD, .3)); sculpt.push(g); });
  { const g = sculpt[0]; const b = new THREE.Group(); b.position.y = .6; g.add(b); g.userData.beam = b;     // 天秤
    g.add(L([0, -1.6, 0, 0, .6, 0], INK, .7)); b.add(L([-1.6, 0, 0, 1.6, 0, 0], GOLD, 1));
    [-1.5, 1.5].forEach((x, i) => { b.add(L([x, 0, 0, x - .45, -.9, 0, x, 0, 0, x + .45, -.9, 0], INK, .5)); const r = L(hexLoop(.5, 0, 0), i ? RED : BLUE, 1); r.position.set(x, -.9, 0); r.rotation.x = -Math.PI / 2; b.add(r); }); }
  { const g = sculpt[1], p = [];                                                                               // 訂單塊＋失衡區
    for (let i = 0; i < 3; i++) p.push(...rect(-1.4 + i * 1, -1.2 + i * .55, .8, .8));
    g.add(L(p, BLUE, 1)); const fvg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .7), new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: .12, depthWrite: false })); fvg.position.set(.2, .9, 0); g.add(fvg); g.add(L(rect(-1.1, .55, 2.6, .7), BLUE, .45)); }
  { const g = sculpt[2], p = [];                                                                               // SNR：水平線＋幾根 K
    g.add(L([-2.1, .5, 0, 2.1, .5, 0], GOLD, 1));
    [[-1.6, -1.4, .9], [-1, -1, 1.3], [-.4, -.6, 1.1], [.2, -.2, .7], [.8, -.9, 1.2], [1.4, -1.3, .8]].forEach(([x, y, h], i) => { p.push(...rect(x, y, .32, h)); p.push(x + .16, y + h, 0, x + .16, y + h + .35, 0); });
    g.add(L(p, INK, .75)); }
  { const g = sculpt[3]; g.add(L(rect(-.45, -1.2, .9, 2.2), BLUE, 1)); g.add(L([0, 1, 0, 0, 1.9, 0, 0, -1.2, 0, 0, -1.8, 0], INK, .8));   // 一根大 K
    g.add(L(rect(-1.55, -.6, .55, 1.1), INK, .4)); g.add(L([-1.28, .5, 0, -1.28, .9, 0], INK, .4)); }
  const clouds = [];
  for (let i = 0; i < 14; i++) { const s = glow(0xffffff, 8 + rnd() * 10, .45, false); s.position.set((rnd() - .5) * 50, -3 + rnd() * 6, -rnd() * 34); scene.add(s); clouds.push(s); }
  const dust = dots(Math.round(500 * Q), () => ({ p: [(rnd() - .5) * 40, -3 + rnd() * 12, -rnd() * 34], c: rnd() < .5 ? 0xc79a3e : 0x7fa6d6, s: .5 + rnd() * .7 }), 1, .55, false);
  T(dust.material); scene.add(dust);
  function update({ p, time }) {
    sculpt.forEach((g, i) => { g.position.y = spots[i][1] + Math.sin(time * .6 + i * 1.7) * .22; g.rotation.y = Math.sin(time * .25 + i) * .35; });
    sculpt[0].userData.beam.rotation.z = Math.sin(time * .8) * .14;
    clouds.forEach((c, i) => { c.position.x += .004 * (i % 3 + 1); if (c.position.x > 26) c.position.x = -26; });
    camera.fov = camera.aspect < 1 ? 62 : 52; camera.position.set(lerp(-3, 4, p), 3.6 - p * .6, lerp(12, -6, easeIO(p))); camera.lookAt(lerp(-2, 4, p), 1.5, lerp(-6, -26, easeIO(p)));
  }
  return { scene, update };
})();

// 新手學院：夜裡的一條光路，沿路一個個六角關卡，盡頭一道亮的門；鏡頭沿著路往前走
W.academy = (() => {
  const scene = new THREE.Scene(); scene.background = gradTex([[0, "#04061a"], [.62, "#0b1133"], [.72, "#14204a"], [1, "#05081a"]]); scene.fog = new THREE.FogExp2(0x070b22, .022);
  const curve = new THREE.CatmullRomCurve3([[0, -1.6, 14], [2.6, -1.4, 4], [-2.4, -1.1, -8], [2.2, -.6, -20], [-1.6, 0, -33], [1.2, .6, -46], [0, 1.2, -60]].map(a => new THREE.Vector3(...a)));
  const N = Math.round(5200 * Q), pos = [], uu = [];
  const tmp = new THREE.Vector3(), tan = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) {
    const u = rnd(); curve.getPointAt(u, tmp); curve.getTangentAt(u, tan); side.crossVectors(tan, up).normalize();
    const w = (rnd() - .5) * (rnd() < .85 ? 1.3 : 3.4); tmp.addScaledVector(side, w); tmp.y += (rnd() - .5) * .08 + Math.abs(w) * .02;
    pos.push(tmp.x, tmp.y, tmp.z); uu.push(u);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aU", new THREE.Float32BufferAttribute(uu, 1));
  const pathMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uPR, uTime: { value: 0 } },
    vertexShader: "attribute float aU; uniform float uPR, uTime; varying float vA; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; float wave=.35+.65*pow(.5+.5*sin(aU*60.-uTime*1.6),6.); vA=wave; gl_PointSize=max(1.,uPR*1.1*(26./max(.5,-mv.z))); }",
    fragmentShader: "varying float vA; void main(){ vec2 d=gl_PointCoord-.5; float a=smoothstep(.5,0.,length(d)); a=a*a*vA; gl_FragColor=vec4(vec3(1.,.82,.55)*a,a); }" });
  const path = new THREE.Points(g, pathMat); path.frustumCulled = false; T(pathMat); scene.add(path);
  const gates = [];
  for (let k = 1; k <= 7; k++) {
    const u = k / 8, gp = curve.getPointAt(u), gt = curve.getTangentAt(u), gr = new THREE.Group(); gr.position.copy(gp).y += 1.1; gr.lookAt(gp.clone().add(gt).setY(gr.position.y));
    const big = k === 7;
    gr.add(segs(hexLoop(big ? 2.2 : 1.25, Math.PI / 2), big ? 0xfff1c9 : 0xf1d898, big ? 1 : .85));
    gr.add(segs(hexLoop(big ? 1.95 : 1.1, Math.PI / 2), 0xf1d898, .3));
    if (big) { const gg = glow(0xfff0cc, 9, .55); gr.add(gg); }
    scene.add(gr); gates.push(gr);
  }
  const stars = dots(Math.round(1400 * Q), () => { const v = new THREE.Vector3().randomDirection().multiplyScalar(60 + rnd() * 60); v.y = Math.abs(v.y) * .8 + 2; return { p: [v.x, v.y, v.z - 20], c: rnd() < .2 ? 0xa9c4ff : 0xffffff, s: .4 + rnd() * .8 }; }, 1.4, .8);
  T(stars.material); scene.add(stars);
  const at = new THREE.Vector3(), ahead = new THREE.Vector3();
  function update({ p, time }) {
    const u = .03 + easeIO(p) * .74; curve.getPointAt(u, at); curve.getPointAt(Math.min(1, u + .07), ahead);
    camera.fov = camera.aspect < 1 ? 66 : 55; camera.position.set(at.x, at.y + 1.6, at.z); camera.lookAt(ahead.x, ahead.y + 1.2, ahead.z);
    gates.forEach((g, i) => { g.rotation.z = Math.sin(time * .4 + i) * .05; });
  }
  return { scene, update };
})();

// K 線故事片：電影院，背後是一整面打褶的紅絲絨（一張面用 shader 畫褶子），放映機的光束和灰塵
W.cinema = (() => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x060103);
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(64, 28), new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: "uniform float uTime; varying vec2 vUv; void main(){ float x=vUv.x; float f=.5+.5*sin(x*70.+sin(x*9.+uTime*.15)*2.4); f=pow(f,1.6); float side=smoothstep(.36,.06,abs(x-.5)-.0); float mid=1.-smoothstep(.0,.3,abs(x-.5)); float v=smoothstep(0.,.35,vUv.y)*smoothstep(1.,.6,vUv.y); vec3 c=mix(vec3(.05,.004,.01),vec3(.42,.03,.07),f*.85); c*= (.25+.75*(1.-mid*.75))*v; c+=vec3(.12,.05,.03)*mid*smoothstep(.2,.7,vUv.y)*.6; gl_FragColor=vec4(c,1.); }" }));
  curtain.position.set(0, 4, -20); scene.add(curtain); T(curtain.material);
  const floor = segs((() => { const a = []; for (let z = 6; z >= -20; z -= 1.6) a.push(-30, -3, z, 30, -3, z); return a; })(), 0x5a1020, .25); scene.add(floor);
  const beamGeo = new THREE.ConeGeometry(9, 32, 48, 1, true); beamGeo.translate(0, -16, 0);
  const beam = new THREE.Mesh(beamGeo, beamMat(0xffe7c4, .2)); beam.position.set(0, 6.5, 12); beam.rotation.x = Math.PI / 2 - .08; scene.add(beam);
  const dust = flow(Math.round(900 * Q), () => { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 6.5; return { a: [Math.cos(a) * r * .2, 6 + Math.sin(a) * r * .1, 11], b: [Math.cos(a) * r, 3 + Math.sin(a) * r * .6, -18], c: 0xffe0c0, s: .4 + rnd() * .7 }; }, 1, .7, .02);
  T(dust.material); scene.add(dust);
  const scr = glow(0xffd9c0, 30, .18); scr.position.set(0, 3.4, -19.5); scene.add(scr);
  function update({ p, time }) {
    camera.fov = camera.aspect < 1 ? 64 : 55; camera.position.set(Math.sin(time * .15) * .5, 1.6, 9 - p * 5); camera.lookAt(0, 2.8, -18);
    beam.material.uniforms.uS.value = .17 + Math.sin(time * 7) * .008 + Math.sin(time * 13) * .006;
  }
  return { scene, update };
})();

// 團隊：深藍星空，中間一顆金色的星（創辦人，十字細光芒），四顆行星是小亮點沿細細的軌道走，外面一圈金色六角星座
W.stars = (() => {
  const scene = new THREE.Scene(); scene.background = gradTex([[0, "#02040d"], [.5, "#050a1f"], [1, "#02040d"]]);
  const bg = dots(Math.round(2400 * Q), () => { const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + rnd() * 60); return { p: [v.x, v.y, v.z], c: rnd() < .2 ? 0xa9c4ff : 0xffffff, s: .4 + Math.pow(rnd(), 3) * 2 }; }, 1.6, .85);
  T(bg.material); scene.add(bg);
  const core = glow(0xffe2a8, 1.6, 1); scene.add(core); const core2 = glow(0xffffff, .5, 1); scene.add(core2);
  const flare = segs([-2.2, 0, 0, 2.2, 0, 0, 0, -2.2, 0, 0, 2.2, 0], 0xffe2a8, .45); scene.add(flare);
  const P = [0xff3b2e, 0x35e0c2, 0xc99bff, 0xd0d4dc].map((c, i) => {
    const r = 3 + i * 1.3, tilt = (i - 1.5) * .16, o = [];
    for (let k = 0; k < 120; k++) { const a = k / 120 * Math.PI * 2, b = (k + 1) / 120 * Math.PI * 2; o.push(Math.cos(a) * r, 0, Math.sin(a) * r, Math.cos(b) * r, 0, Math.sin(b) * r); }
    const orbit = segs(o, c, .22); orbit.rotation.x = tilt; scene.add(orbit);
    const pl = glow(c, .7, 1); scene.add(pl); const dot = glow(0xffffff, .2, 1); scene.add(dot);
    return { r, tilt, pl, dot, ph: i * 1.6, sp: .3 - i * .05 };
  });
  const hex = segs(hexLoop(8.2, 0), 0xe3c47e, .3); hex.rotation.x = -Math.PI / 2; scene.add(hex);
  const v = new THREE.Vector3(), ax = new THREE.Vector3(1, 0, 0);
  function update({ p, time }) {
    P.forEach(o => { const a = o.ph + time * o.sp; v.set(Math.cos(a) * o.r, 0, Math.sin(a) * o.r).applyAxisAngle(ax, o.tilt); o.pl.position.copy(v); o.dot.position.copy(v); });
    hex.rotation.z = time * .04; bg.rotation.y = time * .005; flare.quaternion.copy(camera.quaternion); flare.scale.setScalar(1 + Math.sin(time * 1.3) * .05);
    const a = -.6 + p * 1.2, d = camera.aspect < 1 ? 22 : 15; camera.fov = 50; camera.position.set(Math.sin(a) * d, 5.5 - p * 3, Math.cos(a) * d); camera.lookAt(0, 0, 0);
  }
  return { scene, update };
})();

// 會員：金庫，地上是金色細線的六角格，中間三圈六角光台，聚光燈從上面打下來，金色微塵往上飄，後面一道慢慢轉的六角門
W.vault = (() => {
  const scene = new THREE.Scene(); scene.background = gradTex([[0, "#050403"], [.6, "#0c0905"], [1, "#030302"]]); scene.fog = new THREE.Fog(0x050403, 8, 40);
  scene.add(hexGrid(1, 26, -2.6, 0xb8913f, .32));
  const floorGlow = new THREE.Mesh(new THREE.CircleGeometry(7, 48), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: "varying vec2 vUv; void main(){ float r=length(vUv-.5)*2.; float a=pow(max(0.,1.-r),2.2)*.55; gl_FragColor=vec4(vec3(1.,.82,.5)*a,a); }" }));
  floorGlow.rotation.x = -Math.PI / 2; floorGlow.position.y = -2.58; scene.add(floorGlow);
  const ped = new THREE.Group(); scene.add(ped);
  [[2.3, -2.5], [2.05, -2.1], [1.8, -1.7]].forEach(([r, y], i) => { const l = segs(hexLoop(r, 0), 0xd6b465, .9 - i * .15); l.rotation.x = -Math.PI / 2; l.position.y = y; ped.add(l); });
  { const o = [], a = hexPts(2.3, 0), b = hexPts(1.8, 0); for (let i = 0; i < 6; i++) o.push(a[i][0], -2.5, a[i][1], b[i][0], -1.7, b[i][1]); ped.add(segs(o, 0xd6b465, .35)); }
  const coneGeo = new THREE.ConeGeometry(3.4, 14, 48, 1, true); coneGeo.translate(0, -7, 0);
  const cone = new THREE.Mesh(coneGeo, beamMat(0xffdca0, .24)); cone.position.set(0, 12, 0); scene.add(cone);
  const door = new THREE.Group(); door.position.set(0, 4, -14); scene.add(door);
  [9, 8.4, 7.6, 5.2].forEach((r, i) => door.add(segs(hexLoop(r, Math.PI / 2), 0xb8913f, [.6, .25, .4, .18][i])));
  const gold = flow(Math.round(700 * Q), () => { const x = (rnd() - .5) * 18, z = (rnd() - .5) * 14; return { a: [x, -2.5, z], b: [x + (rnd() - .5) * 2, 9, z + (rnd() - .5) * 2], c: 0xf1cf7f, s: .5 + rnd() * .8 }; }, 1.1, .85, .035);
  T(gold.material); scene.add(gold);
  function update({ p, time }) {
    door.rotation.z = time * .04; ped.rotation.y = time * .1;
    const ang = -.5 + p * 1, d = camera.aspect < 1 ? 11.5 : 9; camera.fov = 50; camera.position.set(Math.sin(ang) * d, 1.2 + p * .8, Math.cos(ang) * d); camera.lookAt(0, 0, 0);
  }
  return { scene, update };
})();

// ---------- 排程：每一段對應一個世界 ----------
const segsEl = Array.from(document.querySelectorAll("[data-world]"));
const txs = Array.from(document.querySelectorAll("[data-tx]"));
segsEl.forEach(el => OX.track(el)); txs.forEach(el => OX.track(el));
function resize() { const w = innerWidth, h = Math.max(innerHeight, document.documentElement.clientHeight); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();

function pick(vh) {
  const mid = vh / 2;
  for (const el of txs) { const r = OX.rect(el); if (r.top <= mid && r.bottom > mid) { const q = clamp((mid - r.top) / r.height, 0, 1); return { world: q < .5 ? el.dataset.from : el.dataset.to, edge: q < .5 ? 1 : 0 }; } }
  for (const el of segsEl) { const r = OX.rect(el); if (r.top <= mid && r.bottom > mid) return { world: el.dataset.world, el, p: clamp((vh - r.top) / (r.height + vh), 0, 1) }; }
  return { world: "bh", p: 0 };
}
// 轉場區前半拿上一段的結尾、後半拿下一段的開頭，進度才接得上
function progressOf(world, vh) { const el = segsEl.find(e => e.dataset.world === world); if (!el) return 0; const r = OX.rect(el); return clamp((vh - r.top) / (r.height + vh), 0, 1); }

// 開場時先把每個世界準備好（編譯材質、上傳資料），之後滑到才不會頓一下
let warmed = false;
async function warm() {
  const rt = new THREE.WebGLRenderTarget(64, 64);
  for (const k of Object.keys(W)) {
    const w = W[k];
    try { if (renderer.compileAsync) await renderer.compileAsync(w.scene, camera); else renderer.compile(w.scene, camera); } catch (e) { }
    renderer.setRenderTarget(rt); renderer.render(w.scene, camera); renderer.setRenderTarget(null);
    await new Promise(r => setTimeout(r, 16));
  }
  rt.dispose(); warmed = true;
}

let intro = null, lastWorld = "", shown = null, slowN = 0, fastN = 0;
function setShown(v) { if (v !== shown) { shown = v; canvas.style.visibility = v ? "visible" : "hidden"; } }
function adapt(dt) {        // 太慢就降解析度，夠快再慢慢升回來
  if (dt > 22) { slowN++; fastN = 0; } else if (dt < 14) { fastN++; slowN = Math.max(0, slowN - 1); }
  let np = PR;
  // 改解析度本身會頓一下，所以要持續慢很久才降、要很久都很快才升
  if (slowN > 90 && PR > .8) { np = Math.max(.8, PR - .2); slowN = 0; }
  else if (fastN > 900 && PR < PR_MAX) { np = Math.min(PR_MAX, PR + .1); fastN = 0; }
  if (np !== PR) { PR = np; uPR.value = PR; renderer.setPixelRatio(PR); resize(); }
}
const t0 = performance.now();
OX.add((S, now) => {
  const time = reduce ? 3 : (now - t0) / 1000;
  timed.forEach(m => m.uniforms.uTime.value = time);
  if (intro) {
    const t = (now - intro.start) / 1000;
    setShown(true);
    W.logo.update({ mode: "intro", t: Math.min(t, 2.4), time });
    renderer.render(W.logo.scene, camera);
    if ((t > 2.4 && warmed) || t > 4 || intro.skip) { intro.done(); intro = null; }
    return;
  }
  const s = pick(S.vh);
  if (s.world !== lastWorld) { lastWorld = s.world; document.documentElement.dataset.cur = s.world; dispatchEvent(new CustomEvent("oxworld", { detail: s.world })); }
  const key = s.world === "outro" ? "logo" : s.world, w = W[key];
  if (!w) { setShown(false); return; }
  setShown(true);
  const p = s.el ? s.p : progressOf(s.world, S.vh);
  if (s.world === "outro") w.update({ mode: "outro", p, time }); else w.update({ p, time });
  camera.updateProjectionMatrix();
  renderer.render(w.scene, camera);
  adapt(S.dt);
});

// 開場：logo 兩半飛進來合上、拉遠（第一次來才播）；同時在背後把世界準備好
function runIntro() {
  let seen = false; try { seen = localStorage.getItem("ox-intro") === "1"; } catch (e) { }
  if (reduce || seen || location.hash || new URLSearchParams(location.search).has("nointro")) { setTimeout(warm, 600); return; }
  const root = document.documentElement; root.classList.add("intro");
  const skip = document.querySelector(".intro-skip");
  intro = { start: performance.now(), skip: false, done() { root.classList.add("intro-out"); setTimeout(() => root.classList.remove("intro", "intro-out"), 700); try { localStorage.setItem("ox-intro", "1"); } catch (e) { } dispatchEvent(new Event("oxintrodone")); } };
  if (skip) skip.addEventListener("click", () => { if (intro) intro.skip = true; });
  warm();
}
runIntro();
