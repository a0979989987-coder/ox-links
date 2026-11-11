#!/usr/bin/env python3
"""headless Chromium 截圖、錄影、FPS 量測。先在 v2/ 開 python3 -m http.server 8765，再跑 python3 tools/preview.py
輸出：previews/<id>_first.png、<id>_intro.png、<id>_tap.png、<id>_full.png、all_four.png、hub.png、demo_four.mp4"""
import subprocess, os, shutil, json
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
BASE = "http://localhost:8765/"; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "previews")
IDS = ["sheng", "cheng", "chameleon", "lucas"]; NAMES = ["阿聖聊交易", "老承", "交易變色龍", "Lucas"]
VP = {"width": 390, "height": 844}; CHROME = shutil.which("google-chrome")
FPS_JS = """() => new Promise(r => { let f = 0, t0 = performance.now(), y = 0, long = 0, last = t0;
  function s(t) { f++; if (t - last > 50) long++; last = t; y += 5; scrollTo(0, y % 900); if (t - t0 < 3000) requestAnimationFrame(s); else r({ fps: +(f / ((t - t0) / 1000)).toFixed(1), framesOver50ms: long }); }
  requestAnimationFrame(s); })"""
report = {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    ctx = b.new_context(viewport=VP, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("requestfailed", lambda r: errs.append("failed " + r.url))
    for i in IDS:
        pg.goto(BASE + i + "/", wait_until="domcontentloaded"); pg.wait_for_timeout(700)
        pg.screenshot(path=f"{OUT}/{i}_intro.png")
        pg.wait_for_timeout(2300)
        pg.screenshot(path=f"{OUT}/{i}_first.png")
        pg.dispatch_event("body", "pointerdown", {"clientX": 195, "clientY": 300})
        pg.wait_for_timeout({"sheng": 800, "cheng": 1100, "chameleon": 200, "lucas": 300}[i])
        pg.screenshot(path=f"{OUT}/{i}_tap.png")
        pg.wait_for_timeout(1500)
        pg.screenshot(path=f"{OUT}/{i}_full.png", full_page=True)
        report[i] = {"scrollWidth": pg.evaluate("document.documentElement.scrollWidth"), "title": pg.title(),
                     "domNodes": pg.evaluate("document.querySelectorAll('*').length"), **pg.evaluate(FPS_JS)}
    pg.goto(BASE, wait_until="domcontentloaded"); pg.wait_for_timeout(600); pg.screenshot(path=f"{OUT}/hub.png")
    report["errors"] = errs
    ctx.close()
    vctx = b.new_context(viewport=VP, is_mobile=True, has_touch=True, record_video_dir="/tmp/ox_vid4", record_video_size=VP)
    v = vctx.new_page()
    for i in IDS:
        v.goto(BASE + i + "/", wait_until="domcontentloaded"); v.wait_for_timeout(1750)
        v.dispatch_event("body", "pointerdown", {"clientX": 200, "clientY": 330}); v.wait_for_timeout(900)
    vp = v.video.path(); vctx.close(); b.close()
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", vp, "-t", "11", "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "24", "-movflags", "+faststart", f"{OUT}/demo_four.mp4"], check=True)
# 四頁並排總覽
ims = [Image.open(f"{OUT}/{i}_first.png").convert("RGB") for i in IDS]
w, h = ims[0].size; gap = 24; lab = 70
sheet = Image.new("RGB", (w * 4 + gap * 5, h + lab + gap), (14, 12, 10)); d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 40)
except Exception: font = ImageFont.load_default()
for k, im in enumerate(ims):
    x = gap + k * (w + gap); sheet.paste(im, (x, lab))
    t = f"/{IDS[k]}/  {NAMES[k]}"; d.text((x + (w - d.textlength(t, font=font)) / 2, 14), t, font=font, fill=(240, 230, 210))
sheet.save(f"{OUT}/all_four.png")
print(json.dumps(report, ensure_ascii=False, indent=1))
