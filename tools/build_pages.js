#!/usr/bin/env node
/* 依 js/data.js 產生四個創作者頁 <id>/index.html 和根目錄 index.html。
   用法：node tools/build_pages.js
   og:image 需要完整網址才會被 LINE、FB、Threads 抓到：部署後把 SITE 設成正式網址再跑一次，例如
   SITE=https://xxx.github.io/ox-links/ node tools/build_pages.js */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
global.window = {}; eval(fs.readFileSync(path.join(root, "js/data.js"), "utf8"));
const D = window.OX_DATA, SITE = (process.env.SITE || "").replace(/\/?$/, process.env.SITE ? "/" : "");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const color = { sheng: "#070202", cheng: "#101113", chameleon: "#03140f", lucas: "#0b0612" };
// 每頁自己的字體搭配
const FONTS = {
  sheng: "family=Oswald:wght@500;700&family=JetBrains+Mono:wght@500;700&family=Noto+Serif+TC:wght@400;700;900&family=Noto+Sans+TC:wght@400;700;900",
  cheng: "family=Cormorant+Garamond:ital,wght@0,300;0,500;1,300;1,500&family=Noto+Serif+TC:wght@300;500;700&family=Noto+Sans+TC:wght@300;400",
  chameleon: "family=Fredoka:wght@500;600;700&family=Noto+Sans+TC:wght@500;700;900",
  lucas: "family=Bebas+Neue&family=Yellowtail&family=Noto+Sans+TC:wght@300;500;700",
  hub: "family=Noto+Serif+TC:wght@700&family=Noto+Sans+TC:wght@400"
};

function head({ title, desc, image, url, theme, root, id }) {
  const img = SITE ? SITE + image : root + image;
  return `<!doctype html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="${theme}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
${SITE ? `<meta property="og:url" content="${esc(SITE + url)}">\n` : ""}<meta name="twitter:card" content="summary">
<link rel="icon" type="image/png" href="${root}assets/img/icon-180.png">
<link rel="apple-touch-icon" href="${root}assets/img/icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${FONTS[id]}&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}css/core.css">
${id !== "hub" ? `<link rel="stylesheet" href="${root}css/${id}.css">` : ""}
</head>`;
}
const scripts = (r, id) => `<script src="${r}js/data.js"></script>\n<script src="${r}js/videos.js"></script>\n<script src="${r}js/core.js"></script>\n<script src="${r}js/${id}.js"></script>`;

for (const p of D.people) {
  fs.mkdirSync(path.join(root, p.id), { recursive: true });
  const html = `${head({ title: p.pageTitle || p.name, desc: p.ogDescription || "", image: p.photo, url: p.id + "/", theme: color[p.id] || "#0b0906", root: "../", id: p.id })}
<!-- 這個檔案由 tools/build_pages.js 產生；內容請改 js/data.js -->
<body class="p-${p.id}" data-person="${p.id}" data-root="../">

<main id="app"></main>
${scripts("../", p.id)}
</body>
</html>
`;
  fs.writeFileSync(path.join(root, p.id, "index.html"), html);
  console.log("wrote", p.id + "/index.html");
}
fs.writeFileSync(path.join(root, "index.html"), `${head({ title: D.brand.sub, desc: "阿聖聊交易、老承、交易變色龍、Lucas 的連結頁", image: D.brand.avatar, url: "", theme: "#0b0906", root: "", id: "hub" })}
<!-- 這個檔案由 tools/build_pages.js 產生 -->
<body class="hub-body" data-hub>
<main class="hub" id="app"></main>
${scripts("", "hub")}
</body>
</html>
`);
console.log("wrote index.html");
