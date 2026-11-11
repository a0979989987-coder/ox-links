/* 【草稿，版型與特效未定案】OX 連結頁 v2：把 data.js 的資料畫成畫面，並處理動態效果。內容請改 data.js。 */
(function () {
  const D = window.OX_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ext = a => { a.target = "_blank"; a.rel = "noopener"; };

  // 頂部
  $("#brandAvatar").src = D.brand.avatar;
  $("#brandName").textContent = D.brand.name;
  $("#brandSub").textContent = D.brand.sub;

  // 四頁切換列
  const pager = $("#pager");
  D.pages.forEach((p, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = p.label;
    if (i === 0) b.classList.add("on");
    if (!p.ready) { b.insertAdjacentHTML("beforeend", '<span class="soon">即將推出</span>'); b.addEventListener("click", () => say(p.label + " 即將推出")); }
    pager.appendChild(b);
  });

  // LINE 兩個大格
  [["#lineOfficial", D.lineOfficial], ["#lineCommunity", D.lineCommunity]].forEach(([sel, d]) => {
    const a = $(sel); a.href = d.url; ext(a);
    $(".t", a).textContent = d.title; $(".d", a).textContent = d.desc; $(".lbl", a).textContent = d.button;
    a.setAttribute("aria-label", d.button);
  });

  // OX 工具
  $("#tools").innerHTML = D.tools.map(t =>
    `<a class="tool" href="${esc(t.url)}"><svg viewBox="0 0 24 24"><use href="#${t.icon}"/></svg><span>${esc(t.label)}</span></a>`).join("");

  // 各人物卡的背景圖樣（SVG，只動 transform / opacity / dashoffset，手機比較順）
  const W = 400, H = 200;
  const DECOR = {
    snr: () => {
      let s = `<rect class="zone" x="0" y="44" width="${W}" height="22" fill="rgba(255,90,78,.14)"/>`;
      [40, 78, 118, 160].forEach((y, i) => s += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="${i % 2 ? "rgba(230,194,116,.35)" : "rgba(255,90,78,.4)"}" stroke-dasharray="6 6"/>`);
      s += `<path class="price" d="M0 150 L40 128 L70 140 L110 96 L140 112 L180 70 L210 86 L250 52 L290 74 L330 40 L400 58" fill="none" stroke="#ff6a5e" stroke-width="2.2"/>`;
      s += `<rect class="scan" x="0" y="0" width="60" height="${H}" fill="url(#g-scan)"/>`;
      return `<defs><linearGradient id="g-scan"><stop offset="0" stop-color="#ff5a4e" stop-opacity="0"/><stop offset=".5" stop-color="#ff5a4e" stop-opacity=".18"/><stop offset="1" stop-color="#ff5a4e" stop-opacity="0"/></linearGradient></defs>` + s;
    },
    mono: () => {
      let s = "";
      const hs = [40, 62, 30, 80, 54, 96, 70, 110, 88, 120, 76, 130];
      hs.forEach((h, i) => {
        const x = 150 + i * 21, up = i % 3 !== 1, c = up ? "rgba(233,238,245,.22)" : "rgba(233,238,245,.1)";
        s += `<g class="k" style="animation-delay:${(i * .12).toFixed(2)}s"><line x1="${x + 5}" x2="${x + 5}" y1="${H - 16 - h - 12}" y2="${H - 16}" stroke="${c}"/><rect x="${x}" y="${H - 16 - h}" width="10" height="${h - 8}" rx="1.5" fill="${c}"/></g>`;
      });
      return s;
    },
    chameleon: () => `<circle class="coin" cx="${W - 60}" cy="40" r="70" fill="url(#g-coin)"/><defs><radialGradient id="g-coin"><stop offset="0" stop-color="#ffd76a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd76a" stop-opacity="0"/></radialGradient></defs>`,
    neon: () => {
      let s = `<path class="arch" d="M120 ${H} Q260 -60 400 ${H}" fill="none" stroke="#ffd98a" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
      s += `<path class="arch" d="M170 ${H} Q290 10 400 ${H - 20}" fill="none" stroke="#c79bff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>`;
      const pts = [[40, 30, 10, "#c79bff"], [90, 160, 14, "#e6c274"], [300, 40, 18, "#c79bff"], [360, 150, 12, "#ffd98a"], [220, 120, 8, "#fff"], [160, 50, 6, "#e6c274"], [380, 90, 9, "#c79bff"]];
      pts.forEach(([x, y, r, c], i) => s += `<circle class="bokeh" style="animation-delay:${(i * .35).toFixed(2)}s" cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".5"/>`);
      return `<defs><filter id="blur-n"><feGaussianBlur stdDeviation="3"/></filter></defs><g filter="url(#blur-n)">${s}</g>`;
    }
  };
  const ICON = { yt: ["i-yt", "YouTube"], ig: ["i-ig", "Instagram"], threads: ["i-threads", "Threads"] };

  $("#people").innerHTML = D.people.map(p => {
    const photo = p.photo
      ? `<img src="${esc(p.photo)}" alt="${esc(p.name)} 頭像" loading="lazy" decoding="async">`
      : `<div class="ph">照片<br>待提供</div>`;
    const socials = ["yt", "ig", "threads"].filter(k => p.links && p.links[k])
      .map(k => `<a class="sbtn ${k}" href="${esc(p.links[k])}" aria-label="${esc(p.name)} 的 ${ICON[k][1]}"><svg viewBox="0 0 24 24"><use href="#${ICON[k][0]}"/></svg></a>`).join("");
    return `<article class="pcard reveal theme-${esc(p.theme)}" id="p-${esc(p.id)}">
      <div class="decor" aria-hidden="true"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${(DECOR[p.theme] || (() => ""))()}</svg></div>
      <div class="photo">${photo}</div>
      <div class="info">
        <h2 class="nm">${esc(p.name)}</h2>
        <span class="role">${esc(p.role)}</span>${p.verified ? "" : '<span class="uv">主業未驗證</span>'}
        ${p.tags && p.tags.length ? `<div class="tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
        <div class="socials">${socials}</div>
      </div>
    </article>`;
  }).join("");

  document.querySelectorAll("a[href^='http']").forEach(ext);
  document.querySelectorAll("a, img").forEach(el => el.setAttribute("draggable", "false"));

  // 入場動畫：滑到才出現，依順序錯開
  const rev = document.querySelectorAll(".reveal");
  rev.forEach((el, i) => el.style.transitionDelay = Math.min(i * 0.07, 0.5) + "s");
  if (reduce || !("IntersectionObserver" in window)) rev.forEach(el => el.classList.add("in"));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    rev.forEach(el => io.observe(el));
    // 只讓畫面裡的卡片跑背景動畫
    const live = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle("live", e.isIntersecting)));
    document.querySelectorAll(".pcard").forEach(el => live.observe(el));
  }

  // 點擊漣漪
  document.addEventListener("pointerdown", e => {
    const t = e.target.closest(".big-in, .tool, .sbtn, .pager button");
    if (!t || reduce) return;
    const r = t.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2;
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    if (getComputedStyle(t).position === "static") t.style.position = "relative";
    t.style.overflow = "hidden"; t.appendChild(s);
    setTimeout(() => s.remove(), 650);
  }, { passive: true });

  // 提示
  const toast = $(".toast"); let tt;
  function say(m) { toast.textContent = m; toast.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("on"), 1600); }

  // 背景金色粒子（輕量 2D canvas，數量少、DPR 上限 2、切到背景就停）
  const cv = $("#fx"), ctx = cv.getContext("2d");
  if (reduce || !ctx) { cv.remove(); return; }
  let w, h, dpr, parts = [], raf, running = true;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function spawn(init) {
    return { x: Math.random() * w, y: init ? Math.random() * h : h + 10, r: .6 + Math.random() * 1.8, v: .15 + Math.random() * .45,
      sway: Math.random() * Math.PI * 2, a: .25 + Math.random() * .55, hue: Math.random() < .2 ? "140,255,190" : "240,205,130" };
  }
  size(); addEventListener("resize", size);
  const N = w < 500 ? 34 : 60;
  for (let i = 0; i < N; i++) parts.push(spawn(true));
  function tick(t) {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.y -= p.v; p.sway += .01; const x = p.x + Math.sin(p.sway) * 8;
      if (p.y < -10) Object.assign(p, spawn(false));
      const tw = .6 + .4 * Math.sin(t / 600 + p.sway * 3);
      ctx.beginPath(); ctx.fillStyle = `rgba(${p.hue},${(p.a * tw).toFixed(3)})`;
      ctx.shadowColor = `rgba(${p.hue},.8)`; ctx.shadowBlur = p.r * 4;
      ctx.arc(x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    if (running) raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden; if (running) raf = requestAnimationFrame(tick); else cancelAnimationFrame(raf);
  });
})();
