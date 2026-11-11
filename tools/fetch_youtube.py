#!/usr/bin/env python3
"""抓阿聖、老承 YouTube 頻道公開 RSS 的最新影片（標題、網址、縮圖、發布時間），寫進 js/videos.js，縮圖存 assets/img/yt/。
用法：python3 tools/fetch_youtube.py    （資料都是真的抓到的；抓不到的頻道就不放）"""
import urllib.request, xml.etree.ElementTree as ET, json, os, datetime, re
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
CH = {"sheng": "UCede9wX8CQv4DIDuoBo0xmw", "cheng": "UC7t6GK7IyjX__qIz6IVsCKw", "chameleon": "UCF4KJnl7TU93wbiRT0UHn-Q"}
NS = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015", "media": "http://search.yahoo.com/mrss/"}
N = 6
EMOJI = re.compile("[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F\u200d]")
def clean(t):
    """顯示用標題：去掉 hashtag、emoji、網址和後面的推廣字，原標題保留在 title。"""
    t = re.split(r"\s#|#|📌|👉|https?://|reurl\.cc", t)[0]
    t = EMOJI.sub("", t)
    t = re.sub(r"\s[A-Za-z0-9]{12,}(\s\d+)?$", "", t)   # 標題尾巴的亂碼字串
    return re.sub(r"\s+", " ", t).strip(" |｜-")
out = {"fetchedAt": datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).strftime("%Y-%m-%d %H:%M (UTC+8)"), "channels": {}}
os.makedirs(os.path.join(ROOT, "assets/img/yt"), exist_ok=True)
for pid, cid in CH.items():
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={cid}"
    try:
        x = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=20).read()
    except Exception as e:
        print(pid, "抓不到", e); continue
    root = ET.fromstring(x); vids = []
    seen = set()
    for en in root.findall("a:entry", NS):
        if len(vids) >= N: break
        if clean(en.find("a:title", NS).text) in seen: continue
        seen.add(clean(en.find("a:title", NS).text))
        vid = en.find("yt:videoId", NS).text
        title = en.find("a:title", NS).text
        pub = en.find("a:published", NS).text
        dt = datetime.datetime.fromisoformat(pub.replace("Z", "+00:00")).astimezone(datetime.timezone(datetime.timedelta(hours=8)))
        thumb = f"assets/img/yt/{vid}.jpg"
        try:
            urllib.request.urlretrieve(f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg", os.path.join(ROOT, thumb))
        except Exception:
            thumb = ""
        vids.append({"id": vid, "title": title, "display": clean(title), "url": f"https://www.youtube.com/watch?v={vid}", "thumb": thumb, "date": dt.strftime("%Y-%m-%d")})
    if vids:
        out["channels"][pid] = {"source": url, "videos": vids}
    print(pid, len(vids))
with open(os.path.join(ROOT, "js/videos.js"), "w") as f:
    f.write("/* 由 tools/fetch_youtube.py 從 YouTube 公開 RSS 抓取，請勿手改。 */\nwindow.OX_VIDEOS = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n")
