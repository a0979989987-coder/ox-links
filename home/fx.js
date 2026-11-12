/* OX 會員首頁的粒子引擎：星系、五股光纏成一條往下流再落成五張老師卡、手指撥星塵、整個星系被吸進黑卡；
   背景跟著三個世界換：宇宙 → 黑底白光 → 白金（白金那一頁只留金色的微塵）。
   純 WebGL，不用 three。粒子怎麼動全部在頂點著色器裡算，手機也跑得動上萬顆。
   對外：window.OXFX = { ok, p1, suck(on), pause(b), burst(), setWorld(light, instant), relayout() } */
(function () {
  "use strict";
  const canvas = document.getElementById("fx");
  const FX = (window.OXFX = { ok: false, p1: 0, suck() { return Promise.resolve(); }, pause() {}, burst() {}, setWorld() {}, relayout() {} });
  if (!canvas) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let gl = null;
  try { gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance" }); } catch (e) { gl = null; }
  if (!gl) { document.documentElement.classList.add("no-gl"); return; }

  const D = window.OXH, qs = new URLSearchParams(location.search);
  const FOV = 40, CAMZ = 60, F = 1 / Math.tan(FOV * Math.PI / 360);
  const HW0 = 2 * CAMZ / F;                       // z＝0 那個平面看得到的世界高度
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hex3 = h => { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

  // 固定種子：每次打開星系長得一樣
  let seed = 20261112;
  const rand = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = () => { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * v); };
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const pick = list => list[Math.floor(rand() * list.length)];

  // ---------- 粒子資料 ----------
  const phone = Math.min(innerWidth, innerHeight) <= 760;
  const NG = +qs.get("n") || (phone ? 22000 : 46000);      // 星系
  const ND = phone ? 2400 : 5000;                           // 滿畫面的遠星
  const N = NG + ND, STRIDE = 16;
  const buf = new Float32Array(N * STRIDE);
  const put = (i, a0, a1, a2, a3) => { const o = i * STRIDE; buf.set(a0, o); buf.set(a1, o + 4); buf.set(a2, o + 8); buf.set(a3, o + 12); };

  (function build() {
    // 金色為主，外圈帶 logo 的藍；雲是彩色的星雲
    const core = [[1, 0.96, 0.84], [1, 0.86, 0.6]], inner = [[1, 0.86, 0.55], [0.95, 0.76, 0.4], [1, 0.93, 0.78]];
    const outerGold = [[0.96, 0.8, 0.45], [0.86, 0.67, 0.33], [1, 0.9, 0.66]], outerBlue = [[0.14, 0.65, 0.92], [0.42, 0.76, 1], [0.62, 0.84, 1]];
    const cloud = [[0.25, 0.4, 1], [0.6, 0.3, 0.95], [1, 0.4, 0.65], [1, 0.75, 0.4], [0.14, 0.65, 0.92]];
    const blobs = [[-0.25, 0.1], [0.3, -0.05], [0.05, 0.25], [-0.1, -0.25], [0.4, 0.3]];
    const pitch = 0.27;
    // 大部分的星很暗很小，少數幾顆特別亮：這樣才有層次，不會整片像亮粉
    const dim = () => 0.1 + 0.5 * Math.pow(rand(), 2.4);
    for (let i = 0; i < NG; i++) {
      const u = rand();
      let r, th, h, w, c, sz, al, kind = 0;
      if (u < 0.1) {                       // 星雲的雲：大顆、很淡
        const b = Math.floor(rand() * 5), x = blobs[b][0] * 1.6 + gauss() * 0.26, y = blobs[b][1] * 1.6 + gauss() * 0.19;
        r = Math.hypot(x, y); th = Math.atan2(y, x); h = gauss() * 0.05; w = 0.012 + rand() * 0.01;
        c = cloud[b]; sz = 1.1 + rand() * 2.0; al = 0.04 + rand() * 0.06; kind = 1;
      } else {
        const v = (u - 0.1) / 0.9;
        if (v < 0.16) {                    // 核心
          r = 0.15 * Math.abs(gauss()); th = rand() * 6.2832; h = gauss() * 0.05;
          c = mix3(core[0], core[1], rand()); sz = 0.14 + rand() * 0.22; al = 0.08 + rand() * 0.2;
        } else if (v < 0.82) {             // 兩條旋臂
          const arm = rand() < 0.5 ? 0 : Math.PI;
          r = 0.08 + 0.92 * Math.pow(rand(), 0.85);
          th = arm + Math.log(r / 0.08) / pitch * 0.42 + gauss() * (0.16 + 0.13 * r); h = gauss() * 0.012;
          c = r < 0.4 ? pick(inner) : (rand() < 0.3 ? pick(outerBlue) : rand() < 0.2 ? [1, 1, 1] : pick(outerGold));
          sz = 0.06 + rand() * 0.1; al = dim();
          if (rand() < 0.05) { sz += 0.12 + rand() * 0.12; al = 0.7 + rand() * 0.3; }
        } else if (v < 0.87) {             // 旋臂上的亮星團
          const arm = rand() < 0.5 ? 0 : Math.PI, rr = 0.35 + rand() * 0.55;
          r = rr + gauss() * 0.02; th = arm + Math.log(rr / 0.08) / pitch * 0.42 + gauss() * 0.05; h = gauss() * 0.01;
          c = mix3(rand() < 0.5 ? [1, 0.66, 0.35] : [0.3, 0.72, 1], [1, 1, 1], rand() * 0.3); sz = 0.12 + rand() * 0.14; al = 0.4 + rand() * 0.4;
        } else {                           // 外圍散星
          r = Math.pow(rand(), 0.6) * 1.15; th = rand() * 6.2832; h = gauss() * 0.04;
          c = pick([[1, 1, 1], [0.78, 0.86, 1], [1, 0.9, 0.7]]); sz = 0.05 + rand() * 0.09; al = dim();
        }
        w = 0.06 * (1.25 - Math.min(r, 1.2));
      }
      put(i, [r, th, h, w], [c[0], c[1], c[2], al], [sz, rand(), rand(), rand()], [Math.floor(rand() * 5), rand(), rand(), kind]);
    }
    for (let i = NG; i < NG + ND; i++) {   // 遠星：x、y 是 -1～1，著色器再乘上畫面大小
      const c = pick([[1, 1, 1], [0.8, 0.87, 1], [1, 0.9, 0.7], [0.96, 0.8, 0.45]]), big = rand() < 0.05;
      put(i, [rand() * 2 - 1, rand() * 2 - 1, -62 + rand() * 78, rand() * 6.2832], [c[0], c[1], c[2], 0.2 + rand() * 0.5], [(big ? 0.2 : 0.06) + rand() * 0.09, rand(), rand(), rand()], [0, 0, 0, 2]);
    }
  })();

  // ---------- 著色器 ----------
  const VS = `
  precision highp float;
  attribute vec4 a0, a1, a2, a3;
  uniform float uTime, uP1, uSuck, uPx, uScroll, uMaxPt, uBloom, uLight;
  uniform vec2 uView, uWH;
  uniform vec4 uGal;
  uniform vec4 uCard[5];
  uniform vec3 uCol[5];
  uniform float uRad[5];
  uniform vec3 uPtr;
  varying vec4 vCol;
  varying vec2 vFx;        // x：0＝星點、1＝柔的雲；y：十字星芒
  const float CAMZ = ${CAMZ.toFixed(1)};
  const float PI = 3.14159265;
  // 圓角方框邊上的一點：u 繞一圈 0～1，從上邊左端順時針走
  vec2 rr(float u, vec2 hf, float r) {
    r = min(r, min(hf.x, hf.y));
    float sx = 2.0 * (hf.x - r), sy = 2.0 * (hf.y - r), arc = 1.5707963 * r;
    float d = u * (2.0 * (sx + sy) + 4.0 * arc), q = max(r, 0.0001);
    if (d < sx) return vec2(-hf.x + r + d, hf.y);
    d -= sx;
    if (d < arc) return vec2(hf.x - r + sin(d / q) * r, hf.y - r + cos(d / q) * r);
    d -= arc;
    if (d < sy) return vec2(hf.x, hf.y - r - d);
    d -= sy;
    if (d < arc) return vec2(hf.x - r + cos(d / q) * r, -hf.y + r - sin(d / q) * r);
    d -= arc;
    if (d < sx) return vec2(hf.x - r - d, -hf.y);
    d -= sx;
    if (d < arc) return vec2(-hf.x + r - sin(d / q) * r, -hf.y + r - cos(d / q) * r);
    d -= arc;
    if (d < sy) return vec2(-hf.x, -hf.y + r + d);
    d -= sy;
    return vec2(-hf.x + r - cos(d / q) * r, hf.y - r + sin(d / q) * r);
  }
  void main() {
    float kind = a3.w, al = a1.a, size = a2.x, soft = 0.0, spike = 0.0;
    vec3 col = a1.rgb, p;
    if (kind < 1.5) {
      float R = uGal.z, rr0 = a0.x * R, th = a0.y + uTime * a0.w, h = a0.z * R;
      // 被吸進大格子：往核心螺旋收進去
      float pull = clamp(uSuck * 1.4 - a2.y * 0.4, 0.0, 1.0);
      pull = pull * pull * (3.0 - 2.0 * pull);
      rr0 *= 1.0 - pull * 0.985; th += pull * (5.5 - 3.5 * a0.x); h *= 1.0 - pull;
      vec3 g = vec3(cos(th) * rr0, h, sin(th) * rr0);
      float y1 = g.y * 0.4357 - g.z * 0.9001, z1 = g.y * 0.9001 + g.z * 0.4357;   // 傾斜 1.12
      float cr = cos(uGal.w), sr = sin(uGal.w);
      vec3 gp = vec3(uGal.x + g.x * cr - y1 * sr, uGal.y + g.x * sr + y1 * cr, z1);
      float wrap = 0.0;
      if (kind > 0.5) {                                        // 雲不飛，原地淡掉
        p = gp; soft = 1.0;
        al *= (1.0 - smoothstep(0.0, 0.3, uP1)) * (1.0 - pull);
      } else if (a3.z < 0.76) {                                // 飛去自己那張卡
        int gi = int(a3.x + 0.5);
        vec4 card = uCard[gi];
        float e = clamp((uP1 - a2.y * 0.58) / 0.42, 0.0, 1.0);
        float gather = smoothstep(0.0, 0.3, e), s = smoothstep(0.06, 0.94, e);
        wrap = smoothstep(0.8, 1.0, e);
        // 五股光像麻花一樣纏在一起，從星系中心一路流到卡片
        vec2 dir = normalize(card.xy - uGal.xy + vec2(0.0001)), nr = vec2(-dir.y, dir.x);
        float amp = 0.3 + 1.5 * sin(PI * s);
        float tw = s * 13.8 + a3.x * 1.2566 - uTime * 0.9;
        float sway = sin(s * 3.6 - uTime * 0.35) * 0.9 * sin(PI * s);
        vec3 rope = vec3(mix(uGal.xy, card.xy, s) + nr * (amp * sin(tw) + sway + (a2.z - 0.5) * 0.55), amp * cos(tw) * 2.2 + (a2.w - 0.5) * 0.8);
        // 到了就沿著卡片的邊框流
        float flow = fract(a3.y + uTime * (0.008 + 0.014 * a2.z));
        float lane = a2.w * a2.w * 0.26;
        vec3 edge = vec3(card.xy + rr(flow, card.zw + lane, uRad[gi] + lane), 0.0);
        p = mix(mix(gp, rope, gather), edge, wrap);
        col = mix(col, uCol[gi], smoothstep(0.04, 0.36, e));
        float head = pow(fract(flow * 2.0 - uTime * 0.07), 6.0);
        al *= mix(1.0 + 0.9 * sin(PI * s), 0.3 + 1.4 * head, wrap);
        size *= mix(1.0 + 0.25 * sin(PI * s), 0.7 + 0.7 * head, wrap);
      } else {                                                 // 剩下的往外散，變成黑底上的微塵
        float e = clamp((uP1 - a2.y * 0.3) / 0.5, 0.0, 1.0);
        e = e * e * (3.0 - 2.0 * e);
        p = vec3(uGal.xy + (gp.xy - uGal.xy) * (1.0 + e * 1.5), gp.z - e * 22.0);
        al *= mix(1.0, 0.2, e);
        col = mix(col, vec3(0.9, 0.93, 1.0), e * 0.7);
      }
      if (kind < 0.5) {
        // 離焦平面遠的星糊一點、大一點：有景深，不會整片一樣銳利
        float blur = clamp(abs(p.z) / 13.0, 0.0, 1.0) * (1.0 - wrap);
        size *= 1.0 + blur * 1.7; al /= 1.0 + blur * blur * 3.2; soft = blur * 0.85;
        // 少數幾顆特別亮的星帶十字星芒，會慢慢眨
        spike = step(0.984, a2.w) * step(0.6, a1.a) * (1.0 - wrap) * (1.0 - pull);
        size *= 1.0 + spike * 2.4;
        al *= 1.0 + spike * (0.25 * sin(uTime * (0.8 + a2.z * 1.6) + a0.y * 9.0) - 0.1);
        al *= 1.0 + uBloom * 1.4 + pull * (1.0 - pull) * 7.0;
        size *= 1.0 + pull * (1.0 - pull) * 1.6;
      }
    } else {                                                   // 遠星：滑動時有視差，會眨；到了白金那一頁變成金色的微塵
      float z = a0.z, k = (CAMZ - z) / CAMZ * 1.12;
      float span = uWH.y * 0.5 * k;
      float yy = mod(a0.y * span + uScroll * (0.22 + 0.5 * a2.y) + span, 2.0 * span) - span;
      p = vec3(a0.x * uWH.x * 0.5 * k, yy, z);
      al *= 0.5 + 0.5 * sin(uTime * (0.5 + a2.z * 1.5) + a0.w);
      col = mix(col, mix(vec3(0.76, 0.6, 0.24), vec3(0.55, 0.44, 0.18), a2.w), uLight);
      al *= mix(1.0, 0.75, uLight); size *= mix(1.0, 1.5, uLight);
    }
    // 手指把星塵撥開
    vec2 dp = p.xy - uPtr.xy;
    p.xy += normalize(dp + vec2(0.0001)) * uPtr.z * exp(-dot(dp, dp) / 12.0) * 2.4;
    float w = CAMZ - p.z;
    gl_Position = vec4(p.x * uView.x, p.y * uView.y, 0.0, w);
    gl_PointSize = clamp(size * uPx * CAMZ / w, 1.0, uMaxPt);
    vCol = vec4(col, al);
    vFx = vec2(soft, spike);
  }`;
  const FS = `
  precision mediump float;
  varying vec4 vCol;
  varying vec2 vFx;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float d = dot(q, q) * 4.0;
    if (d > 1.0) discard;
    float a = mix(exp(-d * 4.2), (1.0 - d) * (1.0 - d), vFx.x);
    if (vFx.y > 0.01) {
      vec2 s = abs(q);
      float ray = exp(-s.y * 44.0) * exp(-s.x * 5.5) + exp(-s.x * 44.0) * exp(-s.y * 5.5);
      a = (exp(-d * 30.0) + ray * 0.75) * (1.0 - smoothstep(0.6, 1.0, d));
    }
    a *= vCol.a;
    gl_FragColor = vec4(vCol.rgb * a, a);
  }`;
  const QUAD_VS = `attribute vec2 aP; void main() { gl_Position = vec4(aP, 0.0, 1.0); }`;
  const HP = `#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n`;
  // 小張的星雲底圖（每兩格畫一次，再放大鋪滿）
  const NEB_FS = HP + `
  uniform vec2 uRes; uniform float uTime, uRoll, uCore; uniform vec3 uG;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
  void main() {
    vec2 fc = gl_FragCoord.xy; float vy = fc.y / uRes.y;
    vec3 col = mix(vec3(0.012, 0.02, 0.046), vec3(0.036, 0.062, 0.115), vy);
    vec2 g = (fc - uG.xy) / uG.z;
    vec2 q = g * 1.08 + vec2(uTime * 0.012, -uTime * 0.008);
    float n1 = fbm(q * 1.2), n2 = fbm(q * 2.1 + 5.0), n3 = fbm(q * 0.7 - 3.0);
    vec3 c1 = mix(vec3(0.05, 0.12, 0.38), vec3(0.42, 0.12, 0.5), smoothstep(0.35, 0.75, n1));
    vec3 c2 = mix(c1, vec3(0.85, 0.3, 0.5), smoothstep(0.55, 0.85, n2) * 0.8);
    vec3 c3 = mix(c2, vec3(0.95, 0.72, 0.35), smoothstep(0.62, 0.9, n3) * 0.7);
    vec3 neb = c3 * smoothstep(0.3, 0.85, n1 * 0.6 + n2 * 0.4) * 0.7 * exp(-dot(g, g) * 0.2);
    neb *= 1.0 - smoothstep(0.55, 0.8, fbm(q * 3.0 + 11.0)) * 0.65;
    float cr = cos(uRoll), sr = sin(uRoll);
    vec2 gr = vec2(g.x * cr + g.y * sr, -g.x * sr + g.y * cr);
    float rg = length(vec2(gr.x, gr.y / 0.46));
    vec3 core = vec3(1.0, 0.86, 0.62) * (exp(-rg * rg * 9.0) * 0.5 + exp(-rg * 2.4) * 0.16) * uCore;
    gl_FragColor = vec4(col + neb + core, 1.0);
  }`;
  // 鋪到畫面上：宇宙 → 黑底白光
  const OUT_FS = HP + `
  uniform sampler2D uTex; uniform vec2 uRes; uniform float uDark, uTime, uFlash, uLight; uniform vec3 uT;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 c = texture2D(uTex, uv).rgb;
    vec2 v = uv - 0.5;
    c *= 1.0 - dot(v, v) * 0.5;
    vec2 t = (uv - vec2(0.5, 1.06)) * vec2(uRes.x / uRes.y, 1.0);
    vec3 k = vec3(0.036, 0.039, 0.047) + vec3(0.05, 0.052, 0.056) * exp(-dot(t, t) * 3.2);
    c = mix(c, k, uDark);
    vec2 f = (gl_FragCoord.xy - uT.xy) / uT.z;
    c += vec3(1.0, 0.9, 0.72) * uFlash * exp(-dot(f, f) * 1.6);
    // 白金：米白往下帶一點金，兩團很淡的金光慢慢移
    vec3 L = mix(vec3(0.953, 0.925, 0.851), vec3(0.988, 0.976, 0.949), uv.y);
    vec2 as = vec2(uRes.x / uRes.y, 1.0);
    vec2 g1 = (uv - vec2(0.16 + 0.05 * sin(uTime * 0.11), 0.82)) * as, g2 = (uv - vec2(0.88, 0.22 + 0.04 * cos(uTime * 0.09))) * as;
    L = mix(L, vec3(0.992, 0.905, 0.69), 0.26 * exp(-dot(g1, g1) * 2.6) + 0.2 * exp(-dot(g2, g2) * 3.4));
    c = mix(c, L, uLight);
    c += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;
    gl_FragColor = vec4(c, 1.0);
  }`;

  function prog(vs, fs) {
    const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, ""); u[name] = gl.getUniformLocation(p, name); }
    return { p, u };
  }
  // GL 的東西集中在這裡建：手機把分頁丟到背景太久會把繪圖環境收走，回來要整套重建
  let P, NEB, OUT, vbo, quad, aLoc, qLocN, qLocO, maxPt, tex, fbo, fbW = 2, fbH = 2, glOK = false;
  function initGL() {
    P = prog(VS, FS); NEB = prog(QUAD_VS, NEB_FS); OUT = prog(QUAD_VS, OUT_FS);
    vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, buf, gl.STATIC_DRAW);
    quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    aLoc = [0, 1, 2, 3].map(i => gl.getAttribLocation(P.p, "a" + i));
    qLocN = gl.getAttribLocation(NEB.p, "aP"); qLocO = gl.getAttribLocation(OUT.p, "aP");
    maxPt = Math.min(160, gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1] || 64);
    tex = gl.createTexture(); fbo = gl.createFramebuffer();   // 星雲底圖的小畫布
    glOK = true;
  }
  try { initGL(); }
  catch (e) { console.warn("[fx]", e); document.documentElement.classList.add("no-gl"); return; }
  const root = document.documentElement;
  canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); glOK = false; root.classList.add("no-gl"); });
  canvas.addEventListener("webglcontextrestored", () => {
    try { initGL(); resize(); root.classList.remove("no-gl"); last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); }
    catch (e) { console.warn("[fx]", e); }
  });

  function sizeFbo(w, h) {
    fbW = Math.max(2, Math.round(w)); fbH = Math.max(2, Math.round(h));
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbW, fbH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // ---------- 版面：畫面座標 ↔ 世界座標 ----------
  const fixedDpr = +qs.get("dpr") || 0;            // 檢查用：?dpr=1.5 固定解析度、不自動降
  // Safari／iPhone 上不在中途改畫布解析度（Windows 版 WebKit 改完整片變黑，真機不賭），跑太慢只減粒子
  const ua = navigator.userAgent, webkitOnly = /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|Android/.test(ua);
  let W = 1, H = 1, dpr = 1, dprCap = fixedDpr || (phone ? 2 : 1.75), Ww = 1, Hw = HW0, pxU = 1, quality = 1;
  let cardEls = [], tileEl = null, teachTop = 1e9;
  const radFlat = new Float32Array(5);
  const radiusOf = el => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  function resize() {
    W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const cw = Math.round(W * dpr), ch = Math.round(H * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    Hw = HW0; Ww = Hw * W / H; pxU = H / Hw;
    sizeFbo(W / 2.4, H / 2.4);
    relayout();
    bgTick = 0;
  }
  // 大格子換樣式、字體載好之後，重新量一次位置和圓角
  function relayout() {
    tileEl = document.querySelector(".oh-hero .oh-card");
    cardEls = Array.from(document.querySelectorAll(".oh-tc")).slice(0, 5);
    const teach = document.getElementById("teachers");
    teachTop = teach ? teach.getBoundingClientRect().top + (window.scrollY || 0) : 1e9;
    cardEls.forEach((el, i) => { radFlat[i] = radiusOf(el) / pxU; });
  }
  const toWorld = r => [((r.left + r.width / 2) / W - 0.5) * Ww, (0.5 - (r.top + r.height / 2) / H) * Hw, r.width / W * Ww / 2, r.height / H * Hw / 2];

  // ---------- 狀態 ----------
  const S = { time: 0, p1: 0, suck: reduce ? 0 : 1, suckTo: 0, light: 0, lightTo: 0, bloom: 0, flash: 0, ptr: [0, 0, 0], ptrTo: 0, tilt: 0, paused: false, hidden: false, hold: -1 };
  const cols = (D ? D.teachers : []).slice(0, 5).map(t => hex3(t.color));
  while (cols.length < 5) cols.push([1, 0.85, 0.5]);
  const colFlat = new Float32Array(15); cols.forEach((c, i) => colFlat.set(c, i * 3));
  const cardFlat = new Float32Array(20), tileW = [0, 0, 6, 4], gal = [0, 0, 20, -0.62];
  let suckRes = null, bgTick = 0, last = performance.now(), slow = 0, frames = 0, raf = 0;

  FX.setWorld = (light, instant) => { S.lightTo = light ? 1 : 0; if (instant || reduce) S.light = S.lightTo; };
  FX.suck = on => new Promise(res => { S.suckTo = on ? 1 : 0; if (reduce) { S.suck = S.suckTo; res(); return; } if (suckRes) suckRes(); suckRes = res; });
  FX.pause = b => { S.paused = !!b; if (!b) { last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); } };
  FX.burst = () => { S.bloom = 1; };
  FX.relayout = relayout;

  let ptrAt = 0;
  function onPtr(x, y, f) { S.ptr[0] = (x / W - 0.5) * Ww; S.ptr[1] = (0.5 - y / H) * Hw; S.ptrTo = f; S.tilt = x / W - 0.5; ptrAt = performance.now(); }
  addEventListener("pointermove", e => onPtr(e.clientX, e.clientY, 1), { passive: true });
  addEventListener("pointerdown", e => onPtr(e.clientX, e.clientY, 1.6), { passive: true });
  addEventListener("pointerup", e => { if (e.pointerType !== "mouse") S.ptrTo = 0; }, { passive: true });
  addEventListener("pointercancel", () => { S.ptrTo = 0; }, { passive: true });
  document.addEventListener("pointerleave", () => { S.ptrTo = 0; });
  document.addEventListener("visibilitychange", () => { S.hidden = document.hidden; if (!S.hidden) { last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); } });
  let rz = 0;
  const reqResize = () => { clearTimeout(rz); rz = setTimeout(resize, 120); };
  addEventListener("resize", reqResize); addEventListener("orientationchange", reqResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reqResize);
  addEventListener("load", reqResize);

  function frame(now) {
    raf = 0;
    if (S.paused || S.hidden || !glOK) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduce) S.time += dt;

    // 跑太慢就自己降畫質（先降解析度，再少畫一半粒子）
    frames++;
    if (!fixedDpr && frames > 20 && frames < 400) {
      slow += dt > 0.024 ? 1 : -0.25; if (slow < 0) slow = 0;
      if (slow > 22) { slow = 0; if (!webkitOnly && dprCap > 1.5) { dprCap = 1.5; resize(); } else if (!webkitOnly && dprCap > 1.15) { dprCap = 1.15; resize(); } else if (quality > 0.5) quality = 0.5; }
    }

    // 滑動進度：0＝星系，1＝五股光都落到卡片上
    const y = window.scrollY || 0;
    const a = H * 0.05, b = Math.max(a + 1, teachTop - H * 0.1);
    const p1T = reduce ? (y > (a + b) / 2 ? 1 : 0) : clamp((y - a) / (b - a), 0, 1);
    S.p1 += (p1T - S.p1) * (1 - Math.exp(-dt * 10)); FX.p1 = S.p1;
    if (S.hold >= 0) S.suck = S.suckTo = S.hold;      // 檢查用：把被吸的過程停在某一格
    S.suck += (S.suckTo - S.suck) * (1 - Math.exp(-dt * (S.suckTo ? 4.2 : 3.4)));
    if (suckRes && Math.abs(S.suck - S.suckTo) < 0.03) { S.suck = S.suckTo; if (S.suckTo) S.flash = 1; const r = suckRes; suckRes = null; r(); }
    S.light += (S.lightTo - S.light) * (1 - Math.exp(-dt * 9));
    if (now - ptrAt > 700) S.ptrTo = 0;                // 游標停住就放手，星塵流回來
    S.ptr[2] += (S.ptrTo - S.ptr[2]) * (1 - Math.exp(-dt * 7));
    S.bloom *= Math.exp(-dt * 2.6); S.flash *= Math.exp(-dt * 3.2);

    // 大格子和五張卡現在在畫面哪裡
    if (tileEl) { const t = toWorld(tileEl.getBoundingClientRect()); tileW[0] = t[0]; tileW[1] = t[1]; tileW[2] = t[2]; tileW[3] = t[3]; }
    for (let i = 0; i < 5; i++) {
      const el = cardEls[i];
      if (el) cardFlat.set(toWorld(el.getBoundingClientRect()), i * 4);
      else cardFlat.set([(i - 2) * Ww * 0.16, -Hw * 0.9, Ww * 0.07, Hw * 0.03], i * 4);
    }
    // 星系中心：一開始在大格子正後面；往下滑時比頁面慢一點往上走
    gal[0] = tileW[0] + S.tilt * 0.5;
    gal[1] = tileW[1] - (y * 0.45) / pxU;
    gal[2] = W < 760 ? Ww * 0.98 : Math.min(Ww * 0.5, Hw * 0.8);
    gal[3] = (W < 760 ? -0.62 : -0.38) + S.tilt * 0.06 + S.p1 * 0.5;

    const cw = canvas.width, ch = canvas.height;
    gl.disable(gl.BLEND);
    // 1. 星雲底圖（黑底那一段就不用畫了）
    if (S.p1 < 0.995 && S.light < 0.995 && (bgTick++ % 2 === 0)) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, fbW, fbH);
      gl.useProgram(NEB.p); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(qLocN); gl.vertexAttribPointer(qLocN, 2, gl.FLOAT, false, 0, 0);
      const sx = fbW / W, sy = fbH / H;
      gl.uniform2f(NEB.u.uRes, fbW, fbH); gl.uniform1f(NEB.u.uTime, S.time); gl.uniform1f(NEB.u.uRoll, gal[3]);
      gl.uniform1f(NEB.u.uCore, (1 + S.suck * (1 - S.suck) * 3) * (1 - clamp(S.p1 * 3, 0, 1)));
      gl.uniform3f(NEB.u.uG, (gal[0] / Ww + 0.5) * W * sx, (gal[1] / Hw + 0.5) * H * sy, gal[2] * pxU * sy);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    // 2. 鋪到畫面
    gl.viewport(0, 0, cw, ch);
    gl.useProgram(OUT.p); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(qLocO); gl.vertexAttribPointer(qLocO, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(OUT.u.uTex, 0);
    gl.uniform2f(OUT.u.uRes, cw, ch); gl.uniform1f(OUT.u.uTime, S.time);
    gl.uniform1f(OUT.u.uDark, clamp((S.p1 - 0.1) / 0.42, 0, 1)); gl.uniform1f(OUT.u.uFlash, S.flash); gl.uniform1f(OUT.u.uLight, S.light);
    gl.uniform3f(OUT.u.uT, (tileW[0] / Ww + 0.5) * cw, (tileW[1] / Hw + 0.5) * ch, Math.max(tileW[2], tileW[3]) * pxU * dpr * 1.5);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // 3. 粒子：暗的世界用加亮，白金用一般的疊法（亮底上加亮看不到）
    const lit = S.light > 0.5;
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, lit ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
    gl.useProgram(P.p); gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    for (let i = 0; i < 4; i++) { if (aLoc[i] < 0) continue; gl.enableVertexAttribArray(aLoc[i]); gl.vertexAttribPointer(aLoc[i], 4, gl.FLOAT, false, STRIDE * 4, i * 16); }
    gl.uniform1f(P.u.uTime, S.time); gl.uniform1f(P.u.uP1, S.p1); gl.uniform1f(P.u.uSuck, S.suck); gl.uniform1f(P.u.uLight, S.light);
    gl.uniform1f(P.u.uPx, pxU * dpr); gl.uniform1f(P.u.uScroll, y / pxU); gl.uniform1f(P.u.uMaxPt, maxPt); gl.uniform1f(P.u.uBloom, S.bloom);
    gl.uniform2f(P.u.uView, F * H / W, F); gl.uniform2f(P.u.uWH, Ww, Hw);
    gl.uniform4f(P.u.uGal, gal[0], gal[1], gal[2], gal[3]);
    gl.uniform4fv(P.u.uCard, cardFlat); gl.uniform3fv(P.u.uCol, colFlat); gl.uniform1fv(P.u.uRad, radFlat);
    gl.uniform3f(P.u.uPtr, S.ptr[0], S.ptr[1], S.ptr[2]);
    if (!lit) gl.drawArrays(gl.POINTS, 0, Math.floor(NG * quality));
    gl.drawArrays(gl.POINTS, NG, ND);
  }

  resize();
  if (document.body.classList.contains("w-light")) S.light = S.lightTo = 1;      // 重新整理時已經停在白金那一頁
  FX.ok = true; FX._s = S;
  document.documentElement.classList.add("has-gl");
  raf = requestAnimationFrame(frame);
})();
