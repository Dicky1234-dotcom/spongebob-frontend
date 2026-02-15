// API Client Module
import { showToast } from './utils/ui.js';

class APIClient {
    constructor() {
        this.baseURL = localStorage.getItem('apiURL') || '';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    setBaseURL(url) {
        this.baseURL = url.replace(/\/$/, ''); // Remove trailing slash
        localStorage.setItem('apiURL', this.baseURL);
    }

    getBaseURL() {
        return this.baseURL;
    }

    async request(endpoint, options = {}) {
        if (!this.baseURL) {
            throw new Error('API URL not configured. Please set it in Settings.');
        }

        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = `${options.method || 'GET'}-${url}`;

        // Check cache for GET requests
        if ((!options.method || options.method === 'GET') && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Cache successful GET requests
            if (!options.method || options.method === 'GET') {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            
            // Try to use cache on error
            if (this.cache.has(cacheKey)) {
                console.log('Using cached data due to error');
                return this.cache.get(cacheKey).data;
            }

            throw error;
        }
    }

    async getTestnets() {
        try {
            const data = await this.request('/api/testnets');
            return data.testnets || [];
        } catch (error) {
            showToast('Failed to fetch testnets. Using fallback data.', 'warning');
            return this.getFallbackTestnets();
        }
    }

    async getNewTestnets(completedTestnets = []) {
        try {
            const completed = JSON.stringify(completedTestnets.map(t => t.toLowerCase()));
            const data = await this.request(`/api/testnets/new?completed=${encodeURIComponent(completed)}`);
            return data.testnets || [];
        } catch (error) {
            showToast('Failed to fetch new testnets', 'error');
            return [];
        }
    }

    async checkEligibility(wallets, testnet) {
        try {
            const data = await this.request('/api/check-eligibility', {
                method: 'POST',
                body: JSON.stringify({ wallets, testnet })
            });
            return data;
        } catch (error) {
            showToast('Failed to check eligibility', 'error');
            return { eligible: [], totalEligible: 0, totalAmount: 0 };
        }
    }

    async getClaimStatus(testnet) {
        try {
            const data = await this.request(`/api/claim-status/${encodeURIComponent(testnet)}`);
            return data;
        } catch (error) {
            console.error('Failed to get claim status:', error);
            return { claimLive: false };
        }
    }

    async triggerScrape() {
        try {
            const data = await this.request('/api/scrape-now', {
                method: 'POST'
            });
            showToast('Testnet discovery triggered', 'success');
            return data;
        } catch (error) {
            showToast('Failed to trigger scrape', 'error');
            throw error;
        }
    }

    async healthCheck() {
        try {
            const data = await this.request('/api/health');
            return data;
        } catch (error) {
            return { status: 'unavailable' };
        }
    }

    clearCache() {
        this.cache.clear();
    }

    getFallbackTestnets() {
        return [
            {
                name: "zkSync Era Testnet",
                chain: "zkSync",
                network: "testnet",
                rpc: "https://testnet.era.zksync.dev",
                explorer: "https://goerli.explorer.zksync.io",
                tasks: ["faucet", "swap", "bridge"],
                cost: 0,
                score: 8.5,
                source: "fallback"
            },
            {
                name: "Arbitrum Goerli",
                chain: "Arbitrum",
                network: "testnet",
                rpc: "https://goerli-rollup.arbitrum.io/rpc",
                explorer: "https://goerli.arbiscan.io",
                tasks: ["faucet", "swap", "nft_mint"],
                cost: 0,
                score: 8.2,
                source: "fallback"
            },
            {
                name: "Optimism Goerli",
                chain: "Optimism",
                network: "testnet",
                rpc: "https://goerli.optimism.io",
                explorer: "https://goerli-optimism.etherscan.io",
                tasks: ["faucet", "bridge", "swap"],
                cost: 0,
                score: 8.0,
                source: "fallback"
            },
            {
                name: "Base Goerli",
                chain: "Base",
                network: "testnet",
                rpc: "https://goerli.base.org",
                explorer: "https://goerli.basescan.org",
                tasks: ["faucet", "swap", "nft_mint"],
                cost: 0,
                score: 8.7,
                source: "fallback"
            },
            {
                name: "Scroll Sepolia",
                chain: "Scroll",
                network: "testnet",
                rpc: "https://sepolia-rpc.scroll.io",
                explorer: "https://sepolia.scrollscan.dev",
                tasks: ["faucet", "bridge", "swap"],
                cost: 0,
                score: 8.3,
                source: "fallback"
            }
        ];
    }
}

export default new APIClient();
              
