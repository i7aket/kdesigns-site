# K-designs concept site

Concept redesign of Bernd Kohler's multihull-plans site (ikarus342000.org), built as a free offer to the designer.
Static, no build step: `index.html`, `styles.css`, `app.js`, `data.js`, `img/`.

- `data.js` is the source of truth: one entry per design, every figure taken from that design's pages (`page` + `pages`).
  Prices follow the shop price table on https://ikarus342000.org/Order.html where it lists the design (it often differs from the design pages; confirm with Kohler).
  `hoursEst` + `estBasis` are our own estimates from comparable designs, shown with ≈ where Kohler gives no construction time.
- `sources.js` maps every photo to its original URL on ikarus342000.org (shown in the lightbox).
- Design pages are hash routes: `#/eco-75-p`. The cart composes an order e-mail to Bernd; no payment is taken.
- `_raw/` holds the original downloads; `img/` the WebP copies (`magick <raw> -resize 1600x1600\> -quality 82`).
- Check: `python3 tools/check.py` (photos exist, have a source URL, ids unique); `python3 tools/verify_photos.py` (network: every photo is visibly shown on its design's own pages, so no hidden or unrelated images).
- Run: `python3 -m http.server 8907 --bind 0.0.0.0`, then http://localhost:8907
