# Personal Finance Dashboard V2.0

A modern, privacy-first personal finance dashboard with FastAPI backend and clean frontend.

## 🏗️ Architecture

- **Backend**: FastAPI with REST API
- **Frontend**: Modern HTML/CSS/JavaScript with Plotly charts
- **Database**: SQLite (local file storage)
- **Design**: Technical minimalist aesthetic

## 🚀 Quick Start

### 1. Install Dependencies
```bash
conda activate pfin
pip install -r requirements.txt
```

### 2. Run the Application
```bash
# Option 1: Using the startup script
python start_api.py

# Option 2: Direct uvicorn command
conda run --live-stream --name pfin python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Access the Dashboard
Open your browser and go to:
- **Main App**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📱 Features

### Data Upload
- CSV file upload with drag & drop
- Automatic transaction parsing
- Data validation and error handling

### Transaction Categorization
- Manual category assignment
- Auto-categorization based on patterns
- Bulk operations

### Analytics Dashboard
- Income vs Expenses line charts
- Cumulative spending trends
- Category breakdown bar charts
- Transaction scatter plots
- Comprehensive data tables

### Settings
- Category mapping management
- System configuration
- Data export options

## 🔒 Privacy First

- **Local Storage Only**: All data stays on your device
- **No Cloud Dependencies**: Works completely offline
- **SQLite Database**: Simple file-based storage
- **No Tracking**: Zero analytics or telemetry

## 📁 Project Structure

```
├── api/                    # FastAPI backend
│   ├── main.py            # Main FastAPI application
│   ├── routers/           # API route handlers
│   └── models.py          # Data models
├── frontend/              # Modern web frontend
│   ├── index.html         # Main application
│   ├── styles.css         # Technical minimalist CSS
│   └── app.js            # JavaScript application logic
├── database/              # Database management
│   └── db_manager.py      # SQLite operations
├── data/                  # Local data storage
├── archive/               # Legacy Streamlit code
└── tools/                 # Utility functions
```

## 🛠️ Development

### API Testing
```bash
# Run API tests
python test_api.py

# Check API documentation
curl http://localhost:8000/docs
```

### Frontend Development
The frontend uses vanilla JavaScript with Plotly for charts. Edit files in `frontend/` and the server will auto-reload.

## 📊 Data Format

### CSV Requirements
Your transaction CSV should include:
- `date`: Transaction date (YYYY-MM-DD)
- `amount`: Transaction amount (positive for income, negative for expenses)
- `description`: Transaction description

### Optional Columns
- `account`: Account name
- `payee`: Payee information
- `category`: Pre-assigned category

## 🔧 Troubleshooting

### Server Won't Start
1. Check if conda environment is activated: `conda activate pfin`
2. Install missing dependencies: `pip install -r requirements.txt`
3. Check port availability: `lsof -i :8000`

### Database Issues
1. Check data folder permissions
2. Verify SQLite installation
3. Clear database: Delete `data/personal_finance.db`

### Frontend Not Loading
1. Check browser console for errors
2. Verify static files are served correctly
3. Clear browser cache

## 📈 Legacy Code

The original Streamlit application has been moved to the `archive/` folder for reference. To run the legacy version:

```bash
cd archive/
streamlit run main.py
```

---

**Version**: 2.0  
**License**: Private  
**Privacy**: Local-only data storage
