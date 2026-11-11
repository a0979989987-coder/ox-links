/* 根目錄：四人入口（不是主角，簡單列表） */
(function () {
  const { D, esc, asset } = OX;
  const col = { sheng: "#ff2d20", cheng: "#d9dde3", chameleon: "#35e0c2", lucas: "#d6a8ff" };
  document.getElementById("app").innerHTML = `<h1>OX.Trading 創作者</h1>` + D.people.map(p =>
    `<a href="${esc(p.id)}/" style="--c:${col[p.id]}"><img src="${esc(asset(p.photo))}" alt=""><span><b>${esc(p.name)}</b><small>${esc(p.handle || "")}</small></span></a>`).join("");
})();
