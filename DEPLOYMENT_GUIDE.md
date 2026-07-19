# 🚀 Complete Deployment Guide — HR Assistant AI Platform

This guide provides step-by-step instructions to deploy the **HR Assistant AI & Leave Management System** to production platforms like **Render**, **Vercel**, or any **Docker VPS**.

---

## 🌟 Option 1: Deploy on Render.com (Recommended Free Cloud)

Render offers free hosting for both FastAPI backends and React static sites.

### Step 1: Push Code to GitHub
1. Create a new GitHub repository named `hr-assistant`.
2. Push your project code:
   ```bash
   git init
   git add .
   git commit -m "Production release"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/hr-assistant.git
   git push -u origin main
   ```

### Step 2: Deploy Backend Service on Render
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** &rarr; **Web Service**.
3. Connect your GitHub repository `hr-assistant`.
4. Configure settings:
   - **Name**: `hr-assistant-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add **Environment Variables**:
   - `OXLO_API_KEY`: Your Oxlo.ai API Key
   - `SECRET_KEY`: `your_secure_jwt_secret_key_2026`
   - `CORS_ORIGINS`: `https://YOUR_FRONTEND_URL.onrender.com`
6. Click **Create Web Service**. Note your backend URL (e.g., `https://hr-assistant-backend.onrender.com`).

### Step 3: Deploy Frontend Static Site on Render
1. Click **New +** &rarr; **Static Site**.
2. Connect the same GitHub repository.
3. Configure settings:
   - **Name**: `hr-assistant-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variable**:
   - `VITE_API_BASE_URL`: `https://hr-assistant-backend.onrender.com/api/v1`
5. Click **Create Static Site**.

---

## ⚡ Option 2: Vercel (Frontend) + Render (Backend)

Vercel is extremely fast for hosting Vite React frontends.

### Deploy Frontend on Vercel:
1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** &rarr; **Project**.
3. Import your GitHub repository `hr-assistant`.
4. Select `frontend` as the **Root Directory**.
5. Framework Preset: **Vite**.
6. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://hr-assistant-backend.onrender.com/api/v1`
7. Click **Deploy**!

---

## 🐳 Option 3: 1-Command Docker Deployment (VPS or Local Server)

If you have a Linux VPS (DigitalOcean, AWS EC2, Linode) or want to run with Docker:

1. Ensure **Docker** and **Docker Compose** are installed.
2. Set your environment variables in `.env`:
   ```bash
   OXLO_API_KEY=your_oxlo_api_key_here
   SECRET_KEY=your_secure_jwt_secret_key
   ```
3. Run:
   ```bash
   docker compose up --build -d
   ```
4. Access your application:
   - **Frontend**: `http://localhost`
   - **Backend Docs**: `http://localhost:8000/docs`

---

## 📋 Production Readiness Checklist
- [x] JWT Secret Key configured securely.
- [x] CORS origins set to production frontend URL.
- [x] Database migrations & seed data pre-configured.
- [x] Nginx SPA routing fallback (`try_files $uri /index.html`).
- [x] Automated Pytest unit suite passing (`pytest`).
