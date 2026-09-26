"""Network check: every photo in data.js must be visibly shown (not 0x0) on one of its design's source pages.
Run: python3 tools/verify_photos.py"""
import json, os, re, subprocess, urllib.parse
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = json.loads(subprocess.check_output(["node", "-e", "global.window={};require('./data.js');require('./sources.js');console.log(JSON.stringify({d:window.KD.designs,a:window.KD.articles,s:window.KD_SRC}))"], cwd=root))
cache = {}
def shown_images(url):
    if url not in cache:
        h = subprocess.run(["curl", "-sL", "-m", "20", "-A", "Mozilla/5.0", url], capture_output=True).stdout.decode("latin1")
        found = {}
        for tag in re.findall(r"<img [^>]*>", h, re.I):
            m = re.search(r'src="([^"]+)"', tag); sz = re.search(r"width:(\d+)px;height:(\d+)px", tag)
            if m and not (sz and "0" in (sz.group(1), sz.group(2))):
                found[urllib.parse.unquote(urllib.parse.unquote(m.group(1).split("/")[-1])).lower()] = True
        cache[url] = found
    return cache[url]
bad = []
for d in out["d"]:
    for f, cap in d["photos"]:
        name = urllib.parse.unquote(urllib.parse.unquote(out["s"][f"{d['id']}/{f}"].split("/")[-1])).lower()
        if not any(name in shown_images(p) for p in [d["page"]] + d.get("pages", [])):
            bad.append(f"{d['id']}/{f} ({cap})")
for x in out["a"]:
    for s in x["sections"]:
        for folder, f, cap in s.get("figs", []):
            name = urllib.parse.unquote(urllib.parse.unquote(out["s"][f"{folder}/{f}"].split("/")[-1])).lower()
            if not any(name in shown_images(p) for p in x["pages"]):
                bad.append(f"{folder}/{f} ({cap})")
assert not bad, "not shown on their own source pages: " + ", ".join(bad)
print(f"ok: all {sum(len(d['photos']) for d in out['d'])} design photos and every article figure are shown on their source pages")
