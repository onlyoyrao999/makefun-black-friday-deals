// A deal finder: every deal and a page for each, on hash routes. The deals
// live in data.js, so the site needs no network to show them; each deal links
// out to its store.
//
//   #/                              the list, with search and filters
//   #/?category=Audio&sort=discount  the list, pre-filtered (for screenshots)
//   #/deal/<id>                     one deal
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { deals } from "./data.js";
import { deal, list, missing, rows, totals } from "./views.js";

const app = document.getElementById("app");
const CATEGORIES = [...new Set(deals.map((d) => d.category))].sort();
const STORES = [...new Set(deals.map((d) => d.store))].sort();
const percentOff = (d) => Math.round((1 - d.price / d.was) * 100);

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, query] = raw.split("?");
  const params = new URLSearchParams(query || "");
  return { path, params };
}

function stateFrom(params) {
  return {
    q: params.get("q") || "",
    category: params.get("category") || "All categories",
    store: params.get("store") || "All stores",
    minDiscount: params.get("disc") || "0",
    sort: params.get("sort") || "discount",
  };
}

function applyFilters(state) {
  const q = state.q.trim().toLowerCase();
  const min = Number(state.minDiscount) || 0;
  let shown = deals.filter((d) => {
    if (q && !`${d.title} ${d.store} ${d.category}`.toLowerCase().includes(q)) return false;
    if (state.category !== "All categories" && d.category !== state.category) return false;
    if (state.store !== "All stores" && d.store !== state.store) return false;
    if (percentOff(d) < min) return false;
    return true;
  });
  const by = {
    discount: (a, b) => percentOff(b) - percentOff(a),
    saved: (a, b) => b.was - b.price - (a.was - a.price),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
  };
  shown = [...shown].sort(by[state.sort] || by.discount);
  return { ...state, shown };
}

const SORT_LABELS = {
  discount: "biggest discount",
  saved: "most money saved",
  "price-asc": "lowest price",
  "price-desc": "highest price",
};

function updateCount(shown, sort) {
  const el = document.getElementById("count");
  // The count line used to always say "sorted by biggest discount" even
  // when another sort was picked; name the sort that is actually applied.
  if (el) el.textContent = `Showing ${shown.length} of ${deals.length} deals — sorted by ${SORT_LABELS[sort] || SORT_LABELS.discount}.`;
}

function render() {
  window.__shotReady = false;
  const { path, params } = parseHash();
  const dealMatch = path.match(/^deal\/([^/?]+)/);
  if (dealMatch) {
    const found = deals.find((d) => d.id === decodeURIComponent(dealMatch[1]));
    document.title = `${found ? found.title : "Not found"} | Black Friday deal finder`;
    app.innerHTML = found ? deal(found, deals) : missing();
  } else {
    const state = applyFilters(stateFrom(params));
    document.title = "Black Friday deal finder — real deals, checked 27 Nov 2026";
    app.innerHTML = list(deals, state, CATEGORIES, STORES);
    updateCount(state.shown, state.sort);
    const grid = document.getElementById("grid");
    const refresh = () => {
      const next = applyFilters({
        q: document.getElementById("q").value,
        category: document.getElementById("cat").value,
        store: document.getElementById("store").value,
        minDiscount: document.getElementById("disc").value,
        sort: document.getElementById("sort").value,
      });
      grid.innerHTML = rows(next.shown);
      updateCount(next.shown, next.sort);
    };
    for (const id of ["q", "cat", "store", "disc", "sort"]) {
      const el = document.getElementById(id);
      el.addEventListener("input", refresh);
      el.addEventListener("change", refresh);
    }
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener("hashchange", render);
render();
