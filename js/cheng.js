/* 老承：冷調黑灰極簡精品，產業研究報告排版。
   互動：手指或游標移動時金屬名牌的反光角度跟著轉；碰一下畫面，一道白光用 3 秒慢慢掃過整頁（並有一聲清脆的鈴）。
   捲動：每一章的細線從左畫到右，章節進場時白光自動掃過一次。 */
(function () {
  const { P, esc, asset, icon, socials, SND, reveal, intro, finalize, toolbar, reduce, videos, fetchedAt, D } = OX;
  const B = document.body, app = document.getElementById("app"), vids = videos("cheng");
  const [feat, ...rest] = vids;
  let n = 0; const no = () => String(++n).padStart(2, "0");
  app.innerHTML = `
  <div class="ch-tex" aria-hidden="true"></div><div class="ch-sheen" aria-hidden="true"></div>
  <div class="ch">
    <header class="ch-head rv"><span>Research Note</span><span>老承</span></header>
    <div class="ch-hair rv"></div>
    <section class="ch-plate rv" data-d=".1">
      <div class="ch-bezel"><img src="${esc(asset(P.cover || P.photo))}" alt="${esc(P.name)}"></div>
      <h1 class="ch-name">${esc(P.name)}</h1>
      <p class="ch-handle">${esc(P.handle)}</p>
      ${P.motto ? `<p class="ch-motto">「${esc(P.motto)}」</p>` : ""}
      ${P.role ? `<span class="ch-role">${esc(P.role)}</span>` : ""}
      <nav class="ch-soc">${socials(P).map(s => `<a href="${esc(s.url)}" aria-label="${s.label}">${icon(s.k)}</a>`).join("")}</nav>
    </section>

    <section class="ch-sec">
      <div class="ch-no rv"><b>${no()}</b><span>Invitation</span><em>加入</em></div>
      <div class="ch-hair rv"></div>
      <a class="ch-invite rv" href="${esc(D.lineOfficial.url)}"><div class="in">
        ${icon("line", "lg")}<small style="display:block;margin-top:12px">LINE OFFICIAL</small>
        <h3>免費教材</h3><p>${esc(D.lineOfficial.desc)}</p>
        <span class="go">${esc(D.lineOfficial.button)}${icon("arrow")}</span></div></a>
      <a class="ch-row rv" href="${esc(D.lineCommunity.url)}">${icon("chat", "ico")}<span><b>${esc(D.lineCommunity.title)}</b><small>LINE COMMUNITY</small></span>${icon("arrow")}</a>
    </section>

    ${P.about && P.about.length ? `<section class="ch-sec">
      <div class="ch-no rv"><b>${no()}</b><span>Profile</span><em>簡介</em></div>
      <div class="ch-hair rv"></div>
      ${P.about.map(t => `<p class="ch-p rv">${esc(t)}</p>`).join("")}
      <span class="ch-src rv">Source: ${esc(P.aboutSource || "")}</span>
    </section>` : ""}

    ${feat ? `<section class="ch-sec">
      <div class="ch-no rv"><b>${no()}</b><span>Latest</span><em>最新影片</em></div>
      <div class="ch-hair rv"></div>
      <a class="ch-feat rv" href="${esc(feat.url)}"><div class="img"><img src="${esc(asset(feat.thumb))}" alt="" loading="lazy"></div><small>${esc(feat.date)}</small><b>${esc(feat.display || feat.title)}</b></a>
      <div class="ch-tbl">${rest.map(v => `<a class="rv" href="${esc(v.url)}"><span class="d">${esc(v.date.replace(/-/g, "."))}</span><b>${esc(v.display || v.title)}</b>${v.thumb ? `<img src="${esc(asset(v.thumb))}" alt="" loading="lazy">` : "<span></span>"}</a>`).join("")}</div>
      <span class="ch-src rv">Source: YouTube 頻道公開 RSS · ${esc(fetchedAt || "")}</span>
    </section>` : ""}

    <section class="ch-sec">
      <div class="ch-no rv"><b>${no()}</b><span>Instruments</span><em>OX 工具</em></div>
      <div class="ch-hair rv"></div>
      ${D.tools.map((t, i) => `<a class="ch-row rv" href="${esc(t.url)}"><span class="k">${"ABC"[i]}</span><span><b>${esc(t.label)}</b><small>${esc(t.url.replace(/^https?:\/\//, ""))}</small></span>${icon("arrow")}</a>`).join("")}
    </section>
    <footer class="ch-foot rv"><b>${esc(P.motto || P.name)}</b>© 2026 ${esc(P.name)} · OX.Trading<br>影片內容為個人觀點分享，不構成投資建議。</footer>
  </div>
  <div class="ch-dock"><a href="${esc(D.lineOfficial.url)}"><i></i>${esc(D.lineOfficial.button)}${icon("arrow")}</a></div>`;
  toolbar(); finalize(); reveal(); OX.dock(".ch-dock", ".ch-invite");

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
    plate.style.setProperty("--ang", (95 + x * 50 + y * 10) + "deg"); bez.style.setProperty("--bz", (x * 120 - 60) + "deg");
  });
  addEventListener("pointermove", tilt, { passive: true });
  addEventListener("pointerdown", e => { if (B.classList.contains("intro-on")) return; tilt(e); sheen(true); }, { passive: true });
  // 每一章進場時白光掃過一次
  document.querySelectorAll(".ch-no").forEach(el => el.addEventListener("enter", () => setTimeout(() => sheen(false), 300)));
  document.querySelectorAll(".ch-feat").forEach(el => el.addEventListener("enter", () => el.classList.add("in")));
  intro("老承", () => setTimeout(() => sheen(false), 500));
})();
