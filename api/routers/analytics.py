"""
Analytics API endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import pandas as pd
import os
import sys

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from api.models import AnalyticsData
from database.db_manager import db

router = APIRouter()


@router.get("/has-data")
async def check_if_data_exists():
    """Check if there's existing transaction data in the database"""
    try:
        df = db.get_transactions(limit=1)  # Just check if any transactions exist
        return {"has_data": not df.empty}
    except Exception as e:
        return {"has_data": False}


@router.get("/overview", response_model=Dict)
async def get_analytics_overview():
    """Get analytics overview data for dashboard"""
    try:
        df = db.get_transactions()
        
        if df.empty:
            return {
                "total_transactions": 0,
                "total_income": 0,
                "total_expenses": 0,
                "net_amount": 0,
                "categorized_percentage": 0,
                "date_range": None
            }
        
        # Calculate basic metrics
        total_transactions = len(df)
        total_income = df[df['amount'] > 0]['amount'].sum()
        total_expenses = abs(df[df['amount'] < 0]['amount'].sum())
        net_amount = df['amount'].sum()
        
        # Calculate categorization percentage
        categorized_count = len(df[df['category'] != 'Other'])
        categorized_percentage = (categorized_count / total_transactions * 100) if total_transactions > 0 else 0
        
        # Date range
        date_range = {
            "start": df['date'].min().isoformat() if not df['date'].empty else None,
            "end": df['date'].max().isoformat() if not df['date'].empty else None
        }
        
        return {
            "total_transactions": total_transactions,
            "total_income": round(total_income, 2),
            "total_expenses": round(total_expenses, 2),
            "net_amount": round(net_amount, 2),
            "categorized_percentage": round(categorized_percentage, 1),
            "date_range": date_range
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating analytics overview: {str(e)}")


@router.get("/income-vs-expenses")
async def get_income_vs_expenses(months_back: int = Query(12, description="Number of months to analyze")):
    """Get income vs expenses data by month"""
    try:
        df = db.get_transactions()
        
        if df.empty:
            return {"monthly_data": []}
        
        # Filter by date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months_back * 30)
        
        df_filtered = df[df['date'] >= start_date]
        
        # Group by month
        df_filtered['year_month'] = df_filtered['date'].dt.to_period('M')
        monthly_data = []
        
        for period in df_filtered['year_month'].unique():
            month_df = df_filtered[df_filtered['year_month'] == period]
            
            income = month_df[month_df['amount'] > 0]['amount'].sum()
            expenses = abs(month_df[month_df['amount'] < 0]['amount'].sum())
            
            monthly_data.append({
                "month": str(period),
                "income": round(income, 2),
                "expenses": round(expenses, 2),
                "net": round(income - expenses, 2)
            })
        
        # Sort by month
        monthly_data.sort(key=lambda x: x["month"])
        
        return {"monthly_data": monthly_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating income vs expenses data: {str(e)}")


@router.get("/expenses-by-category")
async def get_expenses_by_category():
    """Get expenses breakdown by category"""
    try:
        df = db.get_transactions()
        
        if df.empty:
            return {"category_data": []}
        
        # Filter only expenses (negative amounts)
        expenses_df = df[df['amount'] < 0].copy()
        
        if expenses_df.empty:
            return {"category_data": []}
        
        # Group by category
        category_data = []
        for category in expenses_df['category'].unique():
            category_df = expenses_df[expenses_df['category'] == category]
            total_amount = abs(category_df['amount'].sum())
            transaction_count = len(category_df)
            
            if total_amount > 0:  # Only include categories with expenses
                category_data.append({
                    "category": category,
                    "total_amount": round(total_amount, 2),
                    "transaction_count": transaction_count,
                    "percentage": 0  # Will be calculated in frontend or next endpoint
                })
        
        # Calculate percentages
        total_expenses = sum(item["total_amount"] for item in category_data)
        for item in category_data:
            item["percentage"] = round((item["total_amount"] / total_expenses * 100), 1) if total_expenses > 0 else 0
        
        # Sort by total amount (descending)
        category_data.sort(key=lambda x: x["total_amount"], reverse=True)
        
        return {"category_data": category_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating expenses by category: {str(e)}")


@router.get("/cumulative-expenses")
async def get_cumulative_expenses():
    """Get cumulative expenses by month for each category"""
    try:
        df = db.get_transactions()
        
        if df.empty:
            return {"cumulative_data": []}
        
        # Filter only expenses
        expenses_df = df[df['amount'] < 0].copy()
        
        if expenses_df.empty:
            return {"cumulative_data": []}
        
        # Group by month and category
        expenses_df['year_month'] = expenses_df['date'].dt.to_period('M')
        
        cumulative_data = []
        categories = expenses_df['category'].unique()
        months = sorted(expenses_df['year_month'].unique())
        
        # Track cumulative amounts for each category
        category_cumulative = {cat: 0 for cat in categories}
        
        for month in months:
            month_df = expenses_df[expenses_df['year_month'] == month]
            month_data = {"month": str(month)}
            
            # Update cumulative amounts
            for category in categories:
                category_month_df = month_df[month_df['category'] == category]
                month_amount = abs(category_month_df['amount'].sum())
                category_cumulative[category] += month_amount
                month_data[category] = round(category_cumulative[category], 2)
            
            cumulative_data.append(month_data)
        
        return {"cumulative_data": cumulative_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating cumulative expenses: {str(e)}")


@router.get("/transaction-trends")
async def get_transaction_trends():
    """Get transaction trends and patterns"""
    try:
        df = db.get_transactions()
        
        if df.empty:
            return {"trends": {}}
        
        # Calculate various trends
        df['year_month'] = df['date'].dt.to_period('M')
        monthly_counts = df.groupby('year_month').size()
        
        # Average transactions per month
        avg_transactions_per_month = monthly_counts.mean()
        
        # Most active category
        category_counts = df['category'].value_counts()
        most_active_category = category_counts.index[0] if len(category_counts) > 0 else None
        
        # Largest expense
        expenses = df[df['amount'] < 0]
        largest_expense = abs(expenses['amount'].min()) if not expenses.empty else 0
        
        # Largest income
        income = df[df['amount'] > 0]
        largest_income = income['amount'].max() if not income.empty else 0
        
        return {
            "trends": {
                "avg_transactions_per_month": round(avg_transactions_per_month, 1),
                "most_active_category": most_active_category,
                "largest_expense": round(largest_expense, 2),
                "largest_income": round(largest_income, 2),
                "total_months": len(monthly_counts),
                "unique_payees": df['payee'].nunique(),
                "unique_accounts": df['account'].nunique()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating transaction trends: {str(e)}")


@router.get("/income-expense-plot")
async def get_income_expense_plot(months_back: int = Query(12, description="Number of months to analyze")):
    """Get detailed income vs expenses data for plotting like streamlit version"""
    try:
        df = db.get_transactions()
        
        if df.empty:
            return {"monthly_data": [], "plot_data": []}
        
        # Convert date to datetime and filter by date range
        df['date'] = pd.to_datetime(df['date'])
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months_back * 30)
        
        df_filtered = df[df['date'] >= start_date]
        
        # Group by month
        df_filtered['year_month'] = df_filtered['date'].dt.to_period('M')
        
        monthly_data = []
        plot_data = {'income': [], 'expenses': [], 'investment': [], 'dates': []}
        
        # Generate complete date range for requested months_back period
        end_period = pd.Period(datetime.now(), freq='M')
        start_period = end_period - (months_back - 1)  # -1 because we include current month
        all_months = pd.period_range(start_period, end_period, freq='M')
        
        for period in all_months:
            month_df = df_filtered[df_filtered['year_month'] == period] if not df_filtered.empty else pd.DataFrame()
            
            # Income (positive amounts)
            income = month_df[month_df['amount'] > 0]['amount'].sum() if not month_df.empty else 0
            
            # Expenses (negative amounts, excluding investment)
            expenses_mask = (month_df['amount'] < 0) & (month_df['category'] != 'Investment')
            expenses = abs(month_df[expenses_mask]['amount'].sum()) if not month_df.empty and expenses_mask.any() else 0
            
            # Investment (negative amounts with Investment category)
            investment_mask = (month_df['amount'] < 0) & (month_df['category'] == 'Investment')
            investment = abs(month_df[investment_mask]['amount'].sum()) if not month_df.empty and investment_mask.any() else 0
            
            formatted_date = period.strftime('%b %Y')
            
            monthly_data.append({
                "month": str(period),
                "formatted_date": formatted_date,
                "income": round(income, 2),
                "expenses": round(expenses, 2),
                "investment": round(investment, 2),
                "net": round(income - expenses - investment, 2)
            })
            
            plot_data['dates'].append(formatted_date)
            plot_data['income'].append(round(income, 2))
            plot_data['expenses'].append(round(expenses, 2))
            plot_data['investment'].append(round(investment, 2))
        
        return {"monthly_data": monthly_data, "plot_data": plot_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating income expense plot data: {str(e)}")


@router.get("/cumulative-expenses-plot")
async def get_cumulative_expenses_plot(months_back: int = Query(3, description="Number of months to analyze")):
    """Get cumulative expenses by category for plotting"""
    try:
        df = db.get_transactions()
        
        if df.empty:
            return {"plot_data": {}, "categories": []}
        
        # Filter only expenses (negative amounts)
        df_expenses = df[df['amount'] < 0].copy()
        df_expenses['amount'] = df_expenses['amount'].abs()
        df_expenses['date'] = pd.to_datetime(df_expenses['date'])
        
        # Filter by date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months_back * 30)
        df_expenses = df_expenses[df_expenses['date'] >= start_date]
        
        if df_expenses.empty:
            # Still return the full time range structure with empty data
            end_period = pd.Period(datetime.now(), freq='M')
            start_period = end_period - (months_back - 1)
            first_day = start_period.to_timestamp()
            last_day = end_period.to_timestamp('M')
            all_dates = pd.date_range(first_day, last_day, freq='D')
            return {
                "plot_data": {}, 
                "categories": [], 
                "dates": [d.strftime('%Y-%m-%d') for d in all_dates]
            }
        
        # Add year_month column
        df_expenses['year_month'] = df_expenses['date'].dt.to_period('M')
        
        # Get all unique categories and dates
        categories = df_expenses['category'].dropna().unique().tolist()
        
        # Generate complete date range for requested months_back period
        end_period = pd.Period(datetime.now(), freq='M')
        start_period = end_period - (months_back - 1)  # -1 because we include current month
        
        # Create full date range from start of first month to end of last month
        first_day = start_period.to_timestamp()
        last_day = end_period.to_timestamp('M')  # End of month
        all_dates = pd.date_range(first_day, last_day, freq='D')
        
        plot_data = {}
        for category in categories:
            plot_data[category] = []
        
        # For each date, calculate cumulative expenses within each month for each category
        for date in all_dates:
            month_period = date.to_period('M')
            month_start = month_period.to_timestamp()
            
            formatted_date = date.strftime('%Y-%m-%d')
            
            for category in categories:
                # Get expenses for this category from start of month to current date
                category_month_data = df_expenses[
                    (df_expenses['category'] == category) & 
                    (df_expenses['year_month'] == month_period) &
                    (df_expenses['date'] >= month_start) &
                    (df_expenses['date'] <= date)
                ]
                
                cumulative_amount = category_month_data['amount'].sum()
                plot_data[category].append({
                    'date': formatted_date,
                    'cumulative_amount': round(cumulative_amount, 2)
                })
        
        return {"plot_data": plot_data, "categories": categories, "dates": [d.strftime('%Y-%m-%d') for d in all_dates]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating cumulative expenses plot: {str(e)}")


@router.get("/expense-groups-plot")
async def get_expense_groups_plot(months_back: Optional[int] = None):
    """Get expense groups data for bar/pie chart plotting"""
    try:
        df = db.get_transactions()
        
        if df.empty:
            return {"category_data": [], "plot_data": {"labels": [], "values": [], "colors": []}}
        
        # Apply date filtering if months_back is specified
        if months_back is not None:
            df['date'] = pd.to_datetime(df['date'])
            cutoff_date = datetime.now() - timedelta(days=months_back * 30)  # Approximate months
            df = df[df['date'] >= cutoff_date]
        
        # Filter only expenses (negative amounts)
        expenses_df = df[df['amount'] < 0].copy()
        expenses_df['amount'] = expenses_df['amount'].abs()
        
        if expenses_df.empty:
            return {"category_data": [], "plot_data": {"labels": [], "values": [], "colors": []}}
        
        # Group by category
        category_totals = expenses_df.groupby('category')['amount'].sum().reset_index()
        category_totals = category_totals.sort_values('amount', ascending=False)
        
        # Color palette
        colors = [
            '#dc3545', '#28a745', '#007bff', '#ffc107', '#6c757d',
            '#6610f2', '#fd7e14', '#17a2b8', '#e83e8c', '#20c997'
        ]
        
        category_data = []
        plot_data = {"labels": [], "values": [], "colors": []}
        
        total_expenses = category_totals['amount'].sum()
        
        for idx, row in category_totals.iterrows():
            category = row['category']
            amount = row['amount']
            percentage = (amount / total_expenses * 100) if total_expenses > 0 else 0
            
            category_data.append({
                "category": category,
                "total_amount": round(amount, 2),
                "percentage": round(percentage, 1)
            })
            
            plot_data["labels"].append(category)
            plot_data["values"].append(round(amount, 2))
            plot_data["colors"].append(colors[idx % len(colors)])
        
        return {"category_data": category_data, "plot_data": plot_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating expense groups plot: {str(e)}")


@router.get("/expense-groups-deepdive")
async def get_expense_groups_deepdive(category: Optional[str] = None, months_back: Optional[int] = None):
    """Get detailed expense breakdown by category and subcategory"""
    try:
        df = db.get_transactions()
        
        if df.empty:
            return {"scatter_data": [], "category_summaries": [], "categories": [], "date_range": {}}
        
        # Filter only expenses (negative amounts)
        expenses_df = df[df['amount'] < 0].copy()
        expenses_df['amount'] = expenses_df['amount'].abs()
        
        if expenses_df.empty:
            return {"scatter_data": [], "category_summaries": [], "categories": [], "date_range": {}}
        
        # Get all categories for dropdown
        all_categories = expenses_df['category'].unique().tolist()
        
        # Add year_month for analysis
        expenses_df['date'] = pd.to_datetime(expenses_df['date'])
        
        # Calculate date range for the chart
        if months_back is not None:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=months_back * 30)  # Approximate months
            
            # Apply date filtering
            expenses_df = expenses_df[expenses_df['date'] >= start_date]
        else:
            # If no months_back specified, use data range
            start_date = expenses_df['date'].min()
            end_date = expenses_df['date'].max()
        
        # Always provide date range info for chart scaling
        date_range = {
            "start_date": start_date.strftime('%Y-%m-%d'),
            "end_date": end_date.strftime('%Y-%m-%d')
        }
        
        # Filter by specific category if provided
        if category and category != 'all':
            expenses_df = expenses_df[expenses_df['category'] == category]
            if expenses_df.empty:
                return {"scatter_data": [], "category_summaries": [], "categories": all_categories, "date_range": date_range}
        
        # Format data for scatter plot - return individual transactions
        scatter_data = []
        categories_to_display = expenses_df['category'].unique().tolist()
        
        for cat in categories_to_display:
            category_transactions = expenses_df[expenses_df['category'] == cat]
            
            # Convert each transaction to scatter plot format
            for _, transaction in category_transactions.iterrows():
                scatter_data.append({
                    "category": cat,
                    "date": transaction['date'].strftime('%Y-%m-%d'),
                    "amount": round(float(transaction['amount']), 2),
                    "payee": str(transaction['payee']) if pd.notna(transaction['payee']) else '',
                    "description": str(transaction['description']) if pd.notna(transaction['description']) else ''
                })
        
        # Get summary stats for each category
        category_summaries = []
        for cat in categories_to_display:
            category_transactions = expenses_df[expenses_df['category'] == cat]
            total_amount = category_transactions['amount'].sum()
            transaction_count = len(category_transactions)
            avg_amount = category_transactions['amount'].mean() if transaction_count > 0 else 0
            
            category_summaries.append({
                "category": cat,
                "total_amount": round(total_amount, 2),
                "transaction_count": transaction_count,
                "avg_amount": round(avg_amount, 2)
            })
        
        # Sort by total amount
        category_summaries.sort(key=lambda x: x['total_amount'], reverse=True)
        
        return {
            "scatter_data": scatter_data, 
            "category_summaries": category_summaries,
            "categories": all_categories,
            "date_range": date_range
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating expense groups deepdive: {str(e)}")


@router.get("/bank-transactions-table")
async def get_bank_transactions_table():
    """Get all transactions for table display"""
    try:
        df = db.get_transactions()
        
        if df.empty:
            return {"transactions": [], "total_count": 0}
        
        # Format transactions for table display
        transactions = []
        for _, row in df.iterrows():
            transactions.append({
                "id": int(row['id']) if 'id' in row else None,
                "date": row['date'].strftime('%Y-%m-%d') if pd.notna(row['date']) else '',
                "payee": str(row['payee']) if pd.notna(row['payee']) else '',
                "amount": round(float(row['amount']), 2) if pd.notna(row['amount']) else 0.0,
                "category": str(row['category']) if pd.notna(row['category']) else 'Other',
                "account": str(row['account']) if 'account' in row and pd.notna(row['account']) else '',
                "description": str(row['description']) if 'description' in row and pd.notna(row['description']) else ''
            })
        
        # Sort by date (most recent first)
        transactions.sort(key=lambda x: x['date'], reverse=True)
        
        return {"transactions": transactions, "total_count": len(transactions)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating bank transactions table: {str(e)}")
