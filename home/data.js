/*
  OX Trading 會員首頁的內容資料。要改連結、人名、文字，只改這個檔案。
  圖片路徑寫相對於 repo 根目錄（assets/...、home/img/...），頁面會自動補上自己的層級。
  老師順序＝小老師那一頁的排列順序。join 留空的老師（老承）只出現在小老師那一頁，不在註冊流程裡。
*/
window.OXH = {
  brand: "OX Trading",

  // logo：img＝永盛 11/12 給的原圖（白底，炭黑＋亮藍），網站上顯示的都是它。
  // d、b 是 OX App 裡同形狀的向量外框（d＝炭黑那一半、b＝亮藍那一半），只拿來畫黑卡上的浮水印線條
  logo: {
    img: "home/img/logo.png",
    viewBox: "0 0 980 980",
    d: "M534 16L503 8L476 8L461 11L434 22L93 221L78 232L64 246L57 255L45 277L38 301L36 332L36 663L41 693L53 719L74 745L93 759L180 812L190 812L196 809L202 802L207 788L207 557L211 532L216 515L232 481L251 454L272 431L326 378L361 353L394 337L432 326L468 322L501 324L524 329L545 337L564 347L582 360L619 397L634 405L647 408L668 407L690 398L703 388L711 379L722 359L727 335L727 187L724 163L715 140L701 120L687 107L584 44Z",
    b: "M800 168L789 168L782 172L774 185L772 196L773 399L770 428L762 458L746 494L729 521L680 576L652 602L625 622L590 641L556 652L518 657L481 655L459 650L433 640L410 627L398 618L371 590L362 583L351 577L338 573L312 574L291 583L277 594L269 603L259 621L253 644L253 796L257 816L266 838L278 855L298 873L444 961L460 967L480 971L512 969L536 961L885 760L903 747L912 738L925 721L934 704L940 686L943 663L943 317L941 299L936 281L928 264L919 250L905 234L887 220Z",
    dark: "#2C2F36", blue: "#23A6EA"
  },

  line: {
    official: { title: "LINE 官方", desc: "加好友領免費教材", url: "https://lin.ee/SJ4F4Jq" },
    community: { title: "LINE 社群", desc: "進來一起聊盤", url: "https://line.me/ti/g2/FXj0yahd04U4JecSoC4uPInXiqhLulqdCl54Ag?utm_source=invitation&utm_medium=link_copy&utm_campaign=default" }
  },

  tools: [
    { label: "OX 台股", icon: "candle", url: "https://oxpattern.com" },
    { label: "OX 加密", icon: "coin", url: "https://ox-crypto-independent.vercel.app" },
    { label: "合成市場", icon: "merge", url: "https://merge-market.btcfly.chatgpt.site" }
  ],

  // 會員拿得到的、條件（永盛 11/12 定的；條件那句是他的原話）
  member: {
    perks: ["進階教材", "OX 加密進階功能"],
    rule: "完成 KYC、淨入金滿 100 USDT",
    ruleNote: "系統根據交易所後台達標發送"
  },

  // 小老師。page＝他給的短網址；color＝粒子落在這張卡上的顏色；join＝註冊流程用的邀請連結
  teachers: [
    {
      id: "snsheng", name: "易中生Snsheng", zh: "易中生", en: "Snsheng", sub: "雙極交易法",
      page: "https://reurl.cc/VnV81R", avatar: "assets/img/avatars/snsheng.png", color: "#e3c47e",
      join: { bitget: "https://partner.bitget.com/bg/naxg9b1r", bingx: "https://bingxzone.com/invite/QCM2IQ" }
    },
    {
      id: "sheng", name: "阿聖聊交易", zh: "阿聖", tail: "聊交易", sub: "加密貨幣技術分析", tags: ["ICT", "SNR"],
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
      id: "cheng", name: "老承", sub: "台股解盤與產業分析", motto: "你肯學，我就肯教",
      page: "https://reurl.cc/6Xo5d6", avatar: "assets/img/avatars/cheng.png", cover: "assets/img/cover/cheng.jpg", color: "#d9dde3",
      join: null
    }
  ],

  // 註冊流程
  flow: {
    steps: ["選老師", "註冊交易所", "填 UID", "等審核"],
    askTitle: "你是看誰的內容來的？",
    askNote: "選一位，下一步用他的連結註冊",
    none: "都不是，我自己找到的",
    noneTeacher: "snsheng"   // 「都不是」用誰的連結
  },

  risk: "加密貨幣合約風險高，可能損失全部本金。本站內容為個人經驗分享，不構成投資建議，請自行評估，盈虧自負。"
};
