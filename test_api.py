#!/usr/bin/env python3
"""
Simple test script for the Bright Celestial Objects API
"""
import requests
import json
import sys
from datetime import datetime

def test_bright_objects_endpoint():
    """Test the bright objects endpoint"""
    base_url = "http://localhost:8000"
    
    # Test 1: New York
    print("=" * 60)
    print("Test 1: New York (40.7128, -74.0060)")
    print("=" * 60)
    response = requests.get(
        f"{base_url}/api/bright-objects",
        params={"latitude": 40.7128, "longitude": -74.0060}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Location: {data['location']}")
        print(f"Time used: {data['time_used']}")
        print(f"Timezone: {data['timezone_info']}")
        print(f"Objects found: {data['total_objects_found']}\n")
        
        print("Brightest objects:")
        for i, obj in enumerate(data['objects'][:10], 1):
            print(f"{i:2}. {obj['name']:15} ({obj['type']:6}) - Mag: {obj['magnitude']:6.2f}, Alt: {obj['altitude']:6.2f}°")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return False
    
    # Test 2: Sydney, Australia
    print("\n" + "=" * 60)
    print("Test 2: Sydney, Australia (-33.8688, 151.2093)")
    print("=" * 60)
    response = requests.get(
        f"{base_url}/api/bright-objects",
        params={"latitude": -33.8688, "longitude": 151.2093}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Location: {data['location']}")
        print(f"Time used: {data['time_used']}")
        print(f"Timezone: {data['timezone_info']}")
        print(f"Objects found: {data['total_objects_found']}\n")
        
        print("Brightest objects:")
        for i, obj in enumerate(data['objects'][:10], 1):
            print(f"{i:2}. {obj['name']:15} ({obj['type']:6}) - Mag: {obj['magnitude']:6.2f}, Alt: {obj['altitude']:6.2f}°")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return False
    
    # Test 3: With specific time
    print("\n" + "=" * 60)
    print("Test 3: Tokyo with specific time (2026-01-15T22:00:00)")
    print("=" * 60)
    response = requests.get(
        f"{base_url}/api/bright-objects",
        params={
            "latitude": 35.6762,
            "longitude": 139.6503,
            "time": "2026-01-15T22:00:00"
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Location: {data['location']}")
        print(f"Time used: {data['time_used']}")
        print(f"Timezone: {data['timezone_info']}")
        print(f"Objects found: {data['total_objects_found']}\n")
        
        print("Brightest objects:")
        for i, obj in enumerate(data['objects'][:10], 1):
            print(f"{i:2}. {obj['name']:15} ({obj['type']:6}) - Mag: {obj['magnitude']:6.2f}, Alt: {obj['altitude']:6.2f}°")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return False
    
    # Test 4: Health check
    print("\n" + "=" * 60)
    print("Test 4: Health check endpoint")
    print("=" * 60)
    response = requests.get(f"{base_url}/health")
    if response.status_code == 200:
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Response: {data}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return False
    
    print("\n" + "=" * 60)
    print("All tests completed successfully!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    try:
        test_bright_objects_endpoint()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API server.")
        print("Make sure the server is running on http://localhost:8000")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
