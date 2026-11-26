/* 全站只有這一個動畫循環。每一格只讀一次捲動位置；各段的位置先量好存起來（版面變了才重量），
   所以黑洞、3D 世界、轉場、網頁互動每一格都不用再去量畫面，手機才不會卡。 */
(function () {
  "use strict";
  const subs = [], geo = new Map();
  const S = { y: 0, vh: innerHeight, vw: innerWidth, t: 0, dt: 16, frame: 0 };
  let dirty = true;
  function measure() {
    S.vh = innerHeight; S.vw = innerWidth;
    const y = scrollY;
    geo.forEach((g, el) => { const r = el.getBoundingClientRect(); g.top = r.top + y; g.h = r.height; });
  }
  function track(el) { let g = geo.get(el); if (!g) { g = { top: 0, h: 0 }; geo.set(el, g); dirty = true; } return g; }
  // 跟 getBoundingClientRect 一樣的意思，但用存好的位置算（只對沒有被 sticky、transform 影響的外層區塊用）
  function rect(el) { const g = geo.get(el) || track(el); if (dirty) { measure(); dirty = false; } return { top: g.top - S.y, bottom: g.top + g.h - S.y, height: g.h }; }
  const inv = () => { dirty = true; };
  addEventListener("resize", inv); addEventListener("load", inv); addEventListener("orientationchange", inv);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(inv);
  if ("ResizeObserver" in window) new ResizeObserver(inv).observe(document.body || document.documentElement);
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    if (dirty) { measure(); dirty = false; }
    S.y = scrollY; S.dt = Math.min(64, now - last); last = now; S.t = now / 1000; S.frame++;
    for (let i = 0; i < subs.length; i++) { try { subs[i](S, now); } catch (e) { console.error(e); } }
  }
  requestAnimationFrame(frame);
  window.OX = { S, add: fn => subs.push(fn), track, rect, invalidate: inv };
})();
