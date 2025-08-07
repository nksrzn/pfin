#!/usr/bin/env python3
"""
Generate simplified example transaction data for personal finance dashboard.
Universal categories for young professionals in major cities.
"""

import pandas as pd
import random
from datetime import datetime, timedelta
import numpy as np

# Universal categories for young professionals
CATEGORIES = {
    'Living': {
        'merchants': ['Rent Payment', 'Utility Company', 'Internet Provider', 'Home Depot', 'IKEA', 'Cleaning Service'],
        'amount_range': (-1500, -50),
        'frequency': 0.15
    },
    'Groceries': {
        'merchants': ['Supermarket Chain', 'Local Market', 'Pharmacy', 'Convenience Store', 'Organic Market', 'Wholesale Club'],
        'amount_range': (-80, -15),
        'frequency': 0.25
    },
    'Food & Dining': {
        'merchants': ['Restaurant XYZ', 'Coffee Shop', 'Pizza Place', 'Delivery Service', 'Fast Food', 'Lunch Spot', 'Food Truck'],
        'amount_range': (-45, -8),
        'frequency': 0.20
    },
    'Social Activities': {
        'merchants': ['Cinema Complex', 'Bar District', 'Concert Hall', 'Club Downtown', 'Theater', 'Sports Event', 'Bowling Alley'],
        'amount_range': (-80, -12),
        'frequency': 0.12
    },
    'Transport': {
        'merchants': ['Public Transport', 'Ride Share', 'Taxi Service', 'Bike Share', 'Train Station', 'Airport', 'Gas Station'],
        'amount_range': (-50, -3),
        'frequency': 0.15
    },
    'Health & Fitness': {
        'merchants': ['Gym Membership', 'Yoga Studio', 'Doctor Visit', 'Dentist', 'Pharmacy Health', 'Fitness App'],
        'amount_range': (-100, -20),
        'frequency': 0.08
    },
    'Shopping': {
        'merchants': ['Fashion Store', 'Electronics Shop', 'Online Retailer', 'Department Store', 'Bookstore', 'Tech Store'],
        'amount_range': (-200, -25),
        'frequency': 0.10
    },
    'Subscriptions': {
        'merchants': ['Streaming Service', 'Software License', 'Mobile Plan', 'Cloud Storage', 'News Subscription', 'Music App'],
        'amount_range': (-50, -5),
        'frequency': 0.08
    },
    'Income': {
        'merchants': ['Salary Payment', 'Freelance Client', 'Bonus Payment', 'Tax Refund', 'Side Project'],
        'amount_range': (2000, 4500),
        'frequency': 0.07
    }
}

def generate_transactions(start_date, end_date, num_transactions=300):
    """Generate realistic transaction data"""
    transactions = []
    current_date = start_date
    
    while len(transactions) < num_transactions and current_date <= end_date:
        # Select category based on frequency weights
        category_weights = [info['frequency'] for info in CATEGORIES.values()]
        category = np.random.choice(list(CATEGORIES.keys()), p=np.array(category_weights)/sum(category_weights))
        
        # Generate transaction details
        merchant = random.choice(CATEGORIES[category]['merchants'])
        amount_min, amount_max = CATEGORIES[category]['amount_range']
        
        # Add some randomness to amounts
        if category == 'Income':
            amount = random.randint(amount_min, amount_max)
        else:
            # Negative amounts for expenses, with some variation
            base_amount = random.randint(amount_min, amount_max)
            variation = random.uniform(0.8, 1.2)  # ±20% variation
            amount = round(base_amount * variation, 2)
        
        # Generate random date within range
        days_diff = (end_date - start_date).days
        random_days = random.randint(0, days_diff)
        transaction_date = start_date + timedelta(days=random_days)
        
        transactions.append({
            'date': transaction_date.strftime('%Y-%m-%d'),
            'description': merchant,
            'amount': amount,
            'category': category
        })
    
    # Sort by date
    transactions.sort(key=lambda x: x['date'])
    return transactions

def main():
    """Generate and save example data"""
    # Generate 6 months of data
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)
    
    print(f"Generating transactions from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    
    # Generate transactions
    transactions = generate_transactions(start_date, end_date, num_transactions=400)
    
    # Create DataFrame
    df = pd.DataFrame(transactions)
    
    # Add some additional realistic fields
    df['account'] = 'Checking Account'
    df['transaction_id'] = range(1, len(df) + 1)
    
    # Reorder columns
    df = df[['date', 'description', 'amount', 'category', 'account', 'transaction_id']]
    
    # Save to CSV
    output_file = 'example_data/simplified_transactions_example.csv'
    df.to_csv(output_file, index=False)
    
    print(f"Generated {len(df)} transactions")
    print(f"Saved to: {output_file}")
    
    # Print category summary
    print("\nCategory Summary:")
    category_summary = df.groupby('category').agg({
        'amount': ['count', 'sum', 'mean']
    }).round(2)
    category_summary.columns = ['Count', 'Total', 'Average']
    print(category_summary)
    
    # Print sample transactions
    print(f"\nSample transactions:")
    print(df.head(10).to_string(index=False))

if __name__ == "__main__":
    main()
