/**
 * Chrome storage utilities for secure data persistence
 */

export interface StorageArea {
  get(keys?: string | string[] | { [key: string]: any }): Promise<{ [key: string]: any }>;
  set(items: { [key: string]: any }): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
  clear(): Promise<void>;
}

class ChromeStorageWrapper implements StorageArea {
  constructor(private storage: chrome.storage.StorageArea) {}

  async get(keys?: string | string[] | { [key: string]: any }): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
      this.storage.get(keys ?? null, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  async set(items: { [key: string]: any }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.storage.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  async remove(keys: string | string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.storage.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.storage.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
}

// Export wrapped Chrome storage areas
export const syncStorage = new ChromeStorageWrapper(chrome.storage.sync);
export const localStorage = new ChromeStorageWrapper(chrome.storage.local);

/**
 * Secure storage utilities for sensitive data like API keys
 */
export class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'delight-ai-key';
  
  /**
   * Simple XOR encryption for API keys (basic obfuscation)
   * Note: This is not cryptographically secure, but provides basic protection
   * against casual inspection of stored data
   */
  private static encrypt(text: string): string {
    const key = this.ENCRYPTION_KEY;
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    
    return btoa(result); // Base64 encode
  }

  private static decrypt(encryptedText: string): string {
    try {
      const decoded = atob(encryptedText); // Base64 decode
      const key = this.ENCRYPTION_KEY;
      let result = '';
      
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }
      
      return result;
    } catch {
      return encryptedText; // Return as-is if decryption fails (backward compatibility)
    }
  }

  static async storeApiKey(provider: string, apiKey: string): Promise<void> {
    const encryptedKey = this.encrypt(apiKey);
    const storageKey = `api_key_${provider}`;
    
    await syncStorage.set({ [storageKey]: encryptedKey });
  }

  static async getApiKey(provider: string): Promise<string | null> {
    const storageKey = `api_key_${provider}`;
    const result = await syncStorage.get(storageKey);
    
    if (!result[storageKey]) {
      return null;
    }
    
    return this.decrypt(result[storageKey]);
  }

  static async removeApiKey(provider: string): Promise<void> {
    const storageKey = `api_key_${provider}`;
    await syncStorage.remove(storageKey);
  }

  static async clearAllApiKeys(): Promise<void> {
    // Get all storage keys and remove API key entries
    const allData = await syncStorage.get();
    const apiKeyKeys = Object.keys(allData).filter(key => key.startsWith('api_key_'));
    
    if (apiKeyKeys.length > 0) {
      await syncStorage.remove(apiKeyKeys);
    }
  }
}

/**
 * Storage event listener for configuration changes
 */
export class StorageEventManager {
  private static listeners: Map<string, ((changes: { [key: string]: chrome.storage.StorageChange }) => void)[]> = new Map();

  static addListener(key: string, callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(callback);

    // Add Chrome storage listener if this is the first listener
    if (this.listeners.size === 1) {
      chrome.storage.onChanged.addListener(this.handleStorageChange.bind(this));
    }
  }

  static removeListener(key: string, callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      const index = keyListeners.indexOf(callback);
      if (index > -1) {
        keyListeners.splice(index, 1);
      }
      
      if (keyListeners.length === 0) {
        this.listeners.delete(key);
      }
    }
  }

  private static handleStorageChange(changes: { [key: string]: chrome.storage.StorageChange }, areaName: string): void {
    if (areaName !== 'sync') return;

    // Notify listeners for specific keys
    Object.keys(changes).forEach(key => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.forEach(callback => callback(changes));
      }
    });

    // Notify listeners for 'all' changes
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      allListeners.forEach(callback => callback(changes));
    }
  }
}