# Heroku Deployment

## Prerequisites
- Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
- Create Heroku account

## Deploy Steps

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-sky-objects-api

# Deploy
git push heroku main

# Open app
heroku open
```

## Files Created
- `Procfile`: Tells Heroku how to run your app
- `runtime.txt`: Specifies Python version

## Environment Variables
None required for basic deployment.

## Pricing
- Free tier discontinued
- Eco plan: $5/month
- Basic: $7/month