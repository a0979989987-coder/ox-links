/* OX 官網 v5：渲染畫面（seq.js）和金屬 logo（logo3d.js）以外的互動。全部掛在 loop.js 的同一個循環上；值沒變就不寫樣式。 */
(function () {
  "use strict";
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const span = (el, vh) => { const r = OX.rect(el); return clamp(-r.top / Math.max(1, r.height - vh), 0, 1); };
  const memo = new Map();
  const setVar = (el, k, v) => { let m = memo.get(el); if (!m) memo.set(el, m = {}); if (m[k] !== v) { m[k] = v; el.style.setProperty(k, v); } };

  // 出現（只用透明度和位移）
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12, rootMargin: "0px 0px -4% 0px" });
    $$("[data-rv]").forEach(el => io.observe(el));
  } else $$("[data-rv]").forEach(el => el.classList.add("in"));

  // 選單
  const nav = $("#nav"), menuBtn = $(".nav-menu"), drawer = $("#drawer");
  const setMenu = on => { document.documentElement.classList.toggle("menu-open", on); menuBtn.setAttribute("aria-expanded", on); drawer.setAttribute("aria-hidden", !on); };
  menuBtn.addEventListener("click", () => setMenu(!document.documentElement.classList.contains("menu-open")));
  drawer.addEventListener("click", e => { if (e.target === drawer || e.target.closest("a")) setMenu(false); });

  // 原話拆成一個個字
  const sayChars = [];
  $$("[data-light]").forEach(el => {
    const split = node => Array.from(node.childNodes).forEach(n => {
      if (n.nodeType === 3) { const f = document.createDocumentFragment(); for (const ch of n.textContent) { const sp = document.createElement("span"); sp.className = "ch"; sp.textContent = ch; f.appendChild(sp); sayChars.push(sp); } node.replaceChild(f, n); }
      else split(n);
    });
    split(el);
    if (reduce) sayChars.forEach(c => c.classList.add("lit"));
  });
  let litN = -1;

  // 數字：進畫面時從 0 數上去
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now();
      const step = now => { const k = ease((now - t0) / 1400); el.textContent = Math.round(to * k).toLocaleString("en-US") + suf; if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: .6 });
    $$("[data-count]").forEach(el => { el.textContent = "0" + (el.dataset.suffix || ""); io.observe(el); });
  }

  // 創辦人頭像：笑臉＋一圈跟著「說話」跳的光條（暗底用青 82,180,209）
  const av = $("#avatar"), ag = av.getContext("2d"), face = new Image(); face.src = "img/av/snsheng.png";
  const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  function sizeAv() { const d = Math.min(devicePixelRatio || 1, 2), r = av.getBoundingClientRect(); if (!r.width) return; av.width = Math.round(r.width * d); av.height = Math.round(r.height * d); ag.setTransform(d, 0, 0, d, 0, 0); av._w = r.width; }
  function drawAv(t) {
    const W = av._w || 200, x = W / 2, y = W / 2, r = W * .3, rc = "82,180,209";
    const env = clamp(.42 + .3 * Math.sin(t * 2.3) * Math.sin(t * .9 + 1) + .18 * Math.sin(t * 5.1), 0, 1);
    ag.clearRect(0, 0, W, W);
    const g = ag.createRadialGradient(x, y, r * .9, x, y, r * (1.5 + .5 * env)); g.addColorStop(0, `rgba(${rc},${.14 + .28 * env})`); g.addColorStop(1, `rgba(${rc},0)`);
    ag.fillStyle = g; ag.beginPath(); ag.arc(x, y, r * (1.5 + .5 * env), 0, Math.PI * 2); ag.fill();
    const N = 44, fi = Math.round(t * 12); ag.lineCap = "round";
    for (let i = 0; i < N; i++) {
      const ang = i / N * Math.PI * 2 - Math.PI / 2, jit = .35 + .65 * hash(i * 3.1 + fi * .37), len = 2 + r * .34 * env * jit, r0 = r * 1.14;
      ag.strokeStyle = `rgba(${rc},${.4 + .5 * env})`; ag.lineWidth = Math.max(1.5, W * .011);
      ag.beginPath(); ag.moveTo(x + Math.cos(ang) * r0, y + Math.sin(ang) * r0); ag.lineTo(x + Math.cos(ang) * (r0 + len), y + Math.sin(ang) * (r0 + len)); ag.stroke();
    }
    ag.save(); ag.beginPath(); ag.arc(x, y, r, 0, Math.PI * 2); ag.clip();
    if (face.complete && face.naturalWidth) ag.drawImage(face, x - r, y - r, r * 2, r * 2); else { ag.fillStyle = "#f2c94c"; ag.fill(); }
    ag.restore();
    ag.lineWidth = Math.max(2, W * .014) + 1.5 * env; ag.strokeStyle = `rgba(${rc},${.7 + .3 * env})`;
    ag.beginPath(); ag.arc(x, y, r + 1.5, 0, Math.PI * 2); ag.stroke();
  }
  let avSeen = false;
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { avSeen = es[0].isIntersecting; }).observe(av); else avSeen = true;

  // ---------- 每一格 ----------
  const bsteps = $$(".blist li"), sayStage = $("#say .stage"), outro = $("#outro"), ostage = $(".outro-stage");
  [sayStage, outro].forEach(el => OX.track(el));
  const links = $$(".nav-links a"), W2ID = { city: "#tw", tunnel: "#crypto", lab: "#build", islands: "#methods", academy: "learn/", cinema: "#films", stars: "#team", card: "#member" };
  let bi = -1, last = 0, lastW = "";
  OX.add((S, now) => {
    const t = now / 1000, H = S.vh;
    nav.classList.toggle("solid", S.y > 24);
    const w = document.documentElement.dataset.cur;
    if (w !== lastW) { lastW = w; links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === W2ID[w])); }

    // 原話：一個字一個字亮
    { const r = OX.rect(sayStage); if (r.bottom > 0 && r.top < H) { const q = clamp((H - r.top) / r.height, 0, 1), n = Math.round(clamp(q * 1.5 - .15, 0, 1) * sayChars.length);
      if (n !== litN) { litN = n; sayChars.forEach((c, k) => c.classList.toggle("lit", k < n)); } } }

    // 製作中：跟渲染畫面同一個進度，拆開的手機哪一層往前、左邊就亮哪一項
    if (window.OXP && OXP.world === "lab") { const n = bsteps.length, i = Math.min(n - 1, Math.floor(clamp((OXP.p - .14) / .68, 0, 1) * n * .999));
      if (i !== bi) { bi = i; bsteps.forEach((e, k) => e.classList.toggle("on", k === i)); } }

    // 收尾：logo 合上之後才出現大字
    { const r = OX.rect(outro); if (r.bottom > 0 && r.top < H) setVar(ostage, "--o-t", smooth((span(outro, H) - .5) / .25).toFixed(2)); }

    if (avSeen && (now - last > 40 || reduce)) { last = now; drawAv(reduce ? 1 : t); }
  });
  addEventListener("resize", sizeAv);
  sizeAv(); face.onload = () => drawAv(0);
})();
