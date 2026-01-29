"""
SQLite database setup using aiosqlite for async operations.
"""

import os

import aiosqlite

# Use DATA_DIR env var, or /tmp for Railway (ephemeral), or local data/ for dev
DB_DIR = os.environ.get(
    "DATA_DIR",
    "/tmp"
    if os.environ.get("RAILWAY_ENVIRONMENT")
    else os.path.join(os.path.dirname(__file__), "data"),
)
DB_PATH = os.path.join(DB_DIR, "app.db")


async def init_db():
    """Create tables if they don't exist."""
    os.makedirs(DB_DIR, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        # Users table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                google_id TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                picture TEXT,
                created_at TEXT NOT NULL
            )
        """)
        # Analyses table with user_id
        await db.execute("""
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                file_name TEXT NOT NULL,
                bank_name TEXT,
                result TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        await db.commit()


async def get_db():
    """Get a database connection."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db
