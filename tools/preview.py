"""產生預覽：每頁首屏（三種 iPhone 可視高度）與整頁截圖、四頁並排圖、約 12 秒示範影片，並量 fps、檢查錯誤、reduced-motion、水平溢出、
LINE 官方大格和 LINE 社群列是否整個在首屏內（底部 LINE 條也不能蓋到）、OX 工具名稱是否只有一行。頁面沒有開場動畫，打開就截。
用法：先在 v2 目錄跑 python3 -m http.server 8765，再跑 python3 tools/preview.py
需要 playwright（python3 -m playwright install ffmpeg）、Pillow、系統 ffmpeg。輸出到 previews/（已在 .gitignore）。"""
import os, glob, json, shutil, subprocess, tempfile
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

BASE = os.environ.get("BASE", "http://localhost:8765/")
IDS = ["sheng", "cheng", "chameleon", "lucas"]
SIZES = [(390, 664), (375, 600), (390, 844)]  # Safari 網址列和工具列會吃掉高度，所以用保守的可視高度
TOOL_SEL = {"sheng": ".sh-term b", "cheng": ".ch-tool b", "chameleon": ".jg-lv b", "lucas": ".lu-pol .cap"}
CHECK_JS = """(toolSel) => {
  const box = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.top, r.bottom, r.left, r.right].map(Math.round); };
  const d = [...document.querySelectorAll('[class$="-dock"]')].find(e => e.classList.contains('on'));
  const lines = [...document.querySelectorAll(toolSel)].map(e => { const t = [...e.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    const rg = document.createRange(); rg.selectNodeContents(t); const tops = new Set([...rg.getClientRects()].map(r => Math.round(r.top)));
    return { text: t.textContent.trim(), lines: tops.size, cut: e.scrollWidth > e.clientWidth + 1 }; });
  return { official: box('[data-line=official]'), community: box('[data-line=community]'), dockTop: d ? Math.round(d.getBoundingClientRect().top) : null, tools: lines };
}"""
OUT = os.path.join(os.path.dirname(__file__), "..", "previews"); os.makedirs(OUT, exist_ok=True)
CHROME = "/usr/bin/google-chrome" if os.path.exists("/usr/bin/google-chrome") else None
VP = {"width": 390, "height": 664}
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
        pg.goto(BASE + pid + "/"); pg.wait_for_timeout(900)   # 沒有開場，只等字型載入
        fps = pg.evaluate(FPS_JS)
        for y in range(0, 9000, 300): pg.evaluate(f"scrollTo(0,{y})"); pg.wait_for_timeout(110)
        pg.evaluate("scrollTo(0,0)"); pg.wait_for_timeout(700)
        pg.screenshot(path=f"{OUT}/{pid}_full.png", full_page=True)
        sw = pg.evaluate("document.documentElement.scrollWidth")
        links = pg.evaluate("[...new Set([...document.querySelectorAll('a[href]')].map(a=>a.href))]")
        c.close()
        fit = []
        for w, h in SIZES:
            c2 = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2, is_mobile=True, has_touch=True); p2 = c2.new_page(); e2 = []
            p2.on("pageerror", lambda e: e2.append(str(e))); p2.on("console", lambda m: e2.append(m.text) if m.type == "error" else None)
            p2.goto(BASE + pid + "/"); p2.wait_for_timeout(900)
            r = p2.evaluate(CHECK_JS, TOOL_SEL[pid])
            o, cm, dt = r["official"], r["community"], r["dockTop"]
            ok = bool(o and cm and o[0] >= 0 and cm[1] <= h and o[2] >= 0 and max(o[3], cm[3]) <= w and (dt is None or dt >= cm[1]))
            p2.screenshot(path=f"{OUT}/{pid}_first.png" if (w, h) == (390, 664) else f"{OUT}/{pid}_first_{w}x{h}.png")
            fit.append({"size": f"{w}x{h}", "official": o, "community": cm, "dockTop": dt, "fits": ok, "tools": r["tools"], "errors": e2})
            c2.close()
        c = ctx_of(b, reduced_motion="reduce"); pg = c.new_page(); rerr = []
        pg.on("pageerror", lambda e: rerr.append(str(e)))
        pg.goto(BASE + pid + "/"); pg.wait_for_timeout(800)
        rm = pg.evaluate("({hidden: [...document.querySelectorAll('.rv')].filter(e=>getComputedStyle(e).opacity<0.5).length})")
        c.close()
        report[pid] = {"first_screen": fit, "errors": errs, "scrollWidth": sw, "fps_while_scrolling": fps, "links": links, "reduced_motion": rm, "reduced_errors": rerr}
        print(pid, "errors", errs, "scrollWidth", sw, "fps", fps, "reduced", rm)
        for f in fit: print("  ", f["size"], "official", f["official"], "community", f["community"], "dock", f["dockTop"], "FITS" if f["fits"] else "DOES NOT FIT",
                            "tools", [(t["text"], t["lines"], "cut" if t["cut"] else "") for t in f["tools"]], f["errors"])

    # 示範影片：每頁約 3 秒（開場、點一下、往下捲）
    tmp = tempfile.mkdtemp(); clips = []
    for pid in IDS:
        c = b.new_context(viewport=VP, device_scale_factor=1, is_mobile=True, has_touch=True, record_video_dir=tmp, record_video_size=VP)  # VP 改成 390x664，見下
        pg = c.new_page(); pg.goto(BASE + pid + "/"); pg.wait_for_timeout(1000)
        # 點一下空白處（用事件，不會點到連結開新頁）
        pg.evaluate("""() => { const o = { bubbles: true, clientX: 200, clientY: 160 }; document.body.dispatchEvent(new PointerEvent('pointerdown', o)); document.body.dispatchEvent(new MouseEvent('click', o)); }""")
        pg.wait_for_timeout(700)
        for y in range(0, 700, 35): pg.evaluate(f"scrollTo(0,{y})"); pg.wait_for_timeout(22)
        pg.wait_for_timeout(300)
        path = pg.video.path(); c.close(); clips.append(path)
    b.close()

lst = os.path.join(tmp, "list.txt"); parts = []
for i, cl in enumerate(clips):
    o = os.path.join(tmp, f"c{i}.mp4")
    # 頁面載入前的白屏剪掉，每段取 3 秒
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "0.35", "-i", cl, "-t", "3", "-r", "30", "-vf", "scale=390:664,format=yuv420p", "-c:v", "libx264", "-crf", "22", o], check=True)
    parts.append(o)
open(lst, "w").write("".join(f"file '{x}'\n" for x in parts))
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", f"{OUT}/demo_four.mp4"], check=True)
shutil.rmtree(tmp, ignore_errors=True)

# 四頁並排
ims = [Image.open(f"{OUT}/{i}_first.png").convert("RGB").resize((390, 664)) for i in IDS]
gap, top = 16, 44
sheet = Image.new("RGB", (390 * 4 + gap * 5, 664 + top + gap), (18, 18, 20)); d = ImageDraw.Draw(sheet)
try: f = ImageFont.truetype(glob.glob("/usr/share/fonts/**/NotoSansCJK*Regular*", recursive=True)[0], 22)
except Exception: f = ImageFont.load_default()
for k, (pid, im) in enumerate(zip(IDS, ims)):
    x = gap + k * (390 + gap); sheet.paste(im, (x, top)); d.text((x, 12), f"/{pid}/", fill=(230, 230, 230), font=f)
sheet.save(f"{OUT}/all_four.png")
json.dump(report, open(f"{OUT}/report.json", "w"), ensure_ascii=False, indent=1)
print("done", OUT)
