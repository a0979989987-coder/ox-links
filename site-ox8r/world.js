/* OX 官網 v3 的 3D 宇宙：一張固定在背景的畫布，滑到哪一段就畫哪一個世界。
   世界：logo（開場／收尾）、天秤、金色 K 線城市、六角光環隧道、藍圖實驗室、四座浮島、電影院、星座、金庫。
   每個世界只在輪到它的時候畫；鏡頭跟著那一段的滑動進度走，再加一點時間的慢動。 */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = matchMedia("(pointer: coarse)").matches || Math.min(screen.width, screen.height) < 700;
const Q = isMobile ? .55 : 1;                       // 粒子、格子數量的倍率
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeIO = t => { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

const canvas = document.getElementById("world");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false, powerPreference: "high-performance" });
} catch (e) { document.documentElement.classList.add("no-world"); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), .04).texture;
const camera = new THREE.PerspectiveCamera(50, 1, .1, 600);

// ---------- 共用：六角形、logo 形狀 ----------
const hexPts = (r, rot = Math.PI / 2) => Array.from({ length: 6 }, (_, i) => [Math.cos(rot + i * Math.PI / 3) * r, Math.sin(rot + i * Math.PI / 3) * r]);
function hexFrameGeo(r, w, rot) {                     // 一圈六角形的框（中間空的）
  const s = new THREE.Shape(), h = new THREE.Path();
  hexPts(r, rot).forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath();
  hexPts(r - w, rot).forEach(([x, y], i) => i ? h.lineTo(x, y) : h.moveTo(x, y)); h.closePath();
  s.holes.push(h); return new THREE.ShapeGeometry(s);
}
function hexGridLines(size, radius, y, color, opacity, flatTop = true) {   // 地板的六角格線
  const pos = [], rot = flatTop ? 0 : Math.PI / 2, n = Math.ceil(radius / size);
  for (let q = -n; q <= n; q++) for (let r = -n; r <= n; r++) {
    const x = size * 1.5 * q, z = size * Math.sqrt(3) * (r + q / 2);
    if (x * x + z * z > radius * radius) continue;
    const p = hexPts(size, rot);
    for (let i = 0; i < 6; i++) { const a = p[i], b = p[(i + 1) % 6]; pos.push(x + a[0], y, z + a[1], x + b[0], y, z + b[1]); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity, fog: true, depthWrite: false }));
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
export const logoShapes = LOGO.map(l => ({ c: l.c, shape: logoShape(l.d) }));
function makeLogo() {
  const g = new THREE.Group(), halves = {};
  const mats = {
    d: new THREE.MeshPhysicalMaterial({ color: 0xf1f1f3, metalness: 1, roughness: .2, clearcoat: .6, clearcoatRoughness: .15, envMapIntensity: 1.25 }),
    b: new THREE.MeshPhysicalMaterial({ color: 0x23a6ea, metalness: .55, roughness: .26, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: 1.1 })
  };
  for (const { c, shape } of logoShapes) {
    const geo = new THREE.ExtrudeGeometry(shape, { depth: .2, bevelEnabled: true, bevelThickness: .035, bevelSize: .022, bevelSegments: 4, curveSegments: 1 });
    geo.translate(0, 0, -.1);
    const m = new THREE.Mesh(geo, mats[c]); g.add(m); halves[c] = m;
  }
  return { group: g, halves };
}
function points(n, fill, size, color, opts = {}) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color();
  for (let i = 0; i < n; i++) { const r = fill(i); pos.set(r.p, i * 3); c.set(r.c || color); col.set([c.r, c.g, c.b], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size, vertexColors: true, transparent: true, opacity: opts.opacity ?? .9, depthWrite: false, blending: opts.normal ? THREE.NormalBlending : THREE.AdditiveBlending, sizeAttenuation: true, map: dotTex(), alphaTest: .01, fog: opts.fog ?? true });
  return new THREE.Points(g, m);
}
let _dot;
function dotTex() {
  if (_dot) return _dot;
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.25, "rgba(255,255,255,.8)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); _dot = new THREE.CanvasTexture(c); return _dot;
}
function gradTex(stops) {
  const c = document.createElement("canvas"); c.width = 4; c.height = 256; const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function beamMat(color, strength = .5) {     // 光束：圓錐，越往下越淡，邊緣也淡
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uC: { value: new THREE.Color(color) }, uS: { value: strength } },
    vertexShader: "varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }",
    fragmentShader: "uniform vec3 uC; uniform float uS; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float edge=pow(abs(dot(vN,vV)),1.6); float fall=pow(vUv.y,1.4); gl_FragColor=vec4(uC*uS*edge*fall,1.); }"
  });
}

// ---------- 世界 ----------
const W = {};

// 0／10 logo：開場、收尾
W.logo = (() => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020306); scene.environment = envTex;
  const { group, halves } = makeLogo(); scene.add(group);
  const key = new THREE.DirectionalLight(0xffd9a0, 2.2); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0x23a6ea, 30, 20); rim.position.set(3, -2, 3); scene.add(rim);
  const seam = new THREE.PointLight(0xfff1d0, 0, 6); seam.position.set(0, 0, 1.2); scene.add(seam);
  const stars = points(Math.round(900 * Q), () => { const v = new THREE.Vector3().randomDirection().multiplyScalar(30 + rnd() * 40); return { p: [v.x, v.y, v.z] }; }, .18, 0xbfc7d6, { opacity: .7 });
  scene.add(stars);
  const floor = hexGridLines(.9, 22, -2.2, 0x6f7fa0, .16); scene.add(floor);
  // mode 'intro'：t 秒（0～2.4）；mode 'outro'：p 滑動進度
  function update({ mode, t, p, time }) {
    let open, rotY, camZ, flash = 0;
    if (mode === "intro") {
      const a = easeIO(t / 1.1); open = 1 - a; flash = Math.max(0, 1 - Math.abs(t - 1.15) / .25);
      rotY = (1 - a) * -1.2 + smooth((t - 1.3) / 1.1) * .6; camZ = lerp(4.2, 9, smooth((t - 1.4) / 1));
    } else {
      open = 1 - easeIO(p / .6); rotY = Math.sin(time * .4) * .35 + (1 - p) * .8; camZ = lerp(10, camera.aspect < 1 ? 7.4 : 5.6, ease(p)); flash = Math.max(0, 1 - Math.abs(p - .62) / .1) * .8;
    }
    // 收尾時 logo 往上讓出位置給下面的大字；頁尾上來時 logo 跟著畫面一起往上走，不會被字壓住
    const lookY = mode === "intro" ? 0 : -.75 * smooth(p / .5) - clamp((p - .7) / .3, 0, 1) * 2 * camZ * Math.tan(22.5 * Math.PI / 180);
    halves.d.position.set(-open * 2.6, open * 1.6, -open * 1.5); halves.d.rotation.set(open * .6, open * -1.1, open * .4);
    halves.b.position.set(open * 2.6, -open * 1.6, -open * 1.5); halves.b.rotation.set(-open * .5, open * 1.1, -open * .3);
    group.rotation.y = rotY; group.rotation.x = Math.sin(time * .5) * .08;
    seam.intensity = flash * 40;
    stars.rotation.y = time * .01;
    camera.position.set(0, .2 + lookY, camZ); camera.lookAt(0, lookY, 0); camera.fov = 45;
  }
  return { scene, update, dark: true };
})();

// 2 天秤：左青（買方）右桃紅（賣方），中間一根光做的天秤，滑動時倒向一邊
W.balance = (() => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x04060f); scene.fog = new THREE.FogExp2(0x04060f, .045);
  scene.add(hexGridLines(1.2, 40, -3, 0x3b4b78, .35));
  const glow = (c, s) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: s });
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.12, .2, 4.2, 6, 1, true), glow(0xe8e3d4, .5)); pillar.position.y = -.9; scene.add(pillar);
  const pillarEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(.12, .2, 4.2, 6)), new THREE.LineBasicMaterial({ color: 0xf6f2e9 })); pillarEdges.position.copy(pillar.position); scene.add(pillarEdges);
  const beam = new THREE.Group(); beam.position.y = 1.2; scene.add(beam);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(7, .05, .05), new THREE.MeshBasicMaterial({ color: 0xfff4dc })); beam.add(bar);
  const pans = [-3.5, 3.5].map((x, i) => {
    const g = new THREE.Group(); g.position.x = x; beam.add(g);
    const col = i ? 0xff3078 : 0x00b8d4;
    const ln = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-.7, -1.6, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(.7, -1.6, 0)]), new THREE.LineBasicMaterial({ color: 0xcfd3dc, transparent: true, opacity: .6 }));
    g.add(ln);
    const plate = new THREE.Mesh(hexFrameGeo(.9, .08, 0), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })); plate.rotation.x = -Math.PI / 2; plate.position.y = -1.6; g.add(plate);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(.85, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .18, side: THREE.DoubleSide })); disc.rotation.x = -Math.PI / 2; disc.position.y = -1.6; g.add(disc);
    return g;
  });
  const N = Math.round(2600 * Q);
  const mk = (side, col) => points(N, () => { const a = rnd() * Math.PI * 2, r = .4 + Math.pow(rnd(), .6) * 3.2, y = (rnd() - .5) * 3.4; return { p: [side * 4.2 + Math.cos(a) * r, y, Math.sin(a) * r] }; }, .07, col, { opacity: .85 });
  const L = mk(-1, 0x00b8d4), R = mk(1, 0xff3078); scene.add(L, R);
  function update({ p, time }) {
    const tilt = Math.sin(p * Math.PI * 2.2 - .4) * .22 + Math.sin(time * .7) * .02;
    beam.rotation.z = tilt; pans.forEach(g => g.rotation.z = -tilt);
    L.rotation.y = time * .12; R.rotation.y = -time * .12;
    L.position.y = -tilt * 2.2; R.position.y = tilt * 2.2;
    L.material.size = .07 * (1 + Math.max(0, -tilt) * 2); R.material.size = .07 * (1 + Math.max(0, tilt) * 2);
    const a = -.35 + p * .7 + Math.sin(time * .1) * .05;
    camera.fov = 55; camera.position.set(Math.sin(a) * 11, 1.4 + p * 1.5, Math.cos(a) * 11); camera.lookAt(0, .2, 0);
  }
  return { scene, update, dark: true };
})();

// 3 OX 台股：金色 K 線城市，大樓是 K 棒（台股紅漲綠跌），鏡頭沿著大道低飛；盡頭一道金色六角門
W.city = (() => {
  const scene = new THREE.Scene(); const sky = gradTex([[0, "#f4e6c8"], [.55, "#f7f1e6"], [1, "#efe4cc"]]); scene.background = sky;
  scene.fog = new THREE.Fog(0xf3ead8, 18, 95);
  scene.add(new THREE.HemisphereLight(0xfff7e8, 0xcdb68a, 1.6));
  const sun = new THREE.DirectionalLight(0xffd49a, 2.4); sun.position.set(-30, 40, 10); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0xeadfc6, roughness: 1 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const grid = hexGridLines(2.4, 120, .02, 0xb08a3c, .25); scene.add(grid);
  const cols = isMobile ? 9 : 13, rows = isMobile ? 26 : 34, gap = 3.2, list = [];
  for (let c = -cols; c <= cols; c++) {
    if (Math.abs(c) < 2) continue;                       // 中間留一條大道
    let price = 6 + rnd() * 4;
    for (let r = 0; r < rows; r++) {
      const o = price, ch = (rnd() - .48) * 3.2; price = clamp(price + ch, 2.5, 22);
      list.push({ x: c * gap + (rnd() - .5) * .6, z: 20 - r * gap * 1.15, o, c: price, kind: rnd() < .17 ? (ch >= 0 ? "up" : "dn") : "base" });
    }
  }
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: .45, metalness: .15 }), list.length);
  const wick = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: .6 }), list.length);
  const M = new THREE.Matrix4(), col = new THREE.Color();
  list.forEach((b, i) => {
    const lo = Math.min(b.o, b.c), hi = Math.max(b.o, b.c), h = Math.max(1.2, hi), w = 1.7;
    M.compose(new THREE.Vector3(b.x, h / 2, b.z), new THREE.Quaternion(), new THREE.Vector3(w, h, w)); body.setMatrixAt(i, M);
    col.set(b.kind === "up" ? 0xe0675c : b.kind === "dn" ? 0x46a883 : (rnd() < .55 ? 0xf5eedf : 0xe6cf98)); body.setColorAt(i, col);
    const wh = b.kind === "base" ? .01 : 1.5 + rnd() * 2.5;
    M.compose(new THREE.Vector3(b.x, h + wh / 2, b.z), new THREE.Quaternion(), new THREE.Vector3(.14, wh, .14)); wick.setMatrixAt(i, M);
    col.set(b.kind === "up" ? 0xd9544d : 0x2f9e74); wick.setColorAt(i, col);
  });
  scene.add(body, wick);
  const portal = new THREE.Mesh(hexFrameGeo(9, .45), new THREE.MeshBasicMaterial({ color: 0xd8b25e, side: THREE.DoubleSide, fog: false }));
  portal.position.set(0, 9, -rows * gap * 1.15 + 6); scene.add(portal);
  const portalGlow = new THREE.Mesh(new THREE.CircleGeometry(8.6, 6), new THREE.MeshBasicMaterial({ color: 0xfff1c9, transparent: true, opacity: .35, fog: false })); portalGlow.rotation.z = Math.PI / 2; portalGlow.position.copy(portal.position).z -= .1; scene.add(portalGlow);
  const dust = points(Math.round(500 * Q), () => ({ p: [(rnd() - .5) * 40, rnd() * 18, 20 - rnd() * 110] }), .12, 0xd4a84c, { opacity: .6, normal: true });
  scene.add(dust);
  const endZ = portal.position.z;
  function update({ p, time }) {
    const z = lerp(26, endZ + 26, easeIO(p));
    // 鏡頭從城市上空沿著大道往前飛，往前下方看（看得到一整片 K 棒大樓，不會像兩面牆）
    camera.fov = camera.aspect < 1 ? 74 : 56; camera.position.set(Math.sin(time * .2) * .5, (camera.aspect < 1 ? 19 : 15) - p * 6, z); camera.lookAt(0, 1 + p * 6, z - 30);
    portal.rotation.z = time * .1; dust.position.y = Math.sin(time * .3) * .3;
  }
  return { scene, update, dark: false };
})();

// 4 OX 加密：六角光環隧道，青和桃紅交替，資料流往鏡頭衝
W.tunnel = (() => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020309); scene.fog = new THREE.Fog(0x020309, 6, 70);
  const N = 46, gap = 3, geo = hexFrameGeo(5.2, .07, 0);
  const rings = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), N);
  const C = [new THREE.Color(0x00b8d4), new THREE.Color(0xff3078), new THREE.Color(0x6a7cff)];
  for (let i = 0; i < N; i++) rings.setColorAt(i, C[i % 3 === 2 ? 2 : i % 2]);
  scene.add(rings);
  const inner = new THREE.InstancedMesh(hexFrameGeo(3.2, .025, 0), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), N);
  scene.add(inner);
  const S = Math.round(1400 * Q);
  const streak = points(S, () => { const a = rnd() * Math.PI * 2, r = 1 + rnd() * 4; return { p: [Math.cos(a) * r, Math.sin(a) * r, -rnd() * N * gap], c: rnd() < .5 ? 0x00b8d4 : 0xff3078 }; }, .08, 0xffffff, { opacity: 1 });
  scene.add(streak);
  const base = streak.geometry.attributes.position.array.slice();
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
  function update({ p, time }) {
    const travel = p * 140 + time * 3, L = N * gap;
    for (let i = 0; i < N; i++) {
      const z = -(((i * gap - travel) % L) + L) % L;
      e.set(0, 0, i * .09 + time * .08); q.setFromEuler(e);
      M.compose(new THREE.Vector3(0, 0, z), q, one); rings.setMatrixAt(i, M); inner.setMatrixAt(i, M);
    }
    rings.instanceMatrix.needsUpdate = true; inner.instanceMatrix.needsUpdate = true;
    const a = streak.geometry.attributes.position.array;
    for (let i = 0; i < S; i++) { let z = base[i * 3 + 2] + (travel * 1.6) % L; if (z > 2) z -= L; a[i * 3 + 2] = z; }
    streak.geometry.attributes.position.needsUpdate = true;
    camera.fov = 70; camera.position.set(Math.sin(time * .3) * .5, Math.cos(time * .23) * .4, 2); camera.lookAt(0, 0, -20);
    camera.rotateZ(Math.sin(p * 3) * .15);
  }
  return { scene, update, dark: true };
})();

// 5 製作中：藍圖實驗室，六角格地板＋格線牆，線框手機和六角柱慢慢轉，一道掃描光上下走
W.lab = (() => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x041224); scene.fog = new THREE.Fog(0x041224, 8, 48);
  scene.add(hexGridLines(1, 36, -2.5, 0x23a6ea, .38));
  const wallPos = [];
  for (let x = -30; x <= 30; x += 1.5) wallPos.push(x, -2.5, -14, x, 16, -14);
  for (let y = -2.5; y <= 16; y += 1.5) wallPos.push(-30, y, -14, 30, y, -14);
  const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(wallPos, 3));
  scene.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x23a6ea, transparent: true, opacity: .14 })));
  const lm = new THREE.LineBasicMaterial({ color: 0x8fd6ff, transparent: true, opacity: .8 });
  const objs = [];
  const add = (geo, x, y, z, s) => { const o = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), lm); o.position.set(x, y, z); o.scale.setScalar(s); scene.add(o); objs.push(o); return o; };
  add(new THREE.BoxGeometry(1, 2.1, .1), -4.6, 1.2, -3, 1.4);            // 線框手機
  add(new THREE.CylinderGeometry(1, 1, 1.6, 6), 4.8, .6, -4, 1.1);        // 六角柱
  add(new THREE.CylinderGeometry(.6, .6, .3, 6), 3, 3.2, -6, 1.2);
  add(new THREE.BoxGeometry(3, 1.8, .1), -7, 4.4, -9, 1.3);              // 線框螢幕
  add(new THREE.OctahedronGeometry(.8), 7, 3.6, -8, 1);
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(70, .06), new THREE.MeshBasicMaterial({ color: 0x5cc8ff, transparent: true, opacity: .7, blending: THREE.AdditiveBlending })); scan.position.z = -13.9; scene.add(scan);
  const motes = points(Math.round(400 * Q), () => ({ p: [(rnd() - .5) * 30, rnd() * 12 - 2, -rnd() * 14] }), .06, 0x8fd6ff, { opacity: .7 });
  scene.add(motes);
  function update({ p, time }) {
    objs.forEach((o, i) => { o.rotation.y = time * (.15 + i * .04) + p * 2; o.rotation.x = Math.sin(time * .3 + i) * .2; });
    scan.position.y = -2 + ((time * 2.2) % 18);
    camera.fov = 55; camera.position.set(Math.sin(p * 1.6 - .8) * 6, 2.2, 9 - p * 2); camera.lookAt(0, 1.4, -4);
  }
  return { scene, update, dark: true };
})();

// 6 交易法：亮天空裡四座六角浮島，各放一件東西（天秤、訂單塊、水平光牆、一根巨大 K 棒）
W.islands = (() => {
  const scene = new THREE.Scene(); scene.background = gradTex([[0, "#dfeaf7"], [.6, "#f6f3ec"], [1, "#f3e9d3"]]);
  scene.fog = new THREE.Fog(0xf3efe6, 20, 70);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8c7a0, 1.5));
  const sun = new THREE.DirectionalLight(0xfff0d6, 2); sun.position.set(10, 20, 12); scene.add(sun);
  scene.environment = envTex;
  const porcelain = new THREE.MeshStandardMaterial({ color: 0xfbfaf6, roughness: .35, metalness: .05 });
  const rock = new THREE.MeshStandardMaterial({ color: 0xd9d2c2, roughness: .9 });
  const goldLine = new THREE.LineBasicMaterial({ color: 0xc2a253 });
  const isl = [];
  const spots = [[-7, 0, -4], [6.5, 1.6, -8], [-5, 2.4, -16], [8, -.4, -20]];
  spots.forEach((s, i) => {
    const g = new THREE.Group(); g.position.set(...s); scene.add(g);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.4, .6, 6), porcelain); g.add(top);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(2.6, 2.4, .6, 6)), goldLine); g.add(e);
    const under = new THREE.Mesh(new THREE.ConeGeometry(2.3, 3.2, 6), rock); under.rotation.x = Math.PI; under.position.y = -1.9; g.add(under);
    isl.push(g);
  });
  const blue = new THREE.MeshStandardMaterial({ color: 0x176ed0, roughness: .3, metalness: .2 }), red = new THREE.MeshStandardMaterial({ color: 0xd13c5b, roughness: .35 }), gold = new THREE.MeshStandardMaterial({ color: 0xc9a24f, roughness: .25, metalness: .9 });
  { // 天秤
    const g = isl[0]; const p = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, 2.4, 6), gold); p.position.y = 1.5; g.add(p);
    const b = new THREE.Mesh(new THREE.BoxGeometry(3.4, .08, .08), gold); b.position.y = 2.7; b.rotation.z = .12; g.add(b); g.userData.beam = b;
    [-1.6, 1.6].forEach((x, i) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .06, 6), i ? red : blue); d.position.set(x, 2.1 - (i ? -.2 : .2), 0); g.add(d); });
  }
  { // 訂單塊：一疊方塊
    const g = isl[1]; for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, .5, 1), i % 2 ? red : blue); m.position.set((i % 3 - 1) * 1.05, .55 + Math.floor(i / 3) * .55, (i % 2) * .4); g.add(m); }
  }
  { // SNR：一道水平光牆＋幾根小 K 棒
    const g = isl[2]; const wall = new THREE.Mesh(new THREE.BoxGeometry(4.2, .05, 1.6), new THREE.MeshBasicMaterial({ color: 0xe3c47e, transparent: true, opacity: .8 })); wall.position.y = 1.7; g.add(wall);
    for (let i = 0; i < 6; i++) { const h = .6 + rnd() * 1.6; const m = new THREE.Mesh(new THREE.BoxGeometry(.3, h, .3), i % 2 ? red : blue); m.position.set(-1.6 + i * .65, .3 + h / 2, -.2); g.add(m); }
  }
  { // 裸 K：一根巨大 K 棒
    const g = isl[3]; const bdy = new THREE.Mesh(new THREE.BoxGeometry(1, 2.6, 1), blue); bdy.position.y = 1.9; g.add(bdy);
    const w = new THREE.Mesh(new THREE.BoxGeometry(.1, 4.6, .1), new THREE.MeshStandardMaterial({ color: 0x4b5563 })); w.position.y = 2.6; g.add(w);
  }
  const clouds = [];
  const ct = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  for (let i = 0; i < 18; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, opacity: .7, depthWrite: false })); s.position.set((rnd() - .5) * 50, -4 + rnd() * 6, -rnd() * 30); s.scale.setScalar(6 + rnd() * 8); scene.add(s); clouds.push(s); }
  function update({ p, time }) {
    isl.forEach((g, i) => { g.position.y = spots[i][1] + Math.sin(time * .6 + i * 1.7) * .25; g.rotation.y = time * .08 + i; });
    isl[0].userData.beam.rotation.z = Math.sin(time * .8) * .15;
    clouds.forEach((c, i) => { c.position.x += .004 * (i % 3 + 1); if (c.position.x > 26) c.position.x = -26; });
    camera.fov = 52; camera.position.set(lerp(-3, 4, p), 4.2 - p * .6, lerp(12, -4, easeIO(p))); camera.lookAt(lerp(-2, 4, p), 1, lerp(-6, -22, easeIO(p)));
  }
  return { scene, update, dark: false };
})();

// 7 K 線故事片：電影院，放映機光束從後面打過來，光裡有灰塵；紅色側光
W.cinema = (() => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x070103); scene.fog = new THREE.Fog(0x070103, 6, 40);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x140508, roughness: .5, metalness: .4 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -3; scene.add(floor);
  scene.add(new THREE.AmbientLight(0x3a0a10, 1.2));
  const l1 = new THREE.PointLight(0xff2a3c, 80, 30); l1.position.set(-9, 3, -4); scene.add(l1);
  const l2 = new THREE.PointLight(0xff5a2a, 60, 30); l2.position.set(9, 2, -6); scene.add(l2);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(22, 10), new THREE.MeshBasicMaterial({ color: 0x2a0a0e })); screen.position.set(0, 3, -18); scene.add(screen);
  const beamGeo = new THREE.ConeGeometry(9, 30, 40, 1, true); beamGeo.translate(0, -15, 0);
  const beam = new THREE.Mesh(beamGeo, beamMat(0xffe7c4, .22)); beam.position.set(0, 6, 12); beam.rotation.x = -Math.PI / 2 - .1; scene.add(beam);
  const dust = points(Math.round(900 * Q), () => { const t = rnd(), a = rnd() * Math.PI * 2, r = rnd() * 7 * t; return { p: [Math.cos(a) * r, 5 + Math.sin(a) * r * .6 - t * 2.4, 12 - t * 28] }; }, .05, 0xffe0c0, { opacity: .8 });
  scene.add(dust);
  // 兩側紅色幕簾：一排直立細長的面
  const cur = new THREE.MeshStandardMaterial({ color: 0x6d0f1a, roughness: .8 });
  for (const side of [-1, 1]) for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 16, 8, 1, true), cur); m.position.set(side * (11 + i * .02), 5, -16 + i * .55); scene.add(m); }
  function update({ p, time }) {
    dust.rotation.z = Math.sin(time * .2) * .03; dust.position.y = Math.sin(time * .5) * .1;
    camera.fov = 55; camera.position.set(Math.sin(time * .15) * .6, 1.6, 9 - p * 6); camera.lookAt(0, 2.4, -18);
    beam.material.uniforms.uS.value = .18 + Math.sin(time * 7) * .01 + Math.sin(time * 13) * .008;
  }
  return { scene, update, dark: true };
})();

// 8 團隊：深藍星空，中間一顆金色的星（創辦人），四顆行星用各自的顏色繞著轉，連成六角星座
W.stars = (() => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x030716);
  const bg = points(Math.round(2600 * Q), () => { const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + rnd() * 60); return { p: [v.x, v.y, v.z], c: rnd() < .2 ? 0x9fc2ff : 0xffffff }; }, .25, 0xffffff, { opacity: .8, fog: false });
  scene.add(bg);
  const sunT = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: 0xffd68a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sunT.scale.setScalar(3.2); scene.add(sunT);
  const core = new THREE.Mesh(new THREE.SphereGeometry(.45, 32, 16), new THREE.MeshBasicMaterial({ color: 0xfff3d6 })); scene.add(core);
  const P = [0xff3b2e, 0x35e0c2, 0xc99bff, 0xb9bec6].map((c, i) => {
    const r = 3 + i * 1.3, tilt = (i - 1.5) * .18;
    const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 96 }, (_, k) => new THREE.Vector3(Math.cos(k / 96 * Math.PI * 2) * r, 0, Math.sin(k / 96 * Math.PI * 2) * r))), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: .28 }));
    orbit.rotation.x = tilt; scene.add(orbit);
    const pl = new THREE.Mesh(new THREE.SphereGeometry(.26, 24, 12), new THREE.MeshBasicMaterial({ color: c })); scene.add(pl);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: c, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.setScalar(isMobile ? .8 : 1.1); scene.add(halo);
    return { r, tilt, pl, halo, ph: i * 1.6, sp: .32 - i * .05 };
  });
  const hex = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(hexPts(8.2, 0).map(([x, z]) => new THREE.Vector3(x, 0, z))), new THREE.LineBasicMaterial({ color: 0xe3c47e, transparent: true, opacity: .35 }));
  scene.add(hex);
  function update({ p, time }) {
    P.forEach(o => { const a = o.ph + time * o.sp; const v = new THREE.Vector3(Math.cos(a) * o.r, 0, Math.sin(a) * o.r).applyAxisAngle(new THREE.Vector3(1, 0, 0), o.tilt); o.pl.position.copy(v); o.halo.position.copy(v); });
    hex.rotation.y = time * .05; bg.rotation.y = time * .006;
    const a = -.6 + p * 1.2, d = camera.aspect < 1 ? 22 : 15; camera.fov = 50; camera.position.set(Math.sin(a) * d, 5.5 - p * 3, Math.cos(a) * d); camera.lookAt(0, 0, 0);
  }
  return { scene, update, dark: true };
})();

// 9 會員：金庫展示間，反光的六角磚地板、聚光燈打在台座上、金色微塵往上飄
W.vault = (() => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x040302); scene.fog = new THREE.Fog(0x040302, 8, 40); scene.environment = envTex;
  const tileGeo = new THREE.CylinderGeometry(.98, .98, .2, 6), n = isMobile ? 9 : 13, tiles = [];
  for (let q = -n; q <= n; q++) for (let r = -n; r <= n; r++) { const x = 1.5 * q, z = Math.sqrt(3) * (r + q / 2); if (x * x + z * z < 260) tiles.push([x, z]); }
  const floor = new THREE.InstancedMesh(tileGeo, new THREE.MeshStandardMaterial({ color: 0x15120c, metalness: .9, roughness: .32, envMapIntensity: .5 }), tiles.length);
  const M = new THREE.Matrix4(), qq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 6, 0));
  tiles.forEach(([x, z], i) => { M.compose(new THREE.Vector3(x, -2.6 - rnd() * .04, z), qq, new THREE.Vector3(1, 1, 1)); floor.setMatrixAt(i, M); });
  scene.add(floor);
  scene.add(new THREE.AmbientLight(0x2a2010, .8));
  const spot = new THREE.SpotLight(0xffe2a8, 260, 30, .42, .5, 1.4); spot.position.set(0, 12, 2); spot.target.position.set(0, -2.5, 0); scene.add(spot, spot.target);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.1, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x1d1810, metalness: 1, roughness: .25 })); ped.position.y = -1.9; scene.add(ped);
  const pedEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(1.8, 2.1, 1.2, 6)), new THREE.LineBasicMaterial({ color: 0xd6b465 })); pedEdge.position.copy(ped.position); scene.add(pedEdge);
  const coneGeo = new THREE.ConeGeometry(3.4, 14, 48, 1, true); coneGeo.translate(0, -7, 0);
  const cone = new THREE.Mesh(coneGeo, beamMat(0xffdca0, .26)); cone.position.set(0, 12, 0); cone.rotation.x = Math.PI; cone.rotation.x = 0; scene.add(cone);
  const door = new THREE.Mesh(hexFrameGeo(9, .3), new THREE.MeshStandardMaterial({ color: 0x8a6a28, metalness: 1, roughness: .3, side: THREE.DoubleSide })); door.position.set(0, 4, -14); scene.add(door);
  const door2 = new THREE.Mesh(hexFrameGeo(7.6, .12), new THREE.MeshBasicMaterial({ color: 0x5a4518, side: THREE.DoubleSide })); door2.position.set(0, 4, -13.9); scene.add(door2);
  const gold = points(Math.round(700 * Q), () => ({ p: [(rnd() - .5) * 18, -2.5 + rnd() * 12, (rnd() - .5) * 14] }), .07, 0xf1cf7f, { opacity: .85 });
  scene.add(gold);
  const base = gold.geometry.attributes.position.array.slice();
  function update({ p, time }) {
    const a = gold.geometry.attributes.position.array;
    for (let i = 0; i < a.length; i += 3) { a[i + 1] = -2.5 + ((base[i + 1] + 2.5 + time * .35) % 12); }
    gold.geometry.attributes.position.needsUpdate = true;
    door.rotation.z = time * .05; door2.rotation.z = -time * .08;
    const ang = -.5 + p * 1; camera.fov = 50; camera.position.set(Math.sin(ang) * 9, 1.2 + p * .8, Math.cos(ang) * 9); camera.lookAt(0, 0, 0);
  }
  return { scene, update, dark: true };
})();

// ---------- 排程：每一段對應一個世界 ----------
const segs = Array.from(document.querySelectorAll("[data-world]"));
const txs = Array.from(document.querySelectorAll("[data-tx]"));
let active = null, intro = null;
function resize() {
  const w = innerWidth, h = Math.max(innerHeight, document.documentElement.clientHeight);
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener("resize", resize); resize();

// 目前畫面中線在哪一段：在某段裡就是那個世界；在轉場區就看轉場進度過一半沒
function pick() {
  const mid = innerHeight / 2;
  for (const el of txs) {
    const r = el.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) { const q = clamp((mid - r.top) / r.height, 0, 1); return { world: q < .5 ? el.dataset.from : el.dataset.to, p: q < .5 ? 1 : 0, tx: el, q }; }
  }
  for (const el of segs) {
    const r = el.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) return { world: el.dataset.world, p: clamp((innerHeight - r.top) / (r.height + innerHeight), 0, 1), el };
  }
  return { world: "bh", p: 0 };
}
const t0 = performance.now();
let lastWorld = "";
function frame(now) {
  requestAnimationFrame(frame);
  const time = reduce ? 3 : (now - t0) / 1000;
  if (intro) {
    const t = (now - intro.start) / 1000;
    W.logo.update({ mode: "intro", t: Math.min(t, 2.4), time });
    renderer.render(W.logo.scene, camera);
    if (t > 2.4 || intro.skip) { intro.done(); intro = null; }
    return;
  }
  const s = pick();
  window.OXW = s;
  if (s.world !== lastWorld) { lastWorld = s.world; document.documentElement.dataset.world = s.world; dispatchEvent(new CustomEvent("oxworld", { detail: s.world })); }
  if (s.world === "bh" || !W[s.world === "outro" ? "logo" : s.world]) { canvas.style.visibility = "hidden"; return; }
  canvas.style.visibility = "visible";
  const w = s.world === "outro" ? W.logo : W[s.world];
  // 同一段裡的進度要接得上：轉場區前半拿上一段的結尾，後半拿下一段的開頭
  let p = s.p;
  if (s.el) { const r = s.el.getBoundingClientRect(); p = clamp((innerHeight - r.top) / (r.height + innerHeight), 0, 1); }
  if (s.world === "outro") w.update({ mode: "outro", p, time }); else w.update({ p, time });
  camera.updateProjectionMatrix();
  renderer.render(w.scene, camera);
}

// 開場：logo 兩半飛進來合上、拉遠（第一次來才播；看過的直接進）
function runIntro() {
  let seen = false; try { seen = localStorage.getItem("ox-intro") === "1"; } catch (e) { }
  if (reduce || seen || location.hash || new URLSearchParams(location.search).has("nointro")) return;
  const root = document.documentElement; root.classList.add("intro");
  const skip = document.querySelector(".intro-skip");
  intro = { start: performance.now(), skip: false, done() { root.classList.add("intro-out"); setTimeout(() => root.classList.remove("intro", "intro-out"), 700); try { localStorage.setItem("ox-intro", "1"); } catch (e) { } dispatchEvent(new Event("oxintrodone")); } };
  if (skip) skip.addEventListener("click", () => { if (intro) intro.skip = true; });
}
runIntro();
requestAnimationFrame(frame);
