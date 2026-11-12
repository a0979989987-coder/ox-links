/*
  OX Trading 會員首頁的內容資料。要改連結、人名、文字，只改這個檔案。
  圖片路徑寫相對於 repo 根目錄（assets/...、home/...），頁面會自動補上自己的層級。
  老師順序＝小老師那一頁的排列順序。join 留空的老師（老承）只出現在小老師那一頁，不在註冊流程裡。
*/
window.OXH = {
  brand: "OX Trading",

  // 後台：Apps Script 部署好之後，把 /exec 結尾的網址填進 api，表單才會真的送出去（做法在 backend/設定說明.md）。
  // 留空的時候表單走得完，但資料不會送出，等待頁會寫明。
  api: "",
  // 「用 Google 帶入」要的用戶端 ID；留空就不顯示那顆按鈕
  googleClientId: "",

  // logo：永盛 11/12 給的原圖（白底，炭黑＋亮藍），網站上顯示的都是它
  logo: { img: "home/img/logo.png" },

  line: {
    official: { title: "LINE 官方", desc: "加好友領免費教材", url: "https://lin.ee/SJ4F4Jq" },
    community: { title: "LINE 社群", desc: "進來一起聊盤", url: "https://line.me/ti/g2/FXj0yahd04U4JecSoC4uPInXiqhLulqdCl54Ag?utm_source=invitation&utm_medium=link_copy&utm_campaign=default" }
  },

  // 會員拿得到的、條件（永盛 11/12 定的；ruleNote 是他的原話）
  member: {
    perks: ["進階教材", "OX 加密進階功能"],
    rule: "完成 KYC、淨入金滿 100 USDT",
    ruleNote: "系統根據交易所後台達標發送",
    conds: ["用老師的連結註冊", "完成 KYC", "淨入金滿 100 USDT"]
  },

  // 小老師。page＝永盛給的短網址；color＝五股光和卡片邊框的顏色；join＝註冊流程用的邀請連結
  teachers: [
    {
      id: "snsheng", name: "易中生Snsheng", zh: "易中生", en: "Snsheng", sub: "雙極交易法",
      page: "https://reurl.cc/VnV81R", avatar: "assets/img/avatars/snsheng.png", color: "#e3c47e",
      join: { bitget: "https://partner.bitget.com/bg/naxg9b1r", bingx: "https://bingxzone.com/invite/QCM2IQ" }
    },
    {
      id: "sheng", name: "阿聖聊交易", zh: "阿聖", tail: "聊交易", sub: "加密貨幣技術分析",
      page: "https://reurl.cc/p8l6v4", avatar: "assets/img/avatars/sheng.png", cover: "assets/img/cover/sheng.jpg", color: "#ff3b2e",
      join: { bitget: "https://partner.bitget.com/bg/0N0M2Q", bingx: "https://bingxzone.com/invite/CG1WOJ/" }
    },
    {
      id: "chameleon", name: "交易變色龍", sub: "Kampbell Cheng", handle: "@kampbel1",
      page: "https://reurl.cc/jVzDyL", avatar: "assets/img/avatars/chameleon.png", cutout: "assets/img/avatars/chameleon_cutout.png", color: "#35e0c2",
      join: { bitget: "https://partner.bitget.com/bg/D7FCPK", bingx: "https://bingxzone.com/invite/ZM8VXB" }
    },
    {
      id: "lucas", name: "Lucas", sub: "Crypto_Lucas", handle: "@gorani.___",
      page: "https://reurl.cc/beQ936", avatar: "assets/img/avatars/lucas.png", cover: "assets/img/cover/lucas.jpg", color: "#c99bff",
      join: { bingx: "https://bingxzone.com/partner/Lucifer" }
    },
    {
      id: "cheng", name: "老承", sub: "台股解盤與產業分析",
      page: "https://reurl.cc/6Xo5d6", avatar: "assets/img/avatars/cheng.png", cover: "assets/img/cover/cheng.jpg", color: "#d9dde3",
      join: null
    }
  ],

  // 交易所。intro 只寫官方自己講的成立年份和產品（2026-11-12 查官方頁面），不放會過期的數字。
  // uid＝官方幫助中心寫的 App 找 UID 的步驟（Bitget 2024-04、BingX 2023-08 的說明；BingX 對過 2026-10-30 的真機畫面）
  exchanges: {
    bitget: {
      name: "Bitget", logo: "home/img/bitget.png",
      intro: "2018 年成立的加密貨幣交易所，有現貨、合約和跟單交易。",
      uid: ["打開 Bitget App，登入", "點主頁左上角的頭像", "點「個人資料」", "UID 就在畫面上，點一下可以複製"]
    },
    bingx: {
      name: "BingX", logo: "home/img/bingx.png",
      intro: "2018 年成立的加密貨幣交易所，有現貨、永續合約和跟單交易。",
      uid: ["打開 BingX App，登入", "點首頁左上角的頭像", "UID 在帳號名稱下面那一行", "旁邊有複製鍵，點一下"]
    }
  },

  // 註冊流程
  flow: {
    steps: ["選老師", "註冊交易所", "填 UID", "等審核"],
    askTitle: "你是看誰的內容來的？",
    askNote: "選一位，下一步用他的連結註冊",
    none: "都不是，我自己找到的",
    noneTeacher: "snsheng",   // 「都不是」用誰的連結
    how: [
      "點上面的按鈕，用這條連結註冊一個新帳號。",
      "在交易所完成 KYC。",
      "淨入金滿 100 USDT。入金減掉出金，要有 100 以上。",
      "回來這裡填 UID。註冊完就可以先填。"
    ],
    // 兩家的條款都禁止一人多帳號、同一張證件只能認證一個帳號（查證在 _work/交易所帳號規定.md），所以不叫人自己重開
    oldAccount: "已經有 Bitget 或 BingX 帳號的人，先不要自己再開一個。兩家都規定一個人只能有一個帳號，同一張證件也只能認證一次，重開會卡在身分認證。先到 LINE 官方跟我們說，我們再告訴你怎麼做。",
    exp: [["new", "新手"], ["lt1", "一年內"], ["1to3", "一到三年"], ["gt3", "三年以上"]],
    learn: [["dual", "雙極交易法"], ["ict", "ICT／SMC"], ["snr", "SNR 支撐壓力"], ["nakedk", "裸 K／型態"]],
    agree: "這個 UID 是用上面那條連結註冊的新帳號",
    privacy: "這些資料只用來核對註冊和寄教材。"
  },

  // 第三頁：作品
  works: {
    tools: [
      { name: "OX 台股", desc: "雷達、篩選器、型態畫板、泡泡圖", shot: "home/media/shot-ox-tw.jpg", url: "https://oxpattern.com" },
      { name: "OX 加密", desc: "篩選雷達、形態搜尋、泡泡圖、熱力圖、資金輪動", shot: "home/media/shot-ox-crypto.jpg", url: "https://ox-crypto-independent.vercel.app" },
      { name: "合成市場", desc: "台股、美股、加密、外匯的合成球遊戲", shot: "home/media/shot-merge.jpg", url: "https://merge-market.btcfly.chatgpt.site" }
    ],
    // K 線故事片：6 秒無聲預覽（跟個人網站影片牆同一批），點了去 IG
    filmsUrl: "https://www.instagram.com/btcfly/",
    films: [
      { id: "taiex60", title: "台股 60 年" }, { id: "btc", title: "比特幣" }, { id: "tw400", title: "台灣 400 年" },
      { id: "rallies", title: "台股最強 7 次上漲" }, { id: "musk", title: "如果馬斯克是一檔股票" }, { id: "gold", title: "黃金" },
      { id: "swan", title: "台股 5 大黑天鵝" }, { id: "apple", title: "蘋果的人生 K 線圖" }
    ],
    // 教學短片：直接用四個老師頁那份 YouTube 最新影片（js/videos.js），每個頻道取前幾支
    shorts: [{ teacher: "sheng", take: 4 }, { teacher: "cheng", take: 4 }]
  },

  // 第三頁：交易法介紹。quotes 只放本人講過的原話（出處在 _work/文案素材包.md），anim＝kline.js 裡的小動畫
  methods: [
    {
      id: "dual", name: "雙極交易法", by: ["snsheng"], anim: "structure",
      quotes: [
        { t: "雙極指買方和賣方兩極的分歧。把市場想成天秤：交易只是在判斷天秤現在倒向哪一邊。" },
        { t: "上漲時，頂分型形成頂。頂被突破，就是創出新結構。" },
        { t: "選擇不做什麼，比做什麼重要。" }
      ]
    },
    {
      id: "ict", name: "ICT／SMC", by: ["sheng", "cheng"], anim: "fvg",
      quotes: [
        { t: "簡單來說流動性就是止損訂單的意思", who: "sheng" },
        { t: "市場往往會傾向回到失衡區重新做平衡", who: "sheng" },
        { t: "訂單塊顧名思義就是訂單密集區域", who: "cheng" },
        { t: "先看結構，後做方向", who: "cheng" }
      ]
    },
    {
      id: "snr", name: "SNR 支撐壓力", by: ["sheng"], anim: "snr",
      quotes: [
        { t: "簡單的說，就是傳統技術分析的支撐與阻力，差別呢，就是 SNR 它會忽略掉上影線以及下影線的位置" },
        { t: "它更像是一種觀察與輔助判斷市場結構的工具" }
      ]
    },
    {
      id: "nakedk", name: "裸 K／型態", by: ["snsheng"], anim: "boxes",
      quotes: [
        { t: "突破和跌破都一樣，影線碰到就算。" },
        { t: "一段過去都沒被跌破的走勢裡，裸 K 低是前一根 K 的低點。" }
      ]
    }
  ],

  faq: [
    { q: "UID 在哪裡看？", uid: true },
    { q: "我已經有帳號了", a: "先不要自己再開一個。兩家交易所都規定一個人只能有一個帳號，同一張證件也只能認證一次，重開會卡在身分認證。先到 LINE 官方跟我們說是哪一家、舊帳號有沒有入過金，我們再告訴你怎麼做。", line: true },
    { q: "淨入金怎麼算？", a: "入金減掉出金，滿 100 USDT。" },
    { q: "多久會收到教材？", a: "系統根據交易所後台達標發送。" },
    { q: "可以先填 UID，之後再 KYC 和入金嗎？", a: "可以。註冊完就先填，KYC 和入金之後再補。" },
    { q: "信箱填錯了", a: "到 LINE 官方跟我們說，我們幫你改。" },
    { q: "我不是看這四位來的", a: "選「都不是，我自己找到的」就可以。" }
  ],

  risk: "加密貨幣合約風險高，可能損失全部本金。本站內容為個人經驗分享，不構成投資建議，請自行評估，盈虧自負。"
};
