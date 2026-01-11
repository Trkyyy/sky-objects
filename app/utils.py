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
    bright_stars = [
        ("Sirius", "06h 45m 08.9s", "-16° 42' 58\"", -1.46),
        ("Canopus", "06h 23m 57.1s", "-52° 41' 44\"", -0.72),
        ("Arcturus", "14h 15m 39.7s", "+19° 10' 57\"", -0.04),
        ("Vega", "18h 36m 56.3s", "+38° 47' 01\"", 0.03),
        ("Capella", "05h 16m 41.4s", "+45° 59' 53\"", 0.08),
        ("Rigel", "05h 14m 32.3s", "-08° 12' 06\"", 0.13),
        ("Procyon", "07h 39m 18.1s", "+05° 13' 30\"", 0.38),
        ("Betelgeuse", "05h 55m 10.3s", "+07° 24' 26\"", 0.42),
        ("Achernar", "01h 37m 42.8s", "-57° 14' 12\"", 0.46),
        ("Hadar", "14h 03m 49.4s", "-60° 22' 23\"", 0.61),
        ("Altair", "19h 50m 47.0s", "+08° 52' 06\"", 0.77),
        ("Aldebaran", "04h 35m 55.2s", "+16° 30' 33\"", 0.87),
        ("Antares", "16h 29m 24.4s", "-26° 25' 55\"", 0.96),
        ("Spica", "13h 25m 11.6s", "-11° 09' 41\"", 0.98),
        ("Pollux", "07h 45m 18.9s", "+28° 01' 34\"", 1.14),
        ("Fomalhaut", "22h 57m 39.0s", "-29° 37' 20\"", 1.16),
        ("Deneb", "20h 41m 25.9s", "+45° 16' 49\"", 1.25),
        ("Mimosa", "12h 47m 43.3s", "-59° 41' 19\"", 1.25),
        ("Regulus", "10h 08m 22.3s", "+11° 58' 02\"", 1.36),
        ("Adhara", "06h 58m 37.5s", "-28° 58' 19\"", 1.50),
        ("Castor", "07h 34m 36.0s", "+31° 53' 19\"", 1.58),
        ("Shaula", "17h 33m 36.5s", "-37° 06' 14\"", 1.62),
        ("Bellatrix", "05h 25m 07.9s", "+06° 20' 59\"", 1.64),
        ("Elnath", "05h 26m 17.5s", "+28° 36' 27\"", 1.65),
        ("Miaplacidus", "09h 13m 12.2s", "-69° 43' 02\"", 1.67),
        ("Alnilam", "05h 36m 12.8s", "-01° 12' 07\"", 1.69),
        ("Alnitak", "05h 40m 45.6s", "-02° 27' 30\"", 1.74),
        ("Alnair", "22h 08m 13.9s", "-46° 57' 40\"", 1.74),
        ("Alioth", "12h 54m 01.6s", "+55° 57' 35\"", 1.76),
        ("Alkaid", "13h 47m 32.4s", "+49° 18' 48\"", 1.86),
        ("Polaris", "02h 31m 49.0s", "+89° 15' 51\"", 1.97),
        ("Kochab", "14h 50m 42.3s", "+74° 09' 20\"", 2.07),
        ("Alrescha", "02h 02m 02.6s", "+02° 45' 50\"", 3.62),
        ("Almach", "02h 03m 53.9s", "+42° 19' 47\"", 2.09),
        ("Gamma Ceti", "02h 43m 18.0s", "+03° 14' 09\"", 3.47),
        ("Epsilon Eridani", "03h 32m 55.8s", "-09° 27' 30\"", 3.73),
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
                "right_ascension": str(obj.ra),
                "declination": str(obj.dec),
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
                "right_ascension": str(moon.ra),
                "declination": str(moon.dec),
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
                "right_ascension": str(star.ra),
                "declination": str(star.dec),
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
    """Format RA/Dec coordinates for display"""
    return coord.replace(":", "h ", 1).replace(":", "m ", 1) + "s"