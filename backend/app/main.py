"""
EV Charging Network - FastAPI application entrypoint.

Responsibilities:
- Create DB tables and seed mock data on startup.
- Register feature routers under /api.
- Serve the vanilla HTML/CSS/JS frontend as static files.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import create_db_and_tables
from app.routers import auth, bookings, charging, payments, stations, users
from app.utils.seeder import find_frontend_dir, seed_mock_data

app = FastAPI(
    title="EV Charging Network API",
    description="Backend API for finding stations, reserving chargers, and managing EV charging sessions.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(stations.router)
app.include_router(bookings.router)
app.include_router(charging.router)
app.include_router(payments.router)


FRONTEND_DIR = find_frontend_dir()


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()
    seed_mock_data()


@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": "EV Charging Network API"}


# Serve the vanilla HTML/CSS/JS frontend. Mounted last so it doesn't
# shadow the /api routes above.
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
