# Railway Deployment

Railway is a modern deployment platform that's perfect for FastAPI apps.

## Quick Deploy

1. **Connect Repository**: Go to [railway.app](https://railway.app) and connect your GitHub repository

2. **Auto-Deploy**: Railway will automatically detect it's a Python app and deploy it

3. **Environment Variables**: No special env vars needed for basic deployment

4. **Custom Domain**: Railway provides a free domain like `your-app.railway.app`

## Manual Setup (if needed)

Create `railway.toml` in project root:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

## Pricing
- Free tier: 512MB RAM, $5 monthly credit
- Perfect for this astronomy API