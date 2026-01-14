# Backend Deployment Guide

## Quick Start - Railway (Recommended)

Railway is the easiest option with great free tier:

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project" → "Deploy from GitHub repo"
3. Select your `sky-objects` repository
4. Railway automatically detects Python and deploys!
5. Get your API URL (e.g., `https://sky-objects-production.up.railway.app`)

### Configure Frontend
Once deployed, update your Netlify environment variable:
```
API_BASE_URL=https://your-app-name.up.railway.app
```

## Alternative Options

### Render.com
- Go to [render.com](https://render.com)
- New Web Service → Connect GitHub repo
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Heroku
```bash
heroku create your-sky-objects-api
git push heroku main
```

## Production Configuration

### Environment Variables (Optional)
Set these in your deployment platform:

```bash
# For stricter CORS (recommended)
ALLOWED_ORIGINS=https://your-netlify-site.netlify.app,https://yourdomain.com

# For development mode (allows all origins)
ENVIRONMENT=development
```

### CORS Setup
The backend now supports:
- **Development**: Allows all origins when `ENVIRONMENT=development`
- **Production**: Only allows specified origins from `ALLOWED_ORIGINS`
- **Default**: Allows localhost for local development

## Files Created for Deployment
- `Procfile`: Heroku configuration
- `runtime.txt`: Python version specification
- Updated `app/main.py`: Production-ready CORS

## Testing Your Deployment

Once deployed, test your API:
```bash
curl https://your-api-url.com/
curl "https://your-api-url.com/api/bright-objects?latitude=40.7128&longitude=-74.0060"
```

## Cost Comparison
- **Railway**: Free tier (512MB, $5/month credit)
- **Render**: Free tier (512MB, sleeps after 15min)
- **Heroku**: $5-7/month (no free tier)

**Recommendation**: Start with Railway for the best free tier experience.