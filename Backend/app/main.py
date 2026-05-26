from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.database import init_db
from app.routes.entries import (
    router as entries_router,
    DuplicateEntryException,
    EntryNotFoundException
)
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the SQLite database and table structure on startup
    init_db()
    yield

app = FastAPI(
    title="Inventory Ledger API",
    description="A beginner-friendly FastAPI SQLite backend developed for the Intern Evaluation Test.",
    version="1.0.0",
    lifespan=lifespan
)

# Custom handler to format Pydantic RequestValidationErrors exactly as specified
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    detail_list = []
    for error in exc.errors():
        # Get the field name from the location tuple
        field = str(error["loc"][-1]) if error["loc"] else "field"
        
        # Format the validation message nicely
        msg = error["msg"]
        if msg.startswith("Value error, "):
            msg = msg[13:]
            
        detail_list.append({
            "field": field,
            "message": msg
        })
        
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "detail": detail_list
        }
    )

# Custom handler for 409 Duplicate Entry exceptions
@app.exception_handler(DuplicateEntryException)
async def duplicate_entry_exception_handler(request: Request, exc: DuplicateEntryException):
    return JSONResponse(
        status_code=409,
        content={
            "error": "duplicate_entry",
            "message": f"An entry for this item in week {exc.week_number} already exists."
        }
    )

# Custom handler for 404 Entry Not Found exceptions
@app.exception_handler(EntryNotFoundException)
async def entry_not_found_exception_handler(request: Request, exc: EntryNotFoundException):
    return JSONResponse(
        status_code=404,
        content={
            "error": "not_found",
            "message": f"Entry with id {exc.entry_id} does not exist."
        }
    )

# Include routes
app.include_router(entries_router)
