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

// Sky map zoom/pan state
let skyZoom = 1;
let skyPanX = 0;
let skyPanY = 0;
let skyIsDragging = false;
let skyDragStartX = 0;
let skyDragStartY = 0;
let currentSkyObjects = [];

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
const skyCanvas = document.getElementById("sky-map");
const skyCtx = skyCanvas.getContext("2d");

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
    drawSkyMap(data.objects);
    setStatus("Loaded", false);
  } catch (err) {
    console.error(err);
    setStatus(err.message, true);
    objectsEl.innerHTML = "";
    summaryEl.textContent = "Request failed.";
    tzPill.textContent = "Timezone: --";
    clearSkyMap();
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

// Sky map drawing functions
function altAzToXY(altitude, azimuth, centerX, centerY, maxRadius) {
  // Map altitude: 90° (zenith) -> center (radius 0), 0° (horizon) -> edge (maxRadius)
  const radiusFromCenter = ((90 - altitude) / 90) * maxRadius;
  // Convert azimuth to radians (0° = North = top of canvas)
  const angleRad = (azimuth * Math.PI) / 180;
  
  return {
    x: centerX + radiusFromCenter * Math.sin(angleRad),
    y: centerY - radiusFromCenter * Math.cos(angleRad) // Negative because canvas Y grows down
  };
}

function getObjectColor(type) {
  const colors = {
    "sun": "#FDB813",
    "moon": "#C0C0C0",
    "planet": "#7ef29d",
    "star": "#5cf0ff"
  };
  return colors[type.toLowerCase()] || "#5cf0ff";
}

function getObjectRadius(magnitude) {
  // Lower magnitude = brighter = larger circle
  // Clamp between 1.5 and 6 pixels for less clutter
  const radius = 7 - magnitude * 0.5;
  return Math.max(1.5, Math.min(6, radius));
}

function clearSkyMap() {
  skyCtx.clearRect(0, 0, skyCanvas.width, skyCanvas.height);
  skyCtx.fillStyle = "#0d1124";
  skyCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);
  
  const centerX = skyCanvas.width / 2;
  const centerY = skyCanvas.height / 2;
  const maxRadius = Math.min(centerX, centerY) - 40;
  
  // Draw horizon circle
  skyCtx.strokeStyle = "#1f2a4d";
  skyCtx.lineWidth = 2;
  skyCtx.beginPath();
  skyCtx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
  skyCtx.stroke();
  
  // Draw message
  skyCtx.fillStyle = "#9aa5c4";
  skyCtx.font = "14px sans-serif";
  skyCtx.textAlign = "center";
  skyCtx.fillText("No objects to display", centerX, centerY);
}

function drawSkyMap(objects) {
  currentSkyObjects = objects || [];
  
  if (!objects || objects.length === 0) {
    clearSkyMap();
    return;
  }
  
  renderSkyMap();
}

function renderSkyMap() {
  const objects = currentSkyObjects;
  const width = skyCanvas.width;
  const height = skyCanvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = (Math.min(centerX, centerY) - 40) * skyZoom;
  
  // Clear canvas
  skyCtx.clearRect(0, 0, width, height);
  skyCtx.fillStyle = "#0d1124";
  skyCtx.fillRect(0, 0, width, height);
  
  // Apply pan transformation
  skyCtx.save();
  skyCtx.translate(skyPanX, skyPanY);
  
  // Draw altitude rings (30° and 60°)
  skyCtx.strokeStyle = "rgba(31, 42, 77, 0.3)";
  skyCtx.lineWidth = 1;
  skyCtx.setLineDash([3, 3]);
  
  [30, 60].forEach(alt => {
    const radius = ((90 - alt) / 90) * maxRadius;
    skyCtx.beginPath();
    skyCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    skyCtx.stroke();
  });
  
  skyCtx.setLineDash([]);
  
  // Draw horizon circle (outer boundary)
  skyCtx.strokeStyle = "#1f2a4d";
  skyCtx.lineWidth = 2;
  skyCtx.beginPath();
  skyCtx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
  skyCtx.stroke();
  
  // Draw cardinal directions
  const cardinals = [
    { label: "N", azimuth: 0 },
    { label: "E", azimuth: 90 },
    { label: "S", azimuth: 180 },
    { label: "W", azimuth: 270 }
  ];
  
  skyCtx.fillStyle = "#9aa5c4";
  skyCtx.font = "bold 14px sans-serif";
  skyCtx.textAlign = "center";
  skyCtx.textBaseline = "middle";
  
  cardinals.forEach(({ label, azimuth }) => {
    const pos = altAzToXY(0, azimuth, centerX, centerY, maxRadius + 20);
    skyCtx.fillText(label, pos.x, pos.y);
  });
  
  // Draw zenith marker
  skyCtx.fillStyle = "#9aa5c4";
  skyCtx.font = "12px sans-serif";
  skyCtx.textAlign = "center";
  skyCtx.fillText("+", centerX, centerY - 5);
  skyCtx.fillText("Zenith", centerX, centerY + 15);
  
  // Draw celestial objects
  objects.forEach((obj, idx) => {
    const pos = altAzToXY(obj.altitude, obj.azimuth, centerX, centerY, maxRadius);
    const color = getObjectColor(obj.type);
    const radius = getObjectRadius(obj.magnitude);
    
    // Draw glow effect
    skyCtx.shadowBlur = 8;
    skyCtx.shadowColor = color;
    
    // Draw object circle
    skyCtx.fillStyle = color;
    skyCtx.beginPath();
    skyCtx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    skyCtx.fill();
    
    // Reset shadow for text
    skyCtx.shadowBlur = 0;
    
    // Draw label
    skyCtx.fillStyle = "#eef2ff";
    skyCtx.font = "11px sans-serif";
    skyCtx.textAlign = "left";
    skyCtx.textBaseline = "middle";
    
    // Offset label based on position to avoid edge clipping
    let offsetX = radius + 8;
    let offsetY = 0;
    
    // If near right edge, flip label to left
    if (pos.x > width - 80) {
      skyCtx.textAlign = "right";
      offsetX = -(radius + 8);
    }
    
    skyCtx.fillText(obj.name, pos.x + offsetX, pos.y + offsetY);
  });
  
  // Restore context
  skyCtx.restore();
  
  // Draw zoom level indicator (not affected by pan)
  skyCtx.fillStyle = "rgba(31, 42, 77, 0.8)";
  skyCtx.fillRect(10, 10, 100, 30);
  skyCtx.fillStyle = "#9aa5c4";
  skyCtx.font = "12px sans-serif";
  skyCtx.textAlign = "left";
  skyCtx.fillText(`Zoom: ${skyZoom.toFixed(1)}x`, 20, 28);
}

function setStatus(msg, isError) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? "var(--error)" : "var(--muted)";
}

function wireEvents() {
  fetchBtn.addEventListener("click", fetchObjects);
  
  // Sky map zoom with mouse wheel
  skyCanvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    skyZoom = Math.max(0.5, Math.min(5, skyZoom + delta));
    if (currentSkyObjects.length > 0) {
      renderSkyMap();
    }
  });
  
  // Sky map pan with mouse drag
  skyCanvas.addEventListener("mousedown", (e) => {
    skyIsDragging = true;
    skyDragStartX = e.offsetX - skyPanX;
    skyDragStartY = e.offsetY - skyPanY;
    skyCanvas.style.cursor = "grabbing";
  });
  
  skyCanvas.addEventListener("mousemove", (e) => {
    if (skyIsDragging) {
      const newPanX = e.offsetX - skyDragStartX;
      const newPanY = e.offsetY - skyDragStartY;
      
      // Calculate the visible sky map bounds based on zoom
      const width = skyCanvas.width;
      const height = skyCanvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = (Math.min(centerX, centerY) - 40) * skyZoom;
      
      // Limit pan so the horizon circle edge stays within canvas bounds
      const minPanX = -maxRadius - centerX + 50;
      const maxPanX = maxRadius + centerX - 50;
      const minPanY = -maxRadius - centerY + 50;
      const maxPanY = maxRadius + centerY - 50;
      
      skyPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));
      skyPanY = Math.max(minPanY, Math.min(maxPanY, newPanY));
      
      if (currentSkyObjects.length > 0) {
        renderSkyMap();
      }
    }
  });
  
  skyCanvas.addEventListener("mouseup", () => {
    skyIsDragging = false;
    skyCanvas.style.cursor = "grab";
  });
  
  skyCanvas.addEventListener("mouseleave", () => {
    skyIsDragging = false;
    skyCanvas.style.cursor = "grab";
  });
  
  // Reset zoom/pan on double-click
  skyCanvas.addEventListener("dblclick", () => {
    skyZoom = 1;
    skyPanX = 0;
    skyPanY = 0;
    if (currentSkyObjects.length > 0) {
      renderSkyMap();
    }
  });
  
  skyCanvas.style.cursor = "grab";
}

function main() {
  buildQuickCities();
  initMap();
  setDefaults();
  wireEvents();
  clearSkyMap(); // Initialize empty sky map
}

main();
