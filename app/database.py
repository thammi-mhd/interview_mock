from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import DATABASE_URL
import warnings

if not DATABASE_URL:
    warnings.warn("DATABASE_URL not configured! Using sqlite in-memory for development. Set DATABASE_URL in .env for production.")
    DATABASE_URL = "sqlite:///:memory:"

Engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=Engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    
    try:
        yield db
    finally:
        db.close()