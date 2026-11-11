/* 四頁共用工具：資料、圖示、開場、入場觀察、分享、聲音（WebAudio 合成，點過畫面才會響）。
   版型與特效在 js/<id>.js，各頁自己的 render() 會用到這裡的 OX。 */
(function () {
  const D = window.OX_DATA, V = (window.OX_VIDEOS || { channels: {} });
  const B = document.body, ROOT = B.dataset.root || "";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const asset = p => !p ? "" : /^https?:/.test(p) ? p : ROOT + p;
  const P = D.people.find(p => p.id === B.dataset.person);

  const ICONS = {
    yt: '<path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8ZM10 15V9l5.2 3Z" fill="currentColor"/>',
    ig: '<g fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2"/><circle cx="12" cy="12" r="4.1"/></g><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/>',
    threads: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M17.6 7.6C16.4 4.9 14.4 3.5 12 3.5c-4.6 0-7.6 3.5-7.6 8.5s3 8.5 7.6 8.5c3.6 0 6.3-2 6.6-5 .3-2.9-1.8-4.6-5-4.6-2.6 0-4 1.1-4 2.6 0 1.4 1.2 2.3 2.9 2.2 2.6-.2 3.8-2.1 3.6-6.3"/>',
    line: '<path fill="currentColor" d="M12 3.6c-5 0-9.1 3.3-9.1 7.4 0 3.6 3.2 6.7 7.6 7.3.3.1.7.2.8.5.1.2.1.6 0 .9l-.1.8c0 .2-.2.9.8.5s5.4-3.2 7.4-5.4c1.4-1.5 2-3 2-4.6 0-4.1-4.1-7.4-9.4-7.4Z"/><g fill="none" stroke="var(--line-ink,#06C755)" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><path d="M6.6 9.2v3.5h2"/><path d="M10.1 9.2v3.5"/><path d="M11.7 12.7V9.2l2.6 3.5V9.2"/><path d="M17.6 9.2h-1.9v3.5h1.9M15.7 10.95h1.8"/></g>',
    chat: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5h11a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H9l-4 3.5V15H4a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z"/><path d="M19 9h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v2.5L16 18h-4"/></g>',
    "i-candle": '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M7 3.5v3M7 15.5v3"/><rect x="5" y="6.5" width="4" height="9" rx="1"/><path d="M15.5 6v4M15.5 17.5v3"/><rect x="13.5" y="10" width="4" height="7.5" rx="1" fill="currentColor"/></g>',
    "i-coin": '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.6"/><path d="M9.6 7.8h3.3a2 2 0 0 1 0 4H9.6Zm0 4h3.9a2.1 2.1 0 0 1 0 4.2H9.6ZM9.6 7.8v8.4M11.2 6.3v1.5M11.2 16.2v1.5"/></g>',
    "i-merge": '<g fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="14" r="5.6"/><circle cx="16.4" cy="8" r="3.6"/></g><circle cx="9" cy="14" r="2" fill="currentColor"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    share: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12"/></g>',
    son: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.6 7.6 0 0 1 0 11"/></g>',
    soff: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></g>'
  };
  const icon = (k, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ""}</svg>`;
  const SOC = { yt: "YouTube", ig: "Instagram", threads: "Threads" };
  const socials = p => ["yt", "ig", "threads"].filter(k => p.links && p.links[k]).map(k => ({ k, url: p.links[k], label: SOC[k] }));

  /* 聲音：每頁傳入自己的音色 */
  let actx = null, soundOn = localStorage.getItem("ox-sound") !== "off";
  function ac() {
    if (!soundOn) return null;
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  const SND = {
    tone(f, d = .25, type = "sine", v = .2, f2) {
      const a = ac(); if (!a) return; const t = a.currentTime + .005, o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .05);
    },
    noise(d = .2, v = .2, freq = 1200, type = "lowpass") {
      const a = ac(); if (!a) return; const t = a.currentTime + .005, b = a.createBuffer(1, Math.floor(a.sampleRate * d), a.sampleRate), x = b.getChannelData(0);
      for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / x.length);
      const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; fl.type = type; fl.frequency.value = freq; g.gain.value = v;
      s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(t);
    }
  };

  /* 分享與聲音按鈕 */
  function toolbar() {
    B.insertAdjacentHTML("beforeend", `<div class="tb"><button type="button" class="snd${soundOn ? "" : " muted"}" aria-label="聲音開關">${icon("son", "on")}${icon("soff", "off")}</button>
      <button type="button" class="shr" aria-label="分享這個網頁">${icon("share")}</button></div><div class="toast" role="status" aria-live="polite"></div>`);
    const sb = document.querySelector(".tb .snd");
    sb.addEventListener("click", () => { soundOn = !soundOn; localStorage.setItem("ox-sound", soundOn ? "on" : "off"); sb.classList.toggle("muted", !soundOn); say(soundOn ? "聲音開" : "聲音關"); });
    document.querySelector(".tb .shr").addEventListener("click", async () => {
      const data = { title: document.title, url: location.href };
      if (navigator.share) { try { await navigator.share(data); } catch (e) {} return; }
      try { await navigator.clipboard.writeText(location.href); say("網址已複製"); } catch (e) { say(location.href); }
    });
  }
  let tt;
  function say(m) { const t = document.querySelector(".toast"); if (!t) return; t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 1600); }

  /* 入場：.rv 進畫面時加 .in；data-d 可以設延遲（秒） */
  function reveal(root = document) {
    const els = root.querySelectorAll(".rv");
    if (reduce || !("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; const el = e.target;
      el.style.transitionDelay = el.style.animationDelay = (el.dataset.d || 0) + "s"; el.classList.add("in"); io.unobserve(el);
      el.dispatchEvent(new CustomEvent("enter"));
    }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach(e => io.observe(e));
  }

  /* 開場：結束（或點一下跳過）後呼叫 done */
  function intro(word, done) {
    const el = document.getElementById("intro");
    if (reduce || !el) { if (el) el.remove(); B.classList.remove("intro-on"); done(); return; }
    el.querySelector(".i-word").textContent = word;
    const sp = el.querySelector(".i-sparks");
    for (let i = 0; i < 18; i++) { const s = document.createElement("i"); s.style.setProperty("--a", (i * 20 + Math.random() * 12 - 6) + "deg"); sp.appendChild(s); }
    let ended = false;
    const end = () => { if (ended) return; ended = true; el.classList.add("done"); B.classList.remove("intro-on"); done(); setTimeout(() => el.remove(), 550); };
    const t = setTimeout(end, 1450);
    el.addEventListener("pointerdown", e => { e.stopPropagation(); clearTimeout(t); end(); });
  }

  /* 外部連結開新分頁、不能拖曳 */
  function finalize() {
    document.querySelectorAll("a[href^='http']").forEach(a => { a.target = "_blank"; a.rel = "noopener"; });
    document.querySelectorAll("a, img").forEach(el => el.setAttribute("draggable", "false"));
  }
  /* 底部固定 LINE 條：開場後出現，主要的 LINE 官方大格露出一半以上時才收起來，只露一角時照樣顯示 */
  function dock(sel, mainSel) {
    const d = document.querySelector(sel), m = document.querySelector(mainSel); if (!d) return;
    let mainIn = false, started = false;
    const upd = () => d.classList.toggle("on", started && !mainIn);
    if (m && "IntersectionObserver" in window) new IntersectionObserver(es => { mainIn = es[0].intersectionRatio >= .55; upd(); }, { threshold: [0, .55, 1] }).observe(m);
    const go = () => { started = true; upd(); };
    if (!B.classList.contains("intro-on")) setTimeout(go, 600); else new MutationObserver((_, o) => { if (!B.classList.contains("intro-on")) { o.disconnect(); setTimeout(go, 900); } }).observe(B, { attributes: true });
  }
  const raf = fn => { let on = false; return (...a) => { if (on) return; on = true; requestAnimationFrame(() => { on = false; fn(...a); }); }; };

  window.OX = { D, V, P, B, ROOT, reduce, esc, asset, icon, socials, SND, toolbar, say, reveal, intro, finalize, raf, dock,
    videos: id => (V.channels[id] && V.channels[id].videos) || [], fetchedAt: V.fetchedAt };
})();
