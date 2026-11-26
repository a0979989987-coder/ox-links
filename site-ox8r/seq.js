/* OX 官網 v5：後面九個世界是先用 Blender 渲染好的畫面，這支照滑動位置播放（Apple 官網的做法）。
   每個世界 84 張，直式（手機）和橫式（電腦）各一套；滑到前兩屏才開始抓檔，先抓每 6 張的 1 張，再補齊。
   每段的進度：標題那一屏 0→0.5、內容 0.5→0.8、最後一段空白 0.8→1（鏡頭推進主角裡、畫面收成一個顏色，接下一個世界）。

   怎麼做到順（v5.3，照使用者實際的滑法：手機上一撥一撥快速滑）：
   1. 畫面永遠一張接一張播，不跳張。滑動位置只是「目標」，畫面用緩動追上去，而且有最快速度（每秒 VMAX 張）；
      撥得很快時畫面就用最快速度順順追，不會為了跟上而亂跳。相鄰兩張之間用淡入淡出補，停下來收到整張（不留疊影）。
   2. 下一張還沒解好就等它，不跳過去（等超過 0.6 秒才放棄，疊化到位）。
   3. 抓檔和解碼都在背景執行緒（seqw.js），主執行緒只畫；只留目前位置附近二十張左右的點陣圖，離開就釋放。
   4. 換世界時新舊畫面用 0.25 秒疊化接起來（畫面還在追的時候換世界，才不會硬切）。
   5. 畫布大小只在螢幕寬度變的時候重算；iPhone 網址列收合不重建畫布。 */
(function () {
  "use strict";
  const cv = document.getElementById("seq"), g = cv.getContext("2d", { alpha: false });
  const N = 84, POR = innerHeight > innerWidth, TAG = POR ? "p" : "l", FW = POR ? 720 : 1600;
  const AHEAD = 12, BEHIND = 3, ANCHORS = [0, 21, 42, 63, N - 1], MAXPEND = 4;
  const TAU = 100, SETTLE = 140, VMAX = 70, GIVEUP = 600, FADE = 250;
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // 世界：開頭的顏色（上一個世界收尾的顏色）
  const WORLDS = { balance: { c: "#04060f" }, city: { c: "#ece2cc", light: 1 }, tunnel: { c: "#020309" }, lab: { c: "#03101f" }, islands: { c: "#ebe5d6", light: 1 }, academy: { c: "#05081c" }, cinema: { c: "#070103" }, stars: { c: "#030716" }, card: { c: "#000000" } };
  Object.keys(WORLDS).forEach(k => { const w = WORLDS[k]; w.name = k; w.has = new Array(N); w.blobs = null; w.started = false; w.bmp = new Map(); w.pend = new Set(); w.keep = null; });
  const secs = Array.from(document.querySelectorAll("[data-world]")).map(el => {
    const o = { el, world: el.dataset.world, stage: el.querySelector(".stage"), exit: el.querySelector(".exit") };
    OX.track(el); if (o.stage) OX.track(o.stage); if (o.exit) OX.track(o.exit); return o;
  });
  const BASE = w => new URL(`img/seq/${w.name}_${TAG}/`, location.href).href;
  const ORDER = (() => { const o = []; for (let i = 0; i < N; i += 6) o.push(i); for (let i = 0; i < N; i++) if (i % 6) o.push(i); return o; })();

  let dirty = true, need = true;
  function gotBmp(w, i, im) { w.pend.delete(i); need = true; if (im && w.keep && w.keep.has(i)) { w.bmp.set(i, im); dirty = true; } else if (im && im.close) im.close(); }

  // ---------- 背景執行緒（有就用；沒有或壞掉就退回主執行緒） ----------
  let WK = null;
  function fallback() { if (!WK) return; try { WK.terminate(); } catch (e) { } WK = null; Object.values(WORLDS).forEach(w => { w.pend.clear(); if (w.started) { w.started = false; w.has = new Array(N); } }); need = true; }
  try {
    if (typeof Worker === "function" && typeof createImageBitmap === "function") {
      WK = new Worker("seqw.js");
      WK.onmessage = e => {
        const m = e.data, w = WORLDS[m.w];
        if (m.t === "cap") { if (!m.ok) fallback(); }
        else if (m.t === "got") { w.has[m.i] = 1; need = true; }
        else if (m.t === "bmp") gotBmp(w, m.i, m.bmp);
        else if (m.t === "fail") gotBmp(w, m.i, null);
      };
      WK.onerror = fallback;
    }
  } catch (e) { WK = null; }

  // 抓檔（只抓壓縮檔，不解碼）
  function load(w) {
    if (w.started) return; w.started = true;
    if (WK) { WK.postMessage({ t: "load", w: w.name, base: BASE(w), order: ORDER }); return; }
    w.blobs = new Array(N); let k = 0, active = 0; const base = BASE(w);
    const next = () => {
      while (active < 6 && k < ORDER.length) {
        const i = ORDER[k++]; active++;
        fetch(base + String(i).padStart(3, "0") + ".webp").then(r => r.ok ? r.blob() : null).then(b => { if (b) { w.blobs[i] = b; w.has[i] = 1; need = true; } }, () => {}).then(() => { active--; next(); });
      }
    };
    next();
  }
  // 這一段內容區的圖片（App 截圖、老師照片）也提前抓好解好
  function warm(el) { el.querySelectorAll("img").forEach(im => { im.loading = "eager"; const d = () => { if (im.decode) im.decode().catch(() => {}); }; if (im.complete) d(); else im.addEventListener("load", d, { once: true }); }); }
  // 解成點陣圖
  function decode(w, i) {
    w.pend.add(i);
    if (WK) { WK.postMessage({ t: "dec", w: w.name, i }); return; }
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

  // 畫布大小：照畫布自己的版面大小（100lvh，不會跟著網址列變），只在寬度變的時候重算
  let cw = 0, ch = 0, lastVW = -1;
  function size() {
    const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return;
    const d = Math.min(devicePixelRatio || 1, 2), w = Math.min(Math.round(r.width * d), Math.round(FW * 1.5)), h = Math.round(w * r.height / r.width);
    if (w !== cw || h !== ch) { cw = cv.width = w; ch = cv.height = h; dirty = true; }
  }
  function drawCover(im, a) {
    const iw = im.width || im.naturalWidth, ih = im.height || im.naturalHeight, s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
    if (a < 1) g.globalAlpha = a;
    g.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
    if (a < 1) g.globalAlpha = 1;
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
  let fd = -1, lastFt = -1, lastMove = 0, stuckAt = 0, fadeT0 = -1e9;      // fd：畫面現在在第幾張（有小數）
  const stat = { skips: 0, waits: 0, maxStep: 0 };
  OX.add((S, now) => {
    const mid = S.vh / 2; let o = null;
    for (const s of secs) { const r = OX.rect(s.el); if (r.top <= mid && r.bottom > mid) { o = s; break; } }
    const world = o ? o.world : (S.y < S.vh ? "bh" : cur);
    if (world !== cur) { cur = world; document.documentElement.dataset.cur = world; dispatchEvent(new CustomEvent("oxworld", { detail: world })); }
    // 快到的世界先抓檔
    for (const s of secs) { const w = WORLDS[s.world]; if (!w || w.started) continue; const r = OX.rect(s.el); if (r.top < S.vh * 2.5 && r.bottom > -S.vh) { load(w); warm(s.el); } }
    const w = (o && WORLDS[o.world]) || null;
    if (w !== curW) { if (curW) release(curW); if (curW && w) fadeT0 = now; curW = w; lastI = -1; lastKey = ""; need = true; fd = -1; }
    if (!w) { if (shown !== false) { cv.style.visibility = "hidden"; shown = false; } return; }
    if (shown !== true) { cv.style.visibility = "visible"; shown = true; dirty = true; }
    if (S.vw !== lastVW) { lastVW = S.vw; size(); }
    const p = progress(o, mid); window.OXP = { world: o.world, p };

    // 滑動位置（目標）→ 畫面位置：緩動追上去、有最快速度、不跳過還沒解好的；停下來之後收到最近的整張
    const ft = p * (N - 1);
    if (Math.abs(ft - lastFt) > 1e-4) { lastMove = now; lastFt = ft; }
    const tgt = REDUCE || now - lastMove > SETTLE ? Math.round(ft) : ft;
    if (fd < 0 || REDUCE) { fd = tgt; stuckAt = 0; }
    else if (fd !== tgt) {
      const cap = VMAX * Math.min(S.dt, 34) / 1000; let nf = fd + clamp((tgt - fd) * (1 - Math.exp(-S.dt / TAU)), -cap, cap);
      if (Math.abs(tgt - nf) < .012) nf = tgt;
      if (nf > fd) { let hi = Math.floor(fd); if (w.bmp.has(hi)) { while (hi + 1 < N && w.bmp.has(hi + 1)) hi++; nf = Math.min(nf, Math.max(hi, fd)); } }
      else { let lo = Math.ceil(fd); if (w.bmp.has(lo)) { while (lo - 1 >= 0 && w.bmp.has(lo - 1)) lo--; nf = Math.max(nf, Math.min(lo, fd)); } }
      if (nf === fd && Math.abs(tgt - fd) > .5) {                    // 下一張還沒解好：等它；等太久就放棄，疊化到位
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
    if (bi < 0) { if (!fading) { g.fillStyle = w.c; g.fillRect(0, 0, cw, ch); lastKey = key; dirty = false; } return; }   // 還沒有任何一張：疊化期間先留著上一個畫面
    lastKey = key; dirty = false;
    const al = fading ? .28 : 1;                                   // 疊化：每格蓋一層半透明的新畫面
    if (mix) { drawCover(A, al); drawCover(B, fr * al); } else drawCover(w.bmp.get(bi), al);
    if (fading) dirty = true;
  });
  addEventListener("orientationchange", () => setTimeout(() => { lastVW = -1; }, 300));
  window.OXSEQ = { WORLDS, stat, get fd() { return fd; }, get worker() { return !!WK; } };
})();
