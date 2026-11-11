/* 四位創作者的整頁場景與互動。
   scene()：回傳鋪滿整頁背景的 HTML（放進 .scene）。
   start(body)：開場結束後執行一次。
   act(body, e)：手指碰到畫面（或滑鼠滑過主要區塊）時執行。 */
(function () {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const f = (n, d = 0) => n.toFixed(d);
  function replay(el, cls, ms) {
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    if (ms) { clearTimeout(el["_t" + cls]); el["_t" + cls] = setTimeout(() => el.classList.remove(cls), ms); }
  }

  window.OX_THEMES = {
    /* 阿聖聊交易：暗紅交易室 */
    snr: {
      scene() {
        let ks = "";
        for (let i = 0; i < 22; i++) {
          const up = Math.random() > .35, h = 18 + i * 3.4 + rnd(-8, 8);
          ks += `<span class="k" style="--i:${i};--h:${f(Math.min(h, 98))}%;--bt:${f(rnd(6, 20))}%;--bb:${f(rnd(6, 20))}%;--c:${up ? "#ff5a4e" : "#e6c274"}"><b></b></span>`;
        }
        const lines = [["18%", "R2 壓力"], ["34%", "R1 壓力"], ["62%", "S1 支撐"], ["80%", "S2 支撐"]].map(([t, l]) => `<i style="top:${t}" data-l="${l}"></i>`).join("");
        const tick = "SNR  支撐  壓力  ICT  ORDER BLOCK  FVG  BTC  ETH  ";
        return `<div class="snr-grid"></div><div class="snr-key"></div><div class="snr-lines">${lines}</div><div class="snr-ks">${ks}</div>
          <div class="snr-ticker">${tick.repeat(8)}</div><div class="snr-mag">TRADING ROOM · SNR</div>`;
      },
      start(b) { replay(b, "grown"); setTimeout(() => replay(b, "flash", 1700), 500); },
      act(b) { replay(b, "grown"); replay(b, "flash", 1700); }
    },

    /* 老承：冷調黑灰，白光慢慢掃過 */
    mono: {
      scene() {
        let ks = "";
        for (let i = 0; i < 16; i++) ks += `<i style="--h:${f(20 + Math.abs(Math.sin(i * .7)) * 60 + rnd(0, 18))}%"></i>`;
        return `<div class="mono-brush"></div><div class="mono-hair" style="top:24%"></div><div class="mono-hair" style="top:61%;opacity:.5"></div><div class="mono-ks">${ks}</div>`;
      },
      start(b) { setTimeout(() => replay(b, "flash", 2300), 250); },
      act(b) { if (!b.classList.contains("flash")) replay(b, "flash", 2300); }
    },

    /* 交易變色龍：叢林霓虹 */
    jungle: {
      scene() {
        const vines = `<svg class="jg-vines" viewBox="0 0 390 844" preserveAspectRatio="none">
          <path d="M-20 820 C 60 700, 10 600, 90 500 S 60 300, 140 200 S 120 40, 200 -20" stroke="#35e0c2" stroke-width="2.4" opacity=".55"/>
          <path d="M410 760 C 330 660, 380 560, 300 470 S 340 260, 260 170 S 300 30, 240 -20" stroke="#8cff5a" stroke-width="2" opacity=".45" style="animation-duration:4.4s"/>
          <path d="M-20 300 C 80 340, 120 260, 200 330 S 330 420, 410 360" stroke="#2dd4ff" stroke-width="1.4" opacity=".35" style="animation-duration:5.2s"/>
          <path class="leaf" d="M90 500 q 30 -30 60 -10 q -30 30 -60 10Z"/><path class="leaf" d="M140 200 q -36 -20 -60 6 q 36 20 60 -6Z"/>
          <path class="leaf" d="M300 470 q -30 -30 -62 -8 q 30 30 62 8Z"/><path class="leaf" d="M260 170 q 34 -24 62 0 q -34 24 -62 0Z"/>
        </svg>`;
        const cs = ["#9dffe9", "#8cff5a", "#ffd76a", "#2dd4ff"];
        let dots = "";
        for (let i = 0; i < 22; i++) dots += `<i class="jg-dot" style="--x:${f(rnd(0, 100))}%;--t:${f(rnd(6, 11), 1)}s;--d:-${f(rnd(0, 11), 1)}s;--dx:${f(rnd(-50, 50))}px;--c:${cs[i % 4]}"></i>`;
        return `<div class="jg-scale s0 on"></div><div class="jg-scale s1"></div><div class="jg-scale s2"></div><div class="jg-scale s3"></div>${vines}${dots}`;
      },
      shift(b) {
        const ls = b.querySelectorAll(".jg-scale"); b._si = b._si || 0;
        ls[b._si].classList.remove("on"); b._si = (b._si + 1) % ls.length; ls[b._si].classList.add("on");
      },
      start(b) { const t = this; setInterval(() => { if (!document.hidden) t.shift(b); }, 3200); },
      act(b, e) {
        const c = document.createElement("i"); c.className = "jg-coin";
        c.style.left = (e ? e.clientX : innerWidth / 2) + "px"; c.style.top = (e ? e.clientY : innerHeight / 3) + "px";
        b.querySelector(".overlay").appendChild(c); setTimeout(() => c.remove(), 950);
        replay(b, "flash", 600); this.shift(b);
      }
    },

    /* Lucas：紫金夜景 */
    night: {
      scene() {
        const cs = ["rgba(214,168,255,.9)", "rgba(255,217,138,.9)", "rgba(255,255,255,.8)", "rgba(255,150,220,.8)"];
        let bk = "";
        for (let i = 0; i < 22; i++) bk += `<i class="nt-bk" style="--x:${f(rnd(-5, 95))}%;--y:${f(rnd(-5, 75))}%;--s:${f(rnd(18, 70))}px;--c:${cs[i % 4]};--t:${f(rnd(3, 7), 1)}s;--d:-${f(rnd(0, 6), 1)}s;--dx:${f(rnd(-30, 30))}px;--dy:${f(rnd(-24, 14))}px"></i>`;
        const arch = `<svg class="nt-arch" viewBox="0 0 390 600" preserveAspectRatio="none">
          <path d="M-20 600 Q 195 40 410 600" stroke="#ffd98a" stroke-width="3.4"/>
          <path d="M20 600 Q 195 120 370 600" stroke="#d6a8ff" stroke-width="2.6" style="animation-duration:1.9s"/>
          <path d="M60 600 Q 195 200 330 600" stroke="#ffd98a" stroke-width="2" opacity=".6" style="animation-duration:2.4s"/></svg>`;
        const tower = `<svg class="nt-tower" style="left:calc(50% - 35px)" viewBox="0 0 70 300" preserveAspectRatio="none">
          <path d="M35 0 L35 20 M30 20 L40 20 L44 90 L26 90 Z M24 90 L46 90 M26 90 L14 180 L56 180 L44 90 M12 180 L58 180 M14 180 L2 300 M56 180 L68 300 M14 180 Q35 220 56 180 M8 250 Q35 215 62 250 M26 90 L44 130 M44 90 L26 130"/></svg>`;
        const blds = [[0, 5, 9, 12], [17, 3, 13, 0], [29, 4, 7, 0], [66, 4, 8, 0], [80, 3, 12, 0], [90, 4, 10, 0]];
        let city = "", n = 0;
        blds.forEach(([left, cols, rows]) => {
          let w = "";
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { w += `<i class="${Math.random() < .3 ? "v" : ""}" style="--d:${f(n * .07 + rnd(0, .3), 2)}s;--n:${n}"></i>`; n++; }
          city += `<div class="nt-bldg" style="left:${left}%;grid-template-columns:repeat(${cols},7px)">${w}</div>`;
        });
        return `<div class="nt-aurora"></div>${bk}${arch}<div class="nt-city">${tower}${city}</div>`;
      },
      start(b) { setTimeout(() => replay(b, "flash", 1300), 300); },
      act(b) { replay(b, "flash", 1300); }
    }
  };
})();
