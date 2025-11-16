"""
Database connection pool management using asyncpg
"""
import asyncpg
import os
from typing import Optional


class DatabasePool:
    """Asynchronous database connection pool manager"""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        """Create the connection pool"""
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is not set")
        
        self.pool = await asyncpg.create_pool(
            database_url,
            min_size=2,
            max_size=10,
            command_timeout=60
        )
    
    async def disconnect(self):
        """Close the connection pool"""
        if self.pool:
            await self.pool.close()
    
    async def execute(self, query: str, *args):
        """Execute a query that doesn't return results"""
        async with self.pool.acquire() as connection:
            return await connection.execute(query, *args)
    
    async def fetch(self, query: str, *args):
        """Execute a query and fetch all results"""
        async with self.pool.acquire() as connection:
            return await connection.fetch(query, *args)
    
    async def fetchrow(self, query: str, *args):
        """Execute a query and fetch a single row"""
        async with self.pool.acquire() as connection:
            return await connection.fetchrow(query, *args)
    
    async def fetchval(self, query: str, *args):
        """Execute a query and fetch a single value"""
        async with self.pool.acquire() as connection:
            return await connection.fetchval(query, *args)


# Global database pool instance
db_pool = DatabasePool()
