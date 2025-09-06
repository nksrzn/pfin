// Personal Finance Dashboard - JavaScript Application
class FinanceDashboard {
    // Chart data cache for robust redraws
    lastIncomeExpenseData = null;
    lastCumulativeExpensesData = null;
    lastExpenseGroupsData = null;
    lastExpenseGroupsDeepDiveData = null;

    // Redraw all charts using cached data
    redrawAllCharts() {
        if (this.lastIncomeExpenseData) this.renderIncomeExpenseChart(this.lastIncomeExpenseData);
        if (this.lastCumulativeExpensesData) this.renderCumulativeExpensesChart(this.lastCumulativeExpensesData);
        if (this.lastExpenseGroupsData) this.renderExpenseGroupsChart(this.lastExpenseGroupsData);
        if (this.lastExpenseGroupsDeepDiveData) this.renderExpenseGroupsDeepDiveChart(this.lastExpenseGroupsDeepDiveData);
    }
    constructor() {
        this.apiBase = 'http://127.0.0.1:8000/api';
        this.currentPage = 'upload';
        this.transactions = [];
        this.categories = [];
        this.stats = {};
        
        this.init();
    }

    // Centralized color system for consistent category colors across all charts
    getCategoryColors() {
        return {
            'Living': '#ef4444',                    // Red
            'Transport': '#f59e0b',                 // Orange/Amber
            'Subscriptions': '#8b5cf6',             // Purple
            'Investment': '#3b82f6',                // Blue
            'Sports, Wellness, Health': '#10b981',  // Green
            'Shopping': '#64748b',                  // Gray
            'Groceries': '#06b6d4',                 // Cyan
            'Eating out, Bars, Social': '#ec4899',  // Pink
            'Other': '#94a3b8'                      // Light gray
        };
    }

    // Get color for a specific category (case-insensitive)
    getCategoryColor(category) {
        const colors = this.getCategoryColors();
        // Try exact match first
        if (colors[category]) return colors[category];
        
        // Try case-insensitive match
        const normalizedCategory = category.toLowerCase();
        for (const [key, value] of Object.entries(colors)) {
            if (key.toLowerCase() === normalizedCategory) return value;
        }
        
        // Fallback to generating consistent color from category name
        const hash = this.hashCode(category);
        const colorArray = Object.values(colors);
        return colorArray[Math.abs(hash) % colorArray.length];
    }

    // Generate a hash code for consistent color assignment
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }

    async init() {
        console.log('FinanceDashboard initializing...');
        await this.loadCategories();
        await this.updateStats();
        this.setupEventListeners();
        
        // Check if data exists and set appropriate default page
        await this.setDefaultPage();
        
        console.log('FinanceDashboard initialized successfully');
    }

    async setDefaultPage() {
        try {
            const response = await this.apiCall('/analytics/has-data');
            const hasData = response.has_data;
            
            if (hasData) {
                // If data exists, show analytics page
                this.showPage('analytics');
            } else {
                // If no data, show upload page
                this.showPage('upload');
            }
        } catch (error) {
            console.error('Error checking for existing data, defaulting to upload page:', error);
            this.showPage('upload');
        }
    }

    // API Methods
    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Call failed:', error);
            this.showToast('API call failed: ' + error.message, 'error');
            throw error;
        }
    }

    async loadCategories() {
        try {
            this.categories = await this.apiCall('/categories/available');
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    async updateStats() {
        try {
            this.stats = await this.apiCall('/transactions/stats/database');
            this.updateSidebarStats();
        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }

    // UI Methods
    updateSidebarStats() {
        const totalEl = document.getElementById('totalTransactions');
        const categorizedEl = document.getElementById('categorizedPct');
        const uncategorizedWarning = document.getElementById('uncategorizedWarning');
        const uncategorizedCount = document.getElementById('uncategorizedCount');
        const categorizeBadge = document.getElementById('categorizeBadge');

        if (totalEl) totalEl.textContent = this.stats.total_transactions || 0;
        
        if (categorizedEl && this.stats.total_transactions > 0) {
            const categorizedPct = ((this.stats.manually_categorized + this.stats.auto_categorized) / this.stats.total_transactions * 100).toFixed(1);
            categorizedEl.textContent = `${categorizedPct}%`;
        }

        if (this.stats.uncategorized > 0) {
            uncategorizedWarning.style.display = 'block';
            uncategorizedCount.textContent = this.stats.uncategorized;
            categorizeBadge.textContent = this.stats.uncategorized;
            categorizeBadge.style.display = 'inline-block';
        } else {
            uncategorizedWarning.style.display = 'none';
            categorizeBadge.style.display = 'none';
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <p>${message}</p>
            </div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    showModal(title, message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalConfirm = document.getElementById('modalConfirm');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.style.display = 'flex';
        
        modalConfirm.onclick = () => {
            modal.style.display = 'none';
            if (onConfirm) onConfirm();
        };
    }

    showLoading(show = true) {
        const indicator = document.getElementById('loadingIndicator');
        indicator.style.display = show ? 'block' : 'none';
    }

    // Page Navigation
    showPage(pageId) {
        console.log('Showing page:', pageId);
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-page="${pageId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Hide all pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.style.display = 'none';
        });

        // Show selected page
        const targetPage = document.getElementById(`${pageId}Page`);
        if (targetPage) {
            targetPage.style.display = 'block';
            console.log('Successfully showed page:', pageId);
        } else {
            console.error('Page not found:', `${pageId}Page`);
        }

        // Update page title
        const titles = {
            upload: 'Upload',
            categorize: 'Categorize Transactions',
            analytics: 'Financial Analytics',
            settings: 'Settings'
        };
        document.getElementById('pageTitle').textContent = titles[pageId] || 'Personal Finance Dashboard';

        this.currentPage = pageId;

        // Load page-specific data
        this.loadPageData(pageId);
    }

    async loadPageData(pageId) {
        this.showLoading(true);
        
        try {
            switch (pageId) {
                case 'upload':
                    await this.loadUploadPageData();
                    break;
                case 'categorize':
                    await this.loadCategorizePageData();
                    break;
                case 'analytics':
                    await this.loadAnalyticsPageData();
                    // Wait for page to be visible, then redraw charts
                    setTimeout(() => {
                        this.forceChartsRedraw();
                    }, 200);
                    break;
                case 'settings':
                    await this.loadSettingsPageData();
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${pageId} page data:`, error);
        } finally {
            this.showLoading(false);
        }
    }

    forceChartsRedraw() {
        const chartIds = ['incomeExpenseChart', 'cumulativeExpensesChart', 'expenseGroupsChart', 'expenseGroupsDeepDiveChart'];
        chartIds.forEach(chartId => {
            const element = document.getElementById(chartId);
            if (element && element.data) {
                // Simple resize call
                Plotly.Plots.resize(chartId);
            }
        });
    }

    // Upload Page
    async loadUploadPageData() {
        try {
            const response = await this.apiCall('/uploads/last-filename');
            const lastFileName = response.filename || 'None';
            document.getElementById('lastFileName').textContent = lastFileName;
            
            const fileActions = document.getElementById('fileActions');
            if (lastFileName !== 'None') {
                fileActions.style.display = 'block';
            }
        } catch (error) {
            console.error('Failed to load upload data:', error);
        }
    }

    // Categorize Page
    async loadCategorizePageData() {
        try {
            this.transactions = await this.apiCall('/transactions/');
            this.setupTabNavigation();
            this.updateTabCounts();
            this.renderTransactionTables();
        } catch (error) {
            console.error('Failed to load transactions:', error);
        }
    }

    setupTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = btn.getAttribute('data-tab');
                
                // Remove active class from all tabs and contents
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                btn.classList.add('active');
                document.getElementById(`${targetTab}Tab`).classList.add('active');
                
                // Re-render the appropriate table
                this.renderTransactionTables();
            });
        });
    }

    updateTabCounts() {
        const uncategorized = this.transactions.filter(t => !t.category || t.category === 'Other');
        const categorized = this.transactions.filter(t => t.category && t.category !== 'Other');
        
        document.getElementById('uncategorizedBadge').textContent = uncategorized.length;
        document.getElementById('categorizedBadge').textContent = categorized.length;
    }

    renderTransactionTables() {
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        
        if (activeTab === 'uncategorized') {
            this.renderUncategorizedTable();
        } else {
            this.renderCategorizedTable();
        }
    }

    renderUncategorizedTable() {
        const tbody = document.getElementById('uncategorizedTableBody');
        tbody.innerHTML = '';
        
        const uncategorizedTransactions = this.transactions.filter(t => !t.category || t.category === 'Other');
        
        if (uncategorizedTransactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-check-circle"></i>
                            <p>All transactions categorized</p>
                        </div>
                    </td>
                </tr>
            `;
            this.hideSaveAllButton();
            return;
        }

        uncategorizedTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.className = 'transaction-row';
            
            const amount = parseFloat(transaction.amount);
            const amountClass = amount >= 0 ? 'positive' : 'negative';
            
            row.innerHTML = `
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td class="${amountClass}">${amount.toFixed(2)}</td>
                <td>${transaction.description}</td>
                <td>${transaction.account || '-'}</td>
                <td>${transaction.payee || '-'}</td>
                <td>
                    <select class="form-select category-select" data-transaction-id="${transaction.id}">
                        ${this.categories.map(cat => 
                            `<option value="${cat}" ${cat === transaction.category ? 'selected' : ''}>${cat}</option>`
                        ).join('')}
                    </select>
                </td>
            `;
            
            tbody.appendChild(row);
        });

        this.bindCategoryEvents();
        this.checkForPendingChanges();
    }

    renderCategorizedTable() {
        const tbody = document.getElementById('categorizedTableBody');
        tbody.innerHTML = '';
        
        const categorizedTransactions = this.transactions.filter(t => t.category && t.category !== 'Other');
        
        if (categorizedTransactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-upload"></i>
                            <p>NO_CATEGORIZED_TRANSACTIONS</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        categorizedTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.className = 'transaction-row';
            
            const amount = parseFloat(transaction.amount);
            const amountClass = amount >= 0 ? 'positive' : 'negative';
            
            row.innerHTML = `
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td class="${amountClass}">${amount.toFixed(2)}</td>
                <td>${transaction.description}</td>
                <td>${transaction.account || '-'}</td>
                <td>${transaction.payee || '-'}</td>
                <td>
                    <span class="category-badge">${transaction.category}</span>
                </td>
                <td>
                    <button class="btn btn-sm edit-category-btn" data-transaction-id="${transaction.id}">
                        <i class="fas fa-edit"></i> EDIT
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });

        this.bindEditEvents();
    }

    bindCategoryEvents() {
        // Handle individual save buttons for categorized tab
        document.querySelectorAll('.save-category-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const transactionId = e.target.dataset.transactionId;
                const select = document.querySelector(`select[data-transaction-id="${transactionId}"]`);
                const newCategory = select.value;
                
                try {
                    await this.apiCall(`/transactions/${transactionId}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ category: newCategory })
                    });
                    
                    this.showToast('Category updated successfully', 'success');
                    
                    // Refresh the categorize page data
                    await this.loadCategorizePageData();
                    await this.updateStats();
                } catch (error) {
                    console.error('Failed to update category:', error);
                    this.showToast('Failed to update category', 'error');
                }
            });
        });

        // Handle category changes for uncategorized transactions
        document.querySelectorAll('#uncategorizedTableBody .category-select').forEach(select => {
            select.addEventListener('change', () => {
                this.checkForPendingChanges();
            });
        });
    }

    checkForPendingChanges() {
        const selects = document.querySelectorAll('#uncategorizedTableBody .category-select');
        let hasPendingChanges = false;

        selects.forEach(select => {
            const transactionId = select.dataset.transactionId;
            const transaction = this.transactions.find(t => t.id == transactionId);
            const currentCategory = transaction ? (transaction.category || 'Other') : 'Other';
            
            if (select.value !== currentCategory) {
                hasPendingChanges = true;
            }
        });

        if (hasPendingChanges) {
            this.showSaveAllButton();
        } else {
            this.hideSaveAllButton();
        }
    }

    showSaveAllButton() {
        const saveAllBtn = document.getElementById('saveAllCategoriesBtn');
        if (saveAllBtn) {
            saveAllBtn.style.display = 'inline-flex';
        }
    }

    hideSaveAllButton() {
        const saveAllBtn = document.getElementById('saveAllCategoriesBtn');
        if (saveAllBtn) {
            saveAllBtn.style.display = 'none';
        }
    }

    async saveAllCategories() {
        const selects = document.querySelectorAll('#uncategorizedTableBody .category-select');
        const updates = [];

        selects.forEach(select => {
            const transactionId = select.dataset.transactionId;
            const transaction = this.transactions.find(t => t.id == transactionId);
            const currentCategory = transaction ? (transaction.category || 'Other') : 'Other';
            
            if (select.value !== currentCategory) {
                updates.push({
                    id: transactionId,
                    category: select.value
                });
            }
        });

        if (updates.length === 0) {
            this.showToast('No changes to save', 'info');
            return;
        }

        try {
            // Save all manual updates first
            for (const update of updates) {
                await this.apiCall(`/transactions/${update.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ category: update.category })
                });
            }

            this.showToast(`Successfully updated ${updates.length} transactions`, 'success');
            
            // Apply auto-categorization to remaining uncategorized transactions
            try {
                const autoResponse = await this.apiCall('/transactions/auto-categorize', { method: 'POST' });
                if (autoResponse.categorized_count > 0) {
                    this.showToast(`Auto-categorized ${autoResponse.categorized_count} additional transactions`, 'success');
                }
            } catch (autoError) {
                console.warn('Auto-categorization failed:', autoError);
                // Don't show error toast for auto-categorization as manual saves were successful
            }
            
            // Refresh the data
            await this.loadCategorizePageData();
            await this.updateStats();
            
            // Hide the save button
            this.hideSaveAllButton();
            
        } catch (error) {
            console.error('Failed to save categories:', error);
            this.showToast('Failed to save some categories', 'error');
        }
    }

    bindEditEvents() {
        document.querySelectorAll('.edit-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const transactionId = e.target.dataset.transactionId;
                const row = e.target.closest('tr');
                const categoryCell = row.cells[5]; // Category column
                
                // Create a select dropdown for editing
                const currentCategory = categoryCell.textContent.trim();
                const select = document.createElement('select');
                select.className = 'form-select category-select';
                select.setAttribute('data-transaction-id', transactionId);
                
                this.categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    option.selected = cat === currentCategory;
                    select.appendChild(option);
                });
                
                // Replace the category badge with select
                categoryCell.innerHTML = '';
                categoryCell.appendChild(select);
                
                // Replace edit button with save button
                e.target.innerHTML = '<i class="fas fa-save"></i> SAVE';
                e.target.className = 'btn btn-success btn-sm save-category-btn';
                e.target.setAttribute('data-transaction-id', transactionId);
                
                // Remove old event listener and add new one
                const newBtn = e.target.cloneNode(true);
                e.target.parentNode.replaceChild(newBtn, e.target);
                
                newBtn.addEventListener('click', async () => {
                    const newCategory = select.value;
                    
                    try {
                        await this.apiCall(`/transactions/${transactionId}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ category: newCategory })
                        });
                        
                        this.showToast('Category updated successfully', 'success');
                        
                        // Refresh the categorize page data
                        await this.loadCategorizePageData();
                        await this.updateStats();
                    } catch (error) {
                        console.error('Failed to update category:', error);
                        this.showToast('Failed to update category', 'error');
                    }
                });
            });
        });
    }

    // Analytics Page
    async loadAnalyticsPageData() {
        try {
            // Load all 5 analytics components
            await Promise.all([
                this.loadIncomeExpenseChart(),
                this.loadCumulativeExpensesChart(),
                this.loadExpenseGroupsChart(),
                this.loadExpenseGroupsDeepDiveChart(),
                this.loadBankTransactionsTable()
            ]);
            
            // Set up event listeners for period selectors
            this.setupAnalyticsEventListeners();
            
            // Set up resize observer for charts
            this.setupChartResizeObserver();
            
            // Force redraw after initial load
            setTimeout(() => this.redrawAllCharts(), 200);
            
        } catch (error) {
            console.error('Failed to load analytics data:', error);
        }
    }

    setupChartResizeObserver() {
        // Robust resize handling: redraw all charts on resize
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.redrawAllCharts();
            }, 150);
        });
    }

    setupAnalyticsEventListeners() {
        // Income vs Expenses period selector
        const incomeExpensePeriod = document.getElementById('incomeExpensePeriod');
        if (incomeExpensePeriod) {
            incomeExpensePeriod.addEventListener('change', () => {
                this.loadIncomeExpenseChart();
            });
        }

        // Cumulative Expenses period selector
        const cumulativeExpensesPeriod = document.getElementById('cumulativeExpensesPeriod');
        if (cumulativeExpensesPeriod) {
            cumulativeExpensesPeriod.addEventListener('change', () => {
                this.loadCumulativeExpensesChart();
            });
        }

        // Expense Groups period selector
        const expenseGroupsPeriod = document.getElementById('expenseGroupsPeriod');
        if (expenseGroupsPeriod) {
            expenseGroupsPeriod.addEventListener('change', () => {
                this.loadExpenseGroupsChart();
            });
        }

        // Expense Groups Monthly Average checkbox
        const expenseGroupsMonthlyAvg = document.getElementById('expenseGroupsMonthlyAvg');
        if (expenseGroupsMonthlyAvg) {
            expenseGroupsMonthlyAvg.addEventListener('change', () => {
                this.loadExpenseGroupsChart();
            });
        }

        // Expense Groups Deep Dive category selector
        const expenseGroupsDeepDiveCategory = document.getElementById('expenseGroupsDeepDiveCategory');
        if (expenseGroupsDeepDiveCategory) {
            expenseGroupsDeepDiveCategory.addEventListener('change', () => {
                this.loadExpenseGroupsDeepDiveChart();
            });
        }

        // Expense Groups Deep Dive period selector
        const expenseGroupsDeepDivePeriod = document.getElementById('expenseGroupsDeepDivePeriod');
        if (expenseGroupsDeepDivePeriod) {
            expenseGroupsDeepDivePeriod.addEventListener('change', () => {
                this.loadExpenseGroupsDeepDiveChart();
            });
        }

        // Example: If you have a fullscreen button or tab navigation, add listeners here
        const fullscreenBtns = document.querySelectorAll('.fullscreen-btn');
        fullscreenBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setTimeout(() => this.redrawAllCharts(), 150);
            });
        });

        // If you have tab navigation for analytics, add listeners to redraw
        const analyticsTabs = document.querySelectorAll('.analytics-tab-btn');
        analyticsTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                setTimeout(() => this.redrawAllCharts(), 150);
            });
        });
    }

    async loadIncomeExpenseChart() {
        try {
            const period = document.getElementById('incomeExpensePeriod')?.value || 6;
            const data = await this.apiCall(`/analytics/income-expense-plot?months_back=${period}`);
            this.lastIncomeExpenseData = data;
            this.renderIncomeExpenseChart(data);
        } catch (error) {
            console.error('Failed to load income expense chart:', error);
        }
    }

    renderIncomeExpenseChart(data) {
        const plotData = data.plot_data;
        
        // Calculate small offset to prevent line overlap when values are equal
        const maxValue = Math.max(
            ...plotData.income,
            ...plotData.expenses,
            ...plotData.expenses.map((exp, i) => exp + plotData.investment[i])
        );
        const offset = maxValue * 0.01; // 1% of max value for small visual separation
        
        const chartData = [
            {
                x: plotData.dates,
                y: plotData.income.map(val => val + offset), // Slight upward offset
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Income',
                line: { color: '#10b981', width: 2 },
                customdata: plotData.income, // Store original values for hover
                hovertemplate: '<b>Income</b><br>Date: %{x}<br>Amount: %{customdata:.2f}<extra></extra>'
            },
            {
                x: plotData.dates,
                y: plotData.expenses, // Keep expenses at original position (middle)
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Expenses',
                line: { color: '#ec4899', width: 2 },
                hovertemplate: '<b>Expenses</b><br>Date: %{x}<br>Amount: %{y:.2f}<extra></extra>'
            },
            {
                x: plotData.dates,
                y: plotData.expenses.map((exp, i) => exp + plotData.investment[i] - offset), // Slight downward offset from stacked position
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Investment',
                line: { color: '#3b82f6', width: 2 },
                customdata: plotData.investment,
                hovertemplate: '<b>Investment</b><br>Date: %{x}<br>Amount: %{customdata:.2f}<extra></extra>'
            }
        ];
        const container = document.getElementById('incomeExpenseChart');
        container.innerHTML = '';
        const rect = container.getBoundingClientRect();
        const width = rect.width || 800;
        const height = rect.height || 500;
        const layout = {
            xaxis: { 
                title: { 
                    text: 'Month',
                    standoff: 20
                },
                tickangle: -45,
                automargin: true,
                showticklabels: true,
                side: 'bottom'
            },
            yaxis: { 
                title: {
                    text: 'Amount',
                    standoff: 20
                },
                automargin: true
            },
            margin: { l: 80, r: 40, t: 60, b: 120 },
            showlegend: true,
            legend: {
                x: 1,
                xanchor: 'right',
                y: 1
            },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            width,
            height
        };
        const config = { 
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        };
        setTimeout(() => {
            Plotly.purge(container);
            Plotly.newPlot(container, chartData, layout, config);
            Plotly.Plots.resize(container);
        }, 100);
    }

    async loadCumulativeExpensesChart() {
        try {
            const period = document.getElementById('cumulativeExpensesPeriod')?.value || 3;
            const data = await this.apiCall(`/analytics/cumulative-expenses-plot?months_back=${period}`);
            this.lastCumulativeExpensesData = data;
            this.renderCumulativeExpensesChart(data);
        } catch (error) {
            console.error('Failed to load cumulative expenses chart:', error);
        }
    }

    renderCumulativeExpensesChart(data) {
        const traces = [];
        const categories = data.categories || [];
        
        // Filter out INCOME and INVESTMENT categories - only show expense categories
        const expenseCategories = categories.filter(category => 
            category !== 'INCOME' && 
            category !== 'INVESTMENT' &&
            category.toLowerCase() !== 'income' &&
            category.toLowerCase() !== 'investment'
        );
        
        expenseCategories.forEach((category, index) => {
            const categoryData = data.plot_data[category] || [];
            const color = this.getCategoryColor(category);
            traces.push({
                x: categoryData.map(d => d.date),
                y: categoryData.map(d => d.cumulative_amount),
                type: 'scatter',
                mode: 'lines',
                name: category,
                stackgroup: 'expenses',
                line: { width: 0.5, color: color },
                fill: 'tonexty',
                fillcolor: color + '33'
            });
        });
        const container = document.getElementById('cumulativeExpensesChart');
        container.innerHTML = '';
        const rect = container.getBoundingClientRect();
        const width = rect.width || 800;
        const height = rect.height || 500;
        const layout = {
            xaxis: { 
                title: 'Date',
                automargin: true,
                showticklabels: true,
                side: 'bottom'
            },
            yaxis: { 
                title: 'Amount',
                automargin: true
            },
            margin: { l: 80, r: 30, t: 60, b: 120 },
            hovermode: 'x unified',
            showlegend: true,
            legend: {
                x: 1.02,
                xanchor: 'left',
                y: 1
            },
            width,
            height
        };
        const config = { 
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        };
        setTimeout(() => {
            Plotly.purge(container);
            Plotly.newPlot(container, traces, layout, config);
            Plotly.Plots.resize(container);
        }, 100);
    }

    async loadExpenseGroupsChart() {
        try {
            const period = document.getElementById('expenseGroupsPeriod')?.value || '1';
            let endpoint = '/analytics/expense-groups-plot';
            if (period !== 'all') {
                endpoint += `?months_back=${period}`;
            }
            const data = await this.apiCall(endpoint);
            this.lastExpenseGroupsData = data;
            this.renderExpenseGroupsChart(data);
        } catch (error) {
            console.error('Failed to load expense groups chart:', error);
        }
    }

    renderExpenseGroupsChart(data) {
        const plotData = data.plot_data;
        
        // Filter out INCOME and INVESTMENT categories - only show expense categories
        const expenseLabels = plotData.labels.filter(label => 
            label !== 'INCOME' && 
            label !== 'INVESTMENT' &&
            label.toLowerCase() !== 'income' &&
            label.toLowerCase() !== 'investment'
        );
        
        // Get corresponding values for filtered labels
        let expenseValues = expenseLabels.map(label => {
            const index = plotData.labels.indexOf(label);
            return plotData.values[index];
        });
        
        // Check if Monthly AVG checkbox is checked
        const monthlyAvgCheckbox = document.getElementById('expenseGroupsMonthlyAvg');
        const isMonthlyAvg = monthlyAvgCheckbox && monthlyAvgCheckbox.checked;
        
        if (isMonthlyAvg) {
            // Calculate monthly averages based on selected period
            const periodSelect = document.getElementById('expenseGroupsPeriod');
            const period = periodSelect ? periodSelect.value : '1';
            
            let months = 1;
            if (period === 'all') {
                // For 'all time', we need to estimate based on data range
                // This is a rough estimate - ideally the backend would provide this info
                months = 12; // Default assumption for 'all time'
            } else {
                months = parseInt(period);
            }
            
            expenseValues = expenseValues.map(value => value / months);
        }
        
        // Generate consistent colors for each expense category with balanced transparency
        const consistentColors = expenseLabels.map(label => {
            const color = this.getCategoryColor(label);
            // Convert hex to rgba with 0.5 opacity for balanced subtle appearance
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, 0.5)`;
        });
        
        const chartData = [{
            x: expenseLabels,
            y: expenseValues,
            type: 'bar',
            marker: {
                color: consistentColors,
                line: {
                    color: expenseLabels.map(label => this.getCategoryColor(label)),
                    width: 0.5
                }
            },
            text: expenseValues.map(v => v.toFixed(2)),
            textposition: 'auto'
        }];
        const container = document.getElementById('expenseGroupsChart');
        container.innerHTML = '';
        const rect = container.getBoundingClientRect();
        const width = rect.width || 800;
        const height = rect.height || 500;
        
        // Update y-axis title based on monthly average checkbox
        const yAxisTitle = isMonthlyAvg ? 'Monthly Average Amount' : 'Total Amount';
        
        const layout = {
            xaxis: { 
                title: 'Category',
                tickangle: -45,
                automargin: true,
                showticklabels: true,
                side: 'bottom'
            },
            yaxis: { 
                title: yAxisTitle,
                automargin: true
            },
            margin: { l: 80, r: 30, t: 60, b: 120 },
            width,
            height
        };
        const config = { 
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        };
        setTimeout(() => {
            Plotly.purge(container);
            Plotly.newPlot(container, chartData, layout, config);
            Plotly.Plots.resize(container);
        }, 100);
    }

    async loadExpenseGroupsDeepDiveChart() {
        try {
            // Get selected category and period
            const categorySelect = document.getElementById('expenseGroupsDeepDiveCategory');
            const periodSelect = document.getElementById('expenseGroupsDeepDivePeriod');
            
            const category = categorySelect?.value || 'all';
            const monthsBack = periodSelect ? parseInt(periodSelect.value) : 1;

            // Build endpoint with both parameters
            let endpoint = '/analytics/expense-groups-deepdive';
            const params = new URLSearchParams();

            if (category !== 'all') {
                params.append('category', category);
            }
            
            params.append('months_back', monthsBack.toString());

            if (params.toString()) {
                endpoint += `?${params.toString()}`;
            }

            const data = await this.apiCall(endpoint);
            this.lastExpenseGroupsDeepDiveData = data;
            
            // Populate the category dropdown with available categories
            this.populateExpenseGroupsDeepDiveCategories(data.categories);
            
            this.renderExpenseGroupsDeepDiveChart(data);
        } catch (error) {
            console.error('Failed to load expense groups deepdive chart:', error);
        }
    }

    populateExpenseGroupsDeepDiveCategories(categories) {
        const select = document.getElementById('expenseGroupsDeepDiveCategory');
        if (!select || !categories) return;
        
        // Store current selection
        const currentValue = select.value;
        
        // Clear existing options except "All Categories"
        select.innerHTML = '<option value="all">All Categories</option>';
        
        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
        
        // Restore selection if it still exists
        if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
            select.value = currentValue;
        }
    }

    renderExpenseGroupsDeepDiveChart(data) {
        const traces = [];
        const selectedCategory = document.getElementById('expenseGroupsDeepDiveCategory')?.value || 'all';
        const scatterData = data.scatter_data || [];
        const dateRange = data.date_range || {};
        
        // Filter out INCOME and INVESTMENT categories from scatter data
        const expenseScatterData = scatterData.filter(point => 
            point.category !== 'INCOME' && 
            point.category !== 'INVESTMENT' &&
            point.category.toLowerCase() !== 'income' &&
            point.category.toLowerCase() !== 'investment'
        );
        
        // Group scatter data by category
        const categorizedData = {};
        expenseScatterData.forEach(point => {
            if (!categorizedData[point.category]) {
                categorizedData[point.category] = [];
            }
            categorizedData[point.category].push(point);
        });
        
        // Create traces for each expense category
        Object.keys(categorizedData).forEach((category, index) => {
            const categoryPoints = categorizedData[category];
            const color = this.getCategoryColor(category);
            
            traces.push({
                x: categoryPoints.map(p => p.date),
                y: categoryPoints.map(p => p.amount),
                mode: 'markers',
                type: 'scatter',
                name: category,
                marker: {
                    color: color,
                    size: 8,
                    opacity: 0.7
                },
                text: categoryPoints.map(p => `${p.payee}<br>${p.amount}<br>${p.description}`),
                hovertemplate: '<b>%{text}</b><br>Date: %{x}<br>Amount: %{y}<extra></extra>'
            });
        });
        
        const container = document.getElementById('expenseGroupsDeepDiveChart');
        container.innerHTML = '';
        const rect = container.getBoundingClientRect();
        const width = rect.width || 800;
        const height = rect.height || 500;
        
        // Build x-axis configuration with proper date range
        const xaxisConfig = { 
            title: 'Date',
            type: 'date',
            automargin: true,
            showticklabels: true,
            side: 'bottom'
        };
        
        // Set date range if provided by backend to ensure full time range is shown
        if (dateRange.start_date && dateRange.end_date) {
            xaxisConfig.range = [dateRange.start_date, dateRange.end_date];
        }
        
        const layout = {
            xaxis: xaxisConfig,
            yaxis: { 
                title: 'Amount',
                automargin: true
            },
            margin: { l: 80, r: 30, t: 60, b: 120 },
            showlegend: selectedCategory === 'all',
            legend: {
                x: 1.02,
                xanchor: 'left',
                y: 1
            },
            hovermode: 'closest',
            width,
            height
        };
        
        const config = { 
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        };
        
        setTimeout(() => {
            Plotly.purge(container);
            Plotly.newPlot(container, traces, layout, config);
            Plotly.Plots.resize(container);
        }, 100);
    }

    async loadBankTransactionsTable() {
        try {
            const data = await this.apiCall('/analytics/bank-transactions-table');
            this.renderBankTransactionsTable(data);
        } catch (error) {
            console.error('Failed to load bank transactions table:', error);
        }
    }

    renderBankTransactionsTable(data) {
        // Store the original data for filtering
        this.originalTransactions = data.transactions || [];
        this.filteredTransactions = [...this.originalTransactions];
        this.activeFilters = {};
        
        // Render the table
        this.updateTableDisplay();
        
        // Setup filter functionality
        this.setupTableFilters();
        
        // Populate filter options
        this.populateFilterOptions();
        
        // Setup special date filter logic
        this.setupDateFilterLogic();
    }

    updateTableDisplay() {
        const tbody = document.getElementById('bankTransactionsTableBody');
        tbody.innerHTML = '';

        if (!this.filteredTransactions || this.filteredTransactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No transactions available</td></tr>';
            return;
        }

        this.filteredTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            // Format amount with color coding
            const amountClass = transaction.amount >= 0 ? 'amount-positive' : 'amount-negative';
            const formattedAmount = new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: 'EUR' 
            }).format(Math.abs(transaction.amount));
            
            row.innerHTML = `
                <td>${transaction.date}</td>
                <td>${transaction.payee}</td>
                <td class="${amountClass}">${transaction.amount >= 0 ? '+' : '-'}${formattedAmount}</td>
                <td><span class="category-badge">${transaction.category}</span></td>
                <td>${transaction.account || ''}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    setupTableFilters() {
        // Close filter menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.filter-dropdown')) {
                document.querySelectorAll('.filter-menu').forEach(menu => {
                    menu.classList.remove('show');
                    menu.classList.remove('show-above');
                });
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
            }
        });

        // Setup filter button clicks
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const column = btn.dataset.column;
                const menu = document.getElementById(`${column}Filter`);
                const isCurrentlyOpen = menu.classList.contains('show');
                
                // Close all other menus
                document.querySelectorAll('.filter-menu').forEach(m => {
                    m.classList.remove('show');
                    m.classList.remove('show-above');
                });
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                
                // Toggle current menu
                if (!isCurrentlyOpen) {
                    // Check if there's enough space below
                    const btnRect = btn.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    const spaceBelow = viewportHeight - btnRect.bottom;
                    const menuHeight = 350; // Max height of filter menu
                    
                    if (spaceBelow < menuHeight && btnRect.top > menuHeight) {
                        menu.classList.add('show-above');
                    } else {
                        menu.classList.remove('show-above');
                    }
                    
                    menu.classList.add('show');
                    btn.classList.add('active');
                }
            });
        });

        // Setup filter actions
        document.querySelectorAll('.filter-clear').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const menu = btn.closest('.filter-menu');
                const column = menu.id.replace('Filter', '');
                this.clearFilter(column);
            });
        });

        // Setup search inputs
        document.querySelectorAll('.filter-search-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const menu = input.closest('.filter-menu');
                const column = menu.id.replace('Filter', '');
                this.filterOptions(column, e.target.value);
            });
        });
    }

    populateFilterOptions() {
        const columns = ['date', 'payee', 'amount', 'category', 'account'];
        
        columns.forEach(column => {
            if (column === 'date') {
                this.populateDateFilterOptions();
            } else {
                const values = [...new Set(this.originalTransactions.map(t => {
                    if (column === 'amount') {
                        const formatted = new Intl.NumberFormat('en-US', { 
                            style: 'currency', 
                            currency: 'EUR' 
                        }).format(Math.abs(t[column]));
                        return t[column] >= 0 ? `+${formatted}` : `-${formatted}`;
                    }
                    return t[column] || '';
                }))].sort();
                
                const optionsContainer = document.getElementById(`${column}Options`);
                optionsContainer.innerHTML = '';
                
                // Add "Select All" option at the top
                const selectAllOption = document.createElement('div');
                selectAllOption.className = 'filter-option select-all-option';
                selectAllOption.innerHTML = `
                    <input type="checkbox" value="__select_all__" checked>
                    <span><strong>Select All</strong></span>
                `;
                optionsContainer.appendChild(selectAllOption);
                
                // Add separator
                const separator = document.createElement('div');
                separator.style.borderTop = '1px solid #eee';
                separator.style.margin = '8px 0';
                optionsContainer.appendChild(separator);
                
                values.forEach(value => {
                    if (value) {
                        const option = document.createElement('div');
                        option.className = 'filter-option';
                        option.innerHTML = `
                            <input type="checkbox" value="${value}">
                            <span>${value}</span>
                        `;
                        optionsContainer.appendChild(option);
                    }
                });
                
                // Add click handlers for direct filtering
                this.setupDirectFilterHandlers(column);
            }
        });
    }

    populateDateFilterOptions() {
        const optionsContainer = document.getElementById('dateOptions');
        optionsContainer.innerHTML = '';
        
        // Add "Select All" option at the top
        const selectAllOption = document.createElement('div');
        selectAllOption.className = 'filter-option select-all-option';
        selectAllOption.innerHTML = `
            <input type="checkbox" value="__select_all__" checked>
            <span><strong>Select All</strong></span>
        `;
        optionsContainer.appendChild(selectAllOption);
        
        // Add separator
        const separator = document.createElement('div');
        separator.style.borderTop = '1px solid #eee';
        separator.style.margin = '8px 0';
        optionsContainer.appendChild(separator);
        
        // Get unique months from transactions
        const monthsSet = new Set();
        this.originalTransactions.forEach(t => {
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            monthsSet.add(JSON.stringify({ key: monthKey, label: monthLabel }));
        });
        
        // Convert to sorted array
        const months = Array.from(monthsSet)
            .map(item => JSON.parse(item))
            .sort((a, b) => b.key.localeCompare(a.key)); // Most recent first
        
        // Add month options
        months.forEach(month => {
            const option = document.createElement('div');
            option.className = 'filter-option';
            option.innerHTML = `
                <input type="checkbox" value="${month.key}">
                <span>${month.label}</span>
            `;
            optionsContainer.appendChild(option);
        });
        
        // Add click handlers for direct filtering
        this.setupDirectFilterHandlers('date');
    }

    setupDirectFilterHandlers(column) {
        const optionsContainer = document.getElementById(`${column}Options`);
        
        optionsContainer.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') {
                const clickedValue = e.target.value;
                const isSelectAll = clickedValue === '__select_all__';
                const selectAllCheckbox = optionsContainer.querySelector('input[value="__select_all__"]');
                
                if (isSelectAll) {
                    // Select All clicked
                    if (e.target.checked) {
                        // Select All is being checked - uncheck all individual items
                        const individualCheckboxes = optionsContainer.querySelectorAll('input[type="checkbox"]:not([value="__select_all__"])');
                        individualCheckboxes.forEach(cb => {
                            cb.checked = false;
                        });
                    }
                } else {
                    // Individual option clicked
                    if (e.target.checked) {
                        // Individual item is being checked
                        // Uncheck Select All first (since we're now selecting specific items)
                        if (selectAllCheckbox) {
                            selectAllCheckbox.checked = false;
                        }
                        // Don't uncheck other items - this is where we make it additive!
                        // The clicked item stays checked (this happens automatically)
                    } else {
                        // Individual item is being unchecked
                        // Check if any other individual items are still checked
                        const checkedItems = optionsContainer.querySelectorAll('input[type="checkbox"]:not([value="__select_all__"]):checked');
                        if (checkedItems.length === 0) {
                            // If no individual items are checked, check Select All
                            if (selectAllCheckbox) {
                                selectAllCheckbox.checked = true;
                            }
                        }
                    }
                }
                
                // Apply the filter immediately but don't close the dropdown
                this.applyFilterWithoutClosing(column);
            }
        });
    }

    filterOptions(column, searchTerm) {
        const optionsContainer = document.getElementById(`${column}Options`);
        const options = optionsContainer.querySelectorAll('.filter-option');
        
        options.forEach(option => {
            const text = option.querySelector('span').textContent.toLowerCase();
            const visible = text.includes(searchTerm.toLowerCase());
            option.style.display = visible ? 'flex' : 'none';
        });
    }

    setupDateFilterLogic() {
        // The new direct filter handlers already handle the date filtering logic
        // No additional special logic needed since setupDirectFilterHandlers handles everything
    }

    clearFilter(column) {
        // Check "Select All" and uncheck all individual options
        const optionsContainer = document.getElementById(`${column}Options`);
        const selectAllCheckbox = optionsContainer.querySelector('input[value="__select_all__"]');
        const otherCheckboxes = optionsContainer.querySelectorAll('input[type="checkbox"]:not([value="__select_all__"])');
        
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = true;
        }
        otherCheckboxes.forEach(cb => {
            cb.checked = false;
        });
        
        // Remove from active filters
        delete this.activeFilters[column];
        
        // Update display
        this.applyAllFilters();
        
        // Close menu
        const menu = document.getElementById(`${column}Filter`);
        menu.classList.remove('show');
        menu.classList.remove('show-above');
        document.querySelector(`[data-column="${column}"]`).classList.remove('active');
    }

    applyFilter(column) {
        const optionsContainer = document.getElementById(`${column}Options`);
        const checkedValues = [];
        
        optionsContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            checkedValues.push(cb.value);
        });
        
        if (checkedValues.length === 0) {
            delete this.activeFilters[column];
        } else {
            this.activeFilters[column] = checkedValues;
        }
        
        this.applyAllFilters();
        
        // Close menu
        const menu = document.getElementById(`${column}Filter`);
        menu.classList.remove('show');
        menu.classList.remove('show-above');
        document.querySelector(`[data-column="${column}"]`).classList.remove('active');
    }

    applyFilterWithoutClosing(column) {
        const optionsContainer = document.getElementById(`${column}Options`);
        const checkedValues = [];
        
        optionsContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            checkedValues.push(cb.value);
        });
        
        if (checkedValues.length === 0) {
            delete this.activeFilters[column];
        } else {
            this.activeFilters[column] = checkedValues;
        }
        
        this.applyAllFilters();
        
        // Don't close the menu - keep it open for better UX
    }

    applyAllFilters() {
        this.filteredTransactions = this.originalTransactions.filter(transaction => {
            return Object.entries(this.activeFilters).every(([column, values]) => {
                if (column === 'date') {
                    // Special handling for date filtering
                    if (values.includes('__select_all__')) {
                        return true; // Show all dates if "Select All" is selected
                    }
                    
                    const transactionDate = new Date(transaction.date);
                    const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                    return values.includes(transactionMonth);
                } else {
                    // Check for "Select All" option
                    if (values.includes('__select_all__')) {
                        return true; // Show all if "Select All" is selected
                    }
                    
                    let transactionValue;
                    
                    if (column === 'amount') {
                        const formatted = new Intl.NumberFormat('en-US', { 
                            style: 'currency', 
                            currency: 'EUR' 
                        }).format(Math.abs(transaction[column]));
                        transactionValue = transaction[column] >= 0 ? `+${formatted}` : `-${formatted}`;
                    } else {
                        transactionValue = transaction[column] || '';
                    }
                    
                    return values.includes(transactionValue);
                }
            });
        });
        
        this.updateTableDisplay();
    }

    // Settings Page
    async loadSettingsPageData() {
        try {
            const mappings = await this.apiCall('/categories/mappings');
            this.renderMappingsTable(mappings);
        } catch (error) {
            console.error('Failed to load mappings:', error);
        }
    }

    renderMappingsTable(mappings) {
        const tbody = document.getElementById('mappingsTableBody');
        tbody.innerHTML = '';

        mappings.forEach(mapping => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${mapping.account}</td>
                <td>${mapping.payee}</td>
                <td>${mapping.category}</td>
            `;
            tbody.appendChild(row);
        });

        if (mappings.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3" style="text-align: center; color: #64748b;">No mappings found</td>';
            tbody.appendChild(row);
        }
    }

    // Event Listeners
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                console.log('Navigation clicked:', page);
                this.showPage(page);
            });
        });

        // Upload functionality
        this.setupUploadListeners();
        
        // Modal close
        document.getElementById('modalClose').addEventListener('click', () => {
            document.getElementById('confirmModal').style.display = 'none';
        });
        
        document.getElementById('modalCancel').addEventListener('click', () => {
            document.getElementById('confirmModal').style.display = 'none';
        });

        // Categorize page buttons
        document.getElementById('downloadTransactionsBtn').addEventListener('click', () => {
            window.open(`${this.apiBase}/transactions/export/csv`, '_blank');
        });

        document.getElementById('saveAllCategoriesBtn').addEventListener('click', async () => {
            await this.saveAllCategories();
        });

        // Settings page buttons
        document.getElementById('downloadMappingsBtn').addEventListener('click', () => {
            window.open(`${this.apiBase}/categories/mappings/export/csv`, '_blank');
        });

        document.getElementById('resetMappingsBtn').addEventListener('click', () => {
            this.showModal(
                'Reset Mappings',
                'Are you sure you want to reset all category mappings? This action cannot be undone.',
                async () => {
                    try {
                        await this.apiCall('/categories/mappings', { method: 'DELETE' });
                        this.showToast('Mappings reset successfully', 'success');
                        await this.loadSettingsPageData();
                    } catch (error) {
                        this.showToast('Failed to reset mappings', 'error');
                    }
                }
            );
        });

        // Clear data button
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.showModal(
                'Clear All Data',
                'Are you sure you want to clear all transaction data? This action cannot be undone.',
                async () => {
                    try {
                        await this.apiCall('/uploads/clear-data', { method: 'DELETE' });
                        this.showToast('All data cleared successfully', 'success');
                        
                        // Reset frontend state after clearing data
                        this.transactions = [];
                        this.categories = [];
                        this.stats = {};
                        
                        // Clear cached chart data
                        this.lastIncomeExpenseData = null;
                        this.lastCumulativeExpensesData = null;
                        this.lastExpenseGroupsData = null;
                        this.lastExpenseGroupsDeepDiveData = null;
                        
                        // Reset upload status display
                        const uploadStatus = document.getElementById('uploadStatus');
                        if (uploadStatus) {
                            uploadStatus.style.display = 'none';
                            uploadStatus.className = 'upload-status';
                            uploadStatus.innerHTML = '';
                        }
                        
                        // Clear file input
                        const fileInput = document.getElementById('fileInput');
                        if (fileInput) {
                            fileInput.value = '';
                        }
                        
                        // Update all data displays
                        await this.updateStats();
                        await this.loadUploadPageData();
                        
                        // Clear any table displays
                        const uncategorizedTableBody = document.getElementById('uncategorizedTableBody');
                        const categorizedTableBody = document.getElementById('categorizedTableBody');
                        if (uncategorizedTableBody) uncategorizedTableBody.innerHTML = '';
                        if (categorizedTableBody) categorizedTableBody.innerHTML = '';
                        
                        // Clear chart containers
                        const chartContainers = [
                            'incomeExpenseChart',
                            'cumulativeExpensesChart', 
                            'expenseGroupsChart',
                            'expenseGroupsDeepDiveChart'
                        ];
                        chartContainers.forEach(id => {
                            const container = document.getElementById(id);
                            if (container) {
                                container.innerHTML = '';
                            }
                        });
                        
                    } catch (error) {
                        console.error('Failed to clear data:', error);
                        this.showToast('Failed to clear data', 'error');
                    }
                }
            );
        });
    }

    setupUploadListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadStatus = document.getElementById('uploadStatus');

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });
    }

    async handleFileUpload(file) {
        if (!file.name.endsWith('.csv')) {
            this.showToast('Please select a CSV file', 'error');
            return;
        }

        const uploadStatus = document.getElementById('uploadStatus');
        uploadStatus.style.display = 'block';
        uploadStatus.className = 'upload-status';
        uploadStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading file...';

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.apiBase}/uploads/csv`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            
            uploadStatus.className = 'upload-status success';
            uploadStatus.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <strong>Upload successful!</strong><br>
                ${result.message}
            `;

            this.showToast('File uploaded successfully', 'success');
            
            // Automatically apply category mappings after successful upload
            try {
                uploadStatus.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    <strong>Upload successful!</strong><br>
                    Applying category mappings...
                `;
                
                const autoResponse = await this.apiCall('/transactions/auto-categorize', { method: 'POST' });
                
                uploadStatus.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <strong>Upload successful!</strong><br>
                    ${result.message}<br>
                    <small>${autoResponse.message}</small>
                `;
                
            } catch (autoError) {
                console.warn('Auto-categorization failed:', autoError);
                // Don't show error toast for auto-categorization failure since upload was successful
            }
            
            await this.updateStats();
            await this.loadUploadPageData();

        } catch (error) {
            uploadStatus.className = 'upload-status error';
            uploadStatus.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <strong>Upload failed!</strong><br>
                ${error.message}
            `;
            this.showToast('Upload failed', 'error');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing FinanceDashboard...');
    new FinanceDashboard();
});
