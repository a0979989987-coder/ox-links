/* Lucas：紫金夜景時尚海報。
   封面照片整版出血，往下捲照片放大、標題字母往兩邊散開；拍立得卡片可以橫滑；城市窗戶一格一格亮，往下捲建築升起來。
   背景散景光點用 2D canvas 疊加發光；手指／游標有一圈聚光燈跟著；點一下像按快門：白光一閃、所有窗戶齊亮、快門聲。 */
(function () {
  const { P, esc, asset, icon, socials, SND, reveal, intro, finalize, toolbar, reduce, D } = OX;
  const B = document.body, app = document.getElementById("app");
  const letters = (P.name || "").toUpperCase().split("");
  const pols = [
    ...socials(P).map(s => ({ url: s.url, cap: s.label, sub: P.handle, img: s.k === "ig" ? asset(P.cover || P.photo) : "", ic: s.k, c: s.k === "ig" ? "#ff5fd2" : "#ffffff" })),
    { url: D.lineCommunity.url, cap: "LINE 社群", sub: D.lineCommunity.title, ic: "chat", c: "#06C755" },
    ...D.tools.map(t => ({ url: t.url, cap: t.label, sub: "OX 工具", ic: t.icon, c: "#ffd27a" }))
  ];
  // 城市
  let city = "", n = 0;
  [[0, 5, 11], [17, 3, 15], [29, 4, 8], [64, 4, 9], [77, 3, 14], [88, 4, 11]].forEach(([l, cols, rows]) => {
    let w = ""; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { w += `<i class="${Math.random() < .3 ? "v" : ""}" style="--d:${(n * .045 + Math.random() * .3).toFixed(2)}s"></i>`; n++; }
    city += `<div class="lu-b" style="left:${l}%;grid-template-columns:repeat(${cols},7px)">${w}</div>`;
  });

  app.innerHTML = `
  <canvas id="bokeh" aria-hidden="true"></canvas><div class="lu-spot" aria-hidden="true"></div><div class="lu-snap" aria-hidden="true"></div>
  <header class="lu-hero">
    <div class="ph" style="background-image:url('${esc(asset(P.cover || P.photo))}')"></div><div class="tone"></div><div class="grain"></div>
    <div class="lu-issue">NIGHT EDITION<small>${esc(P.handle)}</small></div>
    <div class="lu-title">
      ${P.alias ? `<span class="lu-script">${esc(P.alias)}</span>` : ""}
      <h1 class="lu-big" aria-label="${esc(P.name)}">${letters.map((ch, i) => `<span style="--k:${i - (letters.length - 1) / 2}">${esc(ch)}</span>`).join("")}</h1>
      <div class="lu-meta"><span>${esc(P.handle)}</span><nav class="lu-soc">${socials(P).map(s => `<a href="${esc(s.url)}" aria-label="${s.label}">${icon(s.k)}${s.k === "ig" ? "IG" : s.label}</a>`).join("")}</nav></div>
    </div>
  </header>
  <main class="lu">
    <div class="lu-h lu-first rv"><b>Free</b><i>tonight</i><small>LINE 官方</small></div>
    <a class="lu-sign rv" href="${esc(D.lineOfficial.url)}"><span class="script">open</span><span class="neon">免費教材</span>
      <span class="sub">${esc(D.lineOfficial.desc)}</span><span class="go">${icon("line")}${esc(D.lineOfficial.button)}</span></a>

    <div class="lu-h rv"><b>Links</b><i>polaroids</i><small>往左滑</small></div>
    <div class="lu-rail">${pols.map((p, i) => `<a class="lu-pol rv" data-d="${Math.min(i, 3) * .08}" href="${esc(p.url)}" style="--c:${p.c}">
      <span class="shot">${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy">` : icon(p.ic)}</span><span class="cap">${esc(p.cap)}<small>${esc(p.sub)}</small></span></a>`).join("")}</div>
    <p class="lu-hint">SWIPE ⟶</p>

    <section class="lu-city" aria-hidden="true"><div class="sky"></div><div class="wm">city lights</div>
      <svg class="arch" viewBox="0 0 390 380" preserveAspectRatio="none"><path d="M-20 380 Q 195 -10 410 380" stroke="#ffd27a" stroke-width="3.4"/><path d="M20 380 Q 195 70 370 380" stroke="#d6a8ff" stroke-width="2.6" style="animation-duration:1.9s"/></svg>
      <svg class="tower" viewBox="0 0 70 300" preserveAspectRatio="none"><path d="M35 0 L35 20 M30 20 L40 20 L44 90 L26 90 Z M24 90 L46 90 M26 90 L14 180 L56 180 L44 90 M12 180 L58 180 M14 180 L2 300 M56 180 L68 300 M14 180 Q35 220 56 180 M8 250 Q35 215 62 250 M26 90 L44 130 M44 90 L26 130"/></svg>
      ${city}</section>
    <footer class="lu-foot">© 2026 ${esc(P.name)} · OX.Trading</footer>
  </main>
  <div class="lu-dock"><a href="${esc(D.lineOfficial.url)}">${icon("line")}${esc(D.lineOfficial.button)}</a></div>`;
  toolbar(); finalize(); reveal(); OX.dock(".lu-dock", ".lu-sign");

  /* 捲動：照片放大、字母散開、建築升起 */
  const ph = document.querySelector(".lu-hero .ph"), big = document.querySelector(".lu-big"), cityEl = document.querySelector(".lu-city");
  const onScroll = OX.raf(() => {
    const y = scrollY, h = innerHeight, p = Math.min(1, y / h);
    ph.style.setProperty("--py", (y * .35) + "px"); ph.style.setProperty("--ps", (1.06 + p * .18).toFixed(3));
    big.style.setProperty("--spread", (p * 26).toFixed(1));
    const r = cityEl.getBoundingClientRect(), q = Math.max(0, Math.min(1, (h - r.top) / (r.height + h * .3)));
    cityEl.style.setProperty("--rise", ((1 - q) * 120).toFixed(0) + "px");
  });
  if (!reduce) { addEventListener("scroll", onScroll, { passive: true }); onScroll(); }
  if ("IntersectionObserver" in window) new IntersectionObserver(es => cityEl.classList.toggle("live", es[0].isIntersecting)).observe(cityEl);
  document.querySelectorAll(".lu-sign").forEach(el => el.addEventListener("enter", () => { SND.tone(60, .25, "sawtooth", .04); }));

  /* 散景 */
  const cv = document.getElementById("bokeh"), g = cv.getContext("2d");
  let W, H, dots = [], run = !reduce;
  const sprite = col => { const s = document.createElement("canvas"); s.width = s.height = 64; const x = s.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, col.replace("A", ".9")); gr.addColorStop(.55, col.replace("A", ".35")); gr.addColorStop(1, col.replace("A", "0")); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return s; };
  const SP = ["rgba(214,168,255,A)", "rgba(255,210,122,A)", "rgba(255,95,210,A)", "rgba(255,255,255,A)"].map(sprite);
  function size() { const d = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); }
  size(); addEventListener("resize", size);
  for (let i = 0; i < 26; i++) dots.push({ x: Math.random() * W, y: Math.random() * H, r: 14 + Math.random() * 46, vx: (Math.random() - .5) * .25, vy: -.1 - Math.random() * .3, s: SP[i % 4], ph: Math.random() * 6 });
  let last = 0;
  function loop(t) {
    if (!run) return; requestAnimationFrame(loop); if (t - last < 30) return; last = t;
    g.clearRect(0, 0, W, H); g.globalCompositeOperation = "lighter";
    for (const d of dots) {
      d.x += d.vx; d.y += d.vy; if (d.y < -60) { d.y = H + 60; d.x = Math.random() * W; } if (d.x < -60) d.x = W + 60; if (d.x > W + 60) d.x = -60;
      g.globalAlpha = .35 + .3 * Math.sin(t / 900 + d.ph); g.drawImage(d.s, d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  }
  if (run) requestAnimationFrame(loop); else cv.remove();
  document.addEventListener("visibilitychange", () => { run = !document.hidden && !reduce; if (run) requestAnimationFrame(loop); });

  /* 聚光燈、快門 */
  const spot = document.querySelector(".lu-spot");
  addEventListener("pointermove", OX.raf(e => { spot.style.setProperty("--sx", e.clientX + "px"); spot.style.setProperty("--sy", e.clientY + "px"); }), { passive: true });
  function snap() {
    if (reduce) return; B.classList.remove("snap"); void B.offsetWidth; B.classList.add("snap"); clearTimeout(B._st); B._st = setTimeout(() => B.classList.remove("snap"), 1000);
    SND.noise(.06, .35, 3000, "highpass"); setTimeout(() => SND.noise(.05, .25, 2000, "highpass"), 80);
  }
  addEventListener("pointerdown", e => { if (B.classList.contains("intro-on")) return; spot.style.setProperty("--sx", e.clientX + "px"); spot.style.setProperty("--sy", e.clientY + "px"); snap(); }, { passive: true });
  intro("LUCAS", () => {});
})();
