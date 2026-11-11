# OX 創作者連結頁（link-in-bio）

四位創作者各一個專屬連結頁，共用元件，內容全部從 `js/data.js` 讀。
純 HTML / CSS / JS，沒有建置步驟（只有產生 `<head>` 的小腳本），手機直接開。
原站 https://a0979989987-coder.github.io/snsheng/ 不受影響。

| 網址 | 創作者 | 風格代號 |
|---|---|---|
| `/sheng/` | 阿聖聊交易 | `snr` 暗紅交易室 |
| `/cheng/` | 老承 | `mono` 冷調黑灰 |
| `/chameleon/` | 交易變色龍 | `jungle` 叢林霓虹 |
| `/lucas/` | Lucas | `night` 紫金夜景 |
| `/` | 四人入口（簡單列表，不是主角） | |

> 頭像都是暫用版（公開大頭貼），使用者會重傳原照。

## 結構

```
index.html                根目錄四人入口（由 tools/build_pages.js 產生）
sheng/ cheng/ chameleon/ lucas/index.html   四個專屬頁（由 tools/build_pages.js 產生，只有 <head> 和空殼）
css/base.css              共用元件：開場、主角區、LINE 大格、OX 工具、社群按鈕
css/themes.css            四個人的整頁背景、主色、互動動畫（.theme-snr / mono / jungle / night）
js/data.js                所有內容：人物、主業、連結、照片、頁面 title 與 og 文字  ← 改內容只改這裡
js/themes.js              四個人的場景產生器（scene）、開場後動作（start）、碰到時的互動（act）
js/page.js                依 body[data-person] 把 data.js 畫成頁面，處理開場、入場、互動觸發
assets/img/avatars/       圓形透明頭像 PNG（320×320，圓剛好貼齊邊）
tools/build_pages.js      產生五個 index.html
tools/crop_circle.py      頭像裁切
tools/preview.py          截圖、錄影、滑動 FPS 量測，輸出到 previews/（不進 git）
```

## 每頁內容（四頁都一樣的排列）

1. 開場：一根 K 線從底部衝上來炸開成整頁，顏色是那個人的主色，下面閃過名字。約 1.9 秒，點一下跳過。
2. 主角：大頭像（136px 圓框，四頁同大小同位置）、名字、帳號、主業（只有已驗證的才寫）、自己的 YT / IG / Threads 小按鈕。
3. LINE 官方：LINE 綠大格，「LINE 點擊領取免費教材」，邊框流光一直繞，整格輕微呼吸放大。
4. LINE 社群：LINE 綠大格，邊框流光反向繞。
5. OX 工具：OX 台股、OX 加密、合成市場三個大格，用那個人的主色描邊。

## 四個人的整頁風格

| 人 | 背景 | 互動（手指碰到畫面任何地方；電腦滑鼠滑過頭像或連結區） |
|---|---|---|
| 阿聖 `snr` | 暗紅交易室：格線、支撐壓力虛線（R1 R2 S1 S2）、底部跑馬燈、直排 TRADING ROOM、斜向封面主光，頭像有雜誌光澤 | K 線從左到右一根根長出來，一道封面光帶斜掃過整頁（1.6 秒）。開場結束自動演示一次 |
| 老承 `mono` | 冷調黑灰拉絲金屬、細白光線、淡灰 K 棒 | 一道白光慢慢掃過整頁（2.2 秒），頭像框跟著亮。開場結束自動演示一次 |
| 交易變色龍 `jungle` | 叢林霓虹：藤蔓光線流動、葉片、彩色光點往上飄、鱗片每 3.2 秒換色（青綠、草綠、藍紫、金橘） | 點的位置閃出一枚金幣光，頭像彈一下，鱗片立刻換色 |
| Lucas `night` | 紫金夜景：極光暈、散景光點飄、三道燈串拱門跑燈、鐵塔線條、底部城市窗戶一格一格亮 | 全部窗戶齊亮＋金紫光爆。開場結束自動演示一次 |

## 改內容

全部在 `js/data.js`：

| 欄位 | 用途 |
|---|---|
| `lineOfficial` / `lineCommunity` / `tools` | 四頁共用的三組連結 |
| `people[].id` | 網址路徑（`/sheng/`） |
| `name` / `handle` | 名字、帳號 |
| `role` / `tags` | 主業和標籤；空字串就不顯示。沒查證的不要寫 |
| `verified` / `source` | 主業有沒有查證、出處（只給維護的人看） |
| `photo` / `photoNote` | 頭像路徑、照片目前來源 |
| `theme` / `themeBrief` | 風格代號、使用者給的方向 |
| `links.yt` / `links.ig` / `links.threads` | 沒有的平台刪掉那一行，按鈕就不出現 |
| `pageTitle` / `ogDescription` | 分頁標題、分享預覽文字 |

改了 `pageTitle`、`ogDescription`、`photo` 或新增人之後：

```bash
node tools/build_pages.js
# 部署後 og:image 需要完整網址，LINE / FB / Threads 才抓得到預覽圖：
SITE=https://你的帳號.github.io/repo名稱/ node tools/build_pages.js
```

新增一個人：在 `people` 複製一筆改內容，`theme` 選現有四種之一（或在 themes.css + themes.js 加新的），再跑 build。

## 換頭像

```bash
# App 截圖（圓形頭像外面有灰色）：自動偵測圓心半徑，圓外變透明，內縮 4px 避免灰邊
python3 tools/crop_circle.py 截圖.jpg assets/img/avatars/sheng.png --size 320 --inset 4
# 本來就是正方形大頭貼
python3 tools/crop_circle.py 大頭貼.jpg assets/img/avatars/xxx.png --mode square --size 320 --inset 2
# 白底插圖：去背，另存 xxx_cutout.png，再置中放進同樣大小的圓
python3 tools/crop_circle.py 插圖.png assets/img/avatars/chameleon.png --mode cutout --size 320
```

需要 Python 3、Pillow、numpy、scipy。

## 本地預覽與截圖

```bash
cd v2
python3 -m http.server 8765
# 開 http://localhost:8765/sheng/ 等，用開發者工具切到 390×844
python3 tools/preview.py   # 需要 Playwright；錄影另需 python3 -m playwright install ffmpeg 和系統 ffmpeg
```

## 效能與無障礙

- 動畫只動 transform、opacity（SVG 跑燈用 stroke-dashoffset），沒有 canvas、沒有每格重算的濾鏡。
- 最多的 Lucas 頁約 380 個 DOM 節點（大多是窗戶格）。
- `prefers-reduced-motion`：不播開場、不跑動畫，靜態顯示（K 線直接長好、部分窗戶亮著）。
- 只能上下滑：`overflow-x` 擋住，所有裝飾都在 `overflow: hidden` 的固定場景裡。

## 給接手的人（或 AI）

- 文案不要用破折號、不要用 emoji 條列。
- 不要把圖片轉成 base64 塞進 HTML；圖放 `assets/`。
- 連結去掉追蹤參數。
- 四個 `*/index.html` 和根目錄 `index.html` 是產生出來的，改 `js/data.js` 再跑 `node tools/build_pages.js`，不要手改。
