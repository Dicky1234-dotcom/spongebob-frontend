// Main Application
import walletManager from './modules/walletManager.js';
import apiClient from './modules/apiClient.js';
import testnetExecutor from './modules/testnetExecutor.js';
import cascadeFunding from './modules/cascadeFunding.js';
import taskParser from './modules/taskParser.js';
import { 
    showToast, 
    logActivity, 
    updateStats, 
    loadTheme, 
    toggleTheme, 
    switchTab,
    renderWalletList,
    renderTestnetList,
    showModal,
    hideModal,
    showProgress,
    updateProgress
} from './utils/ui.js';
import { exportAllData, importData, clearAllData } from './utils/db.js';
import { debounce } from './utils/helpers.js';

class App {
    constructor() {
        this.testnets = [];
        this.automationRunning = false;
    }

    async init() {
        console.log('🚀 Initializing SpongeBob...');
        
        // Load theme
        loadTheme();
        
        // Initialize modules
        await walletManager.init();
        
        // Load saved API URL
        const savedApiUrl = localStorage.getItem('apiURL');
        if (savedApiUrl) {
            document.getElementById('api-url').value = savedApiUrl;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load testnets
        await this.loadTestnets();
        
        // Update UI
        this.updateDashboard();
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            logActivity('✅ System initialized successfully', 'success');
        }, 1000);
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            toggleTheme();
            showToast('Theme changed', 'success');
        });

        // Refresh testnets
        document.getElementById('refresh-testnets').addEventListener('click', async () => {
            await this.loadTestnets(true);
        });

        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                switchTab(tab.dataset.tab);
            });
        });

        // Wallet generation
        document.getElementById('generate-wallets').addEventListener('click', async () => {
            await this.generateWallets();
        });

        // Wallet actions
        document.getElementById('export-wallets').addEventListener('click', async () => {
            await walletManager.exportWallets();
        });

        document.getElementById('delete-wallets').addEventListener('click', async () => {
            await walletManager.deleteAllWallets();
            this.updateDashboard();
            renderWalletList([]);
        });

        document.getElementById('fund-forward').addEventListener('click', async () => {
            await this.cascadeFundForward();
        });

        document.getElementById('fund-reverse').addEventListener('click', async () => {
            await this.cascadeFundReverse();
        });

        // Testnet filters
        const searchInput = document.getElementById('testnet-search');
        const chainFilter = document.getElementById('chain-filter');

        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                this.filterTestnets();
            }, 300));
        }

        if (chainFilter) {
            chainFilter.addEventListener('change', () => {
                this.filterTestnets();
            });
        }

        // Add custom testnet
        document.getElementById('add-custom-testnet').addEventListener('click', () => {
            showModal('custom-task-modal');
        });

        // Parse custom task
        document.getElementById('parse-custom-task').addEventListener('click', async () => {
            await this.parseCustomTask();
        });

        // Close modal buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                hideModal('custom-task-modal');
            });
        });

        // Automation controls
        document.getElementById('start-automation').addEventListener('click', async () => {
            await this.startAutomation();
        });

        document.getElementById('stop-automation').addEventListener('click', () => {
            this.stopAutomation();
        });

        // Settings
        document.getElementById('save-api-url').addEventListener('click', () => {
            this.saveApiUrl();
        });

        document.getElementById('export-all').addEventListener('click', async () => {
            await this.exportAllData();
        });

        document.getElementById('clear-data').addEventListener('click', async () => {
            await this.clearAllData();
        });
    }

    async generateWallets() {
        const count = parseInt(document.getElementById('wallet-count').value);
        const chainType = document.getElementById('wallet-chain').value;

        if (isNaN(count) || count < 1 || count > 20000) {
            showToast('Please enter a number between 1 and 20,000', 'error');
            return;
        }

        if (walletManager.getWalletCount() > 0) {
            if (!confirm(`You have ${walletManager.getWalletCount()} wallets. Generate ${count} more?`)) {
                return;
            }
        }

        showProgress(true);
        updateProgress(0);

        try {
            logActivity(`🔨 Generating ${count} ${chainType.toUpperCase()} wallets...`);
            
            await walletManager.generateWallets(count, chainType);
            
            showProgress(false);
            showToast(`${count} wallets generated successfully!`, 'success');
            logActivity(`✅ Generated ${count} wallets`, 'success');
            
            this.updateDashboard();
            renderWalletList(walletManager.getWallets());
            
        } catch (error) {
            showProgress(false);
            showToast(`Error: ${error.message}`, 'error');
            logActivity(`❌ Wallet generation failed: ${error.message}`, 'error');
        }
    }

    async cascadeFundForward() {
        const amount = prompt('Enter amount to cascade (leave gas buffer):');
        if (!amount) return;

        logActivity('🔼 Starting forward cascade...');
        await cascadeFunding.fundForward(parseFloat(amount));
        this.updateDashboard();
    }

    async cascadeFundReverse() {
        const destination = prompt('Enter destination address:');
        if (!destination) return;

        logActivity('🔽 Starting reverse cascade...');
        await cascadeFunding.fundReverse(destination);
        this.updateDashboard();
    }

    async loadTestnets(force = false) {
        try {
            if (force) {
                logActivity('🔍 Fetching latest testnets...');
                await apiClient.triggerScrape();
            }

            this.testnets = await apiClient.getTestnets();
            renderTestnetList(this.testnets);
            
            this.updateDashboard();
            
            if (!force) {
                logActivity(`📡 Loaded ${this.testnets.length} testnets`);
            }
        } catch (error) {
            showToast('Using cached testnet data', 'warning');
            this.testnets = apiClient.getFallbackTestnets();
            renderTestnetList(this.testnets);
        }
    }

    filterTestnets() {
        const search = document.getElementById('testnet-search').value;
        const chain = document.getElementById('chain-filter').value;
        
        renderTestnetList(this.testnets, { search, chain });
    }

    async parseCustomTask() {
        const input = document.getElementById('custom-task-input').value.trim();
        
        if (!input) {
            showToast('Please enter testnet instructions', 'error');
            return;
        }

        try {
            logActivity('🔍 Parsing custom testnet...');
            
            const testnet = taskParser.parseInput(input);
            const validation = taskParser.validateTestnet(testnet);
            
            if (!validation.valid) {
                showToast(validation.error, 'error');
                return;
            }

            if (validation.warning) {
                showToast(validation.warning, 'warning');
            }

            // Add to testnets list
            this.testnets.unshift(testnet);
            renderTestnetList(this.testnets);
            
            hideModal('custom-task-modal');
            document.getElementById('custom-task-input').value = '';
            
            showToast('Custom testnet added successfully!', 'success');
            logActivity(`✅ Added custom testnet: ${testnet.name}`, 'success');
            
            // Switch to testnets tab
            switchTab('testnets');
            
        } catch (error) {
            showToast(`Parse error: ${error.message}`, 'error');
            logActivity(`❌ Failed to parse: ${error.message}`, 'error');
        }
    }

    async startAutomation() {
        if (walletManager.getWalletCount() === 0) {
            showToast('Please generate wallets first', 'error');
            return;
        }

        if (this.testnets.length === 0) {
            showToast('No testnets available', 'error');
            return;
        }

        const mode = document.getElementById('automation-mode').value;
        const walletDelay = parseInt(document.getElementById('wallet-delay').value);
        const testnetDelay = parseInt(document.getElementById('testnet-delay').value);
        const randomizeOrder = document.getElementById('randomize-order').checked;
        const randomizeGas = document.getElementById('randomize-gas').checked;

        let testnetsToRun = [];

        if (mode === 'new') {
            const completed = walletManager.getWallets()
                .flatMap(w => w.completed)
                .filter((v, i, a) => a.indexOf(v) === i);
            
            testnetsToRun = this.testnets.filter(t => !completed.includes(t.name));
            
            if (testnetsToRun.length === 0) {
                showToast('All testnets completed! 🎉', 'success');
                return;
            }
        } else if (mode === 'all') {
            testnetsToRun = this.testnets;
        } else {
            // Selected mode - for now, use all
            testnetsToRun = this.testnets;
        }

        this.automationRunning = true;
        
        // Update UI
        document.getElementById('start-automation').classList.add('hidden');
        document.getElementById('stop-automation').classList.remove('hidden');
        document.getElementById('bot-status').textContent = 'RUNNING';
        
        logActivity('🚀 Automation started', 'success');

        try {
            await testnetExecutor.executeAll(testnetsToRun, {
                walletDelay,
                testnetDelay,
                randomizeOrder,
                randomizeGas
            });
        } finally {
            this.automationRunning = false;
            document.getElementById('start-automation').classList.remove('hidden');
            document.getElementById('stop-automation').classList.add('hidden');
            document.getElementById('bot-status').textContent = 'IDLE';
            
            this.updateDashboard();
        }
    }

    stopAutomation() {
        testnetExecutor.stop();
        cascadeFunding.stop();
        
        this.automationRunning = false;
        document.getElementById('start-automation').classList.remove('hidden');
        document.getElementById('stop-automation').classList.add('hidden');
        document.getElementById('bot-status').textContent = 'IDLE';
    }

    saveApiUrl() {
        const url = document.getElementById('api-url').value.trim();
        
        if (!url) {
            showToast('Please enter an API URL', 'error');
            return;
        }

        try {
            new URL(url); // Validate URL
            apiClient.setBaseURL(url);
            showToast('API URL saved successfully', 'success');
            logActivity('✅ API URL configured');
        } catch (error) {
            showToast('Invalid URL format', 'error');
        }
    }

    async exportAllData() {
        try {
            const data = await exportAllData();
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `testnet-bot-backup-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showToast('Data exported successfully', 'success');
        } catch (error) {
            showToast('Export failed', 'error');
        }
    }

    async clearAllData() {
        if (!confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
            return;
        }

        if (!confirm('This will delete all wallets, settings, and history. Continue?')) {
            return;
        }

        try {
            await clearAllData();
            localStorage.clear();
            
            showToast('All data cleared', 'success');
            logActivity('🗑️ All data cleared');
            
            // Reload page
            setTimeout(() => location.reload(), 1500);
        } catch (error) {
            showToast('Failed to clear data', 'error');
        }
    }

    updateDashboard() {
        const wallets = walletManager.getWallets();
        const completedTasks = wallets.reduce((sum, w) => sum + w.completed.length, 0);
        
        updateStats({
            totalWallets: wallets.length,
            activeTestnets: this.testnets.length,
            completedTasks: completedTasks,
            botStatus: this.automationRunning ? 'RUNNING' : 'IDLE'
        });

        // Update wallet list if on wallets tab
        const walletsTab = document.getElementById('wallets-tab');
        if (walletsTab && walletsTab.classList.contains('active')) {
            renderWalletList(wallets);
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    const app = new App();
    app.init();
  }
              
