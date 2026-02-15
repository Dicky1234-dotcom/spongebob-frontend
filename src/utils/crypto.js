// Crypto Utility for Wallet Encryption

// Simple encryption using Web Crypto API
// In production, consider using more robust encryption with user password

async function getKey() {
    // Generate or retrieve encryption key
    const keyData = localStorage.getItem('encryptionKey');
    
    if (keyData) {
        const jwk = JSON.parse(keyData);
        return await crypto.subtle.importKey(
            'jwk',
            jwk,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    }
    
    // Generate new key
    const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
    
    // Store key
    const jwk = await crypto.subtle.exportKey('jwk', key);
    localStorage.setItem('encryptionKey', JSON.stringify(jwk));
    
    return key;
}

export async function encrypt(data) {
    if (!data) return data;
    
    try {
        const key = await getKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(data);
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoded
        );
        
        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);
        
        // Convert to base64
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption failed:', error);
        return data; // Fallback to unencrypted
    }
}

export async function decrypt(encryptedData) {
    if (!encryptedData) return encryptedData;
    
    try {
        const key = await getKey();
        
        // Convert from base64
        const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        
        // Extract IV and encrypted data
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encrypted
        );
        
        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        return encryptedData; // Fallback to returning as-is
    }
}

export async function hash(data) {
    const encoded = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateRandomBytes(length) {
    return crypto.getRandomValues(new Uint8Array(length));
}

export async function deriveKey(password, salt) {
    const encoded = new TextEncoder().encode(password);
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoded,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}
