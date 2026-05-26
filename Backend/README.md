# Inventory Ledger API — Backend Intern Assignment

Welcome! This is a clean, simple, and developer-friendly REST API built with **Python FastAPI** and **SQLite** (using Python's built-in `sqlite3` driver). It includes rigid input validation, standard HTTP status contracts (422, 409, 404), data aggregations, and an automated testing suite using `pytest`.

---

## 🛠️ Project Structure

```text
app/
 ├── main.py        # Application entrypoint & custom exception handlers
 ├── database.py    # Database connection management & table creation
 ├── models.py      # Pydantic schema validation & formats
 └── routes/        # Router configuration
      ├── __init__.py
      └── entries.py # HTTP endpoint route handlers
tests/
 └── test_api.py    # Complete test suite (T1 - T12 and extra edge cases)
requirements.txt    # Third-party dependency list
```

---

## 🚀 Setup & Installation

Follow these quick steps to get the server up and running on your system:

### 1. Install Dependencies
Install all required libraries using pip:
```bash
pip install -r requirements.txt
```

### 2. Run the Development Server
Launch the FastAPI server locally:
```bash
uvicorn app.main:app --reload
```
*The API is now running locally. You can visit the interactive API documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

### 3. Run the Test Suite
Execute the test cases with standard `pytest`:
```bash
pytest
```
*Note: The test suite automatically runs against an isolated, temporary SQLite database (`test_inventory.db`) and removes it after completion. Production data is never modified.*

---

## 📋 API Specs & Documentation

### Core Endpoints
1. **`POST /entries`**: Create a stock ledger entry.
2. **`GET /entries`**: List and filter entries dynamically by `warehouse_id`, `category`, `week_number`, and `min_quantity`.
3. **`GET /summary`**: Aggregate total quantity and count per category, grouped by week and sorted sequentially (`week_number` ASC, `category` ASC).
4. **`DELETE /entries/{id}`**: Safely delete a record by ID.

### Designed Assumptions
- **Direct SQLite3 Integration**: Kept database operations plain, simple, and clean using Python's standard `sqlite3` library. This keeps the application performant and avoids excessive ORM configuration boilerplate (like SQLAlchemy or Alembic) to align with a student/intern level design.
- **Strict Custom Validation Handling**: Custom exception formatting was created around FastAPI's default `RequestValidationError` to force errors into the required response structure:
  ```json
  {
    "error": "validation_error",
    "detail": [
      { "field": "week_number", "message": "must be between 1 and 52" }
    ]
  }
  ```
- **Warehouse ID Constraints**: Regular expression `^[A-Z0-9-]+$` forces uppercase alphanumeric and hyphen character formatting. Lowercase entries will trigger a validation error as per strict evaluation standards.
