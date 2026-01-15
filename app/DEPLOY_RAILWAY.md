# Deploying sky-objects to Railway

This document provides quick steps to deploy the API to Railway (free tier). The repo already contains a `Procfile`, `requirements.txt`, and `railway.toml` configured to start the FastAPI app.

Quick checklist:
- `Procfile` exists with `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- `railway.toml` uses `uvicorn ... $PORT` as the `startCommand`
- `requirements.txt` lists dependencies
- Optional: `Dockerfile` included for Docker-based deploys

Railway (GUI) deploy steps:

1. Create a Railway account at https://railway.app and login.
2. Create a new Project -> Deploy from GitHub and connect your repository.
3. Select the branch you want to deploy.
4. Railway will detect the project; ensure the Build Command step installs dependencies (it will use `requirements.txt`). If asked for Start Command, set it to:

```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

5. (Optional) If you prefer Docker, choose the Docker deploy option. The included `Dockerfile` can be used as-is.

6. Set environment variables if needed (none required by default). Railway will expose a generated URL once deployment finishes.

Command-line (Railway CLI) quick deploy:

1. Install Railway CLI: `curl -sSL https://railway.app/install.sh | sh` (or use their docs)
2. From repo root, run:

```
railway up --start "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
```

Notes and tips
- If `pyephem` fails to build on the builder environment, use the provided `Dockerfile` and select Docker deploy (it installs system build tools).
- The repo includes `main.py` and `run.py` convenience runners; Railway will use the `startCommand` or the `Procfile` to start the app.
- To test locally before deploy:

```
python -m venv .venv; .\.venv\Scripts\activate; pip install -r requirements.txt; python main.py
```

If you want, I can also add a GitHub Action that deploys to Railway on push to `main`/`frontend` branch.
