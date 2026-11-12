/* K 線：黑底 → 白金的轉場（一段真的比特幣日線，突破前高那一下把黑底撞碎），和交易法介紹的四段小動畫。
   畫法照永盛的規則：K 棒照 開→低→高→收 的順序長，影線只畫走過的地方；每根一樣寬；加密用他教材的藍白 K。
   結構線照他手畫確認的畫法：頂拉一條橫線，被突破的那一刻，回撤裡最低的那一點才算底。 */
(function () {
  "use strict";
  const HM = window.OXHOME, K = window.OXK; if (!HM) return;
  const { $, $$, reduce, SND, setWorld } = HM;
  const UP = "#6d98d4", UP_E = "#4b7dc3", DN = "#fbfaf6", DN_E = "#89867f", WICK = "#89867f", RED = "#9b4031", INK = "#21211f", GOLD = "#c2a253";
  const FONT = '-apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3), fade = (t, t0, d = .3) => clamp((t - t0) / d, 0, 1);
  const fmt = n => Math.round(n).toLocaleString("en-US");

  // 一根 K 棒走到第 f（0～1）的樣子。漲的走 開→低→高→收，跌的走 開→高→低→收；高低只算走過的
  function walk(o, h, l, c, f) {
    if (f >= 1) return { o, h, l, c };
    const pts = c >= o ? [o, l, h, c] : [o, h, l, c];
    const d = [Math.abs(pts[1] - pts[0]), Math.abs(pts[2] - pts[1]), Math.abs(pts[3] - pts[2])];
    let s = Math.max(0, f) * (d[0] + d[1] + d[2]), p = o, hi = o, lo = o;
    for (let i = 0; i < 3; i++) {
      const step = Math.min(s, d[i]);
      p = pts[i] + Math.sign(pts[i + 1] - pts[i]) * step; hi = Math.max(hi, p); lo = Math.min(lo, p);
      if (s <= d[i]) break;
      s -= d[i];
    }
    return { o, h: hi, l: lo, c: p };
  }
  // 畫一根 K 棒。x＝中心、w＝實體寬、Y＝價格換成畫面 y 的函式；dark＝在黑底上（米白那根壓暗一點才不刺眼）
  function candle(g, x, w, k, Y, dark) {
    const up = k.c >= k.o, yt = Y(Math.max(k.o, k.c)), yb = Y(Math.min(k.o, k.c)), hgt = Math.max(1.4, yb - yt);
    g.strokeStyle = dark ? "#a29f97" : WICK; g.lineWidth = Math.max(1, w * .13);
    g.beginPath(); g.moveTo(x, Y(k.h)); g.lineTo(x, Y(k.l)); g.stroke();
    g.fillStyle = up ? UP : dark ? "#d9d6cd" : DN; g.fillRect(x - w / 2, yt, w, hgt);
    g.strokeStyle = up ? UP_E : DN_E; g.lineWidth = 1; g.strokeRect(x - w / 2 + .5, yt + .5, w - 1, Math.max(.4, hgt - 1));
  }
  function fit(cv) {
    const r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g, W: w, H: h };
  }
  function label(g, text, x, y, o = {}) {
    g.save(); g.globalAlpha *= o.a == null ? 1 : o.a;
    g.font = `${o.w || 600} ${o.s || 12}px ${FONT}`; g.textAlign = o.al || "center"; g.textBaseline = o.bl || "middle";
    if (o.bg) { const m = g.measureText(text), pw = m.width + 12, ph = (o.s || 12) + 9, bx = o.al === "left" ? x - 6 : o.al === "right" ? x - pw + 6 : x - pw / 2; g.fillStyle = o.bg; g.beginPath(); g.roundRect ? g.roundRect(bx, y - ph / 2, pw, ph, 6) : g.rect(bx, y - ph / 2, pw, ph); g.fill(); }
    g.fillStyle = o.c || INK; g.fillText(text, x, y); g.restore();
  }
  const dash = (g, x1, y1, x2, y2, c, w = 1.4, d = [5, 4]) => { g.save(); g.strokeStyle = c; g.lineWidth = w; g.setLineDash(d); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore(); };

  // =====================================================================
  // 一、轉場：#kbridge 釘住畫面，往下滑 K 棒一根根長；突破「頂」的那一下，黑底像玻璃碎掉，露出白金
  // =====================================================================
  const bridge = $("#kbridge"), chart = $("#kchart"), glass = $("#kglass");
  if (bridge && chart && K) (function transition() {
    const R = K.rows, N = R.length, TOP = R[K.top][2], LOW = R[K.low][3], BRK = K.brk;
    // 突破那一根走到多少才碰到頂（照 開→低→高→收 的路徑算）
    const b = R[BRK], path = Math.abs(b[3] - b[1]) + (b[2] - b[3]) + Math.abs(b[4] - b[2]), HIT = (Math.abs(b[3] - b[1]) + (TOP - b[3])) / path;
    const PRE_LO = 58200, PRE_HI = 75600, POST_HI = 101500;
    const S = { q: 0, broken: false, t0: 0, shards: null, dust: null, hitXY: [0, 0], raf: 0, first: true, alive: false };
    let top = 0, span = 1;
    const measure = () => { const r = bridge.getBoundingClientRect(); top = r.top + scrollY; span = Math.max(1, r.height - innerHeight); };

    function draw(now) {
      const { g, W, H } = fit(chart);
      g.clearRect(0, 0, W, H);
      const dark = !S.broken, tAfter = S.broken ? (now - S.t0) / 1000 : 0;
      // 走到第幾根：碎之前跟著手指滑，碎之後自己往下演
      let f;
      if (!S.broken) f = S.q < .6 ? clamp((S.q - .04) / .56, 0, 1) * BRK : BRK + clamp((S.q - .6) / .1, 0, 1) * HIT;
      else f = Math.min(N, BRK + HIT + tAfter * 12);
      const e = S.broken ? ease(tAfter / 1.5) : 0;
      // 比例尺：碎之後價格軸、時間軸一起壓縮（舊的 K 棒被壓到左下，新的往上衝）
      const padX = Math.max(18, (W - 860) / 2), yTop = H * .17, yBot = H * .8, hi = lerp(PRE_HI, POST_HI, e), slot = lerp((W - padX * 2) / (BRK + 3.2), (W - padX * 2) / N, e);
      const Y = p => yBot - (p - PRE_LO) / (hi - PRE_LO) * (yBot - yTop), X = i => padX + slot * (i + .5), bw = Math.max(2.4, slot * .62);
      const out = S.q > .9 ? 1 - clamp((S.q - .9) / .1, 0, 1) : 1;
      g.globalAlpha = out;
      // 淡淡的商品和週期
      g.save(); g.globalAlpha = out * (dark ? .055 : .07); g.fillStyle = dark ? "#fff" : INK; g.font = `700 ${Math.min(50, W * .105)}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(`${K.symbol} · ${K.tf}`, W / 2, H * .5); g.restore();
      // 頂：頂分型成立（後面有一根跌破它的低點）才拉線，一路往右
      const lineOn = fade(f, K.top + 2, .8);
      if (lineOn > 0) {
        const ly = Y(TOP), red = dark ? "#e2725b" : RED, flash = S.broken ? Math.max(0, 1 - tAfter / .5) : 0;
        g.save(); g.globalAlpha = out * lineOn;
        dash(g, X(K.top), ly, W - padX + 10, ly, flash > 0 ? "#fff" : red, 1.4 + flash * 2);
        label(g, `頂 ${fmt(TOP)}`, X(K.top) - 4, ly - 12, { c: red, s: 12, al: "left" });
        g.restore();
      }
      // 結構：頂 → 底 → 突破點。底是突破之後才確認的
      if (S.broken) {
        const a = fade(tAfter, .15, .5);
        g.save(); g.globalAlpha = out * a; g.strokeStyle = GOLD; g.lineWidth = 2; g.lineJoin = "round";
        g.beginPath(); g.moveTo(X(K.top), Y(TOP)); g.lineTo(X(K.low), Y(LOW)); g.lineTo(X(BRK), Y(TOP)); g.stroke();
        label(g, `底 ${fmt(LOW)}`, X(K.low), Y(LOW) + 15, { c: RED, s: 12 });
        label(g, "突破", X(BRK) + 4, Y(TOP) - 13, { c: RED, s: 13, w: 700, al: "left" });
        g.restore();
      }
      // K 棒
      const last = Math.min(N - 1, Math.floor(f));
      let cur = null;
      for (let i = 0; i <= last; i++) {
        const r = R[i], k = i < Math.floor(f) ? { o: r[1], h: r[2], l: r[3], c: r[4] } : walk(r[1], r[2], r[3], r[4], f - i);
        if (i === last && f < N) { if (f - i <= 0) break; cur = k; }
        candle(g, X(i), bw, k, Y, dark);
      }
      // 正在長的那一根旁邊的價格
      if (cur && f > .5) label(g, fmt(cur.c), X(last) + bw / 2 + 6, Y(cur.c), { c: dark ? "#f0ede5" : INK, s: 11.5, w: 600, al: "left", a: .9 });
      else if (S.broken && f >= N) label(g, fmt(R[N - 1][4]), X(N - 1) - bw, Y(R[N - 1][2]) - 12, { c: INK, s: 12, w: 700, al: "right", a: fade(tAfter, 1.7, .4) });
      S.hitXY = [X(BRK), Y(TOP)];
      g.globalAlpha = 1;
    }

    // 黑底碎成一片一片：從撞擊點放射的裂痕切出碎片，由近到遠飛開、翻面、往下掉
    function makeShards(ix, iy, W, H) {
      const Rm = Math.hypot(Math.max(ix, W - ix), Math.max(iy, H - iy)) + 60, rays = 15, TAU = Math.PI * 2;
      const ring = [0, .06, .15, .28, .46, .7, 1.04].map(k => k * Rm), ang = [], rad = [];
      for (let i = 0; i < rays; i++) ang.push((i + (Math.random() - .5) * .66) / rays * TAU);
      for (let k = 0; k < ring.length; k++) { rad.push([]); for (let i = 0; i < rays; i++) rad[k].push(k === 0 ? 0 : ring[k] * (1 + (Math.random() - .5) * .3)); }
      const P = (k, i) => { const j = i % rays; return [ix + Math.cos(ang[j]) * rad[k][j], iy + Math.sin(ang[j]) * rad[k][j]]; };
      const list = [];
      const add = pts => {
        const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length, d = Math.hypot(cx - ix, cy - iy), a = Math.atan2(cy - iy, cx - ix), sp = 260 + Math.random() * 380;
        list.push({ pts: pts.map(p => [p[0] - cx, p[1] - cy]), cx, cy, delay: d / Rm * .26, vx: Math.cos(a) * sp * (.5 + .7 * (1 - d / Rm)), vy: Math.sin(a) * sp * .5 - 80 - Math.random() * 140, vr: (Math.random() - .5) * 5, vt: 2.5 + Math.random() * 6, ph: Math.random() * 3, sh: Math.random(), gold: Math.random() < .22 });
      };
      for (let k = 0; k < ring.length - 1; k++) for (let i = 0; i < rays; i++) {
        if (k === 0) add([P(0, i), P(1, i), P(1, i + 1)]);
        else if (k > 2 && Math.random() < .55) { add([P(k, i), P(k + 1, i), P(k + 1, i + 1)]); add([P(k, i), P(k + 1, i + 1), P(k, i + 1)]); }
        else add([P(k, i), P(k + 1, i), P(k + 1, i + 1), P(k, i + 1)]);
      }
      S.dust = Array.from({ length: 70 }, () => { const a = Math.random() * TAU, sp = 200 + Math.random() * 900; return { x: ix, y: iy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, r: .8 + Math.random() * 2.2, l: .5 + Math.random() * .7 }; });
      return list;
    }
    function drawGlass(now) {
      const t = (now - S.t0) / 1000, { g, W, H } = fit(glass);
      g.clearRect(0, 0, W, H);
      if (t > 1.7) { glass.style.display = "none"; S.shards = null; return false; }
      for (const s of S.shards) {
        const tt = t - s.delay, fly = Math.max(0, tt), al = fly > .55 ? Math.max(0, 1 - (fly - .55) / .7) : 1;
        if (al <= 0) continue;
        const flip = Math.cos(s.ph * 0 + s.vt * fly), grow = 1 + fly * .5;
        g.save();
        g.translate(s.cx + s.vx * fly, s.cy + s.vy * fly + 620 * fly * fly); g.rotate(s.vr * fly); g.scale(grow * (fly > 0 ? Math.max(.06, Math.abs(flip)) : 1), grow);
        g.beginPath(); s.pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
        // 黑玻璃：深色本體，翻到側面那一瞬間整片反白，邊緣一圈亮
        const glint = fly > 0 ? Math.pow(1 - Math.abs(flip), 3) : 0;
        const c = Math.round(10 + s.sh * 16 + glint * 215);
        g.globalAlpha = al; g.fillStyle = `rgb(${c},${c + 1},${Math.min(255, c + 5)})`; g.fill();
        g.globalAlpha = al * (fly > 0 ? .75 : clamp(t / .1, 0, 1) * .5); g.lineWidth = 1 / grow; g.strokeStyle = s.gold ? "#f6e4b0" : "#fff"; g.stroke();
        g.restore();
      }
      // 撞擊點的閃光和玻璃屑
      const fl = Math.max(0, 1 - t / .32);
      if (fl > 0) { const [ix, iy] = S.hit, rg = g.createRadialGradient(ix, iy, 0, ix, iy, 260 + t * 900); rg.addColorStop(0, `rgba(255,246,220,${.95 * fl})`); rg.addColorStop(1, "rgba(255,246,220,0)"); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
      g.fillStyle = "#fff";
      for (const d of S.dust) { const a = Math.max(0, 1 - t / d.l); if (a <= 0) continue; g.globalAlpha = a; g.beginPath(); g.arc(d.x + d.vx * t, d.y + d.vy * t + 500 * t * t, d.r, 0, 6.2832); g.fill(); }
      g.globalAlpha = 1;
      return true;
    }
    function smash(now) {
      S.broken = true; S.t0 = now;
      setWorld(true, true);
      if (reduce || !glass) return;
      draw(now);
      glass.style.display = "block";
      const { W, H } = fit(glass);
      S.hit = S.hitXY.slice(); S.shards = makeShards(S.hit[0], S.hit[1], W, H);
      SND.shatter();
      const stage = chart.parentNode; stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake");      // 撞上去那一下，整張圖震一下
    }
    function tick(now) {
      S.raf = 0;
      const y = scrollY; S.q = clamp((y - top) / span, 0, 1);
      const inView = y > top - innerHeight && y < top + span + innerHeight;
      // 一打開就已經在轉場後面（例如重新整理停在作品那一段）：直接是白金，不演碎玻璃
      if (S.first) { S.first = false; if (S.q >= .7) { S.broken = true; S.t0 = now - 5000; setWorld(true, true); } }
      if (!S.broken && S.q >= .7) smash(now);
      else if (S.broken && S.q < .55) { S.broken = false; setWorld(false); }
      else if (y < top - 4 && document.body.classList.contains("w-light")) { S.broken = false; setWorld(false); }
      const playing = S.broken && now - S.t0 < 2600;
      if (inView) draw(now);
      const more = S.shards ? drawGlass(now) : false;
      if (playing || more) S.raf = requestAnimationFrame(tick);
    }
    const kick = () => { if (!S.raf) S.raf = requestAnimationFrame(tick); };
    measure();
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", () => { measure(); kick(); });
    addEventListener("load", () => { measure(); kick(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); kick(); });
    kick();
  })();

  // =====================================================================
  // 二、交易法介紹的小動畫：canvas[data-anim]，滑進畫面才演，演完重來
  // =====================================================================
  // 共用：一串 K 棒照時間一根根長。ks＝[開, 高, 低, 收]（0～100 的示意價格），每根用 step 秒
  function series(g, ks, t, o) {
    const { x0, slot, Y, step = .34, from = 0 } = o, bw = slot * .6, f = (t - from) / step;
    let cur = -1;
    for (let i = 0; i < ks.length && i < f; i++) {
      const k = ks[i], w = f - i >= 1 ? { o: k[0], h: k[1], l: k[2], c: k[3] } : walk(k[0], k[1], k[2], k[3], f - i);
      candle(g, x0 + slot * (i + .5), bw, w, Y, false); cur = i;
    }
    return { f, cur, X: i => x0 + slot * (i + .5), bw, at: i => from + (i + 1) * step };
  }
  const SCENES = {
    // 雙極：頂 → 回撤 → 突破，底是突破那一刻才確認，線從頂連到底、再連到突破點
    structure: {
      T: 9.2,
      ks: [[20, 27, 19, 26], [26, 34, 25, 33], [33, 35, 29, 31], [31, 41, 30, 40], [40, 49, 39, 47], [47, 56, 46, 52], [52, 53, 44, 46], [46, 47, 40, 42], [42, 46, 38, 44], [44, 50, 43, 49], [49, 54, 48, 53], [53, 66, 52, 64], [64, 71, 63, 69], [69, 73, 66, 68]],
      draw(g, t, W, H) {
        const ks = this.ks, slot = (W - 36) / ks.length, Y = p => H - 22 - (p - 14) / 64 * (H - 50);
        const s = series(g, ks, t, { x0: 18, slot, Y, step: .4 }), topT = s.at(6), ly = Y(56);
        // 突破那一根（第 11 根）照 開→低→高→收 走到 56 的時間
        const k = ks[11], brkT = s.at(10) + .4 * ((k[0] - k[2]) + (56 - k[2])) / ((k[0] - k[2]) + (k[1] - k[2]) + (k[1] - k[3]));
        const a1 = fade(t, topT), a2 = fade(t, brkT);
        if (a1 > 0) { g.globalAlpha = a1; dash(g, s.X(5), ly, W - 10, ly, RED); label(g, "頂", s.X(5), Y(56) - 13, { c: RED, s: 14, w: 700 }); g.globalAlpha = 1; }
        if (a2 > 0) {
          g.save(); g.globalAlpha = a2; g.strokeStyle = GOLD; g.lineWidth = 2.2; g.lineJoin = "round"; g.beginPath(); g.moveTo(s.X(5), ly); g.lineTo(s.X(8), Y(38)); g.lineTo(s.X(11), ly); g.stroke(); g.restore();
          label(g, "底", s.X(8), Y(38) + 14, { c: RED, s: 14, w: 700, a: a2 });
          label(g, "突破", s.X(11) + slot * .2, ly - 14, { c: RED, s: 14, w: 700, al: "right", a: a2 });
          const pulse = Math.max(0, 1 - (t - brkT) / .5); if (pulse > 0) { g.save(); g.globalAlpha = pulse; g.strokeStyle = RED; g.lineWidth = 2; g.beginPath(); g.arc(s.X(11), ly, 8 + (1 - pulse) * 22, 0, 6.2832); g.stroke(); g.restore(); }
        }
        label(g, "新結構", W - 14, Y(72) - 2, { c: INK, s: 12, al: "right", a: fade(t, s.at(13)) * .8 });
      }
    },
    // ICT／SMC：急漲留下的失衡區（三根 K 中間的空隙），價格之後回來補；急漲前最後一根下跌 K 是訂單塊
    fvg: {
      T: 8.6,
      ks: [[60, 62, 55, 56], [56, 57, 50, 52], [52, 53, 46, 48], [48, 60, 47, 59], [59, 78, 58, 77], [77, 87, 71, 85], [85, 90, 82, 88], [88, 89, 76, 78], [78, 80, 65, 69], [69, 80, 64, 79], [79, 91, 78, 90], [90, 97, 88, 95]],
      draw(g, t, W, H) {
        const ks = this.ks, slot = (W - 36) / ks.length, Y = p => H - 18 - (p - 42) / 58 * (H - 40);
        const t3 = .36 * 6, a = fade(t, t3), fill = fade(t, .36 * 9, .5);
        // 失衡區：第 4 根的高點到第 6 根的低點
        if (a > 0) {
          const x1 = 18 + slot * 3.5, y1 = Y(71), y2 = Y(60);
          g.save(); g.globalAlpha = a * .9; g.fillStyle = "rgba(109,152,212,.2)"; g.fillRect(x1, y1, W - 10 - x1, y2 - y1); g.restore();
          g.globalAlpha = a; dash(g, x1, y1, W - 10, y1, UP_E, 1.1, [4, 3]); dash(g, x1, y2, W - 10, y2, UP_E, 1.1, [4, 3]); g.globalAlpha = 1;
          label(g, "失衡區", W - 14, (y1 + y2) / 2, { c: UP_E, s: 13, w: 700, al: "right", a });
        }
        // 訂單塊：急漲前最後一根下跌 K
        if (a > 0) { const x = 18 + slot * 2.5, bw = slot * .6; g.save(); g.globalAlpha = a; g.strokeStyle = RED; g.lineWidth = 1.6; g.strokeRect(x - bw / 2 - 4, Y(53) - 3, bw + 8, Y(46) - Y(53) + 6); g.restore(); label(g, "訂單塊", x, Y(46) + 17, { c: RED, s: 13, w: 700, a }); }
        series(g, ks, t, { x0: 18, slot, Y, step: .36 });
        if (fill > 0) label(g, "回來補", 18 + slot * 8.5, Y(64) + 16, { c: INK, s: 12, a: fill, bg: "rgba(245,243,237,.9)" });
      }
    },
    // SNR：兩根實體收在同一個水平（影線不算）畫出一條線；回測時實體沒收過去，線就還有效
    snr: {
      T: 8.4,
      ks: [[38, 45, 37, 44], [44, 53, 43, 52], [52, 65, 51, 60], [60, 67, 52, 54], [54, 55, 47, 49], [49, 50, 43, 45], [45, 52, 44, 51], [51, 58, 50, 56], [56, 65, 55, 58], [58, 59, 49, 51], [51, 52, 42, 44], [44, 45, 36, 38]],
      draw(g, t, W, H) {
        const ks = this.ks, slot = (W - 36) / ks.length, Y = p => H - 18 - (p - 32) / 40 * (H - 42), ly = Y(60);
        const a = fade(t, .36 * 4), b = fade(t, .36 * 9);
        if (a > 0) { g.save(); g.globalAlpha = a; g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.moveTo(18 + slot * 2, ly); g.lineTo(W - 10, ly); g.stroke(); g.restore(); label(g, "SNR", W - 14, ly - 11, { c: INK, s: 13, w: 700, al: "right", a }); label(g, "只看實體，影線不算", 18 + slot * 3, Y(67) - 11, { c: RED, s: 12, a }); }
        series(g, ks, t, { x0: 18, slot, Y, step: .36 });
        if (b > 0) { const x = 18 + slot * 8.5; g.save(); g.globalAlpha = b; g.strokeStyle = RED; g.lineWidth = 1.6; g.beginPath(); g.arc(x, Y(61), slot * .7, 0, 6.2832); g.stroke(); g.restore(); label(g, "回測，實體沒過", x, Y(51) + 30, { c: RED, s: 12, w: 600, a: b }); }
      }
    },
    // 裸 K：只看前一根的高低點。破前高是多方贏、破前低是空方贏、都沒破是平衡；影線碰到就算
    boxes: {
      T: 9,
      cases: [{ k: [50, 68, 48, 57], box: 0 }, { k: [52, 58, 45, 49], box: 1 }, { k: [50, 53, 31, 36], box: 2 }],
      draw(g, t, W, H) {
        const seg = 3, ci = Math.min(2, Math.floor(t / seg)), lt = t - ci * seg, c = this.cases[ci], prev = [44, 62, 40, 56];
        const cx = W * .3, slot = Math.min(46, W * .12), Y = p => H * .52 - (p - 50) / 40 * (H * .7), bw = slot * .62;
        const names = ["多方贏", "平衡", "空方贏"], bx = W * .56, bwid = W - bx - 16, bh = (H - 44) / 3;
        dash(g, cx - slot * 1.4, Y(62), cx + slot * 1.9, Y(62), RED, 1.2); dash(g, cx - slot * 1.4, Y(40), cx + slot * 1.9, Y(40), RED, 1.2);
        label(g, "前高", cx - slot * 1.5, Y(62), { c: RED, s: 11.5, al: "right" }); label(g, "前低", cx - slot * 1.5, Y(40), { c: RED, s: 11.5, al: "right" });
        candle(g, cx - slot * .5, bw, { o: prev[0], h: prev[1], l: prev[2], c: prev[3] }, Y, false);
        const k = walk(c.k[0], c.k[1], c.k[2], c.k[3], lt / 1.2); candle(g, cx + slot * .6, bw, k, Y, false);
        const done = fade(lt, 1.25, .35);
        names.forEach((nm, i) => {
          const y = 14 + i * (bh + 8), on = i === c.box ? done : 0;
          g.save(); g.fillStyle = on > 0 ? `rgba(194,162,83,${.16 + .2 * on})` : "rgba(33,33,31,.04)"; g.strokeStyle = on > 0 ? GOLD : "rgba(33,33,31,.18)"; g.lineWidth = on > 0 ? 2 : 1;
          g.beginPath(); g.roundRect ? g.roundRect(bx, y, bwid, bh, 10) : g.rect(bx, y, bwid, bh); g.fill(); g.stroke(); g.restore();
          label(g, nm, bx + bwid / 2, y + bh / 2, { c: INK, s: 14, w: on > 0 ? 700 : 500, a: on > 0 ? 1 : .55 });
        });
        if (done > 0) { const y = 14 + c.box * (bh + 8) + bh / 2; g.save(); g.globalAlpha = done * .9; g.strokeStyle = GOLD; g.lineWidth = 1.6; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(cx + slot * 1.1, Y(k.c)); g.quadraticCurveTo((cx + bx) / 2 + 10, y - 20, bx - 4, y); g.stroke(); g.restore(); }
        if (ci === 0 && done > 0) label(g, "影線碰到就算", cx + slot * .1, Y(68) - 12, { c: RED, s: 11.5, a: done });
      }
    }
  };
  $$("canvas[data-anim]").forEach(cv => {
    const sc = SCENES[cv.dataset.anim]; if (!sc) return;
    let t0 = 0, raf = 0, seen = false;
    const frame = now => {
      raf = 0; if (!seen) return;
      const { g, W, H } = fit(cv);
      let t = (now - t0) / 1000; if (t > sc.T) { t0 = now; t = 0; }
      g.clearRect(0, 0, W, H);
      g.globalAlpha = Math.min(1, (sc.T - t) / .5);      // 最後半秒整張淡出再重來
      sc.draw(g, reduce ? sc.T - .6 : t, W, H);
      g.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    if (!("IntersectionObserver" in window)) { seen = true; t0 = performance.now(); raf = requestAnimationFrame(frame); return; }
    new IntersectionObserver(es => { seen = es[0].isIntersecting; if (seen && !raf) { t0 = performance.now(); raf = requestAnimationFrame(frame); } }, { threshold: .35 }).observe(cv);
  });
})();
