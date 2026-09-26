# Integrated Polar Expedition Logistics & Asset Management System

> **Smart India Hackathon (SIH)** — **Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR)**  
> *Operations Console for the 44th Indian Scientific Expedition to Antarctica (ISEA)*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-38BDF8?style=flat&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=nodedotjs)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/GIS-Leaflet%20Polar-199900?style=flat&logo=leaflet)](https://leafletjs.com/)
[![Dexie](https://img.shields.io/badge/Offline-Dexie.js%20IndexedDB-7C3AED?style=flat)](https://dexie.org/)
[![Groq AI](https://img.shields.io/badge/Tactical%20AI-Groq%20LLM-F55036?style=flat)](https://groq.com/)
[![PostGIS](https://img.shields.io/badge/PostGIS-PostgreSQL%2016-336791?style=flat&logo=postgresql)](https://postgis.net/)

---

## 1. Project Overview

An operational mission-control platform engineered to manage multi-modal logistics, asset tracking, inventory depletion, personnel winter-over readiness, and search-and-rescue (SAR) protocols across India's Antarctic research stations:

- **Maitri Station** (Inland Schirmacher Oasis: `70°45′58″S, 11°43′56″E` — Novolazarevskaya Blue-Ice Runway)
- **Bharati Station** (Coastal Larsemann Hills: `69°24′28″S, 76°11′14″E` — Prydz Bay fast-ice wharf & helipad)
- **Staging Hub**: Cape Town Gateway Logistics Hub (`33°55′S, 18°25′E`)
- **Command Authority**: NCPOR Headquarters, Goa (`15°23′N, 73°48′E`)

---

## 2. Real-World Polar Constraints & Innovations

1. **Strict Air Access Corridor**: Direct flights from Cape Town to Bharati are physically impossible (>6,800 km open ocean). All air cargo stages through Maitri with a mandatory technical stop at an intermediate skiway fuel cache (`70.2°S, 42.0°E`).
2. **Aircraft Payload Ceilings & Smart Cargo Splitter**:
   - **Basler BT-67**: 2,500 kg maximum ski landing payload.
   - **DHC-6 Twin Otter**: 1,400 kg maximum ski landing payload.
   - Shipments exceeding 2,500 kg are automatically partitioned into multi-sortie flight plans or allocated to vessel cargo holds.
3. **Sea-Ice Severity Factor**: Pack-ice density (0–90%) dynamically adjusts maritime transit duration for *MV Vasiliy Golovnin* (+2.5 to +6 days).
4. **Austral Summer Window & Depletion Forecaster**: Stations are isolated during polar winter. The depletion engine models burn rates against the **November 15** shipping window and triggers emergency **Level-2 Fuel Rationing (-22%)**.
5. **SHA-256 Cryptographic Custody Ledger**: Immutable block chaining with real-time tamper breach detection and one-click repair.
6. **15-Month Winter-Over Crew Suite**: Tracks crew days-in-post, polar night darkness exposure, and instant emergency surgical blood donor matching (e.g. `O-` universal donors).
7. **Offline-First Field Terminal (`/field`)**: Powered by **IndexedDB** (Dexie.js) for personnel outside radio range; auto-flushes queued transactions via satellite burst-sync (`POST /api/sync/batch`).
8. **HIMVEER Tactical AI Co-Pilot**: Groq-accelerated operations assistant with live telemetry awareness and executable console action directives.

---

## 3. Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Leaflet GIS, Dexie.js (IndexedDB), Zustand, Socket.io-client, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript, Socket.io (3s live telemetry loop), Great-Circle Geodesic Spatial Engine, Crypto (SHA-256).
- **Database**: Zero-config resilient in-memory / SQLite datastore (instant local execution) + optional containerized PostgreSQL 16 with PostGIS.
- **AI Engine**: Groq Cloud SDK (`openai/gpt-oss-120b` / LLaMA) with rule-based fallback.

---

## 4. Quick Start (Run Locally)

### Prerequisites
- Node.js v18+ and npm installed.
- *Windows Note*: If PowerShell shows script execution restrictions, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` or use `npm.cmd`.

### Option A: Standard Local Run (No Docker Needed)
```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Start Backend (Terminal 1 - Port 4000)
cd backend
npm run dev

# 3. Start Frontend (Terminal 2 - Port 3000)
cd frontend
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### Option B: Docker Compose (Full Stack with PostGIS)
```bash
docker compose up -d --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- PostGIS Database: Port `5432`

---

## 5. Console Modules Overview

| Module | Key Capabilities |
| :--- | :--- |
| **Tactical GIS Map** | 5 high-quality free basemaps (ESRI Satellite, Ocean Bathymetry, NASA Blue Marble, Dark Canvas, OSM), moving vessel telemetry, and Antarctic Circle overlay (`66°33′S`). |
| **Cargo Custody Ledger** | SHA-256 blockchain explorer, simulated tamper breach injection, and cryptographic integrity verification. |
| **Route & Mode Optimizer** | Evaluates air vs. sea transport, enforces Maitri staging corridor, and activates the Smart Cargo Splitter. |
| **Inventory & Resupply** | Daily burn rate projections against Nov 15 Austral Summer window and Level-2 Rationing enactment. |
| **Personnel & Winter-Over** | 40+ crew tracking, readiness scores, and instant emergency blood donor compatibility matrix. |
| **Emergency Protocol (SAR)** | Rapid MoES incident clearance order generation for MEDEVAC, Blizzard Lockdown, and Fuel Rupture. |
| **Offline Field Terminal** | Ruggedized field UI running entirely on IndexedDB with satellite window burst-sync. |
| **NCPOR Goa Command Deck** | Executive mission KPIs and digital sign-off queue for flight sorties and asset transfers. |
| **HIMVEER AI Co-Pilot** | Natural language tactical operations assistant with direct console action triggers. |

---

## 6. Core REST API Endpoints

- `GET /api/stations` — Station coordinates, runway specs, and live weather.
- `GET /api/assets` & `POST /api/assets/:id/custody` — Asset catalog and cryptographic handoff signing.
- `POST /api/assets/:id/tamper` & `POST /api/assets/:id/repair` — Tamper injection and chain repair.
- `GET /api/inventory/:stationId/forecast` — Austral Summer depletion analysis.
- `POST /api/inventory/:id/ration` — Enact Level-2 rationing (-22% consumption).
- `GET /api/personnel/donors/:bloodGroup` — Query compatible surgical blood donors.
- `GET /api/routes/recommend` — Multi-modal route optimizer with polar constraints.
- `POST /api/emergency/trigger` — Authorize MoES Emergency SAR order.
- `POST /api/sync/batch` — Ingest offline field terminal action queue.
- `POST /api/simulation/time-warp` — Accelerate simulation clock (`1x`, `10x`, `60x`).
- `POST /api/simulation/blizzard` — Inject code-red blizzard conditions (+40% diesel burn).
- `POST /api/ai/chat` — HIMVEER AI conversational assistant.

---

## 7. 5-Minute Live Evaluation Script

1. **Tactical GIS Map**: Open `http://localhost:3000`. Switch basemaps using the `Layer` menu (try *True Satellite* or *Ocean Bathymetry*). Click *MV Vasiliy Golovnin* to view live telemetry.
2. **Simulation Injector**: In the top navbar, open `Sim Controls` -> click `Katabatic Blizzard` -> notice Maitri temperature drop to -44°C and winds spike to 86 kt.
3. **Cryptographic Ledger**: Go to `Cargo & Custody Ledger`, select an asset, click `Simulate Tamper` to trigger the red breach alert, then click `Repair Chain`.
4. **Smart Cargo Splitter**: Go to `Route & Mode Optimizer`, enter `4,500 kg` to Bharati -> observe the Basler 2,500 kg limit trigger automatic multi-sortie splitting.
5. **Resupply Forecasting**: Go to `Inventory & Resupply`, inspect the November 15 shipping cutoff, and click `Enact Rationing (-22%)`.
6. **Offline Field Terminal**: Open `/field`, toggle SATCOM to `CLOSED`, queue an inventory checkout, then toggle back to `ACTIVE` to watch the auto-sync pulse!
7. **HIMVEER AI**: Click the `HIMVEER AI` button in the top bar and ask: *"What is the air corridor to Bharati?"*.

---

**National Centre for Polar and Ocean Research (NCPOR)**  
*Ministry of Earth Sciences, Government of India*
