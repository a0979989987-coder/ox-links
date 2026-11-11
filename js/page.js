/* 產生頁面：body[data-person] 是某位創作者的專屬頁；body[data-hub] 是根目錄的四人入口。
   內容來自 data.js，場景與互動來自 themes.js。 */
(function () {
  const D = window.OX_DATA, TH = window.OX_THEMES || {};
  const B = document.body, ROOT = B.dataset.root || "";
  const $ = (s, el = document) => el.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const asset = p => /^https?:/.test(p) ? p : ROOT + p;
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  document.body.insertAdjacentHTML("beforeend", `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <symbol id="i-ig" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2"/><circle cx="12" cy="12" r="4.1"/></g><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/></symbol>
    <symbol id="i-threads" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M17.6 7.6C16.4 4.9 14.4 3.5 12 3.5c-4.6 0-7.6 3.5-7.6 8.5s3 8.5 7.6 8.5c3.6 0 6.3-2 6.6-5 .3-2.9-1.8-4.6-5-4.6-2.6 0-4 1.1-4 2.6 0 1.4 1.2 2.3 2.9 2.2 2.6-.2 3.8-2.1 3.6-6.3"/></symbol>
    <symbol id="i-yt" viewBox="0 0 24 24"><rect x="2.6" y="5.4" width="18.8" height="13.2" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10.3 9.2v5.6l4.8-2.8Z" fill="currentColor"/></symbol>
    <symbol id="i-line" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3.6c-5 0-9.1 3.3-9.1 7.4 0 3.6 3.2 6.7 7.6 7.3.3.1.7.2.8.5.1.2.1.6 0 .9l-.1.8c0 .2-.2.9.8.5s5.4-3.2 7.4-5.4c1.4-1.5 2-3 2-4.6 0-4.1-4.1-7.4-9.4-7.4Z"/><g fill="none" stroke="#fff" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><path d="M6.6 9.2v3.5h2"/><path d="M10.1 9.2v3.5"/><path d="M11.7 12.7V9.2l2.6 3.5V9.2"/><path d="M17.6 9.2h-1.9v3.5h1.9M15.7 10.95h1.8"/></g></symbol>
    <symbol id="i-chat" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5h11a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H9l-4 3.5V15H4a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z"/><path d="M19 9h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v2.5L16 18h-4"/></g></symbol>
    <symbol id="i-candle" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M7 3.5v3M7 15.5v3"/><rect x="5" y="6.5" width="4" height="9" rx="1"/><path d="M15.5 6v4M15.5 17.5v3"/><rect x="13.5" y="10" width="4" height="7.5" rx="1" fill="currentColor"/></g></symbol>
    <symbol id="i-coin" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.6"/><path d="M9.6 7.8h3.3a2 2 0 0 1 0 4H9.6Zm0 4h3.9a2.1 2.1 0 0 1 0 4.2H9.6ZM9.6 7.8v8.4M11.2 6.3v1.5M11.2 16.2v1.5"/></g></symbol>
    <symbol id="i-merge" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="14" r="5.6"/><circle cx="16.4" cy="8" r="3.6"/></g><circle cx="9" cy="14" r="2" fill="currentColor"/></symbol>
  </svg>`);

  const app = $("#app");

  /* ---------- 根目錄：四人入口 ---------- */
  if (B.dataset.hub !== undefined) {
    const col = { snr: "#ff5a4e", mono: "#e9eef5", jungle: "#35e0c2", night: "#d6a8ff" };
    app.innerHTML = `<header class="hero"><div class="avatar" style="width:84px;height:84px"><span class="ring"></span><img src="${esc(asset(D.brand.avatar))}" alt=""></div>
      <h1 class="name" style="font-size:28px">${esc(D.brand.sub)}</h1></header>
      <nav class="hub">${D.people.map(p => `<a href="${esc(p.id)}/" style="--c:${col[p.theme] || "#e6c274"}"><img src="${esc(asset(p.photo))}" alt=""><span><b>${esc(p.name)}</b><small>${esc(p.handle || "")}</small></span><i>›</i></a>`).join("")}</nav>
      <p class="foot">© 2026 OX.Trading</p>`;
    return;
  }

  /* ---------- 創作者專屬頁 ---------- */
  const P = D.people.find(p => p.id === B.dataset.person) || D.people[0];
  const T = TH[P.theme] || {};
  B.classList.add("theme-" + P.theme);
  $(".scene").innerHTML = T.scene ? T.scene() : "";
  $(".i-word").textContent = P.name;

  const ICON = { yt: ["i-yt", "YouTube"], ig: ["i-ig", "Instagram"], threads: ["i-threads", "Threads"] };
  const socials = ["yt", "ig", "threads"].filter(k => P.links && P.links[k])
    .map(k => `<a class="sbtn ${k}" href="${esc(P.links[k])}" aria-label="${esc(P.name)} 的 ${ICON[k][1]}"><svg viewBox="0 0 24 24"><use href="#${ICON[k][0]}"/></svg></a>`).join("");
  const big = (cls, d, ico, badge) => `<a class="big ${cls}" href="${esc(d.url)}" aria-label="${esc(d.button)}"><span class="flow" aria-hidden="true"></span><span class="big-in">
      <span class="big-head"><span class="big-ico"><svg viewBox="0 0 24 24"><use href="#${ico}"/></svg></span>
      <span class="big-text"><b class="t">${esc(d.title)}</b><span class="d">${esc(d.desc)}</span></span>${badge ? '<span class="badge">FREE</span>' : ""}</span>
      <span class="cta"><span class="shine" aria-hidden="true"></span><span>${esc(d.button)}</span>${arrow}</span></span></a>`;

  app.innerHTML = `
    <header class="hero">
      <div class="avatar reveal"><span class="ring"></span>${P.photo ? `<img src="${esc(asset(P.photo))}" alt="${esc(P.name)} 頭像">` : '<div class="ph">照片待提供</div>'}</div>
      <h1 class="name reveal">${esc(P.name)}</h1>
      ${P.handle ? `<p class="handle reveal">${esc(P.handle)}</p>` : ""}
      ${P.role ? `<span class="role reveal">${esc(P.role)}</span>` : ""}
      ${P.tags && P.tags.length ? `<p class="tags reveal">${P.tags.map(t => `<span>${esc(t)}</span>`).join("")}</p>` : ""}
      <div class="socials reveal">${socials}</div>
    </header>
    <section class="links">
      <div class="wrapbig reveal">${big("line-official", D.lineOfficial, "i-line", true)}</div>
      <div class="reveal">${big("line-community", D.lineCommunity, "i-chat", false)}</div>
      <p class="glabel reveal">OX 工具</p>
      <div class="tools reveal">${D.tools.map(t => `<a class="tool" href="${esc(t.url)}"><svg viewBox="0 0 24 24"><use href="#${t.icon}"/></svg><span>${esc(t.label)}</span></a>`).join("")}</div>
    </section>
    <p class="foot reveal">© 2026 ${esc(P.name)} · OX.Trading</p>`;

  document.querySelectorAll("a[href^='http']").forEach(a => { a.target = "_blank"; a.rel = "noopener"; });
  document.querySelectorAll("a, img").forEach(el => el.setAttribute("draggable", "false"));

  /* 點擊漣漪＋主題互動：手指碰到畫面任何地方；電腦滑鼠滑過頭像或連結區（2.5 秒最多一次） */
  document.addEventListener("pointerdown", e => {
    if (reduce || B.classList.contains("intro-on")) return;
    const t = e.target.closest(".big-in, .tool, .sbtn");
    if (t) { const r = t.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2, sp = document.createElement("span");
      sp.className = "ripple"; sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
      t.appendChild(sp); setTimeout(() => sp.remove(), 650); }
    T.act && T.act(B, e);
  }, { passive: true });
  if (matchMedia("(hover: hover)").matches) {
    let last = 0;
    document.addEventListener("pointerover", e => {
      if (reduce || e.pointerType !== "mouse" || B.classList.contains("intro-on") || !e.target.closest(".avatar, .links")) return;
      const now = Date.now(); if (now - last < 2500) return; last = now; T.act && T.act(B, e);
    });
  }

  /* 開場結束後：入場動畫、主題 start */
  function startPage() {
    B.classList.remove("intro-on");
    const rev = document.querySelectorAll(".reveal");
    if (reduce) { rev.forEach(el => el.classList.add("in")); B.classList.add("grown"); return; }
    rev.forEach((el, i) => { el.style.transitionDelay = Math.min(i * 0.06, 0.5) + "s"; requestAnimationFrame(() => el.classList.add("in")); });
    T.start && T.start(B);
  }
  const intro = $("#intro");
  if (reduce || !intro) { if (intro) intro.remove(); startPage(); }
  else {
    const sp = $(".i-sparks", intro);
    for (let i = 0; i < 18; i++) { const s = document.createElement("i"); s.style.setProperty("--a", (i * 20 + Math.random() * 12 - 6) + "deg"); sp.appendChild(s); }
    let ended = false;
    const end = () => { if (ended) return; ended = true; intro.classList.add("done"); startPage(); setTimeout(() => intro.remove(), 500); };
    const timer = setTimeout(end, 1450);
    intro.addEventListener("pointerdown", e => { e.stopPropagation(); clearTimeout(timer); end(); });
  }
})();
