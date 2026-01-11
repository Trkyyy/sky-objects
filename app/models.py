from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List


class ObservationRequest(BaseModel):
    """Request model for the observation endpoint"""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees (-90 to 90)")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees (-180 to 180)")
    time: Optional[str] = Field(None, description="Time in ISO format (YYYY-MM-DDTHH:MM:SS). If not provided, current time at location is used")

    @field_validator('time')
    @classmethod
    def validate_time_format(cls, v):
        if v is None:
            return v
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except ValueError:
            raise ValueError("Time must be in ISO format (YYYY-MM-DDTHH:MM:SS)")


class CelestialObject(BaseModel):
    """Model for celestial object response"""
    name: str
    type: str
    magnitude: float
    altitude: float
    azimuth: float
    right_ascension: str
    declination: str
    is_above_horizon: bool
    distance: Optional[float] = None  # In AU for planets


class ObservationResponse(BaseModel):
    """Response model for the observation endpoint"""
    location: dict
    time_used: str
    timezone_info: str
    objects: List[CelestialObject]
    total_objects_found: int