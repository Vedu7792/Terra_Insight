import sqlite3
from fastapi import APIRouter, HTTPException, Query, status
from app.database import get_db_connection
from app.models import (
    StockEntryCreate, StockEntryResponse, EntriesListResponse,
    SummaryResponse, CategorySummaryItem, DeleteResponse
)

# Custom Exceptions for clean HTTP response formatting
class DuplicateEntryException(Exception):
    def __init__(self, week_number: int):
        self.week_number = week_number

class EntryNotFoundException(Exception):
    def __init__(self, entry_id: int):
        self.entry_id = entry_id

router = APIRouter()

@router.post("/entries", response_model=StockEntryResponse, status_code=status.HTTP_201_CREATED)
def create_entry(entry: StockEntryCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO stock_entries (warehouse_id, category, item_name, week_number, quantity, unit, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                entry.warehouse_id,
                entry.category,
                entry.item_name,
                entry.week_number,
                entry.quantity,
                entry.unit,
                entry.recorded_by
            )
        )
        conn.commit()
        entry_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        raise DuplicateEntryException(entry.week_number)
    
    # Fetch the generated row from DB to return exact schema including UTC format and ID
    cursor.execute("SELECT * FROM stock_entries WHERE id = ?", (entry_id,))
    row = cursor.fetchone()
    conn.close()
    
    return dict(row)

@router.get("/entries", response_model=EntriesListResponse)
def list_entries(
    warehouse_id: str = Query(None),
    category: str = Query(None),
    week_number: int = Query(None),
    min_quantity: int = Query(None)
):
    query = "SELECT * FROM stock_entries"
    conditions = []
    params = []
    
    if warehouse_id is not None:
        conditions.append("warehouse_id = ?")
        params.append(warehouse_id)
        
    if category is not None:
        conditions.append("category = ?")
        params.append(category)
        
    if week_number is not None:
        conditions.append("week_number = ?")
        params.append(week_number)
        
    if min_quantity is not None:
        conditions.append("quantity >= ?")
        params.append(min_quantity)
        
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    entries = [dict(row) for row in rows]
    return {"count": len(entries), "entries": entries}

@router.get("/summary", response_model=SummaryResponse)
def get_summary(
    warehouse_id: str = Query(None),
    week_number: int = Query(None)
):
    query = """
        SELECT category, week_number, SUM(quantity) as total_quantity, COUNT(*) as entry_count
        FROM stock_entries
    """
    conditions = []
    params = []
    
    if warehouse_id is not None:
        conditions.append("warehouse_id = ?")
        params.append(warehouse_id)
        
    if week_number is not None:
        conditions.append("week_number = ?")
        params.append(week_number)
        
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
        
    query += " GROUP BY category, week_number ORDER BY week_number ASC, category ASC"
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    summary = []
    for row in rows:
        summary.append({
            "category": row["category"],
            "week_number": row["week_number"],
            "total_quantity": row["total_quantity"],
            "entry_count": row["entry_count"]
        })
    return {"summary": summary}

@router.delete("/entries/{id}", response_model=DeleteResponse)
def delete_entry(id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if the entry exists
    cursor.execute("SELECT id FROM stock_entries WHERE id = ?", (id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise EntryNotFoundException(id)
        
    cursor.execute("DELETE FROM stock_entries WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    
    return {"deleted": True, "id": id}
