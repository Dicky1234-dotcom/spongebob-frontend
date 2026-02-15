// Cascade Funding Module
import walletManager from './walletManager.js';
import { showToast, logActivity } from './utils/ui.js';
import { randomDelay } from './utils/helpers.js';

class CascadeFunding {
    constructor() {
        this.isRunning = false;
    }

    async fundForward(amount, gasBuffer = 0.001) {
        if (this.isRunning) {
            showToast('Funding already in progress', 'warning');
            return;
        }

        const wallets = walletManager.getWallets();
        if (wallets.length < 2) {
            showToast('Need at least 2 wallets for cascade funding', 'error');
            return;
        }

        this.isRunning = true;
        logActivity('🔼 Starting forward cascade funding...');

        try {
            // Fund first wallet (user needs to do this manually)
            logActivity('💰 Please fund the first wallet manually');
            showToast('Fund wallet #1 with testnet tokens to start', 'warning');

            // Simulate cascade from wallet to wallet
            for (let i = 0; i < wallets.length - 1; i++) {
                if (!this.isRunning) break;

                const fromWallet = wallets[i];
                const toWallet = wallets[i + 1];

                logActivity(`📤 Funding wallet ${i + 2} from wallet ${i + 1}`);

                try {
                    // Simulate funding transaction
                    await this.simulateFunding(fromWallet, toWallet, amount, gasBuffer);
                    
                    // Random delay to avoid detection
                    await randomDelay(2000, 8000);
                    
                    logActivity(`✓ Wallet ${i + 2} funded successfully`);
                    
                } catch (error) {
                    logActivity(`✗ Failed to fund wallet ${i + 2}: ${error.message}`, 'error');
                    throw error;
                }
            }

            logActivity('✅ Forward cascade completed!', 'success');
            showToast('Forward funding completed', 'success');

        } catch (error) {
            showToast(`Funding failed: ${error.message}`, 'error');
        } finally {
            this.isRunning = false;
        }
    }

    async fundReverse(destinationAddress) {
        if (this.isRunning) {
            showToast('Funding already in progress', 'warning');
            return;
        }

        const wallets = walletManager.getWallets();
        if (wallets.length < 1) {
            showToast('No wallets available', 'error');
            return;
        }

        if (!destinationAddress) {
            showToast('Please provide a destination address', 'error');
            return;
        }

        this.isRunning = true;
        logActivity('🔽 Starting reverse cascade funding...');

        try {
            // Start from the last wallet
            for (let i = wallets.length - 1; i >= 0; i--) {
                if (!this.isRunning) break;

                const fromWallet = wallets[i];
                const toAddress = i > 0 ? wallets[i - 1].address : destinationAddress;

                logActivity(`📤 Sending from wallet ${i + 1} to ${i > 0 ? `wallet ${i}` : 'destination'}`);

                try {
                    // Simulate reverse funding
                    await this.simulateReverseFunding(fromWallet, toAddress);
                    
                    // Random delay
                    await randomDelay(2000, 8000);
                    
                    logActivity(`✓ Wallet ${i + 1} funds sent successfully`);
                    
                } catch (error) {
                    logActivity(`✗ Failed to send from wallet ${i + 1}: ${error.message}`, 'error');
                    // Continue with other wallets even if one fails
                }
            }

            logActivity('✅ Reverse cascade completed!', 'success');
            showToast('Reverse funding completed', 'success');

        } catch (error) {
            showToast(`Reverse funding failed: ${error.message}`, 'error');
        } finally {
            this.isRunning = false;
        }
    }

    async simulateFunding(fromWallet, toWallet, amount, gasBuffer) {
        // Simulate blockchain transaction delay
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

        // Simulate random failures (10% chance)
        if (Math.random() < 0.1) {
            throw new Error('Transaction failed: insufficient gas');
        }

        // Update wallet balances (simulated)
        const amountToSend = parseFloat(amount) - parseFloat(gasBuffer);
        fromWallet.balance = (parseFloat(fromWallet.balance || 0) - parseFloat(amount)).toFixed(6);
        toWallet.balance = (parseFloat(toWallet.balance || 0) + amountToSend).toFixed(6);

        return {
            from: fromWallet.address,
            to: toWallet.address,
            amount: amountToSend,
            txHash: this.generateMockTxHash()
        };
    }

    async simulateReverseFunding(fromWallet, toAddress) {
        // Simulate blockchain transaction delay
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

        // Simulate random failures (5% chance for reverse - usually more reliable)
        if (Math.random() < 0.05) {
            throw new Error('Transaction failed: network congestion');
        }

        // Get balance and send all except gas
        const balance = parseFloat(fromWallet.balance || 0);
        const gasReserve = 0.001;
        const amountToSend = Math.max(0, balance - gasReserve);

        if (amountToSend <= 0) {
            throw new Error('Insufficient balance to send');
        }

        fromWallet.balance = gasReserve.toFixed(6);

        return {
            from: fromWallet.address,
            to: toAddress,
            amount: amountToSend,
            txHash: this.generateMockTxHash()
        };
    }

    generateMockTxHash() {
        const chars = '0123456789abcdef';
        let hash = '0x';
        for (let i = 0; i < 64; i++) {
            hash += chars[Math.floor(Math.random() * chars.length)];
        }
        return hash;
    }

    stop() {
        this.isRunning = false;
        logActivity('⏹️ Stopping cascade funding...', 'warning');
    }
}

export default new CascadeFunding();
                                                
