// K-designs concept site. Vanilla JS: catalogue, build-time ladder, design pages (#/<id>), plans cart.
const { designs: D, cats: CATS, email: EMAIL, articles: A } = window.KD;
const artById = Object.fromEntries(A.map((x) => [x.id, x]));
const byId = Object.fromEntries(D.map((d) => [d.id, d]));
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const img = (d, f) => `img/${d.id}/${f}.webp`;
const usd = (n) => "US $" + n.toLocaleString("en-US");
const num = (n, unit, digits = 2) => (n == null ? "—" : `${n.toFixed(digits)}<small>${unit}</small>`);
const kg = (n) => (n == null ? "—" : `${n.toLocaleString("en-US")}<small>kg</small>`);
const hoursOf = (d) => d.hours ?? d.hoursEst ?? null;
const hrs = (d, compact) => (d.hoursText && compact ? `≈${d.hours.toLocaleString("en-US")}<small>h</small>` : d.hoursText ? d.hoursText.replace(" h", "<small>h</small>") : d.hours ? `${d.hours.toLocaleString("en-US")}<small>h</small>` : d.hoursEst ? `≈${d.hoursEst.toLocaleString("en-US")}<small>h</small>` : "—");

/* ---------- storage (may be unavailable) ---------- */
const store = {
  get(k, dflt) { try { return JSON.parse(localStorage.getItem(k)) ?? dflt; } catch { return dflt; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ---------- cards ---------- */
function card(d) {
  const price = d.plan ? `Plans ${usd(d.plan)}` : d.soon ? "Plans coming soon" : "Plans on request";
  return `<a class="card" href="#/${d.id}">
    <div class="card-img"><img src="${img(d, d.photos[0][0])}" alt="${esc(d.name)}: ${esc(d.photos[0][1])}" loading="lazy">
      ${d.first ? '<span class="badge">Best first build</span>' : ""}</div>
    <div class="card-body">
      <h3>${esc(d.name)}</h3>
      <p class="tagline">${esc(d.tagline)}</p>
      <dl class="card-facts">
        <div><dd class="num">${num(d.loa, "m")}</dd><dt>Length</dt></div>
        <div><dd class="num">${num(d.beam, "m")}</dd><dt>Beam</dt></div>
        <div><dd class="num">${kg(d.weight)}</dd><dt>Weight</dt></div>
        <div><dd class="num">${hrs(d, true)}</dd><dt>Build</dt></div>
      </dl>
      <p class="card-price">${price}${d.study ? ` <span class="muted">· study ${usd(d.study)}</span>` : ""}</p>
    </div>
  </a>`;
}

/* ---------- catalogue ---------- */
// Filter options: [value, label, test]. Build time counts our ≈ estimates too.
const RANGES = {
  len: [["", "Any length"], ["lt5", "Under 5 m", (d) => d.loa < 5], ["5to7", "5–7 m", (d) => d.loa >= 5 && d.loa < 7],
    ["7to9", "7–9 m", (d) => d.loa >= 7 && d.loa < 9], ["gt9", "9 m and over", (d) => d.loa >= 9]],
  hours: [["", "Any build time"], ["le200", "Up to 200 h", (d) => hoursOf(d) <= 200], ["le500", "Up to 500 h", (d) => hoursOf(d) <= 500],
    ["le1000", "Up to 1,000 h", (d) => hoursOf(d) <= 1000], ["gt1000", "Over 1,000 h", (d) => hoursOf(d) > 1000]],
  price: [["", "Any price"], ["le100", "Up to US $100", (d) => d.plan <= 100], ["le200", "Up to US $200", (d) => d.plan <= 200],
    ["le400", "Up to US $400", (d) => d.plan <= 400], ["gt400", "Over US $400", (d) => d.plan > 400]],
};
const DEFAULTS = { cat: "", rig: "", len: "", hours: "", price: "", sort: "loa" };
const state = { ...DEFAULTS, ...store.get("kd-f", {}) };
for (const [k, opts] of Object.entries(RANGES)) $(`[data-f="${k}"]`).innerHTML = opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
// A design with no figure (plans on request, no length) matches only "Any".
const valueOf = { len: (d) => d.loa, hours: hoursOf, price: (d) => d.plan };
const test = (k, d) => { const o = RANGES[k].find(([v]) => v === state[k]); return !o?.[2] || (valueOf[k](d) != null && o[2](d)); };
const sortVal = (d, key) => (key === "hours" ? hoursOf(d) : d[key]) ?? Infinity;

function renderCatalogue() {
  $("[data-filter]").innerHTML = [["", "All"], ...Object.entries(CATS)]
    .map(([k, v]) => `<button type="button" data-value="${k}" aria-pressed="${state.cat === k}">${v}</button>`).join("");
  document.querySelectorAll("[data-rig] button").forEach((b) => b.setAttribute("aria-pressed", state.rig === b.dataset.value));
  for (const k of Object.keys(RANGES)) $(`[data-f="${k}"]`).value = state[k];
  $("[data-sort]").value = state.sort;
  const list = D.filter((d) => (!state.cat || d.cat === state.cat) && (!state.rig || d.rig === state.rig) && ["len", "hours", "price"].every((k) => test(k, d)))
    .sort((a, b) => sortVal(a, state.sort) - sortVal(b, state.sort) || (a.loa ?? 0) - (b.loa ?? 0));
  $("[data-grid]").innerHTML = list.length ? list.map(card).join("")
    : `<p class="no-results muted">No design matches all of these filters. <button class="link" type="button" data-reset>Reset filters</button></p>`;
  $("[data-result-count]").textContent = `${list.length} of ${D.length} designs`;
  $(".filter-row [data-reset]").hidden = Object.keys(DEFAULTS).every((k) => k === "sort" || state[k] === DEFAULTS[k]);
  store.set("kd-f", state);
}
const setF = (k, v) => { state[k] = v; renderCatalogue(); };
$("[data-filter]").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; setF("cat", b.dataset.value); $(`[data-filter] button[data-value="${b.dataset.value}"]`).focus(); });
$("[data-rig]").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setF("rig", b.dataset.value); });
document.querySelectorAll("[data-f]").forEach((s) => s.addEventListener("change", () => setF(s.dataset.f, s.value)));
$("[data-sort]").addEventListener("change", (e) => setF("sort", e.target.value));
document.addEventListener("click", (e) => { if (e.target.closest("[data-reset]")) { Object.assign(state, DEFAULTS, { sort: state.sort }); renderCatalogue(); } });
$("[data-more]").textContent = window.KD.more.join(", ");
$('[data-stat="count"]').textContent = D.length;

/* ---------- build-time ladder: one series, linear scale, bars link to the design ---------- */
function renderEstimates() {
  $("[data-estimates]").innerHTML = D.filter((d) => !d.hours && d.hoursEst)
    .map((d) => `<li><a href="#/${d.id}">${esc(d.name)}</a>, ≈${d.hoursEst.toLocaleString("en-US")} h: ${esc(d.estBasis)}</li>`).join("");
}
function renderLadder() {
  const rows = D.filter(hoursOf).sort((a, b) => hoursOf(a) - hoursOf(b) || (a.loa ?? 0) - (b.loa ?? 0));
  const max = 3200;
  const ticks = [0, 800, 1600, 2400, 3200];
  $("[data-ladder]").innerHTML =
    `<div class="ladder-axis" aria-hidden="true">${ticks.map((t) => `<span style="left:${(t / max) * 100}%">${t.toLocaleString("en-US")}</span>`).join("")}</div>` +
    rows.map((d) => { const h = hoursOf(d), est = !d.hours, x = (h / max) * 100;
      const label = d.hoursText || (est ? `≈${h.toLocaleString("en-US")} · estimate` : h.toLocaleString("en-US"));
      return `<a class="ladder-row${d.first ? " is-first" : ""}${est ? " is-est" : ""}" href="#/${d.id}" title="${esc(d.name)}: ${est ? esc(d.estBasis) : (d.hoursText || h + " hours") + ", Bernd's figure"}">
      <span class="ladder-name">${esc(d.name)}</span>
      <span class="ladder-track"><span class="ladder-bar" style="width:${x}%"></span>
      <span class="ladder-val${x > 75 && !est ? " inside" : ""}" style="left:${x}%">${label}${d.first ? " · first build" : ""}</span></span>
    </a>`; }).join("");
}

/* ---------- design page ---------- */
let gallery = [];
function renderDetail(d) {
  const main = $("#detail");
  const related = D.filter((x) => x.cat === d.cat && x.id !== d.id).slice(0, 3);
  const photos = d.layout ? [d.photos[0], ...d.photos.slice(1).filter(([f]) => f === d.layout), ...d.photos.slice(1).filter(([f]) => f !== d.layout)] : d.photos;
  gallery = photos.map(([f, c]) => [img(d, f), c]); heroAt = 0;
  const buy = [
    d.plan && ["plan", "Full plans", usd(d.plan), "Drawings, manual and the licence to build one boat"],
    !d.plan && d.study && ["ask", d.soon ? "Plans coming soon" : "Full plans", "on request", `Write to Bernd at <span class="sel">${EMAIL}</span>`],
    d.study && ["study", "Study plan", usd(d.study), d.studyRefund ? "List of materials and background; refunded when you order the full plans" : "List of materials and background, to decide before you commit"],
  ].filter(Boolean);
  main.innerHTML = `
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#designs">Designs</a><span>/</span><a href="#designs" data-cat="${d.cat}">${CATS[d.cat]}</a><span>/</span><span>${esc(d.name)}</span></nav>
    <section class="detail-hero">
      <div class="detail-copy">
        <span class="pill static"><i class="dot ${d.rig}"></i>${CATS[d.cat]}</span>
        <h1>${esc(d.name)}</h1>
        <p class="lede">${esc(d.tagline)}</p>
        <p class="muted">${d.year ? `Designed ${d.year} · ` : ""}plywood / glass / epoxy${d.sleeps ? ` · ${/^\d/.test(d.sleeps) ? "sleeps " : ""}${esc(d.sleeps)}` : ""}</p>
        <div class="buy">
          ${buy.length ? buy.map(([k, t, p, note]) => `<div class="buy-row">
            <div><strong>${t}</strong><span class="muted small">${note}</span></div>
            <span class="num price">${p}</span>
            ${k === "ask" ? "" : `<button class="btn ${k === "plan" ? "primary" : ""}" type="button" data-add="${d.id}:${k}" aria-label="Add ${esc(d.name)} ${t.toLowerCase()} to your list">${inCart(d.id, k) ? "In your list ✓" : k === "plan" ? "Add plans" : "Add study plan"}</button>`}
          </div>`).join("") : `<div class="buy-row"><div><strong>${d.soon ? "Plans coming soon" : "Plans on request"}</strong><span class="muted small">Write to Bernd at <span class="sel">${EMAIL}</span></span></div></div>`}
        </div>
      </div>
      <div class="detail-photo" data-hero>
        <button class="photo-open" type="button" data-photo="0" aria-label="Open photo full size" style="--hero-bg:url('${gallery[0][0]}')"><img src="${gallery[0][0]}" alt="${esc(d.name)}: ${esc(gallery[0][1])}"></button>
        <span class="caption" data-hero-caption>${esc(gallery[0][1])}</span>
        ${gallery.length > 1 ? `<button class="icon-btn hero-nav prev" type="button" data-hero-step="-1" aria-label="Previous photo">‹</button>
        <button class="icon-btn hero-nav next" type="button" data-hero-step="1" aria-label="Next photo">›</button>
        <span class="hero-count" data-hero-count>1 / ${gallery.length}</span>` : ""}
      </div>
    </section>

    <section class="tiles">
      <div><div class="num">${num(d.loa, "m")}</div><div class="eyebrow">Length</div></div>
      <div><div class="num">${num(d.beam, "m")}</div><div class="eyebrow">Beam</div></div>
      <div><div class="num">${kg(d.weight)}</div><div class="eyebrow">Weight</div></div>
      <div><div class="num">${hrs(d)}</div><div class="eyebrow">Construction time${d.hoursEst ? ", estimate" : ""}</div></div>
    </section>
    ${d.hoursEst ? `<p class="est-note muted small">≈ Estimated construction time. ${esc(d.estBasis)} Ask Bernd before you plan around it.</p>` : ""}

    <section class="detail-body">
      <div class="prose">${d.text.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      <aside class="titleblock" aria-label="Specification and plans">
        <h2 class="tb-title">${esc(d.name)} <span>Specification</span></h2>
        <dl>${d.spec.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
        <h3 class="tb-title">In the plans</h3>
        <ul>${d.delivery.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        ${d.materials ? `<h3 class="tb-title">Materials <span>from the study plan</span></h3><ul>${d.materials.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        <p class="tb-foot"><span>K-designs</span><span>B. Kohler</span></p>
      </aside>
    </section>

    ${gallery.length > 1 ? `<section class="section-tight">
      <div class="section-head"><h2>Photos</h2><p class="muted small">${gallery.length} pictures, most of them from customers' builds</p></div>
      <div class="gallery">${gallery.slice(1).map(([src, c], i) => `<button type="button" data-photo="${i + 1}"><img src="${src}" alt="${esc(c)}" loading="lazy"><span>${esc(c)}</span></button>`).join("")}</div>
    </section>` : ""}

    ${(() => { const reads = A.filter((x) => x.designs.includes(d.id)); return d.videos.length || reads.length ? `<section class="section-tight"><div class="section-head"><h2>${reads.length ? "Watch and read" : "Watch"}</h2></div>
      <ul class="videos">${d.videos.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener"><span class="play" aria-hidden="true">▶</span>${esc(t)}</a></li>`).join("")}${reads.map((x) => `<li><a href="#/read/${x.id}"><span class="play" aria-hidden="true">¶</span>${esc(x.title)}</a></li>`).join("")}</ul></section>` : ""; })()}

    <p class="source muted small">Figures and photos from these pages on ikarus342000.org: ${[d.page, ...(d.pages || [])].map((u) => `<a href="${u}">${esc(u.split("/").pop().replace(/\.html?$/, ""))}</a>`).join(", ")}. Prices from the <a href="https://ikarus342000.org/Order.html">order page</a> where it lists them.</p>

    ${related.length ? `<section class="section-tight"><div class="section-head"><h2>More ${CATS[d.cat].toLowerCase()}</h2></div>
      <div class="grid">${related.map(card).join("")}</div></section>` : ""}
  </div>`;
}

/* ---------- articles ---------- */
const fig = (folder, f) => `img/${folder}/${f}.webp`;
function renderReads() {
  $("[data-reads]").innerHTML = A.map((x) => `<a class="read-card" href="#/read/${x.id}">
    <img src="${fig(...x.cover)}" alt="" loading="lazy"><span class="read-body"><h3>${esc(x.title)}</h3><span class="tagline">${esc(x.lede)}</span></span></a>`).join("");
}
function renderArticle(x) {
  const figs = x.sections.flatMap((s) => s.figs || []);
  gallery = figs.map(([folder, f, c]) => [fig(folder, f), c]); heroAt = 0;
  let n = 0;
  $("#detail").innerHTML = `<div class="wrap article">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#read">Articles</a><span>/</span><span>${esc(x.title)}</span></nav>
    <header class="article-head"><p class="eyebrow">By Bernd Kohler</p><h1>${esc(x.title)}</h1><p class="lede">${esc(x.lede)}</p></header>
    ${x.sections.map((s) => `<section class="article-sec">
      ${s.h ? `<h2>${esc(s.h)}</h2>` : ""}
      <div class="prose">${s.p.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      ${s.figs ? `<div class="figs">${s.figs.map(([folder, f, c]) => `<button type="button" data-photo="${n++}"><img src="${fig(folder, f)}" alt="${esc(c)}" loading="lazy"><span>${esc(c)}</span></button>`).join("")}</div>` : ""}
    </section>`).join("")}
    ${x.videos || x.links ? `<section class="article-sec"><h2>Watch and read</h2><ul class="videos">${(x.videos || []).map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener"><span class="play" aria-hidden="true">▶</span>${esc(t)}</a></li>`).join("")}${(x.links || []).map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener"><span class="play" aria-hidden="true">↗</span>${esc(t)}</a></li>`).join("")}</ul></section>` : ""}
    ${x.books ? `<section class="article-sec"><h2>Further reading</h2><ul class="books">${x.books.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></section>` : ""}
    <section class="section-tight"><div class="section-head"><h2>Designs in this article</h2></div><div class="grid">${x.designs.map((id) => card(byId[id])).join("")}</div></section>
    <p class="source muted small">Rewritten from ${x.pages.map((u) => `<a href="${u}">${esc(u.split("/").pop().replace(/\.html?$/, ""))}</a>`).join(", ")} on ikarus342000.org.</p>
  </div>`;
}

/* ---------- router ---------- */
function route() {
  const art = location.hash.startsWith("#/read/") && artById[location.hash.slice(7)];
  if (art) {
    $("#home").hidden = true; $("#detail").hidden = false;
    renderArticle(art); document.title = `${art.title} · K-designs`; window.scrollTo(0, 0); return;
  }
  const id = location.hash.startsWith("#/") ? location.hash.slice(2) : null;
  const d = id && byId[id];
  if (id && !d) {
    $("#home").hidden = true; $("#detail").hidden = false;
    $("#detail").innerHTML = `<div class="wrap section"><h1>Design not found</h1><p class="lede">There is no design called “${esc(id)}”. <a href="#designs">See all designs</a>.</p></div>`;
    return;
  }
  $("#home").hidden = !!d;
  $("#detail").hidden = !d;
  if (d) { renderDetail(d); document.title = `${d.name} · K-designs`; window.scrollTo(0, 0); return; }
  document.title = "K-designs · Multihull plans for home builders";
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) target.scrollIntoView();
}
addEventListener("hashchange", route);
document.addEventListener("click", (e) => {
  const c = e.target.closest("[data-cat]");
  if (c) { Object.assign(state, DEFAULTS, { sort: state.sort, cat: c.dataset.cat }); renderCatalogue(); }
});

/* ---------- lightbox ---------- */
const lb = $("[data-lightbox]");
let lbAt = 0;
let heroAt = 0;
document.addEventListener("click", (e) => {
  const s = e.target.closest("[data-hero-step]"); if (!s) return;
  heroAt = (heroAt + +s.dataset.heroStep + gallery.length) % gallery.length;
  const [src, cap] = gallery[heroAt], hero = $("[data-hero]");
  $("img", hero).src = src; $("img", hero).alt = cap;
  $(".photo-open", hero).dataset.photo = heroAt;
  $(".photo-open", hero).style.setProperty("--hero-bg", `url('${src}')`);
  $("[data-hero-caption]", hero).textContent = cap;
  $("[data-hero-count]", hero).textContent = `${heroAt + 1} / ${gallery.length}`;
});
function showPhoto(i) {
  lbAt = (i + gallery.length) % gallery.length;
  const [src, cap] = gallery[lbAt];
  $("img", lb).src = src; $("img", lb).alt = cap;
  const orig = window.KD_SRC?.[src.replace(/^img\//, "").replace(/\.webp$/, "")];
  $("figcaption", lb).innerHTML = `${esc(cap)} · ${lbAt + 1} / ${gallery.length}${orig ? ` · <a href="${orig}" target="_blank" rel="noopener">original on ikarus342000.org</a>` : ""}`;
}
document.addEventListener("click", (e) => {
  const p = e.target.closest("[data-photo]");
  if (p) { showPhoto(+p.dataset.photo); lb.showModal(); }
});
// FAQ figures open in the same lightbox
const FAQ_FIGS = [["img/articles/faq/bv_img14.webp", "Deckhouse (A) versus flat deck (B)"], ["img/articles/faq/bv_img15.webp", "Parallel rig: apparent wind at different boat speeds"]];
document.addEventListener("click", (e) => {
  const f = e.target.closest("[data-faq-photo]");
  if (f) { gallery = FAQ_FIGS; showPhoto(+f.dataset.faqPhoto); lb.showModal(); }
});
lb.addEventListener("click", (e) => {
  if (e.target.closest("[data-step]")) showPhoto(lbAt + +e.target.closest("[data-step]").dataset.step);
  else if (e.target.closest("[data-close]") || e.target === lb) lb.close();
});
lb.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") showPhoto(lbAt + 1);
  if (e.key === "ArrowLeft") showPhoto(lbAt - 1);
});

/* ---------- cart: a list of plans; checkout composes an order e-mail to Bernd ---------- */
const saved = store.get("kd-cart", []);
let cart = (Array.isArray(saved) ? saved : []).filter((x, i, all) => x && ["plan", "study"].includes(x.kind) && byId[x.id]?.[x.kind]
  && all.findIndex((y) => y && y.id === x.id && y.kind === x.kind) === i);
const inCart = (id, kind) => cart.some((x) => x.id === id && x.kind === kind);
const kindName = { plan: "Full plans", study: "Study plan" };
const drawer = $("[data-cart]");
function saveCart() {
  store.set("kd-cart", cart);
  const n = $("[data-cart-count]"); n.textContent = cart.length; n.dataset.n = cart.length;
}
// A study plan that is refunded with the full plans (KD 1000) counts as a credit when both are ordered.
const credits = () => cart.filter((x) => x.kind === "study" && byId[x.id].studyRefund && inCart(x.id, "plan")).map((x) => byId[x.id]);
const cartTotal = () => cart.reduce((s, x) => s + byId[x.id][x.kind], 0) - credits().reduce((s, d) => s + d.study, 0);
function orderText(f) {
  const lines = cart.map((x) => `- ${byId[x.id].name}, ${kindName[x.kind]}: ${usd(byId[x.id][x.kind])}`)
    .concat(credits().map((d) => `- ${d.name} study plan refunded with the full plans: -${usd(d.study)}`));
  const total = cartTotal();
  return `Dear Mr. Kohler,\n\nI would like to order:\n${lines.join("\n")}\nTotal: ${usd(total)}\n\n${f.note ? f.note + "\n\n" : ""}Name: ${f.name}\nE-mail: ${f.email}\nCountry: ${f.country}\n\nPlease confirm the price and send me the PayPal payment details.\n\nKind regards,\n${f.name}`;
}
function renderCart(done) {
  const body = $("[data-cart-body]");
  if (done) {
    const text = orderText(done);
    const mail = `mailto:${EMAIL}?subject=${encodeURIComponent("Plans order: " + cart.map((x) => byId[x.id].name).join(", "))}&body=${encodeURIComponent(text)}`;
    body.innerHTML = `<div class="order-done">
      <p>Your order is ready. Send this text to <span class="sel">${EMAIL}</span>. Bernd confirms the price and replies with PayPal details (his <a href="https://ikarus342000.org/Order.html">order page</a> also has a PayPal QR code). Plans arrive as e-mail attachments, except PELICAN's hand-drawn set, which goes by air mail.</p>
      <pre class="order-text">${esc(text)}</pre>
      <div class="hero-actions"><a class="btn primary" href="${mail}">Open in my e-mail app</a><button class="btn" type="button" data-copy-order>Copy text</button></div>
      <button class="link" type="button" data-back>Back to the list</button>
    </div>`;
    $("[data-copy-order]", body).onclick = (e) => copy(text, e.target);
    $("[data-back]", body).onclick = () => renderCart();
    return;
  }
  if (!cart.length) {
    body.innerHTML = `<p class="muted empty">No plans yet. Start with a study plan: it costs US $10–20 and has the bill of materials, so you can price the boat before you commit.</p>`;
    return;
  }
  const total = cartTotal();
  body.innerHTML = `<ul class="cart-list">${cart.map((x, i) => { const d = byId[x.id]; return `<li>
      <img src="${img(d, d.photos[0][0])}" alt="">
      <div><strong>${esc(d.name)}</strong><span class="muted small">${kindName[x.kind]}</span></div>
      <span class="num">${usd(d[x.kind])}</span>
      <button class="icon-btn" type="button" data-remove="${i}" aria-label="Remove ${esc(d.name)} ${kindName[x.kind]}">×</button>
    </li>`; }).join("")}</ul>
    ${credits().map((d) => `<p class="cart-credit muted small"><span>${esc(d.name)} study plan, refunded with the full plans</span><span>−${usd(d.study)}</span></p>`).join("")}
    <p class="cart-total"><span>Total</span><span class="num">${usd(total)}</span></p>
    <form class="checkout" data-checkout>
      <label for="c-name">Name<input id="c-name" name="name" required autocomplete="name"></label>
      <label for="c-email">E-mail<input id="c-email" name="email" type="email" required autocomplete="email"></label>
      <label for="c-country">Country<input id="c-country" name="country" required autocomplete="country-name"></label>
      <label for="c-note">Message to Bernd <span class="muted">(optional)</span><textarea id="c-note" name="note" rows="3" placeholder="For example: I have never built a boat before…"></textarea></label>
      <button class="btn primary" type="submit">Prepare my order</button>
      <p class="muted small">Nothing is paid here. Bernd confirms the price first; plans arrive as e-mail attachments.</p>
    </form>`;
  for (const [k, v] of Object.entries(buyer)) { const f = body.querySelector(`[name="${k}"]`); if (f) f.value = v; }
}
drawer.addEventListener("click", (e) => {
  const r = e.target.closest("[data-remove]");
  if (r) { cart.splice(+r.dataset.remove, 1); saveCart(); renderCart(); refreshAddButtons(); }
  else if (e.target.closest("[data-close]") || e.target === drawer) drawer.close();
});
let buyer = {};
drawer.addEventListener("submit", (e) => {
  e.preventDefault();
  buyer = Object.fromEntries(new FormData(e.target));
  renderCart(buyer);
});
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-add]");
  if (a) {
    const [id, kind] = a.dataset.add.split(":");
    if (!inCart(id, kind)) { cart.push({ id, kind }); saveCart(); }
    refreshAddButtons(); renderCart(); drawer.showModal();
  }
  if (e.target.closest("[data-open-cart]")) { renderCart(); drawer.showModal(); }
});
function refreshAddButtons() {
  document.querySelectorAll("[data-add]").forEach((b) => {
    const [id, kind] = b.dataset.add.split(":");
    b.textContent = inCart(id, kind) ? "In your list ✓" : kind === "plan" ? "Add plans" : "Add study plan";
  });
}

/* ---------- copy helpers ---------- */
function copy(text, btn) {
  const old = btn.textContent;
  const done = () => { btn.textContent = "Copied"; setTimeout(() => (btn.textContent = old), 1600); };
  const fail = () => { btn.textContent = "Select the text and copy it"; };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, fail); else fail();
}
$("[data-copy-email]").onclick = (e) => copy(EMAIL, e.target);

const menu = $("[data-menu]");
menu.addEventListener("click", () => menu.setAttribute("aria-expanded", menu.getAttribute("aria-expanded") !== "true"));
$("#site-nav").addEventListener("click", (e) => { if (e.target.closest("a")) menu.setAttribute("aria-expanded", "false"); });

renderCatalogue();
renderReads();
renderLadder();
renderEstimates();
saveCart();
route();
