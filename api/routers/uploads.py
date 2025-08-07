"""
File upload API endpoints
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
import pandas as pd
import io
import os
import sys

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from api.models import UploadStats, SuccessResponse
from database.db_manager import db

router = APIRouter()


@router.post("/csv", response_model=UploadStats)
async def upload_csv(file: UploadFile = File(...)):
    """Upload and process CSV file with transactions"""
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV")
        
        # Read CSV content
        contents = await file.read()
        csv_content = contents.decode('utf-8')
        
        # Parse CSV
        try:
            df = pd.read_csv(io.StringIO(csv_content))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")
        
        # Validate required columns
        required_columns = ['date', 'amount', 'description']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Check for optional columns
        optional_columns = ['account', 'payee', 'category']
        for col in optional_columns:
            if col not in df.columns:
                df[col] = ''
        
        # Detect if category column has meaningful data
        has_category_column = (
            'category' in df.columns and 
            not df['category'].isin(['', 'Other', None]).all()
        )
        
        # Process dates
        try:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
            if df['date'].isna().any():
                raise ValueError("Invalid date format")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error parsing dates: {str(e)}")
        
        # Process amounts
        try:
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
            if df['amount'].isna().any():
                raise ValueError("Invalid amount format")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error parsing amounts: {str(e)}")
        
        # Clean text fields
        df['description'] = df['description'].astype(str).fillna('')
        df['account'] = df['account'].astype(str).fillna('')
        df['payee'] = df['payee'].astype(str).fillna('')
        
        # Handle category column
        if has_category_column:
            df['category'] = df['category'].astype(str).fillna('Other')
            # Replace empty strings with 'Other'
            df.loc[df['category'] == '', 'category'] = 'Other'
        else:
            df['category'] = 'Other'
        
        # Save to database (this clears existing data first)
        inserted_count = db.insert_transactions(df)
        
        # Auto-categorize uncategorized transactions
        auto_categorized_count = 0
        if not has_category_column:
            auto_categorized_count = db.auto_categorize_transactions()
        
        # Save filename for reference
        filename_path = "data/last_uploaded_filename.txt"
        os.makedirs(os.path.dirname(filename_path), exist_ok=True)
        with open(filename_path, 'w') as f:
            f.write(file.filename)
        
        message = f"Successfully uploaded {inserted_count} transactions"
        if auto_categorized_count > 0:
            message += f" and auto-categorized {auto_categorized_count}"
        
        return UploadStats(
            inserted_count=inserted_count,
            auto_categorized_count=auto_categorized_count,
            has_category_column=has_category_column,
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing upload: {str(e)}")


@router.get("/last-filename")
async def get_last_uploaded_filename():
    """Get the filename of the last uploaded file"""
    try:
        filename_path = "data/last_uploaded_filename.txt"
        if os.path.exists(filename_path):
            with open(filename_path, 'r') as f:
                filename = f.read().strip()
            return {"filename": filename}
        else:
            return {"filename": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting last filename: {str(e)}")


@router.delete("/clear-data", response_model=SuccessResponse)
async def clear_all_data():
    """Clear all transaction data"""
    try:
        db.clear_all_transactions()
        return SuccessResponse(
            message="All transaction data cleared successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing data: {str(e)}")
