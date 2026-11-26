/* OX 官網第一屏：寫實黑洞＋星系。
   整個畫面是一支片段著色器：每個像素射一條光線，照史瓦西黑洞的光線彎曲一步步走（單位：事件視界半徑＝1），
   碰到吸積盤就疊上盤的顏色，逃出去就取背景星空（銀河帶＋星星），掉進去就是黑的。所以星空和盤都會被重力透鏡扭曲。
   往下滑：鏡頭往黑洞靠近，最後穿進事件視界，畫面全黑，接到下一段。
   前面再疊一層 2D 金色微塵，跟著鏡頭一起往前飛。 */
(function () {
  "use strict";
  const stage = document.querySelector(".hero"), cv = document.getElementById("bh"), dust = document.getElementById("dust");
  if (!stage || !cv) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = matchMedia("(pointer: coarse)").matches || Math.min(screen.width, screen.height) < 700;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
  const FS = `
precision highp float;
uniform vec2 uRes; uniform float uTime, uDist, uSteps, uRoll, uAz, uEl, uFocal, uExpo;
float hash3(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm3(vec3 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * n3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= .5; } return v; }

// 星星：兩層，方向空間切格子，每格一顆
vec3 stars(vec3 d, float pix){
  vec3 col = vec3(0.);
  for (int L = 0; L < 2; L++) {
    float S = L == 0 ? 55. : 130.;
    vec3 c = floor(d * S);
    float h = hash3(c + float(L) * 17.31);
    vec3 sd = normalize(c + .3 + .4 * vec3(hash3(c + 1.3), hash3(c + 2.7), hash3(c + 4.1)));
    float ang = length(cross(d, sd));
    float br = L == 0 ? pow(smoothstep(.88, 1., h), 3.) * 2.4 : pow(smoothstep(.93, 1., h), 2.) * .55;
    float w = pix * (L == 0 ? 1.05 : .8);
    vec3 tint = mix(vec3(1., .86, .66), vec3(.78, .86, 1.), hash3(c + 9.1));
    col += tint * br * exp(-ang * ang / (w * w));
  }
  return col;
}
// 背景：很暗的深藍底＋一條銀河帶（有暗塵帶）＋偏暖的銀河中心
vec3 sky(vec3 d, float pix){
  vec3 n = normalize(vec3(.32, .86, .4));
  float lat = dot(d, n);
  float band = exp(-lat * lat / .022);
  vec3 cdir = normalize(vec3(-.75, .18, -.62));
  float core = exp(-(1. - dot(d, cdir)) * 5.5);
  float dustv = fbm3(d * 4.2 + 2.);
  float fine = fbm3(d * 13. + 7.);
  float lanes = smoothstep(.42, .62, dustv);
  float glow = band * (.35 + .9 * fine) * (1. - .8 * lanes);
  vec3 col = vec3(.006, .009, .018);
  col += glow * vec3(.055, .062, .082);
  col += core * band * (1. - .7 * lanes) * vec3(.16, .12, .08);
  col += stars(d, pix) * (.4 + .7 * band);
  return col;
}
// 吸積盤：內緣 2.6、外緣 13；越裡面越亮越白，外面是暗金；紋路順著軌道拉長、內圈轉得快
vec4 disk(vec3 p, vec3 rd){
  float r = length(p.xz);
  float rIn = 2.6, rOut = 13.;
  if (r < rIn || r > rOut) return vec4(0.);
  float x = (r - rIn) / (rOut - rIn);
  float om = 2.2 * pow(r, -1.5);
  float a = atan(p.z, p.x) + uTime * om;
  vec3 q = vec3(cos(a) * 2.2, sin(a) * 2.2, r * 1.9);
  float t1 = fbm3(q + vec3(0., 0., uTime * .02));
  float t2 = fbm3(vec3(cos(a) * 6., sin(a) * 6., r * 7.));
  float tex = .45 + .75 * t1 * (.6 + .6 * t2);
  float heat = pow(rIn / r, 1.35);
  float edge = smoothstep(0., .035, x) * (1. - smoothstep(.55, 1., x));
  // 都卜勒：朝鏡頭轉過來那半邊亮一點（收斂，不要太誇張）
  vec3 vt = normalize(vec3(-p.z, 0., p.x));
  float beta = sqrt(.5 / r);
  float dop = 1. / (1. - beta * dot(vt, -rd) * .85);
  float I = heat * edge * tex * pow(dop, 2.6);
  vec3 cold = vec3(.42, .24, .085), warm = vec3(.98, .72, .36), hot = vec3(1., .95, .84);
  vec3 col = mix(cold, warm, smoothstep(.05, .55, heat * dop));
  col = mix(col, hot, smoothstep(.55, 1.25, heat * dop));
  float alpha = clamp(I * 1.15, 0., 1.) * edge;
  return vec4(col * I * 1.6, alpha);
}
void main(){
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / min(uRes.x, uRes.y);
  float cr = cos(uRoll), sr = sin(uRoll);
  uv = vec2(cr * uv.x - sr * uv.y, sr * uv.x + cr * uv.y);
  vec3 cam = uDist * vec3(cos(uEl) * sin(uAz), sin(uEl), cos(uEl) * cos(uAz));
  vec3 fw = normalize(-cam), rt = normalize(cross(fw, vec3(0., 1., 0.))), up = cross(rt, fw);
  vec3 rd = normalize(fw * uFocal + uv.x * rt + uv.y * up);
  float pix = 1. / (uFocal * min(uRes.x, uRes.y));

  vec3 pos = cam, vel = rd;
  vec3 h = cross(pos, vel); float h2 = dot(h, h);
  vec3 col = vec3(0.); float acc = 0.; bool hole = uDist < 1.;
  float far = max(uDist * 2.5, 48.);
  for (int i = 0; i < 260; i++) {
    if (float(i) >= uSteps || hole || acc > .995) break;
    float r2 = dot(pos, pos), r = sqrt(r2);
    float dt = clamp(.065 * r, .03, 3.);
    vec3 prev = pos;
    // 蛙跳法（半步速度、整步位置、半步速度）：比單純一步一步走穩，星空才不會出現一圈圈的接縫
    vel += -.75 * h2 * pos / (r2 * r2 * r) * dt;
    pos += vel * dt;
    r2 = dot(pos, pos); r = sqrt(r2);
    vel += -.75 * h2 * pos / (r2 * r2 * r) * dt;
    if (prev.y * pos.y < 0.) {
      vec3 hp = mix(prev, pos, prev.y / (prev.y - pos.y));
      vec4 d = disk(hp, normalize(vel));
      col += (1. - acc) * d.rgb; acc += (1. - acc) * d.a;
    }
    // 光子球附近一圈很淡的光（不做大光斑）
    col += (1. - acc) * vec3(1., .82, .55) * .010 * exp(-pow((r - 1.55) * 3.2, 2.)) * dt;
    if (dot(pos, pos) < 1.) hole = true;
    if (r > far && dot(pos, vel) > 0.) break;
  }
  if (!hole) col += (1. - acc) * sky(normalize(vel), pix);
  col = 1. - exp(-col * uExpo);
  col = pow(col, vec3(.92));
  gl_FragColor = vec4(col, 1.);
}`;

  const gl = cv.getContext("webgl", { antialias: false, alpha: false, depth: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
  if (!gl) { stage.classList.add("no-gl"); return; }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  let prog, U = {};
  function build() {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.bindAttribLocation(prog, 0, "p"); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    ["uRes", "uTime", "uDist", "uSteps", "uRoll", "uAz", "uEl", "uFocal", "uExpo"].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  }
  try { build(); } catch (e) { console.warn(e); stage.classList.add("no-gl"); return; }
  cv.addEventListener("webglcontextlost", e => { e.preventDefault(); lost = true; }, false);
  cv.addEventListener("webglcontextrestored", () => { lost = false; try { build(); } catch (e) { } }, false);
  let lost = false;

  // 解析度：照像素預算定，一開始定好就不再改（Windows 的 WebKit 中途改畫布大小會整片變黑）
  const q = new URLSearchParams(location.search);
  const budget = +(q.get("px") || (isMobile ? 330000 : 1000000));
  let steps = +(q.get("steps") || (isMobile ? 150 : 220));
  let W = 0, H = 0, cssW = 0, cssH = 0;
  function size() {
    const r = cv.getBoundingClientRect(); cssW = r.width; cssH = r.height;
    if (W && Math.abs(cssW * cssH - lastArea) / lastArea < .25) return;   // 手機網址列伸縮不重設
    const k = Math.min(window.devicePixelRatio || 1, Math.sqrt(budget / (cssW * cssH)));
    W = Math.round(cssW * k); H = Math.round(cssH * k); cv.width = W; cv.height = H; lastArea = cssW * cssH;
    gl.viewport(0, 0, W, H);
    sizeDust();
  }
  let lastArea = 1;

  // 2D 金色微塵：一團薄薄的盤狀分布在黑洞周圍，慢慢繞；用同一支鏡頭投影，鏡頭往前時從身邊飛過
  const dg = dust.getContext("2d");
  const N = isMobile ? 110 : 180, P = [];
  for (let i = 0; i < N; i++) {
    const r = 3.5 + Math.pow(Math.random(), .7) * 26, a = Math.random() * Math.PI * 2;
    P.push({ r, a, y: (Math.random() - .5) * (0.6 + r * .12), s: .5 + Math.random() * 1.1, tw: Math.random() * 6.28, w: .7 + Math.random() * .6 });
  }
  let dW = 0, dH = 0;
  function sizeDust() { const d = Math.min(window.devicePixelRatio || 1, 2); dW = cssW; dH = cssH; dust.width = Math.round(cssW * d); dust.height = Math.round(cssH * d); dg.setTransform(d, 0, 0, d, 0, 0); }

  // 鏡頭
  const portrait = () => cssH > cssW * 1.05;
  let prog01 = 0, mx = 0, my = 0, smx = 0, smy = 0;
  addEventListener("pointermove", e => { if (e.pointerType === "mouse") { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; } }, { passive: true });
  function camAt(p, t) {
    const e = smooth(p);
    // 前 80% 從遠處慢慢飛近（15 → 6.5，光環一直在畫面裡），最後 20% 才衝進去穿過視界（6.5 → 0.9），不要太早全黑
    const a = smooth(p / .8), b = clamp((p - .8) / .2, 0, 1);
    const dist = p < .8 ? 15 * Math.pow(6.5 / 15, a) : 6.5 * Math.pow(0.9 / 6.5, Math.pow(b, 1.6));
    const el = .12 + .1 * e + smy * .04;                                     // 越靠近越往下看一點
    const az = .35 + t * .006 + smx * .08 + e * .5;
    const roll = (portrait() ? -.16 : -.2) * (1 - .6 * e);
    const focal = (portrait() ? 1.08 : .92) * (1 - .38 * smooth((p - .45) / .5));   // 越近鏡頭越廣，光環留在畫面裡
    return { dist, el, az, roll, focal };
  }
  function drawDust(c, t, p) {
    dg.clearRect(0, 0, dW, dH);
    if (p > .985) return;
    const cam = [c.dist * Math.cos(c.el) * Math.sin(c.az), c.dist * Math.sin(c.el), c.dist * Math.cos(c.el) * Math.cos(c.az)];
    const fl = Math.hypot(...cam), fw = cam.map(v => -v / fl);
    let rt = [fw[2], 0, -fw[0]]; const rl = Math.hypot(...rt); rt = rt.map(v => v / rl);       // cross(fw, up)
    const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
    const m = Math.min(dW, dH), cr = Math.cos(-c.roll), sr = Math.sin(-c.roll);
    const fade = 1 - smooth((p - .8) / .18);
    for (const d of P) {
      const a = d.a + t * .9 * Math.pow(d.r, -1.5) * 2.2;
      const w = [Math.cos(a) * d.r - cam[0], d.y - cam[1], Math.sin(a) * d.r - cam[2]];
      const z = w[0] * fw[0] + w[1] * fw[1] + w[2] * fw[2]; if (z < .3) continue;
      let x = (w[0] * rt[0] + w[1] * rt[1] + w[2] * rt[2]) / z * c.focal, y = (w[0] * up[0] + w[1] * up[1] + w[2] * up[2]) / z * c.focal;
      const xr = cr * x - sr * y, yr = sr * x + cr * y;
      const sx = dW / 2 + xr * m, sy = dH / 2 - yr * m;
      if (sx < -20 || sx > dW + 20 || sy < -20 || sy > dH + 20) continue;
      const size = clamp(d.s * 6 / z, .35, 2.6), al = clamp(.75 / Math.sqrt(z * .35), 0, .85) * (.6 + .4 * Math.sin(t * d.w + d.tw)) * fade;
      dg.globalAlpha = al; dg.fillStyle = "#e9c987";
      dg.beginPath(); dg.arc(sx, sy, size, 0, 6.2832); dg.fill();
    }
    dg.globalAlpha = 1;
  }

  // 滑動進度：.hero 外層很長、裡面的 .hero-stage 釘住
  function progress() { const r = stage.getBoundingClientRect(), span = r.height - innerHeight; return clamp(-r.top / Math.max(1, span), 0, 1); }
  const word = document.querySelector(".hero-word"), hint = document.querySelector(".hero-hint"), veil = document.querySelector(".hero-veil");
  let visible = true, t0 = performance.now(), slow = 0, frames = 0;
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: "100px" }).observe(stage);
  let raf = 0;
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    if (!W) size();
    const t = reduce ? 8 : (now - t0) / 1000;
    prog01 += (progress() - prog01) * (reduce ? 1 : .18);
    smx += (mx - smx) * .04; smy += (my - smy) * .04;
    const p = prog01, c = camAt(p, t);
    if (!lost) {
      gl.uniform2f(U.uRes, W, H); gl.uniform1f(U.uTime, t); gl.uniform1f(U.uDist, c.dist);
      gl.uniform1f(U.uSteps, steps); gl.uniform1f(U.uRoll, c.roll); gl.uniform1f(U.uAz, c.az); gl.uniform1f(U.uEl, c.el);
      gl.uniform1f(U.uFocal, c.focal); gl.uniform1f(U.uExpo, 1.1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    drawDust(c, t, p);
    // 字：一開始就在；往下滑放大、變淡、微微模糊（Apple 那種）
    const wf = smooth(p / .16);
    word.style.opacity = (1 - wf).toFixed(3);
    word.style.transform = `translate(-50%, -50%) scale(${(1 + wf * .14).toFixed(4)})`;
    word.style.filter = wf > .01 ? `blur(${(wf * 6).toFixed(2)}px)` : "none";
    hint.style.opacity = (1 - smooth(p / .05)).toFixed(3);
    veil.style.opacity = smooth((p - .94) / .055).toFixed(3);
    document.documentElement.classList.toggle("past-hero", p > .97);
    // 太慢就少走幾步（只降步數，不改畫布大小）
    if (!reduce && frames++ > 20) { const dtm = now - (frame.last || now); if (dtm > 30) slow++; else slow = Math.max(0, slow - 1); if (slow > 25 && steps > 90) { steps -= 25; slow = 0; } }
    frame.last = now;
    if (!reduce) kick(); else if (visible) setTimeout(kick, 120);
  }
  addEventListener("resize", () => { size(); kick(); });
  addEventListener("scroll", kick, { passive: true });
  document.addEventListener("visibilitychange", kick);
  size(); kick();
  window.OXBH = { camAt, progress };
})();
