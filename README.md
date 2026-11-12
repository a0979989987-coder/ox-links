# OX 創作者連結頁（link-in-bio）

四位創作者各一個專屬連結頁，四頁是四套完全不同的設計語言（版型、卡片材質、字體、按鈕形狀、LINE 呈現、捲動敘事、觸控互動都不一樣），只共用最底層的工具列、入場觸發、底部 LINE 條和音效。沒有開場動畫，打開就直接顯示。
內容從 `js/data.js`（人物、連結）和 `js/videos.js`（YouTube 最新影片，腳本抓的）讀。純 HTML / CSS / JS，手機直接開。
原站 https://a0979989987-coder.github.io/snsheng/ 不受影響。

| 網址 | 創作者 | 設計語言 |
|---|---|---|
| `/sheng/` | 阿聖聊交易 | 財經雜誌 × 交易終端機：紅黑高對比、硬邊、細格線 |
| `/cheng/` | 老承 | 冷調黑灰極簡精品：研究報告目錄、拉絲金屬、細白線、襯線字 |
| `/chameleon/` | 交易變色龍 | 叢林霓虹遊戲：有機曲線、鱗片、圓胖 3D 卡、整頁主色一直變 |
| `/lucas/` | Lucas | 紫金夜景時尚海報：照片整版出血、霓虹字、散景、拍立得橫滑 |
| `/` | 四人入口（簡單列表） | |

線上網址（GitHub Pages，repo https://github.com/a0979989987-coder/ox-links）與短網址：

| 頁面 | 線上 | 短網址 |
|---|---|---|
| 阿聖 | https://a0979989987-coder.github.io/ox-links/sheng/ | https://reurl.cc/p8l6v4 |
| 老承 | https://a0979989987-coder.github.io/ox-links/cheng/ | https://reurl.cc/6Xo5d6 |
| 交易變色龍 | https://a0979989987-coder.github.io/ox-links/chameleon/ | https://reurl.cc/jVzDyL |
| Lucas | https://a0979989987-coder.github.io/ox-links/lucas/ | https://reurl.cc/beQ936 |

短網址指向上面的路徑，路徑不要改。

> 頭像和封面照都是暫用版（公開大頭貼 / 頻道圖），使用者會重傳原照。

## 結構

```
index.html, sheng/ cheng/ chameleon/ lucas/index.html   由 tools/build_pages.js 產生（<head>、字體、og、空殼）
css/core.css      共用：reset、聲音/分享工具列、toast、.rv 入場、入口頁、reduced-motion
css/<id>.css      各頁自己的全部樣式
js/data.js        人物、主業、介紹、連結、LINE 兩格、OX 工具   ← 改內容改這裡
js/videos.js      YouTube 最新影片（tools/fetch_youtube.py 產生，不要手改）
js/core.js        window.OX：資料、圖示、音效 SND、工具列、入場 reveal（首屏的直接顯示）、start、底部 LINE 條 dock
js/<id>.js        各頁自己的版面與互動
js/hub.js         根目錄入口
assets/img/avatars/  圓形透明頭像 PNG；chameleon_cutout.png 去背插圖
assets/img/cover/    封面照（暫用）
assets/img/yt/       影片縮圖（腳本下載）
tools/build_pages.js     產生五個 index.html
tools/fetch_youtube.py   從 YouTube 公開 RSS 抓最新影片
tools/crop_circle.py     頭像裁切
tools/preview.py         截圖、示範影片、fps、reduced-motion、溢出、LINE 首屏位置、OX 工具名稱單行檢查 → previews/（不進 git）
```

## 四頁設計對照

| | 阿聖 | 老承 | 交易變色龍 | Lucas |
|---|---|---|---|---|
| 版型 | 雜誌封面＋目錄「In this issue」 | 研究報告封面＋章節 01 到 04（頻道卡、重點條列、影片格子、工具卡） | 遊戲關卡 | 時尚海報，橫滑拍立得 |
| 背景 | 2D canvas 紅黑 K 線從底部長滿整頁，捲動會推進、支撐壓力區跟著章節亮（沒有任何光影掃過） | 拉絲金屬紋理、細格線、走勢線、浮塵＋整頁慢速白光掃過（3 秒），銀色主題詞跑馬燈帶 | WebGL 霓虹葉脈＋鱗片 shader，藤蔓隨捲動長 | 上半部海報照片（捲動放大、視差）、底片顆粒、散景光點、城市窗戶逐格亮起後保持亮著（不閃） |
| 卡片材質 | 硬邊、黑底、紅線 | 金屬報告封面、直式照片框、冷藍細線、細框卡片（按下浮起、銀光掃過） | 圓胖 3D 糖果卡、貼紙 | 霓虹招牌、拍立得相紙 |
| 字體 | Oswald、JetBrains Mono、Noto Serif TC 900 | Cormorant Garamond、Noto Serif TC 300 | Fredoka、Noto Sans TC 900 | Bebas Neue、Yellowtail、Noto Sans TC 300 |
| LINE 官方 | 「ORDER TICKET」下單單，跑馬虛線框 | 邀請函，銀綠流光框 | 「免費寶箱」，彩虹框 | 綠色霓虹招牌，進畫面柔和亮起 |
| LINE 社群 | 交易室列 | 報告表格列 | 對話泡泡 | 霓虹框列 |
| OX 工具 | 終端機指令列 | A / B / C 表格列 | 圓形關卡 1 2 3 | 拍立得 |
| 觸控 | 十字準星跟手指、標支撐/壓力；點一下 K 線重長＋低音 | 金屬光澤跟角度轉；點一下白光掃過＋鐘聲 | 主色跳換、每次 10 枚金幣（畫面最多 30 枚）、計數器；金幣聲 | 聚光燈跟手指；點一下（滑動不算）柔和閃一次＋快門聲，1.5 秒內不重複 |

四頁的 LINE 官方大格和 LINE 社群列都整個在首屏內，不用捲動，也不會被底部 LINE 條蓋住。用 iPhone Safari 的保守可視高度檢查：390×664、375×600，加上 390×844；`tools/preview.py` 量位置寫進 report.json。YT / IG / Threads、OX 工具、影片都放在下面。

老承的背景另有一層 canvas（`#field`）：慢慢漂的細格線、三條細白走勢線往左捲（純裝飾，沒有數字）、緩慢下移的掃描線、白光掃過時會變亮的浮塵，捲動時各層視差不同；銘板和邀請函邊角偶爾有四芒星閃光、上緣有細光沿邊跑。全部單色。

四頁都有：聲音開關（預設關，記在 localStorage）、分享鈕、捲動入場、底部固定 LINE 官方條（LINE 官方大格露出一半以上、或 LINE 社群列在畫面上時收起）。

## 真實資料

- 阿聖、老承的介紹文字取自各自 YouTube 頻道「關於」頁，不改寫內容。
- 影片：`python3 tools/fetch_youtube.py`，讀 `https://www.youtube.com/feeds/videos.xml?channel_id=...`（阿聖 UCede9wX8CQv4DIDuoBo0xmw、老承 UC7t6GK7IyjX__qIz6IVsCKw），去 hashtag、emoji、網址，重複標題只留一支，各留 6 支，下載 mqdefault 縮圖。抓取時間寫在 `videos.js` 的 `fetchedAt`，頁面上也會顯示。抓不到就不顯示影片區。
- 交易變色龍頻道沒有公開影片、也沒有簡介，所以頁面只放已確認的名稱與帳號。Lucas 同理，不寫主業。
- 不放追蹤數、價格等會過期或無法查證的數字；阿聖的跑馬燈只有術語。

## 改內容

改 `js/data.js` 後，如果動到 `pageTitle`、`ogDescription`、照片或新增人：

```bash
node tools/build_pages.js
# 部署後 og:image 要完整網址，LINE / FB / Threads 才抓得到預覽圖：
SITE=https://你的帳號.github.io/repo名稱/ node tools/build_pages.js
```

新增一個人需要另外寫 `css/<id>.css` 和 `js/<id>.js`（每頁是獨立設計），並在 build_pages.js 的 FONTS、色彩表加一筆。

## 換頭像

```bash
python3 tools/crop_circle.py 截圖.jpg assets/img/avatars/sheng.png --size 320 --inset 4      # App 截圖，自動找圓
python3 tools/crop_circle.py 大頭貼.jpg assets/img/avatars/xxx.png --mode square --size 320 --inset 2
python3 tools/crop_circle.py 插圖.png assets/img/avatars/chameleon.png --mode cutout --size 320   # 白底去背
```

封面照放 `assets/img/cover/<id>.jpg`（正方形或直式，建議 1080px 以上）。

## 本地預覽

```bash
cd v2 && python3 -m http.server 8765      # 開 http://localhost:8765/sheng/
python3 tools/preview.py                  # 需要 Playwright、Pillow、系統 ffmpeg（另跑 python3 -m playwright install ffmpeg）
```

輸出 `previews/<id>_first.png`（390×664）、`<id>_first_375x600.png`、`<id>_first_390x844.png`、`<id>_full.png`、`all_four.png`、`demo_four.mp4`、`report.json`（錯誤、scrollWidth、捲動 fps、reduced-motion、頁面連結、每種尺寸的 LINE 兩格位置、OX 工具名稱行數）。

## 效能與無障礙

- 動畫以 transform / opacity 為主；canvas 限制 devicePixelRatio 1.5 以下並降幀（WebGL 半解析度約 40fps），分頁隱藏時暫停。
- `prefers-reduced-motion`：canvas 背景停止或靜態，入場直接顯示，點擊特效關閉。
- 整頁只能上下滑（scrollWidth = 390）；Lucas 拍立得區塊內可橫滑。


## OX Trading 會員首頁

之後要取代根目錄的四人簡單列表，變成交易所註冊的入口。整站做完了，還沒搬到根目錄：現在放在 `preview-7k3q/`（noindex，沒有任何地方連過去），根目錄和四個老師頁都沒動。

```
home/data.js    內容：LINE、五位老師（短網址、顏色、邀請連結）、交易所介紹、流程文字、作品、交易法原句、常見問題   ← 改內容改這裡
home/btc.js     K 線轉場和黑卡金箔線用的比特幣日線（幣安現貨，2024-10-10 到 11-22，真實資料）
home/app.js     版面與互動：黑卡、LINE 兩格、側邊選單、五張老師卡、作品、交易法、聲音
home/kline.js   K 線：黑底 → 白金的轉場（突破前高那一下黑底碎掉）、四個交易法的小動畫
home/join.js    註冊流程四步、註冊教學、常見問題；表單送到 data.js 的 api
home/fx.js      粒子引擎（純 WebGL）：星系、五股光落成五張卡、星系被吸進黑卡、白金頁的金色微塵
home/home.css   樣式：前兩頁照 OX App 的黑色白光，第三頁白金；粒子金色，點綴用 logo 的藍
home/img/       logo（使用者給的原圖）、Bitget 和 BingX 官方圖示
home/media/     三個 OX 工具的手機截圖、八支 K 線故事片的 6 秒無聲預覽
backend/        Google 試算表後台（Apps Script）：Code.gs、設定說明.md、本機測試。只放在使用者電腦，沒有進這個倉庫
preview-7k3q/   預覽入口
```

- 三個世界一路往下換：宇宙（第一頁）→ 黑底（小老師）→ 白金（作品、交易法）。
- 第一頁是一張黑卡（會員卡），照真卡比例做。卡面的金箔線就是 `btc.js` 那一段 K 線。
- 同一個畫面只放一個 logo：第一頁在黑卡上；滑過黑卡，上方列的品牌才出現；最後那張黑卡進畫面，上方列的再收起來。
- 黑卡、LINE 官方、LINE 社群要整個在 iPhone 第一個畫面內，不等任何動畫就能點。
- 註冊流程用網址的 `#` 記位置：`#join`、`#join/<老師代號>`、`#join/<老師代號>/uid`、`#join/done`、`#guide`、`#faq`。老師可以把 `…/#join/sheng` 這種網址直接掛在自己的連結頁，訪客跳過「選老師」。
- `data.js` 的 `api` 留空時，表單走得完但資料不會送出，等待頁會寫明。後台設定照 `backend/設定說明.md`，拿到 `/exec` 網址填進 `api`。
- 「已經有帳號」那段說明不能改回「重新註冊一個」：兩家交易所的條款都禁止一人多帳號，同一張證件只能認證一個帳號（查證在使用者電腦的 `_work/交易所帳號規定.md`）。
- K 線的畫法有規則：K 棒照 開→低→高→收 的順序長、影線只畫走過的、每根一樣寬；加密用藍白 K（漲 #6d98d4、跌 #fbfaf6）；結構線是頂 → 底 → 突破點，底在突破那一刻才確認。
- 檢查用網址參數：`?dpr=1.5` 固定解析度、`?n=8000` 粒子數。Safari 上不在中途改畫布解析度。
- 上線＝把 `preview-7k3q/index.html` 搬到根目錄（`../home/` 改成 `home/`、`data-root` 改成空字串、拿掉 noindex、補 og 標籤），原本的四人列表就被取代。

## 給接手的人（或 AI）

- 文案不要用破折號、不要用 emoji 條列。不要寫沒查證的主業或數字。
- 不要把圖片轉 base64 塞進 HTML。
- 連結去掉追蹤參數。
- 五個 `index.html` 是產生的，不要手改。
