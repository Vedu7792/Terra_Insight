import os
import pytest
from fastapi.testclient import TestClient

# Configure environment variable to override production database path
TEST_DB_FILE = "test_inventory.db"
os.environ["DATABASE_URL"] = TEST_DB_FILE

from app.main import app
from app.database import init_db, get_db_connection

client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    """
    Fixture to drop and re-initialize the test database tables
    before each individual test execution to guarantee clean state.
    """
    # Initialize/Reset the test database
    init_db(TEST_DB_FILE)
    conn = get_db_connection(TEST_DB_FILE)
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS stock_entries")
    conn.commit()
    conn.close()
    
    init_db(TEST_DB_FILE)
    yield
    # Cleanup after test session teardown
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass

# Helper to helper inserts
def insert_test_entry(data: dict):
    return client.post("/entries", json=data)


# ==========================================
# REQUIRED SPECIFICATION TESTS (T1 - T12)
# ==========================================

def test_t1_post_valid_entry():
    """
    T1: POST with all valid fields -> returns 201 with correct response shape (all fields present, correct types)
    """
    valid_payload = {
        "warehouse_id": "WH-NORTH",
        "category": "Electronics",
        "item_name": "Premium Smartphone",
        "week_number": 12,
        "quantity": 150,
        "unit": "units",
        "recorded_by": "Intern Jane"
    }
    
    response = client.post("/entries", json=valid_payload)
    assert response.status_code == 201
    
    data = response.json()
    assert "id" in data
    assert isinstance(data["id"], int)
    assert data["warehouse_id"] == "WH-NORTH"
    assert data["category"] == "Electronics"
    assert data["item_name"] == "Premium Smartphone"
    assert data["week_number"] == 12
    assert data["quantity"] == 150
    assert data["unit"] == "units"
    assert data["recorded_by"] == "Intern Jane"
    assert "created_at" in data
    assert isinstance(data["created_at"], str)


def test_t2_post_missing_required_field():
    """
    T2: POST with a missing required field (e.g. no category) -> returns 422 with the correct field name in detail[]
    """
    incomplete_payload = {
        "warehouse_id": "WH-NORTH",
        # "category" is missing
        "item_name": "Premium Smartphone",
        "week_number": 12,
        "quantity": 150,
        "unit": "units",
        "recorded_by": "Intern Jane"
    }
    
    response = client.post("/entries", json=incomplete_payload)
    assert response.status_code == 422
    
    data = response.json()
    assert data["error"] == "validation_error"
    assert "detail" in data
    
    # Locate the missing category error in detail list
    missing_fields = [item["field"] for item in data["detail"]]
    assert "category" in missing_fields


def test_t3_post_invalid_category_value():
    """
    T3: POST with invalid category value -> returns 422 with field: 'category' in detail[]
    """
    invalid_category_payload = {
        "warehouse_id": "WH-NORTH",
        "category": "Superconductors",  # Not in allowed list
        "item_name": "Premium Smartphone",
        "week_number": 12,
        "quantity": 150,
        "unit": "units",
        "recorded_by": "Intern Jane"
    }
    
    response = client.post("/entries", json=invalid_category_payload)
    assert response.status_code == 422
    
    data = response.json()
    assert data["error"] == "validation_error"
    
    field_errors = [item["field"] for item in data["detail"]]
    assert "category" in field_errors


def test_t4_post_invalid_week_number():
    """
    T4: POST with week_number = 0 and week_number = 53 -> both must return 422
    """
    payload_week_0 = {
        "warehouse_id": "WH-NORTH",
        "category": "Electronics",
        "item_name": "Premium Smartphone",
        "week_number": 0,  # Below minimum
        "quantity": 150,
        "unit": "units",
        "recorded_by": "Intern Jane"
    }
    
    response_0 = client.post("/entries", json=payload_week_0)
    assert response_0.status_code == 422
    assert "week_number" in [item["field"] for item in response_0.json()["detail"]]

    payload_week_53 = {
        "warehouse_id": "WH-NORTH",
        "category": "Electronics",
        "item_name": "Premium Smartphone",
        "week_number": 53,  # Above maximum
        "quantity": 150,
        "unit": "units",
        "recorded_by": "Intern Jane"
    }
    
    response_53 = client.post("/entries", json=payload_week_53)
    assert response_53.status_code == 422
    assert "week_number" in [item["field"] for item in response_53.json()["detail"]]


def test_t5_post_negative_quantity():
    """
    T5: POST with quantity = -1 -> returns 422
    """
    negative_quantity_payload = {
        "warehouse_id": "WH-NORTH",
        "category": "Electronics",
        "item_name": "Premium Smartphone",
        "week_number": 12,
        "quantity": -1,  # Negative
        "unit": "units",
        "recorded_by": "Intern Jane"
    }
    
    response = client.post("/entries", json=negative_quantity_payload)
    assert response.status_code == 422
    
    data = response.json()
    assert data["error"] == "validation_error"
    assert "quantity" in [item["field"] for item in data["detail"]]


def test_t6_post_duplicate_entry():
    """
    T6: POST same (warehouse_id, category, item_name, week_number) twice -> second returns 409 Conflict
    """
    payload = {
        "warehouse_id": "WH-EAST",
        "category": "Furniture",
        "item_name": "Oak Dining Table",
        "week_number": 5,
        "quantity": 10,
        "unit": "units",
        "recorded_by": "Intern Jane"
    }
    
    # First insert is successful
    res1 = client.post("/entries", json=payload)
    assert res1.status_code == 201
    
    # Second insert is duplicate and conflicts
    res2 = client.post("/entries", json=payload)
    assert res2.status_code == 409
    
    data = res2.json()
    assert data["error"] == "duplicate_entry"
    assert data["message"] == "An entry for this item in week 5 already exists."


def test_t7_get_entries_no_filters():
    """
    T7: GET /entries with no filters -> returns 200 with count matching number of inserted entries
    """
    entries = [
        {"warehouse_id": "WH-A", "category": "Electronics", "item_name": "Item A", "week_number": 1, "quantity": 10, "unit": "units", "recorded_by": "Jane"},
        {"warehouse_id": "WH-B", "category": "Textiles", "item_name": "Item B", "week_number": 2, "quantity": 20, "unit": "units", "recorded_by": "Jane"},
        {"warehouse_id": "WH-C", "category": "Chemicals", "item_name": "Item C", "week_number": 3, "quantity": 30, "unit": "units", "recorded_by": "Jane"}
    ]
    for item in entries:
        insert_test_entry(item)
        
    response = client.get("/entries")
    assert response.status_code == 200
    
    data = response.json()
    assert data["count"] == 3
    assert len(data["entries"]) == 3


def test_t8_get_entries_filtered_by_category():
    """
    T8: GET /entries?category=Electronics -> returns only entries with that category
    """
    entries = [
        {"warehouse_id": "WH-A", "category": "Electronics", "item_name": "TV", "week_number": 1, "quantity": 10, "unit": "units", "recorded_by": "Jane"},
        {"warehouse_id": "WH-B", "category": "Electronics", "item_name": "Radio", "week_number": 2, "quantity": 20, "unit": "units", "recorded_by": "Jane"},
        {"warehouse_id": "WH-C", "category": "Textiles", "item_name": "Cotton Sheet", "week_number": 3, "quantity": 30, "unit": "units", "recorded_by": "Jane"}
    ]
    for item in entries:
        insert_test_entry(item)
        
    response = client.get("/entries?category=Electronics")
    assert response.status_code == 200
    
    data = response.json()
    assert data["count"] == 2
    for entry in data["entries"]:
        assert entry["category"] == "Electronics"


def test_t9_get_entries_filtered_by_min_quantity():
    """
    T9: GET /entries?min_quantity=500 -> returns only entries where quantity >= 500
    """
    entries = [
        {"warehouse_id": "WH-A", "category": "Electronics", "item_name": "Item 1", "week_number": 1, "quantity": 499, "unit": "units", "recorded_by": "Jane"},
        {"warehouse_id": "WH-B", "category": "Electronics", "item_name": "Item 2", "week_number": 2, "quantity": 500, "unit": "units", "recorded_by": "Jane"},
        {"warehouse_id": "WH-C", "category": "Electronics", "item_name": "Item 3", "week_number": 3, "quantity": 1200, "unit": "units", "recorded_by": "Jane"}
    ]
    for item in entries:
        insert_test_entry(item)
        
    response = client.get("/entries?min_quantity=500")
    assert response.status_code == 200
    
    data = response.json()
    assert data["count"] == 2
    for entry in data["entries"]:
        assert entry["quantity"] >= 500


def test_t10_summary_aggregation():
    """
    T10: GET /summary -> verify shape and correct aggregate calculation
    Order: sorted by week_number ASC, category ASC.
    """
    # Insert multiple matching categories/weeks to check SUM and COUNT
    entries = [
        {"warehouse_id": "WH-A", "category": "Electronics", "item_name": "TV", "week_number": 4, "quantity": 100, "unit": "units", "recorded_by": "Jane"},
        {"warehouse_id": "WH-B", "category": "Electronics", "item_name": "Radio", "week_number": 4, "quantity": 400, "unit": "units", "recorded_by": "Jane"},
        {"warehouse_id": "WH-A", "category": "Textiles", "item_name": "Silk Shirt", "week_number": 4, "quantity": 250, "unit": "units", "recorded_by": "Jane"},
        {"warehouse_id": "WH-A", "category": "Electronics", "item_name": "PC", "week_number": 2, "quantity": 50, "unit": "units", "recorded_by": "Jane"}
    ]
    for item in entries:
        insert_test_entry(item)
        
    response = client.get("/summary")
    assert response.status_code == 200
    
    data = response.json()
    assert "summary" in data
    summary_list = data["summary"]
    
    # Expected ordering:
    # 1. week 2 Electronics (total=50, count=1)
    # 2. week 4 Electronics (total=500, count=2)
    # 3. week 4 Textiles (total=250, count=1)
    assert len(summary_list) == 3
    
    # Row 1
    assert summary_list[0]["week_number"] == 2
    assert summary_list[0]["category"] == "Electronics"
    assert summary_list[0]["total_quantity"] == 50
    assert summary_list[0]["entry_count"] == 1
    
    # Row 2
    assert summary_list[1]["week_number"] == 4
    assert summary_list[1]["category"] == "Electronics"
    assert summary_list[1]["total_quantity"] == 500
    assert summary_list[1]["entry_count"] == 2
    
    # Row 3
    assert summary_list[2]["week_number"] == 4
    assert summary_list[2]["category"] == "Textiles"
    assert summary_list[2]["total_quantity"] == 250
    assert summary_list[2]["entry_count"] == 1


def test_t11_successful_delete():
    """
    T11: DELETE /entries/:id on existing ID -> returns 200 with deleted:true; subsequent GET /entries does not include it
    """
    payload = {"warehouse_id": "WH-NORTH", "category": "Pharma", "item_name": "Aspirin", "week_number": 8, "quantity": 1000, "unit": "units", "recorded_by": "Jane"}
    post_res = insert_test_entry(payload)
    entry_id = post_res.json()["id"]
    
    # Verify presence
    get_res = client.get("/entries")
    assert get_res.json()["count"] == 1
    
    # Delete
    del_res = client.delete(f"/entries/{entry_id}")
    assert del_res.status_code == 200
    assert del_res.json() == {"deleted": True, "id": entry_id}
    
    # Verify subsequent GET shows empty list
    get_res_after = client.get("/entries")
    assert get_res_after.json()["count"] == 0
    assert get_res_after.json()["entries"] == []


def test_t12_delete_non_existent_id():
    """
    T12: DELETE /entries/:id on non-existent ID -> returns 404 with error: 'not_found'
    """
    response = client.delete("/entries/9999")
    assert response.status_code == 404
    
    data = response.json()
    assert data["error"] == "not_found"
    assert data["message"] == "Entry with id 9999 does not exist."


# ==========================================
# EXTRA INTEGRATION & BOUNDARY TESTS (T13+)
# ==========================================

def test_t13_warehouse_id_validation():
    """
    T13: Boundary and format validation for warehouse_id.
    Accepts 2-20 characters, uppercase alphanumeric and hyphens.
    """
    # Too short
    res_short = insert_test_entry({"warehouse_id": "A", "category": "Pharma", "item_name": "A", "week_number": 1, "quantity": 1, "unit": "units", "recorded_by": "Jane"})
    assert res_short.status_code == 422
    assert "warehouse_id" in [item["field"] for item in res_short.json()["detail"]]
    
    # Too long
    res_long = insert_test_entry({"warehouse_id": "A" * 21, "category": "Pharma", "item_name": "A", "week_number": 1, "quantity": 1, "unit": "units", "recorded_by": "Jane"})
    assert res_long.status_code == 422
    
    # Lowercase characters (should fail since only A-Z, 0-9, and - are allowed)
    res_lowercase = insert_test_entry({"warehouse_id": "wh-north", "category": "Pharma", "item_name": "A", "week_number": 1, "quantity": 1, "unit": "units", "recorded_by": "Jane"})
    assert res_lowercase.status_code == 422
    
    # Valid border cases (2 chars and 20 chars)
    res_border2 = insert_test_entry({"warehouse_id": "WH", "category": "Pharma", "item_name": "A", "week_number": 1, "quantity": 1, "unit": "units", "recorded_by": "Jane"})
    assert res_border2.status_code == 201


def test_t14_allowed_unit_values():
    """
    T14: Allowed unit values boundary test. Must be 'units', 'kg', or 'litres'
    """
    invalid_payload = {"warehouse_id": "WH-A", "category": "Pharma", "item_name": "A", "week_number": 1, "quantity": 1, "unit": "meters", "recorded_by": "Jane"}
    res = client.post("/entries", json=invalid_payload)
    assert res.status_code == 422
    assert "unit" in [item["field"] for item in res.json()["detail"]]


def test_t15_summary_aggregation_filtering():
    """
    T15: Restrict summary to a specific warehouse and week_number.
    """
    entries = [
        {"warehouse_id": "WH-NORTH", "category": "Electronics", "item_name": "TV", "week_number": 10, "quantity": 100, "unit": "units", "recorded_by": "Jane"},
        {"warehouse_id": "WH-SOUTH", "category": "Electronics", "item_name": "Radio", "week_number": 10, "quantity": 200, "unit": "units", "recorded_by": "Jane"},
        {"warehouse_id": "WH-NORTH", "category": "Electronics", "item_name": "Fridge", "week_number": 12, "quantity": 500, "unit": "units", "recorded_by": "Jane"}
    ]
    for item in entries:
        insert_test_entry(item)
        
    # Restrict to WH-NORTH
    res_wh = client.get("/summary?warehouse_id=WH-NORTH")
    assert res_wh.status_code == 200
    summary = res_wh.json()["summary"]
    assert len(summary) == 2  # Week 10 and Week 12
    assert summary[0]["total_quantity"] == 100
    assert summary[1]["total_quantity"] == 500
    
    # Restrict to Week 10
    res_week = client.get("/summary?week_number=10")
    assert res_week.status_code == 200
    summary_week = res_week.json()["summary"]
    assert len(summary_week) == 1
    assert summary_week[0]["total_quantity"] == 300  # WH-NORTH (100) + WH-SOUTH (200)
