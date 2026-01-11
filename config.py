# Sky Objects API Configuration
# Default values and constants used throughout the application

# Server Configuration
SERVER_HOST = "0.0.0.0"
SERVER_PORT = 8000
RELOAD = True
LOG_LEVEL = "info"

# API Configuration
MAX_OBJECTS_DEFAULT = 20
MAX_OBJECTS_LIMIT = 50  # Maximum allowed value for max_objects parameter
API_VERSION = "1.0.0"
API_TITLE = "Bright Celestial Objects API"
API_DESCRIPTION = "API to get the brightest celestial objects at a specific location and time"

# Coordinates Validation
MIN_LATITUDE = -90.0
MAX_LATITUDE = 90.0
MIN_LONGITUDE = -180.0
MAX_LONGITUDE = 180.0

# Time Configuration
DEFAULT_TIME_FORMAT = "%Y-%m-%dT%H:%M:%S"  # ISO format
ACCEPT_TIMEZONE_FORMAT = True

# Magnitude Configuration
MAGNITUDE_LIMIT = 6.0  # Human eye visibility limit in ideal conditions
INCLUDE_BELOW_HORIZON = False  # Include objects below horizon in results

# Timezone Settings
USE_TIMEZONE_APPROXIMATION = True  # If True, uses longitude-based approximation
# Set to False if integrating with timezone API

# Star Catalog Settings
MIN_STAR_MAGNITUDE = 3.0  # Minimum magnitude to include stars
# (lower = fainter, so this includes stars up to magnitude 3.0)

# CORS Settings
CORS_ORIGINS = ["*"]  # In production, specify exact origins
CORS_CREDENTIALS = True
CORS_METHODS = ["*"]
CORS_HEADERS = ["*"]

# Astronomical Constants
# These are provided by PyEphem, but can be overridden here if needed
AU_IN_KM = 149597870.7  # Astronomical Unit in kilometers

# Feature Flags
ENABLE_MOON_PHASES = False  # Future enhancement
ENABLE_RISE_SET_TIMES = False  # Future enhancement
ENABLE_ATMOSPHERIC_REFRACTION = False  # Future enhancement
ENABLE_PROPER_MOTION = False  # Future enhancement
ENABLE_DEEP_SKY_OBJECTS = False  # Future enhancement

# Performance Settings
CACHE_RESULTS = False  # Set to True to cache results (requires caching library)
CACHE_TTL = 300  # Cache time-to-live in seconds (5 minutes)

# Logging
LOG_REQUESTS = True
LOG_RESPONSES = False  # Set to True for verbose logging

# API Documentation
INCLUDE_SWAGGER_UI = True
INCLUDE_REDOC = True
