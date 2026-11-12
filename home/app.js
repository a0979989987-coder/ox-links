/* OX 會員首頁的版面與互動：logo、LINE 兩格、三種大格子、側邊選單、五張老師卡、註冊流程第一步、聲音。
   粒子和背景在 fx.js（window.OXFX），內容在 data.js（window.OXH）。 */
(function () {
  "use strict";
  const D = window.OXH, B = document.body, ROOT = B.dataset.root || "";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const asset = p => !p ? "" : /^https?:/.test(p) ? p : ROOT + p;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fx = () => window.OXFX || {};
  const qs = new URLSearchParams(location.search);
  document.documentElement.classList.add("js");

  // ---------- 圖示 ----------
  const I = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    join: '<circle cx="10" cy="8" r="3.6"/><path d="M3.5 19.5c.6-3.4 3.2-5.3 6.5-5.3 1.6 0 3 .4 4.1 1.2M18 12.5v6M15 15.5h6"/>',
    people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19c.5-3 2.8-4.8 6-4.8s5.5 1.8 6 4.8"/><path d="M15.5 5.6a3 3 0 0 1 0 5.8M17.5 14.6c2 .6 3.2 2.1 3.5 4.4"/>',
    works: '<rect x="3.5" y="4.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="4.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
    method: '<path d="M7 3.5v3M7 15.5v3M16.5 6v4M16.5 17.5v3"/><rect x="5" y="6.5" width="4" height="9" rx="1"/><rect x="14.5" y="10" width="4" height="7.5" rx="1"/>',
    candle: '<path d="M7 3.5v3M7 15.5v3M16.5 6v4M16.5 17.5v3"/><rect x="5" y="6.5" width="4" height="9" rx="1"/><rect x="14.5" y="10" width="4" height="7.5" rx="1"/>',
    coin: '<circle cx="12" cy="12" r="8.6"/><path d="M9.6 7.8h3.3a2 2 0 0 1 0 4H9.6Zm0 4h3.9a2.1 2.1 0 0 1 0 4.2H9.6ZM9.6 7.8v8.4M11.2 6.3v1.5M11.2 16.2v1.5"/>',
    merge: '<circle cx="9" cy="14" r="5.6"/><circle cx="16.4" cy="8" r="3.6"/>',
    guide: '<path d="M5 4.5h10.5a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3Z"/><path d="M5 17a3 3 0 0 1 3-3h10.5M9 8.5h6"/>',
    faq: '<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.9M12 16.8v.2"/>',
    chat: '<path d="M4 5.5h11a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H9l-4 3.5V15H4a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z"/><path d="M19 9h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v2.5L16 18h-4"/>'
  };
  const icon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[k] || ""}</svg>`;
  // LINE：白色對話框，字用綠色鏤空
  const lineIcon = (ink = "#06c755") => `<svg viewBox="0 0 24 24" aria-hidden="true" class="ln"><path fill="#fff" stroke="none" d="M12 3.6c-5 0-9.1 3.3-9.1 7.4 0 3.6 3.2 6.7 7.6 7.3.3.1.7.2.8.5.1.2.1.6 0 .9l-.1.8c0 .2-.2.9.8.5s5.4-3.2 7.4-5.4c1.4-1.5 2-3 2-4.6 0-4.1-4.1-7.4-9.4-7.4Z"/><g fill="none" stroke="${ink}" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><path d="M6.6 9.2v3.5h2"/><path d="M10.1 9.2v3.5"/><path d="M11.7 12.7V9.2l2.6 3.5V9.2"/><path d="M17.6 9.2h-1.9v3.5h1.9M15.7 10.95h1.8"/></g></svg>`;
  const chatIcon = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${I.chat}</svg>`;
  // logo 直接用永盛給的那張圖（白底），不重畫；data.js 裡的向量外框只給黑卡的浮水印用
  const logoSVG = () => `<img src="${esc(asset(D.logo.img))}" alt="" width="64" height="64">`;
  $$("[data-logo]").forEach(el => { el.innerHTML = logoSVG(); });
  $$("[data-logo-line]").forEach(el => { el.innerHTML = `<svg viewBox="${D.logo.viewBox}"><path d="${D.logo.d}"/><path d="${D.logo.b}"/></svg>`; });

  // ---------- 提示 ----------
  B.insertAdjacentHTML("beforeend", `<div class="oh-toast" role="status" aria-live="polite"></div>`);
  let tt = 0;
  function say(m) { const t = $(".oh-toast"); t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 2200); }

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
    // 先收再砸：低音銅管往上推，最後一下重擊
    swell(hit = .52) {
      const a = ac(); if (!a) return; const t = a.currentTime + .01;
      const out = a.createGain(), lp = a.createBiquadFilter(); lp.type = "lowpass";
      lp.frequency.setValueAtTime(170, t); lp.frequency.exponentialRampToValueAtTime(1500, t + hit); lp.frequency.exponentialRampToValueAtTime(220, t + hit + .9);
      out.gain.setValueAtTime(.0001, t); out.gain.exponentialRampToValueAtTime(.16, t + hit); out.gain.exponentialRampToValueAtTime(.0001, t + hit + 1);
      lp.connect(out); out.connect(a.destination);
      [55, 55.5, 82.4, 110.3].forEach(f => { const o = a.createOscillator(), g = a.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(f * .965, t); o.frequency.exponentialRampToValueAtTime(f, t + hit); g.gain.value = .25; o.connect(g); g.connect(lp); o.start(t); o.stop(t + hit + 1.1); });
      const s = a.createOscillator(), sg = a.createGain(); s.type = "sine"; s.frequency.setValueAtTime(92, t + hit); s.frequency.exponentialRampToValueAtTime(36, t + hit + .4);
      sg.gain.setValueAtTime(.0001, t + hit - .01); sg.gain.exponentialRampToValueAtTime(.42, t + hit + .02); sg.gain.exponentialRampToValueAtTime(.0001, t + hit + .7);
      s.connect(sg); sg.connect(a.destination); s.start(t + hit - .01); s.stop(t + hit + .8);
    }
  };
  const sndBtn = $(".oh-snd");
  const syncSnd = () => sndBtn && sndBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
  syncSnd();
  sndBtn && sndBtn.addEventListener("click", () => { soundOn = !soundOn; localStorage.setItem("ox-sound", soundOn ? "on" : "off"); syncSnd(); say(soundOn ? "聲音開" : "聲音關"); if (soundOn) SND.tick(); });

  // ---------- 第一頁：大格子上的字、LINE 兩格 ----------
  const perks = $("[data-perks]"); if (perks) perks.innerHTML = D.member.perks.map(p => `<span>${icon("check")}${esc(p)}</span>`).join("");
  const rule = $("[data-rule]"); if (rule) rule.textContent = D.member.rule;
  const ruleNote = $("[data-rule-note]"); if (ruleNote) ruleNote.textContent = D.member.ruleNote;
  const lines = $("[data-lines]");
  if (lines) lines.innerHTML = [["official", lineIcon()], ["community", chatIcon]].map(([k, ic]) => {
    const l = D.line[k];
    return `<a class="oh-line" href="${esc(l.url)}" target="_blank" rel="noopener"><i>${ic}</i><span><b>${esc(l.title)}</b><small>${esc(l.desc)}</small></span></a>`;
  }).join("");

  // 三種大格子（樣張）：A 液態玻璃、B 粒子光框、C 會員黑卡
  const HEROES = ["a", "b", "c"], HNAME = { a: "A 玻璃", b: "B 光框", c: "C 黑卡" };
  function setHero(v, quiet) {
    if (!HEROES.includes(v)) v = "a";
    B.dataset.hero = v; try { localStorage.setItem("ox-hero", v); } catch (e) {}
    fx().setHero && fx().setHero(v);
    $$(".oh-pv button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v ? "true" : "false"));
    if (!quiet) { SND.tick(660); fx().burst && fx().burst(); }
  }
  if (B.dataset.preview) {
    B.insertAdjacentHTML("beforeend", `<div class="oh-pv" role="group" aria-label="樣張：大格子的三種做法"><span>樣張</span>${HEROES.map(v => `<button type="button" data-v="${v}">${HNAME[v]}</button>`).join("")}</div>`);
    $$(".oh-pv button").forEach(b => b.addEventListener("click", () => { setHero(b.dataset.v); scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); }));
  }
  let hero0 = qs.get("hero") || B.dataset.hero || "a";
  if (B.dataset.preview && !qs.get("hero")) { try { hero0 = localStorage.getItem("ox-hero") || hero0; } catch (e) {} }
  setHero(hero0, true);

  // 大格子跟著手指傾斜，玻璃上的高光跟著走
  const join = $(".oh-join"), face = $(".oh-join-face");
  if (join && face && !reduce) {
    let rq = 0, tx = 0, ty = 0;
    const apply = () => {
      rq = 0;
      face.style.setProperty("--ry", (tx * 9).toFixed(2) + "deg"); face.style.setProperty("--rx", (-ty * 7).toFixed(2) + "deg");
      face.style.setProperty("--mx", ((tx + .5) * 100).toFixed(1) + "%"); face.style.setProperty("--my", ((ty + .5) * 100).toFixed(1) + "%");
    };
    const move = e => { const r = join.getBoundingClientRect(); tx = Math.max(-.5, Math.min(.5, (e.clientX - r.left) / r.width - .5)); ty = Math.max(-.5, Math.min(.5, (e.clientY - r.top) / r.height - .5)); if (!rq) rq = requestAnimationFrame(apply); };
    const rest = () => { tx = 0; ty = 0; if (!rq) rq = requestAnimationFrame(apply); };
    join.addEventListener("pointermove", move, { passive: true }); join.addEventListener("pointerdown", move, { passive: true });
    join.addEventListener("pointerleave", rest); join.addEventListener("pointerup", e => { if (e.pointerType !== "mouse") rest(); }); join.addEventListener("pointercancel", rest);
  }

  // 上方列：離開最上面就墊一層底
  const top = $(".oh-top");
  const onScroll = () => top && top.classList.toggle("solid", scrollY > 24);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

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
  const tcs = $$(".oh-tc"), rvs = $$(".oh-rv");
  if (reduce || !("IntersectionObserver" in window)) tcs.concat(rvs).forEach(el => el.classList.add("in"));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -9% 0px", threshold: .2 });
    tcs.concat(rvs).forEach(el => io.observe(el));
  }
  tcs.forEach(el => el.addEventListener("click", () => SND.tick(740)));

  // ---------- 側邊選單 ----------
  const menuBtn = $(".oh-menu");
  const soon = "這一段下一版做";
  const items = [
    { sec: "頁面" },
    { k: "people", t: "小老師們", go: "#teachers" },
    { k: "works", t: "作品", soon: 1 },
    { k: "method", t: "交易法介紹", soon: 1 },
    { sec: "OX 工具" },
    ...D.tools.map(x => ({ k: x.icon, t: x.label, url: x.url })),
    { sec: "LINE" },
    { ln: 1, t: D.line.official.title, u: D.line.official.desc, url: D.line.official.url },
    { k: "chat", t: D.line.community.title, u: D.line.community.desc, url: D.line.community.url },
    { sec: "說明" },
    { k: "guide", t: "註冊教學", soon: 1 },
    { k: "faq", t: "常見問題", soon: 1 }
  ];
  let n = 2;
  B.insertAdjacentHTML("beforeend", `<div class="oh-scrim" data-close></div>
  <aside class="oh-drawer" id="oh-drawer" aria-label="選單" aria-hidden="true">
    <div class="oh-dme" style="--i:0"><span class="oh-logo">${logoSVG()}</span><span><b>${esc(D.brand)}</b><small>會員註冊</small></span></div>
    <button type="button" class="oh-dcta" style="--i:1" data-act="join">註冊成為 OX 會員${icon("arrow")}</button>
    ${items.map(it => it.sec ? `<div class="oh-dsec" style="--i:${n++}">${esc(it.sec)}</div>`
      : it.url ? `<a class="oh-di" style="--i:${n++}" href="${esc(it.url)}" target="_blank" rel="noopener">${it.ln ? lineIcon("#121417") : icon(it.k)}<span>${esc(it.t)}</span>${it.u ? `<u>${esc(it.u)}</u>` : ""}</a>`
        : `<button type="button" class="oh-di" style="--i:${n++}" ${it.go ? `data-go="${esc(it.go)}"` : `data-soon="1"`}>${icon(it.k)}<span>${esc(it.t)}</span>${it.soon ? `<u>下一版</u>` : ""}</button>`).join("")}
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
    B.classList.add("dr-closing"); B.classList.remove("dr-open"); drawer.setAttribute("aria-hidden", "true"); menuBtn && menuBtn.setAttribute("aria-expanded", "false");
    setTimeout(() => B.classList.remove("dr-closing"), 380);
    SND.whoosh(.26, .04, false);
  }
  menuBtn && menuBtn.addEventListener("click", openDrawer);
  $(".oh-scrim").addEventListener("click", closeDrawer);
  drawer.addEventListener("click", e => {
    const el = e.target.closest("[data-act],[data-go],[data-soon],a"); if (!el) return;
    if (el.dataset.soon) { say(soon); SND.tick(520); return; }
    SND.tick(740); closeDrawer();
    if (el.dataset.act === "join") setTimeout(() => openFlow(false), 260);
    else if (el.dataset.go) setTimeout(() => { const to = $(el.dataset.go); to && to.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 200);
  });
  let sx0 = null;
  drawer.addEventListener("touchstart", e => { sx0 = e.touches[0].clientX; }, { passive: true });
  drawer.addEventListener("touchmove", e => { if (sx0 != null && e.touches[0].clientX - sx0 < -56) { sx0 = null; closeDrawer(); } }, { passive: true });

  // ---------- 註冊流程：第一步「你是看誰的內容來的？」 ----------
  const F = D.flow, joiners = D.teachers.filter(t => t.join);
  B.insertAdjacentHTML("beforeend", `<div class="oh-flow" id="oh-flow" role="dialog" aria-modal="true" aria-labelledby="oh-ask" aria-hidden="true"><div class="oh-fin">
    <div class="oh-fhead"><button type="button" class="oh-round" data-fclose aria-label="回到首頁">${icon("back")}</button><b>註冊成為 OX 會員</b><span></span></div>
    <ol class="oh-steps">${F.steps.map((s, i) => `<li data-n="${i + 1}"${i === 0 ? ' class="cur"' : ""}>${esc(s)}</li>`).join("")}</ol>
    <h2 class="oh-ask" id="oh-ask">${esc(F.askTitle)}</h2>
    <p class="oh-asknote">${esc(F.askNote)}</p>
    <div class="oh-opts">${joiners.map((t, i) => `<button type="button" class="oh-opt" data-t="${esc(t.id)}" aria-pressed="false" style="--c:${esc(t.color)};--i:${i}"><img src="${esc(asset(t.avatar))}" alt="" width="60" height="60" loading="lazy"><b>${esc(t.name)}</b></button>`).join("")}</div>
    <button type="button" class="oh-none" data-t="none" aria-pressed="false" style="--i:${joiners.length}">${esc(F.none)}</button>
    <div class="oh-frule"><h3>拿到進階教材的條件</h3><p>${esc(D.member.rule)}</p><small>${esc(D.member.ruleNote)}</small></div>
  </div></div>`);
  const flow = $("#oh-flow");
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let flowBusy = false;
  async function openFlow(fromTile) {
    if (flowBusy || B.classList.contains("flow-open")) return;
    flowBusy = true; B.classList.add("flow-open");
    const r = face ? face.getBoundingClientRect() : null;
    const seen = r && r.bottom > 40 && r.top < innerHeight - 40;
    if (fromTile && seen && !reduce && fx().ok) {
      // 整個星系被吸進大格子 → 格子打開變成整頁
      SND.swell(.62); B.classList.add("sucking");
      await Promise.race([fx().suck(true), wait(1100)]);
      const p = document.createElement("div"); p.className = "oh-portal";
      const rad = getComputedStyle(face).borderRadius;
      Object.assign(p.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", borderRadius: rad });
      B.appendChild(p);
      const an = p.animate([{ left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", borderRadius: rad }, { left: "0px", top: "0px", width: innerWidth + "px", height: innerHeight + "px", borderRadius: "0px" }], { duration: 430, easing: "cubic-bezier(.6,.05,.2,1)", fill: "forwards" });
      await Promise.race([an.finished, wait(600)]);
      flow.classList.add("on"); await wait(120); p.remove(); B.classList.remove("sucking");
    } else { SND.whoosh(.4, .07, true); flow.classList.add("on"); }
    flow.setAttribute("aria-hidden", "false"); flow.scrollTop = 0;
    fx().pause && fx().pause(true);
    try { history.pushState({ oxFlow: 1 }, "", "#join"); } catch (e) {}
    flowBusy = false;
  }
  function closeFlow(fromPop) {
    if (!B.classList.contains("flow-open")) return;
    flow.classList.remove("on"); flow.setAttribute("aria-hidden", "true"); B.classList.remove("flow-open");
    fx().pause && fx().pause(false); fx().suck && fx().suck(false);
    SND.whoosh(.36, .05, false);
    if (!fromPop && history.state && history.state.oxFlow) { try { history.back(); } catch (e) {} }
  }
  join && join.addEventListener("click", () => openFlow(true));
  flow.addEventListener("click", e => {
    if (e.target.closest("[data-fclose]")) { closeFlow(); return; }
    const o = e.target.closest("[data-t]"); if (!o) return;
    $$("[data-t]", flow).forEach(x => x.setAttribute("aria-pressed", x === o ? "true" : "false"));
    SND.tick(820);
    const id = o.dataset.t === "none" ? F.noneTeacher : o.dataset.t, t = D.teachers.find(x => x.id === id);
    say(`選了「${o.dataset.t === "none" ? F.none : t.name}」。樣張先到這一步，下一步是${t.name}的交易所註冊頁`);
  });
  addEventListener("popstate", () => closeFlow(true));
  addEventListener("keydown", e => { if (e.key === "Escape") { if (B.classList.contains("dr-open")) closeDrawer(); else closeFlow(); } });
  if (location.hash === "#join") { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} }

  window.OXHOME = { setHero, openFlow, closeFlow, openDrawer, closeDrawer };
})();
