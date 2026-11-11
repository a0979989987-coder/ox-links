/* 阿聖聊交易：金融雜誌封面＋交易終端。
   背景 canvas 畫一整片 K 線：打開頁面後從底部一根根長出來，往下捲會繼續長出新的 K 線（捲動敘事），
   手指或游標位置有十字線和支撐／壓力標籤；點一下 K 線重長、低音重擊。不做任何光影。 */
(function () {
  const { P, esc, asset, icon, socials, SND, reveal, finalize, toolbar, reduce, videos, fetchedAt, D } = OX;
  const B = document.body, app = document.getElementById("app");
  const vids = videos("sheng");
  const terms = ["SNR", "支撐", "壓力", "ICT", "ORDER BLOCK", "FVG", "流動性", "結構轉換", "假突破", "PIN BAR", "BTC", "ETH", "盈虧比", "頂分型", "底分型"];

  app.innerHTML = `
  <canvas id="chart" aria-hidden="true"></canvas>
  <div class="sh">
    <div class="sh-top"><span><b>●</b> SNR TERMINAL</span><span>阿聖聊交易</span></div>
    <section class="sh-cover">
      <h1 class="sh-mast rv">Trading Room<small>阿聖聊交易 · ICT / SNR</small></h1>
      <div class="sh-rule rv"></div>
      <div class="sh-id">
        <figure class="sh-photo rv"><img src="${esc(asset(P.cover || P.photo))}" alt="${esc(P.name)}"><span class="cap">COVER</span></figure>
        <div class="sh-idt">
          <h2 class="sh-name rv">阿聖<span>聊交易</span></h2>
          <div class="sh-meta rv">${P.role ? `<span class="sh-role">${esc(P.role)}</span>` : ""}<span class="sh-handle">${esc(P.handle)}</span></div>
          <div class="sh-lines rv">${(P.tags || []).map((t, i) => `<span><small>0${i + 1}</small>${esc(t)}</span>`).join("")}</div>
        </div>
      </div>
      <a data-line="official" class="sh-ticket sh-first rv" href="${esc(D.lineOfficial.url)}">
        <div class="in">
          <div class="row"><span>ORDER TICKET</span><span>FREE · 0 元</span></div>
          <h3>免費教材</h3>
          <p>${esc(D.lineOfficial.desc)}<span class="sh-cursor"></span></p>
          <span class="go"><span>${esc(D.lineOfficial.button)}</span>${icon("arrow")}</span>
        </div>
      </a>
      <a data-line="community" class="sh-room rv" href="${esc(D.lineCommunity.url)}">${icon("chat")}<span><b>${esc(D.lineCommunity.title)}</b><small>LINE 社群 · JOIN THE ROOM</small></span><em>加入</em></a>
    </section>

    <div class="sh-tick" aria-hidden="true"><div>${[...terms, ...terms].map(t => `<span>${t}</span>`).join("")}</div></div>

    <section class="sh-sec" data-zone="0">
      <div class="sh-h rv"><b>Follow</b><small>追蹤阿聖</small><i>YOUTUBE · IG · THREADS</i></div>
      <div class="sh-soc rv">${socials(P).map(s => `<a href="${esc(s.url)}" aria-label="${s.label}">${icon(s.k)}${s.k === "threads" ? "THREADS" : s.k === "yt" ? "YOUTUBE" : "INSTAGRAM"}</a>`).join("")}</div>
    </section>

    ${P.about && P.about.length ? `<section class="sh-sec" data-zone="1">
      <div class="sh-h rv"><b>Profile</b><small>關於阿聖</small><i>FROM YOUTUBE</i></div>
      <div class="sh-about rv">${P.about.map(t => `<p>${esc(t)}</p>`).join("")}<span class="sh-src">來源：${esc(P.aboutSource || "")}</span></div>
    </section>` : ""}

    ${vids.length ? `<section class="sh-sec sh-issue" data-zone="2">
      <div class="sh-h rv"><b>In this issue</b><small>最新影片</small><i>YOUTUBE</i></div>
      ${vids.map((v, i) => `<a class="rv" data-d="${i * .05}" href="${esc(v.url)}"><span class="no">${String(i + 1).padStart(2, "0")}</span>
        ${v.thumb ? `<img src="${esc(asset(v.thumb))}" alt="" loading="lazy">` : "<span></span>"}<span><b>${esc(v.display || v.title)}</b><small>${esc(v.date)}</small></span></a>`).join("")}
      <span class="sh-src">資料來源：YouTube 頻道公開 RSS，擷取時間 ${esc(fetchedAt || "")}</span>
    </section>` : ""}

    <section class="sh-sec" data-zone="3">
      <div class="sh-h rv"><b>Tools</b><small>OX 工具</small><i>3 PROGRAMS</i></div>
      <div class="sh-term rv"><div class="bar"><i></i><i></i><i></i><span>~/ox</span></div>
        ${D.tools.map(t => `<a href="${esc(t.url)}">${icon(t.icon)}<b>${esc(t.label)}</b><small>${esc(t.url.replace(/^https?:\/\//, ""))}</small></a>`).join("")}
      </div>
    </section>
    <div class="sh-dock" aria-hidden="false"><a href="${esc(D.lineOfficial.url)}"><span>${esc(D.lineOfficial.button)}</span><small>FREE ▸</small></a></div>
    <footer class="sh-foot">© 2026 阿聖聊交易 · OX.Trading<br>純粹分享，不構成買賣建議。</footer>
  </div>`;
  toolbar(); finalize(); reveal();
  OX.dock(".sh-dock");

  /* ---------- 背景 K 線 ---------- */
  const cv = document.getElementById("chart"), g = cv.getContext("2d");
  let W, H, dpr, N, cw, candles = [], grow = 0, growT0 = 0, regrowT0 = -1, ptr = null, progress = 0, zone = 0, dirty = true;
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function build() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    cw = W < 500 ? 9 : 12; N = Math.ceil(W / cw) + 1; seed = 11; candles = [];
    let p = .25;
    for (let i = 0; i < N * 3; i++) {   // 三倍長：往下捲時會往左推出新的 K 線
      const o = p, d = (rnd() - .43) * .07; p = Math.min(.92, Math.max(.08, p + d));
      const hi = Math.max(o, p) + rnd() * .035, lo = Math.min(o, p) - rnd() * .035;
      candles.push({ o, c: p, hi, lo });
    }
    dirty = true;
  }
  const ZONES = [{ y: .78, l: "R2 壓力" }, { y: .62, l: "R1 壓力" }, { y: .38, l: "S1 支撐" }, { y: .2, l: "S2 支撐" }];
  function draw(t) {
    g.clearRect(0, 0, W, H);
    // 細格線
    g.strokeStyle = "rgba(255,45,32,.07)"; g.lineWidth = 1; g.beginPath();
    for (let x = 0; x < W; x += 32) { g.moveTo(x + .5, 0); g.lineTo(x + .5, H); }
    for (let y = 0; y < H; y += 32) { g.moveTo(0, y + .5); g.lineTo(W, y + .5); }
    g.stroke();
    const top = H * .1, span = H * .86, Y = v => top + span * (1 - v);
    // 支撐壓力帶：目前段落的那一條亮起來
    ZONES.forEach((z, i) => {
      const on = i === zone; g.fillStyle = on ? "rgba(255,45,32,.16)" : "rgba(255,45,32,.04)"; g.fillRect(0, Y(z.y) - 9, W, 18);
      g.setLineDash([6, 6]); g.strokeStyle = on ? "rgba(255,190,170,.7)" : "rgba(255,190,170,.22)"; g.beginPath(); g.moveTo(0, Y(z.y) + .5); g.lineTo(W, Y(z.y) + .5); g.stroke(); g.setLineDash([]);
      g.font = "500 10px 'JetBrains Mono', monospace"; g.fillStyle = on ? "#ffd6cf" : "rgba(255,190,170,.4)"; g.fillText(z.l, W - 64, Y(z.y) - 12);
    });
    // K 線：往下捲時視窗往右移（出現新的 K 線）
    const off = Math.floor(progress * N * 2), now = t;
    const gAll = reduce ? 1 : Math.min(1, (now - growT0) / 1600);
    for (let k = 0; k < N; k++) {
      const c = candles[k + off]; if (!c) break;
      let s = reduce ? 1 : Math.min(1, Math.max(0, gAll * N * 1.25 - k) / 3);   // 一根根從左往右長
      if (regrowT0 > 0) s = Math.min(s, Math.max(0, Math.min(1, ((now - regrowT0) / 700) * N * 1.4 - k) / 2.5));
      if (s <= 0) continue;
      const up = c.c >= c.o, col = up ? "#ff2d20" : "#f4ede4", x = k * cw + 1;
      const base = H, yH = Y(c.hi), yL = Y(c.lo), yO = Y(c.o), yC = Y(c.c);
      const ease = 1 - Math.pow(1 - s, 3), lift = (1 - ease) * (base - yL);   // 從底部長上來
      g.globalAlpha = .28 + .5 * ease;
      g.fillStyle = col; g.fillRect(x + cw / 2 - 1.5, yH + lift, 1, (yL - yH) * ease);
      const by = Math.min(yO, yC), bh = Math.max(2, Math.abs(yO - yC));
      if (up) g.fillRect(x, by + lift, cw - 3, bh * ease); else { g.strokeStyle = col; g.strokeRect(x + .5, by + lift + .5, cw - 4, bh * ease); }
    }
    g.globalAlpha = 1;
    // 十字線
    if (ptr) {
      g.strokeStyle = "rgba(244,237,228,.35)"; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(ptr.x + .5, 0); g.lineTo(ptr.x + .5, H); g.moveTo(0, ptr.y + .5); g.lineTo(W, ptr.y + .5); g.stroke(); g.setLineDash([]);
      const v = 1 - (ptr.y - top) / span, near = ZONES.reduce((a, z) => Math.abs(z.y - v) < Math.abs(a.y - v) ? z : a), lab = v > .5 ? "壓力區" : "支撐區";
      const txt = Math.abs(near.y - v) < .05 ? near.l : lab;
      g.font = "700 11px 'JetBrains Mono', monospace"; const w = g.measureText(txt).width + 14;
      g.fillStyle = "#ff2d20"; g.fillRect(Math.min(ptr.x + 8, W - w - 4), ptr.y - 22, w, 18); g.fillStyle = "#070202"; g.fillText(txt, Math.min(ptr.x + 15, W - w + 3), ptr.y - 9);
    }
  }
  let anim = false;
  function loop(t) {
    draw(t);
    const busy = !reduce && ((t - growT0) < 1800 || (regrowT0 > 0 && t - regrowT0 < 1400));
    if (busy) requestAnimationFrame(loop); else { anim = false; if (regrowT0 > 0 && t - regrowT0 >= 1400) regrowT0 = -1; }
  }
  function kick() { if (!anim) { anim = true; requestAnimationFrame(loop); } }
  const redraw = OX.raf(() => { if (!anim) draw(performance.now()); });
  build(); growT0 = performance.now() + 99999; draw(0);
  addEventListener("resize", () => { build(); redraw(); });

  const secs = [...document.querySelectorAll("[data-zone]")];
  addEventListener("scroll", () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight); progress = Math.min(1, scrollY / max);
    let z = 0; secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .6) z = +s.dataset.zone; }); zone = z;
    redraw();
  }, { passive: true });

  /* 游標／手指：十字線（不做任何光影） */
  function point(e) { ptr = { x: e.clientX, y: e.clientY }; redraw(); }
  addEventListener("pointermove", point, { passive: true });
  addEventListener("pointerdown", e => {
    point(e);
    if (reduce) return;
    regrowT0 = performance.now(); kick();
    SND.tone(70, .45, "sine", .5, 38); SND.noise(.12, .18, 900);
  }, { passive: true });

  OX.start(() => {
    growT0 = performance.now(); kick();
  });
})();
