requireAuth();
renderSidebar("stations");

let allStations = [];

function renderStations(stations) {
  const grid = document.getElementById("station-grid");
  document.getElementById("results-count").textContent = `${stations.length} stations found nearby`;

  if (stations.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">No stations match your search.</div>`;
    return;
  }

  grid.innerHTML = stations
    .map(
      (s, i) => {
        const fallback = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='480'><rect fill='%23f0f4f8' width='100%' height='100%'/><text x='50%' y='50%' alignment-baseline='middle' text-anchor='middle' fill='%238b96a6' font-size='22'>Station image</text></svg>";
        return `
      <a class="station-card" href="station-detail.html?id=${s.id}">
        <img src="${s.image_url || ''}" alt="${s.name}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}';" />
        <div class="body">
          <div class="name-row">
            <div class="name">${s.name}</div>
            <span class="badge ${s.is_open ? "badge-green" : "badge-red"}">${s.is_open ? "Open" : "Closed"}</span>
          </div>
          <div class="meta-row">
            <span style="display:inline-flex;align-items:center;gap:6px;"><svg class='icon' aria-hidden='true' focusable='false'><use href='#icon-location'></use></svg> ${(1.2 + i * 0.3).toFixed(1)} km</span>
            <span style="display:inline-flex;align-items:center;gap:6px;"><svg class='icon' aria-hidden='true' focusable='false'><use href='#icon-star'></use></svg> ${s.rating}</span>
            ${s.has_fast_charge ? '<span class="badge badge-blue" style="display:inline-flex;align-items:center;gap:6px;"><svg class="icon" aria-hidden="true"><use href="#icon-bolt"></use></svg> Fast Charge</span>' : ""}
          </div>
          <div class="name-row" style="margin-top:auto; align-items:center;">
            <span class="price">฿${s.price_per_kwh.toFixed(2)}<span style="font-size:11px; color:var(--text-1);">/kWh</span></span>
            <span class="text-dim" style="font-size:12px;">${s.opening_hours}</span>
          </div>

          <div style="display:flex;gap:10px;margin-top:12px;">
            <button class="btn btn-outline fav-btn" data-id="${s.id}" onclick="event.preventDefault(); event.stopPropagation();">
              <svg class="icon" aria-hidden="true"><use href="#icon-heart"></use></svg>
              <span style="font-size:13px;">Favorite</span>
            </button>
            <a class="btn btn-primary" href="reservation.html?station=${s.id}" onclick="event.stopPropagation();">Reserve</a>
          </div>
        </div>
      </a>`;
      }
    )
    .join("");
}

function applyFiltersAndSort() {
  const search = document.getElementById("search-input").value.toLowerCase();
  const fastOnly = document.getElementById("fast-charge-filter").checked;
  const sortBy = document.getElementById("sort-select").value;

  let filtered = allStations.filter((s) => s.name.toLowerCase().includes(search));
  if (fastOnly) filtered = filtered.filter((s) => s.has_fast_charge);

  if (sortBy === "price") filtered.sort((a, b) => a.price_per_kwh - b.price_per_kwh);
  if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);

  renderStations(filtered);
}

document.getElementById("search-input").addEventListener("input", applyFiltersAndSort);
document.getElementById("sort-select").addEventListener("change", applyFiltersAndSort);
document.getElementById("fast-charge-filter").addEventListener("change", applyFiltersAndSort);

(async function init() {
  try {
    allStations = await Api.get("/stations");
    applyFiltersAndSort();
  } catch (err) {
    showToast(err.message, true);
  }
})();
