# Infinite Loop — India Green Grid 🇮🇳⚡

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLaikhabegum%2Finfinite_loop&root-directory=india-green-grid)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A modern decision-support platform for India's renewable energy transition, built on verified public data from the Central Electricity Authority (CEA), MERIT India, and NASA POWER.

---

## 🚀 Live Demo & Deployment

This project is built with **Next.js 16** with dynamic server API routes (`/api/live`, `/api/solar`, etc.) and is configured for instant deployment on [Vercel](https://vercel.com).

### 1-Click Deployment (Recommended)
Click the button below to deploy your own live version directly to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLaikhabegum%2Finfinite_loop&root-directory=india-green-grid)

### Manual Deployment via Vercel Dashboard
1. Sign in to [Vercel](https://vercel.com) using your GitHub account (`Laikhabegum`).
2. Click **"Add New..."** ➔ **"Project"**.
3. Import the `Laikhabegum/infinite_loop` repository.
4. In the configuration screen, click **Edit** next to **Root Directory** and select `india-green-grid`.
5. Click **Deploy**. Vercel will build the application and provide a live public URL (e.g. `https://infinite-loop-india-green-grid.vercel.app`) that anyone can visit.

---

## 📦 What's Inside (`india-green-grid`)

| Module | Route | Data Sources |
|---|---|---|
| **Live Energy Mix Dashboard** | `/` | MERIT India (real-time MW by source), CEA installed capacity & daily generation |
| **RPO Compliance Tracker** | `/rpo` | Ministry of Power RPO trajectory (FY 2024–25 to 2029–30) |
| **Rooftop Solar Calculator** | `/solar` | NASA POWER solar irradiance data, PM Surya Ghar subsidy rules |
| **Green Jobs Board** | `/jobs` | Curated opportunities in solar, wind, storage, and clean tech |
| **Data Provenance & Validation** | `/data` | CEA PDF validation report, raw data hashes, public API endpoints |

---

## 🛠️ Local Development

To run the application locally on your computer:

```bash
# 1. Navigate to the project directory
cd india-green-grid

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 Data Pipeline

```text
npp.gov.in (CEA PDFs) ──pipeline/ingest.py──> data/clean/*.json ──lib/data.js──> pages + /api/*
meritindia.in (live)  ──lib/live.js (cached 5 min)─────────────────────────────> /api/live
power.larc.nasa.gov   ──app/api/solar (cached 30 days)─────────────────────────> /api/solar
```

---

## 📄 License
This repository is open-source and available under the MIT License.
