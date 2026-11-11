/* 老承：冷調黑灰極簡精品，產業研究報告排版。
   互動：手指或游標移動時金屬名牌的反光角度跟著轉；碰一下畫面，一道白光用 3 秒慢慢掃過整頁（並有一聲清脆的鈴）。
   捲動：每一章的細線從左畫到右，章節進場時白光自動掃過一次。 */
(function () {
  const { P, esc, asset, icon, socials, SND, reveal, finalize, toolbar, reduce, videos, fetchedAt, D } = OX;
  const B = document.body, app = document.getElementById("app"), vids = videos("cheng");
  const [feat, ...rest] = vids;
  let n = 0; const no = () => String(++n).padStart(2, "0");
  // 單色線條小圖示（只給老承頁用）
  const IC = {
    chart: '<path d="M3 20h18M5 16l4-5 3 3 6-8" /><circle cx="18" cy="6" r="1.2"/>',
    book: '<path d="M4 5.5C6.5 4 9.5 4 12 5.5v14C9.5 18 6.5 18 4 19.5zM20 5.5C17.5 4 14.5 4 12 5.5v14c2.5-1.5 5.5-1.5 8 0z"/>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    play: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M10 9.5v5l4.5-2.5z"/>'
  };
  const ic = k => `<svg class="ci" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
  const aboutIc = ["chart", "book", "shield"];
  const terms = ["台股解盤", "產業分析", "OB 訂單塊", "FVG", "高業法規", "技術分析", "多空結構", "籌碼", "支撐壓力", "每日盤勢"];
  const sec = (en, zh) => `<div class="ch-no rv"><b>${no()}</b><span>${en}</span><i class="ch-dia"></i><em>${zh}</em></div><div class="ch-hair rv"></div>`;
  app.innerHTML = `
  <div class="ch-tex" aria-hidden="true"></div><canvas id="field" aria-hidden="true"></canvas><div class="ch-sheen" aria-hidden="true"></div>
  <div class="ch">
    <header class="ch-head rv"><span>Research Note</span><span class="v">Vol. 2026</span></header>

    <section class="ch-plate rv">
      <i class="ch-glint g1"></i><i class="ch-glint g2"></i><i class="ch-edge"></i>
      <div class="ch-bezel"><img src="${esc(asset(P.cover || P.photo))}" alt="${esc(P.name)}"><span>COVER</span></div>
      <div class="ch-ttl">
        <small class="ch-kick">Taiwan Equity Research</small>
        <h1 class="ch-name">${esc(P.name)}</h1>
        <p class="ch-handle">${esc(P.handle)}</p>
        ${P.role ? `<span class="ch-role">${esc(P.role)}</span>` : ""}
      </div>
      ${P.motto ? `<p class="ch-motto">「${esc(P.motto)}」</p>` : ""}
    </section>

    <a data-line="official" class="ch-invite rv" href="${esc(D.lineOfficial.url)}"><div class="in"><i class="ch-glint g3"></i>
      <div class="top">${icon("line", "lg")}<small>LINE OFFICIAL · INVITATION</small></div>
      <h3>免費教材</h3><p>${esc(D.lineOfficial.desc)}</p>
      <span class="go">${esc(D.lineOfficial.button)}${icon("arrow")}</span></div></a>
    <a data-line="community" class="ch-row ch-comm rv" href="${esc(D.lineCommunity.url)}">${icon("chat", "ico")}<span><b>${esc(D.lineCommunity.title)}</b><small>LINE COMMUNITY</small></span>${icon("arrow")}</a>
  </div>

  <div class="ch-tick" aria-hidden="true"><div>${[...terms, ...terms].map(t => `<span>${t}</span><i>◆</i>`).join("")}</div></div>

  <div class="ch">
    <section class="ch-sec">
      ${sec("Channels", "追蹤老承")}
      <div class="ch-soc">${socials(P).map(s => `<a class="ch-card rv" href="${esc(s.url)}">${icon(s.k)}<b>${s.k === "yt" ? "YouTube" : s.label}</b><small>${esc(P.handle)}</small></a>`).join("")}</div>
    </section>

    ${P.about && P.about.length ? `<section class="ch-sec">
      ${sec("Profile", "簡介")}
      <div class="ch-points">${P.about.map((t, i) => `<div class="ch-pt rv">${ic(aboutIc[i] || "chart")}<span class="k">${String(i + 1).padStart(2, "0")}</span><p>${esc(t)}</p></div>`).join("")}</div>
      <span class="ch-src rv">Source: ${esc(P.aboutSource || "")}</span>
    </section>` : ""}

    ${feat ? `<section class="ch-sec">
      ${sec("Latest", "最新影片")}
      <a class="ch-feat ch-card rv" href="${esc(feat.url)}"><div class="img"><img src="${esc(asset(feat.thumb))}" alt="" loading="lazy">${ic("play")}</div>
        <div class="cap"><small>${esc(feat.date.replace(/-/g, "."))} · FEATURED</small><b>${esc(feat.display || feat.title)}</b></div></a>
      <div class="ch-grid">${rest.slice(0, 4).map(v => `<a class="ch-card ch-vid rv" href="${esc(v.url)}">${v.thumb ? `<div class="img"><img src="${esc(asset(v.thumb))}" alt="" loading="lazy"></div>` : ""}<small>${esc(v.date.replace(/-/g, "."))}</small><b>${esc(v.display || v.title)}</b></a>`).join("")}</div>
      <span class="ch-src rv">Source: YouTube 頻道公開 RSS · ${esc(fetchedAt || "")}</span>
    </section>` : ""}

    <section class="ch-sec">
      ${sec("Instruments", "OX 工具")}
      <div class="ch-tools">${D.tools.map((t, i) => `<a class="ch-card ch-tool rv" href="${esc(t.url)}"><span class="k">${"ABC"[i]}</span>${icon(t.icon)}<span class="t"><b>${esc(t.label)}</b><small>${esc(t.url.replace(/^https?:\/\//, ""))}</small></span>${icon("arrow")}</a>`).join("")}</div>
    </section>
    <footer class="ch-foot rv"><b>${esc(P.motto || P.name)}</b>© 2026 ${esc(P.name)} · OX.Trading<br>影片內容為個人觀點分享，不構成投資建議。</footer>
  </div>
  <div class="ch-dock"><a href="${esc(D.lineOfficial.url)}"><i></i>${esc(D.lineOfficial.button)}${icon("arrow")}</a></div>`;
  toolbar(); finalize(); reveal(); OX.dock(".ch-dock");

  // 白光：慢、看得到；同一時間只跑一道
  let busy = false;
  function sheen(sound) {
    if (reduce || busy) return; busy = true;
    B.classList.remove("sheen"); void B.offsetWidth; B.classList.add("sheen");
    if (sound) { SND.tone(1318, 1.6, "sine", .08); setTimeout(() => SND.tone(1975, 1.2, "sine", .05), 90); }
    setTimeout(() => { B.classList.remove("sheen"); busy = false; }, 3050);
  }
  // 金屬反光角度跟著手指／游標
  const plate = document.querySelector(".ch-plate"), bez = document.querySelector(".ch-bezel");
  const tilt = OX.raf(e => {
    const x = e.clientX / innerWidth, y = e.clientY / innerHeight;
    plate.style.setProperty("--ang", (95 + x * 50 + y * 10) + "deg"); bez.style.setProperty("--bz2", (130 + x * 60) + "deg");
  });
  addEventListener("pointermove", tilt, { passive: true });
  addEventListener("click", e => { tilt(e); sheen(true); });
  // 每一章進場時白光掃過一次
  document.querySelectorAll(".ch-no").forEach(el => el.addEventListener("enter", () => setTimeout(() => sheen(false), 300)));
  document.querySelectorAll(".ch-feat").forEach(el => el.addEventListener("enter", () => el.classList.add("in")));

  /* 背景層次（由遠到近，捲動視差不同）：慢慢漂的細格線、兩條細白走勢線往左捲、一道緩慢下移的掃描線、光裡的浮塵。
     走勢線只是裝飾，沒有數字。30fps、DPR 上限 1.5、分頁隱藏時暫停；reduced-motion 只畫一張靜態。 */
  (function field() {
    const cv = document.getElementById("field"), g = cv.getContext("2d");
    let W, H, dpr, run = true, last = 0, t0 = performance.now(), sheenT = -1e9;
    const lines = [{ k: .3, y: .58, amp: 46, sp: 14, a: .26, step: 9 }, { k: .55, y: .9, amp: 64, sp: 24, a: .17, step: 13 }, { k: .15, y: .22, amp: 34, sp: 8, a: .1, step: 7 }];
    function walk(L) { L.pts = []; let v = 0; for (let i = 0; i < W / L.step + 4; i++) { v += (Math.random() - .5) * .9; v *= .96; L.pts.push(v); } L.off = 0; }
    function size() { dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); lines.forEach(walk); }
    const dust = Array.from({ length: 64 }, () => ({ x: Math.random(), y: Math.random(), r: .4 + Math.random() * 1.3, vx: (Math.random() - .5) * .006, vy: -.004 - Math.random() * .01, ph: Math.random() * 6, k: .6 + Math.random() * .5 }));
    size(); addEventListener("resize", size);
    new MutationObserver(() => { if (B.classList.contains("sheen")) sheenT = performance.now(); }).observe(B, { attributes: true, attributeFilter: ["class"] });
    function draw(now) {
      const t = (now - t0) / 1000, sy = scrollY; g.clearRect(0, 0, W, H);
      // 格線
      const gs = 44, gy = -((sy * .12 + t * 5) % gs), gx = -((t * 3) % gs);
      g.lineWidth = 1; g.strokeStyle = "rgba(214,226,245,.07)"; g.beginPath();
      for (let x = gx; x < W; x += gs) { g.moveTo(x + .5, 0); g.lineTo(x + .5, H); }
      for (let y = gy; y < H; y += gs) { g.moveTo(0, y + .5); g.lineTo(W, y + .5); }
      g.stroke();
      g.fillStyle = "rgba(230,238,250,.12)";
      for (let x = gx; x < W; x += gs) for (let y = gy; y < H; y += gs) g.fillRect(x - .5, y - .5, 2, 2);
      // 走勢線
      for (const L of lines) {
        if (!reduce) { L.off += L.sp / 30; while (L.off >= L.step) { L.off -= L.step; L.pts.shift(); let v = L.pts[L.pts.length - 1] + (Math.random() - .5) * .9; L.pts.push(v * .96); } }
        const base = ((L.y * H - sy * L.k) % (H * 1.2) + H * 1.2) % (H * 1.2) - H * .1;
        g.beginPath(); L.pts.forEach((v, i) => { const x = i * L.step - L.off, y = base - v * L.amp / 3; i ? g.lineTo(x, y) : g.moveTo(x, y); });
        g.strokeStyle = `rgba(240,244,252,${L.a})`; g.lineWidth = 1; g.stroke();
        const lx = (L.pts.length - 3) * L.step - L.off, ly = base - L.pts[L.pts.length - 3] * L.amp / 3;
        g.strokeStyle = `rgba(240,244,252,${L.a * .6})`; g.setLineDash([2, 5]); g.beginPath(); g.moveTo(0, ly); g.lineTo(W, ly); g.stroke(); g.setLineDash([]);
        g.fillStyle = `rgba(255,255,255,${L.a * 4})`; g.beginPath(); g.arc(Math.min(lx, W - 6), ly, 1.8, 0, 7); g.fill();
      }
      // 掃描線
      const scy = ((t * 26) % (H + 200)) - 100, sg = g.createLinearGradient(0, scy - 60, 0, scy);
      sg.addColorStop(0, "rgba(220,232,250,0)"); sg.addColorStop(1, "rgba(220,232,250,.05)"); g.fillStyle = sg; g.fillRect(0, scy - 60, W, 60);
      g.fillStyle = "rgba(235,242,252,.12)"; g.fillRect(0, scy, W, 1);
      // 浮塵：白光掃過時變亮
      const sp = (now - sheenT) / 3000, sx = sp >= 0 && sp <= 1 ? (-.3 + sp * 1.6) * W : -1e4;
      for (const d of dust) {
        if (!reduce) { d.x += d.vx / 30; d.y += d.vy / 30; if (d.y < -.05) { d.y = 1.05; d.x = Math.random(); } if (d.x < -.05) d.x = 1.05; if (d.x > 1.05) d.x = -.05; }
        const x = d.x * W, y = ((d.y * H - sy * d.k * .25) % H + H) % H, boost = Math.exp(-((x - sx) ** 2) / (2 * 70 * 70));
        g.fillStyle = `rgba(240,246,255,${(.12 + .18 * Math.sin(t * 1.3 + d.ph) ** 2 + boost * .7).toFixed(3)})`;
        g.beginPath(); g.arc(x, y, d.r * (1 + boost), 0, 7); g.fill();
      }
    }
    function loop(now) { if (!run) return; requestAnimationFrame(loop); if (now - last < 33) return; last = now; draw(now); }
    if (reduce) { draw(performance.now()); addEventListener("scroll", OX.raf(() => draw(performance.now())), { passive: true }); return; }
    requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", () => { run = !document.hidden; if (run) requestAnimationFrame(loop); });
  })();
  OX.start(() => setTimeout(() => sheen(false), 500));
})();
