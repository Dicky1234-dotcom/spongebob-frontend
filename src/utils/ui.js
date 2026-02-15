// UI Utility Functions

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

export function logActivity(message, type = 'info') {
    const activityLog = document.getElementById('activity-log');
    if (!activityLog) return;

    const item = document.createElement('div');
    item.className = 'activity-item';
    
    const time = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let icon = '•';
    if (type === 'success') icon = '✓';
    else if (type === 'error') icon = '✗';
    else if (type === 'warning') icon = '⚠';

    item.innerHTML = `
        <span class="activity-time">${time}</span>
        <span class="activity-text">${icon} ${message}</span>
    `;

    activityLog.insertBefore(item, activityLog.firstChild);

    // Keep only last 50 items
    while (activityLog.children.length > 50) {
        activityLog.removeChild(activityLog.lastChild);
    }

    // Auto scroll to top
    activityLog.scrollTop = 0;
}

export function updateStats(stats) {
    const elements = {
        'total-wallets': stats.totalWallets || 0,
        'active-testnets': stats.activeTestnets || 0,
        'completed-tasks': stats.completedTasks || 0,
        'bot-status': stats.botStatus || 'IDLE'
    };

    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

export function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

export function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.classList.contains('light-mode') ? 'dark' : 'light';
    
    if (currentTheme === 'light') {
        root.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        root.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
    }
}

export function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light-mode');
    }
}

export function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to nav tab
    const navTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (navTab) {
        navTab.classList.add('active');
    }
}

export function renderWalletList(wallets) {
    const container = document.getElementById('wallet-list');
    const countDisplay = document.getElementById('wallet-count-display');
    
    if (!container) return;

    countDisplay.textContent = wallets.length;

    if (wallets.length === 0) {
        container.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-secondary);">No wallets generated yet.</p>';
        return;
    }

    container.innerHTML = wallets.slice(0, 100).map(wallet => `
        <div class="wallet-item">
            <div class="wallet-index">#${wallet.index + 1}</div>
            <div class="wallet-address">${wallet.address}</div>
            <button class="wallet-actions-btn" data-address="${wallet.address}" title="Copy">
                📋
            </button>
        </div>
    `).join('');

    // Add click handlers for copy buttons
    container.querySelectorAll('.wallet-actions-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const address = btn.dataset.address;
            navigator.clipboard.writeText(address);
            showToast('Address copied!', 'success');
        });
    });

    if (wallets.length > 100) {
        const moreInfo = document.createElement('p');
        moreInfo.style.padding = '1rem';
        moreInfo.style.textAlign = 'center';
        moreInfo.style.color = 'var(--text-secondary)';
        moreInfo.textContent = `Showing first 100 of ${wallets.length} wallets`;
        container.appendChild(moreInfo);
    }
}

export function renderTestnetList(testnets, filter = {}) {
    const container = document.getElementById('testnet-list');
    if (!container) return;

    let filtered = testnets;

    // Apply search filter
    if (filter.search) {
        const search = filter.search.toLowerCase();
        filtered = filtered.filter(t => 
            t.name.toLowerCase().includes(search) ||
            t.chain.toLowerCase().includes(search)
        );
    }

    // Apply chain filter
    if (filter.chain && filter.chain !== 'all') {
        filtered = filtered.filter(t => 
            t.chain.toLowerCase() === filter.chain.toLowerCase()
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-secondary);">No testnets found.</p>';
        return;
    }

    container.innerHTML = filtered.map(testnet => `
        <div class="testnet-card" data-testnet="${testnet.name}">
            <div class="testnet-header">
                <div>
                    <div class="testnet-name">${testnet.name}</div>
                    <span class="testnet-chain">${testnet.chain}</span>
                </div>
                <div class="testnet-score">${testnet.score || 'N/A'}</div>
            </div>
            <div class="testnet-tasks">
                ${testnet.tasks.map(task => `<span class="task-badge">${task}</span>`).join('')}
            </div>
            <div class="testnet-actions">
                <button class="btn btn-secondary btn-sm execute-testnet" data-testnet="${testnet.name}">
                    Execute
                </button>
            </div>
        </div>
    `).join('');
}

export function showProgress(show = true) {
    const progressBar = document.getElementById('wallet-progress');
    if (progressBar) {
        if (show) {
            progressBar.classList.remove('hidden');
        } else {
            progressBar.classList.add('hidden');
        }
    }
}

export function updateProgress(percent) {
    const progressFill = document.querySelector('#wallet-progress .progress-fill');
    const progressText = document.querySelector('#wallet-progress .progress-text');
    
    if (progressFill) {
        progressFill.style.width = `${percent}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${percent}%`;
    }
}

export function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

export function truncateAddress(address, start = 6, end = 4) {
    if (!address || address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
          }
