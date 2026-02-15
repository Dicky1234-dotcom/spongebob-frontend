// Custom Task Parser Module
import { showToast } from './utils/ui.js';

class TaskParser {
    constructor() {
        this.taskPatterns = {
            faucet: /faucet|claim.*token|get.*test.*token|request.*token/i,
            swap: /swap|trade|exchange|uniswap|dex/i,
            bridge: /bridge|transfer.*chain|cross.*chain|move.*to/i,
            nft_mint: /mint.*nft|create.*nft|nft.*mint|mint.*collection/i,
            stake: /stake|staking|deposit.*stake|lock.*token/i,
            vote: /vote|govern|proposal/i,
            provide_liquidity: /liquidity|add.*liquidity|lp.*pool|provide.*pool/i
        };

        this.chainPatterns = {
            'ethereum': /ethereum|eth|goerli|sepolia/i,
            'polygon': /polygon|matic/i,
            'arbitrum': /arbitrum|arb/i,
            'optimism': /optimism|op/i,
            'base': /base/i,
            'zksync': /zksync|zk.*sync/i,
            'scroll': /scroll/i,
            'linea': /linea/i,
            'starknet': /starknet|stark/i,
            'solana': /solana|sol/i
        };
    }

    parseInput(input) {
        const testnet = {
            name: this.extractProjectName(input),
            chain: this.extractChain(input),
            network: 'testnet',
            tasks: this.extractTasks(input),
            instructions: input,
            rpc: this.extractRPC(input),
            contractAddresses: this.extractContractAddresses(input),
            links: this.extractLinks(input),
            cost: 0,
            source: 'custom',
            discovered: new Date().toISOString()
        };

        return testnet;
    }

    extractProjectName(input) {
        // Try to find project name from common patterns
        const lines = input.split('\n');
        
        // Look for title-like lines (short, capitalized)
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 3 && trimmed.length < 50 && /^[A-Z]/.test(trimmed)) {
                // Check if it's not a URL or instruction
                if (!trimmed.includes('http') && !trimmed.includes('.') && !trimmed.includes('://')) {
                    return trimmed;
                }
            }
        }

        // Try to extract from URL
        const urlMatch = input.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9-]+)\./);
        if (urlMatch) {
            return this.capitalizeFirst(urlMatch[1]);
        }

        // Default fallback
        return 'Custom Testnet';
    }

    extractChain(input) {
        const lowerInput = input.toLowerCase();
        
        for (const [chain, pattern] of Object.entries(this.chainPatterns)) {
            if (pattern.test(lowerInput)) {
                return this.capitalizeFirst(chain);
            }
        }
        
        return 'Unknown';
    }

    extractTasks(input) {
        const tasks = [];
        const lowerInput = input.toLowerCase();

        for (const [taskType, pattern] of Object.entries(this.taskPatterns)) {
            if (pattern.test(lowerInput)) {
                tasks.push(taskType);
            }
        }

        // If no specific tasks found, mark as custom
        if (tasks.length === 0) {
            tasks.push('custom');
        }

        // Remove duplicates
        return [...new Set(tasks)];
    }

    extractRPC(input) {
        // Look for RPC URLs
        const rpcPattern = /https?:\/\/[^\s]+\.(?:rpc|infura|alchemy|quicknode)[^\s]*/gi;
        const matches = input.match(rpcPattern);
        
        if (matches && matches.length > 0) {
            return matches[0];
        }

        return null;
    }

    extractContractAddresses(input) {
        // Extract Ethereum-style addresses
        const addressPattern = /0x[a-fA-F0-9]{40}/g;
        const addresses = input.match(addressPattern);
        
        return addresses ? [...new Set(addresses)] : [];
    }

    extractLinks(input) {
        // Extract all URLs
        const urlPattern = /https?:\/\/[^\s]+/gi;
        const urls = input.match(urlPattern);
        
        return urls ? [...new Set(urls)] : [];
    }

    async parseFromURL(url) {
        try {
            showToast('Fetching testnet information...', 'info');
            
            // Note: CORS will likely block this in production
            // This is a simplified version
            const response = await fetch(url);
            const html = await response.text();
            
            return this.parseInput(html);
        } catch (error) {
            showToast('Failed to fetch URL. Please paste the content manually.', 'error');
            throw error;
        }
    }

    validateTestnet(testnet) {
        if (!testnet.name || testnet.name === 'Custom Testnet') {
            return {
                valid: false,
                error: 'Could not identify project name. Please add it manually.'
            };
        }

        if (testnet.tasks.length === 0 || (testnet.tasks.length === 1 && testnet.tasks[0] === 'custom')) {
            return {
                valid: true,
                warning: 'No specific tasks identified. Will be marked as custom task.'
            };
        }

        return { valid: true };
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Parse structured data formats
    parseStructuredData(data) {
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                // Not JSON, treat as plain text
                return this.parseInput(data);
            }
        }

        // If it's already an object with testnet data
        if (data.name && data.tasks) {
            return {
                ...data,
                source: 'custom',
                discovered: new Date().toISOString()
            };
        }

        // Try to parse as text
        return this.parseInput(JSON.stringify(data));
    }
}

export default new TaskParser();
          
