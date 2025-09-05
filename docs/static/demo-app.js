// Demo App - Static Data Simulation
let demoTransactions = [];
let categoryMappings = {};
let availableCategories = [];

// Generate dynamic dates based on current date
function generateDynamicDates() {
    const today = new Date();
    const dates = [];
    
    // Generate dates for the last 6 months
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
        const monthDate = new Date(today);
        monthDate.setMonth(monthDate.getMonth() - monthOffset);
        
        // Generate multiple dates within each month
        const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
        const transactionDays = [1, 2, 3, 5, 7, 10, 12, 15, 17, 18, 20, 22, 25, 28];
        
        transactionDays.forEach(day => {
            if (day <= daysInMonth) {
                const transactionDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
                // Don't include future dates
                if (transactionDate <= today) {
                    dates.push(transactionDate.toISOString().split('T')[0]);
                }
            }
        });
    }
    
    return dates.sort((a, b) => new Date(a) - new Date(b));
}

// Generate transactions with dynamic dates
function generateDynamicTransactions() {
    const dates = generateDynamicDates();
    const transactions = [];
    
    const transactionTemplates = [
        {amount: 3200.00, description: "Salary - Monthly", account: "Checking", payee: "TechCorp Inc", category: "Income", frequency: "monthly", day: 1},
        {amount: -450.00, description: "ETF Investment", account: "Investment", payee: "Vanguard", category: "Investment", frequency: "monthly", day: 2},
        {amount: -1250.00, description: "Rent Payment", account: "Checking", payee: "Property Management LLC", category: "Housing", frequency: "monthly", day: 3},
        {amount: -120.00, description: "Utilities", account: "Checking", payee: "City Electric", category: "Utilities", frequency: "monthly", day: 10},
        {amount: -150.00, description: "Internet Bill", account: "Checking", payee: "Comcast", category: "Utilities", frequency: "monthly", day: 20},
        {amount: -250.00, description: "Car Insurance", account: "Checking", payee: "State Farm", category: "Insurance", frequency: "bimonthly", day: 25}
    ];
    
    const randomTransactions = [
        {amount: -85.40, description: "Grocery Shopping", account: "Checking", payee: "Whole Foods", category: "Groceries"},
        {amount: -95.50, description: "Grocery Shopping", account: "Checking", payee: "Safeway", category: "Groceries"},
        {amount: -78.90, description: "Grocery Shopping", account: "Checking", payee: "Trader Joe's", category: "Groceries"},
        {amount: -45.20, description: "Restaurant Dinner", account: "Credit Card", payee: "The Italian Garden", category: "Dining"},
        {amount: -38.45, description: "Restaurant Dinner", account: "Credit Card", payee: "Pasta Palace", category: "Dining"},
        {amount: -65.80, description: "Restaurant Dinner", account: "Credit Card", payee: "Sushi Zen", category: "Dining"},
        {amount: -32.75, description: "Coffee Shop", account: "Credit Card", payee: "Starbucks", category: "Dining"},
        {amount: -29.50, description: "Coffee Shop", account: "Credit Card", payee: "Local Coffee Co", category: "Dining"},
        {amount: -67.30, description: "Gas Station", account: "Credit Card", payee: "Shell", category: "Transportation"},
        {amount: -71.20, description: "Gas Station", account: "Credit Card", payee: "Chevron", category: "Transportation"},
        {amount: -200.00, description: "Clothing", account: "Credit Card", payee: "J.Crew", category: "Shopping"},
        {amount: -280.00, description: "Shopping", account: "Credit Card", payee: "Target", category: "Shopping"},
        {amount: -180.00, description: "Doctor Visit", account: "Checking", payee: "City Medical", category: "Healthcare"},
        {amount: -300.00, description: "Home Repairs", account: "Credit Card", payee: "Home Depot", category: "Home Maintenance"},
        {amount: -450.00, description: "Flight Tickets", account: "Credit Card", payee: "United Airlines", category: "Travel"},
        {amount: -320.00, description: "Hotel Stay", account: "Credit Card", payee: "Marriott", category: "Travel"},
        {amount: -125.00, description: "Gym Membership", account: "Checking", payee: "FitLife Gym", category: "Health & Fitness"}
    ];
    
    // Add fixed monthly transactions
    dates.forEach(dateStr => {
        const date = new Date(dateStr);
        const day = date.getDate();
        
        transactionTemplates.forEach(template => {
            if (template.frequency === "monthly" && day === template.day) {
                transactions.push({
                    date: dateStr,
                    amount: template.amount,
                    description: template.description,
                    account: template.account,
                    payee: template.payee,
                    category: template.category
                });
            } else if (template.frequency === "bimonthly" && day === template.day && date.getMonth() % 2 === 0) {
                transactions.push({
                    date: dateStr,
                    amount: template.amount,
                    description: template.description,
                    account: template.account,
                    payee: template.payee,
                    category: template.category
                });
            }
        });
        
        // Add random transactions (2-3 per week)
        if (Math.random() > 0.5) {
            // Primary random transaction for the day
            const baseTx = randomTransactions[Math.floor(Math.random() * randomTransactions.length)];
            const baseVariation = 0.8 + (Math.random() * 0.4); // 80% to 120%
            const baseAmount = Math.round(baseTx.amount * baseVariation * 100) / 100;
            transactions.push({
                date: dateStr,
                amount: baseAmount,
                description: baseTx.description,
                account: baseTx.account,
                payee: baseTx.payee,
                category: baseTx.category
            });

            // Additional random transactions to enrich category diversity
            const addCount = Math.random() > 0.35 ? (1 + Math.floor(Math.random() * 3)) : 0; // 0-3 extra
            const usedIdx = new Set();
            for (let i = 0; i < addCount; i++) {
                let idx = Math.floor(Math.random() * randomTransactions.length);
                let guard = 0;
                while (usedIdx.has(idx) && guard < 10) { idx = Math.floor(Math.random() * randomTransactions.length); guard++; }
                usedIdx.add(idx);
                const extraTx = randomTransactions[idx];
                const variation = 0.75 + (Math.random() * 0.5); // 75% - 125%
                const amount = Math.round(extraTx.amount * variation * 100) / 100;
                transactions.push({
                    date: dateStr,
                    amount,
                    description: extraTx.description,
                    account: extraTx.account,
                    payee: extraTx.payee,
                    category: extraTx.category
                });
            }
        }
    }); // end dates.forEach

    return transactions;
}

// Simple async delay helper (was previously injected incorrectly inside another function)
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Show loading spinner
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="spinner"></div> Loading...';
        element.classList.add('loading');
    }
}

// Hide loading spinner
function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('loading');
    }
}

// Simulate data loading
async function loadDemoData() {
    try {
        // Generate dynamic transactions based on current date
        demoTransactions = generateDynamicTransactions();
        
        // Create static categories and mappings (no need for external files)
        availableCategories = [
            "Income", "Housing", "Groceries", "Dining", "Transportation", 
            "Utilities", "Insurance", "Healthcare", "Investment", "Shopping", 
            "Travel", "Home Maintenance", "Health & Fitness", "Entertainment", 
            "Education", "Personal Care", "Gifts & Donations", "Miscellaneous"
        ];
        
        categoryMappings = {
            "Salary - Monthly": "Income",
            "ETF Investment": "Investment",
            "Rent Payment": "Housing",
            "Grocery Shopping": "Groceries",
            "Restaurant Dinner": "Dining",
            "Restaurant Lunch": "Dining",
            "Coffee Shop": "Dining",
            "Utilities": "Utilities",
            "Internet Bill": "Utilities",
            "Phone Bill": "Utilities",
            "Gas Station": "Transportation",
            "Car Insurance": "Insurance",
            "Doctor Visit": "Healthcare",
            "Home Repairs": "Home Maintenance",
            "Flight Tickets": "Travel",
            "Hotel Stay": "Travel",
            "Gym Membership": "Health & Fitness",
            "Clothing": "Shopping",
            "Shopping": "Shopping",
            "Whole Foods": "Groceries",
            "Safeway": "Groceries",
            "Trader Joe's": "Groceries",
            "Starbucks": "Dining",
            "Chipotle": "Dining",
            "Shell": "Transportation",
            "Chevron": "Transportation",
            "Comcast": "Utilities",
            "State Farm": "Insurance",
            "Vanguard": "Investment",
            "TechCorp Inc": "Income",
            "City Electric": "Utilities",
            "Verizon": "Utilities",
            "Target": "Shopping",
            "Home Depot": "Home Maintenance",
            "J.Crew": "Shopping",
            "United Airlines": "Travel",
            "Marriott": "Travel",
            "FitLife Gym": "Health & Fitness",
            "City Medical": "Healthcare"
        };

        // Update UI with loaded data
        updateAnalyticsDashboard();
        
        return true;
    } catch (error) {
        console.error('Error loading demo data:', error);
        return false;
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i> ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize analytics dashboard
function updateAnalyticsDashboard() {
    if (!demoTransactions.length) return;
    const incomeMonths = parseInt(document.getElementById('incomeExpensePeriod')?.value || '6');
    const cumulativeMonths = parseInt(document.getElementById('cumulativeExpensesPeriod')?.value || '3');
    const expenseGroupsMonths = document.getElementById('expenseGroupsPeriod')?.value || '3';
    const deepDivePeriodValue = document.getElementById('expenseGroupsDeepDivePeriod')?.value || '3';
    const deepDiveCategory = document.getElementById('expenseGroupsDeepDiveCategory')?.value || 'all';
    buildDerivedIncomeExpense(incomeMonths);
    buildDerivedCumulativeExpenses(cumulativeMonths);
    buildDerivedExpenseGroups(expenseGroupsMonths);
    buildDerivedExpenseGroupsDeepDive(deepDivePeriodValue, deepDiveCategory);
    renderIncomeExpenseChart();
    renderCumulativeExpensesChart();
    renderExpenseGroupsChart();
    renderExpenseGroupsDeepDiveChart();
    renderTransactionsTable();
    bindAnalyticsSelectorsOnce();
}

// Derived analytics caches (mimic backend API responses)
let derivedIncomeExpense = null;
let derivedCumulativeExpenses = null;
let derivedExpenseGroups = null;
let derivedExpenseGroupsDeepDive = null;

// Category color helpers (mirrors production approach)
function getCategoryColors() {
    return {
        'Living': '#ef4444', 'Transport': '#f59e0b', 'Subscriptions': '#8b5cf6',
        'Investment': '#3b82f6', 'Sports, Wellness, Health': '#10b981', 'Shopping': '#64748b',
        'Groceries': '#06b6d4', 'Eating out, Bars, Social': '#ec4899', 'Other': '#94a3b8'
    };
}

function getCategoryColor(category) {
    const colors = getCategoryColors();
    if (colors[category]) return colors[category];
    // Simple deterministic hash fallback
    let hash = 0; for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
    const palette = Object.values(colors);
    return palette[Math.abs(hash) % palette.length];
}

function buildDerivedIncomeExpense(monthsBack = 6) {
    // Determine month list (earliest first)
    const today = new Date();
    const monthKeys = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const income = Array(monthKeys.length).fill(0);
    const expenses = Array(monthKeys.length).fill(0);
    const investment = Array(monthKeys.length).fill(0);

    demoTransactions.forEach(tx => {
        const d = new Date(tx.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const idx = monthKeys.indexOf(key);
        if (idx === -1) return;
        if (tx.amount > 0) {
            income[idx] += tx.amount;
        } else {
            const amt = Math.abs(tx.amount);
            if ((tx.category || '').toLowerCase() === 'investment') {
                investment[idx] += amt;
            } else {
                expenses[idx] += amt;
            }
        }
    });

    derivedIncomeExpense = { plot_data: { dates: monthKeys, income, expenses, investment } };
}

// Render Income vs Expenses + Investment stacked area EXACTLY like production
function renderIncomeExpenseChart() {
    if (!derivedIncomeExpense) return;
    const plotData = derivedIncomeExpense.plot_data;
    const chartData = [
        {
            x: plotData.dates,
            y: plotData.income,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Income',
            line: { color: '#10b981', width: 0.5 },
            fill: 'tozeroy',
            fillcolor: 'rgba(16, 185, 129, 0.2)',
            hovertemplate: '<b>Income</b><br>Month: %{x}<br>Amount: %{y:.2f}<extra></extra>'
        },
        {
            x: plotData.dates,
            y: plotData.expenses,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Expenses',
            line: { color: '#ec4899', width: 0.5 },
            fill: 'tozeroy',
            fillcolor: 'rgba(236, 72, 153, 0.2)',
            hovertemplate: '<b>Expenses</b><br>Month: %{x}<br>Amount: %{y:.2f}<extra></extra>'
        },
        {
            x: plotData.dates,
            y: plotData.expenses.map((e, i) => e + plotData.investment[i]),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Investment',
            line: { color: '#3b82f6', width: 0.5 },
            fill: 'tonexty',
            fillcolor: 'rgba(59, 130, 246, 0.2)',
            customdata: plotData.investment,
            hovertemplate: '<b>Investment</b><br>Month: %{x}<br>Amount: %{customdata:.2f}<extra></extra>'
        }
    ];

    const container = document.getElementById('incomeExpenseChart') || document.getElementById('income-expense-chart');
    if (!container) return;
    container.innerHTML = '';
    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 500;
    const layout = {
        xaxis: { 
            title: { text: 'Month', standoff: 20 },
            tickangle: -45,
            automargin: true,
            showticklabels: true,
            side: 'bottom'
        },
        yaxis: { 
            title: { text: 'Amount', standoff: 20 },
            automargin: true
        },
        margin: { l: 80, r: 40, t: 60, b: 120 },
        showlegend: true,
        legend: { x: 1, xanchor: 'right', y: 1 },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        width,
        height
    };
    const config = { displayModeBar: true, modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'] };
    setTimeout(() => {
        Plotly.purge(container);
        Plotly.newPlot(container, chartData, layout, config);
        Plotly.Plots.resize(container);
    }, 50);
}

// -------- CUMULATIVE EXPENSES (stacked area) --------
function buildDerivedCumulativeExpenses(monthsBack = 3) {
    const today = new Date();
    const startMonth = new Date(today.getFullYear(), today.getMonth() - (monthsBack - 1), 1);
    const expenseTx = demoTransactions.filter(t => t.amount < 0 && t.category && t.category !== 'Income');
    const allDates = [];
    for (let d = new Date(startMonth); d <= today; d.setDate(d.getDate() + 1)) {
        allDates.push(d.toISOString().split('T')[0]);
    }
    const categories = Array.from(new Set(expenseTx.filter(t => new Date(t.date) >= startMonth && new Date(t.date) <= today).map(t => t.category))).sort();
    const txByCatDate = {};
    expenseTx.forEach(t => {
        const d = new Date(t.date);
        if (d < startMonth || d > today) return;
        const key = `${t.category}__${t.date}`;
        txByCatDate[key] = (txByCatDate[key] || 0) + Math.abs(t.amount);
    });
    const plot_data = {}; categories.forEach(c => plot_data[c] = []);
    allDates.forEach(dateStr => {
        const dateObj = new Date(dateStr);
        const monthStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
        categories.forEach(cat => {
            let cumulative = 0;
            for (let d = new Date(monthStart); d <= dateObj; d.setDate(d.getDate() + 1)) {
                const k = `${cat}__${d.toISOString().split('T')[0]}`;
                if (txByCatDate[k]) cumulative += txByCatDate[k];
            }
            plot_data[cat].push({ date: dateStr, cumulative_amount: Math.round(cumulative * 100) / 100 });
        });
    });
    derivedCumulativeExpenses = { categories, plot_data };
}

function renderCumulativeExpensesChart() {
    if (!derivedCumulativeExpenses) return;
    const traces = [];
    derivedCumulativeExpenses.categories.forEach(cat => {
        const catData = derivedCumulativeExpenses.plot_data[cat];
        const color = getCategoryColor(cat);
        traces.push({
            x: catData.map(d => d.date),
            y: catData.map(d => d.cumulative_amount),
            type: 'scatter', mode: 'lines', name: cat,
            stackgroup: 'expenses', line: { width: 0.5, color }, fill: 'tonexty', fillcolor: color + '33'
        });
    });
    const container = document.getElementById('cumulativeExpensesChart');
    if (!container) return;
    container.innerHTML = '';
    const rect = container.getBoundingClientRect();
    const width = rect.width || 800; const height = rect.height || 500;
    const layout = { xaxis: { title: 'Date', automargin: true, showticklabels: true, side: 'bottom' }, yaxis: { title: 'Amount', automargin: true }, margin: { l: 80, r: 30, t: 60, b: 120 }, hovermode: 'x unified', showlegend: true, legend: { x: 1.02, xanchor: 'left', y: 1 }, width, height };
    const config = { displayModeBar: true, modeBarButtonsToRemove: ['pan2d','lasso2d','select2d'] };
    setTimeout(()=>{ Plotly.purge(container); Plotly.newPlot(container, traces, layout, config); Plotly.Plots.resize(container); },50);
}

// -------- EXPENSE GROUPS (bar) --------
function buildDerivedExpenseGroups(monthsBackStr = '1') {
    const today = new Date();
    let monthsBack = 1;
    if (monthsBackStr === 'all') monthsBack = 12; else monthsBack = parseInt(monthsBackStr || '1');
    const startDate = new Date(today.getFullYear(), today.getMonth() - (monthsBack - 1), 1);
    const expenseTx = demoTransactions.filter(t => t.amount < 0 && t.category !== 'Income');
    const totals = {};
    expenseTx.forEach(t => { const d=new Date(t.date); if (d>=startDate && d<=today){ totals[t.category]=(totals[t.category]||0)+Math.abs(t.amount);} });
    const labels = Object.keys(totals).sort();
    const values = labels.map(l => totals[l]);
    derivedExpenseGroups = { plot_data: { labels, values } };
}

function renderExpenseGroupsChart() {
    if (!derivedExpenseGroups) return;
    const plotData = derivedExpenseGroups.plot_data;
    const consistentColors = plotData.labels.map(label => {
        const color = getCategoryColor(label); const r=parseInt(color.slice(1,3),16); const g=parseInt(color.slice(3,5),16); const b=parseInt(color.slice(5,7),16); return `rgba(${r}, ${g}, ${b}, 0.5)`; });
    const chartData = [{ x: plotData.labels, y: plotData.values, type: 'bar', marker: { color: consistentColors, line: { color: plotData.labels.map(l=>getCategoryColor(l)), width: 0.5 } }, text: plotData.values.map(v=>v.toFixed(2)), textposition: 'auto' }];
    const container = document.getElementById('expenseGroupsChart'); if(!container) return; container.innerHTML=''; const rect=container.getBoundingClientRect(); const width=rect.width||800; const height=rect.height||500; const layout={ xaxis:{ title:'Category', tickangle:-45, automargin:true, showticklabels:true, side:'bottom' }, yaxis:{ title:'Amount', automargin:true }, margin:{ l:80, r:30, t:60, b:120 }, width, height }; const config={ displayModeBar:true, modeBarButtonsToRemove:['pan2d','lasso2d','select2d']}; setTimeout(()=>{ Plotly.purge(container); Plotly.newPlot(container, chartData, layout, config); Plotly.Plots.resize(container); },50);
}

// -------- EXPENSE GROUPS DEEP DIVE (scatter) --------
function buildDerivedExpenseGroupsDeepDive(periodValue = '1', category = 'all') {
    const today = new Date();
    let startDate;
    if (periodValue === 'all') {
        const minDate = demoTransactions.reduce((acc, t) => !acc || new Date(t.date) < acc ? new Date(t.date) : acc, null);
        startDate = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
        const monthsBack = parseInt(periodValue, 10) || 1;
        startDate = new Date(today.getFullYear(), today.getMonth() - (monthsBack - 1), 1);
    }
    let tx = demoTransactions.filter(t => t.amount < 0 && t.category && t.category !== 'Income');
    tx = tx.filter(t => { const d = new Date(t.date); return d >= startDate && d <= today; });
    if (category !== 'all') tx = tx.filter(t => t.category === category);
    const categories = Array.from(new Set(tx.map(t => t.category))).sort();
    const scatter_data = tx.map(t => ({ date: t.date, amount: Math.abs(t.amount), category: t.category, payee: t.payee, description: t.description }));
    const date_range = { start_date: startDate.toISOString().split('T')[0], end_date: today.toISOString().split('T')[0] };
    derivedExpenseGroupsDeepDive = { categories, scatter_data, date_range };
    populateDeepDiveCategories(categories);
}

function populateDeepDiveCategories(categories) {
    const sel = document.getElementById('expenseGroupsDeepDiveCategory');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="all">All Categories</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join('');
    if (current && Array.from(sel.options).some(o => o.value === current)) sel.value = current;
}

function renderExpenseGroupsDeepDiveChart() {
    if (!derivedExpenseGroupsDeepDive) return;
    const categorySelect = document.getElementById('expenseGroupsDeepDiveCategory');
    const selectedCategory = categorySelect ? categorySelect.value : 'all';
    const categorizedData = {};
    derivedExpenseGroupsDeepDive.scatter_data.forEach(p => { if (!categorizedData[p.category]) categorizedData[p.category] = []; categorizedData[p.category].push(p); });
    const traces = [];
    Object.keys(categorizedData).forEach(category => {
        const pts = categorizedData[category];
        const color = getCategoryColor(category);
        traces.push({ x: pts.map(p => p.date), y: pts.map(p => p.amount), mode: 'markers', type: 'scatter', name: category, marker: { color, size: 8, opacity: 0.7 }, text: pts.map(p => `${p.payee}<br>${p.amount}<br>${p.description}`), hovertemplate: '<b>%{text}</b><br>Date: %{x}<br>Amount: %{y}<extra></extra>' });
    });
    const container = document.getElementById('expenseGroupsDeepDiveChart');
    if (!container) return;
    container.innerHTML = '';
    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 500;
    const xaxisConfig = { title: 'Date', type: 'date', automargin: true, showticklabels: true, side: 'bottom', range: [derivedExpenseGroupsDeepDive.date_range.start_date, derivedExpenseGroupsDeepDive.date_range.end_date] };
    const layout = { xaxis: xaxisConfig, yaxis: { title: 'Amount', automargin: true }, margin: { l: 80, r: 30, t: 60, b: 120 }, showlegend: selectedCategory === 'all', legend: { x: 1.02, xanchor: 'left', y: 1 }, hovermode: 'closest', width, height };
    const config = { displayModeBar: true, modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'] };
    setTimeout(() => { Plotly.purge(container); Plotly.newPlot(container, traces, layout, config); Plotly.Plots.resize(container); }, 50);
}

// Bind selectors only once
let analyticsSelectorsBound = false;
function bindAnalyticsSelectorsOnce() {
    if (analyticsSelectorsBound) return;
    analyticsSelectorsBound = true;
    const incomeExpensePeriod = document.getElementById('incomeExpensePeriod');
    incomeExpensePeriod?.addEventListener('change', () => updateAnalyticsDashboard());
    const cumulativeExpensesPeriod = document.getElementById('cumulativeExpensesPeriod');
    cumulativeExpensesPeriod?.addEventListener('change', () => updateAnalyticsDashboard());
    const expenseGroupsPeriod = document.getElementById('expenseGroupsPeriod');
    expenseGroupsPeriod?.addEventListener('change', () => updateAnalyticsDashboard());
    const deepDiveCategory = document.getElementById('expenseGroupsDeepDiveCategory');
    deepDiveCategory?.addEventListener('change', () => updateAnalyticsDashboard());
    const deepDivePeriod = document.getElementById('expenseGroupsDeepDivePeriod');
    deepDivePeriod?.addEventListener('change', () => updateAnalyticsDashboard());
}

// Render Expense Breakdown Chart
function renderExpenseBreakdownChart() {
    const categoryTotals = {};
    
    demoTransactions
        .filter(t => t.amount < 0)
        .forEach(transaction => {
            const category = transaction.category || 'Uncategorized';
            categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(transaction.amount);
        });

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);

    const data = [{
        labels: categories,
        values: amounts,
        type: 'pie',
        hole: 0.4,
        textinfo: 'label+percent',
        textposition: 'outside'
    }];

    const layout = {
        title: 'Expense Breakdown by Category',
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'Inter, sans-serif' }
    };

    // Try multiple possible chart container IDs
    const chartElement = document.getElementById('expenseGroupsChart') || 
                         document.getElementById('expense-breakdown-chart') ||
                         document.getElementById('cumulativeExpensesChart');
    
    if (chartElement) {
        Plotly.newPlot(chartElement, data, layout, {responsive: true});
    }
}

// Render transactions table
function renderTransactionsTable() {
    // Try to find any transactions table in the current view
    const tableBody = document.querySelector('#transactionsTableBody') || 
                     document.querySelector('#transactions-table tbody') ||
                     document.querySelector('.table tbody');
    
    if (!tableBody) return;

    tableBody.innerHTML = '';

    const recentTransactions = demoTransactions
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20);

    recentTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(transaction.date).toLocaleDateString()}</td>
            <td>${transaction.description}</td>
            <td class="${transaction.amount >= 0 ? 'amount-positive' : 'amount-negative'}">
                ${transaction.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}
            </td>
            <td>
                <span class="category-badge ${transaction.category ? 'category-assigned' : 'category-unassigned'}">
                    ${transaction.category || 'Uncategorized'}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// -------- Bank Transactions Table (production mimic) --------
let originalBankTransactions = [];
function renderBankTransactionsTable() {
    const tbody = document.getElementById('bankTransactionsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    originalBankTransactions = demoTransactions.slice().sort((a,b)=> new Date(b.date)-new Date(a.date));
    if (!originalBankTransactions.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No transactions available</td></tr>';
        return;
    }
    originalBankTransactions.forEach(tx => {
        const row = document.createElement('tr');
        const amountClass = tx.amount >= 0 ? 'amount-positive' : 'amount-negative';
        const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(Math.abs(tx.amount));
        row.innerHTML = `
            <td>${tx.date}</td>
            <td>${tx.payee}</td>
            <td class="${amountClass}">${tx.amount >= 0 ? '+' : '-'}${formattedAmount}</td>
            <td><span class="category-badge">${tx.category}</span></td>
            <td>${tx.account}</td>`;
        tbody.appendChild(row);
    });
}

// --- Filter System (simplified production mimic) ---
let bankActiveFilters = {};
function setupBankTableFilters() {
    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-dropdown')) {
            document.querySelectorAll('.filter-menu').forEach(m => m.classList.remove('show','show-above'));
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        }
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const col = btn.dataset.column;
            const menu = document.getElementById(col + 'Filter');
            const isOpen = menu.classList.contains('show');
            document.querySelectorAll('.filter-menu').forEach(m => m.classList.remove('show','show-above'));
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            if (!isOpen) {
                const btnRect = btn.getBoundingClientRect();
                const spaceBelow = window.innerHeight - btnRect.bottom;
                const menuHeight = 350;
                if (spaceBelow < menuHeight && btnRect.top > menuHeight) menu.classList.add('show-above');
                menu.classList.add('show');
                btn.classList.add('active');
            }
        });
    });

    // Populate unique options
    populateFilterOptions();

    // Clear buttons
    document.querySelectorAll('.filter-clear').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const menu = e.target.closest('.filter-menu');
            const column = menu.id.replace('Filter','');
            delete bankActiveFilters[column];
            applyBankFilters();
            menu.classList.remove('show');
        });
    });
}

function populateFilterOptions() {
    const columns = ['payee','category','account'];
    columns.forEach(col => {
        const container = document.getElementById(col + 'Options');
        if (!container) return;
        const values = Array.from(new Set(originalBankTransactions.map(t => (t[col] || '').toString()))).filter(v=>v);
        container.innerHTML = '';
        values.sort().forEach(val => {
            const id = `${col}_${val.replace(/[^a-z0-9]/gi,'_')}`;
            const wrapper = document.createElement('div');
            wrapper.className = 'filter-option';
            wrapper.innerHTML = `<label><input type="checkbox" value="${val}" data-col="${col}"> ${val}</label>`;
            container.appendChild(wrapper);
        });
    });
    // Date (months)
    const dateContainer = document.getElementById('dateOptions');
    if (dateContainer) {
        const months = Array.from(new Set(originalBankTransactions.map(t => t.date.slice(0,7))));
        months.sort().forEach(m => {
            const wrapper = document.createElement('div');
            wrapper.className='filter-option';
            wrapper.innerHTML = `<label><input type="checkbox" value="${m}" data-col="date"> ${m}</label>`;
            dateContainer.appendChild(wrapper);
        });
    }
    // Amount buckets
    const amountContainer = document.getElementById('amountOptions');
    if (amountContainer) {
        const buckets = ['0-100','100-300','300-700','700-1500','1500+'];
        buckets.forEach(b => {
            const wrapper = document.createElement('div');
            wrapper.className='filter-option';
            wrapper.innerHTML = `<label><input type="checkbox" value="${b}" data-col="amount"> ${b}</label>`;
            amountContainer.appendChild(wrapper);
        });
    }
    // Bind change
    document.querySelectorAll('.filter-options input[type=checkbox]').forEach(cb => {
        cb.addEventListener('change', () => {
            const col = cb.dataset.col;
            const selected = Array.from(document.querySelectorAll(`.filter-options input[data-col="${col}"]:checked`)).map(i=>i.value);
            if (selected.length) bankActiveFilters[col] = selected; else delete bankActiveFilters[col];
            applyBankFilters();
        });
    });
}

function applyBankFilters() {
    let filtered = originalBankTransactions.slice();
    Object.entries(bankActiveFilters).forEach(([col, vals]) => {
        if (col === 'amount') {
            filtered = filtered.filter(t => {
                const amt = Math.abs(t.amount);
                return vals.some(r => {
                    if (r === '1500+') return amt >= 1500;
                    const [a,b] = r.split('-').map(Number); return amt >= a && amt < b;
                });
            });
        } else if (col === 'date') {
            filtered = filtered.filter(t => vals.includes(t.date.slice(0,7)));
        } else {
            filtered = filtered.filter(t => vals.includes((t[col]||'')));
        }
    });
    // Re-render body
    const tbody = document.getElementById('bankTransactionsTableBody');
    if (!tbody) return;
    tbody.innerHTML='';
    if (!filtered.length) { tbody.innerHTML='<tr><td colspan="5" class="text-center">No transactions</td></tr>'; return; }
    filtered.forEach(tx => {
        const amountClass = tx.amount >=0? 'amount-positive':'amount-negative';
        const formatted = new Intl.NumberFormat('en-US',{style:'currency',currency:'EUR'}).format(Math.abs(tx.amount));
        const row = document.createElement('tr');
        row.innerHTML = `<td>${tx.date}</td><td>${tx.payee}</td><td class="${amountClass}">${tx.amount>=0?'+':'-'}${formatted}</td><td><span class="category-badge">${tx.category}</span></td><td>${tx.account}</td>`;
        tbody.appendChild(row);
    });
}

// -------- Mappings Table (settings) --------
function renderMappingsTable() {
    const tbody = document.getElementById('mappingsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    // Build mapping rows from categoryMappings splitting into payee/account inference
    const rows = Object.entries(categoryMappings).map(([value, category]) => {
        // Heuristic: if value matches known payees list else account
        const type = /Inc|LLC|Vanguard|Comcast|State Farm|Shell|Chevron|Trader Joe|Safeway|Whole Foods|Starbucks|Marriott|United|Home Depot|Target|J.Crew|FitLife|City Medical/i.test(value) ? 'payee' : 'account';
        return { type, value, category };
    });
    rows.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${m.type}</td><td>${m.value}</td><td>${m.category}</td>`;
        tbody.appendChild(tr);
    });
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#64748b;">No mappings found</td></tr>';
    }
}

// -------- Resize Redraw --------
let resizeBound = false;
function bindResizeRedraw() {
    if (resizeBound) return; resizeBound = true;
    window.addEventListener('resize', () => { setTimeout(()=>{ renderIncomeExpenseChart(); renderCumulativeExpensesChart(); renderExpenseGroupsChart(); renderExpenseGroupsDeepDiveChart(); },150); });
}

// Enhanced toast (production-like)
function showToast(message, type='info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-content"><strong>${type.charAt(0).toUpperCase()+type.slice(1)}</strong><p>${message}</p></div>`;
    container.appendChild(toast);
    setTimeout(()=>{ toast.classList.add('hide'); setTimeout(()=>toast.remove(),400); },4000);
}

// Initialize demo when page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Navigation handlers
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            if (pageId) showPage(pageId);
        });
    });

    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    await delay(500);
    const loaded = await loadDemoData();
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (loaded) showNotification('Demo data loaded successfully!'); else showNotification('Failed to load demo data', 'error');
    // Default landing page set to analytics per request
    showPage('analytics');
});

// Override functions for demo mode
window.showPage = showPage;

// Demo-specific navigation handlers
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });

    // Show selected page
    const selectedPage = document.getElementById(pageId + 'Page');
    if (selectedPage) {
        selectedPage.style.display = 'block';
    }

    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const navLink = document.querySelector(`[data-page="${pageId}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }

    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const titles = {
            'upload': 'Upload (Demo - Disabled)',
            'analytics': 'Analytics Dashboard',
            'categorize': 'Transaction Categorization',
            'settings': 'Settings'
        };
        pageTitle.textContent = titles[pageId] || 'Dashboard';
    }

    // Load page-specific data
    if (pageId === 'analytics') {
        updateAnalyticsDashboard();
        // Ensure bank filters and table are initialized now that table moved into analytics
        renderBankTransactionsTable();
        if (!window.__bankFiltersInit) { setupBankTableFilters(); window.__bankFiltersInit = true; } else { populateFilterOptions(); applyBankFilters(); }
    } else if (pageId === 'categorize') {
        updateCategorizePage();
    } else if (pageId === 'settings') {
        renderMappingsTable();
    }
    bindResizeRedraw();
}

// Update categorize page
function updateCategorizePage() {
    ensureDemoUncategorizedExamples();
    bindCategorizeTabsOnce();
    const uncategorizedBody = document.getElementById('uncategorizedTableBody');
    const categorizedBody = document.getElementById('categorizedTableBody');
    if (!uncategorizedBody || !categorizedBody) return;

    // Split transactions
    const uncategorized = demoTransactions.filter(t => !t.category || t.category === 'Uncategorized');
    const categorized = demoTransactions.filter(t => t.category && t.category !== 'Uncategorized');

    // Badge counts
    const uncategorizedBadge = document.getElementById('uncategorizedBadge');
    if (uncategorizedBadge) uncategorizedBadge.textContent = uncategorized.length;
    const categorizedBadge = document.getElementById('categorizedBadge');
    if (categorizedBadge) categorizedBadge.textContent = categorized.length;

    // Render helper for a row with interactive select (non-persistent)
    function renderRow(tx, isUncategorized) {
        const tr = document.createElement('tr');
        const amountClass = tx.amount >= 0 ? 'amount-positive' : 'amount-negative';
        const categoryOptions = `<option value="">Uncategorized</option>` + availableCategories.map(c => `<option value="${c}" ${tx.category === c ? 'selected' : ''}>${c}</option>`).join('');
        const selectHtml = `<select class="category-select" data-tx-id="${tx.__id}" ${isUncategorized ? '' : ''}>${categoryOptions}</select>`;
        tr.innerHTML = `
            <td>${new Date(tx.date).toLocaleDateString()}</td>
            <td class="${amountClass}">${tx.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
            <td>${tx.description}</td>
            <td>${tx.account}</td>
            <td>${tx.payee}</td>
            <td>${selectHtml}</td>
            ${categorizedBody.contains(tr) ? '<td></td>' : ''}
        `;
        return tr;
    }

    // Assign synthetic IDs for tracking (if not present)
    demoTransactions.forEach((t, idx) => { if (t.__id === undefined) t.__id = idx; });

    // Render uncategorized
    uncategorizedBody.innerHTML = '';
    if (!uncategorized.length) {
        uncategorizedBody.innerHTML = '<tr><td colspan="6" class="text-center">All good – nothing to categorize right now.</td></tr>';
    } else {
        uncategorized.forEach(tx => uncategorizedBody.appendChild(renderRow(tx, true)));
    }

    // Render categorized (show a slice for demo speed if huge)
    categorizedBody.innerHTML = '';
    categorized.slice(0, 200).forEach(tx => categorizedBody.appendChild(renderRow(tx, false)));

    // Bind select change events (simulate change + mark unsaved)
    const saveAllBtn = document.getElementById('saveAllCategoriesBtn');
    document.querySelectorAll('.category-select').forEach(sel => {
        sel.addEventListener('change', () => {
            const txId = parseInt(sel.getAttribute('data-tx-id'), 10);
            const tx = demoTransactions.find(t => t.__id === txId);
            if (tx) {
                tx.category = sel.value || 'Uncategorized';
                if (saveAllBtn) saveAllBtn.style.display = 'inline-flex';
            }
        });
    });

    if (saveAllBtn && !saveAllBtn.__bound) {
        saveAllBtn.__bound = true;
        saveAllBtn.addEventListener('click', () => {
            showNotification('Saving disabled in demo. Changes not persisted.', 'info');
            saveAllBtn.style.display = 'none';
        });
    }
}

// Ensure we have some uncategorized examples for demo feel
function ensureDemoUncategorizedExamples() {
    const uncategorized = demoTransactions.filter(t => !t.category || t.category === 'Uncategorized');
    if (uncategorized.length >= 5) return; // already enough
    const candidates = demoTransactions.filter(t => t.amount < 0 && t.category && t.category !== 'Uncategorized');
    // Randomly pick up to 5 to mark as uncategorized for demo
    shuffleArray(candidates).slice(0, 5 - uncategorized.length).forEach(t => { t._originalCategory = t.category; t.category = 'Uncategorized'; });
}

// Simple shuffle helper
function shuffleArray(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

// Tab binding
let categorizeTabsBound = false;
function bindCategorizeTabsOnce() {
    if (categorizeTabsBound) return; categorizeTabsBound = true;
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            const target = document.getElementById(tab + 'Tab');
            if (target) target.classList.add('active');
        });
    });
}

// Demo file upload handler
function handleDemoFileUpload() {
    showNotification('File upload is disabled in demo mode. Using pre-loaded sample data.', 'info');
}

// Demo category management
function addDemoCategory() {
    showNotification('Category management is read-only in demo mode.', 'info');
}

function deleteDemoCategory() {
    showNotification('Category management is read-only in demo mode.', 'info');
}

function saveDemoMapping() {
    showNotification('Category mappings are read-only in demo mode.', 'info');
}

// Initialize demo when page loads
// (Removed obsolete duplicate DOMContentLoaded block earlier)
