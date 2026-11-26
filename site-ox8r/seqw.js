/* OX 官網：渲染畫面的抓檔和解碼都在這個背景執行緒做，主執行緒只負責畫（滑動才不會被解碼卡住）。 */
const B = {};
postMessage({ t: "cap", ok: typeof createImageBitmap === "function" });
onmessage = e => {
  const m = e.data;
  if (m.t === "load") {
    const bl = B[m.w] = []; let k = 0, active = 0;
    const next = () => {
      while (active < 6 && k < m.order.length) {
        const i = m.order[k++]; active++;
        fetch(m.base + String(i).padStart(3, "0") + ".webp").then(r => r.ok ? r.blob() : null).then(b => { if (b) { bl[i] = b; postMessage({ t: "got", w: m.w, i }); } }, () => {}).then(() => { active--; next(); });
      }
    };
    next();
  } else if (m.t === "dec") {
    const b = B[m.w] && B[m.w][m.i];
    if (!b) { postMessage({ t: "fail", w: m.w, i: m.i }); return; }
    createImageBitmap(b).then(bmp => postMessage({ t: "bmp", w: m.w, i: m.i, bmp }, [bmp]), () => postMessage({ t: "fail", w: m.w, i: m.i }));
  }
};
