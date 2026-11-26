/* OX 官網 v5.4：渲染畫面的播放器核心。主執行緒和背景執行緒共用同一份（seqr.js 在背景執行緒用它畫；舊瀏覽器由 seq.js 在主執行緒用它畫）。

   怎麼做到順（照使用者實際的滑法：手機上一撥一撥快速滑）：
   1. 畫面永遠一張接一張播，不跳張。外面給的只是「目標在第幾張」，畫面用緩動追上去，而且有最快速度（每秒 VMAX 張）；
      撥得很快時畫面就用最快速度順順追。相鄰兩張之間用淡入淡出補，停下來收到整張（不留疊影）。
   2. 下一張還沒解好就等它，不跳過去（等超過 0.6 秒才放棄，疊化到位）。
   3. 只留目前位置附近二十張左右的點陣圖，離開就釋放（一張解開 4.5 MB，全解開手機撐不住）。
   4. 換世界時新舊畫面用 0.25 秒疊化接起來。 */
(function (root) {
  "use strict";
  const N = 84, AHEAD = 12, BEHIND = 3, ANCHORS = [0, 21, 42, 63, N - 1], MAXPEND = 4;
  const TAU = 100, SETTLE = 140, VMAX = 70, GIVEUP = 600, FADE = 250;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ORDER = (() => { const o = []; for (let i = 0; i < N; i += 6) o.push(i); for (let i = 0; i < N; i++) if (i % 6) o.push(i); return o; })();

  // canvas：一般畫布或 OffscreenCanvas；o = { colors: {世界: 開頭顏色}, base: {世界: 圖檔資料夾網址}, dec: 解碼執行緒（Worker 或 MessagePort，沒有就自己解）, reduce }
  root.OXPlayer = function (canvas, o) {
    const g = canvas.getContext("2d", { alpha: false });
    const W = {}; Object.keys(o.colors).forEach(k => { W[k] = { name: k, c: o.colors[k], has: new Array(N), blobs: null, started: false, bmp: new Map(), pend: new Set(), keep: null }; });
    let dirty = true, need = true, dec = o.dec || null;
    function gotBmp(w, i, im) { w.pend.delete(i); need = true; if (im && w.keep && w.keep.has(i)) { w.bmp.set(i, im); dirty = true; } else if (im && im.close) im.close(); }
    if (dec) dec.onmessage = e => {
      const m = e.data, w = W[m.w];
      if (m.t === "cap") { if (!m.ok) { dec = null; Object.values(W).forEach(x => { x.pend.clear(); if (x.started) { x.started = false; x.has = new Array(N); load(x.name); } }); } }
      else if (m.t === "got") { w.has[m.i] = 1; need = true; }
      else if (m.t === "bmp") gotBmp(w, m.i, m.bmp);
      else if (m.t === "fail") gotBmp(w, m.i, null);
    };
    // 抓檔（只抓壓縮檔，不解碼）
    function load(name) {
      const w = W[name]; if (!w || w.started) return; w.started = true;
      if (dec) { dec.postMessage({ t: "load", w: name, base: o.base[name], order: ORDER }); return; }
      w.blobs = new Array(N); let k = 0, active = 0;
      const next = () => {
        while (active < 6 && k < ORDER.length) {
          const i = ORDER[k++]; active++;
          fetch(o.base[name] + String(i).padStart(3, "0") + ".webp").then(r => r.ok ? r.blob() : null).then(b => { if (b) { w.blobs[i] = b; w.has[i] = 1; need = true; } }, () => {}).then(() => { active--; next(); });
        }
      };
      next();
    }
    // 解成點陣圖
    function decode(w, i) {
      w.pend.add(i);
      if (dec) { dec.postMessage({ t: "dec", w: w.name, i }); return; }
      const b = w.blobs[i];
      const p = typeof createImageBitmap === "function" ? createImageBitmap(b) : new Promise((res, rej) => {
        const im = new Image(), u = URL.createObjectURL(b);
        im.onload = () => { const fin = () => { URL.revokeObjectURL(u); res(im); }; if (im.decode) im.decode().then(fin, fin); else fin(); };
        im.onerror = () => { URL.revokeObjectURL(u); rej(); }; im.src = u;
      });
      p.then(im => gotBmp(w, i, im), () => gotBmp(w, i, null));
    }
    function release(w) { w.bmp.forEach(im => { if (im.close) im.close(); }); w.bmp.clear(); w.keep = null; }
    // 目前在第 i0 張、要往 dir 方向走：決定要留哪些、先解哪些（前面多、後面少，再加幾張墊底的）
    function manage(w, i0, dir) {
      const order = [i0];
      for (let d = 1; d <= AHEAD; d++) { const a = i0 + d * dir, b = i0 - d * dir; if (a >= 0 && a < N) order.push(a); if (d <= BEHIND && b >= 0 && b < N) order.push(b); }
      for (const k of ANCHORS) order.push(k);
      const keep = new Set(order); w.keep = keep;
      w.bmp.forEach((im, i) => { if (!keep.has(i)) { if (im.close) im.close(); w.bmp.delete(i); } });
      for (const i of order) { if (w.pend.size >= MAXPEND) break; if (w.has[i] && !w.bmp.has(i) && !w.pend.has(i)) decode(w, i); }
    }
    function best(w, i0) { if (w.bmp.has(i0)) return i0; let bi = -1, bd = 1e9; w.bmp.forEach((_, i) => { const d = Math.abs(i - i0); if (d < bd) { bd = d; bi = i; } }); return bi; }
    function drawCover(im, a) {
      const cw = canvas.width, ch = canvas.height, iw = im.width || im.naturalWidth, ih = im.height || im.naturalHeight, s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
      if (a < 1) g.globalAlpha = a;
      g.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
      if (a < 1) g.globalAlpha = 1;
    }

    let tName = null, tFt = 0;                                            // 外面給的目標：哪個世界、第幾張
    let curW = null, lastKey = "", lastI = -1, dir = 1, lastNow = 0;
    let fd = -1, lastFt = -1, lastMove = 0, stuckAt = 0, fadeT0 = -1e9;   // fd：畫面現在在第幾張（有小數）
    const stat = { skips: 0, waits: 0, maxStep: 0, draws: 0 };
    function tick(now) {
      const dt = lastNow ? Math.min(64, now - lastNow) : 16; lastNow = now;
      const w = tName ? W[tName] || null : null;
      if (w !== curW) { if (curW) release(curW); if (curW && w) fadeT0 = now; curW = w; lastI = -1; lastKey = ""; need = true; fd = -1; }
      if (!w) return;
      // 目標 → 畫面位置：緩動追上去、有最快速度、不跳過還沒解好的；停下來之後收到最近的整張
      const ft = clamp(tFt, 0, N - 1);
      if (Math.abs(ft - lastFt) > 1e-4) { lastMove = now; lastFt = ft; }
      const tgt = o.reduce || now - lastMove > SETTLE ? Math.round(ft) : ft;
      if (fd < 0 || o.reduce) { fd = tgt; stuckAt = 0; }
      else if (fd !== tgt) {
        const cap = VMAX * Math.min(dt, 34) / 1000; let nf = fd + clamp((tgt - fd) * (1 - Math.exp(-dt / TAU)), -cap, cap);
        if (Math.abs(tgt - nf) < .012) nf = tgt;
        if (nf > fd) { let hi = Math.floor(fd); if (w.bmp.has(hi)) { while (hi + 1 < N && w.bmp.has(hi + 1)) hi++; nf = Math.min(nf, Math.max(hi, fd)); } }
        else { let lo = Math.ceil(fd); if (w.bmp.has(lo)) { while (lo - 1 >= 0 && w.bmp.has(lo - 1)) lo--; nf = Math.max(nf, Math.min(lo, fd)); } }
        if (nf === fd && Math.abs(tgt - fd) > .5) {                       // 下一張還沒解好：等它；等太久就放棄，疊化到位
          stat.waits++; if (!stuckAt) stuckAt = now; else if (now - stuckAt > GIVEUP) { nf = tgt; stuckAt = 0; stat.skips++; fadeT0 = now; }
        } else stuckAt = 0;
        stat.maxStep = Math.max(stat.maxStep, Math.abs(nf - fd)); fd = nf;
      } else stuckAt = 0;
      const i0 = clamp(Math.round(fd), 0, N - 1);
      const want = tgt > fd + .01 ? 1 : tgt < fd - .01 ? -1 : dir;
      if (i0 !== lastI || want !== dir) { dir = want; lastI = i0; need = true; }
      if (need) { need = false; manage(w, i0, dir); }
      // 相鄰兩張都解好了就淡入淡出；不然畫已經解好的裡面最接近的一張
      const ia = clamp(Math.floor(fd), 0, N - 1), fr = fd - ia, A = w.bmp.get(ia), B = w.bmp.get(ia + 1), mix = A && B && fr > .03 && fr < .97;
      const bi = mix ? ia : best(w, i0), fading = now - fadeT0 < FADE;
      const key = w.name + ":" + bi + (mix ? ":" + fr.toFixed(3) : "");
      if (key === lastKey && !dirty && !fading) return;
      if (bi < 0) { if (!fading) { g.fillStyle = w.c; g.fillRect(0, 0, canvas.width, canvas.height); lastKey = key; dirty = false; } return; }   // 還沒有任何一張：疊化期間先留著上一個畫面
      lastKey = key; dirty = false; stat.draws++;
      const al = fading ? .28 : 1;                                        // 疊化：每格蓋一層半透明的新畫面
      if (mix) { drawCover(A, al); drawCover(B, fr * al); } else drawCover(w.bmp.get(bi), al);
      if (fading) dirty = true;
    }
    return {
      load, tick, stat,
      target(name, ft) { tName = name; tFt = ft; },
      resize(w, h) { if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; dirty = true; } },
      get fd() { return fd; }, get active() { return !!tName; },
    };
  };
  root.OXPlayer.N = N;
})(typeof self !== "undefined" ? self : this);
