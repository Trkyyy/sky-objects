# Deploying sky-objects to Railway

This document provides quick steps to deploy the API to Railway (free tier). The repo already contains a `Procfile`, `requirements.txt`, and `railway.toml` configured to start the FastAPI app.

Quick checklist:
- `Procfile` exists with `web: python server.py`
- `railway.toml` uses `python server.py` as the `startCommand`
- `server.py` properly handles the PORT environment variable
- `requirements.txt` lists dependencies
- Optional: `Dockerfile` included for Docker-based deploys

Railway (GUI) deploy steps:

1. Create a Railway account at https://railway.app and login.
2. Create a new Project -> Deploy from GitHub and connect your repository.
3. Select the branch you want to deploy.
4. Railway will detect the project; ensure the Build Command step installs dependencies (it will use `requirements.txt`). If asked for Start Command, set it to:

```
python server.py
```

5. (Optional) If you prefer Docker, choose the Docker deploy option. The included `Dockerfile` can be used as-is.

6. Set environment variables if needed (none required by default). Railway will expose a generated URL once deployment finishes.

Command-line (Railway CLI) quick deploy:

1. Install Railway CLI: `curl -sSL https://railway.app/install.sh | sh` (or use their docs)
2. From repo root, run:

```
railway up --start "python server.py"
```

Notes and tips
- If `pyephem` fails to build on the builder environment, use the provided `Dockerfile` and select Docker deploy (it installs system build tools).
- The `server.py` file properly handles the PORT environment variable that Railway provides
- To test locally before deploy:

```
python -m venv .venv; .\.venv\Scripts\activate; pip install -r requirements.txt; python server.py
```

If you want, I can also add a GitHub Action that deploys to Railway on push to `main`/`frontend` branch.
