#!/usr/bin/env python3
"""
把 App 截圖裡的圓形頭像裁成透明背景的正方形 PNG/WebP。

用法：
  python3 tools/crop_circle.py 輸入圖 assets/img/輸出檔名.webp [--inset 4] [--size 400]

做法：
  1. 從四個角取樣「圓外」的底色（通常是灰色）。
  2. 跟底色差很多的像素算圓內，取最大的連通區塊。
  3. 用區塊的邊界框找圓心，半徑取邊界框寬高平均的一半，並用面積再校正一次。
  4. 半徑往內縮 inset px（避免灰邊），裁成正方形，圓外變透明（4 倍超取樣抗鋸齒）。

模式 --mode：
  detect  （預設）App 截圖：自動偵測圓形，裁掉圓外灰色。
  square  本來就是正方形大頭貼（YouTube、Threads）：直接取中間最大的圓。
  cutout  白底插圖（例如變色龍）：先把跟外框相連的白底去掉，另存 *_cutout.png，
          再把去背圖置中放進同樣大小的圓裡。
"""
import argparse, sys
import numpy as np
from PIL import Image, ImageDraw

def largest_component(mask):
    try:
        from scipy import ndimage
        lab, n = ndimage.label(mask)
        if n == 0: return mask
        sizes = ndimage.sum(mask, lab, range(1, n + 1))
        return lab == (int(np.argmax(sizes)) + 1)
    except ImportError:
        return mask  # 沒有 scipy 就直接用整張遮罩

def detect(img, thresh):
    a = np.asarray(img.convert("RGB")).astype(np.int16)
    h, w, _ = a.shape
    k = max(4, min(h, w) // 40)
    corners = np.concatenate([a[:k, :k].reshape(-1, 3), a[:k, -k:].reshape(-1, 3), a[-k:, :k].reshape(-1, 3), a[-k:, -k:].reshape(-1, 3)])
    bg = np.median(corners, axis=0)
    diff = np.abs(a - bg).sum(axis=2)
    mask = largest_component(diff > thresh)
    ys, xs = np.nonzero(mask)
    if len(xs) == 0: sys.exit("找不到圓形")
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    r_box = ((x1 - x0) + (y1 - y0)) / 4
    r_area = np.sqrt(mask.sum() / np.pi)
    r = min(r_box, r_area * 1.02)  # 照片裡有跟底色很像的地方時，面積會偏小，所以取邊界框為主
    return cx, cy, r_box if abs(r_box - r_area) / r_box < .06 else r, bg

def cutout(img, white=228):
    from scipy import ndimage
    a = np.asarray(img.convert("RGB")).astype(np.int16)
    near = a.min(axis=2) > white
    lab, _ = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    bg = ndimage.binary_dilation(bg, iterations=1)
    alpha = 1 - ndimage.gaussian_filter(bg.astype(float), 0.8)
    rgba = np.dstack([a.astype(np.uint8), (np.clip(alpha, 0, 1) * 255).astype(np.uint8)])
    out = Image.fromarray(rgba, "RGBA")
    return out.crop(out.getbbox())

def circle_alpha(sq, size):
    ss = 4; m = Image.new("L", (size * ss, size * ss), 0)
    ImageDraw.Draw(m).ellipse((0, 0, size * ss - 1, size * ss - 1), fill=255)
    m = m.resize((size, size), Image.LANCZOS)
    old = sq.getchannel("A") if sq.mode == "RGBA" else Image.new("L", (size, size), 255)
    sq = sq.convert("RGBA"); sq.putalpha(Image.fromarray(np.minimum(np.asarray(old), np.asarray(m))))
    return sq

def save(im, dst):
    kw = {"quality": 88, "method": 6} if dst.endswith(".webp") else {"optimize": True}
    im.save(dst, **kw)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("src"); p.add_argument("dst")
    p.add_argument("--inset", type=float, default=4)
    p.add_argument("--size", type=int, default=400)
    p.add_argument("--thresh", type=int, default=36)
    p.add_argument("--mode", choices=["detect", "square", "cutout"], default="detect")
    p.add_argument("--fit", type=float, default=0.86, help="cutout 模式：去背圖佔圓直徑的比例")
    o = p.parse_args()
    img = Image.open(o.src).convert("RGB")
    if o.mode == "square":
        n = min(img.size); x0 = (img.width - n) // 2; y0 = (img.height - n) // 2
        sq = img.crop((x0 + o.inset, y0 + o.inset, x0 + n - o.inset, y0 + n - o.inset)).resize((o.size, o.size), Image.LANCZOS)
        save(circle_alpha(sq, o.size), o.dst); print(f"square 模式  原圖 {img.size}  內縮 {o.inset}  輸出 {o.dst}"); return
    if o.mode == "cutout":
        cut = cutout(img)
        cut_path = o.dst.rsplit(".", 1)[0] + "_cutout.png"
        cut.thumbnail((400, 400), Image.LANCZOS); save(cut, cut_path)
        side = int(o.size * o.fit); c = cut.copy(); c.thumbnail((side, side), Image.LANCZOS)
        canvas = Image.new("RGBA", (o.size, o.size), (0, 0, 0, 0))
        canvas.alpha_composite(c, ((o.size - c.width) // 2, (o.size - c.height) // 2))
        save(circle_alpha(canvas, o.size), o.dst); print(f"cutout 模式  去背圖 {cut_path} {cut.size}  輸出 {o.dst}"); return
    cx, cy, r, bg = detect(img, o.thresh)
    r -= o.inset
    box = (round(cx - r), round(cy - r), round(cx + r), round(cy + r))
    sq = img.crop(box).resize((o.size, o.size), Image.LANCZOS)
    save(circle_alpha(sq, o.size), o.dst)
    print(f"底色 {bg.astype(int).tolist()}  圓心 ({cx:.1f}, {cy:.1f})  半徑 {r + o.inset:.1f}  內縮 {o.inset}  輸出 {o.dst}")

if __name__ == "__main__":
    main()
