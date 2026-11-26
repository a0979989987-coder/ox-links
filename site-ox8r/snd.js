/* OX 官網 v5 的聲音：預設靜音，按右上聲音鍵才有空間配樂；換世界那一下有一聲穿越音效（全部用 WebAudio 即時合成，沒有音檔）。 */
(function () {
  "use strict";
  // ---------- 聲音 ----------
  let ac = null, master = null, amb = null, on = false;
  const btn = document.querySelector(".snd");
  function noiseBuf() { const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function startAudio() {
    ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    // 空間配樂：兩個低頻＋一個高八度的泛音，過一個慢慢開合的低通
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420; lp.Q.value = .7; lp.connect(master);
    const oscs = [55, 82.41, 110, 164.81].map((f, i) => { const o = ac.createOscillator(); o.type = i < 2 ? "sine" : "triangle"; o.frequency.value = f; const gg = ac.createGain(); gg.gain.value = [.22, .14, .06, .035][i]; o.connect(gg); gg.connect(lp); o.start(); return o; });
    const lfo = ac.createOscillator(); lfo.frequency.value = .05; const lg = ac.createGain(); lg.gain.value = 220; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    amb = { lp, oscs };
  }
  const ROOT = { bh: 55, balance: 58.27, city: 65.41, tunnel: 61.74, lab: 55, islands: 65.41, cinema: 51.91, stars: 58.27, vault: 49, outro: 55 };
  addEventListener("oxworld", e => { if (!amb) return; const r = ROOT[e.detail] || 55, now = ac.currentTime; amb.oscs.forEach((o, i) => o.frequency.setTargetAtTime(r * [1, 1.498, 2, 2.997][i], now, .8)); });
  function whoosh(kind) {
    if (!on || !ac) return;
    const now = ac.currentTime, src = ac.createBufferSource(); src.buffer = noiseBuf();
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = kind === "iris" ? 9 : 1.2;
    const gg = ac.createGain(); src.connect(bp); bp.connect(gg); gg.connect(master);
    const dur = kind === "warp" ? 1.3 : kind === "iris" ? .6 : .9;
    const [f0, f1] = kind === "warp" ? [200, 5200] : kind === "spot" ? [900, 120] : kind === "iris" ? [180, 160] : [400, 2600];
    bp.frequency.setValueAtTime(f0, now); bp.frequency.exponentialRampToValueAtTime(f1, now + dur * .8);
    gg.gain.setValueAtTime(0, now); gg.gain.linearRampToValueAtTime(kind === "iris" ? .9 : .5, now + dur * .35); gg.gain.exponentialRampToValueAtTime(.001, now + dur);
    src.start(now); src.stop(now + dur + .05);
    // 低頻的一下（世界換掉那一刻）
    const o = ac.createOscillator(), og = ac.createGain(); o.type = "sine"; o.frequency.setValueAtTime(kind === "warp" ? 90 : 70, now + dur * .3); o.frequency.exponentialRampToValueAtTime(32, now + dur * .3 + .6);
    og.gain.setValueAtTime(0, now + dur * .3); og.gain.linearRampToValueAtTime(.5, now + dur * .3 + .02); og.gain.exponentialRampToValueAtTime(.001, now + dur * .3 + .7); o.connect(og); og.connect(master); o.start(now + dur * .3); o.stop(now + dur + .8);
  }
  if (btn) btn.addEventListener("click", () => {
    if (!ac) startAudio();
    on = !on; ac.resume && ac.resume();
    master.gain.setTargetAtTime(on ? .55 : 0, ac.currentTime, .4);
    btn.setAttribute("aria-pressed", on); btn.classList.toggle("on", on);
  });

  // ---------- 每一格 ----------
  let first = true;
  addEventListener("oxworld", e => { if (first) { first = false; return; } whoosh(e.detail === "lab" ? "warp" : e.detail === "card" ? "iris" : "x"); });
})();
