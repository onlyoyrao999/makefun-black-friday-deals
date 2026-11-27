// HTML for every page, built from the deal data. Every value is escaped
// before it goes into the page, so a deal's text can never break the markup.
//
// Freshness: a deal whose price was checked more than a day before the
// board's own check time (CHECKED_AT) is stale — Black Friday prices move
// fast, so a stale card and detail page say so plainly instead of passing
// an old price off as checked. Every deal on this board was checked at
// CHECKED_AT itself, so none is stale today; the check guards the board
// the moment a deal's check time falls behind.

import { CHECKED_AT } from "./data.js";

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export function isStale(d) {
  return Date.parse(CHECKED_AT) - Date.parse(d.checked) > STALE_AFTER_MS;
}

function staleWarning(d) {
  return isStale(d)
    ? `<p class="stale">Price check is over a day old — confirm the price at the store before you buy.</p>`
    : "";
}

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const usd = (n) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const percentOff = (d) => Math.round((1 - d.price / d.was) * 100);
const saved = (d) => d.was - d.price;
const day = (iso) =>
  new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";

const VERDICTS = {
  "all-time low": { label: "All-time low", cls: "v-low", hint: "Lowest price ever tracked" },
  "strong deal": { label: "Strong deal", cls: "v-strong", hint: "40% off or more" },
  "solid saving": { label: "Solid saving", cls: "v-solid", hint: "20–39% off" },
  "small cut": { label: "Small cut", cls: "v-small", hint: "Under 20% off — real, but thin" },
};

export function verdictBadge(d) {
  const v = VERDICTS[d.verdict] || VERDICTS["solid saving"];
  return `<span class="verdict ${v.cls}" title="${escape(v.hint)}">${escape(v.label)}</span>`;
}

export function dealCard(d) {
  return `<article class="card">
  <div class="card-top"><span class="store">${escape(d.store)}</span>${verdictBadge(d)}</div>
  <h3><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a></h3>
  <p class="cat">${escape(d.category)}</p>
  <p class="price">${usd(d.price)} <s>${usd(d.was)}</s> <b class="off">${percentOff(d)}% off</b></p>
  <p class="save">You save ${usd(saved(d))}</p>
  <p class="checked">Checked ${day(d.checked)}</p>
  ${staleWarning(d)}
  <p class="go"><a class="btn" href="${escape(d.url)}" rel="noopener" target="_blank">See it at ${escape(d.store)} &rarr;</a></p>
</article>`;
}

export function rows(shown) {
  if (shown.length === 0) return '<p class="empty">No deal matches those filters. Try clearing the search or picking another store.</p>';
  return shown.map(dealCard).join("");
}

export function totals(deals) {
  const totalSaved = deals.reduce((s, d) => s + saved(d), 0);
  const best = [...deals].sort((a, b) => percentOff(b) - percentOff(a))[0];
  return { count: deals.length, totalSaved, best };
}

export function list(deals, state, categories, stores) {
  const t = totals(deals);
  const catOptions = ["All categories", ...categories]
    .map((c) => `<option value="${escape(c)}"${state.category === c ? " selected" : ""}>${escape(c)}</option>`)
    .join("");
  const storeOptions = ["All stores", ...stores]
    .map((s) => `<option value="${escape(s)}"${state.store === s ? " selected" : ""}>${escape(s)}</option>`)
    .join("");
  const discOptions = [
    ["0", "Any discount"],
    ["20", "20% off or more"],
    ["40", "40% off or more"],
    ["50", "50% off or more"],
  ]
    .map(([v, label]) => `<option value="${v}"${state.minDiscount === v ? " selected" : ""}>${label}</option>`)
    .join("");
  const sortOptions = [
    ["discount", "Biggest discount first"],
    ["saved", "Most money saved first"],
    ["price-asc", "Lowest price first"],
    ["price-desc", "Highest price first"],
  ]
    .map(([v, label]) => `<option value="${v}"${state.sort === v ? " selected" : ""}>${label}</option>`)
    .join("");
  return `<section class="hero">
  <h1>Black Friday deal finder</h1>
  <p class="lede">Real Black Friday and Cyber Monday deals, each price checked at the store on <b>27 November 2026</b>. No invented prices, no stale sales — every card says when it was checked and where the price was read.</p>
  <p class="stats"><b>${t.count} verified deals</b> · <b>${usd(t.totalSaved)} total savings</b> · Best cut: <b>${percentOff(t.best)}% off</b> the ${escape(t.best.title)}</p>
</section>
<section class="controls" aria-label="Search and filter deals">
  <label class="search">Search <input id="q" type="search" placeholder="Try “headphones”, “TV”, “laptop”…" value="${escape(state.q)}"></label>
  <label>Category <select id="cat">${catOptions}</select></label>
  <label>Store <select id="store">${storeOptions}</select></label>
  <label>Discount <select id="disc">${discOptions}</select></label>
  <label>Sort <select id="sort">${sortOptions}</select></label>
</section>
<p class="count" id="count"></p>
<div class="grid" id="grid">${rows(state.shown)}</div>
<section class="how">
  <h2>How to read a deal</h2>
  <p>Each card shows the sale price, the usual price, the discount and a verdict: <b>All-time low</b> means the source says it is the lowest price ever tracked; <b>Strong deal</b> is 40% off or more; <b>Solid saving</b> is 20–39% off; <b>Small cut</b> is under 20% — a real saving, but a thin one. Open a deal to see its source and the exact time its price was checked. Prices move on Black Friday, so check the price at the store before you buy.</p>
</section>`;
}

export function deal(d, others) {
  const same = others.filter((o) => o.category === d.category && o.id !== d.id).slice(0, 3);
  const more =
    same.length === 0
      ? ""
      : `<section class="more"><h2>More ${escape(d.category)} deals</h2><div class="grid">${same.map(dealCard).join("")}</div></section>`;
  return `<p class="back"><a href="#/">&larr; All deals</a></p>
<article class="detail">
  <div class="card-top"><span class="store">${escape(d.store)}</span>${verdictBadge(d)}</div>
  <h1>${escape(d.title)}</h1>
  <p class="cat">${escape(d.category)} · sold by ${escape(d.store)}</p>
  <p class="big-price">${usd(d.price)} <s>${usd(d.was)}</s> <b class="off">${percentOff(d)}% off</b></p>
  <p class="save">You save ${usd(saved(d))} off the usual price of ${usd(d.was)}.</p>
  <p class="note">${escape(d.note)}</p>
  ${staleWarning(d)}
  <dl>
    <dt>Checked</dt><dd>${day(d.checked)}</dd>
    <dt>Price read in</dt><dd>${escape(d.source)}</dd>
  </dl>
  <p class="go"><a class="btn big" href="${escape(d.url)}" rel="noopener" target="_blank">Buy it at ${escape(d.store)} &rarr;</a></p>
  <p class="fine">The link goes to the store's search for this product, so you land on the live listing and can confirm the price before checkout.</p>
</article>
${more}`;
}

export function missing() {
  return `<h1>Not found</h1><p>There is no deal at this address. <a href="#/">See all deals</a>.</p>`;
}
