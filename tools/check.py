"""Self-check: every photo/layout in data.js exists as img/<id>/<file>.webp and has its original URL in sources.js. Run: python3 tools/check.py"""
import json, os, re, subprocess
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = json.loads(subprocess.check_output(["node", "-e", "global.window={};require('./data.js');require('./sources.js');console.log(JSON.stringify({kd:window.KD,src:window.KD_SRC}))"], cwd=root))
data, src = out["kd"], out["src"]
missing = [f"{d['id']}/{f}" for d in data["designs"] for f in [p[0] for p in d["photos"]] + ([d["layout"]] if d.get("layout") else [])
           if not os.path.exists(os.path.join(root, "img", d["id"], f + ".webp"))]
ids = [d["id"] for d in data["designs"]]
assert len(ids) == len(set(ids)), "duplicate ids"
assert all(d["cat"] in data["cats"] for d in data["designs"]), "unknown category"
assert not missing, f"missing images: {missing}"
nosrc = [f"{d['id']}/{p[0]}" for d in data["designs"] for p in d["photos"] if f"{d['id']}/{p[0]}" not in src]
assert not nosrc, f"photos without a source URL in sources.js: {nosrc}"
figs = [f"{f[0]}/{f[1]}" for x in data.get("articles", []) for s in x["sections"] for f in s.get("figs", [])] + [f"{x['cover'][0]}/{x['cover'][1]}" for x in data.get("articles", [])]
bad = [f for f in figs if not os.path.exists(os.path.join(root, "img", f + ".webp")) or f not in src]
assert not bad, f"article figures missing or without source: {bad}"
for faq in ["articles/faq/bv_img14", "articles/faq/bv_img15"]:
    assert os.path.exists(os.path.join(root, "img", faq + ".webp")) and faq in src, faq
print(f"ok: {len(ids)} designs, {sum(len(d['photos']) for d in data['designs'])} photos, {len(data.get('articles', []))} articles, {len(set(figs))} article figures")
