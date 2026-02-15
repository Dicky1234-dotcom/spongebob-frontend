// Helper Utility Functions

export function randomDelay(minMs, maxMs) {
    const min = maxMs ? minMs : 1000;
    const max = maxMs || minMs;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max, decimals = 6) {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
}

export function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export async function retry(fn, maxAttempts = 3, delayMs = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
    }
}

export function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

export function calculatePercentage(part, total) {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
}

export function isValidAddress(address, chainType = 'evm') {
    if (chainType === 'evm') {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    } else if (chainType === 'solana') {
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    }
    return false;
}

export function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

export function parseJSON(json, fallback = null) {
    try {
        return JSON.parse(json);
    } catch (error) {
        console.error('JSON parse error:', error);
        return fallback;
    }
}

export function safeStringify(obj, space = 0) {
    try {
        return JSON.stringify(obj, null, space);
    } catch (error) {
        console.error('JSON stringify error:', error);
        return '{}';
    }
}

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
}

export function unique(array) {
    return [...new Set(array)];
}

export function sum(array) {
    return array.reduce((total, num) => total + num, 0);
}

export function average(array) {
    if (array.length === 0) return 0;
    return sum(array) / array.length;
}

export function sortBy(array, key, descending = false) {
    return [...array].sort((a, b) => {
        const aVal = typeof key === 'function' ? key(a) : a[key];
        const bVal = typeof key === 'function' ? key(b) : b[key];
        
        if (aVal < bVal) return descending ? 1 : -1;
        if (aVal > bVal) return descending ? -1 : 1;
        return 0;
    });
}

export function filterBy(array, filters) {
    return array.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
            if (typeof value === 'function') {
                return value(item[key]);
            }
            return item[key] === value;
        });
    });
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

export function createBatch(items, batchSize, callback) {
    const batches = chunkArray(items, batchSize);
    return batches.map(batch => callback(batch));
}

export function memoize(fn) {
    const cache = new Map();
    return function(...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
      }
      
