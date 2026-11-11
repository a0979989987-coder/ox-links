/*
  OX 連結頁 v2 的所有內容資料。
  要改連結、人名、主業、照片，只改這個檔案就好，不用動 index.html 或 app.js。

  照片：放在 assets/img/，photo 填檔名路徑；留空字串 "" 會顯示「照片待提供」佔位。
  theme：卡片背景風格代號（暫定，風格還在跟使用者討論）。目前草稿用 "snr"、"mono"、"chameleon"、"neon"。
  themeBrief：使用者對這個人背景風格的方向，給之後做設計的人參考。
  verified：false 代表主業還沒查證，卡片會顯示「主業未驗證」。
*/
window.OX_DATA = {
  brand: {
    name: "Snsheng",
    sub: "OX.Trading 媒體頻道",
    avatar: "assets/img/avatars/snsheng.png"  // 原站 avatar.jpg 裁成圓形
  },

  // 四頁規劃。目前只有第一頁做好，其他頁 ready: false 會顯示「即將推出」。
  pages: [
    { id: "media", label: "媒體頻道", ready: true },
    { id: "p2", label: "第二頁", ready: false },
    { id: "p3", label: "第三頁", ready: false },
    { id: "p4", label: "第四頁", ready: false }
  ],

  // LINE 官方帳號（最大、最明顯的一格）
  lineOfficial: {
    title: "LINE 官方帳號",
    desc: "加入官方帳號，免費教材直接傳給你",
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
      name: "阿聖聊交易",
      role: "加密貨幣技術分析",
      tags: ["ICT", "SNR 支撐壓力", "BTC"],
      verified: true,
      source: "YouTube 頻道簡介：【加密貨幣|技術分析|區塊鏈】ICT SNR TRADER",
      photo: "assets/img/avatars/sheng.png",
      photoNote: "暫用 YouTube 頻道大頭貼；使用者的 App 截圖到了要換（tools/crop_circle.py 預設 detect 模式）",
      theme: "snr",
      themeBrief: "暗紅／黑的交易員風",
      links: {
        yt: "https://www.youtube.com/@shengtrader_snr",
        ig: "https://www.instagram.com/ox.trading.tw",
        threads: "https://www.threads.com/@shengtrader_snr"
      }
    },
    {
      id: "cheng",
      name: "老承",
      role: "台股解盤與產業分析",
      tags: ["台股", "產業分析", "BTC"],
      verified: true,
      source: "YouTube 頻道名稱「老承 產業分析 BTC交易分析」與簡介「分享台北股市的每日分析解盤」",
      photo: "assets/img/avatars/cheng.png",
      photoNote: "暫用 YouTube 頻道大頭貼；使用者的 App 截圖（黑 polo、雙手交叉側臉）到了要換",
      theme: "mono",
      themeBrief: "冷調黑灰，加一道細白光",
      links: {
        yt: "https://www.youtube.com/@Cryptocheng",
        ig: "https://www.instagram.com/cryptocheng_",
        threads: "https://www.threads.com/@cryptocheng_"
      }
    },
    {
      id: "chameleon",
      name: "交易變色龍",
      role: "未驗證",
      tags: ["Kampbell Cheng"],
      verified: false,
      source: "YouTube 頻道（Kampbell Cheng）沒有簡介也沒有影片，主業待本人提供",
      photo: "assets/img/avatars/chameleon.png",
      photoCutout: "assets/img/avatars/chameleon_cutout.png",
      photoNote: "Threads @kampbel1 大頭貼去白底，跟使用者描述的圖相同（變色龍抱比特幣）",
      theme: "chameleon",
      themeBrief: "青綠鱗片配金幣光，加密幣感",
      links: {
        yt: "https://www.youtube.com/@heejun0330",
        ig: "https://www.instagram.com/heejun0330/",
        threads: "https://www.threads.com/@kampbel1"
      }
    },
    {
      id: "lucas",
      name: "Lucas",
      role: "加密貨幣",
      tags: ["Crypto"],
      verified: false,
      source: "沒有 YouTube；只從 Threads 顯示名稱 Crypto_Lucas 推測，未驗證",
      photo: "assets/img/avatars/lucas.png",
      photoNote: "暫用 Threads @gorani.___ 大頭貼；使用者傳的夜景照到了要換",
      theme: "neon",
      themeBrief: "時尚夜景，紫金光暈（照片是澳門巴黎人鐵塔夜景）",
      links: {
        ig: "https://www.instagram.com/gorani.___",
        threads: "https://www.threads.com/@gorani.___"
      }
    }
  ]
};
