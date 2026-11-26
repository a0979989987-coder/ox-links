/* OX 官網：解碼執行緒。渲染畫面的抓檔和解碼都在這裡做，解好的點陣圖直接轉交出去（不複製）。
   可以直接跟主執行緒講話，也可以收到一個 MessagePort 之後改跟繪圖執行緒（seqr.js）講話。 */
const B = {}, CAN = typeof createImageBitmap === "function";
function handle(m, reply) {
  if (m.t === "load") {
    const bl = B[m.w] = B[m.w] || []; let k = 0, active = 0;
    const next = () => {
      while (active < 6 && k < m.order.length) {
        const i = m.order[k++]; active++;
        fetch(m.base + String(i).padStart(3, "0") + ".webp").then(r => r.ok ? r.blob() : null).then(b => { if (b) { bl[i] = b; reply({ t: "got", w: m.w, i }); } }, () => {}).then(() => { active--; next(); });
      }
    };
    next();
  } else if (m.t === "dec") {
    const b = B[m.w] && B[m.w][m.i];
    if (!b || !CAN) { reply({ t: "fail", w: m.w, i: m.i }); return; }
    createImageBitmap(b).then(bmp => reply({ t: "bmp", w: m.w, i: m.i, bmp }, [bmp]), () => reply({ t: "fail", w: m.w, i: m.i }));
  }
}
onmessage = e => {
  const m = e.data;
  if (m.t === "port") { const p = m.port, reply = (x, tr) => p.postMessage(x, tr || []); p.onmessage = ev => handle(ev.data, reply); reply({ t: "cap", ok: CAN }); }
  else handle(m, (x, tr) => postMessage(x, tr || []));
};
postMessage({ t: "cap", ok: CAN });
