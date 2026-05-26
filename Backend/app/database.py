import sqlite3
import os
from datetime import datetime, timezone

# Standard database file path
DB_FILE = "inventory.db"

def get_db_path() -> str:
    """
    Returns the path to the database file.
    Can be overridden by an environment variable for testing.
    """
    return os.getenv("DATABASE_URL", DB_FILE)

def get_db_connection(db_path: str = None):
    """
    Creates and returns a connection to the SQLite database.
    Enables Row factory to allow dictionary-like access to columns.
    """
    if db_path is None:
        db_path = get_db_path()
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(db_path: str = None):
    """
    Initializes the database and creates the stock_entries table if it doesn't exist.
    """
    if db_path is None:
        db_path = get_db_path()
        
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    # Create the stock_entries table exactly as specified
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stock_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            warehouse_id TEXT NOT NULL,
            category TEXT NOT NULL,
            item_name TEXT NOT NULL,
            week_number INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit TEXT NOT NULL,
            recorded_by TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        )
    """)
    
    # Check if unique constraint / index already exists, or create unique index
    # We can create a UNIQUE index on (warehouse_id, category, item_name, week_number)
    # to enforce the uniqueness constraint at the DB layer.
    cursor.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_entries_unique 
        ON stock_entries (warehouse_id, category, item_name, week_number)
    """)
    
    conn.commit()
    conn.close()
