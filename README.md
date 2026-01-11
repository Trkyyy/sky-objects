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

## Usage Examples

### Using cURL

Get the brightest objects visible from New York right now:
```bash
curl "http://localhost:8000/api/bright-objects?latitude=40.7128&longitude=-74.0060"
```

Get the brightest objects for a specific time and location (Tokyo, Jan 15 2026 at 22:00):
```bash
curl "http://localhost:8000/api/bright-objects?latitude=35.6762&longitude=139.6503&time=2026-01-15T22:00:00"
```

### Using Python requests

```python
import requests

response = requests.get(
    "http://localhost:8000/api/bright-objects",
    params={
        "latitude": 40.7128,
        "longitude": -74.0060,
        "time": "2026-01-15T22:00:00"
    }
)

data = response.json()
for obj in data['objects'][:10]:
    print(f"{obj['name']} - Magnitude: {obj['magnitude']}, Altitude: {obj['altitude']}°")
```

### Using JavaScript/Fetch

```javascript
fetch('http://localhost:8000/api/bright-objects?latitude=40.7128&longitude=-74.0060')
  .then(response => response.json())
  .then(data => {
    console.log(`Objects found: ${data.total_objects_found}`);
    data.objects.forEach((obj, i) => {
      console.log(`${i+1}. ${obj.name} (${obj.type}) - Magnitude: ${obj.magnitude}`);
    });
  });
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

## Configuration

### Environment Variables
Currently, the API doesn't require environment variables, but you can configure:

1. **Port**: Change port when starting the server
   ```bash
   python -m uvicorn app.main:app --port 8080
   ```

2. **Host**: Change host binding
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1  # localhost only
   ```

## Project Structure

```
sky-objects/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application and endpoints
│   ├── models.py            # Pydantic models for request/response
│   └── utils.py             # Astronomical calculations and helper functions
├── requirements.txt         # Python dependencies
├── test_api.py             # API test script
└── README.md               # This file
```

## Dependencies

- **fastapi**: Web framework
- **uvicorn**: ASGI server
- **pyephem**: Astronomical calculations
- **pydantic**: Data validation
- **pytz**: Timezone support
- **python-multipart**: Form data handling

## Development

### Running Tests

A test script is provided:
```bash
python test_api.py
```

This will test the API with different locations and parameters.

### Code Structure

- `main.py`: Contains the FastAPI app and endpoint definitions
- `models.py`: Pydantic models for request/response validation
- `utils.py`: Core astronomy functions and star catalog

### Adding More Stars

To add more stars to the catalog, edit the `bright_stars` list in `app/utils.py`:

```python
bright_stars = [
    ("Star Name", "HH MM SS", "+DD° MM' SS\"", magnitude),
    # ... more stars
]
```

Right ascension (RA) is in hours/minutes/seconds format.
Declination (Dec) is in degrees/minutes/seconds format.

## Performance Considerations

- The API calculates positions for 35+ stars and planets for each request
- Typical response time: 10-50ms
- Suitable for real-time applications

## Limitations

1. **Timezone Approximation**: The timezone is estimated from longitude alone. For accurate timezone information, consider integrating a proper timezone API.

2. **Star Catalog**: The built-in star catalog contains only the brightest stars. For a complete star catalog, consider integrating the Hipparcos or Tycho-2 catalogs.

3. **No Proper Motion**: Star positions don't account for proper motion (stars' gradual movement across the sky over centuries).

4. **No Atmospheric Refraction**: Calculations don't account for atmospheric refraction, which can affect altitude calculations by ~0.5° near the horizon.

## Future Enhancements

- [ ] Integration with external timezone API for accuracy
- [ ] Full Hipparcos star catalog support
- [ ] Proper motion calculations
- [ ] Atmospheric refraction corrections
- [ ] Deep sky objects (nebulae, galaxies, clusters)
- [ ] Moon phases information
- [ ] Rise/set time calculations
- [ ] Magnitude limit configuration

## API Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters (out of range or bad format)
- `500 Internal Server Error`: Server error (rare)

Error responses include a detail message:
```json
{
  "detail": "Error message describing what went wrong"
}
```

## License

[Add appropriate license here]

## Credits

- **PyEphem**: For astronomical calculations (https://rhodesmill.org/pyephem/)
- **FastAPI**: For the web framework (https://fastapi.tiangolo.com/)
- **Star Data**: From Hipparcos and other astronomical catalogs

## Support

For issues, questions, or suggestions, please open an issue in the repository.

---

**Last Updated**: January 2026
