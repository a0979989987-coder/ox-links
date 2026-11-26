/* 新手學院的圖：真實 K 線＋標記（區間、橫線、1／2／3、進出場、移動止損），還有幾張示意圖（K 線構造、頂分型、123、燃料線、裸 K 低、下單）。
   K 線顏色照永盛教材：漲是藍、跌是白（加密）。進到畫面才畫，畫的時候 K 棒一根根長出來。 */
(function () {
  "use strict";
  const UP = "#6d98d4", UP_E = "#4b7dc3", DN = "#fbfaf6", DN_E = "#8a877f", WICK = "#8a877f", RED = "#c0392b", GOLD = "#b8913f", INK = "#1d1d1f", BLUE = "#0a6ab0", MUT = "#86868b";
  const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Microsoft JhengHei", sans-serif';
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = n => Math.round(n).toLocaleString("en-US");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function fit(cv, ratio) {
    // ratio 是負的＝固定高度（例如 -260 就是 260px 高）
    const par = cv.parentElement, cs = getComputedStyle(par), w = Math.floor(par.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)), h = ratio < 0 ? -ratio : Math.round(w * ratio), d = Math.min(devicePixelRatio || 1, 2);
    cv.style.width = w + "px"; cv.style.height = h + "px"; cv.width = Math.round(w * d); cv.height = Math.round(h * d);
    const g = cv.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0); return { g, W: w, H: h };
  }
  function label(g, text, x, y, o = {}) {
    g.save(); g.font = `${o.w || 600} ${o.s || 12}px ${FONT}`; g.textAlign = o.al || "left"; g.textBaseline = "middle";
    const m = g.measureText(text), pw = m.width + 12, ph = (o.s || 12) + 10;
    let bx = o.al === "right" ? x - pw + 6 : o.al === "center" ? x - pw / 2 : x - 6;
    if (o.bg !== false) { g.fillStyle = o.bg || "rgba(255,255,255,.92)"; g.beginPath(); g.roundRect ? g.roundRect(bx, y - ph / 2, pw, ph, 6) : g.rect(bx, y - ph / 2, pw, ph); g.fill(); }
    g.fillStyle = o.c || INK; g.fillText(text, x, y); g.restore();
  }
  function badge(g, x, y, n, c) { g.save(); g.fillStyle = c || INK; g.beginPath(); g.arc(x, y, 11, 0, Math.PI * 2); g.fill(); g.fillStyle = "#fff"; g.font = `700 12px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(n, x, y + .5); g.restore(); }
  function candle(g, x, w, o, h, l, c, Y) {
    const up = c >= o, yt = Y(Math.max(o, c)), yb = Y(Math.min(o, c));
    g.strokeStyle = WICK; g.lineWidth = Math.max(1, Math.min(1.4, w * .18)); g.beginPath(); g.moveTo(x, Y(h)); g.lineTo(x, Y(l)); g.stroke();
    g.fillStyle = up ? UP : DN; g.fillRect(x - w / 2, yt, w, Math.max(1, yb - yt));
    if (w > 3) { g.strokeStyle = up ? UP_E : DN_E; g.lineWidth = 1; g.strokeRect(x - w / 2 + .5, yt + .5, w - 1, Math.max(0, yb - yt - 1)); }
  }
  const idxOf = (bars, t) => { let lo = 0, hi = bars.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (bars[m][0] < t) lo = m + 1; else hi = m; } return lo; };

  // 真實 K 線圖。spec：{ bars, ann:[...], ratio, pad }
  function drawChart(cv, spec, k = 1) {
    const { g, W, H } = fit(cv, spec.ratio || (innerWidth < 700 ? .78 : .5));
    const bars = spec.bars, n = bars.length, padL = 8, padR = innerWidth < 700 ? 62 : 74, padT = 22, padB = 26;
    let lo = Infinity, hi = -Infinity; bars.forEach(b => { lo = Math.min(lo, b[3]); hi = Math.max(hi, b[2]); });
    (spec.ann || []).forEach(a => ["p", "p0", "p1"].forEach(f => { if (a[f] != null) { lo = Math.min(lo, a[f]); hi = Math.max(hi, a[f]); } }));
    const span = hi - lo; lo -= span * .06; hi += span * .08;
    const slot = (W - padL - padR) / n, X = i => padL + slot * (i + .5), Y = p => padT + (hi - p) / (hi - lo) * (H - padT - padB);
    g.clearRect(0, 0, W, H);
    // 價格刻度
    g.font = `500 11px ${FONT}`; g.fillStyle = MUT; g.textAlign = "left"; g.textBaseline = "middle"; g.strokeStyle = "rgba(0,0,0,.06)"; g.lineWidth = 1;
    const step = Math.pow(10, Math.floor(Math.log10(span / 4))), nice = [1, 2, 2.5, 5, 10].map(m => m * step).find(s => span / s <= 6) || step * 10;
    for (let p = Math.ceil(lo / nice) * nice; p < hi; p += nice) { const y = Y(p); g.beginPath(); g.moveTo(padL, y); g.lineTo(W - padR + 4, y); g.stroke(); g.fillText(fmt(p), W - padR + 8, y); }
    // 日期
    g.textAlign = "center"; g.textBaseline = "alphabetic"; let lastD = "";
    const every = Math.max(1, Math.round(n / (innerWidth < 700 ? 4 : 7)));
    for (let i = 0; i < n; i += every) { const dt = new Date(bars[i][0] + 8 * 3600e3), s = `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`; if (s !== lastD) { g.fillText(s, X(i), H - 8); lastD = s; } }
    const shown = Math.ceil(n * k);
    // 區間（畫在 K 線下面）
    const T = t => typeof t === "number" && t > 1e11 ? idxOf(bars, t) : t;
    (spec.ann || []).forEach(a => { if (a.type !== "zone") return; const i0 = T(a.from ?? 0), i1 = T(a.to ?? n - 1); g.fillStyle = a.fill || "rgba(192,57,43,.1)"; g.fillRect(X(i0) - slot / 2, Y(a.p1), X(i1) - X(i0) + slot, Y(a.p0) - Y(a.p1)); if (a.label) label(g, a.label, X(i0) + 4, Y(a.p1) - 12, { c: a.c || RED, s: 11.5 }); });
    const bw = Math.max(1, Math.min(14, slot * .66));
    for (let i = 0; i < shown; i++) { const b = bars[i]; candle(g, X(i), bw, b[1], b[2], b[3], b[4], Y); }
    if (k < 1) return;
    (spec.ann || []).forEach(a => {
      const c = a.c || INK;
      if (a.type === "hline") { const i0 = T(a.from ?? 0), i1 = T(a.to ?? n - 1); g.save(); g.strokeStyle = c; g.lineWidth = a.w || 1.4; if (a.dash) g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(i0), Y(a.p)); g.lineTo(X(i1), Y(a.p)); g.stroke(); g.restore(); if (a.label) label(g, a.label, a.al === "right" ? X(i1) : X(i0), Y(a.p) + (a.dy || -13), { c, s: 11.5, al: a.al }); }
      if (a.type === "dot") { const i = T(a.t); g.save(); g.fillStyle = "#fff"; g.strokeStyle = c; g.lineWidth = 1.8; g.beginPath(); g.arc(X(i), Y(a.p), 4.5, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore(); if (a.label) label(g, a.label, X(i), Y(a.p) + (a.dy || -16), { c, s: 11.5, al: "center" }); }
      if (a.type === "num") { const i = T(a.t); badge(g, X(i) + (a.dx || 0), Y(a.p) + (a.dy || 0), a.n, c); if (a.label) label(g, a.label, X(i) + (a.dx || 0) + 16, Y(a.p) + (a.dy || 0), { c, s: 11.5 }); }
      if (a.type === "steps") {
        g.save(); g.strokeStyle = c; g.lineWidth = 1.8; g.beginPath();
        a.pts.forEach(([t, p], j) => { const i = T(t); if (!j) g.moveTo(X(i), Y(p)); else { g.lineTo(X(i), Y(a.pts[j - 1][1])); g.lineTo(X(i), Y(p)); } });
        const endI = T(a.end); g.lineTo(X(endI), Y(a.pts[a.pts.length - 1][1])); g.stroke(); g.restore();
        if (a.label) { const [t, p] = a.pts[0]; label(g, a.label, X(T(t)) + (a.dx ?? 6), Y(p) + (a.dy ?? -13), { c, s: 11.5 }); }
      }
      if (a.type === "entry" || a.type === "exit") { const i = T(a.t), y = Y(a.p); g.save(); g.fillStyle = c; g.beginPath(); if (a.dir === "down") { g.moveTo(X(i), y + 4); g.lineTo(X(i) - 6, y - 7); g.lineTo(X(i) + 6, y - 7); } else { g.moveTo(X(i), y - 4); g.lineTo(X(i) - 6, y + 7); g.lineTo(X(i) + 6, y + 7); } g.closePath(); g.fill(); g.restore(); if (a.label) label(g, a.label, X(i) + (a.dx || 0), y + (a.dy || (a.dir === "down" ? -20 : 20)), { c, s: 11.5, al: a.al || "center" }); }
    });
  }

  // 示意圖（不是真實行情）
  const DIAG = {
    // K 線構造：一根漲、一根跌，標開高低收和影線
    candle(g, W, H) {
      const Y = p => 20 + (100 - p) / 100 * (H - 40), w = Math.min(44, W * .09);
      const draw = (x, o, h, l, c, up) => { candle(g, x, w, o, h, l, c, Y); };
      const x1 = W * .3, x2 = W * .68;
      draw(x1, 35, 88, 12, 72); draw(x2, 70, 90, 20, 38);
      const tag = (x, p, t, al) => { g.save(); g.strokeStyle = "rgba(0,0,0,.25)"; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x + (al === "left" ? w / 2 + 4 : -w / 2 - 4), Y(p)); g.lineTo(x + (al === "left" ? w / 2 + 26 : -w / 2 - 26), Y(p)); g.stroke(); g.restore(); label(g, t, x + (al === "left" ? w / 2 + 32 : -w / 2 - 32), Y(p), { s: 12, al: al === "left" ? "left" : "right", bg: false, c: INK }); };
      tag(x1, 88, "最高", "right"); tag(x1, 72, "收盤", "right"); tag(x1, 35, "開盤", "right"); tag(x1, 12, "最低", "right");
      tag(x2, 90, "最高", "left"); tag(x2, 70, "開盤", "left"); tag(x2, 38, "收盤", "left"); tag(x2, 20, "最低", "left");
      label(g, "收比開高（藍）", x1, H - 8, { c: UP_E, s: 12, al: "center", bg: false }); label(g, "收比開低（白）", x2, H - 8, { c: DN_E, s: 12, al: "center", bg: false });
      label(g, "上影線", x2 + w / 2 + 32, Y(80), { s: 11, al: "left", bg: false, c: MUT }); label(g, "下影線", x1 - w / 2 - 32, Y(24), { s: 11, al: "right", bg: false, c: MUT });
    },
    // 頂分型：第 1 根漲、第 2 根破高、第 3 根破第 2 根低
    fractal(g, W, H, t) {
      const Y = p => 24 + (100 - p) / 100 * (H - 56), w = Math.min(40, W * .08), xs = [W * .3, W * .5, W * .7];
      const ks = [[30, 62, 26, 58], [58, 86, 52, 74], [72, 76, 40, 44]];
      const f = Math.min(3, t / .7);
      ks.forEach((k, i) => { if (f > i) candle(g, xs[i], w, k[0], k[1], k[2], k[3], Y); });
      if (f > 1.6) { g.save(); g.strokeStyle = BLUE; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(xs[0], Y(62)); g.lineTo(xs[1] + w, Y(62)); g.stroke(); g.restore(); label(g, "第 2 根突破第 1 根高點", xs[0] - w / 2, Y(62) - 14, { c: BLUE, s: 11.5 }); }
      if (f > 2.6) { g.save(); g.strokeStyle = RED; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(xs[1] - w, Y(52)); g.lineTo(xs[2] + w, Y(52)); g.stroke(); g.restore(); label(g, "第 3 根跌破第 2 根低點", xs[2] + w / 2 + 6, Y(52) + 16, { c: RED, s: 11.5 }); label(g, "頂", xs[1], Y(86) - 14, { c: RED, s: 13, al: "center" }); }
      [1, 2, 3].forEach((n, i) => { if (f > i) label(g, String(n), xs[i], H - 14, { s: 12, al: "center", bg: false, c: MUT }); });
    },
    // 123（碰支撐做多）：下跌→有效反彈高點→收盤破＝1→回檔不破底＝2→收盤再破 1 那段高點＝3
    p123(g, W, H, t) {
      const pts = [[0, 82], [.07, 70], [.12, 76], [.2, 58], [.26, 66], [.34, 44], [.4, 30], [.47, 46], [.53, 40], [.62, 62], [.68, 70], [.76, 54], [.86, 76], [1, 90]];
      const X = x => 24 + x * (W - 60), Y = p => 18 + (100 - p) / 100 * (H - 40), f = Math.min(1, t / 2.6);
      g.save(); g.strokeStyle = INK; g.lineWidth = 2; g.lineJoin = "round"; g.beginPath();
      let last = 0; pts.forEach(([x, p], i) => { if (x <= f + .001) { i ? g.lineTo(X(x), Y(p)) : g.moveTo(X(x), Y(p)); last = i; } });
      if (last < pts.length - 1) { const a = pts[last], b = pts[last + 1], u = (f - a[0]) / (b[0] - a[0]); g.lineTo(X(a[0] + (b[0] - a[0]) * u), Y(a[1] + (b[1] - a[1]) * u)); }
      g.stroke(); g.restore();
      const show = x => f > x;
      if (show(.26)) { g.save(); g.strokeStyle = GOLD; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(.26), Y(66)); g.lineTo(X(.7), Y(66)); g.stroke(); g.restore(); label(g, "最後一次有效反彈的高點", X(.26), Y(66) - 14, { c: GOLD, s: 11 }); }
      if (show(.4)) label(g, "最低", X(.4), Y(30) + 16, { c: MUT, s: 11, al: "center" });
      if (show(.62)) badge(g, X(.6), Y(66), "1", BLUE);
      if (show(.68)) { g.save(); g.strokeStyle = BLUE; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(.68), Y(70)); g.lineTo(X(.9), Y(70)); g.stroke(); g.restore(); }
      if (show(.76)) badge(g, X(.76), Y(54) + 18, "2", INK);
      if (show(.86)) { badge(g, X(.8), Y(70), "3", RED); label(g, "收盤再破 1 那段的高點，進場", X(.8) + 16, Y(70) - 20, { c: RED, s: 11.5, al: "right" }); }
    },
    // 燃料：同一條線被碰很多次，最後突破
    fuel(g, W, H, t) {
      const X = x => 20 + x * (W - 40), Y = p => 16 + (100 - p) / 100 * (H - 36), f = Math.min(1, t / 2.4);
      const pts = [[0, 30], [.1, 62], [.16, 44], [.26, 63], [.33, 40], [.45, 62], [.52, 46], [.63, 63], [.7, 50], [.8, 64], [.88, 82], [1, 95]];
      g.save(); g.fillStyle = "rgba(192,57,43,.08)"; g.fillRect(X(0), Y(66), W - 40, Y(60) - Y(66)); g.restore();
      label(g, "被碰很多次的區間", X(.02), Y(66) - 14, { c: RED, s: 11.5 });
      g.save(); g.strokeStyle = INK; g.lineWidth = 2; g.lineJoin = "round"; g.beginPath();
      let last = 0; pts.forEach(([x, p], i) => { if (x <= f) { i ? g.lineTo(X(x), Y(p)) : g.moveTo(X(x), Y(p)); last = i; } }); g.stroke(); g.restore();
      [[.1, 62], [.26, 63], [.45, 62], [.63, 63], [.8, 64]].forEach(([x, p]) => { if (f > x) { g.fillStyle = "rgba(134,134,139,.7)"; g.beginPath(); g.arc(X(x), Y(p) - 9, 4, 0, Math.PI * 2); g.fill(); } });
      if (f > .9) label(g, "突破", X(.88), Y(82) - 16, { c: BLUE, s: 12, al: "center" });
    },
    // 裸 K 低：一段沒被跌破的上漲，每根的前一根低點；第一次被跌破
    naked(g, W, H, t) {
      const ks = [[30, 38, 27, 36], [36, 45, 34, 43], [43, 50, 40, 48], [48, 58, 46, 56], [56, 63, 53, 61], [61, 70, 59, 68], [68, 72, 60, 62], [62, 66, 52, 55]];
      const slot = (W - 60) / ks.length, X = i => 30 + slot * (i + .5), Y = p => 16 + (78 - p) / 56 * (H - 40), w = Math.min(28, slot * .5), f = Math.min(ks.length, t / .45);
      ks.forEach((k, i) => { if (f > i) candle(g, X(i), w, k[0], k[1], k[2], k[3], Y); });
      for (let i = 1; i < ks.length && i < f; i++) { const p = ks[i - 1][2], broke = ks[i][2] < p; g.save(); g.strokeStyle = broke ? RED : "rgba(184,145,63,.8)"; g.lineWidth = broke ? 1.8 : 1.2; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(X(i - 1) - w / 2, Y(p)); g.lineTo(X(i) + w / 2 + 4, Y(p)); g.stroke(); g.restore(); if (broke && i === 6) label(g, "裸 K 低第一次被跌破", X(i) + w / 2 + 6, Y(p) + 14, { c: RED, s: 11.5 }); }
      if (f > 3) label(g, "每一根的裸 K 低＝前一根的低點", 30, 14, { c: GOLD, s: 11.5 });
    },
    // 下單：做空、數量、止損（每家交易所的畫面不一樣，這是我們畫的示意）
    ticket(g, W, H) {
      const x = Math.max(14, W / 2 - 170), w = Math.min(340, W - 28);
      g.save(); g.fillStyle = "#fff"; g.strokeStyle = "rgba(0,0,0,.1)"; g.beginPath(); g.roundRect ? g.roundRect(x, 10, w, H - 20, 16) : g.rect(x, 10, w, H - 20); g.fill(); g.stroke(); g.restore();
      label(g, "BTCUSDT 永續", x + 20, 34, { s: 14, bg: false });
      g.fillStyle = "rgba(0,0,0,.05)"; g.fillRect(x + 20, 52, w - 40, 34); g.fillStyle = "#d13c5b"; g.fillRect(x + 20 + (w - 40) / 2, 52, (w - 40) / 2, 34);
      label(g, "做多", x + 20 + (w - 40) / 4, 69, { s: 13, al: "center", bg: false, c: MUT }); label(g, "做空", x + 20 + (w - 40) * .75, 69, { s: 13, al: "center", bg: false, c: "#fff" });
      const row = (y, k, v) => { label(g, k, x + 20, y, { s: 12.5, bg: false, c: MUT }); label(g, v, x + w - 20, y, { s: 13.5, al: "right", bg: false }); g.fillStyle = "rgba(0,0,0,.07)"; g.fillRect(x + 20, y + 16, w - 40, 1); };
      row(112, "下單方式", "市價"); row(150, "數量", "0.0626 BTC"); row(188, "止損價", "77,006");
      label(g, "示意圖，不是任何一家交易所的畫面", x + w / 2, 232, { s: 11, al: "center", bg: false, c: MUT });
    }
  };

  // 進畫面才畫；K 線一根根長出來
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); e.target._go && e.target._go(); } }), { threshold: .2 }) : null;
  function mount(cv, draw, dur) {
    let t0 = 0;
    const run = now => { if (!t0) t0 = now; const k = reduce ? 1 : clamp((now - t0) / dur, 0, 1); draw(k, (now - t0) / 1000); if (k < 1 || draw.loop) requestAnimationFrame(run); };
    cv._go = () => requestAnimationFrame(run);
    cv._redraw = () => draw(1, 99);
    if (io) io.observe(cv); else cv._go();
  }
  window.OXChart = {
    chart(cv, spec) { mount(cv, k => drawChart(cv, spec, k), 1100); },
    diagram(cv, name, ratio) {
      const fn = DIAG[name]; if (!fn) return;
      const r = ratio < 0 ? ratio : innerWidth < 700 ? Math.max(ratio || 0, .68) : (ratio || .42);   // 手機上示意圖要夠高，字才不會疊
      mount(cv, (k, t) => { const { g, W, H } = fit(cv, r); g.clearRect(0, 0, W, H); fn(g, W, H, reduce ? 99 : t); }, 3200);
    },
    idxOf
  };
  addEventListener("resize", () => document.querySelectorAll("canvas").forEach(c => c._redraw && c._redraw()));
})();
