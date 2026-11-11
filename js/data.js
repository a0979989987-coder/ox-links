/*
  OX 連結頁 v2 的所有內容資料。
  四位創作者各有一個專屬連結頁：/sheng/、/cheng/、/chameleon/、/lucas/（id 就是網址路徑）。
  要改連結、人名、主業、照片，只改這個檔案。
  改了 pageTitle 或 ogDescription（分享預覽用）之後，跑一次 node tools/build_pages.js 重新產生四個 index.html 的 <head>。
  路徑一律寫相對於 repo 根目錄（assets/...），子頁面會自動補 ../。

  照片：放在 assets/img/，photo 填檔名路徑；留空字串 "" 會顯示「照片待提供」佔位。
  theme：卡片背景風格（已定案）。"snr" 暗紅交易室、"mono" 冷調黑灰白光、"jungle" 叢林霓虹變色龍、"night" 紫金夜景。
         樣式在 css/style.css 的 .theme-xxx，背景圖樣和互動在 js/app.js 的 THEMES。
  role：主業，空字串＝不顯示（沒查證的不要寫）。handle：顯示在名字下的帳號。
  verified：false 只是給維護的人看的註記，頁面不會顯示。
  themeBrief：使用者對這個人背景風格的方向，給之後做設計的人參考。
*/
window.OX_DATA = {
  brand: {
    name: "Snsheng",
    sub: "OX.Trading 創作者",
    avatar: "assets/img/avatars/snsheng.png"  // 原站 avatar.jpg 裁成圓形
  },

  // 以下三組（LINE 官方、LINE 社群、OX 工具）四個人的頁面都會放
  // LINE 官方帳號（最大、最明顯的一格）
  lineOfficial: {
    title: "LINE 官方帳號",
    desc: "加入好友，免費教材直接傳給你",
    button: "LINE 點擊領取免費教材",
    url: "https://lin.ee/TAWUaY2"
  },

  // LINE 社群（沿用原站 https://a0979989987-coder.github.io/snsheng/ 的社群連結）
  lineCommunity: {
    title: "OX.Trading AI 討論群",
    desc: "LINE 社群，進來一起聊盤",
    button: "加入 LINE 社群",
    url: "https://line.me/ti/g2/FXj0yahd04U4JecSoC4uPInXiqhLulqdCl54Ag"
  },

  // OX 工具（照原站保留）
  tools: [
    { label: "OX 台股", icon: "i-candle", url: "https://oxpattern.com" },
    { label: "OX 加密", icon: "i-coin", url: "https://ox-crypto-independent.vercel.app" },
    { label: "合成市場", icon: "i-merge", url: "https://merge-market.btcfly.chatgpt.site" }
  ],

  // 五位創作者。links 裡沒有的平台就不顯示按鈕（例如 lucas 沒有 YouTube）。
  people: [
    {
      id: "sheng",
      pageTitle: "阿聖聊交易｜加密貨幣技術分析",
      ogDescription: "阿聖聊交易的 YouTube、Instagram、Threads。ICT、SNR 支撐壓力交易分享，LINE 點擊領取免費教材。",
      name: "阿聖聊交易",
      role: "加密貨幣技術分析",
      handle: "@shengtrader_snr",
      tags: ["ICT", "SNR 支撐壓力", "BTC"],
      verified: true,
      source: "YouTube 頻道簡介：【加密貨幣|技術分析|區塊鏈】ICT SNR TRADER",
      photo: "assets/img/avatars/sheng.png",
      photoNote: "暫用 YouTube 頻道大頭貼；使用者的 App 截圖到了要換（tools/crop_circle.py 預設 detect 模式）",
      theme: "snr",
      themeBrief: "暗紅交易室；滑過或碰到時 K 線一根根長出來，雜誌封面般的光影打在頭像和卡片上",
      links: {
        yt: "https://www.youtube.com/@shengtrader_snr",
        ig: "https://www.instagram.com/ox.trading.tw",
        threads: "https://www.threads.com/@shengtrader_snr"
      }
    },
    {
      id: "cheng",
      pageTitle: "老承｜台股解盤與產業分析",
      ogDescription: "老承的 YouTube、Instagram、Threads。台股解盤與產業分析，LINE 點擊領取免費教材。",
      name: "老承",
      role: "台股解盤與產業分析",
      handle: "@Cryptocheng",
      tags: ["台股", "產業分析", "BTC"],
      verified: true,
      source: "YouTube 頻道名稱「老承 產業分析 BTC交易分析」與簡介「分享台北股市的每日分析解盤」",
      photo: "assets/img/avatars/cheng.png",
      photoNote: "暫用 YouTube 頻道大頭貼；使用者的 App 截圖（黑 polo、雙手交叉側臉）到了要換",
      theme: "mono",
      themeBrief: "冷調黑灰；手指碰到時一道白光掃過整張卡",
      links: {
        yt: "https://www.youtube.com/@Cryptocheng",
        ig: "https://www.instagram.com/cryptocheng_",
        threads: "https://www.threads.com/@cryptocheng_"
      }
    },
    {
      id: "chameleon",
      pageTitle: "交易變色龍",
      ogDescription: "交易變色龍的 YouTube、Instagram、Threads，LINE 點擊領取免費教材，加入 OX.Trading 社群。",
      name: "交易變色龍",
      role: "",            // 主業未驗證，頁面上不寫主業
      handle: "@kampbel1",
      tags: [],
      verified: false,
      source: "YouTube 頻道（Kampbell Cheng）沒有簡介也沒有影片，主業待本人提供",
      photo: "assets/img/avatars/chameleon.png",
      photoCutout: "assets/img/avatars/chameleon_cutout.png",
      photoNote: "Threads @kampbel1 大頭貼去白底，跟使用者描述的圖相同（變色龍抱比特幣）",
      theme: "jungle",
      themeBrief: "叢林霓虹底，藤蔓和光點流動，青綠鱗片慢慢變色；點下去金幣閃一下、鱗片換色",
      links: {
        yt: "https://www.youtube.com/@heejun0330",
        ig: "https://www.instagram.com/heejun0330/",
        threads: "https://www.threads.com/@kampbel1"
      }
    },
    {
      id: "lucas",
      pageTitle: "Lucas",
      ogDescription: "Lucas 的 Instagram、Threads，LINE 點擊領取免費教材，加入 OX.Trading 社群。",
      name: "Lucas",
      role: "",            // 主業未驗證，頁面上不寫主業
      handle: "@gorani.___",
      tags: [],
      verified: false,
      source: "沒有 YouTube；只從 Threads 顯示名稱 Crypto_Lucas 推測，未驗證",
      photo: "assets/img/avatars/lucas.png",
      photoNote: "暫用 Threads @gorani.___ 大頭貼；使用者傳的夜景照到了要換",
      theme: "night",
      themeBrief: "紫金夜景；散景光點飄動，建築燈光一格一格亮起（照片是澳門巴黎人鐵塔夜景）",
      links: {
        ig: "https://www.instagram.com/gorani.___",
        threads: "https://www.threads.com/@gorani.___"
      }
    }
  ]
};
