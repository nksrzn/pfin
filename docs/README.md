# Personal Finance Dashboard - Demo (Static Site)

This is a standalone demo version of the Personal Finance Dashboard that showcases the full user experience without requiring a backend server.

## Features Demonstrated

- **Analytics Dashboard**: Interactive charts showing income vs expenses and category breakdowns
- **Transaction Management**: View categorized transactions with automatic categorization
- **Category Mappings**: Pre-configured category mappings for common transaction types
- **Responsive Design**: Glass morphism UI that works on all devices

## Demo Data

The demo includes 6 months of realistic transaction data featuring:
- Monthly salary income of $3,200
- Consistent monthly ETF investments of $450
- Regular expenses across all major categories
- Automatic categorization based on merchant/description patterns

## Running the Demo

1. Open `index.html` in a web browser
2. The demo will automatically load sample data
3. Navigate between Analytics and Category Management sections
4. All interactions are read-only to preserve the demo experience

## Technical Notes

- Uses static JSON data files instead of database connections
- Simulates API calls with realistic loading delays
- All chart rendering and interactions are fully functional
- Category management shows read-only state indicators

## Files Structure

```
docs/
├── index.html                 # Main static page served by GitHub Pages
├── static/
│   ├── styles.css             # Complete CSS (mirrors app styling)
│   └── demo-app.js            # JS (static data + chart logic)
└── data/
    ├── demo-transactions.json # Sample transactions
    ├── demo-categories.json   # Categories list
    └── demo-mappings.json     # Category mapping examples
```

## Hosting (GitHub Pages)

If this repository is configured with Pages (Settings → Pages):
1. Source: branch = main (or default), folder = /docs
2. GitHub builds automatically; URL pattern: https://<org-or-user>.github.io/<repo>/
3. To update the live site: modify files in `docs/`, commit, push.

No build step, no bundler, no framework.

## Original vs Demo

The demo maintains full visual and functional parity with the main application while replacing:
- Database calls → Static JSON files
- File upload functionality → Demo notifications
- Category management → Read-only display
- Real-time data processing → Pre-categorized data

This provides an authentic preview of the complete user experience.

---
Single source of truth for the static demo is this `docs/` directory.
