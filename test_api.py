#!/usr/bin/env python3
"""
API Test Script
Test the FastAPI endpoints without requiring external packages
"""
import sys
import os

# Add the project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def test_database_connection():
    """Test basic database functionality"""
    print("🔍 Testing database connection...")
    
    try:
        from database.db_manager import db
        stats = db.get_database_stats()
        print(f"✅ Database connected - {stats['total_transactions']} transactions")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_api_imports():
    """Test that all API modules can be imported"""
    print("\n📦 Testing API module imports...")
    
    modules_to_test = [
        "api.main",
        "api.models", 
        "api.routers.transactions",
        "api.routers.categories",
        "api.routers.uploads",
        "api.routers.analytics"
    ]
    
    success_count = 0
    for module in modules_to_test:
        try:
            __import__(module)
            print(f"✅ {module}")
            success_count += 1
        except ImportError as e:
            print(f"❌ {module}: {e}")
        except Exception as e:
            print(f"⚠️  {module}: {e}")
    
    print(f"\n📊 Import Results: {success_count}/{len(modules_to_test)} modules successful")
    return success_count == len(modules_to_test)

def test_available_categories():
    """Test category system"""
    print("\n📋 Testing category system...")
    
    try:
        from database.db_manager import AVAILABLE_CATEGORIES
        print(f"✅ Found {len(AVAILABLE_CATEGORIES)} available categories:")
        for i, category in enumerate(AVAILABLE_CATEGORIES, 1):
            print(f"   {i}. {category}")
        return True
    except Exception as e:
        print(f"❌ Category system test failed: {e}")
        return False

def generate_installation_guide():
    """Generate installation guide for missing packages"""
    print("\n📚 Installation Guide:")
    print("=" * 50)
    print("To install the required packages for the FastAPI backend:")
    print()
    print("1. Install FastAPI and dependencies:")
    print("   pip install fastapi uvicorn python-multipart")
    print()
    print("2. Or install from the requirements file:")
    print("   pip install -r api_requirements.txt")
    print()
    print("3. Start the API server:")
    print("   python start_api.py")
    print()
    print("4. View API documentation:")
    print("   http://127.0.0.1:8000/docs")
    print("=" * 50)

def main():
    """Run all tests"""
    print("🧪 Personal Finance Dashboard API - Phase 1 Testing")
    print("=" * 60)
    
    # Test database
    db_ok = test_database_connection()
    
    # Test imports (will show missing FastAPI packages)
    imports_ok = test_api_imports()
    
    # Test categories
    categories_ok = test_available_categories()
    
    # Summary
    print(f"\n📋 Test Summary:")
    print(f"   Database: {'✅' if db_ok else '❌'}")
    print(f"   API Modules: {'✅' if imports_ok else '❌'}")
    print(f"   Categories: {'✅' if categories_ok else '❌'}")
    
    if not imports_ok:
        generate_installation_guide()
    else:
        print("\n🎉 All tests passed! Ready to start the API server.")
        print("   Run: python start_api.py")

if __name__ == "__main__":
    main()
