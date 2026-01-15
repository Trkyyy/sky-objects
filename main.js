const quickCities = [
  { name: "Belfast", lat: 54.5973, lon: -5.9301 },
  { name: "New York", lat: 40.7128, lon: -74.0060 },
  { name: "Dublin", lat: 53.3498, lon: -6.2603 },
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
let hoveredObject = null;
let celestialObjectsData = []; // Store objects globally for modal access

// DOM elements - will be assigned in main()
let latInput, lonInput, dateInput, timeInput, fetchBtn, statusEl, objectsEl, summaryEl, tzPill, skyCanvas, skyCtx, skyTooltip;

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
  if (!latInput || !lonInput) {
    console.error('DOM elements not initialized: latInput=' + latInput + ', lonInput=' + lonInput);
    return;
  }
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
    btn.addEventListener("click", (e) => {
      setLocation(city.lat, city.lon);
      map.setView([city.lat, city.lon], 5);
      // Manage active state for chips
      setActiveChip(e.currentTarget);
    });
    container.appendChild(btn);
  });
}

function setActiveChip(btn) {
  // Remove active from all chips, add to the provided one
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function setDefaults() {
  if (!dateInput || !timeInput) {
    console.error('DOM elements not initialized: dateInput=' + dateInput + ', timeInput=' + timeInput);
    return;
  }
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
//asdawdasd


async function fetchObjects() {
  if (!latInput || !lonInput || !dateInput || !timeInput) {
    console.error('DOM elements not initialized when fetchObjects called');
    console.error('latInput:', latInput);
    console.error('lonInput:', lonInput);
    console.error('dateInput:', dateInput);
    console.error('timeInput:', timeInput);
    return;
  }
  
  const lat = parseFloat(latInput.value);
  const lon = parseFloat(lonInput.value);
  const time = isoForApi(dateInput.value, timeInput.value);
  // Use environment variable API_BASE_URL if available, otherwise fall back to localhost
  const apiBase = window.ENV?.API_BASE_URL || "http://localhost:8000";

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
    celestialObjectsData = [];
    return;
  }

  // Store objects globally for modal access
  celestialObjectsData = objects;

  objectsEl.innerHTML = objects
    .map((obj, index) => {
      const displayType = String(obj.type).charAt(0).toUpperCase() + String(obj.type).slice(1).toLowerCase();
      
      return `
        <div class="card">
          <div>
            <div class="row">
              <h3 style="margin:0">${obj.name}</h3>
              <span class="badge">${displayType}</span>
            </div>
            <div class="meta">Mag ${obj.magnitude.toFixed(2)} · Alt ${obj.altitude.toFixed(2)}° · Az ${obj.azimuth.toFixed(2)}°</div>
          </div>
          <button class="btn-details" onclick="showObjectDetails(${index})">Details</button>
        </div>
      `;
    })
    .join("");
}

function showObjectDetails(objIndex) {
  // Get object from globally stored data
  const obj = celestialObjectsData[objIndex];
  
  if (!obj) {
    console.error("Object not found at index", objIndex);
    return;
  }
  
  const isStar = String(obj.type).toLowerCase() === "star";
  const displayType = String(obj.type).charAt(0).toUpperCase() + String(obj.type).slice(1).toLowerCase();
  const dist = obj.distance !== null && obj.distance !== undefined ? `${obj.distance.toFixed(3)} AU` : "--";
  
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalOverlay = document.getElementById("details-modal");
  
  const tooltips = {
    type: "Classification of this celestial object (Planet, Moon, Star, or the Sun/Moon)",
    magnitude: "Apparent brightness on a scale where lower numbers are brighter. The brightest objects have negative magnitudes. Learn more below ↓",
    altitude: "Height above the horizon in degrees. 0° is at the horizon, 90° is directly overhead (zenith)",
    azimuth: "Direction from north, measured clockwise. 0° is north, 90° is east, 180° is south, 270° is west",
    ra: "Right Ascension (RA) - celestial longitude coordinate, measured in hours (h), minutes (m), and seconds (s). Learn more below ↓",
    dec: "Declination (Dec) - celestial latitude coordinate, measured in degrees (°), arcminutes (′), and arcseconds (″). Positive (+) is north of the celestial equator, negative (-) is south. Learn more below ↓",
    distance: "Distance from Earth in Astronomical Units (AU). 1 AU = Earth's distance from the Sun (~150 million km)"
  };
  
  modalTitle.textContent = obj.name;
  modalBody.innerHTML = `
    <div class="modal-detail-row">
      <div class="label-with-tooltip">
        <span class="label">Type</span>
        <span class="tooltip-icon" data-tooltip="${tooltips.type}">ℹ</span>
      </div>
      <span class="value">${displayType}</span>
    </div>
    <div class="modal-detail-row">
      <div class="label-with-tooltip">
        <span class="label">Magnitude</span>
        <span class="tooltip-icon" data-tooltip="${tooltips.magnitude}">ℹ</span>
      </div>
      <span class="value">${obj.magnitude.toFixed(2)}</span>
    </div>
    <div class="modal-detail-row">
      <div class="label-with-tooltip">
        <span class="label">Altitude</span>
        <span class="tooltip-icon" data-tooltip="${tooltips.altitude}">ℹ</span>
      </div>
      <span class="value">${obj.altitude.toFixed(2)}°</span>
    </div>
    <div class="modal-detail-row">
      <div class="label-with-tooltip">
        <span class="label">Azimuth</span>
        <span class="tooltip-icon" data-tooltip="${tooltips.azimuth}">ℹ</span>
      </div>
      <span class="value">${obj.azimuth.toFixed(2)}°</span>
    </div>
    <div class="modal-detail-row">
      <div class="label-with-tooltip">
        <span class="label">Right Ascension</span>
        <span class="tooltip-icon" data-tooltip="${tooltips.ra}">ℹ</span>
      </div>
      <span class="value">${obj.right_ascension}</span>
    </div>
    <div class="modal-detail-row">
      <div class="label-with-tooltip">
        <span class="label">Declination</span>
        <span class="tooltip-icon" data-tooltip="${tooltips.dec}">ℹ</span>
      </div>
      <span class="value">${obj.declination}</span>
    </div>
    ${isStar ? "" : `<div class="modal-detail-row">
      <div class="label-with-tooltip">
        <span class="label">Distance</span>
        <span class="tooltip-icon" data-tooltip="${tooltips.distance}">ℹ</span>
      </div>
      <span class="value">${dist}</span>
    </div>`}
  `;
  
  modalOverlay.classList.add("visible");
  
  // Attach tooltip listeners
  attachTooltipListeners();
}

function attachTooltipListeners() {
  const tooltipIcons = document.querySelectorAll(".tooltip-icon");
  
  tooltipIcons.forEach(icon => {
    // Create handlers that we'll attach directly
    const handleMouseEnter = function(e) {
      const icon = e.currentTarget;
      
      // Clean up any existing tooltip
      if (icon._tooltipElement && icon._tooltipElement.parentNode) {
        icon._tooltipElement.remove();
      }
      
      const tooltip = document.createElement("div");
      tooltip.className = "detail-tooltip";
      tooltip.textContent = icon.getAttribute("data-tooltip");
      document.body.appendChild(tooltip);
      
      // Store reference on the icon itself
      icon._tooltipElement = tooltip;
      
      // Force a reflow to ensure the tooltip is rendered before measuring
      tooltip.offsetHeight;
      
      const rect = icon.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      // Position above the icon, centered
      let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
      let top = rect.top - tooltipRect.height - 8;
      
      // Adjust if tooltip goes off left edge
      if (left < 10) {
        left = 10;
      }
      // Adjust if tooltip goes off right edge
      else if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }
      
      // Adjust if tooltip goes off top edge (show below instead)
      if (top < 10) {
        top = rect.bottom + 8;
      }
      
      tooltip.style.left = left + "px";
      tooltip.style.top = top + "px";
    };
    
    const handleMouseLeave = function(e) {
      const icon = e.currentTarget;
      if (icon._tooltipElement && icon._tooltipElement.parentNode) {
        icon._tooltipElement.remove();
        icon._tooltipElement = null;
      }
    };
    
    // Attach the event listeners directly
    icon.addEventListener("mouseenter", handleMouseEnter);
    icon.addEventListener("mouseleave", handleMouseLeave);
  });
}

// Educational content for the Learn More panel
const educationalContent = {
  magnitude: `
    <p>Magnitude tells you how bright an object appears from Earth. The scale is counterintuitive - smaller (more negative) numbers mean brighter objects.</p>
    <p><strong>Example:</strong> The Sun has a magnitude of about -26.7 (extremely bright), while Jupiter's is around -2.9, and the faintest stars visible to the naked eye are around +6.5.</p>
    <p>Magnitude depends on both the object's actual luminosity and its distance from Earth. A dim nearby star might appear brighter than a brilliant distant star.</p>
  `,
  ra: `
    <h4 style="color: var(--accent); margin: 24px 0 16px 0; font-size: 16px;">Right Ascension and Declination Coordinate System</h4>
    
    <p>This system is also known as the <strong>Equatorial coordinate system</strong>. Just like we use latitude and longitude to locate places on Earth, astronomers use Right Ascension and Declination to locate objects in the sky. This system is often used when configuring a telescope, so it might be useful to learn if you wish to do that. The below helped me to understand the concept:</p>
    <p><strong>Recommended resources:</strong></p>
    <ul class="learn-links" style="margin:0 0 12px 18px; padding:0;">
      <li>
        <a class="learn-link" href="https://www.youtube.com/watch?v=qtE3JKApp8c" target="_blank" rel="noopener">
          Simple guide to Right Ascension & Declination by AstroPhil (YouTube)
        </a>
      </li>
      <li>
        <a class="learn-link" href="https://en.wikipedia.org/wiki/Equatorial_coordinate_system" target="_blank" rel="noopener">
          Equatorial coordinate system on Wikipedia
        </a>
      </li>
      <li>
        <a class="learn-link" href="https://skyandtelescope.org/astronomy-resources/right-ascension-declination-celestial-coordinates/" target="_blank" rel="noopener">
          Right Ascension & Declination by Bob King (Sky & Telescope)
        </a>
      </li>
    </ul>
    
    <div class="diagram-container">
      <img src="assets/ra_and_dec_demo_animation_small.gif" 
           alt="Right Ascension and Declination coordinate system animation" 
           style="max-width: 100%; height: auto; border-radius: 8px;"/>
      <div class="attribution">
        <small>Animation by <a href="https://commons.wikimedia.org/wiki/User:Tfr000" target="_blank" rel="noopener">Tfr000</a> - Own work, <a href="https://creativecommons.org/licenses/by-sa/3.0" target="_blank" rel="noopener">CC BY-SA 3.0</a>, <a href="https://commons.wikimedia.org/w/index.php?curid=19127102" target="_blank" rel="noopener">Wikimedia Commons</a></small>
      </div>
    </div>
    
    <h5 style="color: var(--accent); margin: 20px 0 12px 0; font-size: 14px;">Right Ascension (RA)</h5>
    <p><strong>What is Right Ascension?</strong> Right Ascension is like longitude on Earth, but projected onto the celestial sphere. It measures how far east a star is from a standard starting point.</p>
    <p><strong>Like a clock:</strong> Right Ascension works like hours on a clock face. As Earth spins, stars appear to move around the sky in a 24-hour cycle.</p>
  `,
  declination: `
    <h5 style="color: var(--accent); margin: 20px 0 12px 0; font-size: 14px;">Declination (Dec)</h5>
    <p><strong>What is Declination?</strong> Declination is like latitude on Earth, but projected onto the celestial sphere. It measures how far north (+) or south (-) a star is from the celestial equator.</p>
    <p><strong>Key insight:</strong> Stars with positive declination are north of the celestial equator, while stars with negative declination are south of it.</p>
    <p><strong>Why Polaris matters:</strong> The North Star (Polaris) is at +89°, almost at the north pole of the sky, which is why it stays in one spot while other stars circle around it.</p>
  `
};

// Initialize the Learn More panel
function initLearnMorePanel() {
  const toggle = document.getElementById('learn-more-toggle');
  const content = document.getElementById('learn-more-content');
  const toggleIcon = toggle.querySelector('.toggle-icon');
  
  // Populate educational content
  document.querySelector('#magnitude-section .learn-text').innerHTML = educationalContent.magnitude;
  document.querySelector('#ra-section .learn-text').innerHTML = educationalContent.ra;
  document.querySelector('#declination-section .learn-text').innerHTML = educationalContent.declination;
  
  // Add interactive diagram functionality
  setupDiagramInteractions();
  
  // Add toggle functionality
  toggle.addEventListener('click', () => {
    const isExpanded = content.classList.contains('expanded');
    content.classList.toggle('expanded');
    toggleIcon.textContent = isExpanded ? '▼' : '▲';
    
    // Scroll to panel if expanding
    if (!isExpanded) {
      setTimeout(() => {
        toggle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  });
  
  // Add anchor link functionality for smooth scrolling to sections
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tooltip-icon')) {
      const tooltipText = e.target.getAttribute('data-tooltip');
      let targetSection = null;
      
      if (tooltipText.includes('magnitude') || tooltipText.includes('Magnitude')) {
        targetSection = document.getElementById('magnitude-section');
      } else if (tooltipText.includes('Right Ascension') || tooltipText.includes('RA')) {
        targetSection = document.getElementById('ra-section');
      } else if (tooltipText.includes('Declination') || tooltipText.includes('Dec')) {
        targetSection = document.getElementById('declination-section');
      }
      
      if (targetSection) {
        e.preventDefault();
        // Expand panel if not already expanded
        if (!content.classList.contains('expanded')) {
          content.classList.add('expanded');
          toggleIcon.textContent = '▲';
        }
        // Scroll to the specific section
        setTimeout(() => {
          targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  });
}

// Setup simple diagram functionality
function setupDiagramInteractions() {
  // Simple hover effects are handled by CSS
  // No complex interactions needed for the simplified diagrams
}

function closeModal() {
  const modalOverlay = document.getElementById("details-modal");
  modalOverlay.classList.remove("visible");
  
  // Clean up any remaining tooltips
  document.querySelectorAll(".detail-tooltip").forEach(tooltip => {
    tooltip.remove();
  });
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

function getObjectAtPosition(mouseX, mouseY) {
  const width = skyCanvas.width;
  const height = skyCanvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = (Math.min(centerX, centerY) - 40) * skyZoom;
  
  // Account for pan offset
  const adjustedX = mouseX - skyPanX;
  const adjustedY = mouseY - skyPanY;
  
  for (const obj of currentSkyObjects) {
    const pos = altAzToXY(obj.altitude, obj.azimuth, centerX, centerY, maxRadius);
    const radius = getObjectRadius(obj.magnitude);
    const distance = Math.sqrt(Math.pow(adjustedX - pos.x, 2) + Math.pow(adjustedY - pos.y, 2));
    
    // Add some padding for easier hovering (hitbox 3x the visual radius)
    if (distance <= radius * 3) {
      return obj;
    }
  }
  return null;
}

let skyTooltipPopper = null;

function showTooltip(obj, canvasX, canvasY) {
  if (!obj) {
    // Hide immediately without repositioning
    skyTooltip.classList.remove("visible");
    // Defer cleanup to avoid flash
    setTimeout(() => {
      if (skyTooltipPopper && !hoveredObject) {
        skyTooltipPopper.destroy();
        skyTooltipPopper = null;
      }
    }, 100);
    return;
  }
  
  const isStar = String(obj.type).toLowerCase() === "star";
  const dist = obj.distance !== null && obj.distance !== undefined ? `${obj.distance.toFixed(3)} AU` : "N/A";
  const displayType = String(obj.type).charAt(0).toUpperCase() + String(obj.type).slice(1).toLowerCase();

  skyTooltip.innerHTML = `
    <div class="tooltip-title">${obj.name}</div>
    <div class="tooltip-row">Type: <span>${displayType}</span></div>
    <div class="tooltip-row">Magnitude: <span>${obj.magnitude.toFixed(2)}</span></div>
    <div class="tooltip-row">Altitude: <span>${obj.altitude.toFixed(2)}°</span></div>
    <div class="tooltip-row">Azimuth: <span>${obj.azimuth.toFixed(2)}°</span></div>
    <div class="tooltip-row">RA: <span>${obj.right_ascension}</span></div>
    <div class="tooltip-row">Dec: <span>${obj.declination}</span></div>
    ${isStar ? "" : `<div class="tooltip-row">Distance: <span>${dist}</span></div>`}
  `;
  
  skyTooltip.classList.add("visible");
  
  // Create a virtual element at the mouse position
  const virtualElement = {
    getBoundingClientRect: () => {
      const rect = skyCanvas.getBoundingClientRect();
      const scaleX = rect.width / skyCanvas.width;
      const scaleY = rect.height / skyCanvas.height;
      
      const x = rect.left + canvasX * scaleX;
      const y = rect.top + canvasY * scaleY;
      
      // Return a small rectangle at the cursor position
      return {
        width: 0,
        height: 0,
        top: y,
        right: x,
        bottom: y,
        left: x
      };
    }
  };
  
  // If we already have a popper instance, destroy it
  if (skyTooltipPopper) {
    skyTooltipPopper.destroy();
  }
  
  // Create new popper instance
  skyTooltipPopper = Popper.createPopper(virtualElement, skyTooltip, {
    placement: 'right-start', // Try right side first
    modifiers: [
      {
        name: 'preventOverflow',
        options: {
          boundary: 'viewport',
          padding: 8
        }
      },
      {
        name: 'flip',
        options: {
          fallbackPlacements: ['left-start', 'right-end', 'left-end', 'top-start', 'top-end', 'bottom-start', 'bottom-end']
        }
      },
      {
        name: 'offset',
        options: {
          offset: [0, 8] // 8px offset from cursor
        }
      }
    ]
  });
}

function wireEvents() {
  fetchBtn.addEventListener("click", fetchObjects);
  
  // Modal close button
  const modalClose = document.getElementById("modal-close");
  const modalOverlay = document.getElementById("details-modal");
  
  modalClose.addEventListener("click", closeModal);
  
  // Close modal when clicking outside the content
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
  
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
    } else {
      // Check for hover when not dragging
      const obj = getObjectAtPosition(e.offsetX, e.offsetY);
      if (obj !== hoveredObject) {
        hoveredObject = obj;
        showTooltip(obj, e.offsetX, e.offsetY);
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
    hoveredObject = null;
    showTooltip(null);
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
  // Initialize DOM element references
  latInput = document.getElementById("lat");
  lonInput = document.getElementById("lon");
  dateInput = document.getElementById("date");
  timeInput = document.getElementById("time");
  fetchBtn = document.getElementById("fetch");
  statusEl = document.getElementById("status");
  objectsEl = document.getElementById("objects");
  summaryEl = document.getElementById("summary");
  tzPill = document.getElementById("timezone-pill");
  skyCanvas = document.getElementById("sky-map");
  skyTooltip = document.getElementById("sky-tooltip");
  
  // Check if critical elements were found
  if (!skyCanvas) {
    console.error("Could not find sky-map canvas element");
    return;
  }
  
  skyCtx = skyCanvas.getContext("2d");
  
  // Verify all critical DOM elements are found
  console.log("DOM elements initialized:", {
    latInput: !!latInput,
    lonInput: !!lonInput,
    dateInput: !!dateInput,
    timeInput: !!timeInput,
    fetchBtn: !!fetchBtn,
    skyCanvas: !!skyCanvas
  });

  buildQuickCities();
  initMap();
  setDefaults();
  wireEvents();
  initLearnMorePanel();
  clearSkyMap(); // Initialize empty sky map

  // Mark the first quick city as active (default) and fetch results immediately
  const firstChip = document.querySelector('#quick-cities .chip');
  if (firstChip) setActiveChip(firstChip);

  // Trigger initial fetch using the defaults set above
  fetchObjects();
}

document.addEventListener('DOMContentLoaded', () => {
  main();
});
