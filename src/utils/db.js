// IndexedDB Utility
const DB_NAME = 'SpongeBob';
const DB_VERSION = 1;

export async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Wallets store
            if (!db.objectStoreNames.contains('wallets')) {
                const walletStore = db.createObjectStore('wallets', { 
                    keyPath: 'index' 
                });
                walletStore.createIndex('address', 'address', { unique: false });
                walletStore.createIndex('chainType', 'chainType', { unique: false });
            }

            // Settings store
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }

            // History store
            if (!db.objectStoreNames.contains('history')) {
                const historyStore = db.createObjectStore('history', { 
                    keyPath: 'id',
                    autoIncrement: true
                });
                historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                historyStore.createIndex('type', 'type', { unique: false });
            }

            // Testnets cache store
            if (!db.objectStoreNames.contains('testnets')) {
                const testnetStore = db.createObjectStore('testnets', { 
                    keyPath: 'name' 
                });
                testnetStore.createIndex('chain', 'chain', { unique: false });
                testnetStore.createIndex('score', 'score', { unique: false });
            }

            // Completed tasks store
            if (!db.objectStoreNames.contains('completed')) {
                const completedStore = db.createObjectStore('completed', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                completedStore.createIndex('walletIndex', 'walletIndex', { unique: false });
                completedStore.createIndex('testnet', 'testnet', { unique: false });
            }
        };
    });
}

export async function saveSettings(key, value) {
    const db = await openDB();
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    await store.put({ key, value });
    await tx.done;
}

export async function getSettings(key) {
    const db = await openDB();
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const result = await store.get(key);
    return result ? result.value : null;
}

export async function saveHistory(entry) {
    const db = await openDB();
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    await store.add({
        ...entry,
        timestamp: Date.now()
    });
    await tx.done;
}

export async function getHistory(limit = 100) {
    const db = await openDB();
    const tx = db.transaction('history', 'readonly');
    const store = tx.objectStore('history');
    const index = store.index('timestamp');
    
    const entries = [];
    let cursor = await index.openCursor(null, 'prev');
    let count = 0;
    
    while (cursor && count < limit) {
        entries.push(cursor.value);
        count++;
        cursor = await cursor.continue();
    }
    
    return entries;
}

export async function clearAllData() {
    const db = await openDB();
    const stores = ['wallets', 'settings', 'history', 'testnets', 'completed'];
    
    for (const storeName of stores) {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        await store.clear();
        await tx.done;
    }
}

export async function exportAllData() {
    const db = await openDB();
    const stores = ['wallets', 'settings', 'history', 'testnets', 'completed'];
    const exportData = {
        version: DB_VERSION,
        timestamp: Date.now(),
        data: {}
    };
    
    for (const storeName of stores) {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        exportData.data[storeName] = await store.getAll();
        await tx.done;
    }
    
    return exportData;
}

export async function importData(importData) {
    if (!importData || !importData.data) {
        throw new Error('Invalid import data');
    }
    
    const db = await openDB();
    
    for (const [storeName, items] of Object.entries(importData.data)) {
        if (items && items.length > 0) {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            
            // Clear existing data
            await store.clear();
            
            // Import new data
            for (const item of items) {
                await store.add(item);
            }
            
            await tx.done;
        }
    }
                                         }
  
