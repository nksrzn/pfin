"""
Transactions API endpoints
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
import pandas as pd
import os
import sys

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from api.models import (
    TransactionResponse, 
    TransactionCreate, 
    TransactionUpdate,
    DatabaseStats,
    CategorySuggestion,
    SuccessResponse,
    ErrorResponse
)
from database.db_manager import db, AVAILABLE_CATEGORIES

router = APIRouter()


@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    limit: Optional[int] = Query(None, description="Limit number of transactions returned"),
    uncategorized_only: bool = Query(False, description="Return only uncategorized transactions")
):
    """Get all transactions or uncategorized transactions"""
    try:
        if uncategorized_only:
            df = db.get_uncategorized_transactions()
        else:
            df = db.get_transactions(limit=limit)
        
        if df.empty:
            return []
        
        # Convert DataFrame to list of dictionaries
        transactions = []
        for _, row in df.iterrows():
            transaction = {
                "id": int(row["id"]),
                "date": row["date"],
                "amount": float(row["amount"]),
                "description": str(row["description"]),
                "account": str(row["account"]),
                "payee": str(row["payee"]),
                "category": str(row["category"]),
                "is_manually_categorized": bool(row["is_manually_categorized"]),
                "created_at": row["created_at"],
                "updated_at": row["updated_at"]
            }
            transactions.append(transaction)
        
        return transactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transactions: {str(e)}")


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: int):
    """Get a specific transaction by ID"""
    try:
        df = db.get_transactions()
        transaction_row = df[df["id"] == transaction_id]
        
        if transaction_row.empty:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        row = transaction_row.iloc[0]
        return {
            "id": int(row["id"]),
            "date": row["date"],
            "amount": float(row["amount"]),
            "description": str(row["description"]),
            "account": str(row["account"]),
            "payee": str(row["payee"]),
            "category": str(row["category"]),
            "is_manually_categorized": bool(row["is_manually_categorized"]),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transaction: {str(e)}")


@router.patch("/{transaction_id}", response_model=SuccessResponse)
async def update_transaction(transaction_id: int, update_data: TransactionUpdate):
    """Update a transaction (mainly for categorization)"""
    try:
        # Check if transaction exists
        df = db.get_transactions()
        if df[df["id"] == transaction_id].empty:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Currently only category updates are supported in the original system
        if update_data.category:
            db.update_transaction_category(transaction_id, update_data.category)
            
            # Save category mapping for future auto-categorization
            transaction_row = df[df["id"] == transaction_id].iloc[0]
            if transaction_row["payee"]:
                db.save_category_mapping("payee", transaction_row["payee"], update_data.category)
            elif transaction_row["account"]:
                db.save_category_mapping("account", transaction_row["account"], update_data.category)
        
        return SuccessResponse(
            message=f"Transaction {transaction_id} updated successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating transaction: {str(e)}")


@router.get("/suggest-category/{transaction_id}", response_model=CategorySuggestion)
async def suggest_category(transaction_id: int):
    """Get category suggestion for a transaction"""
    try:
        df = db.get_transactions()
        transaction_row = df[df["id"] == transaction_id]
        
        if transaction_row.empty:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        row = transaction_row.iloc[0]
        suggested_category = db.suggest_category(
            amount=row["amount"],
            description=row["description"],
            account=row["account"],
            payee=row["payee"]
        )
        
        # Determine confidence and reason
        confidence = 0.5  # Default
        reason = "Default suggestion"
        
        if suggested_category == "Income" and row["amount"] > 0:
            confidence = 0.9
            reason = "Positive amount indicates income"
        elif suggested_category != "Other":
            confidence = 0.8
            reason = "Based on learned patterns"
        
        return CategorySuggestion(
            suggested_category=suggested_category,
            confidence=confidence,
            reason=reason
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error suggesting category: {str(e)}")


@router.get("/stats/database", response_model=DatabaseStats)
async def get_database_stats():
    """Get database statistics"""
    try:
        stats = db.get_database_stats()
        return DatabaseStats(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching database stats: {str(e)}")


@router.post("/auto-categorize", response_model=SuccessResponse)
async def auto_categorize_transactions():
    """Auto-categorize transactions based on learned mappings"""
    try:
        updated_count = db.auto_categorize_transactions()
        return SuccessResponse(
            message=f"Auto-categorized {updated_count} transactions",
            data={"updated_count": updated_count}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error auto-categorizing: {str(e)}")


@router.get("/export/csv")
async def export_transactions_csv():
    """Export all transactions to CSV"""
    try:
        from fastapi.responses import StreamingResponse
        import io
        
        df = db.get_transactions()
        if df.empty:
            raise HTTPException(status_code=404, detail="No transactions to export")
        
        # Convert to CSV
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=transactions.csv"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting transactions: {str(e)}")
