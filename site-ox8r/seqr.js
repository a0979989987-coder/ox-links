/* OX 官網：繪圖執行緒。渲染畫面在這裡畫到 OffscreenCanvas 上，跟主執行緒分開。
   主執行緒只告訴這裡「現在是哪個世界、目標在第幾張」；主執行緒忙（第一次畫內容卡片、排版）的時候，這裡照樣一張一張播，畫面不會跟著頓。 */
importScripts("seqcore.js");
let P = null;
const raf = typeof self.requestAnimationFrame === "function" ? f => self.requestAnimationFrame(f) : f => setTimeout(() => f(performance.now()), 16);
function loop(now) { P.tick(now); if (P.active) raf(loop); else setTimeout(() => loop(performance.now()), 60); }   // 不在渲染世界裡的時候不用每格醒來
onmessage = e => {
  const m = e.data;
  if (m.t === "init") {
    try { P = self.OXPlayer(m.canvas, { colors: m.colors, base: m.base, dec: m.port, reduce: m.reduce }); postMessage({ t: "ready" }); raf(loop); }
    catch (err) { postMessage({ t: "err", msg: String(err) }); }
  }
  else if (!P) return;
  else if (m.t === "tgt") P.target(m.w, m.ft);
  else if (m.t === "load") P.load(m.w);
  else if (m.t === "size") P.resize(m.w, m.h);
  else if (m.t === "stat") postMessage({ t: "stat", stat: P.stat, fd: P.fd });
};
