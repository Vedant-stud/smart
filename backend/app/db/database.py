"""
Database engine/session setup.

Defaults to SQLite (zero-config, file-based) so the project runs out of
the box. In production this is swapped for managed PostgreSQL with the
pgvector extension (see Section 19/20 of the abstract) purely by changing
DATABASE_URL - no application code changes needed, since SQLAlchemy
abstracts the dialect.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
