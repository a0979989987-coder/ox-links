# OX 連結頁 v2（Snsheng link-in-bio 改版）

原站：https://a0979989987-coder.github.io/snsheng/ （這個 repo 不會動到原站）

純 HTML / CSS / JS，沒有建置步驟，手機瀏覽器直接開。

> 目前狀態：**第一頁（媒體頻道）已按定案風格完成。** 第二到第四頁還沒開始。
> 頭像是暫用版（公開大頭貼），使用者會重傳原照。

## 結構

```
index.html              頁面骨架、開場、圖示
css/style.css           樣式；開場、LINE 大格、OX 工具、人物卡共用版型，最下面是各人 .theme-xxx
js/data.js              所有內容資料：連結、人物、主業、照片路徑、四頁規劃  ← 改內容只改這裡
js/app.js               把 data.js 畫成畫面；開場、入場、各人互動（THEMES）、背景粒子
assets/img/avatars/     圓形透明頭像 PNG（320×320，尺寸和圓心一致）
assets/img/icon-180.png 網站圖示（沿用原站）
tools/crop_circle.py    頭像裁切工具
tools/preview.py        headless Chromium 截圖＋錄影＋滑動 FPS 量測，輸出到 previews/
previews/               截圖和影片（不進 git）
```

## 第一頁設計（定案）

| 區塊 | 設計 | 互動 |
|---|---|---|
| 開場 | 一根金色 K 線從底部衝上來，炸開成金光，帶出整頁，約 1.9 秒 | 點一下跳過；`prefers-reduced-motion` 直接不播 |
| LINE 官方 | LINE 綠大格，斜向光紋，FREE 標籤 | 邊框流光一直繞、整格輕微呼吸放大＋綠光、按鈕上光帶掃過 |
| LINE 社群 | LINE 深綠大格 | 邊框流光反向繞 |
| OX 工具 | 照原站三格（OX 台股、OX 加密、合成市場） | 光帶輪流掃過 |
| 阿聖聊交易 `snr` | 暗紅交易室：格線、底部跑馬燈、TRADING ROOM 字樣，頭像有雜誌封面斜光 | 碰到或滑過：K 線一根根長出來＋一道封面光掃過整張卡 |
| 老承 `mono` | 冷調黑灰拉絲金屬感、一條細白線 | 碰到：一道白光掃過整張卡，頭像框亮一下 |
| 交易變色龍 `jungle` | 叢林霓虹：藤蔓光線流動、光點往上飄、鱗片每 3.2 秒換一次顏色 | 點下去：金幣閃光＋頭像彈一下＋鱗片立刻換色 |
| Lucas `night` | 紫金夜景：極光暈、散景光點飄、燈串弧線跑燈、建築窗戶一格一格亮 | 點下去：所有窗戶齊亮＋金紫光爆 |

共用規則：
- 所有人頭像都是 92px 圓形，同一位置，同樣 2px 圓框，只有顏色依主題。
- 第一次滑到某張卡時會自動演示一次互動，讓手機使用者不用碰也看得到。
- 卡片離開畫面時暫停動畫；切到背景分頁時粒子停止。
- 動畫只用 transform、opacity（SVG 跑燈用 stroke-dashoffset），背景粒子用預先畫好的光點貼圖，不用 shadowBlur。
- 主業沒查證的人（交易變色龍、Lucas）不顯示主業，只顯示帳號。

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
| `handle` | 名字下面顯示的帳號 |
| `theme` / `themeBrief` | 卡片背景風格代號（snr、mono、jungle、night）和使用者給的方向 |
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

## 本地預覽與截圖

```bash
cd v2
python3 -m http.server 8765
# 電腦開 http://localhost:8765 ，用瀏覽器開發者工具切到手機尺寸（390×844）
```

手機實機：同一個 Wi‑Fi 下開 `http://電腦IP:8765`。

截圖與錄影（需要 Python Playwright，錄影另需 `python3 -m playwright install ffmpeg` 和系統 ffmpeg）：

```bash
python3 tools/preview.py   # server 開著的時候執行，輸出 previews/*.png 和 previews/demo_mobile.mp4
```

## 給接手的人（或 AI）

- 文案不要用破折號、不要用 emoji 條列。
- 手機只能上下滑，不能左右滑（`overflow-x` 要擋住）。
- 不要把圖片轉成 base64 塞進 HTML；圖放 `assets/`。
- 連結去掉追蹤參數（`?igshid=`、`utm_source` 之類）。
