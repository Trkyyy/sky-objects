from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pytz
import os
from typing import Optional

# Handle both relative imports (when run as package) and absolute imports (when run directly)
try:
    from .models import ObservationRequest, ObservationResponse, CelestialObject
    from .utils import create_observer, get_bright_objects, format_coordinates, get_timezone_from_coordinates
except ImportError:
    from models import ObservationRequest, ObservationResponse, CelestialObject
    from utils import create_observer, get_bright_objects, format_coordinates, get_timezone_from_coordinates

app = FastAPI(
    title="Bright Celestial Objects API",
    description="API to get the brightest celestial objects at a specific location and time",
    version="1.0.0"
)

# Production-ready CORS settings
allowed_origins = [
    "http://localhost:8008",  # Local development
    "http://127.0.0.1:8008",
]

# Add production origins from environment variable
production_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
if production_origins and production_origins[0]:  # Check if not empty
    allowed_origins.extend([origin.strip() for origin in production_origins])

# For development, allow all origins (set ENVIRONMENT=development)
if os.getenv("ENVIRONMENT") == "development":
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Bright Celestial Objects API",
        "version": "1.0.0",
        "endpoints": {
            "GET /api/bright-objects": "Get brightest celestial objects at a location",
            "GET /docs": "API documentation",
            "GET /redoc": "Alternative documentation"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for Railway"""
    return {"status": "healthy", "service": "sky-objects-api"}


@app.get("/api/bright-objects", response_model=ObservationResponse)
async def get_bright_objects_endpoint(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude in decimal degrees"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude in decimal degrees"),
    time: Optional[str] = Query(None, description="Time in ISO format (YYYY-MM-DDTHH:MM:SS)")
):
    """
    Get the 20 brightest celestial objects above the horizon at a given location and time.
    
    - **latitude**: Latitude in decimal degrees (-90 to 90)
    - **longitude**: Longitude in decimal degrees (-180 to 180)
    - **time**: Optional time in ISO format. If not provided, uses current time at location.
    
    Returns a list of celestial objects with their properties.
    """
    try:
        # Create observer
        observer = create_observer(latitude, longitude, time)
        
        # Get current time in location's timezone
        timezone_str = get_timezone_from_coordinates(latitude, longitude)
        try:
            tz = pytz.timezone(timezone_str)
            dt_utc = observer.date.datetime()
            dt_local = dt_utc.astimezone(tz)
            time_used = dt_local.isoformat()
        except:
            # Fallback to UTC
            time_used = observer.date.datetime().isoformat()
            timezone_str = "UTC"
        
        # Get bright objects
        raw_objects = get_bright_objects(observer, max_objects=20)
        
        # Format coordinates and create response objects
        formatted_objects = []
        for obj in raw_objects:
            formatted_objects.append(CelestialObject(
                name=obj["name"],
                type=obj["type"],
                magnitude=round(obj["magnitude"], 2),
                altitude=round(obj["altitude"], 2),
                azimuth=round(obj["azimuth"], 2),
                right_ascension=format_coordinates(obj["right_ascension"]),
                declination=format_coordinates(obj["declination"]),
                is_above_horizon=obj["is_above_horizon"],
                distance=round(obj["distance"], 3) if obj["distance"] else None
            ))
        
        response = ObservationResponse(
            location={
                "latitude": latitude,
                "longitude": longitude,
                "coordinates": f"{latitude:.6f}, {longitude:.6f}"
            },
            time_used=time_used,
            timezone_info=timezone_str,
            objects=formatted_objects,
            total_objects_found=len(formatted_objects)
        )
        
        return response
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}