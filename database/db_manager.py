"""
Database manager for local SQLite database.
Privacy-first approach - all data stays on user's device.
"""
import sqlite3
import pandas as pd
import os
from datetime import datetime
from typing import List, Dict, Optional, Tuple


class LocalDatabaseManager:
    """Manages local SQLite database for transactions and category mappings."""
    
    def __init__(self, db_path: str = "data/personal_finance.db"):
        """Initialize database manager with local SQLite database."""
        self.db_path = db_path
        # Ensure directory exists
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._init_database()
    
    def _init_database(self):
        """Initialize database tables if they don't exist."""
        with sqlite3.connect(self.db_path) as conn:
            # Transactions table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    amount REAL NOT NULL,
                    description TEXT,
                    account TEXT,
                    payee TEXT,
                    category TEXT DEFAULT 'Other',
                    is_manually_categorized BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Category mappings table for learned user preferences
            conn.execute('''
                CREATE TABLE IF NOT EXISTS category_mappings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mapping_type TEXT NOT NULL,  -- 'payee' or 'account'
                    mapping_value TEXT NOT NULL,
                    category TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(mapping_type, mapping_value)
                )
            ''')
            
            conn.commit()
    
    def clear_all_transactions(self):
        """Clear all existing transactions (single file approach)."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("DELETE FROM transactions")
            conn.commit()
    
    def insert_transactions(self, df: pd.DataFrame) -> int:
        """Replace all transactions with new data (single file approach)."""
        with sqlite3.connect(self.db_path) as conn:
            # Clear existing transactions
            conn.execute("DELETE FROM transactions")
            
            # Convert DataFrame to records and ensure proper data types
            df_clean = df.copy()
            
            # Convert date to string format for SQLite
            df_clean['date'] = pd.to_datetime(df_clean['date']).dt.strftime('%Y-%m-%d')
            
            # Ensure amount is float
            df_clean['amount'] = pd.to_numeric(df_clean['amount'], errors='coerce')
            
            # Ensure text fields are strings
            df_clean['description'] = df_clean['description'].astype(str).fillna('')
            df_clean['account'] = df_clean['account'].astype(str).fillna('')
            df_clean['payee'] = df_clean['payee'].astype(str).fillna('')
            
            records = df_clean.to_dict('records')
            inserted_count = 0
            
            for record in records:
                # Insert new transaction
                conn.execute(
                    """INSERT INTO transactions 
                       (date, amount, description, account, payee, category) 
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (
                        str(record['date']),
                        float(record['amount']),
                        str(record.get('description', '')),
                        str(record.get('account', '')),
                        str(record.get('payee', '')),
                        'Other'  # Default category
                    )
                )
                inserted_count += 1
            
            conn.commit()
            return inserted_count
    
    def get_transactions(self, limit: Optional[int] = None) -> pd.DataFrame:
        """Get all transactions from database."""
        query = """
            SELECT id, date, amount, description, account, payee, category, 
                   is_manually_categorized, created_at, updated_at
            FROM transactions 
            ORDER BY date DESC
        """
        if limit:
            query += f" LIMIT {limit}"
            
        with sqlite3.connect(self.db_path) as conn:
            df = pd.read_sql_query(query, conn)
            if not df.empty:
                # Convert date column to datetime
                df['date'] = pd.to_datetime(df['date'], errors='coerce')
                df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
            return df
    
    def get_uncategorized_transactions(self) -> pd.DataFrame:
        """Get transactions that haven't been manually categorized."""
        query = """
            SELECT id, date, amount, description, account, payee, category
            FROM transactions 
            WHERE is_manually_categorized = FALSE
            ORDER BY date DESC
        """
        with sqlite3.connect(self.db_path) as conn:
            df = pd.read_sql_query(query, conn)
            if not df.empty:
                # Convert date column to datetime
                df['date'] = pd.to_datetime(df['date'], errors='coerce')
                df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
            return df
    
    def update_transaction_category(self, transaction_id: int, category: str):
        """Update category for a specific transaction and mark as manually categorized."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """UPDATE transactions 
                   SET category = ?, is_manually_categorized = TRUE, updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?""",
                (category, transaction_id)
            )
            conn.commit()
    
    def save_category_mapping(self, mapping_type: str, mapping_value: str, category: str):
        """Save a category mapping for future auto-categorization."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """INSERT OR REPLACE INTO category_mappings 
                   (mapping_type, mapping_value, category, updated_at) 
                   VALUES (?, ?, ?, CURRENT_TIMESTAMP)""",
                (mapping_type, mapping_value.lower(), category)
            )
            conn.commit()
    
    def get_category_mappings(self) -> Dict[str, Dict[str, str]]:
        """Get all category mappings for auto-categorization."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT mapping_type, mapping_value, category FROM category_mappings"
            )
            mappings = {'payee': {}, 'account': {}}
            
            for mapping_type, mapping_value, category in cursor.fetchall():
                mappings[mapping_type][mapping_value.lower()] = category
                
            return mappings
    
    def auto_categorize_transactions(self) -> int:
        """Auto-categorize uncategorized transactions based on saved mappings."""
        mappings = self.get_category_mappings()
        updated_count = 0
        
        with sqlite3.connect(self.db_path) as conn:
            # Get uncategorized transactions
            cursor = conn.execute(
                """SELECT id, account, payee FROM transactions 
                   WHERE is_manually_categorized = FALSE AND category = 'Other'"""
            )
            
            for transaction_id, account, payee in cursor.fetchall():
                new_category = None
                
                # Check payee mapping first (more specific)
                if payee and payee.lower() in mappings['payee']:
                    new_category = mappings['payee'][payee.lower()]
                
                # Check account mapping if no payee match
                elif account and account.lower() in mappings['account']:
                    new_category = mappings['account'][account.lower()]
                
                # Update if we found a mapping
                if new_category and new_category != 'Other':
                    conn.execute(
                        """UPDATE transactions 
                           SET category = ?, updated_at = CURRENT_TIMESTAMP
                           WHERE id = ?""",
                        (new_category, transaction_id)
                    )
                    updated_count += 1
            
            conn.commit()
            return updated_count
    
    def get_category_stats(self) -> pd.DataFrame:
        """Get statistics about categories."""
        query = """
            SELECT category, 
                   COUNT(*) as transaction_count,
                   SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) as total_expenses,
                   SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
                   AVG(amount) as avg_amount
            FROM transactions 
            GROUP BY category
            ORDER BY transaction_count DESC
        """
        with sqlite3.connect(self.db_path) as conn:
            return pd.read_sql_query(query, conn)
    
    def get_database_stats(self) -> Dict[str, int]:
        """Get general database statistics."""
        with sqlite3.connect(self.db_path) as conn:
            stats = {}
            
            # Total transactions
            cursor = conn.execute("SELECT COUNT(*) FROM transactions")
            stats['total_transactions'] = cursor.fetchone()[0]
            
            # Manually categorized
            cursor = conn.execute(
                "SELECT COUNT(*) FROM transactions WHERE is_manually_categorized = TRUE"
            )
            stats['manually_categorized'] = cursor.fetchone()[0]
            
            # Auto categorized (not Other and not manually categorized)
            cursor = conn.execute(
                """SELECT COUNT(*) FROM transactions 
                   WHERE category != 'Other' AND is_manually_categorized = FALSE"""
            )
            stats['auto_categorized'] = cursor.fetchone()[0]
            
            # Uncategorized (Other category)
            cursor = conn.execute(
                "SELECT COUNT(*) FROM transactions WHERE category = 'Other'"
            )
            stats['uncategorized'] = cursor.fetchone()[0]
            
            # Total mappings
            cursor = conn.execute("SELECT COUNT(*) FROM category_mappings")
            stats['total_mappings'] = cursor.fetchone()[0]
            
            return stats

    def suggest_category(self, amount: float, description: str, 
                       account: str, payee: str) -> str:
        """Simple category suggestion - just detect income vs other."""
        # Income detection
        if amount > 0:
            return "Income"
        
        # Check learned mappings
        mappings = self.get_category_mappings()
        
        # Check payee mapping first (more specific)
        if payee and payee.lower() in mappings['payee']:
            return mappings['payee'][payee.lower()]
        
        # Check account mapping if no payee match
        if account and account.lower() in mappings['account']:
            return mappings['account'][account.lower()]
        
        # Default to Other for manual categorization
        return "Other"

    def clear_category_mappings(self):
        """Clear all category mappings."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("DELETE FROM category_mappings")
            conn.commit()


# Global instance
db = LocalDatabaseManager()


# Available categories - keep this simple and universal
AVAILABLE_CATEGORIES = [
    "Other",
    "Income",
    "Investment", 
    "Living",
    "Groceries", 
    "Eating out, Bars, Social",
    "Transport", 
    "Sports, Wellness, Health",
    "Shopping",
    "Subscriptions"
]
