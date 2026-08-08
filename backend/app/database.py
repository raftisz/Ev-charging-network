"""
Database connection and session management.
Uses SQLModel with PostgreSQL when configured, and SQLite by default for local development.
"""

import os
from sqlmodel import SQLModel, Session, create_engine


def get_database_url() -> str:
    """Return the configured database URL or fall back to SQLite for local development."""
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url
    return os.getenv("SQLITE_DATABASE_URL", "sqlite:///./ev_charging.db")


DATABASE_URL = get_database_url()

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
    )
else:
    # `pool_pre_ping` avoids stale connections when the DB container restarts.
    engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)


def create_db_and_tables() -> None:
    """Create all tables declared in models.py if they don't already exist."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """FastAPI dependency that yields a database session per request."""
    with Session(engine) as session:
        yield session
