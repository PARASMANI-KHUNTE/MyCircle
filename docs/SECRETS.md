# MyCircle Secrets Management Guide

## Overview

This document explains how to manage secrets, API keys, and credentials for MyCircle across all environments.

---

## Environment Variables Reference

### Must-Be-Secret (Never commit to repo)

| Variable | Description | How to Generate |
|----------|-------------|--------------|
| `JWT_SECRET` | Signing key for JWT tokens (min 32 chars) | `openssl rand -hex 32` |
| `MONGO_URI` | MongoDB Atlas connection string | Atlas dashboard |
| `MONGO_URI_DEV` | Local MongoDB URI | `mongodb://localhost:27017/mycircle` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | GCP Console → APIs → Credentials |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Cloudinary Dashboard |
| `GROQ_API_KEY` | Groq API for AI features | console.groq.com |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key | Firebase Settings → Service Accounts |

### Public-Safe Variables (Can be in .env.example)

| Variable | Example | Notes |
|----------|---------|-------|
| `NODE_ENV` | `development` / `production` | |
| `PORT` | `5000` | Server port |
| `CLIENT_URL` | `https://mycircle.app` | Production web URL |
| `CLIENT_URL_DEV` | `http://localhost:5173` | Dev web URL |
| `CORS_ORIGINS` | `https://mycircle.app` | Comma-separated |
| `CLOUDINARY_CLOUD_NAME` | `dxuka3vsm` | Not secret |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | OAuth client ID |
| `FIREBASE_PROJECT_ID` | `mycircle-8c36a` | Project identifier |

---

## Generating Secrets

### JWT_SECRET (Required)
```bash
# Generate a 64-character hex string (32 bytes)
openssl rand -hex 32
```

Output: `d1b9acec7ef8a2547a442f980f2b45206955f9e7eb5b62d6c12b9344c6874cb4`

### Password Requirements
- Minimum 32 characters for JWT_SECRET
- Use unique values per environment
- Never reuse production secrets in development

---

## Deployment Platforms

### Railway / Render
1. Go to your project settings
2. Add each secret variable in the environment variables section
3. For `JWT_SECRET`, use the generated hex string
4. Restart the service after updating secrets

### Docker Secrets
```bash
# Pass secrets via environment file
docker run --env-file .env.production mycircle-server

# Or use Docker Compose secrets
echo "JWT_SECRET=$(openssl rand -hex 32)" | docker secret create jwt_secret -
```

### Local Development
```bash
# Copy the example file and fill in values
cp .env.example .env
# Edit .env with your actual secrets
```

---

## Secret Rotation

### JWT_SECRET Rotation (Requires all users to re-login)
1. Generate new secret: `openssl rand -hex 32`
2. Update in production environment variable
3. Deploy (this invalidates all existing tokens)
4. Users will need to log in again

### MongoDB URI Rotation
1. Get new connection string from Atlas
2. Update `MONGO_URI` in environment
3. Verify connection before removing old cluster

### Google OAuth Rotation
1. Go to GCP Console → APIs → Credentials
2. Create new OAuth 2.0 Client ID
3. Update client ID and secret in environment
4. Update redirect URIs in Google Console

---

## Security Checklist

- [ ] `.env` files are in .gitignore
- [ ] No secrets in commit history (use BFG to clean if needed)
- [ ] JWT_SECRET is minimum 32 characters
- [ ] Production secrets are different from development
- [ ] Firebase private key is not committed
- [ ] Google client secrets are rotated annually
- [ ] Cloudinary API keys are rotated if suspected compromised

---

## Emergency Procedures

### Compromised JWT_SECRET
1. Generate new secret: `openssl rand -hex 32`
2. Update in production
3. Deploy to invalidate all tokens
4. Users will need to re-login

### Compromised API Keys
1. Revoke key in provider console
2. Generate new key
3. Update environment variable
4. Test functionality

### Accidental Commit
If you accidentally committed secrets:
1. Rotate all compromised secrets immediately
2. Use BFG Repo-Cleaner to remove from history:
```bash
bfg --delete-files .env
git reflog expire --expire=now && git gc --prune=now --aggressive
```