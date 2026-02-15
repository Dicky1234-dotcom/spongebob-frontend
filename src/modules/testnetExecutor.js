// Testnet Executor Module
import walletManager from './walletManager.js';
import { showToast, logActivity } from './utils/ui.js';
import { randomDelay, shuffleArray } from './utils/helpers.js';

class TestnetExecutor {
    constructor() {
        this.isRunning = false;
        this.stats = {
            totalTasks: 0,
            completed: 0,
            successful: 0,
            failed: 0
        };
    }

    async executeAll(testnets, config = {}) {
        if (this.isRunning) {
            showToast('Automation already running', 'warning');
            return;
        }

        this.isRunning = true;
        this.stats = { totalTasks: 0, completed: 0, successful: 0, failed: 0 };

        try {
            const wallets = walletManager.getWallets();
            if (wallets.length === 0) {
                throw new Error('No wallets available. Please generate wallets first.');
            }

            if (testnets.length === 0) {
                throw new Error('No testnets available to execute.');
            }

            logActivity('🚀 Starting automation...', 'success');
            
            // Randomize testnet order if enabled
            const orderedTestnets = config.randomizeOrder ? shuffleArray([...testnets]) : testnets;

            this.stats.totalTasks = orderedTestnets.length * wallets.length;

            for (const testnet of orderedTestnets) {
                if (!this.isRunning) break;

                logActivity(`📋 Starting testnet: ${testnet.name}`);
                
                await this.executeTestnet(testnet, wallets, config);
                
                // Delay between testnets
                if (config.testnetDelay && this.isRunning) {
                    await randomDelay(config.testnetDelay * 1000);
                }
            }

            if (this.isRunning) {
                logActivity('✅ Automation completed!', 'success');
                showToast(`Completed: ${this.stats.successful}/${this.stats.totalTasks}`, 'success');
            } else {
                logActivity('⏹️ Automation stopped by user', 'warning');
                showToast('Automation stopped', 'warning');
            }

        } catch (error) {
            logActivity(`❌ Error: ${error.message}`, 'error');
            showToast(error.message, 'error');
        } finally {
            this.isRunning = false;
        }
    }

    async executeTestnet(testnet, wallets, config) {
        // Randomize wallet order if enabled
        const orderedWallets = config.randomizeOrder ? shuffleArray([...wallets]) : wallets;

        for (const wallet of orderedWallets) {
            if (!this.isRunning) break;

            // Skip if already completed
            if (wallet.completed.includes(testnet.name)) {
                this.stats.completed++;
                continue;
            }

            try {
                await this.executeWalletTasks(testnet, wallet, config);
                
                // Mark as completed
                await walletManager.markTestnetCompleted(wallet.index, testnet.name);
                
                this.stats.successful++;
                logActivity(`✓ Wallet ${wallet.index + 1}: ${testnet.name} completed`);

            } catch (error) {
                this.stats.failed++;
                logActivity(`✗ Wallet ${wallet.index + 1}: ${error.message}`, 'error');
            }

            this.stats.completed++;
            this.updateProgress();

            // Delay between wallets
            if (config.walletDelay && this.isRunning) {
                await randomDelay(config.walletDelay * 1000);
            }
        }
    }

    async executeWalletTasks(testnet, wallet, config) {
        const tasks = testnet.tasks || ['custom'];

        for (const task of tasks) {
            if (!this.isRunning) break;

            await this.executeTask(task, testnet, wallet, config);
            
            // Small delay between tasks
            await randomDelay(1000, 3000);
        }
    }

    async executeTask(taskType, testnet, wallet, config) {
        switch (taskType) {
            case 'faucet':
                await this.claimFaucet(testnet, wallet);
                break;
            case 'swap':
                await this.executeSwap(testnet, wallet, config);
                break;
            case 'bridge':
                await this.executeBridge(testnet, wallet, config);
                break;
            case 'nft_mint':
                await this.mintNFT(testnet, wallet, config);
                break;
            case 'stake':
                await this.executeStake(testnet, wallet);
                break;
            case 'custom':
                await this.executeCustomTask(testnet, wallet);
                break;
            default:
                console.warn(`Unknown task type: ${taskType}`);
        }
    }

    async claimFaucet(testnet, wallet) {
        logActivity(`💧 Claiming faucet for wallet ${wallet.index + 1}`);
        
        // Simulate faucet claim
        await this.simulateTransaction();
        
        // Random success rate
        if (Math.random() > 0.1) {
            return { success: true };
        } else {
            throw new Error('Faucet claim failed');
        }
    }

    async executeSwap(testnet, wallet, config) {
        logActivity(`🔄 Executing swap for wallet ${wallet.index + 1}`);
        
        // Randomize swap amount if enabled
        const amount = config.randomizeGas ? 
            this.randomAmount(0.001, 0.01) : 0.005;
        
        await this.simulateTransaction();
        
        if (Math.random() > 0.15) {
            return { success: true, amount };
        } else {
            throw new Error('Swap failed');
        }
    }

    async executeBridge(testnet, wallet, config) {
        logActivity(`🌉 Executing bridge for wallet ${wallet.index + 1}`);
        
        const amount = config.randomizeGas ? 
            this.randomAmount(0.001, 0.01) : 0.005;
        
        await this.simulateTransaction();
        
        if (Math.random() > 0.1) {
            return { success: true, amount };
        } else {
            throw new Error('Bridge failed');
        }
    }

    async mintNFT(testnet, wallet, config) {
        logActivity(`🎨 Minting NFT for wallet ${wallet.index + 1}`);
        
        // Randomize mint amount
        const mintCount = config.randomizeOrder ? 
            Math.floor(Math.random() * 3) + 1 : 1;
        
        await this.simulateTransaction();
        
        if (Math.random() > 0.1) {
            return { success: true, minted: mintCount };
        } else {
            throw new Error('NFT mint failed');
        }
    }

    async executeStake(testnet, wallet) {
        logActivity(`💎 Staking for wallet ${wallet.index + 1}`);
        
        await this.simulateTransaction();
        
        if (Math.random() > 0.15) {
            return { success: true };
        } else {
            throw new Error('Stake failed');
        }
    }

    async executeCustomTask(testnet, wallet) {
        logActivity(`⚙️ Executing custom task for wallet ${wallet.index + 1}`);
        
        await this.simulateTransaction();
        
        if (Math.random() > 0.2) {
            return { success: true };
        } else {
            throw new Error('Custom task failed');
        }
    }

    async simulateTransaction() {
        // Simulate variable transaction time
        const delay = Math.random() * 3000 + 2000; // 2-5 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    randomAmount(min, max) {
        return (Math.random() * (max - min) + min).toFixed(6);
    }

    stop() {
        this.isRunning = false;
        logActivity('⏹️ Stopping automation...', 'warning');
    }

    getStats() {
        return this.stats;
    }

    updateProgress() {
        const progressPercent = Math.round((this.stats.completed / this.stats.totalTasks) * 100);
        
        // Update UI
        const statusElement = document.getElementById('execution-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="execution-progress">
                    <p><strong>Progress:</strong> ${this.stats.completed}/${this.stats.totalTasks} (${progressPercent}%)</p>
                    <p><strong>Successful:</strong> ${this.stats.successful}</p>
                    <p><strong>Failed:</strong> ${this.stats.failed}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
            `;
        }
    }
}

export default new TestnetExecutor();
  
