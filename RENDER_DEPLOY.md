# Render Deployment

Render offers excellent Python support with automatic builds.

## Deploy Steps

1. **Connect Repo**: Go to [render.com](https://render.com) → New Web Service → Connect GitHub repo

2. **Settings**:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Python Version**: 3.11

3. **Deploy**: Click "Create Web Service"

## Environment Variables
No special environment variables needed.

## Custom Domain
Free `.onrender.com` subdomain included.

## Pricing
- Free tier: 512MB RAM, spins down after 15min inactivity
- Paid: $7/month for always-on