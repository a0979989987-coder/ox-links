/* OX 官網 v5：後面九個世界是先用 Blender 渲染好的畫面，這支照滑動位置播放（Apple 官網的做法）。
   每個世界 84 張，直式（手機）和橫式（電腦）各一套；滑到前兩屏才開始抓檔，先抓每 6 張的 1 張讓畫面先能動，再補齊。
   每段的進度：標題那一屏 0→0.5、內容 0.5→0.8、最後一段空白 0.8→1（鏡頭推進主角裡、畫面收成一個顏色，接下一個世界）。

   手機不卡的關鍵（v5.1）：
   1. 抓下來的只是壓縮檔（很小）。要畫的時候才解成點陣圖，而且是在背景執行緒解（createImageBitmap），主執行緒不解碼。
   2. 只留「目前這張的前後十幾張＋每 12 張一張墊底的」，離開範圍就釋放。一張解開有 4.5 MB，84 張全解開手機會撐不住。
   3. 畫布大小只在螢幕寬度變的時候重算；iPhone 滑動時網址列收合（高度變）不重建畫布。 */
(function () {
  "use strict";
  const cv = document.getElementById("seq"), g = cv.getContext("2d", { alpha: false });
  const N = 84, POR = innerHeight > innerWidth, TAG = POR ? "p" : "l", FW = POR ? 720 : 1600;
  const BMP = typeof createImageBitmap === "function";
  const AHEAD = 7, BEHIND = 4, ANCHOR = 12, MAXPEND = 3;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // 世界：開頭的顏色（上一個世界收尾的顏色）
  const WORLDS = { balance: { c: "#04060f" }, city: { c: "#ece2cc", light: 1 }, tunnel: { c: "#020309" }, lab: { c: "#03101f" }, islands: { c: "#ebe5d6", light: 1 }, academy: { c: "#05081c" }, cinema: { c: "#070103" }, stars: { c: "#030716" }, card: { c: "#000000" } };
  Object.keys(WORLDS).forEach(k => { const w = WORLDS[k]; w.name = k; w.blobs = new Array(N); w.got = 0; w.started = false; w.bmp = new Map(); w.pend = new Set(); w.keep = null; });
  const secs = Array.from(document.querySelectorAll("[data-world]")).map(el => {
    const o = { el, world: el.dataset.world, stage: el.querySelector(".stage"), exit: el.querySelector(".exit") };
    OX.track(el); if (o.stage) OX.track(o.stage); if (o.exit) OX.track(o.exit); return o;
  });

  let dirty = true, need = true;
  // 抓檔（只抓壓縮檔，不解碼）
  function load(w) {
    if (w.started) return; w.started = true;
    const order = []; for (let i = 0; i < N; i += 6) order.push(i); for (let i = 0; i < N; i++) if (i % 6) order.push(i);
    let k = 0, active = 0;
    const next = () => {
      while (active < 6 && k < order.length) {
        const i = order[k++]; active++;
        fetch(`img/seq/${w.name}_${TAG}/${String(i).padStart(3, "0")}.webp`).then(r => r.ok ? r.blob() : null).then(b => { if (b) { w.blobs[i] = b; w.got++; need = true; } }, () => {}).then(() => { active--; next(); });
      }
    };
    next();
  }
  // 解成點陣圖（背景執行緒）；舊瀏覽器沒有 createImageBitmap 就退回用 <img> 先 decode()
  function decode(w, i) {
    w.pend.add(i);
    const b = w.blobs[i];
    const p = BMP ? createImageBitmap(b) : new Promise((res, rej) => {
      const im = new Image(), u = URL.createObjectURL(b);
      im.onload = () => { const fin = () => { URL.revokeObjectURL(u); res(im); }; if (im.decode) im.decode().then(fin, fin); else fin(); };
      im.onerror = () => { URL.revokeObjectURL(u); rej(); }; im.src = u;
    });
    p.then(im => { w.pend.delete(i); need = true; if (w.keep && w.keep.has(i)) { w.bmp.set(i, im); dirty = true; } else if (im.close) im.close(); }, () => { w.pend.delete(i); });
  }
  function release(w) { w.bmp.forEach(im => { if (im.close) im.close(); }); w.bmp.clear(); w.keep = null; }
  // 目前在第 i0 張、往 dir 方向滑：決定要留哪些、先解哪些
  function manage(w, i0, dir) {
    const a = dir >= 0 ? AHEAD : BEHIND, b = dir >= 0 ? BEHIND : AHEAD, order = [i0];
    for (let d = 1; d <= AHEAD; d++) { if (d <= a && i0 + d < N) order.push(i0 + d); if (d <= b && i0 - d >= 0) order.push(i0 - d); }
    for (let k = 0; k < N; k += ANCHOR) order.push(k); order.push(N - 1);
    const keep = new Set(order); w.keep = keep;
    w.bmp.forEach((im, i) => { if (!keep.has(i)) { if (im.close) im.close(); w.bmp.delete(i); } });
    for (const i of order) { if (w.pend.size >= MAXPEND) break; if (w.blobs[i] && !w.bmp.has(i) && !w.pend.has(i)) decode(w, i); }
  }
  // 已經解好的裡面離 i0 最近的那一張
  function best(w, i0) { if (w.bmp.has(i0)) return i0; let bi = -1, bd = 1e9; w.bmp.forEach((_, i) => { const d = Math.abs(i - i0); if (d < bd) { bd = d; bi = i; } }); return bi; }

  // 畫布大小：照畫布自己的版面大小（100lvh，不會跟著網址列變），只在寬度變的時候重算
  let cw = 0, ch = 0, lastVW = -1;
  function size() {
    const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return;
    const d = Math.min(devicePixelRatio || 1, 2), w = Math.min(Math.round(r.width * d), Math.round(FW * 1.5)), h = Math.round(w * r.height / r.width);
    if (w !== cw || h !== ch) { cw = cv.width = w; ch = cv.height = h; dirty = true; }
  }
  function drawCover(im) {
    const iw = im.width || im.naturalWidth, ih = im.height || im.naturalHeight, s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
    g.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
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
  let cur = "", curW = null, shown = null, lastKey = "", lastI = -1, dir = 1;
  OX.add(S => {
    const mid = S.vh / 2; let o = null;
    for (const s of secs) { const r = OX.rect(s.el); if (r.top <= mid && r.bottom > mid) { o = s; break; } }
    const world = o ? o.world : (S.y < S.vh ? "bh" : cur);
    if (world !== cur) { cur = world; document.documentElement.dataset.cur = world; dispatchEvent(new CustomEvent("oxworld", { detail: world })); }
    // 快到的世界先抓檔
    for (const s of secs) { const w = WORLDS[s.world]; if (!w || w.started) continue; const r = OX.rect(s.el); if (r.top < S.vh * 2.5 && r.bottom > -S.vh) load(w); }
    const w = (o && WORLDS[o.world]) || null;
    if (w !== curW) { if (curW) release(curW); curW = w; lastI = -1; lastKey = ""; need = true; }
    if (!w) { if (shown !== false) { cv.style.visibility = "hidden"; shown = false; } return; }
    if (shown !== true) { cv.style.visibility = "visible"; shown = true; dirty = true; }
    if (S.vw !== lastVW) { lastVW = S.vw; size(); }
    const p = progress(o, mid); window.OXP = { world: o.world, p };
    const i0 = Math.round(p * (N - 1));
    if (i0 !== lastI) { if (lastI >= 0) dir = i0 > lastI ? 1 : -1; lastI = i0; need = true; }
    if (need) { need = false; manage(w, i0, dir); }
    // 只畫一張：已經解好的裡面最接近的（兩張疊著畫，停下來會有疊影）
    const bi = best(w, i0), key = w.name + ":" + bi;
    if (key === lastKey && !dirty) return; lastKey = key; dirty = false;
    if (bi >= 0) drawCover(w.bmp.get(bi)); else { g.fillStyle = w.c; g.fillRect(0, 0, cw, ch); }
  });
  addEventListener("orientationchange", () => setTimeout(() => { lastVW = -1; }, 300));
  window.OXSEQ = { WORLDS };
})();
