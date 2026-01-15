# Railway deployment entry point
# This file ensures Railway finds the correct main module
import sys
import os

print("Starting application...")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"Python path: {sys.path}")

try:
    from app.main import app
    print("Successfully imported app from app.main")
except Exception as e:
    print(f"Error importing app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting uvicorn on host 0.0.0.0 port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)