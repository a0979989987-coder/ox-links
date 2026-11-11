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
const color = { snr: "#0c0404", mono: "#0b0c0e", jungle: "#040b0b", night: "#0b0612" };

function head({ title, desc, image, url, theme, root }) {
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
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@1,500&family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}css/base.css">
<link rel="stylesheet" href="${root}css/themes.css">
</head>`;
}
const INTRO = `<!-- 開場：K 線從底部衝上來炸開，點一下跳過 -->
<div id="intro" aria-hidden="true"><div class="i-grid"></div><div class="i-candle"><i class="i-wick"></i><i class="i-body"></i></div>
  <div class="i-burst"></div><div class="i-sparks"></div><div class="i-word"></div><p class="i-skip">點一下跳過</p></div>`;
const scripts = r => `<script src="${r}js/data.js"></script>\n<script src="${r}js/themes.js"></script>\n<script src="${r}js/page.js"></script>`;

for (const p of D.people) {
  fs.mkdirSync(path.join(root, p.id), { recursive: true });
  const html = `${head({ title: p.pageTitle || p.name, desc: p.ogDescription || "", image: p.photo, url: p.id + "/", theme: color[p.theme] || "#0b0906", root: "../" })}
<!-- 這個檔案由 tools/build_pages.js 產生；內容請改 js/data.js -->
<body class="intro-on theme-${p.theme}" data-person="${p.id}" data-root="../">
${INTRO}
<div class="scene" aria-hidden="true"></div>
<main class="wrap" id="app"></main>
<div class="overlay" aria-hidden="true"></div>
${scripts("../")}
</body>
</html>
`;
  fs.writeFileSync(path.join(root, p.id, "index.html"), html);
  console.log("wrote", p.id + "/index.html");
}
fs.writeFileSync(path.join(root, "index.html"), `${head({ title: D.brand.sub, desc: "阿聖聊交易、老承、交易變色龍、Lucas 的連結頁", image: D.brand.avatar, url: "", theme: "#0b0906", root: "" })}
<!-- 這個檔案由 tools/build_pages.js 產生 -->
<body data-hub>
<main class="wrap" id="app"></main>
${scripts("")}
</body>
</html>
`);
console.log("wrote index.html");
