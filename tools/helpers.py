import pandas as pd
import calendar
import yaml

def german_to_float(value):
    try:
        # Replace German decimal comma with period and remove thousand separators
        if isinstance(value, str):
            value = value.replace(".", "").replace(",", ".")
        return float(value)
    except (ValueError, TypeError):
        return None

def format_date_with_suffix(d):
    suffixes = {1: 'st', 2: 'nd', 3: 'rd'}
    suffix = suffixes.get(d.day % 10, 'th') if d.day not in [11, 12, 13] else 'th'
    return d.strftime(f'%B %d{suffix}, %Y')

def get_days_in_month(date):
    """Helper function to get the number of days in a month"""
    return calendar.monthrange(date.year, date.month)[1]

def create_daily_transactions(row, days_in_month):
    """Create daily transactions for a given monthly transaction"""
    daily_amount = row['_amount'] / days_in_month
    month_start = row['_date'].replace(day=1)
    
    # Create a date range for all days in the month
    date_range = pd.date_range(start=month_start, periods=days_in_month, freq='D')
    
    # Create a list of daily transactions
    daily_transactions = []
    for date in date_range:
        daily_row = row.copy()
        daily_row['_date'] = date
        daily_row['_amount'] = daily_amount
        daily_row['_is_daily_mrr'] = True
        daily_transactions.append(daily_row)
    
    return pd.DataFrame(daily_transactions)

def load_config(config_path):
    """Load configuration from a YAML file"""
    with open(config_path, 'r') as file:
        return yaml.safe_load(file)

def get_color_for_item(item_index, config):
    """Get a color from the standard color palette for a given item index.
    Colors will cycle if there are more items than colors."""
    colors = config.get('color_palette', [])
    if not colors:
        return 'rgba(169, 169, 169, 0.8)'  # Default gray if no palette defined
    
    # Use modulo to cycle through colors if we have more items than colors
    return colors[item_index % len(colors)]

def get_modified_color(base_color, lightness_factor=1.0):
    """Modify a color's lightness while preserving its alpha value"""
    # Extract RGBA components
    rgba = base_color.replace('rgba(', '').replace(')', '').split(',')
    r, g, b = [int(c.strip()) * lightness_factor for c in rgba[:3]]
    alpha = float(rgba[3]) if len(rgba) > 3 else 0.8
    
    # Ensure RGB values are within valid range
    r, g, b = [min(255, max(0, int(x))) for x in (r, g, b)]
    
    return f'rgba({r}, {g}, {b}, {alpha})'