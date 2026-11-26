/* 交易法四段小動畫（從會員首頁 home/kline.js 搬來，畫法照永盛的規則：K 棒照 開→低→高→收 長、影線只畫走過的；結構線照他手畫確認的畫法） */
(function () {
  "use strict";
  const $$ = s => Array.from(document.querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const UP = "#6d98d4", UP_E = "#4b7dc3", DN = "#fbfaf6", DN_E = "#89867f", WICK = "#89867f", RED = "#9b4031", INK = "#21211f", GOLD = "#c2a253";
  const FONT = '-apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3), fade = (t, t0, d = .3) => clamp((t - t0) / d, 0, 1);
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
