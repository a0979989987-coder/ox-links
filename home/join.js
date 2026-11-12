/* 註冊流程（四步）和說明頁（註冊教學、常見問題）。蓋滿整個畫面的黑底頁，用網址的 # 記住在哪一步：
   #join 選老師、#join/<老師> 註冊交易所、#join/<老師>/uid 填 UID、#join/done 等審核、#guide、#faq。
   老師可以把 #join/<自己的代號> 直接掛在自己的連結頁，訪客就跳過「選老師」。
   表單送到 data.js 的 api（Apps Script，見 backend/）。api 留空時流程走得完，但資料不會送出，等待頁會寫明。 */
(function () {
  "use strict";
  const HM = window.OXHOME; if (!HM) return;
  const { D, $, $$, esc, asset, icon, lineIcon, chatIcon, logoHTML, cardArt, watchCard, teacher, say, SND, reduce, fx } = HM;
  const B = document.body, F = D.flow, EX = D.exchanges, joiners = D.teachers.filter(t => t.join);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // 這一次瀏覽的選擇記在 sessionStorage，送出過的申請記在 localStorage（第二個參數傳 true）；隱私模式拿不到就當沒有
  const box = long => { try { return long ? localStorage : sessionStorage; } catch (e) { return null; } };
  const store = { get(k, long) { try { return JSON.parse(box(long).getItem(k) || "null"); } catch (e) { return null; } }, set(k, v, long) { try { v == null ? box(long).removeItem(k) : box(long).setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const sel = Object.assign({ teacher: "", picked: "", exchange: "", went: {} }, store.get("ox-join") || {});
  const keep = () => store.set("ox-join", sel);
  // IG、Threads、LINE、FB 裡面開的網頁，Google 不給登入
  const inApp = /Line\/|FBAN|FBAV|Instagram|Barcelona|Threads|MicroMessenger/i.test(navigator.userAgent);

  B.insertAdjacentHTML("beforeend", `<div class="oh-flow" id="oh-flow" role="dialog" aria-modal="true" aria-hidden="true"><div class="oh-fin">
    <div class="oh-fhead"><button type="button" class="oh-round" data-fback aria-label="上一步">${icon("back")}</button><b data-ftitle></b><button type="button" class="oh-round" data-fclose aria-label="關掉，回到首頁"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <ol class="oh-steps" data-fsteps>${F.steps.map((s, i) => `<li data-n="${i + 1}">${esc(s)}</li>`).join("")}</ol>
    <div data-fpane></div>
  </div></div>`);
  const flow = $("#oh-flow"), pane = $("[data-fpane]", flow), stepsEl = $("[data-fsteps]", flow), titleEl = $("[data-ftitle]", flow);

  // ---------- 流程頁的背景：慢慢往上飄的金色微塵；送出成功時從申請卡後面爆開一圈 ----------
  const fbg = document.createElement("canvas"); fbg.className = "oh-fbg"; fbg.setAttribute("aria-hidden", "true"); flow.insertBefore(fbg, flow.firstChild);
  const dust = [], sparks = []; let fraf = 0, flast = 0;
  const TINT = ["227,196,126", "255,241,201", "227,196,126", "35,166,234"];
  function fbgLoop(now) {
    fraf = 0; if (!B.classList.contains("flow-open") || document.hidden) return;
    const dt = Math.min(.05, (now - flast) / 1000 || 0); flast = now;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
    if (fbg.width !== Math.round(W * dpr) || fbg.height !== Math.round(H * dpr)) { fbg.width = Math.round(W * dpr); fbg.height = Math.round(H * dpr); }
    const g = fbg.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.globalCompositeOperation = "lighter";
    while (dust.length < 44) dust.push({ x: Math.random() * W, y: Math.random() * H, vy: 5 + Math.random() * 14, r: .6 + Math.random() * 1.3, a: .12 + Math.random() * .34, ph: Math.random() * 6, c: TINT[Math.floor(Math.random() * TINT.length)] });
    for (const d of dust) {
      d.y -= d.vy * dt; d.x += Math.sin(now / 1400 + d.ph) * 4 * dt; if (d.y < -6) { d.y = H + 6; d.x = Math.random() * W; }
      g.fillStyle = `rgba(${d.c},${(d.a * (.6 + .4 * Math.sin(now / 900 + d.ph))).toFixed(3)})`; g.beginPath(); g.arc(d.x, d.y, d.r, 0, 6.2832); g.fill();
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.t += dt; if (s.t > s.l) { sparks.splice(i, 1); continue; }
      s.vy += 240 * dt; s.vx *= 1 - 1.2 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      g.fillStyle = `rgba(${s.c},${(1 - s.t / s.l).toFixed(3)})`; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.2832); g.fill();
    }
    g.globalCompositeOperation = "source-over";
    fraf = requestAnimationFrame(fbgLoop);
  }
  const fbgStart = () => { if (!reduce && !fraf) { flast = performance.now(); fraf = requestAnimationFrame(fbgLoop); } };
  function burst(el) {
    if (reduce || !el) return; const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < 150; i++) { const a = Math.random() * 6.2832, sp = 90 + Math.random() * 460; sparks.push({ x: cx + Math.cos(a) * r.width * .3, y: cy + Math.sin(a) * r.height * .3, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 140, r: .8 + Math.random() * 2.2, t: 0, l: .9 + Math.random() * 1.3, c: TINT[Math.floor(Math.random() * TINT.length)] }); }
  }

  // ---------- 小零件 ----------
  const exNames = t => Object.keys(t.join).filter(k => EX[k]);
  const uidHTML = ids => ids.map(id => { const e = EX[id]; return `<div class="oh-uid"><h4><img src="${esc(asset(e.logo))}" alt="">${esc(e.name)}</h4><ol>${e.uid.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
    <div class="oh-phone" aria-hidden="true" style="--r:${id === "bitget" ? "9px" : "50%"}"><i></i><u></u><b>UID 1234567890</b></div></div>`; }).join("");
  const ruleBox = () => `<div class="oh-frule"><h3>拿到進階教材的條件</h3><p>${esc(D.member.rule)}</p><small>${esc(D.member.ruleNote)}</small></div>`;
  const lineBtns = () => `<div class="oh-two"><a class="oh-btn line" href="${esc(D.line.community.url)}" target="_blank" rel="noopener">加入 LINE 社群</a><a class="oh-btn line" href="${esc(D.line.official.url)}" target="_blank" rel="noopener">加 LINE 官方</a></div>`;

  // ---------- 每一頁 ----------
  const PAGES = {
    // 第一步：你是看誰的內容來的？
    pick() {
      return { step: 1, title: "註冊成為 OX 會員", html: `<h2 class="oh-ask" id="oh-ask">${esc(F.askTitle)}</h2><p class="oh-asknote">${esc(F.askNote)}</p>
        <div class="oh-opts">${joiners.map((t, i) => `<button type="button" class="oh-opt" data-pick="${esc(t.id)}" aria-pressed="${sel.picked === t.id}" style="--c:${esc(t.color)};--i:${i}"><img src="${esc(asset(t.avatar))}" alt="" width="60" height="60"><b>${esc(t.name)}</b></button>`).join("")}</div>
        <button type="button" class="oh-none" data-pick="none" aria-pressed="${sel.picked === "none"}" style="--i:${joiners.length}">${esc(F.none)}</button>${ruleBox()}` };
    },
    // 第二步：那位老師的 BG／BX 按鈕、交易所介紹、註冊介紹
    ex(t) {
      const ids = exNames(t);
      return { step: 2, title: "註冊交易所", html: `<div class="oh-who" style="--c:${esc(t.color)}"><img src="${esc(asset(t.avatar))}" alt="" width="76" height="76"><b>${esc(t.name)}</b><small>用他的連結註冊</small></div>
        <div class="oh-exs">${ids.map(id => { const e = EX[id]; return `<a class="oh-ex${sel.went[t.id + id] ? " went" : ""}" href="${esc(t.join[id])}" target="_blank" rel="noopener" data-ex="${id}"><img src="${esc(asset(e.logo))}" alt="" width="54" height="54"><span><b>${esc(e.name)}</b><small>${esc(e.intro)}</small></span><span class="cta">註冊 ${esc(e.name)}${icon("out")}</span></a>`; }).join("")}</div>
        <ol class="oh-how">${F.how.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
        <p class="oh-warn">${esc(F.oldAccount)}</p>
        <button type="button" class="oh-btn${Object.keys(sel.went).some(k => k.indexOf(t.id) === 0) ? " pulse" : ""}" data-next="uid">我註冊好了，去填 UID${icon("arrow")}</button>${ruleBox()}` };
    },
    // 第三步：填 UID
    uid(t) {
      const ids = exNames(t), ex = ids.includes(sel.exchange) ? sel.exchange : ids[0], d = store.get("ox-draft") || {};
      const chips = (name, list, multi) => `<div class="oh-chips" data-chips="${name}"${multi ? " data-multi" : ""}>${list.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${multi ? (d[name] || []).includes(v) : d[name] === v}">${esc(l)}</button>`).join("")}</div>`;
      return { step: 3, title: "填 UID", html: `<h2 class="oh-ask">填你的 UID</h2><p class="oh-asknote">註冊完就可以先填，KYC 和入金之後再補。</p>
        <form class="oh-form" novalidate autocomplete="on">
          <div class="oh-fld"><div class="lb">老師</div><div class="oh-seg"><button type="button" aria-pressed="true" disabled><img src="${esc(asset(t.avatar))}" alt="" style="border-radius:50%">${esc(t.name)}</button></div></div>
          <div class="oh-fld"><div class="lb">交易所</div><div class="oh-seg" data-seg="exchange">${ids.map(id => `<button type="button" data-v="${id}" aria-pressed="${id === ex}"><img src="${esc(asset(EX[id].logo))}" alt="">${esc(EX[id].name)}</button>`).join("")}</div></div>
          <div class="oh-fld" data-f="uid"><label for="f-uid">UID</label><input id="f-uid" name="uid" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="20" placeholder="只有數字" value="${esc(d.uid || "")}"><p class="err">UID 只有數字，通常是 8 到 12 碼。再對一次。</p>
            <details class="oh-help"><summary>UID 在哪裡看</summary>${uidHTML(ids)}</details></div>
          <div class="oh-fld" data-f="email"><label for="f-email">信箱</label><input id="f-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" maxlength="120" placeholder="name@gmail.com" value="${esc(d.email || "")}"><p class="err">信箱格式不對，再看一次。</p><button type="button" class="fix" data-fix hidden></button>
            <p class="hint">填你之後登入 OX 加密要用的信箱，教材也寄到這裡。</p><div data-google></div></div>
          <div class="oh-fld"><label for="f-line">LINE 名稱<u>選填</u></label><input id="f-line" name="line" type="text" autocomplete="off" maxlength="40" placeholder="進社群後對得到人" value="${esc(d.line || "")}"></div>
          <div class="oh-fld"><label for="f-name">怎麼稱呼你<u>選填</u></label><input id="f-name" name="name" type="text" autocomplete="nickname" maxlength="40" value="${esc(d.name || "")}"></div>
          <div class="oh-fld"><div class="lb">交易經驗<u>選填</u></div>${chips("exp", F.exp, false)}</div>
          <div class="oh-fld"><div class="lb">最想學什麼<u>選填，可複選</u></div>${chips("learn", F.learn, true)}</div>
          <label class="oh-check" data-f="agree"><input type="checkbox" name="agree"><i>${icon("check")}</i><span>${esc(F.agree)}</span></label>
          <label class="oh-hp" aria-hidden="true">請不要填這一格<input type="text" name="ox-extra" tabindex="-1" autocomplete="off" inputmode="none"></label>
          <button type="submit" class="oh-btn gold">送出${icon("arrow")}</button>
          <p class="oh-priv">${esc(F.privacy)}</p>
        </form>` };
    },
    // 第四步：等審核。申請卡是一張小的黑卡
    done() {
      const a = store.get("ox-apply", true); if (!a) return PAGES.pick();
      const t = teacher(a.teacher) || joiners[0], e = EX[a.exchange] || {}, when = new Date(a.at);
      const ts = `${when.getFullYear()}/${String(when.getMonth() + 1).padStart(2, "0")}/${String(when.getDate()).padStart(2, "0")}`;
      return { step: 4, title: "等審核", html: `<div class="oh-done"><h2>收到了</h2><p>${a.name ? esc(a.name) + "，" : ""}這是你的申請卡，可以截圖留著。</p>
        <div class="oh-mycard"><span class="oh-card" data-card><span class="oh-card-art" aria-hidden="true">${cardArt()}</span><span class="oh-card-sheen" aria-hidden="true"></span>
          <span class="oh-card-top"><span class="oh-logo">${logoHTML()}</span><em>OX Trading</em><i>MEMBER</i></span>
          <span class="oh-card-meta"><span>${esc(e.name || "")} UID •••• ${esc(a.uid4)}</span><span>${esc(ts)}</span></span>
          <strong class="oh-card-title">${esc(a.name || t.name)}</strong><span class="oh-card-state">審核中</span></span></div>
        <ul class="oh-conds"><li class="ok"><i>${icon("check")}</i>${esc(D.member.conds[0])}<u>已填 UID</u></li><li><i>2</i>${esc(D.member.conds[1])}<u>系統核對</u></li><li><i>3</i>${esc(D.member.conds[2])}<u>系統核對</u></li></ul>
        <p class="oh-say">${esc(D.member.ruleNote)}<small>達標後，進階教材會寄到你填的信箱。</small></p>
        ${a.demo ? `<p class="oh-demo">樣張：後台還沒接上，這筆資料沒有送出去，只存在你這支手機裡。接好之後這行字會消失。</p>` : ""}
        ${a.dup ? `<p class="oh-warn" style="text-align:left">這個 UID 之前送過了，信箱照第一次填的留著。要改信箱，到 LINE 官方跟我們說。</p>` : ""}
        ${lineBtns()}<p class="oh-priv" style="margin-top:16px">有問題到 LINE 官方問，把這張卡截圖傳過來。${a.id && !a.demo ? `申請編號 ${esc(a.id)}` : ""}</p>
        <button type="button" class="oh-btn ghost" data-again>換一個帳號重新申請</button></div>` };
    },
    guide() {
      return { step: 0, title: "註冊教學", html: `<div class="oh-doc"><h2>怎麼成為 OX 會員</h2>
        <ol class="oh-how"><li>選一位老師。你是看誰的內容來的，就選誰。</li>${F.how.map(s => `<li>${esc(s)}</li>`).join("")}<li>${esc(D.member.ruleNote)}。達標後，進階教材寄到你填的信箱。</li></ol>
        <p class="oh-warn">${esc(F.oldAccount)}</p>
        <h3>UID 在哪裡看</h3><div class="oh-help" style="margin-top:12px">${uidHTML(Object.keys(EX))}</div>
        <button type="button" class="oh-btn gold" data-open="join">開始註冊${icon("arrow")}</button></div>` };
    },
    faq() {
      return { step: 0, title: "常見問題", html: `<div class="oh-doc"><h2>常見問題</h2><div class="oh-qas">${D.faq.map(q => `<details class="oh-qa"><summary>${esc(q.q)}</summary>${q.uid ? uidHTML(Object.keys(EX)) : `<p>${esc(q.a)}</p>`}</details>`).join("")}</div>
        <a class="oh-btn line" href="${esc(D.line.official.url)}" target="_blank" rel="noopener">還有問題，到 LINE 官方問</a>
        <button type="button" class="oh-btn ghost" data-open="join">開始註冊</button></div>` };
    }
  };

  // ---------- 網址 ↔ 頁面 ----------
  function parse(hash) {
    const p = String(hash || "").replace(/^#/, "").split("/");
    if (p[0] === "guide" || p[0] === "faq") return { page: p[0] };
    if (p[0] !== "join") return null;
    if (p[1] === "done") return { page: "done" };
    const t = joiners.find(x => x.id === p[1]);
    if (!t) return { page: "pick" };
    return { page: p[2] === "uid" ? "uid" : "ex", t };
  }
  const ORDER = { pick: 1, ex: 2, uid: 3, done: 4, guide: 0, faq: 0 };
  let cur = null, depth = 0;
  function render(r, back) {
    // 從老師的專屬連結直接進來的，「訪客選的」就記那位老師；之前在這支手機選過別人的不算。選「都不是」走到預設老師的照舊記「都不是」
    if (r.t) { sel.teacher = r.t.id; if (!(sel.picked === "none" && r.t.id === F.noneTeacher)) sel.picked = r.t.id; keep(); }
    const pg = PAGES[r.page](r.t);
    titleEl.textContent = pg.title;
    stepsEl.hidden = !pg.step;
    $$("li", stepsEl).forEach((li, i) => { li.classList.toggle("cur", i + 1 === pg.step); li.classList.toggle("ok", i + 1 < pg.step); });
    pane.innerHTML = `<div class="oh-pane${back ? " back" : ""}">${pg.html}</div>`;
    flow.scrollTop = 0; cur = r;
    $$("[data-card]", pane).forEach(watchCard);
    if (r.page === "uid") wireForm(r.t);
    if (r.page === "done" && !back) setTimeout(() => { SND.chime(); burst($(".oh-mycard", pane)); }, 300);
    fbgStart();
  }
  function go(hash, replace) {
    const r = parse(hash); if (!r) return;
    const back = cur && ORDER[r.page] < ORDER[cur.page];
    try { replace ? history.replaceState({ ox: 1 }, "", hash) : (history.pushState({ ox: 1 }, "", hash), depth++); } catch (e) {}
    render(r, back);
  }

  // ---------- 開、關 ----------
  let busy = false;
  async function open(what, cardEl) {
    if (busy) return;
    const hash = what === "guide" || what === "faq" ? "#" + what : store.get("ox-apply", true) ? "#join/done" : "#join";
    if (B.classList.contains("flow-open")) { go(hash); return; }
    busy = true; B.classList.add("flow-open");
    const r = cardEl ? cardEl.getBoundingClientRect() : null, seen = r && r.bottom > 40 && r.top < innerHeight - 40;
    if (seen && !reduce) {
      // 第一頁的黑卡：整個星系先被吸進卡片；然後卡片打開變成整頁
      if (cardEl.closest(".oh-hero") && fx().ok && !B.classList.contains("w-light")) { SND.swell(.62); B.classList.add("sucking"); await Promise.race([fx().suck(true), wait(1100)]); }
      else SND.whoosh(.4, .07, true);
      const p = document.createElement("div"); p.className = "oh-portal";
      const from = { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", borderRadius: getComputedStyle(cardEl).borderRadius };
      Object.assign(p.style, from); B.appendChild(p);
      const an = p.animate([from, { left: "0px", top: "0px", width: innerWidth + "px", height: innerHeight + "px", borderRadius: "0px" }], { duration: 430, easing: "cubic-bezier(.6,.05,.2,1)", fill: "forwards" });
      await Promise.race([an.finished, wait(600)]);
      go(hash); flow.classList.add("on"); await wait(120); p.remove(); B.classList.remove("sucking");
    } else { SND.whoosh(.4, .07, true); go(hash); flow.classList.add("on"); }
    flow.setAttribute("aria-hidden", "false");
    fx().pause && fx().pause(true);
    busy = false;
  }
  function hide() {
    if (!B.classList.contains("flow-open")) return;
    if (flow.contains(document.activeElement)) document.activeElement.blur();      // 藏起來之前先把焦點放掉
    flow.classList.remove("on"); flow.setAttribute("aria-hidden", "true"); B.classList.remove("flow-open");
    fx().pause && fx().pause(false); fx().suck && fx().suck(false);
    SND.whoosh(.36, .05, false); cur = null; depth = 0;
  }
  function close() {
    if (depth > 0) { const n = depth; depth = 0; try { history.go(-n); return; } catch (e) {} }
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    hide();
  }
  addEventListener("popstate", () => {
    const r = parse(location.hash);
    if (!r) { hide(); return; }
    if (depth > 0) depth--;
    if (!B.classList.contains("flow-open")) { B.classList.add("flow-open"); flow.classList.add("on"); flow.setAttribute("aria-hidden", "false"); fx().pause && fx().pause(true); }
    render(r, true);
  });
  addEventListener("keydown", e => { if (e.key === "Escape" && B.classList.contains("flow-open") && !B.classList.contains("dr-open")) close(); });

  // ---------- 點擊 ----------
  flow.addEventListener("click", e => {
    const q = s => e.target.closest(s);
    if (q("[data-fclose]")) { close(); return; }
    if (q("[data-fback]")) { if (depth > 0) history.back(); else if (cur && cur.page !== "pick" && ORDER[cur.page] > 1 && cur.page !== "done") go(cur.page === "uid" ? "#join/" + cur.t.id : "#join", true); else close(); return; }
    let el;
    if ((el = q("[data-pick]"))) {
      $$("[data-pick]", pane).forEach(x => x.setAttribute("aria-pressed", x === el ? "true" : "false"));
      sel.picked = el.dataset.pick; sel.teacher = sel.picked === "none" ? F.noneTeacher : sel.picked; sel.exchange = ""; keep();
      SND.tick(820); setTimeout(() => go("#join/" + sel.teacher), 260); return;
    }
    if ((el = q("[data-ex]"))) {      // 連結本身照常開新分頁；這裡只記住他點了哪一家
      sel.exchange = el.dataset.ex; sel.went[cur.t.id + sel.exchange] = 1; keep(); el.classList.add("went");
      const nx = $("[data-next]", pane); nx && nx.classList.add("pulse"); SND.tick(740); return;
    }
    if ((el = q("[data-next]"))) { SND.tick(820); go("#join/" + cur.t.id + "/uid"); return; }
    if ((el = q("[data-again]"))) { store.set("ox-apply", null, true); store.set("ox-draft", null); sel.picked = sel.teacher = sel.exchange = ""; sel.went = {}; keep(); go("#join"); return; }
    if ((el = q("[data-seg] button"))) { $$("button", el.parentNode).forEach(x => x.setAttribute("aria-pressed", x === el ? "true" : "false")); sel.exchange = el.dataset.v; keep(); SND.tick(700); return; }
    if ((el = q("[data-chips] button"))) {
      const box = el.parentNode, on = el.getAttribute("aria-pressed") === "true";
      if (!box.hasAttribute("data-multi")) $$("button", box).forEach(x => x.setAttribute("aria-pressed", "false"));
      el.setAttribute("aria-pressed", on ? "false" : "true"); SND.tick(700); draft(); return;
    }
    if ((el = q("[data-fix]"))) { const em = $("#f-email"); em.value = el.dataset.fix; el.hidden = true; check("email"); draft(); }
  });

  // ---------- 表單 ----------
  const TYPO = { "gmial.com": "gmail.com", "gamil.com": "gmail.com", "gmai.com": "gmail.com", "gmail.con": "gmail.com", "gmail.co": "gmail.com", "gmaill.com": "gmail.com", "gnail.com": "gmail.com", "gmail.com.tw": "gmail.com", "hotmial.com": "hotmail.com", "hotmail.con": "hotmail.com", "yaho.com.tw": "yahoo.com.tw", "yahoo.con.tw": "yahoo.com.tw", "yahoo.com.te": "yahoo.com.tw", "icloud.con": "icloud.com", "outlook.con": "outlook.com" };
  const val = n => { const el = $(`[name="${n}"]`, pane); return el ? el.value.trim() : ""; };
  const picked = n => $$(`[data-chips="${n}"] button[aria-pressed="true"]`, pane).map(b => b.dataset.v);
  const RULE = { uid: v => /^\d{5,20}$/.test(v), email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 120 };
  function check(n) { const box = $(`[data-f="${n}"]`, pane), ok = RULE[n](val(n)); box && box.classList.toggle("bad", !ok); return ok; }
  function draft() { store.set("ox-draft", { uid: val("uid"), email: val("email"), line: val("line"), name: val("name"), exp: picked("exp")[0] || "", learn: picked("learn") }); }
  let opened = 0, credential = "";
  function wireForm(t) {
    const form = $("form", pane); opened = Date.now(); credential = "";
    const uid = $("#f-uid"), em = $("#f-email"), fix = $("[data-fix]", pane);
    uid.addEventListener("input", () => { const v = uid.value.replace(/\D+/g, ""); if (v !== uid.value) uid.value = v; if ($('[data-f="uid"]', pane).classList.contains("bad")) check("uid"); draft(); });
    uid.addEventListener("blur", () => uid.value && check("uid"));
    em.addEventListener("input", () => { if ($('[data-f="email"]', pane).classList.contains("bad")) check("email"); fix.hidden = true; credential = ""; draft(); });
    em.addEventListener("blur", () => {
      if (!em.value) return; check("email");
      const m = em.value.trim().toLowerCase().match(/^(.+)@(.+)$/), to = m && TYPO[m[2]];
      if (to) { fix.dataset.fix = m[1] + "@" + to; fix.innerHTML = `你是不是要打 <b>${esc(m[1] + "@" + to)}</b>？點這裡改`; fix.hidden = false; }
    });
    $$('[name="line"],[name="name"]', pane).forEach(i => i.addEventListener("input", draft));
    $('[name="agree"]', pane).addEventListener("change", e => $('[data-f="agree"]', pane).classList.toggle("bad", !e.target.checked));
    googleFill(em);
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const okU = check("uid"), okE = check("email"), ag = $('[name="agree"]', pane).checked;
      $('[data-f="agree"]', pane).classList.toggle("bad", !ag);
      if (!okU || !okE || !ag) { const bad = $(".bad", pane); bad && bad.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); SND.tick(300, .07); return; }
      const btn = $('button[type="submit"]', form), ids = exNames(t), ex = ids.includes(sel.exchange) ? sel.exchange : ids[0];
      const data = { v: 1, teacher: t.id, picked: sel.picked || t.id, exchange: ex, uid: val("uid"), email: val("email").toLowerCase(), line: val("line"), name: val("name"), exp: picked("exp")[0] || "", learn: picked("learn"), agree: true, credential, hp: val("ox-extra"), ms: 0, page: location.origin + location.pathname, ua: navigator.userAgent.slice(0, 200) };
      btn.disabled = true; btn.classList.add("oh-sending"); btn.innerHTML = `送出中${icon("spin")}`;
      // 後台把開不到 2.5 秒就送出的當成機器人，會回成功但不存。草稿自動帶回來的人可能按得很快，這裡等滿 3 秒再送
      const early = 3000 - (Date.now() - opened); if (D.api && early > 0) await wait(early);
      data.ms = Date.now() - opened;
      let res;
      try { res = await send(data); } catch (err) { res = { ok: false, msg: "送不出去，可能是網路斷了。等一下再按一次。" }; }
      // 後台把這一筆當成機器人時會回成功，但編號流水號是 9 開頭，其實沒有存。多半是自動填入工具填了藏起來的那一格：清掉，請他再按一次
      if (res && res.ok && /-9\d{3}$/.test(res.id || "")) { const hp = $('[name="ox-extra"]', pane); if (hp) hp.value = ""; res = { ok: false, msg: "這一筆沒有送成功，請再按一次送出。" }; }
      if (!res || !res.ok) { btn.disabled = false; btn.classList.remove("oh-sending"); btn.innerHTML = `送出${icon("arrow")}`; say((res && res.msg) || "送不出去，等一下再試一次。", 3600); SND.tick(300, .07); return; }
      store.set("ox-apply", { id: res.id || "", teacher: t.id, exchange: ex, uid4: data.uid.slice(-4), name: data.name, at: Date.now(), demo: !!res.demo, dup: !!res.dup }, true);
      store.set("ox-draft", null);
      fx().burst && fx().burst();
      go("#join/done", true);
    });
  }
  async function send(data) {
    if (!D.api) { await wait(700); return { ok: true, id: "", demo: true }; }      // 後台還沒接：走得完，但不送
    const ctl = "AbortController" in window ? new AbortController() : null, timer = setTimeout(() => ctl && ctl.abort(), 20000);
    try {
      const r = await fetch(D.api, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data), redirect: "follow", signal: ctl ? ctl.signal : undefined });
      return await r.json();
    } finally { clearTimeout(timer); }
  }
  // 「用 Google 帶入」：有設定用戶端 ID、而且不是在 IG／Threads／LINE 裡面才出現
  let gsi = null;
  function googleFill(em) {
    const box = $("[data-google]", pane); if (!box || !D.googleClientId || inApp) return;
    const ready = () => {
      try {
        window.google.accounts.id.initialize({ client_id: D.googleClientId, auto_select: false, callback: r => {
          try { const p = JSON.parse(decodeURIComponent(escape(atob(r.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))))); if (p.email) { em.value = p.email; credential = r.credential; check("email"); draft(); say("已帶入 " + p.email); } } catch (e) {}
        } });
        window.google.accounts.id.renderButton(box, { theme: "outline", size: "large", shape: "pill", text: "continue_with", locale: "zh-TW", width: Math.min(400, box.clientWidth || 320) });
        box.style.marginTop = "10px";
      } catch (e) {}
    };
    if (window.google && window.google.accounts) return ready();
    if (!gsi) { gsi = document.createElement("script"); gsi.src = "https://accounts.google.com/gsi/client"; gsi.async = true; document.head.appendChild(gsi); }
    gsi.addEventListener("load", ready);
  }

  // 直接開在某一步的網址（老師的專屬連結、重新整理）
  if (parse(location.hash)) { B.classList.add("flow-open"); flow.classList.add("on"); flow.setAttribute("aria-hidden", "false"); render(parse(location.hash)); addEventListener("load", () => fx().pause && fx().pause(true)); }

  window.OXJOIN = { open, close, go };
})();
