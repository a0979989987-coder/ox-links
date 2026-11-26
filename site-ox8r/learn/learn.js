/* 新手學院：學院首頁（三條路）和一課一頁都由這支畫。學到哪裡記在這台裝置（localStorage，讀不到就當沒學過）。
   ?review=1 會顯示每句引言的出處，給永盛核對用。 */
(function () {
  "use strict";
  const { TRACKS, LESSONS } = window.OXLEARN;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const q = new URLSearchParams(location.search);
  if (q.has("review")) document.documentElement.classList.add("review");
  const CHEV = '<svg viewBox="0 0 8 14" aria-hidden="true"><path d="M1.5 1.5L6.5 7l-5 5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const store = {
    get() { try { return new Set(JSON.parse(localStorage.getItem("ox-learn-done") || "[]")); } catch (e) { return new Set(); } },
    set(s) { try { localStorage.setItem("ox-learn-done", JSON.stringify([...s])); } catch (e) { } }
  };
  const done = store.get();
  const real = LESSONS.filter(l => !l.soon);
  const prog = $(".prog"); if (prog) prog.textContent = `已完成 ${real.filter(l => done.has(l.id)).length}／${real.length} 課`;
  const numOf = l => { const same = LESSONS.filter(x => x.track === l.track && x.cat === l.cat); return String(same.indexOf(l) + 1).padStart(2, "0"); };

  // ---------------- 學院首頁 ----------------
  const home = $("#home");
  if (home) {
    const one = LESSONS.find(l => l.id === "one-trade"), t = TRACKS;
    let h = `<section class="sec" id="one"><h2>${t[0].title}</h2><p>${t[0].sub}</p>
      <div class="feature"><div><p class="meta">7 步・約 ${one.mins} 分鐘${done.has(one.id) ? "・已完成" : ""}</p><h3>${esc(one.title)}</h3><p style="margin-top:10px">${esc(one.sum)}</p>
      <div class="row" style="margin-top:22px"><a class="btn" href="lesson.html?id=one-trade">${done.has(one.id) ? "再看一次" : "開始"}</a></div></div>
      <div class="fc"><canvas class="feat-chart" aria-label="教一把用的比特幣 15 分鐘 K 線"></canvas></div></div></section>`;
    h += `<section class="sec" id="tech"><h2>${t[1].title}</h2><p>${t[1].sub}</p>`;
    for (const c of t[1].cats) {
      h += `<div class="cat" id="cat-${c.id}"><h3>${c.title}</h3><div class="rowx">`;
      for (const l of LESSONS.filter(x => x.track === "tech" && x.cat === c.id)) {
        const d = done.has(l.id);
        h += `<a class="lc${l.soon ? " soon" : ""}${d ? " done" : ""}" href="${l.soon ? "#" : "lesson.html?id=" + l.id}"><span class="no">${c.id.toUpperCase()}${numOf(l)}</span><h4>${esc(l.title)}</h4><p>${esc(l.sum || "")}</p><span class="st">${l.soon ? "製作中" : d ? "已完成" : "約 " + l.mins + " 分鐘"}</span></a>`;
      }
      h += `</div></div>`;
    }
    h += `</section><section class="sec" id="exchange"><h2>${t[2].title}</h2><p>${t[2].sub}</p><div class="exg">`;
    for (const l of LESSONS.filter(x => x.track === "ex")) h += `<div class="exc"><b>${esc(l.ex)}</b><ul>${l.sum.split("、").map(s => `<li>${esc(s)}</li>`).join("")}</ul><span class="tag">準備中</span></div>`;
    h += `</div></section>`;
    home.innerHTML = h;
    // 教一把卡片上的小圖：15 分鐘那段＋1／2／3
    fetch("one-trade.json").then(r => r.json()).then(ex => { const cv = $(".feat-chart"); if (cv) OXChart.chart(cv, specs(ex).c15small); });
  }

  // ---------------- 一課一頁 ----------------
  const box = $("#lesson");
  if (box) {
    const l = LESSONS.find(x => x.id === q.get("id")) || real[0];
    document.title = `${l.title}｜OX 新手學院`;
    const tr = TRACKS.find(t => t.id === l.track), cat = tr.cats && tr.cats.find(c => c.id === l.cat);
    let h = `<p class="crumb"><a href="./">新手學院</a>　›　<a href="./#${l.track === "one" ? "one" : "cat-" + l.cat}">${cat ? cat.title : tr.title}</a></p>
      <h1>${esc(l.title)}</h1><p class="lmeta">約 ${l.mins} 分鐘</p>`;
    const steps = (l.blocks || []).filter(b => b.t === "step");
    if (steps.length) h += `<nav class="stepbar" aria-label="步驟">${steps.map(s => `<a href="#s${s.n}">${s.n}　${esc(s.title)}</a>`).join("")}</nav>`;
    let open = false;
    for (const b of l.blocks || []) {
      if (b.t === "step") { if (open) h += `</section>`; h += `<section class="step" id="s${b.n}"><p class="sn">STEP ${b.n}</p><h2>${esc(b.title)}</h2>`; open = true; continue; }
      h += block(b);
    }
    if (open) h += `</section>`;
    const list = LESSONS.filter(x => !x.soon && x.track !== "ex"), i = list.indexOf(l), pv = list[i - 1], nx = list[i + 1];
    h += `<div class="done-row"><span>${done.has(l.id) ? "這一課已經完成。" : "看完了嗎？"}</span><button class="btn${done.has(l.id) ? " done" : ""}" id="mark">${done.has(l.id) ? "已完成" : "完成這一課"}</button></div>
      <div class="pn">${pv ? `<a href="lesson.html?id=${pv.id}"><small>上一課</small>${esc(pv.title)}</a>` : "<span></span>"}${nx ? `<a class="nx" href="lesson.html?id=${nx.id}"><small>下一課</small>${esc(nx.title)}</a>` : `<a class="nx" href="./"><small>回到</small>新手學院</a>`}</div>`;
    box.innerHTML = h;
    $("#mark").addEventListener("click", e => { if (done.has(l.id)) done.delete(l.id); else done.add(l.id); store.set(done); const on = done.has(l.id); e.target.textContent = on ? "已完成" : "完成這一課"; e.target.classList.toggle("done", on); });
    // 圖
    const needEx = (l.blocks || []).some(b => b.t === "chart" || b.t === "results" || b.t === "calc");
    const mountAll = ex => {
      document.querySelectorAll("canvas[data-chart]").forEach(cv => { const s = specs(ex)[cv.dataset.chart]; if (s) OXChart.chart(cv, s); });
      document.querySelectorAll("canvas[data-diagram]").forEach(cv => OXChart.diagram(cv, cv.dataset.diagram, +cv.dataset.ratio || undefined));
      if (ex) results(ex);
      calc();
    };
    if (needEx) fetch("one-trade.json").then(r => r.json()).then(mountAll).catch(() => mountAll(null)); else mountAll(null);
    if (document.querySelector("canvas[data-anim]")) { const s = document.createElement("script"); s.src = "../methods.js"; document.body.appendChild(s); }
    // 步驟列：滑到哪一步就亮哪一步
    if (steps.length && "IntersectionObserver" in window) {
      const links = [...document.querySelectorAll(".stepbar a")], bar = $(".stepbar");
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
        const on = links.find(a => a.classList.contains("on")); if (on) bar.scrollTo({ left: on.offsetLeft - 20, behavior: "smooth" });
      }), { rootMargin: "-35% 0px -60% 0px" });
      document.querySelectorAll(".step").forEach(s => io.observe(s));
    }
  }

  function block(b) {
    switch (b.t) {
      case "lead": return `<p class="lead">${b.h}</p>`;
      case "p": return `<p>${b.h}</p>`;
      case "h": return `<h2 class="bh">${esc(b.h)}</h2>`;
      case "quote": return `<blockquote>${esc(b.q)}<cite>${esc(b.who)}</cite>${b.src ? `<span class="src">${esc(b.src)}</span>` : ""}</blockquote>`;
      case "steps": return `<ol class="lsteps">${b.items.map(s => `<li>${s}</li>`).join("")}</ol>${b.src ? `<p class="src" style="display:none">${esc(b.src)}</p>` : ""}`;
      case "note": return `<p class="note">${esc(b.h)}</p>`;
      case "todo": return `<p class="todo">${esc(b.h)}</p>`;
      case "chart": return `<figure><canvas data-chart="${b.id}"></canvas><figcaption>${esc(b.cap || "")}</figcaption></figure>`;
      case "diagram": return `<figure><canvas data-diagram="${b.d}" data-ratio="${b.ratio || ""}"></canvas><figcaption>示意圖</figcaption></figure>`;
      case "anim": return `<figure><canvas data-anim="${b.a}" style="height:${innerWidth < 700 ? 210 : 260}px;border-radius:12px;background:#fbfaf6"></canvas><figcaption>${esc(b.cap || "")}</figcaption></figure>`;
      case "calc": return `<div class="calc" data-entry="${b.entry}" data-stop="${b.stop}"><div class="g"><label>願意虧的錢（USDT）<input type="number" inputmode="decimal" id="c-r" value="${b.risk}"></label><label>進場價<input type="number" inputmode="decimal" id="c-e" value="${b.entry}"></label><label>止損價<input type="number" inputmode="decimal" id="c-s" value="${b.stop}"></label></div><div class="out"><span>數量</span><b id="c-q">0</b><span id="c-n"></span></div></div>`;
      case "results": return `<div class="res" id="res"></div>`;
      case "link": return `<p><a class="lnk" href="${b.href}">${esc(b.h)}${CHEV}</a></p>`;
    }
    return "";
  }
  function calc() {
    const r = $("#c-r"); if (!r) return;
    const e = $("#c-e"), s = $("#c-s");
    const run = () => { const R = +r.value, E = +e.value, S = +s.value, d = Math.abs(E - S); if (!(R > 0 && d > 0)) { $("#c-q").textContent = "—"; $("#c-n").textContent = ""; return; } const qty = R / d; $("#c-q").textContent = qty.toFixed(4) + " BTC"; $("#c-n").textContent = `價值大約 ${Math.round(qty * E).toLocaleString("en-US")} USDT。止損距離 ${Math.round(d).toLocaleString("en-US")}（${(d / E * 100).toFixed(2)}%）。打到止損，虧的就是你填的 ${R.toLocaleString("en-US")} USDT。`; };
    [r, e, s].forEach(x => x.addEventListener("input", run)); run();
  }
  // 結果：每一次一根，中間一條零線，往上是賺、往下是虧，數字寫在旁邊（單位是「幾倍的風險」）
  function results(ex) {
    const el = $("#res"); if (!el) return;
    const sets = [["順著大方向做空", ex.stats_short], ["逆著大方向做多", ex.stats_long]];
    el.innerHTML = sets.map(([title, arr], i) => { const tot = arr.reduce((a, x) => a + x.r, 0);
      return `<div class="rbox"><h4>${title}</h4><canvas id="rc${i}"></canvas><p class="tot">${arr.length} 次，加起來 <b>${tot >= 0 ? "+" : ""}${tot.toFixed(1)}</b> 倍風險。</p></div>`; }).join("");
    const lo = Math.min(-1, ...sets.flatMap(s => s[1].map(x => x.r))), hi = Math.max(1, ...sets.flatMap(s => s[1].map(x => x.r)));
    sets.forEach(([, arr], i) => {
      const cv = $("#rc" + i), d = Math.min(devicePixelRatio || 1, 2), W = cv.parentElement.clientWidth - 36, H = 160;
      cv.style.width = W + "px"; cv.style.height = H + "px"; cv.width = W * d; cv.height = H * d;
      const g = cv.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
      const top = 18, bot = H - 18, Y = v => top + (hi - v) / (hi - lo) * (bot - top), y0 = Y(0), slot = W / arr.length, bw = Math.min(26, slot * .56);
      g.strokeStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.moveTo(0, y0); g.lineTo(W, y0); g.stroke();
      g.font = '600 11px -apple-system, "PingFang TC", "Microsoft JhengHei", sans-serif'; g.textAlign = "center";
      arr.forEach((x, k) => { const cx = slot * (k + .5), y = Y(x.r); g.fillStyle = x.r >= 0 ? "#2b8a3e" : "#c0392b"; g.fillRect(cx - bw / 2, Math.min(y, y0), bw, Math.max(1.5, Math.abs(y - y0)));
        g.fillStyle = "#1d1d1f"; g.textBaseline = x.r >= 0 ? "bottom" : "top"; g.fillText((x.r > 0 ? "+" : "") + x.r.toFixed(1), cx, x.r >= 0 ? y - 3 : y + 3); });
    });
  }

  // 教一把的三張真實 K 線圖（資料是 Binance 公開的 BTCUSDT K 線，時間是台北時間）
  function specs(ex) {
    if (!ex) return {};
    const tw = (m, d, h, mi = 0) => Date.UTC(2026, m - 1, d, h - 8, mi);
    const RED = "#c0392b", GOLD = "#b8913f", BLUE = "#0a6ab0", INK = "#1d1d1f";
    return {
      c4h: { bars: ex.k4, ann: [
        { type: "zone", p0: 80560, p1: 81823, from: 0, to: ex.k4.length - 1, label: "被碰過 6 次的高點" },
        { type: "dot", t: tw(10, 22, 0), p: 84898, label: "84,898", c: INK, dy: -16 },
        { type: "dot", t: tw(10, 28, 16), p: 81823, label: "81,823", c: INK, dy: 20 },
        { type: "dot", t: tw(11, 4, 20), p: 81196, label: "81,196", c: RED, dy: -18 }] },
      // 15 分只取高點前 18 小時到進場後，手機上 K 棒才不會太細
      c15: { bars: ex.k15.filter(b => b[0] >= ex.high.t - 18 * 3600e3), ratio: innerWidth < 700 ? .95 : .56, ann: [
        { type: "dot", t: ex.high.t, p: ex.high.p, label: "81,196", c: RED },
        { type: "hline", p: ex.Lw, from: ex.high.t - 14 * 3600e3, to: ex.p1.t, label: "多頭的低點 78,002", c: GOLD, dash: true },
        { type: "num", t: ex.p1.t, p: ex.p1.c, n: "1", c: "#0a6ab0", dy: 14 },
        { type: "hline", p: ex.S, from: ex.p1.t, to: ex.p3.t, c: BLUE, dash: true },
        { type: "num", t: ex.p2.t, p: ex.p2.h, n: "2", c: INK, dy: -14 },
        { type: "num", t: ex.p3.t, p: ex.p3.c, n: "3", c: RED, dy: 16 },
        { type: "hline", p: ex.stop, from: ex.p3.t, to: ex.k15[ex.k15.length - 1][0], label: "止損 77,006", c: RED, dash: true },
        { type: "entry", t: ex.p3.t, p: ex.entry, dir: "down", label: "空 75,409", c: RED, dx: 40, dy: 26 }] },
      c15small: { bars: ex.k15, ratio: .62, ann: [
        { type: "num", t: ex.p1.t, p: ex.p1.c, n: "1", c: "#0a6ab0", dy: 14 },
        { type: "num", t: ex.p2.t, p: ex.p2.h, n: "2", c: INK, dy: -14 },
        { type: "num", t: ex.p3.t, p: ex.p3.c, n: "3", c: RED, dy: 16 },
        { type: "hline", p: ex.stop, from: ex.p3.t, to: ex.k15[ex.k15.length - 1][0], c: RED, dash: true }] },
      c1h: { bars: ex.k1, ratio: innerWidth < 700 ? .9 : .56, ann: [
        { type: "hline", p: ex.entry, from: ex.p3.t, to: ex.exit_t, label: "進場 75,409", c: BLUE, dash: true, dy: 15 },
        { type: "steps", pts: [[ex.p3.t, ex.stop], ...ex.moves], end: ex.exit_t, c: GOLD, label: "止損 77,006", dy: -14 },
        { type: "dot", t: tw(11, 13, 7), p: 72224, label: "低於進場價", c: GOLD, dy: -18 },
        { type: "exit", t: ex.exit_t, p: ex.exit, dir: "up", label: "出場 62,179", c: INK, dy: 22 }] }
    };
  }
})();
