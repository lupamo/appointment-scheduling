#!/usr/bin/env python3
"""
Simple migration runner for the appointment scheduling backend.
Runs SQL migration files in order.
"""
import asyncio
import os
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

load_dotenv()

load_dotenv()

async def run_migration(connection, migration_file: Path):
    """Run a single migration file."""
    print(f"Running migration: {migration_file.name}")
    with open(migration_file) as f:
        sql = f.read()
    try:
        await connection.execute(sql)
        print(f"✓ Completed migration: {migration_file.name}")
    except asyncpg.exceptions.DuplicateTableError:
        print(f"⊘ Skipped migration: {migration_file.name} (tables already exist)")
    except asyncpg.exceptions.DuplicateColumnError:
        print(f"⊘ Skipped migration: {migration_file.name} (columns already exist)")
    except Exception as e:
        print(f"✗ Migration failed: {migration_file.name} - {e}")
        raise

async def main():
    """Run all pending migrations."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not set in .env file")
        return

    # Parse database URL for asyncpg
    # Format: postgresql+asyncpg://user:password@host/dbname
    db_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

    migrations_dir = Path(__file__).parent / "migrations"
    migration_files = sorted(migrations_dir.glob("*.sql"))

    if not migration_files:
        print("No migration files found")
        return

    print(f"Found {len(migration_files)} migration file(s)")

    try:
        connection = await asyncpg.connect(db_url)
        print("Connected to database")

        for migration_file in migration_files:
            await run_migration(connection, migration_file)

        await connection.close()
        print("\n✓ All migrations completed successfully")

    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())