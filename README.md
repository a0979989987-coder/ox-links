# OX 連結頁 v2（Snsheng link-in-bio 改版）

原站：https://a0979989987-coder.github.io/snsheng/ （這個 repo 不會動到原站）

純 HTML / CSS / JS，沒有建置步驟，手機瀏覽器直接開。

> 目前狀態：**素材準備完成，視覺風格還在跟使用者討論。**
> `index.html`、`css/style.css`、`js/app.js` 只是能跑的草稿骨架，版型和特效都還沒定案，之後可以整個重做；`js/data.js` 和 `assets/` 才是定下來的部分。

## 結構

```
index.html              頁面骨架（草稿）
css/style.css           樣式（草稿；人物背景風格在 .theme-xxx）
js/data.js              所有內容資料：連結、人物、主業、照片路徑、四頁規劃  ← 改內容只改這裡
js/app.js               把 data.js 畫成畫面＋動態效果（草稿）
assets/img/avatars/     圓形透明頭像 PNG（320×320，尺寸和圓心一致）
assets/img/icon-180.png 網站圖示（沿用原站）
tools/crop_circle.py    頭像裁切工具
```

## 四頁規劃

| 頁 | 內容 | 狀態 |
|---|---|---|
| 第一頁 | 媒體頻道：LINE 官方、LINE 社群、OX 工具、各創作者 YT / IG / Threads | 素材完成，風格討論中 |
| 第二頁 | 待定 | 未開始 |
| 第三頁 | 待定 | 未開始 |
| 第四頁 | 待定 | 未開始 |

頁名和是否完成在 `data.js` 的 `pages`。

## 第一頁內容（都在 js/data.js）

- `lineOfficial`：LINE 官方帳號，最大最明顯的一格，按鈕文字「LINE 點擊領取免費教材」，連結 https://lin.ee/TAWUaY2
- `lineCommunity`：LINE 社群，沿用原站連結
- `tools`：OX 工具，照原站保留（OX 台股、OX 加密、合成市場）
- `people`：每個創作者一筆

### 改某個人的資料

在 `js/data.js` 的 `people` 找到那個人（用 `id`：`sheng`、`cheng`、`chameleon`、`lucas`）：

| 欄位 | 用途 |
|---|---|
| `name` | 顯示名稱 |
| `role` / `tags` | 主業和標籤 |
| `verified` / `source` | 主業有沒有查證、資料出處 |
| `photo` | 圓形頭像路徑 |
| `photoNote` | 照片目前來源、要不要換 |
| `theme` / `themeBrief` | 卡片背景風格代號和使用者給的方向 |
| `links.yt` / `links.ig` / `links.threads` | 社群連結；沒有就刪掉那一行，按鈕就不會出現 |

新增一個人：複製一整筆改內容即可。

## 換頭像

```bash
# App 截圖（圓形頭像外面有灰色）：自動偵測圓心半徑，圓外變透明，內縮 4px 避免灰邊
python3 tools/crop_circle.py 截圖.jpg assets/img/avatars/sheng.png --size 320 --inset 4

# 本來就是正方形大頭貼
python3 tools/crop_circle.py 大頭貼.jpg assets/img/avatars/xxx.png --mode square --size 320 --inset 2

# 白底插圖：去背，另存 xxx_cutout.png，再置中放進同樣大小的圓
python3 tools/crop_circle.py 插圖.png assets/img/avatars/chameleon.png --mode cutout --size 320
```

需要 Python 3、Pillow、numpy、scipy。所有頭像輸出都是 320×320、圓剛好貼齊正方形邊，所以在頁面上用同一個圓框就會對齊。

## 本地預覽

```bash
cd v2
python3 -m http.server 8765
# 電腦開 http://localhost:8765 ，用瀏覽器開發者工具切到手機尺寸（390×844）
```

手機實機：同一個 Wi‑Fi 下開 `http://電腦IP:8765`。

## 給接手的人（或 AI）

- 文案不要用破折號、不要用 emoji 條列。
- 手機只能上下滑，不能左右滑（`overflow-x` 要擋住）。
- 不要把圖片轉成 base64 塞進 HTML；圖放 `assets/`。
- 連結去掉追蹤參數（`?igshid=`、`utm_source` 之類）。
