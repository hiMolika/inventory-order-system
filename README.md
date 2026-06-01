# StockOrder - Inventory & Order Management System

A production-ready, fully containerized full-stack application for managing products, customers, and orders. Features a modern, soothing React interface, a fast and robust FastAPI Python backend, and a PostgreSQL database.

---

## Key Features & Business Logic
1. **Product Inventory Tracking**: Create, read, update, and delete products. Automatically prevents negative stock.
2. **Unique Identifiers**: Enforces unique product SKUs and customer emails at both API and database constraint levels.
3. **Atomic Sales Orders**: Create orders with multiple items. Checks inventory levels, automatically reduces stock, and calculates invoice totals on the backend.
4. **Order Cancellation**: Cancelling/deleting an order automatically restores the corresponding product stock levels.
5. **Dashboard Analytics**: Displays totals for products, customers, and orders, along with real-time "Low Stock" alerts (stock < 10) and quick-restock triggers.
6. **Robust Error Handling**: User-friendly visual alerts for validation errors (e.g. duplicate email, insufficient stock, invalid inputs).

---

## Architecture & Technology Stack
* **Frontend**: React (JS), Vite, Vanilla CSS (designed for a clean, soothing light interface)
* **Backend**: Python, FastAPI, SQLAlchemy ORM
* **Database**: PostgreSQL (persisted via Docker named volumes)
* **Orchestration**: Docker, Docker Compose

---

## Local Quick Start (Docker Compose)

The easiest way to run the entire system is using Docker Compose:

1. **Start the containers**:
   ```bash
   docker compose up --build
   ```
2. **Access the application**:
   * **Frontend Application**: [http://localhost:3000](http://localhost:3000)
   * **Backend API Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
3. **Database Seeding**:
   * When you load the frontend for the first time, click the **"Seed Sample Data"** button on the Dashboard. This pre-populates the database with demo products, customers, and an initial order.

---

## Local Development (Without Docker)

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set database configuration:
   Create a `.env` file in the `backend/` folder (or let it fallback to the default SQLite/local Postgres):
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db
   ```
5. Run the FastAPI dev server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 2. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser to the URL displayed in your terminal (usually [http://localhost:5173](http://localhost:5173)).

---

## Submitting the Assessment: Live Deployment Guide

As required by the assessment, here are the step-by-step instructions to get your live deployment URLs:

### 1. Push to GitHub
Create a new repository on your GitHub account, copy the URL, and run these commands in this folder:
```bash
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Docker Hub Backend Image
Since you do not have a Docker Hub account yet, follow these quick steps:
1. Create a free account at [Docker Hub](https://hub.docker.com/).
2. Log in to Docker on your computer:
   ```bash
   docker login
   ```
3. Build the backend image:
   ```bash
   docker build -t YOUR_DOCKERHUB_USERNAME/inventory-backend:latest ./backend
   ```
4. Push it to Docker Hub:
   ```bash
   docker push YOUR_DOCKERHUB_USERNAME/inventory-backend:latest
   ```
5. Provide this link as your **Docker Hub image link**.

### 3. Deploy the Backend (Render)
1. Sign up/log in to [Render](https://render.com/) (free tier).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Set the following details:
   * **Language**: `Docker`
   * **Dockerfile Path**: `backend/Dockerfile`
   * **Docker Context**: `backend`
5. **Environment Variables**: Add your database credentials. (Render provides a free PostgreSQL database. Create one on Render, copy its Internal/External Database URL, and set it as the value for `DATABASE_URL` in your backend service configuration).
6. Deploy! Render will build the container and provide your **Live Backend API URL** (e.g. `https://your-backend.onrender.com`).

### 4. Deploy the Frontend (Vercel)
1. Sign up/log in to [Vercel](https://vercel.com/) (free tier).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Configure the settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend`
   * **Build & Development Settings**: Keep defaults (Vercel will run `npm run build` using Vite).
   * **Environment Variables**:
     * Add `VITE_API_URL` and set its value to your **Live Backend API URL** (e.g., `https://your-backend.onrender.com`).
5. Click **Deploy**. Vercel will build and host your app, giving you your **Live Frontend URL** (e.g. `https://your-project.vercel.app`).
