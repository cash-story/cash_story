"""
PostgreSQL database setup using asyncpg for async operations.
"""

import os
from contextlib import asynccontextmanager

import asyncpg
from dotenv import load_dotenv

load_dotenv()

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

        # Categories table (predefined categories for income/expense)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                name_en TEXT,
                type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
                icon TEXT,
                color TEXT,
                is_default BOOLEAN DEFAULT false,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # Transactions table (parsed from statements)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                statement_id UUID REFERENCES statements(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                description TEXT NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
                category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
                is_categorized BOOLEAN DEFAULT false,
                ai_suggested_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
                raw_data JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # Seed default categories if not exists
        await conn.execute("""
            INSERT INTO categories (id, user_id, name, name_en, type, icon, color, is_default, sort_order)
            SELECT gen_random_uuid(), NULL, name, name_en, type, icon, color, true, sort_order
            FROM (VALUES
                ('Цалин', 'Salary', 'income', 'banknote', '#22c55e', 1),
                ('Бизнесийн орлого', 'Business Income', 'income', 'briefcase', '#16a34a', 2),
                ('Хөрөнгө оруулалтын орлого', 'Investment Income', 'income', 'trending-up', '#15803d', 3),
                ('Бусад орлого', 'Other Income', 'income', 'plus-circle', '#166534', 4),
                ('Хоол хүнс', 'Food & Groceries', 'expense', 'utensils', '#ef4444', 1),
                ('Тээвэр', 'Transportation', 'expense', 'car', '#f97316', 2),
                ('Түрээс', 'Rent', 'expense', 'home', '#eab308', 3),
                ('Ком үнэ', 'Utilities', 'expense', 'zap', '#84cc16', 4),
                ('Зугаа цэнгэл', 'Entertainment', 'expense', 'gamepad-2', '#06b6d4', 5),
                ('Худалдаа', 'Shopping', 'expense', 'shopping-bag', '#8b5cf6', 6),
                ('Эрүүл мэнд', 'Health', 'expense', 'heart-pulse', '#ec4899', 7),
                ('Боловсрол', 'Education', 'expense', 'graduation-cap', '#6366f1', 8),
                ('Даатгал', 'Insurance', 'expense', 'shield', '#14b8a6', 9),
                ('Зээл төлбөр', 'Loan Payment', 'expense', 'credit-card', '#f43f5e', 10),
                ('Бусад зарлага', 'Other Expense', 'expense', 'more-horizontal', '#6b7280', 11)
            ) AS t(name, name_en, type, icon, color, sort_order)
            WHERE NOT EXISTS (SELECT 1 FROM categories WHERE is_default = true LIMIT 1)
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
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_transactions_statement_id ON transactions(statement_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id)
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
