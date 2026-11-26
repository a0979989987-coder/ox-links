/* OX 官網 v5：後面九個世界是先用 Blender 渲染好的畫面，照滑動位置播放（Apple 官網的做法）。
   每個世界 84 張，直式（手機）和橫式（電腦）各一套；滑到前兩屏才開始抓檔。
   每段的進度：標題那一屏 0→0.5、內容 0.5→0.8、最後一小段 0.8→1（鏡頭推進主角裡、畫面收成一個顏色，接下一個世界）。

   分工（v5.4）：
   · 這支（主執行緒）只做三件事：看現在滑到哪個世界的第幾張、叫快到的世界先抓檔、開關畫布。
   · 真的在畫的是 seqcore.js 的播放器。瀏覽器支援的話，播放器跑在獨立的繪圖執行緒（seqr.js＋OffscreenCanvas），
     解碼再另外一條執行緒（seqw.js）。主執行緒忙（第一次畫內容卡片、排版）的時候，主角畫面照樣一張一張播，不會跟著頓。
   · 不支援就退回在主執行緒畫（解碼還是盡量在背景）。
   · 主角到了會自己把動作演完：停在標題那一屏不滑，畫面也會自己播到那一屏該有的樣子，不用靠手一直滑。 */
(function () {
  "use strict";
  let cv = document.getElementById("seq");
  const N = 84, POR = innerHeight > innerWidth, TAG = POR ? "p" : "l", FW = POR ? 720 : 1600;
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches, DEBUG = /[?&]seqdebug/.test(location.search);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // 世界：開頭的顏色（上一個世界收尾的顏色）
  const COLORS = { balance: "#04060f", city: "#ece2cc", tunnel: "#020309", lab: "#03101f", islands: "#ebe5d6", academy: "#05081c", cinema: "#070103", stars: "#030716", card: "#000000" };
  const BASE = {}; Object.keys(COLORS).forEach(k => { BASE[k] = new URL(`img/seq/${k}_${TAG}/`, location.href).href; });
  // 到了會自己演完的世界（製作中那段的清單、交易法的四件雕塑要跟著滑動一項一項走，不自己播）
  const AUTO = { balance: 1, city: 1, tunnel: 1, academy: 1, cinema: 1, stars: 1, card: 1 }, STAGE_END = (N - 1) * .5, AUTO_V = 22;
  const secs = Array.from(document.querySelectorAll("[data-world]")).map(el => {
    const o = { el, world: el.dataset.world, stage: el.querySelector(".stage"), exit: el.querySelector(".exit"), started: false };
    OX.track(el); if (o.stage) OX.track(o.stage); if (o.exit) OX.track(o.exit); return o;
  });

  let lastVW = -1, sentW, sentFt = -1, cur = "", shown = null, autoW = "", autoF = 0;
  // ---------- 播放器：優先放到獨立的繪圖執行緒 ----------
  let R = null, P = null, mode = "", dbg = { stat: null, fd: -1 };
  const newDecoder = () => { try { return typeof Worker === "function" && typeof createImageBitmap === "function" ? new Worker("seqw.js") : null; } catch (e) { return null; } };
  function startMain() {                         // 在主執行緒畫
    if (mode === "worker") { const c2 = cv.cloneNode(false); cv.replaceWith(c2); cv = c2; try { R.terminate(); } catch (e) { } R = null; }   // 交出去的畫布拿不回來：換一張新的
    mode = "main"; P = window.OXPlayer(cv, { colors: COLORS, base: BASE, dec: newDecoder(), reduce: REDUCE });
    secs.forEach(s => { if (s.started) P.load(s.world); }); lastVW = -1; sentW = undefined; shown = null;
  }
  function startWorker() {
    let ok = false;
    if (/[?&]seqmain/.test(location.search)) return false;      // 網址加 ?seqmain：強制在主執行緒畫（查問題用）
    try { ok = !!cv.transferControlToOffscreen && typeof OffscreenCanvas === "function" && typeof MessageChannel === "function" && typeof createImageBitmap === "function" && !!new OffscreenCanvas(1, 1).getContext("2d"); } catch (e) { ok = false; }
    if (!ok) return false;
    try {
      const D = new Worker("seqw.js"), ch = new MessageChannel(); R = new Worker("seqr.js");
      D.postMessage({ t: "port", port: ch.port1 }, [ch.port1]);
      const off = cv.transferControlToOffscreen();
      mode = "worker";
      const giveUp = setTimeout(startMain, 3000);
      R.onmessage = e => { const m = e.data; if (m.t === "ready") clearTimeout(giveUp); else if (m.t === "err") { clearTimeout(giveUp); startMain(); } else if (m.t === "stat") dbg = m; };
      R.onerror = () => { clearTimeout(giveUp); if (mode === "worker") startMain(); };
      R.postMessage({ t: "init", canvas: off, port: ch.port2, colors: COLORS, base: BASE, reduce: REDUCE }, [off, ch.port2]);
      return true;
    } catch (e) { return false; }
  }
  if (!startWorker()) { if (mode === "worker") startMain(); else { mode = "main"; P = window.OXPlayer(cv, { colors: COLORS, base: BASE, dec: newDecoder(), reduce: REDUCE }); } }

  // 這一段內容區的圖片（App 截圖、老師照片）也提前抓好解好
  function warm(el) { el.querySelectorAll("img").forEach(im => { im.loading = "eager"; const d = () => { if (im.decode) im.decode().catch(() => {}); }; if (im.complete) d(); else im.addEventListener("load", d, { once: true }); }); }
  // 畫布大小：照畫布自己的版面大小（100lvh，不會跟著網址列變），只在寬度變的時候重算
  function size() {
    const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return;
    const d = Math.min(devicePixelRatio || 1, 2), w = Math.min(Math.round(r.width * d), Math.round(FW * 1.5)), h = Math.round(w * r.height / r.width);
    if (mode === "worker") R.postMessage({ t: "size", w, h }); else P.resize(w, h);
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
  OX.add((S, now) => {
    const mid = S.vh / 2; let o = null;
    for (const s of secs) { const r = OX.rect(s.el); if (r.top <= mid && r.bottom > mid) { o = s; break; } }
    const world = o ? o.world : (S.y < S.vh ? "bh" : cur);
    if (world !== cur) { cur = world; document.documentElement.dataset.cur = world; dispatchEvent(new CustomEvent("oxworld", { detail: world })); }
    // 快到的世界先抓檔
    for (const s of secs) {
      if (s.started || !COLORS[s.world]) continue; const r = OX.rect(s.el);
      if (r.top < S.vh * 2.5 && r.bottom > -S.vh) { s.started = true; warm(s.el); if (mode === "worker") R.postMessage({ t: "load", w: s.world }); else P.load(s.world); }
    }
    const on = !!(o && COLORS[o.world]);
    let ft = 0;
    if (on) {
      const p = progress(o, mid); window.OXP = { world: o.world, p }; ft = p * (N - 1);
      // 主角自己演完：還在標題那一屏的時候，畫面自己往前播到那一屏該有的樣子
      if (o.world !== autoW) { autoW = o.world; autoF = ft; }
      if (AUTO[o.world] && !REDUCE && ft < STAGE_END) { autoF = Math.min(STAGE_END, Math.max(autoF, ft) + AUTO_V * S.dt / 1000); ft = Math.max(ft, autoF); } else autoF = ft;
      if (S.vw !== lastVW) { lastVW = S.vw; size(); }
    } else autoW = "";
    const wn = on ? o.world : null;
    if (mode === "worker") { if (wn !== sentW || Math.abs(ft - sentFt) > 1e-3) { sentW = wn; sentFt = ft; R.postMessage({ t: "tgt", w: wn, ft }); } if (DEBUG) R.postMessage({ t: "stat" }); }
    else { P.target(wn, ft); P.tick(now); }
    if (on !== shown) { shown = on; cv.style.visibility = on ? "visible" : "hidden"; }
  });
  addEventListener("orientationchange", () => setTimeout(() => { lastVW = -1; }, 300));
  window.OXSEQ = { get mode() { return mode; }, get fd() { return mode === "worker" ? dbg.fd : P.fd; }, get stat() { return mode === "worker" ? dbg.stat : P.stat; } };
})();
