# Frontend (Bright Sky Objects)

Minimal Leaflet-based UI to pick a location/time, call `/api/bright-objects`, and render the brightest objects list.

## Run locally

1) Start backend (from repo root):
```
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2) Serve the frontend (from repo root):
```
python -m http.server 8008 -d frontend
```

3) Open in browser:
```
http://localhost:8008
```

If backend runs on a different host/port, change the "API base URL" input in the form.

## Usage
- Click on the map to set coordinates or use quick city chips.
- Adjust date/time; defaults to now. Times are sent as UTC (`Z`).
- Press "Find bright objects" to fetch results.
- Results show magnitude, altitude, azimuth, RA/Dec, and distance (planets only).

## Notes
- Backend CORS is open; no auth required.
- Timezone in results is coarse (longitude buckets from backend). Displayed as returned by API.
- Objects are already filtered to altitude > 0 and sorted by brightness.
