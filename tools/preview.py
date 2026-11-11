#!/usr/bin/env python3
"""headless Chromium 截圖與錄影：python3 tools/preview.py（需先在 v2/ 開 http.server 8765）"""
import subprocess, glob, os, shutil
from playwright.sync_api import sync_playwright
URL = "http://localhost:8765/"; OUT = os.path.join(os.path.dirname(__file__), "..", "previews")
VP = {"width": 390, "height": 844}
CHROME = shutil.which("google-chrome") or None
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=["--enable-gpu-rasterization"])
    ctx = b.new_context(viewport=VP, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="domcontentloaded"); pg.wait_for_timeout(650)
    pg.screenshot(path=f"{OUT}/01_intro_mid.png")        # K 線衝上來
    pg.wait_for_timeout(380)
    pg.screenshot(path=f"{OUT}/01b_intro_burst.png")     # 炸開
    pg.wait_for_timeout(1900)
    pg.screenshot(path=f"{OUT}/02_first_screen.png")
    # 整頁：先把所有區塊滑過一遍讓入場動畫跑完
    for y in range(0, 3000, 300): pg.evaluate(f"scrollTo(0,{y})"); pg.wait_for_timeout(250)
    pg.evaluate("scrollTo(0,0)"); pg.wait_for_timeout(800)
    pg.screenshot(path=f"{OUT}/03_full_page.png", full_page=True)
    # 各卡互動中的截圖
    for cid, ms in [("p-sheng", 700), ("p-cheng", 300), ("p-chameleon", 150), ("p-lucas", 250)]:
        el = pg.locator(f"#{cid}"); el.scroll_into_view_if_needed(); pg.wait_for_timeout(1800)
        bb = el.bounding_box(); el.dispatch_event("pointerdown"); pg.wait_for_timeout(ms)
        pg.screenshot(path=f"{OUT}/card_{cid[2:]}_active.png", clip=bb)
    print("errors", errs, "scrollWidth", pg.evaluate("document.documentElement.scrollWidth"))
    # 效能：滑動時量 fps
    pg.evaluate("scrollTo(0,0)")
    fps = pg.evaluate("""() => new Promise(r => { let f = 0, t0 = performance.now(), y = 0, long = 0, last = t0;
      function s(t) { f++; if (t - last > 50) long++; last = t; y += 6; scrollTo(0, y % 1800); if (t - t0 < 3000) requestAnimationFrame(s); else r({ fps: f / ((t - t0) / 1000), framesOver50ms: long }); }
      requestAnimationFrame(s); })""")
    print("scroll fps", fps)
    ctx.close()
    # 錄影：約 6 秒，含開場和卡片互動
    vctx = b.new_context(viewport=VP, device_scale_factor=1, is_mobile=True, has_touch=True, record_video_dir="/tmp/ox_vid", record_video_size=VP)
    v = vctx.new_page(); v.goto(URL, wait_until="domcontentloaded"); v.wait_for_timeout(2300)
    for cid, wait in [("p-sheng", 1300), ("p-chameleon", 1100), ("p-lucas", 1100)]:
        v.evaluate(f"document.getElementById('{cid}').scrollIntoView({{behavior:'smooth',block:'center'}})"); v.wait_for_timeout(450)
        v.locator(f"#{cid}").dispatch_event("pointerdown"); v.wait_for_timeout(wait)
    path = v.video.path(); vctx.close(); b.close()
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-t", "7.5", "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "24", "-movflags", "+faststart", f"{OUT}/demo_mobile.mp4"], check=True)
print("video ok")
