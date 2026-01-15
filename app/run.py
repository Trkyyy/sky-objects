import uvicorn
import os

if __name__ == "__main__":
    # Use PORT environment variable for Railway/Heroku, default to 8000 for local
    port = int(os.environ.get("PORT", 8000))
    # Disable reload in production
    reload = os.environ.get("ENVIRONMENT") == "development"
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=reload
    )