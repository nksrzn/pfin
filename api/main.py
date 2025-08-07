"""
FastAPI Main Application
Privacy-first personal finance dashboard API
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import sys

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from api.routers import transactions, categories, analytics, uploads
from database.db_manager import db

# Create FastAPI app
app = FastAPI(
    title="Personal Finance Dashboard API",
    description="Privacy-first personal finance management - all data stays on your device",
    version="2.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000", 
        "http://127.0.0.1:8000",
        "http://localhost:3000", 
        "http://localhost:8080", 
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])

# Serve static frontend files
if os.path.exists("frontend"):
    app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
async def root():
    """Root endpoint - serve frontend or API info"""
    if os.path.exists("frontend/index.html"):
        return FileResponse("frontend/index.html")
    return {
        "message": "Personal Finance Dashboard API",
        "version": "2.0.0",
        "docs": "/docs",
        "privacy": "All data stays on your device"
    }

@app.get("/favicon.ico")
async def favicon():
    """Return empty response for favicon to prevent 404 errors"""
    return {"status": "ok"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    stats = db.get_database_stats()
    return {
        "status": "healthy",
        "database": "connected",
        "transactions": stats["total_transactions"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
