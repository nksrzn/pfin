"""
Categories API endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict
import os
import sys
import sqlite3
from datetime import datetime

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from api.models import (
    CategoryMappingResponse,
    CategoryMappingCreate,
    CategoryStats,
    SuccessResponse
)
from database.db_manager import db, AVAILABLE_CATEGORIES

router = APIRouter()


@router.get("/available", response_model=List[str])
async def get_available_categories():
    """Get list of available categories"""
    return AVAILABLE_CATEGORIES


@router.get("/mappings", response_model=List[CategoryMappingResponse])
async def get_category_mappings():
    """Get all category mappings"""
    try:
        with sqlite3.connect(db.db_path) as conn:
            cursor = conn.execute(
                """SELECT id, account, payee, category, created_at, updated_at 
                   FROM category_mappings ORDER BY updated_at DESC"""
            )
            mappings = []
            for row in cursor.fetchall():
                try:
                    # Handle different timestamp formats from SQLite
                    created_at_str = row[4] if row[4] else None
                    updated_at_str = row[5] if row[5] else None
                    
                    if created_at_str:
                        # Try different timestamp formats
                        try:
                            created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                        except:
                            created_at = datetime.now()
                    else:
                        created_at = datetime.now()
                        
                    if updated_at_str:
                        try:
                            updated_at = datetime.fromisoformat(updated_at_str.replace('Z', '+00:00'))
                        except:
                            updated_at = datetime.now()
                    else:
                        updated_at = datetime.now()
                    
                    mappings.append(CategoryMappingResponse(
                        id=row[0],
                        account=row[1],
                        payee=row[2], 
                        category=row[3],
                        created_at=created_at,
                        updated_at=updated_at
                    ))
                except Exception as row_error:
                    print(f"Error processing row {row}: {row_error}")
                    continue
            
            return mappings
    except Exception as e:
        print(f"Database error in get_category_mappings: {str(e)}")
        # Return empty list if table doesn't exist or other DB errors
        return []


@router.post("/mappings", response_model=SuccessResponse)
async def create_category_mapping(mapping: CategoryMappingCreate):
    """Create a new category mapping"""
    try:
        if mapping.category not in AVAILABLE_CATEGORIES:
            raise HTTPException(status_code=400, detail="Invalid category")
        
        if not mapping.account or not mapping.payee:
            raise HTTPException(status_code=400, detail="Both account and payee are required")
        
        db.save_category_mapping(
            account=mapping.account,
            payee=mapping.payee,
            category=mapping.category
        )
        
        return SuccessResponse(
            message="Category mapping created successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating category mapping: {str(e)}")


@router.get("/stats", response_model=List[CategoryStats])
async def get_category_stats():
    """Get statistics for each category"""
    try:
        df = db.get_category_stats()
        if df.empty:
            return []
        
        stats = []
        for _, row in df.iterrows():
            stat = CategoryStats(
                category=row["category"],
                transaction_count=int(row["transaction_count"]),
                total_expenses=float(row["total_expenses"]),
                total_income=float(row["total_income"]),
                avg_amount=float(row["avg_amount"])
            )
            stats.append(stat)
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching category stats: {str(e)}")


@router.delete("/mappings", response_model=SuccessResponse)
async def clear_category_mappings():
    """Clear all category mappings"""
    try:
        db.clear_category_mappings()
        return SuccessResponse(
            message="All category mappings cleared successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing category mappings: {str(e)}")


@router.get("/mappings/export/csv")
async def export_category_mappings_csv():
    """Export category mappings to CSV"""
    try:
        from fastapi.responses import StreamingResponse
        import pandas as pd
        import io
        
        mappings = db.get_category_mappings()
        mapping_rows = []
        
        for mapping_type in ['payee', 'account']:
            for value, category in mappings[mapping_type].items():
                mapping_rows.append({
                    'Type': mapping_type,
                    'Value': value,
                    'Category': category
                })
        
        if not mapping_rows:
            raise HTTPException(status_code=404, detail="No mappings to export")
        
        mappings_df = pd.DataFrame(mapping_rows)
        output = io.StringIO()
        mappings_df.to_csv(output, index=False)
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=category_mappings.csv"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting category mappings: {str(e)}")
