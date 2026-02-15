// Wallet Manager Module
import { openDB } from './utils/db.js';
import { encrypt, decrypt } from './utils/crypto.js';
import { showToast } from './utils/ui.js';

const WALLET_STORE = 'wallets';

class WalletManager {
    constructor() {
        this.wallets = [];
        this.db = null;
    }

    async init() {
        this.db = await openDB();
        await this.loadWallets();
    }

    async generateWallets(count, chainType = 'evm') {
        if (count < 1 || count > 20000) {
            throw new Error('Wallet count must be between 1 and 20,000');
        }

        const newWallets = [];
        const batchSize = 100;

        for (let i = 0; i < count; i += batchSize) {
            const batch = Math.min(batchSize, count - i);
            const batchWallets = await this._generateBatch(batch, chainType, i);
            newWallets.push(...batchWallets);

            // Update progress
            const progress = Math.round(((i + batch) / count) * 100);
            this._updateProgress(progress);

            // Small delay to prevent UI freeze
            await this._delay(10);
        }

        this.wallets.push(...newWallets);
        await this.saveWallets();
        
        return newWallets;
    }

    async _generateBatch(count, chainType, startIndex) {
        const wallets = [];

        for (let i = 0; i < count; i++) {
            const wallet = await this._generateSingleWallet(chainType, startIndex + i);
            wallets.push(wallet);
        }

        return wallets;
    }

    async _generateSingleWallet(chainType, index) {
        if (chainType === 'evm') {
            return this._generateEVMWallet(index);
        } else if (chainType === 'solana') {
            return this._generateSolanaWallet(index);
        }
        throw new Error('Unsupported chain type');
    }

    _generateEVMWallet(index) {
        // Generate random private key
        const privateKey = this._generateRandomHex(64);
        const address = this._privateKeyToAddress(privateKey);
        const mnemonic = this._generateMnemonic();

        return {
            index: index,
            chainType: 'evm',
            address: address,
            privateKey: privateKey,
            mnemonic: mnemonic,
            timestamp: Date.now(),
            balance: '0',
            completed: []
        };
    }

    _generateSolanaWallet(index) {
        // Simplified Solana wallet generation
        const privateKey = this._generateRandomHex(64);
        const address = this._generateSolanaAddress(privateKey);
        const mnemonic = this._generateMnemonic();

        return {
            index: index,
            chainType: 'solana',
            address: address,
            privateKey: privateKey,
            mnemonic: mnemonic,
            timestamp: Date.now(),
            balance: '0',
            completed: []
        };
    }

    _generateRandomHex(length) {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    _privateKeyToAddress(privateKey) {
        // Simplified address generation (not production-ready)
        // In production, use ethers.js or web3.js
        const hash = this._simpleHash(privateKey);
        return '0x' + hash.substring(0, 40);
    }

    _generateSolanaAddress(privateKey) {
        // Simplified Solana address generation
        const hash = this._simpleHash(privateKey);
        return this._base58Encode(hash.substring(0, 64));
    }

    _simpleHash(input) {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
    }

    _base58Encode(hex) {
        // Simplified base58 encoding
        const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let num = BigInt('0x' + hex);
        let result = '';
        
        while (num > 0) {
            const remainder = num % 58n;
            result = alphabet[Number(remainder)] + result;
            num = num / 58n;
        }
        
        return result || '1';
    }

    _generateMnemonic() {
        const words = [
            'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
            'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid'
        ];
        
        const mnemonic = [];
        for (let i = 0; i < 12; i++) {
            mnemonic.push(words[Math.floor(Math.random() * words.length)]);
        }
        
        return mnemonic.join(' ');
    }

    _updateProgress(progress) {
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressBar && progressText) {
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
        }
    }

    async saveWallets() {
        if (!this.db) return;

        const tx = this.db.transaction(WALLET_STORE, 'readwrite');
        const store = tx.objectStore(WALLET_STORE);

        // Clear existing wallets
        await store.clear();

        // Encrypt and save each wallet
        for (const wallet of this.wallets) {
            const encryptedWallet = {
                ...wallet,
                privateKey: await encrypt(wallet.privateKey),
                mnemonic: await encrypt(wallet.mnemonic)
            };
            await store.add(encryptedWallet);
        }

        await tx.done;
    }

    async loadWallets() {
        if (!this.db) return;

        const tx = this.db.transaction(WALLET_STORE, 'readonly');
        const store = tx.objectStore(WALLET_STORE);
        const encryptedWallets = await store.getAll();

        this.wallets = [];
        for (const encWallet of encryptedWallets) {
            const wallet = {
                ...encWallet,
                privateKey: await decrypt(encWallet.privateKey),
                mnemonic: await decrypt(encWallet.mnemonic)
            };
            this.wallets.push(wallet);
        }
    }

    async exportWallets() {
        const data = {
            version: '1.0.0',
            timestamp: Date.now(),
            wallets: this.wallets.map(w => ({
                ...w,
                privateKey: '***ENCRYPTED***',
                mnemonic: '***ENCRYPTED***'
            }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wallets-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Wallets exported successfully', 'success');
    }

    async deleteAllWallets() {
        if (!confirm('Are you sure you want to delete ALL wallets? This cannot be undone!')) {
            return;
        }

        this.wallets = [];
        await this.saveWallets();
        showToast('All wallets deleted', 'success');
    }

    getWalletCount() {
        return this.wallets.length;
    }

    getWallets() {
        return this.wallets;
    }

    getWalletByIndex(index) {
        return this.wallets.find(w => w.index === index);
    }

    async markTestnetCompleted(walletIndex, testnetName) {
        const wallet = this.getWalletByIndex(walletIndex);
        if (wallet) {
            if (!wallet.completed.includes(testnetName)) {
                wallet.completed.push(testnetName);
                await this.saveWallets();
            }
        }
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new WalletManager();
          
