const quickCities = [
  { name: "New York", lat: 40.7128, lon: -74.0060 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093 },
  { name: "San Francisco", lat: 37.7749, lon: -122.4194 },
  { name: "Cape Town", lat: -33.9249, lon: 18.4241 },
];

let map;
let marker;

const latInput = document.getElementById("lat");
const lonInput = document.getElementById("lon");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const apiBaseInput = document.getElementById("api-base");
const fetchBtn = document.getElementById("fetch");
const statusEl = document.getElementById("status");
const objectsEl = document.getElementById("objects");
const summaryEl = document.getElementById("summary");
const tzPill = document.getElementById("timezone-pill");

function initMap() {
  const start = quickCities[0];
  map = L.map("map", { zoomControl: true }).setView([start.lat, start.lon], 3);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  marker = L.marker([start.lat, start.lon]).addTo(map);

  map.on("click", (e) => {
    setLocation(e.latlng.lat, e.latlng.lng);
  });
}

function setLocation(lat, lon) {
  latInput.value = lat.toFixed(4);
  lonInput.value = lon.toFixed(4);
  marker.setLatLng([lat, lon]);
}

function buildQuickCities() {
  const container = document.getElementById("quick-cities");
  container.innerHTML = "";
  quickCities.forEach((city) => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.textContent = city.name;
    btn.addEventListener("click", () => {
      setLocation(city.lat, city.lon);
      map.setView([city.lat, city.lon], 5);
    });
    container.appendChild(btn);
  });
}

function setDefaults() {
  const now = new Date();
  const isoDate = now.toISOString().slice(0, 10);
  const isoTime = now.toISOString().slice(11, 19);
  dateInput.value = isoDate;
  timeInput.value = isoTime;
  setLocation(quickCities[0].lat, quickCities[0].lon);
}

function isoForApi(dateStr, timeStr) {
  if (!dateStr && !timeStr) return null;
  if (!dateStr || !timeStr) return null;
  const local = new Date(`${dateStr}T${timeStr}`);
  if (isNaN(local.getTime())) return null;
  // Send as UTC with Z to match backend parsing
  return local.toISOString().slice(0, 19) + "Z";
}

async function fetchObjects() {
  const lat = parseFloat(latInput.value);
  const lon = parseFloat(lonInput.value);
  const time = isoForApi(dateInput.value, timeInput.value);
  const apiBase = apiBaseInput.value.trim().replace(/\/$/, "");

  if (Number.isNaN(lat) || lat < -90 || lat > 90) {
    setStatus("Latitude must be between -90 and 90", true);
    return;
  }
  if (Number.isNaN(lon) || lon < -180 || lon > 180) {
    setStatus("Longitude must be between -180 and 180", true);
    return;
  }

  const params = new URLSearchParams({ latitude: lat, longitude: lon });
  if (time) params.append("time", time);

  const url = `${apiBase}/api/bright-objects?${params.toString()}`;
  setStatus("Loading...", false);
  fetchBtn.disabled = true;

  try {
    const resp = await fetch(url);
    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error(`Bad JSON response: ${text}`);
    }
    if (!resp.ok) {
      throw new Error(data.detail || `Request failed with ${resp.status}`);
    }
    renderResults(data);
    setStatus("Loaded", false);
  } catch (err) {
    console.error(err);
    setStatus(err.message, true);
    objectsEl.innerHTML = "";
    summaryEl.textContent = "Request failed.";
    tzPill.textContent = "Timezone: --";
  } finally {
    fetchBtn.disabled = false;
  }
}

function renderResults(data) {
  const { location, time_used, timezone_info, objects, total_objects_found } = data;
  summaryEl.textContent = `Found ${total_objects_found} objects for ${location.coordinates} at ${time_used}`;
  tzPill.textContent = `Timezone: ${timezone_info}`;

  if (!objects || objects.length === 0) {
    objectsEl.innerHTML = "<p class=\"meta\">No objects above the horizon.</p>";
    return;
  }

  objectsEl.innerHTML = objects
    .map((obj, idx) => {
      const dist = obj.distance !== null && obj.distance !== undefined ? `${obj.distance.toFixed(3)} AU` : "--";
      const badge = idx < 3 ? `<span class=\"badge\">Top ${idx + 1}</span>` : "";
      return `
        <div class="card">
          <div>
            <div class="row">
              <h3 style="margin:0">${obj.name}</h3>
              ${badge}
              <span class="badge">${obj.type}</span>
            </div>
            <div class="meta">Mag ${obj.magnitude.toFixed(2)} · Alt ${obj.altitude.toFixed(2)}° · Az ${obj.azimuth.toFixed(2)}°</div>
            <div class="tags">
              <span>RA ${obj.right_ascension}</span>
              <span>Dec ${obj.declination}</span>
              <span>Distance ${dist}</span>
            </div>
          </div>
          <div class="badge">Above horizon</div>
        </div>
      `;
    })
    .join("");
}

function setStatus(msg, isError) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? "var(--error)" : "var(--muted)";
}

function wireEvents() {
  fetchBtn.addEventListener("click", fetchObjects);
}

function main() {
  buildQuickCities();
  initMap();
  setDefaults();
  wireEvents();
}

main();
