# Bright Celestial Objects API

A Python API that returns the 20 brightest celestial objects (stars, planets, moons) visible above the horizon at any given location and time.

## Features

- **Accurate Sky Calculations**: Uses PyEphem for precise astronomical calculations
- **Flexible Location & Time**: Accepts latitude, longitude, and optional time parameters
- **Comprehensive Object Coverage**: Includes planets, stars, Jupiter's Galilean moons, and the Moon/Sun
- **Automatic Timezone Detection**: Estimates timezone based on coordinates
- **RESTful API**: Built with FastAPI for easy integration
- **Full Documentation**: Interactive Swagger UI and ReDoc documentation included

## Installation

### Prerequisites
- Python 3.9+
- pip or conda

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd sky-objects
```

2. Create a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the API

Start the development server:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### Access Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### GET `/api/bright-objects`

Get the 20 brightest celestial objects above the horizon at a specified location and time.

**Query Parameters:**
- `latitude` (required): Latitude in decimal degrees (-90 to 90)
- `longitude` (required): Longitude in decimal degrees (-180 to 180)
- `time` (optional): Time in ISO format (YYYY-MM-DDTHH:MM:SS). Defaults to current UTC time if not provided.

**Response:**
```json
{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "coordinates": "40.712800, -74.006000"
  },
  "time_used": "2026-01-11T15:51:27.325717-05:00",
  "timezone_info": "America/New_York",
  "objects": [
    {
      "name": "Jupiter",
      "type": "planet",
      "magnitude": -2.52,
      "altitude": 3.08,
      "azimuth": 180.45,
      "right_ascension": "2h 34m 56.3s",
      "declination": "+15° 12' 34\"",
      "is_above_horizon": true,
      "distance": 5.123
    },
    ...
  ],
  "total_objects_found": 8
}
```

**Response Fields:**
- `name`: Common name of the celestial object
- `type`: Type of object (planet, star, moon, sun)
- `magnitude`: Apparent brightness (lower = brighter). Magnitude -1 is brighter than magnitude 1
- `altitude`: Height above horizon in degrees (0 to 90)
- `azimuth`: Direction from North (0-360 degrees, clockwise)
- `right_ascension`: Celestial coordinate (hours/minutes/seconds format)
- `declination`: Celestial coordinate (degrees/minutes/seconds format)
- `is_above_horizon`: Boolean indicating if object is visible above horizon
- `distance`: Distance in Astronomical Units (AU) - only for planets

### GET `/health`

Health check endpoint for monitoring API availability.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-11T20:51:27.325717"
}
```

### GET `/`

Root endpoint with API information.

**Response:**
```json
{
  "message": "Bright Celestial Objects API",
  "version": "1.0.0",
  "endpoints": {
    "GET /api/bright-objects": "Get brightest celestial objects at a location",
    "GET /docs": "API documentation",
    "GET /redoc": "Alternative documentation"
  }
}
```

## Celestial Objects Included

The API includes the following types of objects:

### Planets
- Mercury
- Venus
- Mars
- Jupiter
- Saturn
- Uranus
- Neptune

### Other Solar System Objects
- Sun
- Moon
- Jupiter's Galilean Moons: Io, Europa, Ganymede, Callisto

### Stars (35+ bright stars)
Including:
- Sirius (brightest star in the sky)
- Canopus
- Arcturus
- Vega
- Capella
- And many others...

## Understanding the Results

### Magnitude Scale
The magnitude scale indicates brightness. Lower (more negative) magnitudes mean brighter objects.

Examples:
- Sun: -26.74 (brightest)
- Moon: -12 to -10 (varies with phase)
- Venus: -4.5 to -3 (brightest star-like object)
- Jupiter: -2 to 2 (varies with position)
- Sirius: -1.46 (brightest star)
- Human eye limit: ~6 (darkest visible)

### Altitude
The angle above the horizon (0° = horizon, 90° = zenith directly overhead).
Objects below 0° altitude are below the horizon and not visible.

### Azimuth
The compass direction (0° = North, 90° = East, 180° = South, 270° = West).
