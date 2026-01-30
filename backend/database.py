"""
PostgreSQL database setup using asyncpg for async operations.
"""

import os
from contextlib import asynccontextmanager

import asyncpg

DATABASE_URL = os.environ.get("DATABASE_URL")

# Connection pool (initialized on startup)
pool: asyncpg.Pool | None = None


async def init_db():
    """Initialize database connection pool and create tables."""
    global pool

    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is required")

    # Create connection pool
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)

    # Create tables
    async with pool.acquire() as conn:
        # Users table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                google_id TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                picture TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # Analyses table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS analyses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                file_name TEXT NOT NULL,
                bank_name TEXT,
                result JSONB NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # Report groups table (for combined reports)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS report_groups (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                description TEXT,
                combined_result JSONB,
                status TEXT DEFAULT 'draft',
                parent_report_id UUID REFERENCES report_groups(id),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # Statements table (individual uploaded files)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS statements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                report_group_id UUID REFERENCES report_groups(id) ON DELETE CASCADE,
                file_name TEXT NOT NULL,
                file_format TEXT NOT NULL,
                file_size INTEGER,
                bank_name TEXT,
                encrypted_text TEXT,
                encryption_iv TEXT,
                parsed_transactions JSONB,
                status TEXT DEFAULT 'pending',
                error_message TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # User encryption keys table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_keys (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                salt TEXT NOT NULL,
                verification_hash TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # Indexes for better query performance
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_report_groups_user_id ON report_groups(user_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_report_groups_status ON report_groups(status)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_statements_user_id ON statements(user_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_statements_report_group_id ON statements(report_group_id)
        """)


async def close_db():
    """Close database connection pool."""
    global pool
    if pool:
        await pool.close()
        pool = None


@asynccontextmanager
async def get_db():
    """Get a database connection from the pool."""
    if not pool:
        raise RuntimeError("Database pool not initialized. Call init_db() first.")

    async with pool.acquire() as conn:
        yield conn
