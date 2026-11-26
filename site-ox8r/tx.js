/* OX 官網 v3 的轉場：一張蓋在最上面的 2D 畫布，滑到兩段之間的轉場區就畫那一種轉場；
   進度 0～0.5 蓋起來、0.5 換世界、0.5～1 打開。八種轉場都不一樣：
   halves logo 兩半合上分開／hex 六角傳送門／warp 光速跳躍／dawn 天亮／film 底片拉近／spot 燈暗聚光燈／iris 六角金庫門／flip 卡片翻面拉遠。
   另外管聲音：預設靜音，按右上聲音鍵才有空間配樂和穿越音效（全部用 WebAudio 即時合成，沒有音檔）。 */
(function () {
  "use strict";
  const cv = document.getElementById("tx"), g = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3), easeIn = t => Math.pow(clamp(t, 0, 1), 3);
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  let W = 0, H = 0, D = 1;
  function size() { D = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = Math.round(W * D); cv.height = Math.round(H * D); g.setTransform(D, 0, 0, D, 0, 0); }
  addEventListener("resize", size); size();

  const LD = new Path2D("M534 16L503 8L476 8L461 11L434 22L93 221L78 232L64 246L57 255L45 277L38 301L36 332L36 663L41 693L53 719L74 745L93 759L180 812L190 812L196 809L202 802L207 788L207 557L211 532L216 515L232 481L251 454L272 431L326 378L361 353L394 337L432 326L468 322L501 324L524 329L545 337L564 347L582 360L619 397L634 405L647 408L668 407L690 398L703 388L711 379L722 359L727 335L727 187L724 163L715 140L701 120L687 107L584 44Z");
  const LB = new Path2D("M800 168L789 168L782 172L774 185L772 196L773 399L770 428L762 458L746 494L729 521L680 576L652 602L625 622L590 641L556 652L518 657L481 655L459 650L433 640L410 627L398 618L371 590L362 583L351 577L338 573L312 574L291 583L277 594L269 603L259 621L253 644L253 796L257 816L266 838L278 855L298 873L444 961L460 967L480 971L512 969L536 961L885 760L903 747L912 738L925 721L934 704L940 686L943 663L943 317L941 299L936 281L928 264L919 250L905 234L887 220Z");
  const hexPath = (cx, cy, r, rot = -Math.PI / 2) => { const p = new Path2D(); for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? p.lineTo(x, y) : p.moveTo(x, y); } p.closePath(); return p; };
  const diag = () => Math.hypot(W, H);
  // 底片轉場要用的海報
  const posters = ["taiex60", "btc", "tw400", "rallies", "musk", "gold", "swan", "apple"].map(n => { const i = new Image(); i.src = `img/films/${n}.jpg`; return i; });
  // 光速跳躍的光線
  const streaks = Array.from({ length: 220 }, () => ({ a: Math.random() * Math.PI * 2, d: .05 + Math.random() * .9, l: .2 + Math.random() * .8, c: Math.random() < .5 ? "0,184,212" : Math.random() < .5 ? "255,48,120" : "190,235,255" }));

  const T = {
    // logo 兩半從左上、右下飛進來合成一個蓋滿畫面的大 logo，S 形縫裡透光；過一半再分開
    halves(q) {
      const c = q < .5 ? ease(q / .5) : ease((1 - q) / .5), s = diag() / (.86 * 980) * 1.18, cx = W / 2, cy = H / 2;
      // 合上那一刻 S 形縫裡的光整片亮滿（換世界藏在這一下後面）
      g.save(); g.globalAlpha = smooth(1 - Math.abs(q - .5) * 3.2);
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, diag() / 2); gr.addColorStop(0, "#fff6dc"); gr.addColorStop(1, "#7ecfff"); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
      const off = Math.pow(1 - c, 1.6) * diag() * .78;
      for (const [path, dir, fill, rim] of [[LD, -1, ["#ffffff", "#c9ccd3", "#7d828b"], "rgba(255,255,255,.95)"], [LB, 1, ["#9bdcff", "#23a6ea", "#0a5f99"], "rgba(190,235,255,.95)"]]) {
        g.save(); g.translate(cx + dir * off * .8, cy + dir * off * .55); g.rotate(dir * (1 - c) * .5); g.scale(s, s); g.translate(-490, -490);
        const lg = g.createLinearGradient(0, 0, 980, 980); lg.addColorStop(0, fill[0]); lg.addColorStop(.5, fill[1]); lg.addColorStop(1, fill[2]);
        g.fillStyle = lg; g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 40; g.fill(path);
        // 金屬切面：邊緣一圈亮線＋斜斜一道反光，看起來是兩塊金屬不是色塊
        g.shadowBlur = 0; g.lineWidth = 3 / s; g.strokeStyle = rim; g.stroke(path);
        g.save(); g.clip(path); const sh = g.createLinearGradient(0, 0, 980, 980), m = .25 + c * .5;
        sh.addColorStop(Math.max(0, m - .12), "rgba(255,255,255,0)"); sh.addColorStop(m, "rgba(255,255,255,.35)"); sh.addColorStop(Math.min(1, m + .12), "rgba(255,255,255,0)");
        g.fillStyle = sh; g.fillRect(0, 0, 980, 980); g.restore();
        g.restore();
      }
    },
    // 天際線那道六角門：先長大蓋滿（門裡是隧道的暗色），換世界後一圈圈六角光環往外飛過鏡頭
    hex(q) {
      const cx = W / 2, cy = H * .48, R = diag() * .62;
      if (q < .5) {
        const c = easeIn(q / .5), r = lerp(20, R, c);
        g.save(); g.fillStyle = "#020309"; g.fill(hexPath(cx, cy, r));
        g.lineWidth = 3 + c * 10; g.strokeStyle = "#e3c47e"; g.shadowColor = "#ffd88a"; g.shadowBlur = 30; g.stroke(hexPath(cx, cy, r)); g.restore();
      } else {
        const c = (q - .5) / .5;
        g.save(); g.globalAlpha = 1 - smooth(c * 2.2); g.fillStyle = "#020309"; g.fillRect(0, 0, W, H); g.restore();
        for (let i = 0; i < 6; i++) {
          const k = (c * 1.6 + i * .16) % 1.2, r = Math.pow(k, 2.2) * R * 1.4; if (k > 1.15) continue;
          g.save(); g.globalAlpha = (1 - k / 1.2) * (1 - c * .6); g.lineWidth = 2 + k * 8; g.strokeStyle = i % 2 ? "#ff3078" : "#00b8d4"; g.shadowColor = g.strokeStyle; g.shadowBlur = 24; g.stroke(hexPath(cx, cy, r, -Math.PI / 2 + i * .1)); g.restore();
        }
      }
    },
    // 光速跳躍：光線從中間往外拉長、越來越快，正中間白藍一閃
    warp(q) {
      const k = q < .5 ? easeIn(q / .5) : 1 - ease((q - .5) / .5), cx = W / 2, cy = H / 2, R = diag() / 2;
      g.save(); g.fillStyle = `rgba(2,4,14,${(k * .85).toFixed(3)})`; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "lighter"; g.lineCap = "round";
      for (const s of streaks) {
        const r0 = R * s.d * (1 - k * .6), r1 = r0 + R * s.l * k * 1.4;
        g.strokeStyle = `rgba(${s.c},${(k * .9).toFixed(3)})`; g.lineWidth = 1 + k * 2.2;
        g.beginPath(); g.moveTo(cx + Math.cos(s.a) * r0, cy + Math.sin(s.a) * r0); g.lineTo(cx + Math.cos(s.a) * r1, cy + Math.sin(s.a) * r1); g.stroke();
      }
      g.restore();
      const f = Math.max(0, 1 - Math.abs(q - .5) / .07);
      if (f > 0) { g.save(); g.globalAlpha = f; const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#8fd6ff"); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
    },
    // 天亮：黑 → 深金褐 → 暖白，地平線上金色的點浪升起來；過一半淡掉露出浮島
    dawn(q, t) {
      const k = q < .5 ? q / .5 : 1, out = q < .5 ? 1 : 1 - smooth((q - .5) / .5);
      const A = k < .5 ? [4, 18, 36] : [92, 72, 38], B = k < .5 ? [92, 72, 38] : [246, 243, 236], m = k < .5 ? k * 2 : (k - .5) * 2;
      const c = [0, 1, 2].map(i => Math.round(lerp(A[i], B[i], k < .5 ? m * m : Math.sqrt(m))));
      g.save(); g.globalAlpha = out * smooth(q / .2); g.fillStyle = `rgb(${c})`; g.fillRect(0, 0, W, H);
      const cols = W < 700 ? 54 : 96, rows = W < 700 ? 24 : 32, hz = H * lerp(.95, .5, ease(k)), dep = H * .9;
      const dc = [Math.round(lerp(233, 150, k)), Math.round(lerp(201, 118, k)), Math.round(lerp(135, 44, k))];
      for (let j = 0; j < rows; j++) { const zf = j / (rows - 1), z = 1 + zf * 7;
        for (let i = 0; i < cols; i++) { const xf = i / (cols - 1) - .5, h = Math.sin(xf * 7 + t * .55 + zf * 4.2) * .55 + Math.sin(xf * 13 - t * .35 + zf * 9) * .22 + Math.sin(zf * 6 - t * .8) * .35;
          const sx = W / 2 + xf * W * 2.4 / z, sy = hz + (dep / z) * .55 - h * 72 / z * (1 + k); if (sx < -4 || sx > W + 4 || sy > H + 4) continue;
          const a = clamp(.16 + (h + 1) * .36, 0, .95) * (1 - zf * .5), s = clamp(3 / z + .5, .7, 2.8);
          g.fillStyle = `rgba(${dc},${a.toFixed(3)})`; g.fillRect(sx - s / 2, sy - s / 2, s, s); } }
      g.restore();
    },
    // 底片：一條膠卷從右邊滑進來，越來越大，到一半時一格畫面蓋滿；之後那格往鏡頭衝過去淡掉
    film(q) {
      const c = q < .5 ? easeIn(q / .5) : 1, out = q < .5 ? 1 : 1 - smooth((q - .5) / .4);
      const fh = lerp(H * .32, H * 1.25, c), fw = fh * .62, gap = fh * .06, cy = H / 2, slide = lerp(W * .6, 0, ease(q / .5));
      const zoom = q < .5 ? 1 : 1 + easeIn((q - .5) / .5) * 2.5;
      g.save(); g.globalAlpha = out; g.translate(W / 2, cy); g.scale(zoom, zoom); g.translate(-W / 2, -cy);
      g.fillStyle = "#0b0b0c"; g.fillRect(-W, cy - fh / 2 - gap * 3, W * 3, fh + gap * 6);
      const n = 9, startX = W / 2 - fw / 2 + slide - 4 * (fw + gap);
      for (let i = 0; i < n; i++) {
        const x = startX + i * (fw + gap), im = posters[i % posters.length];
        if (im.complete && im.naturalWidth) { g.drawImage(im, x, cy - fh / 2, fw, fh); } else { g.fillStyle = "#2a0a0e"; g.fillRect(x, cy - fh / 2, fw, fh); }
        g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(x, cy - fh / 2, fw, fh);
        for (let k = 0; k < 5; k++) { g.fillStyle = "#e9e4d6"; const hw = fw / 9, hx = x + fw * (.1 + k * .2); g.fillRect(hx, cy - fh / 2 - gap * 2.2, hw, gap * 1.4); g.fillRect(hx, cy + fh / 2 + gap * .8, hw, gap * 1.4); }
      }
      g.restore();
    },
    // 燈暗：整片慢慢變黑（帶一點紅）；過一半，一盞聚光燈從中間打開，露出星空
    spot(q) {
      g.save();
      if (q < .5) { const k = smooth(q / .5); g.fillStyle = `rgba(4,1,3,${k})`; g.fillRect(0, 0, W, H); }
      else {
        const k = ease((q - .5) / .5), r = k * diag() * .75, cx = W / 2, cy = H * .45;
        const gr = g.createRadialGradient(cx, cy, Math.max(0, r * .7), cx, cy, r + 2); gr.addColorStop(0, "rgba(4,1,3,0)"); gr.addColorStop(1, "rgba(4,1,3,1)");
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.globalAlpha = (1 - k) * .5; g.strokeStyle = "#ffe7c4"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r * .85, 0, Math.PI * 2); g.stroke();
      }
      g.restore();
    },
    // 六角金庫門：金色光圈葉片從外面轉進來關上（中間的六角洞越縮越小），過一半再轉開
    iris(q) {
      const c = q < .5 ? ease(q / .5) : ease((1 - q) / .5), cx = W / 2, cy = H / 2, R = diag() * .62, hole = (1 - c) * R * 1.05, rot = c * Math.PI / 3;
      if (c <= .001) return;
      g.save();
      const outer = hexPath(cx, cy, R * 1.6, -Math.PI / 2), inner = hexPath(cx, cy, hole, -Math.PI / 2 + rot);
      const p = new Path2D(); p.addPath(outer); p.addPath(inner);
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R); gr.addColorStop(0, "#2a2112"); gr.addColorStop(.6, "#16110a"); gr.addColorStop(1, "#070503");
      g.globalAlpha = smooth(c * 3); g.fillStyle = gr; g.fill(p, "evenodd");
      // 葉片的縫：從洞的頂點斜斜拉出去
      g.strokeStyle = "rgba(214,180,101,.55)"; g.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + rot + i * Math.PI / 3, x0 = cx + Math.cos(a) * hole, y0 = cy + Math.sin(a) * hole, a2 = a + .9; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + Math.cos(a2) * R * 1.5, y0 + Math.sin(a2) * R * 1.5); g.stroke(); }
      g.lineWidth = 3; g.strokeStyle = "#d6b465"; g.shadowColor = "#ffd88a"; g.shadowBlur = 18; g.stroke(inner);
      g.restore();
    },
    // 卡片翻面拉遠：一道金色細線從中間往兩邊拉開（像卡片轉成側面），畫面暗下來再亮回收尾
    flip(q) {
      const k = 1 - Math.abs(q - .5) * 2, cx = W / 2, cy = H / 2;
      g.save(); g.fillStyle = `rgba(2,3,6,${smooth(k * 1.3).toFixed(3)})`; g.fillRect(0, 0, W, H);
      const w = W * ease(k) * .9; g.globalAlpha = smooth(k * 2) * (1 - smooth((k - .85) / .15) * .6);
      const lg = g.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0); lg.addColorStop(0, "rgba(227,196,126,0)"); lg.addColorStop(.5, "#fff1c9"); lg.addColorStop(1, "rgba(227,196,126,0)");
      g.fillStyle = lg; g.shadowColor = "#ffd88a"; g.shadowBlur = 20; g.fillRect(cx - w / 2, cy - 1, w, 2); g.restore();
    }
  };

  // ---------- 聲音 ----------
  let ac = null, master = null, amb = null, on = false;
  const btn = document.querySelector(".snd");
  function noiseBuf() { const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function startAudio() {
    ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    // 空間配樂：兩個低頻＋一個高八度的泛音，過一個慢慢開合的低通
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420; lp.Q.value = .7; lp.connect(master);
    const oscs = [55, 82.41, 110, 164.81].map((f, i) => { const o = ac.createOscillator(); o.type = i < 2 ? "sine" : "triangle"; o.frequency.value = f; const gg = ac.createGain(); gg.gain.value = [.22, .14, .06, .035][i]; o.connect(gg); gg.connect(lp); o.start(); return o; });
    const lfo = ac.createOscillator(); lfo.frequency.value = .05; const lg = ac.createGain(); lg.gain.value = 220; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    amb = { lp, oscs };
  }
  const ROOT = { bh: 55, balance: 58.27, city: 65.41, tunnel: 61.74, lab: 55, islands: 65.41, cinema: 51.91, stars: 58.27, vault: 49, outro: 55 };
  addEventListener("oxworld", e => { if (!amb) return; const r = ROOT[e.detail] || 55, now = ac.currentTime; amb.oscs.forEach((o, i) => o.frequency.setTargetAtTime(r * [1, 1.498, 2, 2.997][i], now, .8)); });
  function whoosh(kind) {
    if (!on || !ac) return;
    const now = ac.currentTime, src = ac.createBufferSource(); src.buffer = noiseBuf();
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = kind === "iris" ? 9 : 1.2;
    const gg = ac.createGain(); src.connect(bp); bp.connect(gg); gg.connect(master);
    const dur = kind === "warp" ? 1.3 : kind === "iris" ? .6 : .9;
    const [f0, f1] = kind === "warp" ? [200, 5200] : kind === "spot" ? [900, 120] : kind === "iris" ? [180, 160] : [400, 2600];
    bp.frequency.setValueAtTime(f0, now); bp.frequency.exponentialRampToValueAtTime(f1, now + dur * .8);
    gg.gain.setValueAtTime(0, now); gg.gain.linearRampToValueAtTime(kind === "iris" ? .9 : .5, now + dur * .35); gg.gain.exponentialRampToValueAtTime(.001, now + dur);
    src.start(now); src.stop(now + dur + .05);
    // 低頻的一下（世界換掉那一刻）
    const o = ac.createOscillator(), og = ac.createGain(); o.type = "sine"; o.frequency.setValueAtTime(kind === "warp" ? 90 : 70, now + dur * .3); o.frequency.exponentialRampToValueAtTime(32, now + dur * .3 + .6);
    og.gain.setValueAtTime(0, now + dur * .3); og.gain.linearRampToValueAtTime(.5, now + dur * .3 + .02); og.gain.exponentialRampToValueAtTime(.001, now + dur * .3 + .7); o.connect(og); og.connect(master); o.start(now + dur * .3); o.stop(now + dur + .8);
  }
  if (btn) btn.addEventListener("click", () => {
    if (!ac) startAudio();
    on = !on; ac.resume && ac.resume();
    master.gain.setTargetAtTime(on ? .55 : 0, ac.currentTime, .4);
    btn.setAttribute("aria-pressed", on); btn.classList.toggle("on", on);
  });
  addEventListener("oxintrodone", () => { });

  // ---------- 每一格 ----------
  const zones = Array.from(document.querySelectorAll("[data-tx]")), lastQ = new Map();
  const t0 = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const t = (now - t0) / 1000;
    g.clearRect(0, 0, W, H);
    for (const el of zones) {
      const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > H) { lastQ.delete(el); continue; }
      const q = clamp((H / 2 - r.top) / r.height, 0, 1), kind = el.dataset.tx;
      const pq = lastQ.get(el); if (pq != null && (pq - .5) * (q - .5) < 0) whoosh(kind); lastQ.set(el, q);
      if (q <= 0 || q >= 1) continue;
      if (reduce) { const k = 1 - Math.abs(q - .5) * 2; g.fillStyle = `rgba(3,4,9,${k})`; g.fillRect(0, 0, W, H); continue; }
      (T[kind] || T.flip)(q, t);
    }
  }
  requestAnimationFrame(frame);
})();
