import re
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

# Constants for strict validation
ALLOWED_CATEGORIES = {'Electronics', 'Textiles', 'Chemicals', 'Furniture', 'Pharma'}
ALLOWED_UNITS = {'units', 'kg', 'litres'}

class StockEntryCreate(BaseModel):
    warehouse_id: str
    category: str
    item_name: str
    week_number: int
    quantity: int
    unit: str
    recorded_by: str

    @field_validator('warehouse_id')
    @classmethod
    def validate_warehouse_id(cls, v: str) -> str:
        if not (2 <= len(v) <= 20):
            raise ValueError("must be between 2 and 20 characters")
        if not re.match(r"^[A-Z0-9-]+$", v):
            raise ValueError("must contain only uppercase A-Z, 0-9, and hyphens")
        return v

    @field_validator('category')
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in ALLOWED_CATEGORIES:
            raise ValueError(f"must be one of: {', '.join(sorted(ALLOWED_CATEGORIES))}")
        return v

    @field_validator('item_name')
    @classmethod
    def validate_item_name(cls, v: str) -> str:
        # Check raw input length (since it's a required string and free text)
        if not v or not (1 <= len(v) <= 100):
            raise ValueError("must be between 1 and 100 characters")
        return v

    @field_validator('week_number')
    @classmethod
    def validate_week_number(cls, v: int) -> int:
        if not (1 <= v <= 52):
            raise ValueError("must be between 1 and 52")
        return v

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v < 0:
            raise ValueError("must be greater than or equal to 0")
        return v

    @field_validator('unit')
    @classmethod
    def validate_unit(cls, v: str) -> str:
        if v not in ALLOWED_UNITS:
            raise ValueError(f"must be one of: {', '.join(sorted(ALLOWED_UNITS))}")
        return v

    @field_validator('recorded_by')
    @classmethod
    def validate_recorded_by(cls, v: str) -> str:
        if not v or not (1 <= len(v) <= 80):
            raise ValueError("must be between 1 and 80 characters")
        return v

class StockEntryResponse(BaseModel):
    id: int
    warehouse_id: str
    category: str
    item_name: str
    week_number: int
    quantity: int
    unit: str
    recorded_by: str
    created_at: str

class EntriesListResponse(BaseModel):
    count: int
    entries: List[StockEntryResponse]

class CategorySummaryItem(BaseModel):
    category: str
    week_number: int
    total_quantity: int
    entry_count: int

class SummaryResponse(BaseModel):
    summary: List[CategorySummaryItem]

class DeleteResponse(BaseModel):
    deleted: bool
    id: int
