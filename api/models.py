"""
Pydantic models for API requests and responses
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Union
from decimal import Decimal


class TransactionBase(BaseModel):
    """Base transaction model"""
    date: datetime
    amount: float
    description: Optional[str] = ""
    account: Optional[str] = ""
    payee: Optional[str] = ""
    category: str = "Other"


class TransactionCreate(TransactionBase):
    """Model for creating a new transaction"""
    pass


class TransactionUpdate(BaseModel):
    """Model for updating a transaction"""
    category: Optional[str] = None
    description: Optional[str] = None
    account: Optional[str] = None
    payee: Optional[str] = None


class TransactionResponse(TransactionBase):
    """Model for transaction response"""
    id: int
    is_manually_categorized: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CategoryMappingBase(BaseModel):
    """Base category mapping model"""
    mapping_type: str = Field(..., pattern="^(payee|account)$")
    mapping_value: str
    category: str


class CategoryMappingCreate(CategoryMappingBase):
    """Model for creating a category mapping"""
    pass


class CategoryMappingResponse(CategoryMappingBase):
    """Model for category mapping response"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CategoryStats(BaseModel):
    """Model for category statistics"""
    category: str
    transaction_count: int
    total_expenses: float
    total_income: float
    avg_amount: float


class DatabaseStats(BaseModel):
    """Model for database statistics"""
    total_transactions: int
    manually_categorized: int
    auto_categorized: int
    uncategorized: int
    total_mappings: int


class UploadStats(BaseModel):
    """Model for upload operation results"""
    inserted_count: int
    auto_categorized_count: int
    has_category_column: bool
    message: str


class AnalyticsData(BaseModel):
    """Model for analytics data"""
    transactions_by_month: List[Dict[str, Union[str, float]]]
    expense_by_category: List[Dict[str, Union[str, float]]]
    income_vs_expenses: List[Dict[str, Union[str, float]]]
    cumulative_expenses: List[Dict[str, Union[str, float]]]


class CategorySuggestion(BaseModel):
    """Model for category suggestion response"""
    suggested_category: str
    confidence: float = 0.0
    reason: str = ""


class ErrorResponse(BaseModel):
    """Model for error responses"""
    error: str
    detail: Optional[str] = None
    code: Optional[int] = None


class SuccessResponse(BaseModel):
    """Model for success responses"""
    success: bool = True
    message: str
    data: Optional[Dict] = None
