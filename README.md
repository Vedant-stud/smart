# Smart Crop Advisor

AI-powered agricultural decision-support platform — FastAPI backend, React +
Tailwind + Framer Motion frontend. This is a full working implementation of
the project abstract: authentication & RBAC, farm/crop/task management, an
offline RAG-powered chatbot, weather intelligence with automated alerts,
rule-based crop/irrigation/soil recommendations, crop disease detection,
analytics, and PDF reporting.

**Everything runs out of the box with zero API keys, zero external network
calls, and zero paid services** — SQLite for storage, a deterministic
seeded weather simulator, and an offline TF‑IDF retrieval engine for the
chatbot. See "Going further" below for how to swap in real providers.

## Feature map (abstract section → implementation)

| Section | Feature | Where |
|---|---|---|
| 7.1 | Auth, JWT, RBAC (admin/farmer/agronomist/researcher) | `backend/app/core/security.py`, `routers/auth.py` |
| 7.2 | Farm management | `routers/farms.py` |
| 7.3 | Crop management + growth-stage tracking | `routers/crops.py` |
| 7.4 | AI crop recommendation (explainable, rule-based) | `services/recommendation_service.py` |
| 7.5 / 8 | AI chatbot + offline RAG (TF‑IDF retrieval over a 16-doc agri knowledge base) | `services/rag_service.py`, `routers/chatbot.py` |
| 9 | Weather intelligence + advisories | `services/weather_service.py`, `routers/weather.py` |
| 10 | Smart irrigation recommendation | `services/recommendation_service.py` |
| 11 | Soil & fertilizer analysis | `routers/soil.py` |
| 12 | Crop disease detection (image upload) | `services/vision_service.py`, `routers/disease.py` |
| 13 | Analytics dashboard | `services/analytics_service.py`, `routers/analytics.py` |
| 14 | Alerts / notifications | `routers/alerts.py` |
| 15 | Workflow automation (weather→alert, growth-stage→task) | `services/automation_service.py` |
| 16 | PDF reporting | `services/report_service.py`, `routers/reports.py` |
| 18 | Role-based access control | `db/deps.py` (`require_roles`) |

## Tech stack

- **Backend:** FastAPI, SQLAlchemy 2.0, SQLite (swap `DATABASE_URL` for
  PostgreSQL/pgvector in production), JWT auth (python-jose + passlib),
  ReportLab for PDF generation.
- **Frontend:** React 18 + Vite, Tailwind CSS, Framer Motion for page
  transitions and micro-interactions, Recharts for the dashboard, Lucide
  icons.

## Running it locally

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # optional — every value already has a working default
uvicorn app.main:app --reload --port 8000
```

The API is now live at `http://localhost:8000` (interactive docs at
`http://localhost:8000/docs`). A `smart_crop_advisor.db` SQLite file is
created automatically on first run.

For a Render backend service, set its **Root Directory** to `backend`. The
`backend/.python-version` file pins the service to Python 3.12.8, which has a
prebuilt `pydantic_core` wheel for the version pinned in `requirements.txt`.
If the service has a `PYTHON_VERSION` environment variable, set it to
`3.12.8` as well so it does not override the file.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env             # optional, defaults to http://localhost:8000
npm run dev
```

Open `http://localhost:5173`, click **Create an account**, and you're in.

## Project structure

```
smart-crop-advisor/
├── backend/
│   ├── app/
│   │   ├── core/          # settings, JWT/password security
│   │   ├── db/            # SQLAlchemy engine/session, auth dependency
│   │   ├── models/        # one SQLAlchemy model per file
│   │   ├── schemas/       # one Pydantic schema module per resource
│   │   ├── services/      # business logic (RAG, weather, recommendations,
│   │   │                    disease vision, analytics, automation, reports)
│   │   ├── routers/       # one FastAPI router per resource
│   │   ├── data/knowledge_base.json   # the RAG chatbot's source documents
│   │   └── main.py        # app assembly
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/client.js          # axios instance + auth interceptor
    │   ├── context/AuthContext.jsx
    │   ├── components/            # Sidebar, MobileNav, Modal, StatCard, …
    │   └── pages/                 # Dashboard, Farms, Crops, Tasks, Weather,
    │                                Chatbot, Disease, Login, Register
    └── package.json
```

## Going further (swapping simulators for real providers)

Every "offline" module is intentionally isolated behind a small, documented
interface so it's a drop-in change, not a rewrite:

- **Chatbot / RAG** (`app/services/rag_service.py`): replace the TF‑IDF
  `retrieve()` with a real embeddings call + pgvector similarity search,
  and replace the template `generate()` with an OpenAI/Gemini chat
  completion call using the already-retrieved context. `OPENAI_API_KEY` /
  `GEMINI_API_KEY` are already present in `.env.example` for this.
- **Weather** (`app/services/weather_service.py`): replace the seeded
  simulator with a real provider call (OpenWeatherMap, Tomorrow.io, IMD)
  behind `WEATHER_API_KEY` — the `WeatherResponse` shape consumed by the
  frontend does not need to change.
- **Disease detection** (`app/services/vision_service.py`): replace
  `classify_leaf_image()` with a call to a trained CNN (e.g. an
  EfficientNet fine-tuned on PlantVillage-style leaf imagery) or a
  vision-LLM endpoint. The `DiseaseDetectionResult` contract stays the
  same.
- **Database**: point `DATABASE_URL` at PostgreSQL with the `pgvector`
  extension enabled — SQLAlchemy handles the dialect switch with no
  application code changes.

## Notes

- The chatbot, weather, and disease-detection modules are explicitly
  labeled in their API responses as AI-generated decision support, not a
  substitute for a certified agronomist — matching the abstract's
  "clear distinction between AI-generated recommendations and verified
  agricultural guidance" security requirement.
- Task ordering deliberately avoids `NULLS LAST` SQL syntax so behavior is
  identical across SQLite/PostgreSQL/MySQL.
