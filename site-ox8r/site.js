/* OX 官網：黑洞以外的互動（出現動畫、上方列、選單、工具傾斜、製作中換畫面、轉白金波浪、創辦人頭像光條、黑卡轉正） */
(function () {
  "use strict";
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const vh = () => window.innerHeight;
  // 一段區塊滑過的進度：區塊頂碰到畫面頂＝0，區塊底碰到畫面底＝1
  const span = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - vh()), 0, 1); };

  // 出現
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .18, rootMargin: "0px 0px -6% 0px" });
    $$("[data-rv]").forEach(el => io.observe(el));
  } else $$("[data-rv]").forEach(el => el.classList.add("in"));

  // 選單
  const nav = $("#nav"), menuBtn = $(".nav-menu"), drawer = $("#drawer");
  const setMenu = on => { document.documentElement.classList.toggle("menu-open", on); menuBtn.setAttribute("aria-expanded", on); drawer.setAttribute("aria-hidden", !on); };
  menuBtn.addEventListener("click", () => setMenu(!document.documentElement.classList.contains("menu-open")));
  drawer.addEventListener("click", e => { if (e.target === drawer || e.target.closest("a")) setMenu(false); });

  // 卡面（會員首頁 11/13 定稿那張：方塊卡面、logo 銀線、拉絲鈦嵌大 logo、金斜邊）
  $$("[data-face]").forEach(el => {
    const dots = `<span class="oc-dots" aria-hidden="true">${"<b><i></i><i></i><i></i><i></i></b>".repeat(3)}</span>`;
    el.innerHTML = `<span class="oc-body"></span><span class="oc-lines"></span><span class="oc-light"></span>
      <span class="oc-logo" aria-hidden="true"><i></i><img src="img/card/eng.png" alt=""></span><span class="oc-sheen"></span>
      <span class="oc-bevel"></span><span class="oc-silver"></span>
      <span class="oc-brand">OX TRADING</span><span class="oc-since"><small>SINCE</small><span class="oc-emb">2026</span></span>
      ${dots}<span class="oc-name oc-emb zh">你的名字</span>`;
  });

  // ---------- 轉白金的粒子波浪（學 Hyperliquid 那片一直流的點） ----------
  const wave = $("#wave"), wg = wave.getContext("2d");
  let wW = 0, wH = 0;
  function sizeWave() { const d = Math.min(devicePixelRatio || 1, 2), r = wave.getBoundingClientRect(); wW = r.width; wH = r.height; wave.width = Math.round(wW * d); wave.height = Math.round(wH * d); wg.setTransform(d, 0, 0, d, 0, 0); }
  const COLS = innerWidth < 700 ? 54 : 96, ROWS = innerWidth < 700 ? 26 : 34;
  function drawWave(t, k, light) {
    wg.clearRect(0, 0, wW, wH);
    if (k <= 0) return;
    // 黑底時是淡金，亮底時是深一點的金（照底色的亮度慢慢換）
    const col = [lerp(233, 150, light), lerp(201, 118, light), lerp(135, 44, light)].map(Math.round).join(",");
    const horizon = wH * lerp(.98, .46, ease(k)), depth = wH * .9;
    for (let j = 0; j < ROWS; j++) {
      const zf = j / (ROWS - 1), z = 1 + zf * 7;                     // 近 → 遠
      for (let i = 0; i < COLS; i++) {
        const xf = i / (COLS - 1) - .5;
        const h = Math.sin(xf * 7 + t * .55 + zf * 4.2) * .55 + Math.sin(xf * 13 - t * .35 + zf * 9) * .22 + Math.sin(zf * 6 - t * .8) * .35;
        const sx = wW / 2 + xf * wW * 2.4 / z, sy = horizon + (depth / z) * .55 - h * 72 / z * (1 + k);
        if (sx < -4 || sx > wW + 4 || sy > wH + 4) continue;
        const a = clamp(.16 + (h + 1) * .36, 0, .95) * (1 - zf * .5) * clamp(k * 2.2, 0, 1) * (1 + light * .25);
        const s = clamp(3 / z + .5, .7, 2.8);
        wg.fillStyle = `rgba(${col},${a.toFixed(3)})`; wg.fillRect(sx - s / 2, sy - s / 2, s, s);
      }
    }
  }

  // ---------- 創辦人頭像：笑臉＋一圈跟著「說話」跳的光條（照教學短片 drawAvatar，紙底用藍 102,141,198） ----------
  const av = $("#avatar"), ag = av.getContext("2d"), face = new Image(); face.src = "img/av/snsheng.png";
  const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  function sizeAv() { const d = Math.min(devicePixelRatio || 1, 2.5), r = av.getBoundingClientRect(); if (!r.width) return; av.width = Math.round(r.width * d); av.height = Math.round(r.height * d); ag.setTransform(d, 0, 0, d, 0, 0); av._w = r.width; }
  function drawAv(t) {
    const W = av._w || 190, x = W / 2, y = W / 2, r = W * .3, rc = "102,141,198";
    const env = clamp(.42 + .3 * Math.sin(t * 2.3) * Math.sin(t * .9 + 1) + .18 * Math.sin(t * 5.1), 0, 1);
    ag.clearRect(0, 0, W, W);
    const g = ag.createRadialGradient(x, y, r * .9, x, y, r * (1.5 + .5 * env)); g.addColorStop(0, `rgba(${rc},${.14 + .3 * env})`); g.addColorStop(1, `rgba(${rc},0)`);
    ag.fillStyle = g; ag.beginPath(); ag.arc(x, y, r * (1.5 + .5 * env), 0, Math.PI * 2); ag.fill();
    const N = 44, fi = Math.round(t * 12); ag.lineCap = "round";
    for (let i = 0; i < N; i++) {
      const ang = i / N * Math.PI * 2 - Math.PI / 2, jit = .35 + .65 * hash(i * 3.1 + fi * .37), len = 2 + r * .34 * env * jit, r0 = r + r * .14;
      ag.strokeStyle = `rgba(${rc},${.35 + .5 * env})`; ag.lineWidth = Math.max(1.6, W * .012);
      ag.beginPath(); ag.moveTo(x + Math.cos(ang) * r0, y + Math.sin(ang) * r0); ag.lineTo(x + Math.cos(ang) * (r0 + len), y + Math.sin(ang) * (r0 + len)); ag.stroke();
    }
    ag.save(); ag.beginPath(); ag.arc(x, y, r, 0, Math.PI * 2); ag.clip();
    if (face.complete && face.naturalWidth) ag.drawImage(face, x - r, y - r, r * 2, r * 2); else { ag.fillStyle = "#f2c94c"; ag.fill(); }
    ag.restore();
    ag.lineWidth = Math.max(2, W * .016) + 2 * env; ag.strokeStyle = `rgba(${rc},${.7 + .3 * env})`; ag.shadowColor = `rgba(${rc},.6)`; ag.shadowBlur = 6 + 12 * env;
    ag.beginPath(); ag.arc(x, y, r + 1.5, 0, Math.PI * 2); ag.stroke(); ag.shadowBlur = 0;
  }
  let avSeen = false;
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { avSeen = es[0].isIntersecting; }).observe(av); else avSeen = true;

  // ---------- 每一格 ----------
  const tools = $$(".tool"), build = $("#build"), bsteps = $$(".bstep"), bimgs = $$(".build-phone img"), bdots = $$(".build-dots i");
  const dawn = $("#dawn"), dstage = $(".dawn-stage"), member = $("#member"), mstage = $(".member-stage"), crot = $(".card-rot"), card = $(".oh-card");
  const sections = $$("[data-theme]"), links = $$(".nav-links a");
  let bi = -1, last = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    const t = now / 1000;
    // 上方列：沒有 WebGL 的時候照位置判斷有沒有滑過黑洞
    if (!window.OXBH) document.documentElement.classList.toggle("past-hero", scrollY > vh() * 1.5);
    // 上方列換黑白、目前段落
    let theme = "dark", cur = null;
    for (const s of sections) { const r = s.getBoundingClientRect(); if (r.top <= 64 && r.bottom > 64) { theme = s.dataset.theme; cur = s.id; } }
    { const r = dawn.getBoundingClientRect(); if (r.top <= 64 && r.bottom > 64) theme = span(dawn) > .42 ? "light" : "dark"; }
    nav.classList.toggle("is-light", theme === "light");
    links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + (cur === "build" ? "build" : cur)));

    // 工具：手機從往後倒慢慢立起來
    tools.forEach(el => { const r = el.getBoundingClientRect(), q = clamp((vh() - r.top) / (vh() * .7), 0, 1); el.style.setProperty("--tilt", (1 - ease(q)).toFixed(3)); });

    // 製作中：手機釘住，往下滑換畫面
    { const p = span(build), n = bsteps.length, i = clamp(Math.floor(p * n * .999), 0, n - 1);
      if (i !== bi) { bi = i; bsteps.forEach((e, k) => e.classList.toggle("on", k === i)); bimgs.forEach((e, k) => e.classList.toggle("on", k === i)); bdots.forEach((e, k) => e.classList.toggle("on", k === i)); } }

    // 轉白金：底色從黑變暖白，波浪升上來，標題出現
    { const r = dawn.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh()) {
        // 進場時（還沒釘住）波浪先在黑底上升起來；釘住之後才慢慢變亮，最後標題出現
        const enter = clamp((vh() - r.top) / vh(), 0, 1), p = span(dawn), lk = smooth((p - .12) / .4);
        // 黑 → 深金褐 → 暖白，中間不經過灰色（像天亮）
        const m = lk < .5 ? lk * 2 : (lk - .5) * 2, A = lk < .5 ? [3, 4, 9] : [92, 72, 38], B = lk < .5 ? [92, 72, 38] : [246, 243, 236];
        const c = [0, 1, 2].map(i => Math.round(lerp(A[i], B[i], lk < .5 ? m * m : Math.sqrt(m)))).join(",");
        dstage.style.setProperty("--dawn-bg", c);
        dstage.style.setProperty("--dawn-t", smooth((p - .5) / .25).toFixed(3));
        if (!wW) sizeWave();
        drawWave(reduce ? 2 : t, clamp(enter * .55 + p * .45, 0, 1), lk);
      } }

    // 黑卡：像 Apple Card 那樣，從斜躺轉正
    { const p = span(member), a = ease(p / .55), b = smooth((p - .5) / .2);
      crot.style.transform = `translateY(${((1 - a) * 22).toFixed(2)}%) rotateX(${((1 - a) * 62).toFixed(2)}deg) rotateZ(${((1 - a) * -22).toFixed(2)}deg) scale(${(.82 + .18 * a).toFixed(4)})`;
      mstage.style.setProperty("--m-b", b.toFixed(3));
      // 閒置時卡片自己慢慢晃，流光跟著角度走
      const tx = reduce ? 0 : Math.sin(t * .62) * .34 * a + (1 - a) * -.9, ty = reduce ? 0 : Math.sin(t * .47 + 1.3) * .24 * a;
      card.style.setProperty("--tx", tx.toFixed(3)); card.style.setProperty("--ty", ty.toFixed(3)); }

    if (avSeen && (now - last > 33 || reduce)) { last = now; drawAv(reduce ? 1 : t); }
  }
  addEventListener("resize", () => { sizeWave(); sizeAv(); });
  sizeAv(); face.onload = () => drawAv(0);
  requestAnimationFrame(tick);
})();
