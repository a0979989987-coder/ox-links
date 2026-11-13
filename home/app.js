/* OX 會員首頁的版面與互動：黑卡、LINE 兩格、側邊選單、五張老師卡、作品、交易法、聲音。
   粒子和背景在 fx.js（window.OXFX），K 線轉場和小動畫在 kline.js，註冊流程在 join.js，內容在 data.js（window.OXH）。 */
(function () {
  "use strict";
  const D = window.OXH, B = document.body, ROOT = B.dataset.root || "";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const asset = p => !p ? "" : /^https?:/.test(p) ? p : ROOT + p;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fx = () => window.OXFX || {};
  const teacher = id => D.teachers.find(t => t.id === id);
  document.documentElement.classList.add("js");

  // ---------- 圖示 ----------
  const I = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    out: '<path d="M8 16l8-8M9 8h7v7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19c.5-3 2.8-4.8 6-4.8s5.5 1.8 6 4.8"/><path d="M15.5 5.6a3 3 0 0 1 0 5.8M17.5 14.6c2 .6 3.2 2.1 3.5 4.4"/>',
    works: '<rect x="3.5" y="4.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="4.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
    candle: '<path d="M7 3.5v3M7 15.5v3M16.5 6v4M16.5 17.5v3"/><rect x="5" y="6.5" width="4" height="9" rx="1"/><rect x="14.5" y="10" width="4" height="7.5" rx="1"/>',
    coin: '<circle cx="12" cy="12" r="8.6"/><path d="M9.6 7.8h3.3a2 2 0 0 1 0 4H9.6Zm0 4h3.9a2.1 2.1 0 0 1 0 4.2H9.6ZM9.6 7.8v8.4M11.2 6.3v1.5M11.2 16.2v1.5"/>',
    merge: '<circle cx="9" cy="14" r="5.6"/><circle cx="16.4" cy="8" r="3.6"/>',
    guide: '<path d="M5 4.5h10.5a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3Z"/><path d="M5 17a3 3 0 0 1 3-3h10.5M9 8.5h6"/>',
    faq: '<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.9M12 16.8v.2"/>',
    chat: '<path d="M4 5.5h11a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H9l-4 3.5V15H4a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z"/><path d="M19 9h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v2.5L16 18h-4"/>',
    spin: '<path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5"/>'
  };
  const icon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[k] || ""}</svg>`;
  // LINE：白色對話框，字用綠色鏤空
  const lineIcon = (ink = "#06c755") => `<svg viewBox="0 0 24 24" aria-hidden="true" class="ln"><path fill="#fff" stroke="none" d="M12 3.6c-5 0-9.1 3.3-9.1 7.4 0 3.6 3.2 6.7 7.6 7.3.3.1.7.2.8.5.1.2.1.6 0 .9l-.1.8c0 .2-.2.9.8.5s5.4-3.2 7.4-5.4c1.4-1.5 2-3 2-4.6 0-4.1-4.1-7.4-9.4-7.4Z"/><g fill="none" stroke="${ink}" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><path d="M6.6 9.2v3.5h2"/><path d="M10.1 9.2v3.5"/><path d="M11.7 12.7V9.2l2.6 3.5V9.2"/><path d="M17.6 9.2h-1.9v3.5h1.9M15.7 10.95h1.8"/></g></svg>`;
  const chatIcon = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${I.chat}</svg>`;
  // logo 直接用永盛給的那張圖（白底），不重畫
  const logoHTML = () => `<img src="${esc(asset(D.logo.img))}" alt="" width="64" height="64">`;
  $$("[data-logo]").forEach(el => { el.innerHTML = logoHTML(); });

  // ---------- 提示 ----------
  B.insertAdjacentHTML("beforeend", `<div class="oh-toast" role="status" aria-live="polite"></div>`);
  let tt = 0;
  function say(m, ms = 2200) { const t = $(".oh-toast"); t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), ms); }

  // ---------- 聲音（WebAudio 合成；手指點過才會響） ----------
  let actx = null, soundOn = localStorage.getItem("ox-sound") !== "off";
  function ac() {
    if (!soundOn) return null;
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  const SND = {
    tick(f = 880, v = .05) {
      const a = ac(); if (!a) return; const t = a.currentTime + .005, o = a.createOscillator(), g = a.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .6, t + .09);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + .12);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .15);
    },
    whoosh(d = .45, v = .09, up = true) {
      const a = ac(); if (!a) return; const t = a.currentTime + .005, n = Math.floor(a.sampleRate * d), b = a.createBuffer(1, n, a.sampleRate), x = b.getChannelData(0);
      for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
      const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; fl.type = "bandpass"; fl.Q.value = 1.2;
      fl.frequency.setValueAtTime(up ? 300 : 2400, t); fl.frequency.exponentialRampToValueAtTime(up ? 2600 : 320, t + d); g.gain.value = v;
      s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(t);
    },
    // 先收再砸：低音銅管往上推，最後一下重擊。hit＝幾秒後砸下去
    swell(hit = .52, v = 1) {
      const a = ac(); if (!a) return; const t = a.currentTime + .01;
      const out = a.createGain(), lp = a.createBiquadFilter(); lp.type = "lowpass";
      lp.frequency.setValueAtTime(170, t); lp.frequency.exponentialRampToValueAtTime(1500, t + hit); lp.frequency.exponentialRampToValueAtTime(220, t + hit + .9);
      out.gain.setValueAtTime(.0001, t); out.gain.exponentialRampToValueAtTime(.16 * v, t + hit); out.gain.exponentialRampToValueAtTime(.0001, t + hit + 1);
      lp.connect(out); out.connect(a.destination);
      [55, 55.5, 82.4, 110.3].forEach(f => { const o = a.createOscillator(), g = a.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(f * .965, t); o.frequency.exponentialRampToValueAtTime(f, t + hit); g.gain.value = .25; o.connect(g); g.connect(lp); o.start(t); o.stop(t + hit + 1.1); });
      const s = a.createOscillator(), sg = a.createGain(); s.type = "sine"; s.frequency.setValueAtTime(92, t + hit); s.frequency.exponentialRampToValueAtTime(36, t + hit + .4);
      sg.gain.setValueAtTime(.0001, t + hit - .01); sg.gain.exponentialRampToValueAtTime(.42 * v, t + hit + .02); sg.gain.exponentialRampToValueAtTime(.0001, t + hit + .7);
      s.connect(sg); sg.connect(a.destination); s.start(t + hit - .01); s.stop(t + hit + .8);
    },
    // 玻璃碎掉：一下重擊，加上高頻的碎片聲往下掉
    shatter() {
      const a = ac(); if (!a) return; const t = a.currentTime + .005;
      SND.swell(.03, 1.1);
      const d = 1.1, n = Math.floor(a.sampleRate * d), b = a.createBuffer(1, n, a.sampleRate), x = b.getChannelData(0);
      for (let i = 0; i < n; i++) { const k = i / n; x[i] = (Math.random() * 2 - 1) * Math.pow(1 - k, 2.2) * (Math.random() < .035 + .1 * (1 - k) ? 1 : .22); }
      const s = a.createBufferSource(), hp = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; hp.type = "highpass"; hp.frequency.value = 3200; g.gain.value = .2;
      s.connect(hp); hp.connect(g); g.connect(a.destination); s.start(t);
    },
    // 送出成功：三個往上的音
    chime() { [660, 880, 1320].forEach((f, i) => setTimeout(() => SND.tick(f, .06), i * 90)); }
  };
  const sndBtn = $(".oh-snd");
  const syncSnd = () => sndBtn && sndBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
  syncSnd();
  sndBtn && sndBtn.addEventListener("click", () => { soundOn = !soundOn; localStorage.setItem("ox-sound", soundOn ? "on" : "off"); syncSnd(); say(soundOn ? "聲音開" : "聲音關"); if (soundOn) SND.tick(); });

  // ---------- 黑卡 ----------
  // 卡面（11/13 定稿）：方塊卡面、logo 外形銀線、拉絲鈦嵌的大 logo、金斜邊。
  // no＝會員編號（沒有就是點點）、name＝印在卡上的名字（沒有就寫「你的名字」）、since＝加入那年
  function cardFace(o = {}) {
    const dots = `<span class="oc-dots" aria-hidden="true">${"<b><i></i><i></i><i></i><i></i></b>".repeat(3)}</span>`;
    return `<span class="oc-body"></span><span class="oc-lines"></span><span class="oc-light"></span>
      <span class="oc-logo" aria-hidden="true"><i></i><img src="${esc(asset("home/img/card/eng.png"))}" alt=""></span><span class="oc-sheen"></span>
      <span class="oc-bevel"></span><span class="oc-silver"></span>
      <span class="oc-brand">OX TRADING</span><span class="oc-since"><small>SINCE</small><span class="oc-emb">${esc(o.since || new Date().getFullYear())}</span></span>
      ${o.no ? `<span class="oc-no oc-emb">${esc(o.no)}</span>` : dots}
      <span class="oc-name oc-emb${o.name && /^[A-Z .'-]+$/.test(o.name) ? "" : " zh"}">${esc(o.name || "你的名字")}</span>`;
  }
  $$("[data-face]").forEach(el => { el.innerHTML = cardFace(); });
  // 卡片跟著手指傾斜；沒人碰的時候自己慢慢晃，流光跟著角度走
  const cards = new Map();
  function watchCard(el) {
    if (!el || reduce || cards.has(el)) return;
    const st = { x: 0, y: 0, px: 0, py: 0, hold: -1e9, seen: false, ph: Math.random() * 6 };
    cards.set(el, st);
    const host = el.closest(".oh-join") || el;
    const move = e => { const r = el.getBoundingClientRect(); st.px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - .5) * 2)); st.py = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - .5) * 2)); st.hold = performance.now(); };
    host.addEventListener("pointermove", move, { passive: true }); host.addEventListener("pointerdown", move, { passive: true });
    if ("IntersectionObserver" in window) new IntersectionObserver(es => { st.seen = es[0].isIntersecting; }).observe(el); else st.seen = true;
  }
  if (!reduce) (function tilt(now) {
    requestAnimationFrame(tilt);
    cards.forEach((st, el) => {
      if (!st.seen || !el.isConnected) return;
      const t = now / 1000, free = now - st.hold > 900;
      const gx = free ? Math.sin(t * .62 + st.ph) * .34 : st.px, gy = free ? Math.sin(t * .47 + st.ph + 1.3) * .24 : st.py;
      st.x += (gx - st.x) * (free ? .04 : .16); st.y += (gy - st.y) * (free ? .04 : .16);
      el.style.setProperty("--tx", st.x.toFixed(3)); el.style.setProperty("--ty", st.y.toFixed(3));
    });
  })(0);
  $$("[data-card]").forEach(watchCard);

  // ---------- 第一頁：卡片下面的字、LINE 兩格 ----------
  const perks = $("[data-perks]"); if (perks) perks.innerHTML = D.member.perks.map(p => `<span>${icon("check")}${esc(p)}</span>`).join("");
  const rule = $("[data-rule]"); if (rule) rule.textContent = D.member.rule;
  const ruleNote = $("[data-rule-note]"); if (ruleNote) ruleNote.textContent = D.member.ruleNote;
  const linesHTML = () => [["official", lineIcon()], ["community", chatIcon]].map(([k, ic]) => {
    const l = D.line[k];
    return `<a class="oh-line" href="${esc(l.url)}" target="_blank" rel="noopener"><i>${ic}</i><span><b>${esc(l.title)}</b><small>${esc(l.desc)}</small></span></a>`;
  }).join("");
  const lines = $("[data-lines]"); if (lines) lines.innerHTML = linesHTML();

  // ---------- 第二頁：五張老師卡（大小一樣，各自的風格） ----------
  const goArrow = `<span class="go">${icon("arrow")}</span>`;
  const KL = [[8, 38, 50, 58, 0], [17, 30, 44, 50, 1], [26, 34, 40, 52, 0], [35, 22, 36, 42, 1], [44, 26, 30, 44, 0], [53, 12, 28, 32, 1], [62, 16, 20, 34, 0], [71, 4, 18, 22, 1]];   // x、上影、實體上緣、實體下緣…示意用
  const klSVG = `<svg class="kl" viewBox="0 0 80 84" aria-hidden="true">${KL.map(([x, hi, a, lo, up], k) => { const c = up ? "#f3ead7" : "#ff3b2e"; return `<g style="--k:${k}"><line x1="${x}" x2="${x}" y1="${hi}" y2="${lo + 8}" stroke="${c}" stroke-width="1"/><rect x="${x - 3}" y="${a}" width="6" height="${lo - a}" fill="${c}"/></g>`; }).join("")}</svg>`;
  const CARD = {
    snsheng: t => `<span class="ava"><img src="${esc(asset(t.avatar))}" alt="" width="66" height="66"></span><span class="txt"><span class="nm"><b>${esc(t.zh)}</b><em>${esc(t.en)}</em></span><span class="sb">${esc(t.sub)}</span></span>${goArrow}`,
    sheng: t => `<span class="ph"><img src="${esc(asset(t.cover || t.avatar))}" alt="" loading="lazy"></span><span class="txt"><span class="tm">SNR TERMINAL</span><span class="nm"><b>${esc(t.zh)}</b><span>${esc(t.tail)}</span></span><span class="tg">${esc(t.sub)}</span></span>${klSVG}${goArrow}`,
    chameleon: t => `<img class="cm" src="${esc(asset(t.cutout || t.avatar))}" alt="" loading="lazy"><span class="txt"><span class="nm">${esc(t.name)}</span><span class="pl">${esc(t.sub)}</span><span class="hd">${esc(t.handle || "")}</span></span>${goArrow}`,
    lucas: t => `<img class="ph" src="${esc(asset(t.cover || t.avatar))}" alt="" loading="lazy"><span class="txt"><span class="sc">${esc(t.sub)}</span><span class="nm"><i>L</i>UCAS</span></span>${goArrow}`,
    cheng: t => `<span class="ph"><img src="${esc(asset(t.cover || t.avatar))}" alt="" loading="lazy"></span><span class="txt"><span class="lb">TAIWAN EQUITY RESEARCH</span><span class="nm">${esc(t.name)}</span><span class="tg">${esc(t.sub)}</span></span>${goArrow}`
  };
  const tlist = $("[data-teachers]");
  if (tlist) tlist.innerHTML = D.teachers.map((t, i) => `<a class="oh-tc tc-${esc(t.id)}" href="${esc(t.page)}" target="_blank" rel="noopener" style="--i:${i}" aria-label="${esc(t.name)}，打開他的頁面">${(CARD[t.id] || CARD.snsheng)(t)}</a>`).join("");

  // ---------- 第三頁：作品 ----------
  const works = $("[data-works]"), V = (window.OX_VIDEOS || { channels: {} }).channels;
  if (works) {
    const W = D.works;
    const tools = W.tools.map(t => `<a class="oh-tool" href="${esc(t.url)}" target="_blank" rel="noopener"><span class="ph"><img src="${esc(asset(t.shot))}" alt="${esc(t.name)}的畫面" loading="lazy"></span><b>${esc(t.name)}</b><small>${esc(t.desc)}</small><span class="oh-open">打開${icon("out")}</span></a>`).join("");
    const films = W.films.map(f => `<a class="oh-film" href="${esc(W.filmsUrl)}" target="_blank" rel="noopener"><video muted loop playsinline preload="none" poster="${esc(asset("home/media/" + f.id + ".jpg"))}" data-src="${esc(asset("home/media/" + f.id + ".mp4"))}"></video><span>${esc(f.title)}</span></a>`).join("");
    const shorts = W.shorts.map(s => { const ch = V[s.teacher], t = teacher(s.teacher); return !ch || !t ? "" : ch.videos.slice(0, s.take).map(v => `<a class="oh-yt" href="${esc(v.url)}" target="_blank" rel="noopener"><span class="ph"><img src="${esc(asset(v.thumb))}" alt="" loading="lazy"></span><b>${esc(v.display || v.title)}</b><small>${esc(t.name)}</small></a>`).join(""); }).join("");
    works.innerHTML = `<h2 class="oh-h2 oh-rv" id="oh-w-title">我們的作品</h2>
      <h3 class="oh-h3 oh-rv">工具<small>往左滑</small></h3><div class="oh-row">${tools}</div>
      <h3 class="oh-h3 oh-rv">K 線故事片</h3><div class="oh-row">${films}</div>
      ${shorts ? `<h3 class="oh-h3 oh-rv">教學短片</h3><div class="oh-row">${shorts}</div>` : ""}`;
    // 影片滑進畫面才載入、才播，滑走就停
    const vids = $$(".oh-film video", works);
    if ("IntersectionObserver" in window && !reduce) {
      const vio = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause(); }), { threshold: .5 });
      vids.forEach(v => vio.observe(v));
    }
  }

  // ---------- 第三頁：交易法介紹（K 線小動畫由 kline.js 接上 canvas[data-anim]） ----------
  const methods = $("[data-methods]");
  if (methods) methods.innerHTML = `<h2 class="oh-h2 oh-rv" id="oh-m-title">交易法介紹</h2><div class="oh-mlist">${D.methods.map(m => {
    const by = m.by.map(teacher).filter(Boolean);
    return `<article class="oh-m oh-rv" id="m-${esc(m.id)}"><canvas data-anim="${esc(m.anim)}" aria-hidden="true"></canvas><div class="bd"><h3>${esc(m.name)}</h3>
      <div class="oh-by">${by.map(t => `<a href="${esc(t.page)}" target="_blank" rel="noopener"><img src="${esc(asset(t.avatar))}" alt="" loading="lazy">${esc(t.name)}</a>`).join("")}</div>
      ${m.quotes.map(q => `<blockquote>${esc(q.t)}${q.who && by.length > 1 ? `<cite>${esc(teacher(q.who).name)}</cite>` : ""}</blockquote>`).join("")}</div></article>`;
  }).join("")}</div>`;

  // ---------- 最後：再放一次黑卡和 LINE 兩格，滑到底不會空 ----------
  const end = $("[data-end]"), heroJoin = $(".oh-hero .oh-join");
  if (end && heroJoin) {
    const j = heroJoin.cloneNode(true);
    end.appendChild(j);
    end.insertAdjacentHTML("beforeend", `<div class="oh-lines">${linesHTML()}</div><footer class="oh-foot"><nav><button type="button" data-open="guide">註冊教學</button><button type="button" data-open="faq">常見問題</button></nav><p>${esc(D.risk)}</p></footer>`);
    watchCard($("[data-card]", j));
  }

  // 進場：滑到才浮出來
  const tcs = $$(".oh-tc"), rvs = $$(".oh-rv");
  if (reduce || !("IntersectionObserver" in window)) tcs.concat(rvs).forEach(el => el.classList.add("in"));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -9% 0px", threshold: .15 });
    tcs.concat(rvs).forEach(el => io.observe(el));
  }
  tcs.forEach(el => el.addEventListener("click", () => SND.tick(740)));

  // ---------- 上方列：第一頁只有選單和聲音；黑卡滑出畫面，品牌才出現（同一個畫面只有一個 logo） ----------
  const top = $(".oh-top"), heroCard = $(".oh-hero .oh-card"), endCard = $(".oh-end .oh-card");
  let sq = 0;
  const onScroll = () => {
    sq = 0; if (!top) return;
    const past = heroCard ? heroCard.getBoundingClientRect().bottom < 54 : scrollY > 24;
    const again = endCard ? endCard.getBoundingClientRect().top < innerHeight - 40 : false;      // 最後那張黑卡進畫面，品牌的 logo 再收起來
    top.classList.toggle("solid", past);
    top.classList.toggle("nologo", again);
  };
  addEventListener("scroll", () => { if (!sq) sq = requestAnimationFrame(onScroll); }, { passive: true }); onScroll();
  const brand = $(".oh-brand");
  brand && brand.addEventListener("click", e => { e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  // 換世界：白金那一頁上方列和網址列的顏色跟著換
  const theme = $('meta[name="theme-color"]');
  function setWorld(light, instant) {
    if (B.classList.contains("w-light") === !!light) return;
    B.classList.toggle("w-light", !!light);
    theme && theme.setAttribute("content", light ? "#fbf8f1" : "#04060d");
    fx().setWorld && fx().setWorld(!!light, instant);
  }

  // ---------- 側邊選單 ----------
  const menuBtn = $(".oh-menu"), TI = ["candle", "coin", "merge"];
  const items = [
    { sec: "頁面" },
    { k: "people", t: "小老師們", go: "#teachers" },
    { k: "works", t: "作品", go: "#works" },
    { k: "candle", t: "交易法介紹", go: "#methods" },
    { sec: "OX 工具" },
    ...D.works.tools.map((x, i) => ({ k: TI[i] || "works", t: x.name, url: x.url })),
    { sec: "LINE" },
    { ln: 1, t: D.line.official.title, u: D.line.official.desc, url: D.line.official.url },
    { k: "chat", t: D.line.community.title, u: D.line.community.desc, url: D.line.community.url },
    { sec: "說明" },
    { k: "guide", t: "註冊教學", open: "guide" },
    { k: "faq", t: "常見問題", open: "faq" }
  ];
  let n = 2;
  B.insertAdjacentHTML("beforeend", `<div class="oh-scrim"></div>
  <aside class="oh-drawer" id="oh-drawer" aria-label="選單" aria-hidden="true">
    <div class="oh-dme" style="--i:0"><span class="oh-logo">${logoHTML()}</span><span><b>${esc(D.brand)}</b><small>會員註冊</small></span></div>
    <button type="button" class="oh-dcta" style="--i:1" data-open="join">註冊成為 OX 會員${icon("arrow")}</button>
    ${items.map(it => it.sec ? `<div class="oh-dsec" style="--i:${n++}">${esc(it.sec)}</div>`
      : it.url ? `<a class="oh-di" style="--i:${n++}" href="${esc(it.url)}" target="_blank" rel="noopener">${it.ln ? lineIcon("#121417") : icon(it.k)}<span>${esc(it.t)}</span>${it.u ? `<u>${esc(it.u)}</u>` : ""}</a>`
        : `<button type="button" class="oh-di" style="--i:${n++}" ${it.go ? `data-go="${esc(it.go)}"` : `data-open="${esc(it.open)}"`}>${icon(it.k)}<span>${esc(it.t)}</span></button>`).join("")}
    <p class="oh-dfoot" style="--i:${n++}">${esc(D.risk)}</p>
  </aside>`);
  const drawer = $("#oh-drawer");
  function openDrawer() {
    if (B.classList.contains("dr-open")) return;
    B.classList.remove("dr-closing"); B.classList.add("dr-open"); drawer.setAttribute("aria-hidden", "false"); menuBtn && menuBtn.setAttribute("aria-expanded", "true");
    SND.whoosh(.32, .06, true);
  }
  function closeDrawer() {
    if (!B.classList.contains("dr-open")) return;
    if (drawer.contains(document.activeElement)) document.activeElement.blur();
    B.classList.add("dr-closing"); B.classList.remove("dr-open"); drawer.setAttribute("aria-hidden", "true"); menuBtn && menuBtn.setAttribute("aria-expanded", "false");
    setTimeout(() => B.classList.remove("dr-closing"), 380);
    SND.whoosh(.26, .04, false);
  }
  menuBtn && menuBtn.addEventListener("click", openDrawer);
  $(".oh-scrim").addEventListener("click", closeDrawer);
  drawer.addEventListener("click", e => {
    const el = e.target.closest("[data-go],a"); if (!el) return;
    SND.tick(740); closeDrawer();
    if (el.dataset.go) setTimeout(() => { const to = $(el.dataset.go); to && to.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 200);
  });
  let sx0 = null;
  drawer.addEventListener("touchstart", e => { sx0 = e.touches[0].clientX; }, { passive: true });
  drawer.addEventListener("touchmove", e => { if (sx0 != null && e.touches[0].clientX - sx0 < -56) { sx0 = null; closeDrawer(); } }, { passive: true });
  // 任何地方的「註冊成為 OX 會員」「註冊教學」「常見問題」：交給 join.js 開
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-open],[data-join]"); if (!el || !window.OXJOIN) return;
    const what = el.dataset.open || "join", inDrawer = !!el.closest(".oh-drawer"), host = el.closest(".oh-join");
    if (inDrawer) { SND.tick(740); closeDrawer(); }
    setTimeout(() => window.OXJOIN.open(what, host ? $(".oh-card", host) : null), inDrawer ? 260 : 0);
  });
  addEventListener("keydown", e => { if (e.key === "Escape" && B.classList.contains("dr-open")) closeDrawer(); });

  window.OXHOME = { D, $, $$, esc, asset, icon, lineIcon, chatIcon, logoHTML, cardFace, watchCard, teacher, say, SND, reduce, fx, setWorld, openDrawer, closeDrawer };
})();
