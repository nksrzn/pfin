#!/usr/bin/env python3
"""
FastAPI Development Server Startup Script
"""
import sys
import os

# Add the project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

if __name__ == "__main__":
    import uvicorn
    from api.main import app
    
    print("🚀 Starting Personal Finance Dashboard API Server")
    print("📊 Privacy-first - all data stays on your device")
    print("🌐 API Documentation: http://127.0.0.1:8000/docs")
    print("💾 Database: SQLite (local)")
    print("=" * 50)
    
    uvicorn.run(
        "api.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=[project_root],
        log_level="info"
    )
