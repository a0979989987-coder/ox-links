/* 交易變色龍：叢林霓虹遊戲感。
   背景：WebGL 流動霓虹＋鱗片，整頁主色（--h）會慢慢變色；往下捲藤蔓會長出來、主色也跟著轉。
   互動：點一下畫面，金幣從手指位置噴出（每次 10 枚、最多 30 枚，2D canvas 物理），金光一閃，鱗片換色，右上角金幣數 +1，還有投幣聲。
   變色龍會轉頭看手指／游標。 */
(function () {
  const { P, esc, asset, icon, socials, SND, reveal, finalize, toolbar, reduce, D } = OX;
  const B = document.body, app = document.getElementById("app");
  const chest = `<svg class="box" viewBox="0 0 72 64" aria-hidden="true"><path d="M6 26h60v32a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4Z" fill="#8a4b12" stroke="#04110e" stroke-width="3"/>
    <path d="M6 26c0-12 10-20 30-20s30 8 30 20Z" fill="#b8651a" stroke="#04110e" stroke-width="3"/><path d="M6 26h60v8H6Z" fill="#ffcc33" stroke="#04110e" stroke-width="3"/>
    <path d="M30 22h12v16H30Z" fill="#ffcc33" stroke="#04110e" stroke-width="3"/><circle cx="36" cy="31" r="2.5" fill="#04110e"/>
    <path d="M18 8l3 5M36 2v6M54 8l-3 5" stroke="#fff3a0" stroke-width="3" stroke-linecap="round"/></svg>`;
  app.innerHTML = `
  <canvas id="jungle" aria-hidden="true"></canvas>
  <svg class="jg-vines" viewBox="0 0 390 844" preserveAspectRatio="none" aria-hidden="true">
    <path class="v" d="M-10 860 C 70 720 -10 620 70 520 S 30 300 110 210 S 60 60 140 -20" stroke="#8cff5a" stroke-width="4" style="color:#8cff5a"/>
    <path class="v" d="M400 860 C 320 740 400 620 320 520 S 370 300 290 220 S 350 70 270 -20" stroke="#35e0c2" stroke-width="3.4" style="color:#35e0c2"/>
    <path class="leaf" d="M70 520 q 30 -26 64 -6 q -32 26 -64 6Z" style="color:#8cff5a"/><path class="leaf" d="M110 210 q 34 -22 64 2 q -34 22 -64 -2Z" style="color:#8cff5a"/>
    <path class="leaf" d="M320 520 q -30 -26 -64 -6 q 32 26 64 6Z" style="color:#35e0c2"/><path class="leaf" d="M290 220 q -34 -22 -64 2 q 34 22 64 -2Z" style="color:#35e0c2"/>
  </svg>
  <canvas id="coins" aria-hidden="true"></canvas>
  <div class="jg-hud" aria-label="金幣"><i>₿</i><span id="cnt">0</span></div>
  <div class="jg">
    <section class="jg-hero">
      <div class="jg-pet rv"><img src="${esc(asset(P.cover || P.photo))}" alt="${esc(P.name)}"></div>
      <div class="jg-idt">
        <h1 class="jg-name rv">${esc(P.name)}</h1>
        ${P.alias ? `<span class="jg-alias rv">${esc(P.alias)}</span>` : ""}
        <p class="jg-handle rv">${esc(P.handle)}</p>
      </div>
    </section>

    <h2 class="jg-h rv">免費寶箱</h2>
    <a data-line="official" class="jg-chest rv" href="${esc(D.lineOfficial.url)}"><div class="in">
      <div class="top">${chest}<span><b>免費教材</b><small>${esc(D.lineOfficial.desc)}</small></span></div>
      <span class="go">${esc(D.lineOfficial.button)}${icon("arrow")}</span></div></a>
    <a data-line="community" class="jg-bubble rv" href="${esc(D.lineCommunity.url)}">${icon("chat")}<span><b>${esc(D.lineCommunity.title)}</b><small>LINE 社群 · 多人連線</small></span><em>加入</em></a>

    <h2 class="jg-h rv">追蹤我</h2>
    <nav class="jg-soc rv">${socials(P).map(s => `<a class="${s.k}" href="${esc(s.url)}" aria-label="${s.label}"><span>${icon(s.k)}</span><b>${s.k === "yt" ? "YouTube" : s.label}</b></a>`).join("")}</nav>

    <h2 class="jg-h rv">名片</h2>
    <div class="jg-stickers">
      ${P.alias ? `<div class="jg-st rv"><small>YouTube / Threads 名稱</small><b>${esc(P.alias)}</b></div>` : ""}
      <div class="jg-st rv"><small>Threads</small><b>${esc(P.handle)}</b></div>
    </div>

    <h2 class="jg-h rv">選擇關卡</h2>
    <div class="jg-levels">${D.tools.map((t, i) => `<a class="jg-lv rv" data-d="${i * .08}" href="${esc(t.url)}"><i>${i + 1}</i>${icon(t.icon)}<b>${esc(t.label)}</b></a>`).join("")}</div>
    <p class="jg-tip rv">點畫面任何地方收集金幣，鱗片會換顏色</p>
    <p class="jg-foot">© 2026 ${esc(P.name)} · OX.Trading</p>
  </div>
  <div class="jg-dock"><a href="${esc(D.lineOfficial.url)}"><span>${icon("line")}</span>${esc(D.lineOfficial.button)}</a></div>`;
  toolbar(); finalize(); reveal(); OX.dock(".jg-dock");

  /* ---------- 主色 ---------- */
  let hue = 168, hueTarget = 168, flash = 0, lastCss = 0;
  let lastH = -999; const setCss = t => { if (t - lastCss > 250 && Math.abs(hue - lastH) > 3) { lastCss = t; lastH = hue; B.style.setProperty("--h", hue.toFixed(0)); } };

  /* ---------- WebGL 叢林霓虹 ---------- */
  const cv = document.getElementById("jungle");
  const gl = !reduce && (cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" }) || null);
  let draw = null;
  if (gl) {
    const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const fs = `precision mediump float;uniform vec2 r;uniform float t,h,f,s;
      vec3 hsv(float h,float s,float v){vec3 k=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);return v*mix(vec3(1.),k,s);}
      float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),u=fract(p);u=u*u*(3.-2.*u);return mix(mix(hs(i),hs(i+vec2(1,0)),u.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),u.x),u.y);}
      float fb(vec2 p){float a=.5,v=0.;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
      void main(){vec2 uv=gl_FragCoord.xy/r;vec2 p=uv*vec2(r.x/r.y,1.)*2.4;p.y+=s*1.5;
        float q=fb(p+vec2(0.,t*.06));float w=fb(p*1.6+q*2.2+vec2(t*.09,-t*.04));float H=h/360.;
        vec3 c=mix(vec3(.01,.05,.04),hsv(H,.85,.32),smoothstep(.35,.9,w));
        c+=hsv(H+.14,.9,1.)*smoothstep(.025,0.,abs(w-.56))*.85;
        c+=hsv(H-.1,.9,1.)*smoothstep(.02,0.,abs(q-.62))*.45;
        vec2 g=uv*vec2(r.x/r.y,1.)*30.;g.y+=s*45.;g.x+=mod(floor(g.y),2.)*.5;vec2 cc=fract(g)-vec2(.5,.2);
        float sc=smoothstep(.55,.4,length(cc*vec2(1.,1.4)))-smoothstep(.4,.3,length(cc*vec2(1.,1.4)))*.6;
        c+=hsv(H+uv.y*.25+q*.2,.8,.35)*sc*smoothstep(.25,.8,q);
        c+=vec3(1.,.82,.3)*f*.35*(1.-length(uv-.5));
        c*=1.-.35*length(uv-vec2(.5,.6));gl_FragColor=vec4(c,1.);}`;
    const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (gl.getProgramParameter(pr, gl.LINK_STATUS)) {
      gl.useProgram(pr); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const U = k => gl.getUniformLocation(pr, k), ur = U("r"), ut = U("t"), uh = U("h"), uf = U("f"), us = U("s");
      const size = () => { const sc = .5 * Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(innerWidth * sc); cv.height = Math.round(innerHeight * sc); gl.viewport(0, 0, cv.width, cv.height); };
      size(); addEventListener("resize", size);
      draw = t => { gl.uniform2f(ur, cv.width, cv.height); gl.uniform1f(ut, t / 1000); gl.uniform1f(uh, hue); gl.uniform1f(uf, flash); gl.uniform1f(us, scrollY / innerHeight * .25); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    }
  }
  if (!draw) { cv.remove(); app.insertAdjacentHTML("afterbegin", '<div class="jg-fallback" aria-hidden="true"></div>'); }

  /* ---------- 金幣：每次點 10 枚、畫面上最多 30 枚，先畫好一張金幣圖再貼（不每格畫字），物件重複使用 ---------- */
  const cc = document.getElementById("coins"), cg = cc.getContext("2d");
  const MAX = 30, PER = 10, pool = Array.from({ length: MAX }, () => ({ life: 0 }));
  let K = 1; const csize = () => { const d = K = Math.min(devicePixelRatio || 1, 1.5); cc.width = innerWidth * d; cc.height = innerHeight * d; cg.setTransform(d, 0, 0, d, 0, 0); };
  csize(); addEventListener("resize", csize);
  const sprite = (() => { const s = document.createElement("canvas"), R = 24; s.width = s.height = R * 2 + 4; const x = s.getContext("2d");
    x.fillStyle = "#c98a00"; x.beginPath(); x.arc(R + 2, R + 4, R, 0, 7); x.fill(); x.fillStyle = "#ffcc33"; x.beginPath(); x.arc(R + 2, R + 2, R, 0, 7); x.fill();
    x.fillStyle = "#7a4d00"; x.font = `700 ${R}px sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("₿", R + 2, R + 3); return s; })();
  let live = 0;
  function drawCoins() {
    cg.clearRect(0, 0, innerWidth, innerHeight); live = 0;
    for (const c of pool) {
      if (c.life <= 0) continue; live++;
      c.vy += .45; c.x += c.vx; c.y += c.vy; c.a += c.va; c.life -= 1;
      const sx = Math.max(.08, Math.abs(Math.cos(c.a))), d = c.r * 2;
      cg.globalAlpha = Math.min(1, c.life / 20);
      cg.setTransform(K * sx, 0, 0, K, c.x * K, c.y * K); cg.drawImage(sprite, -c.r, -c.r, d, d);
    }
    cg.setTransform(K, 0, 0, K, 0, 0); cg.globalAlpha = 1;
  }
  let count = 0, lastBurst = 0; const cnt = document.getElementById("cnt"), hud = document.querySelector(".jg-hud");
  const fl = document.createElement("i"); fl.className = "jg-flash"; fl.style.display = "none"; document.body.appendChild(fl);
  function burst(x, y) {
    const now = performance.now(); if (now - lastBurst < 140) return; lastBurst = now;
    // 先用掉已經結束的，沒有就覆蓋最快結束的那幾枚
    const order = pool.slice().sort((p, q) => p.life - q.life);
    for (let i = 0; i < PER; i++) Object.assign(order[i], { x, y, vx: (Math.random() - .5) * 8, vy: -6 - Math.random() * 7, r: 9 + Math.random() * 5, a: Math.random() * 6, va: .15 + Math.random() * .2, life: 60 + Math.random() * 25 });
    fl.style.display = "none"; fl.style.left = x + "px"; fl.style.top = y + "px"; void fl.offsetWidth; fl.style.display = "";
    count++; cnt.textContent = count; hud.classList.remove("bump"); void hud.offsetWidth; hud.classList.add("bump");
    flash = 1; hueTarget += 55 + Math.random() * 40;
    SND.tone(988, .08, "square", .07); setTimeout(() => SND.tone(1319, .3, "square", .07), 70);
  }

  /* ---------- 迴圈：只在畫面看得到時跑，約 40fps ---------- */
  let lastT = 0, run = true, auto = 0;
  function loop(t) {
    if (!run) return;
    requestAnimationFrame(loop);
    if (t - lastT < 24) return; lastT = t;
    auto += .02; hue += (hueTarget + auto - hue) * .06; flash *= .9;
    if (draw) draw(t);
    if (live || pool.some(c => c.life > 0)) drawCoins(); else if (cc._had) { cg.clearRect(0, 0, innerWidth, innerHeight); }
    cc._had = live > 0;
    setCss(t);
  }
  if (!reduce) requestAnimationFrame(loop); else if (draw) draw(0);
  document.addEventListener("visibilitychange", () => { run = !document.hidden; if (run && !reduce) requestAnimationFrame(loop); });

  /* ---------- 捲動：藤蔓長出來、主色轉 ---------- */
  const vines = document.querySelector(".jg-vines");
  const onScroll = OX.raf(() => {
    const p = Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
    vines.style.setProperty("--grow", (.25 + p * .75).toFixed(3)); vines.style.setProperty("--leaf", p > .15 ? 1 : 0);
    hueTarget = 168 + p * 120 + (hueTarget - 168) % 360 * 0;
  });
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- 變色龍看手指 ---------- */
  const pet = document.querySelector(".jg-pet img");
  addEventListener("pointermove", OX.raf(e => { const r = pet.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2); pet.style.setProperty("--rot", Math.max(-14, Math.min(14, dx / 14)) + "deg"); }), { passive: true });
  addEventListener("pointerdown", e => { if (reduce) return; burst(e.clientX, e.clientY); }, { passive: true });

})();
