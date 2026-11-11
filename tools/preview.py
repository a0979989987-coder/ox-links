"""產生預覽：每頁首屏與整頁截圖、四頁並排圖、約 12 秒示範影片，並量 fps、檢查錯誤、reduced-motion 與水平溢出。
用法：先在 v2 目錄跑 python3 -m http.server 8765，再跑 python3 tools/preview.py
需要 playwright（python3 -m playwright install ffmpeg）、Pillow、系統 ffmpeg。輸出到 previews/（已在 .gitignore）。"""
import os, glob, json, shutil, subprocess, tempfile
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

BASE = os.environ.get("BASE", "http://localhost:8765/")
IDS = ["sheng", "cheng", "chameleon", "lucas"]
OUT = os.path.join(os.path.dirname(__file__), "..", "previews"); os.makedirs(OUT, exist_ok=True)
CHROME = "/usr/bin/google-chrome" if os.path.exists("/usr/bin/google-chrome") else None
VP = {"width": 390, "height": 844}
FPS_JS = """() => new Promise(r => { let n = 0, t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / 2); };
  requestAnimationFrame(f); let y = 0; const s = setInterval(() => { y += 40; scrollTo(0, y); }, 16); setTimeout(() => clearInterval(s), 2000); })"""

def ctx_of(b, **kw):
    return b.new_context(viewport=VP, device_scale_factor=2, is_mobile=True, has_touch=True, **kw)

report = {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=["--enable-unsafe-swiftshader"])
    for pid in IDS:
        c = ctx_of(b); pg = c.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(BASE + pid + "/"); pg.wait_for_timeout(3200)
        pg.screenshot(path=f"{OUT}/{pid}_first.png")
        fps = pg.evaluate(FPS_JS)
        for y in range(0, 9000, 300): pg.evaluate(f"scrollTo(0,{y})"); pg.wait_for_timeout(110)
        pg.evaluate("scrollTo(0,0)"); pg.wait_for_timeout(700)
        pg.screenshot(path=f"{OUT}/{pid}_full.png", full_page=True)
        sw = pg.evaluate("document.documentElement.scrollWidth")
        links = pg.evaluate("[...new Set([...document.querySelectorAll('a[href]')].map(a=>a.href))]")
        c.close()
        c = ctx_of(b, reduced_motion="reduce"); pg = c.new_page(); rerr = []
        pg.on("pageerror", lambda e: rerr.append(str(e)))
        pg.goto(BASE + pid + "/"); pg.wait_for_timeout(800)
        rm = pg.evaluate("({intro: document.body.classList.contains('intro-on'), hidden: [...document.querySelectorAll('.rv')].filter(e=>getComputedStyle(e).opacity<0.5).length})")
        c.close()
        report[pid] = {"errors": errs, "scrollWidth": sw, "fps_while_scrolling": fps, "links": links, "reduced_motion": rm, "reduced_errors": rerr}
        print(pid, json.dumps({k: v for k, v in report[pid].items() if k != "links"}, ensure_ascii=False))

    # 示範影片：每頁約 3 秒（開場、點一下、往下捲）
    tmp = tempfile.mkdtemp(); clips = []
    for pid in IDS:
        c = b.new_context(viewport=VP, device_scale_factor=1, is_mobile=True, has_touch=True, record_video_dir=tmp, record_video_size=VP)
        pg = c.new_page(); pg.goto(BASE + pid + "/"); pg.wait_for_timeout(1700)
        pg.mouse.click(195, 300); pg.wait_for_timeout(500)
        for y in range(0, 700, 35): pg.evaluate(f"scrollTo(0,{y})"); pg.wait_for_timeout(22)
        pg.wait_for_timeout(300)
        path = pg.video.path(); c.close(); clips.append(path)
    b.close()

lst = os.path.join(tmp, "list.txt"); parts = []
for i, cl in enumerate(clips):
    o = os.path.join(tmp, f"c{i}.mp4")
    # 頁面載入前的白屏剪掉，每段取 3 秒
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "0.35", "-i", cl, "-t", "3", "-r", "30", "-vf", "scale=390:844,format=yuv420p", "-c:v", "libx264", "-crf", "22", o], check=True)
    parts.append(o)
open(lst, "w").write("".join(f"file '{x}'\n" for x in parts))
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", f"{OUT}/demo_four.mp4"], check=True)
shutil.rmtree(tmp, ignore_errors=True)

# 四頁並排
ims = [Image.open(f"{OUT}/{i}_first.png").convert("RGB").resize((390, 844)) for i in IDS]
gap, top = 16, 44
sheet = Image.new("RGB", (390 * 4 + gap * 5, 844 + top + gap), (18, 18, 20)); d = ImageDraw.Draw(sheet)
try: f = ImageFont.truetype(glob.glob("/usr/share/fonts/**/NotoSansCJK*Regular*", recursive=True)[0], 22)
except Exception: f = ImageFont.load_default()
for k, (pid, im) in enumerate(zip(IDS, ims)):
    x = gap + k * (390 + gap); sheet.paste(im, (x, top)); d.text((x, 12), f"/{pid}/", fill=(230, 230, 230), font=f)
sheet.save(f"{OUT}/all_four.png")
json.dump(report, open(f"{OUT}/report.json", "w"), ensure_ascii=False, indent=1)
print("done", OUT)
