/* OX 連結頁 v2 第一頁（定案版）：把 data.js 畫成畫面，處理開場、入場、各人物互動與背景粒子。
   內容請改 data.js；各人背景圖樣與互動在下面的 THEMES。 */
(function () {
  const D = window.OX_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hoverable = matchMedia("(hover: hover)").matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- 內容 ---------- */
  $("#brandAvatar").src = D.brand.avatar;
  $("#brandName").textContent = D.brand.name;
  $("#brandSub").textContent = D.brand.sub;

  const pager = $("#pager");
  D.pages.forEach((p, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.innerHTML = esc(p.label) + (p.ready ? "" : "<small>即將推出</small>");
    if (i === 0) b.classList.add("on");
    if (!p.ready) b.addEventListener("click", () => say(p.label + " 即將推出"));
    pager.appendChild(b);
  });

  [["#lineOfficial", D.lineOfficial], ["#lineCommunity", D.lineCommunity]].forEach(([sel, d]) => {
    const a = $(sel); a.href = d.url;
    $(".t", a).textContent = d.title; $(".d", a).textContent = d.desc; $(".lbl", a).textContent = d.button;
    a.setAttribute("aria-label", d.button);
  });

  $("#tools").innerHTML = D.tools.map(t =>
    `<a class="tool" href="${esc(t.url)}"><svg viewBox="0 0 24 24"><use href="#${t.icon}"/></svg><span>${esc(t.label)}</span></a>`).join("");

  /* ---------- 各人物背景與互動 ---------- */
  const THEMES = {
    // 阿聖：暗紅交易室。碰到時 K 線一根根長出來，雜誌封面光影掃過
    snr: {
      decor() {
        const n = 16; let ks = "", p = 50;
        for (let i = 0; i < n; i++) {
          const up = Math.random() > .38, h = 30 + i * 3.6 + rnd(-8, 8);
          const bt = rnd(8, 22), bb = rnd(8, 22);
          ks += `<span class="k" style="--i:${i};--h:${h.toFixed(0)}%;--bt:${bt.toFixed(0)}%;--bb:${bb.toFixed(0)}%;--c:${up ? "#ff5a4e" : "#e6c274"}"><b></b></span>`;
        }
        const tick = "SNR  支撐  壓力  ICT  ORDER BLOCK  FVG  BTC  ETH  ";
        return `<div class="grid"></div><div class="ks">${ks}</div><div class="ticker">${tick.repeat(6)}</div><span class="mag">TRADING ROOM</span>`;
      },
      act(card) { replay(card, "grown"); replay(card, "flash", 1300); }
    },
    // 老承：冷調黑灰。碰到時一道白光掃過整張卡
    mono: {
      decor: () => `<div class="brush"></div><div class="hair"></div>`,
      act(card) { replay(card, "flash", 950); }
    },
    // 交易變色龍：叢林霓虹，藤蔓與光點流動，鱗片慢慢變色；點下去金幣閃、鱗片換色
    jungle: {
      decor() {
        const vines = `<svg class="vines" viewBox="0 0 400 180" preserveAspectRatio="none">
          <path d="M-10 170 C 80 120, 120 190, 200 130 S 330 60, 410 90" stroke="#35e0c2" stroke-width="2" opacity=".55"/>
          <path d="M-10 30 C 70 60, 140 0, 220 40 S 350 120, 410 40" stroke="#8cff5a" stroke-width="1.6" opacity=".4" style="animation-duration:4.2s"/>
          <path d="M120 -10 C 160 60, 260 40, 280 190" stroke="#2dd4ff" stroke-width="1.2" opacity=".35" style="animation-duration:5s"/>
        </svg>`;
        let dots = "";
        for (let i = 0; i < 10; i++) dots += `<i class="dot" style="--x:${rnd(30, 98).toFixed(0)}%;--t:${rnd(3.5, 6).toFixed(1)}s;--d:-${rnd(0, 6).toFixed(1)}s;--dx:${rnd(-30, 30).toFixed(0)}px"></i>`;
        return `<div class="scale s0 on"></div><div class="scale s1"></div><div class="scale s2"></div><div class="scale s3"></div>${vines}${dots}<div class="coinflash"></div>`;
      },
      init(card) {
        card._si = 0;
        card._timer = setInterval(() => { if (card.classList.contains("live") && !document.hidden) shiftScale(card); }, 3200);
      },
      act(card) { replay(card, "flash", 850); shiftScale(card); }
    },
    // Lucas：紫金夜景，散景光點飄動，建築燈光一格一格亮；點下去整排燈齊亮＋金紫光爆
    night: {
      decor() {
        let bk = "";
        const cs = ["rgba(214,168,255,.9)", "rgba(255,217,138,.9)", "rgba(255,255,255,.8)", "rgba(255,150,220,.8)"];
        for (let i = 0; i < 14; i++) bk += `<i class="bk" style="--x:${rnd(-5, 95).toFixed(0)}%;--y:${rnd(-10, 70).toFixed(0)}%;--s:${rnd(14, 46).toFixed(0)}px;--c:${cs[i % 4]};--t:${rnd(3, 6).toFixed(1)}s;--d:-${rnd(0, 5).toFixed(1)}s;--dx:${rnd(-20, 20).toFixed(0)}px;--dy:${rnd(-16, 10).toFixed(0)}px"></i>`;
        const blds = [[52, 3, 5], [66, 3, 9], [79, 4, 6], [92, 2, 8]];
        let b = "", n = 0;
        blds.forEach(([left, cols, rows]) => {
          let w = "";
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            w += `<i class="${Math.random() < .3 ? "v" : ""}" style="--d:${(n * 0.13 + rnd(0, .2)).toFixed(2)}s;--n:${n}"></i>`; n++;
          }
          b += `<div class="bldg" style="left:${left}%;grid-template-columns:repeat(${cols},6px)">${w}</div>`;
        });
        const arch = `<svg class="arch" viewBox="0 0 400 180" preserveAspectRatio="none">
          <path d="M150 190 Q 270 -40 410 150" stroke="#ffd98a" stroke-width="3.2"/>
          <path d="M190 190 Q 290 10 410 170" stroke="#d6a8ff" stroke-width="2.6" style="animation-duration:1.9s"/></svg>`;
        return `<div class="aurora"></div>${bk}${arch}${b}`;
      },
      act(card) { replay(card, "flash", 1000); }
    }
  };

  function replay(el, cls, removeAfter) {
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    if (removeAfter) { clearTimeout(el["_t" + cls]); el["_t" + cls] = setTimeout(() => el.classList.remove(cls), removeAfter); }
  }
  function shiftScale(card) {
    const ls = $$(".scale", card); ls[card._si].classList.remove("on");
    card._si = (card._si + 1) % ls.length; ls[card._si].classList.add("on");
  }

  const ICON = { yt: ["i-yt", "YouTube"], ig: ["i-ig", "Instagram"], threads: ["i-threads", "Threads"] };
  $("#people").innerHTML = D.people.map(p => {
    const T = THEMES[p.theme] || { decor: () => "" };
    const photo = p.photo ? `<img src="${esc(p.photo)}" alt="${esc(p.name)} 頭像" decoding="async">` : `<div class="ph">照片<br>待提供</div>`;
    const socials = ["yt", "ig", "threads"].filter(k => p.links && p.links[k])
      .map(k => `<a class="sbtn ${k}" href="${esc(p.links[k])}" aria-label="${esc(p.name)} 的 ${ICON[k][1]}"><svg viewBox="0 0 24 24"><use href="#${ICON[k][0]}"/></svg></a>`).join("");
    return `<article class="pcard reveal theme-${esc(p.theme)}" data-theme="${esc(p.theme)}" id="p-${esc(p.id)}">
      <div class="decor" aria-hidden="true">${T.decor()}</div>
      <div class="photo">${photo}</div>
      <div class="info">
        <h2 class="nm">${esc(p.name)}</h2>
        ${p.handle ? `<p class="handle">${esc(p.handle)}</p>` : ""}
        ${p.role ? `<span class="role">${esc(p.role)}</span>` : ""}
        ${p.tags && p.tags.length ? `<div class="tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
        <div class="socials">${socials}</div>
      </div>
      <div class="top" aria-hidden="true"></div>
    </article>`;
  }).join("");

  const cards = $$(".pcard");
  cards.forEach(card => {
    const T = THEMES[card.dataset.theme]; if (!T) return;
    if (T.init && !reduce) T.init(card);
    const go = () => { if (!reduce && T.act) T.act(card); };
    card.addEventListener("pointerdown", go, { passive: true });
    if (hoverable) card.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") go(); });
    card._go = go;
  });

  $$("a[href^='http']").forEach(a => { a.target = "_blank"; a.rel = "noopener"; });
  $$("a, img").forEach(el => el.setAttribute("draggable", "false"));

  /* ---------- 點擊漣漪 ---------- */
  document.addEventListener("pointerdown", e => {
    const t = e.target.closest(".big-in, .tool, .sbtn, .pager button");
    if (!t || reduce) return;
    const r = t.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2;
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    t.appendChild(s); setTimeout(() => s.remove(), 650);
  }, { passive: true });

  const toast = $(".toast"); let tt;
  function say(m) { toast.textContent = m; toast.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("on"), 1600); }

  /* ---------- 入場、畫面內才跑動畫、第一次滑到卡片自動演示一次 ---------- */
  function startPage() {
    document.body.classList.remove("intro-on");
    const rev = $$(".reveal");
    if (reduce || !("IntersectionObserver" in window)) { rev.forEach(el => el.classList.add("in")); cards.forEach(c => c.classList.add("live", "grown")); return; }
    let k = 0;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = Math.min(k++ * 0.07, 0.42) + "s";
      e.target.classList.add("in"); io.unobserve(e.target);
    }), { rootMargin: "0px 0px -6% 0px" });
    rev.forEach(el => io.observe(el));
    const live = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle("live", e.isIntersecting)), { rootMargin: "40px" });
    const demo = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { setTimeout(() => e.target._go && e.target._go(), 500); demo.unobserve(e.target); }
    }), { threshold: .65 });
    cards.forEach(c => { live.observe(c); demo.observe(c); });
  }

  /* ---------- 開場：K 線衝上來炸開（約 1.8 秒，點一下跳過） ---------- */
  const intro = $("#intro");
  if (reduce || !intro) { if (intro) intro.remove(); startPage(); }
  else {
    const sp = $(".i-sparks", intro);
    for (let i = 0; i < 18; i++) { const s = document.createElement("i"); s.style.setProperty("--a", (i * 20 + rnd(-6, 6)) + "deg"); s.style.animationDelay = (0.95 + rnd(0, .08)).toFixed(2) + "s"; sp.appendChild(s); }
    let ended = false;
    const end = () => { if (ended) return; ended = true; intro.classList.add("done"); startPage(); setTimeout(() => intro.remove(), 500); };
    const timer = setTimeout(end, 1450);
    intro.addEventListener("pointerdown", () => { clearTimeout(timer); end(); });
  }

  /* ---------- 背景金色粒子（輕量 2D canvas） ---------- */
  const cv = $("#fx"), ctx = cv && cv.getContext("2d");
  if (reduce || !ctx) { if (cv) cv.remove(); return; }
  let w, h, parts = [], raf, running = true;
  function size() { const dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  const spawn = init => ({ x: Math.random() * w, y: init ? Math.random() * h : h + 10, r: rnd(.6, 2.2), v: rnd(.15, .55), sw: rnd(0, 6.28), a: rnd(.25, .8), c: Math.random() < .2 ? "140,255,190" : "240,205,130" });
  size(); addEventListener("resize", size);
  for (let i = 0, N = w < 500 ? 30 : 56; i < N; i++) parts.push(spawn(true));
  // 光暈用預先畫好的小圖貼上，比每顆都設 shadowBlur 省很多
  const sprite = c => { const s = document.createElement("canvas"); s.width = s.height = 32; const g = s.getContext("2d"), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, `rgba(${c},1)`); gr.addColorStop(.25, `rgba(${c},.6)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return s; };
  const SP = { "240,205,130": sprite("240,205,130"), "140,255,190": sprite("140,255,190") };
  function tick(t) {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.y -= p.v; p.sw += .01; if (p.y < -10) Object.assign(p, spawn(false));
      ctx.globalAlpha = p.a * (.6 + .4 * Math.sin(t / 600 + p.sw * 3));
      const s = p.r * 7; ctx.drawImage(SP[p.c], p.x + Math.sin(p.sw) * 8 - s / 2, p.y - s / 2, s, s);
    }
    if (running) raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  document.addEventListener("visibilitychange", () => { running = !document.hidden; cancelAnimationFrame(raf); if (running) raf = requestAnimationFrame(tick); });
})();
