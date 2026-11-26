/* OX 官網 v5：後面九個世界是先用 Blender 渲染好的畫面，這支照滑動位置播放（Apple 官網的做法）。
   每個世界 84 張，直式（手機）和橫式（電腦）各一套；滑到前一段才開始載，先載每 6 張的 1 張讓畫面先能動，再補齊。
   每段的進度：標題那一屏 0→0.5、內容 0.5→0.8、最後一段空白 0.8→1（鏡頭推進主角裡、畫面收成一個顏色，接下一個世界）。 */
(function () {
  "use strict";
  const cv = document.getElementById("seq"), g = cv.getContext("2d", { alpha: false });
  const N = 84, POR = innerHeight > innerWidth, TAG = POR ? "p" : "l", FW = POR ? 720 : 1600, FH = POR ? 1560 : 900;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // 世界：開頭的顏色（上一個世界收尾的顏色）、是不是亮的
  const WORLDS = { balance: { c: "#04060f" }, city: { c: "#ece2cc", light: 1 }, tunnel: { c: "#020309" }, lab: { c: "#03101f" }, islands: { c: "#ebe5d6", light: 1 }, academy: { c: "#05081c" }, cinema: { c: "#070103" }, stars: { c: "#030716" }, card: { c: "#000000" } };
  Object.keys(WORLDS).forEach(k => { const w = WORLDS[k]; w.name = k; w.frames = new Array(N); w.loaded = 0; w.started = false; });
  const secs = Array.from(document.querySelectorAll("[data-world]")).map(el => {
    const o = { el, world: el.dataset.world, stage: el.querySelector(".stage"), exit: el.querySelector(".exit") };
    OX.track(el); if (o.stage) OX.track(o.stage); if (o.exit) OX.track(o.exit); return o;
  });

  function load(w) {
    if (w.started) return; w.started = true;
    const order = []; for (let i = 0; i < N; i += 6) order.push(i); for (let i = 0; i < N; i++) if (i % 6) order.push(i);
    let k = 0, active = 0;
    const next = () => {
      while (active < 6 && k < order.length) {
        const i = order[k++], im = new Image(); active++;
        im.decoding = "async";
        // 先在背景解碼好才算載完（不然第一次畫到畫面上才解碼，那一格會卡）
        const done = () => { active--; if (im.naturalWidth) { w.frames[i] = im; w.loaded++; dirty = true; } next(); };
        im.onload = () => { if (im.decode) im.decode().then(done, done); else done(); }; im.onerror = done;
        im.src = `img/seq/${w.name}_${TAG}/${String(i).padStart(3, "0")}.webp`;
      }
    };
    next();
  }
  const nearest = (w, i) => { if (w.frames[i]) return w.frames[i]; for (let d = 1; d < N; d++) { if (w.frames[i - d]) return w.frames[i - d]; if (w.frames[i + d]) return w.frames[i + d]; } return null; };

  let cw = 0, ch = 0, dirty = true, lastKey = "", shown = null;
  function size(S) {
    const d = Math.min(devicePixelRatio || 1, 2), w = Math.min(Math.round(S.vw * d), Math.round(FW * 1.5)), h = Math.round(w * S.vh / S.vw);
    if (w !== cw || h !== ch) { cw = cv.width = w; ch = cv.height = h; dirty = true; }
  }
  function drawCover(im, a) {
    const s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
    g.globalAlpha = a; g.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h); g.globalAlpha = 1;
  }
  // 這一段現在的進度（0～1）
  function progress(o, mid) {
    const r = OX.rect(o.el), st = o.stage ? OX.rect(o.stage) : null, ex = o.exit ? OX.rect(o.exit) : null;
    const exTop = ex ? ex.top : r.bottom, stBottom = st ? st.bottom : r.top, hasContent = exTop - stBottom > 40;
    if (mid >= exTop) return .8 + .2 * clamp((mid - exTop) / Math.max(1, r.bottom - exTop), 0, 1);
    if (!hasContent) return .8 * clamp((mid - r.top) / Math.max(1, exTop - r.top), 0, 1);
    if (mid <= stBottom) return .5 * clamp((mid - r.top) / Math.max(1, stBottom - r.top), 0, 1);
    return .5 + .3 * clamp((mid - stBottom) / Math.max(1, exTop - stBottom), 0, 1);
  }
  let cur = "";
  OX.add(S => {
    const mid = S.vh / 2; let o = null;
    for (const s of secs) { const r = OX.rect(s.el); if (r.top <= mid && r.bottom > mid) { o = s; break; } }
    const world = o ? o.world : (S.y < S.vh ? "bh" : cur);
    if (world !== cur) { cur = world; document.documentElement.dataset.cur = world; dispatchEvent(new CustomEvent("oxworld", { detail: world })); }
    // 快到的世界先載
    for (const s of secs) { const w = WORLDS[s.world]; if (!w || w.started) continue; const r = OX.rect(s.el); if (r.top < S.vh * 2.5 && r.bottom > -S.vh) load(w); }
    const w = o && WORLDS[o.world];
    if (!w) { if (shown !== false) { cv.style.visibility = "hidden"; shown = false; } return; }
    if (shown !== true) { cv.style.visibility = "visible"; shown = true; dirty = true; }
    size(S);
    const p = progress(o, mid); window.OXP = { world: o.world, p };
    // 只畫最接近的那一張（兩張疊著畫，停下來會有疊影）
    const i0 = Math.round(p * (N - 1)), key = w.name + ":" + i0 + ":" + (w.frames[i0] ? 1 : w.loaded);
    if (key === lastKey && !dirty) return; lastKey = key; dirty = false;
    const n = nearest(w, i0); if (n) drawCover(n, 1); else { g.fillStyle = w.c; g.fillRect(0, 0, cw, ch); }
  });
  window.OXSEQ = { WORLDS };
})();
