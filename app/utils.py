import ephem
import math
from datetime import datetime
from typing import List, Dict, Any
import pytz


def create_observer(latitude: float, longitude: float, time_str: str = None) -> ephem.Observer:
    """
    Create an ephem.Observer object for the given location and time.
    If time is not provided, uses current time at that location.
    """
    observer = ephem.Observer()
    
    # Set location
    observer.lat = str(latitude)
    observer.lon = str(longitude)
    
    # Set time (convert to UTC)
    if time_str:
        # Parse ISO format time
        dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
        observer.date = ephem.Date(dt)
    else:
        # Use current UTC time
        observer.date = ephem.Date(datetime.utcnow())
    
    return observer


def get_timezone_from_coordinates(latitude: float, longitude: float) -> str:
    """
    Get approximate timezone from latitude and longitude coordinates.
    Uses simple longitude-based approximation.
    For production use, consider using an external API or library.
    """
    return get_approximate_timezone(longitude)


def get_approximate_timezone(longitude: float) -> str:
    """
    Get approximate timezone from longitude (fallback method).
    """
    if -180 <= longitude <= -120:
        return "America/Los_Angeles"
    elif -120 < longitude <= -60:
        return "America/New_York"
    elif -60 < longitude <= 0:
        return "Europe/London"
    elif 0 < longitude <= 60:
        return "Europe/Paris"
    elif 60 < longitude <= 120:
        return "Asia/Shanghai"
    elif 120 < longitude <= 180:
        return "Asia/Tokyo"
    return "UTC"


def get_bright_objects(observer: ephem.Observer, max_objects: int = 20) -> List[Dict[str, Any]]:
    """
    Get the brightest celestial objects above the horizon.
    Returns a list sorted by brightness (magnitude).
    """
    objects = []
    
    # Define celestial objects to check
    celestial_objects = [
        # Sun and Moon
        (ephem.Sun(), "Sun"),
        (ephem.Moon(), "Moon"),
        
        # Planets
        (ephem.Mercury(), "Mercury"),
        (ephem.Venus(), "Venus"),
        (ephem.Mars(), "Mars"),
        (ephem.Jupiter(), "Jupiter"),
        (ephem.Saturn(), "Saturn"),
        (ephem.Uranus(), "Uranus"),
        (ephem.Neptune(), "Neptune"),
    ]
    
    # Jupiter's Galilean moons
    jupiter_moons = [
        (ephem.Io(), "Io"),
        (ephem.Europa(), "Europa"),
        (ephem.Ganymede(), "Ganymede"),
        (ephem.Callisto(), "Callisto"),
    ]
    
    # Extended bright stars catalog with more accurate magnitudes
    # Format: (Name, RA_hours:minutes:seconds, Dec_degrees:arcmin:arcsec, magnitude)
    bright_stars = [
        ("Sirius", "6:45:08.9", "-16:42:58", -1.46),
        ("Canopus", "6:23:57.1", "-52:41:44", -0.72),
        ("Arcturus", "14:15:39.7", "+19:10:57", -0.04),
        ("Vega", "18:36:56.3", "+38:47:01", 0.03),
        ("Capella", "5:16:41.4", "+45:59:53", 0.08),
        ("Rigel", "5:14:32.3", "-8:12:06", 0.13),
        ("Procyon", "7:39:18.1", "+5:13:30", 0.38),
        ("Betelgeuse", "5:55:10.3", "+7:24:26", 0.42),
        ("Achernar", "1:37:42.8", "-57:14:12", 0.46),
        ("Hadar", "14:3:49.4", "-60:22:23", 0.61),
        ("Altair", "19:50:47.0", "+8:52:06", 0.77),
        ("Aldebaran", "4:35:55.2", "+16:30:33", 0.87),
        ("Antares", "16:29:24.4", "-26:25:55", 0.96),
        ("Spica", "13:25:11.6", "-11:9:41", 0.98),
        ("Pollux", "7:45:18.9", "+28:1:34", 1.14),
        ("Fomalhaut", "22:57:39.0", "-29:37:20", 1.16),
        ("Deneb", "20:41:25.9", "+45:16:49", 1.25),
        ("Mimosa", "12:47:43.3", "-59:41:19", 1.25),
        ("Regulus", "10:8:22.3", "+11:58:02", 1.36),
        ("Adhara", "6:58:37.5", "-28:58:19", 1.50),
        ("Castor", "7:34:36.0", "+31:53:19", 1.58),
        ("Shaula", "17:33:36.5", "-37:6:14", 1.62),
        ("Bellatrix", "5:25:7.9", "+6:20:59", 1.64),
        ("Elnath", "5:26:17.5", "+28:36:27", 1.65),
        ("Miaplacidus", "9:13:12.2", "-69:43:02", 1.67),
        ("Alnilam", "5:36:12.8", "-1:12:07", 1.69),
        ("Alnitak", "5:40:45.6", "-2:27:30", 1.74),
        ("Alnair", "22:8:13.9", "-46:57:40", 1.74),
        ("Alioth", "12:54:1.6", "+55:57:35", 1.76),
        ("Alkaid", "13:47:32.4", "+49:18:48", 1.86),
        ("Polaris", "2:31:49.0", "+89:15:51", 1.97),
        ("Kochab", "14:50:42.3", "+74:9:20", 2.07),
        ("Alrescha", "2:2:2.6", "+2:45:50", 3.62),
        ("Almach", "2:3:53.9", "+42:19:47", 2.09),
        ("Gamma Ceti", "2:43:18.0", "+3:14:09", 3.47),
        ("Epsilon Eridani", "3:32:55.8", "-9:27:30", 3.73),
    ]
    
    # Process planets and Sun/Moon
    for obj, name in celestial_objects:
        try:
            obj.compute(observer)
            alt = math.degrees(obj.alt)
            mag = obj.mag if hasattr(obj, 'mag') else -26.74  # Sun's magnitude
            distance = obj.earth_distance if hasattr(obj, 'earth_distance') else None
            
            objects.append({
                "name": name,
                "type": "planet" if name not in ["Sun", "Moon"] else name.lower(),
                "magnitude": mag,
                "altitude": alt,
                "azimuth": math.degrees(obj.az),
                "right_ascension": format_coordinates(str(obj.ra)),
                "declination": format_declination(str(obj.dec)),
                "is_above_horizon": alt > 0,
                "distance": distance
            })
        except Exception as e:
            # Some objects might not be visible or computable
            continue
    
    # Process Jupiter's Galilean moons
    for moon, moon_name in jupiter_moons:
        try:
            moon.compute(observer)
            alt = math.degrees(moon.alt)
            # Galilean moons are typically magnitude 4.6 to 6.0
            mag = moon.mag if hasattr(moon, 'mag') else 5.5
            
            objects.append({
                "name": moon_name,
                "type": "moon",
                "magnitude": mag,
                "altitude": alt,
                "azimuth": math.degrees(moon.az),
                "right_ascension": format_coordinates(str(moon.ra)),
                "declination": format_declination(str(moon.dec)),
                "is_above_horizon": alt > 0,
                "distance": None
            })
        except Exception as e:
            continue
    
    # Process bright stars with accurate magnitudes
    for star_entry in bright_stars:
        star_name = star_entry[0]
        ra_str = star_entry[1]
        dec_str = star_entry[2]
        mag = star_entry[3]
        
        try:
            star = ephem.FixedBody()
            star._ra = ephem.hours(ra_str)
            star._dec = ephem.degrees(dec_str)
            star.compute(observer)
            
            alt = math.degrees(star.alt)
            
            objects.append({
                "name": star_name,
                "type": "star",
                "magnitude": mag,
                "altitude": alt,
                "azimuth": math.degrees(star.az),
                "right_ascension": format_coordinates(str(star.ra)),
                "declination": format_declination(str(star.dec)),
                "is_above_horizon": alt > 0,
                "distance": None
            })
        except Exception as e:
            continue
    
    # Filter objects above horizon and sort by brightness (lower magnitude = brighter)
    above_horizon = [obj for obj in objects if obj["is_above_horizon"]]
    sorted_objects = sorted(above_horizon, key=lambda x: x["magnitude"])
    
    return sorted_objects[:max_objects]


def format_coordinates(coord: str) -> str:
    """Format RA coordinates for display (hours:minutes:seconds -> h m s)"""
    # Replace colons with unit symbols
    parts = coord.split(":")
    if len(parts) >= 3:
        return f"{parts[0]}h {parts[1]}m {parts[2]}s"
    return coord


def format_declination(dec: str) -> str:
    """Format Dec coordinates for display (degrees:arcminutes:arcseconds -> ° ′ ″)"""
    # Handle the sign
    is_negative = dec.startswith("-")
    dec_clean = dec.lstrip("+-")
    
    # Split by colons and format
    parts = dec_clean.split(":")
    if len(parts) >= 3:
        sign = "-" if is_negative else "+"
        return f"{sign}{parts[0]}° {parts[1]}′ {parts[2]}″"
    return dec