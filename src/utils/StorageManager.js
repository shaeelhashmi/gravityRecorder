const DB_NAME = 'ScreenRecorderDB';
const STORE_CHUNKS = 'chunks';
const STORE_SETTINGS = 'settings';
const DB_VERSION = 2; // Upgraded for settings store

class StorageManager {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject('Error opening IndexedDB');
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_CHUNKS)) {
          db.createObjectStore(STORE_CHUNKS, { autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS);
        }
      };
    });
  }

  async saveChunk(blob) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_CHUNKS], 'readwrite');
      const store = transaction.objectStore(STORE_CHUNKS);
      const request = store.add(blob);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error saving chunk');
    });
  }

  async getAllChunks() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_CHUNKS], 'readonly');
      const store = transaction.objectStore(STORE_CHUNKS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Error retrieving chunks');
    });
  }

  async clearStorage() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_CHUNKS], 'readwrite');
      const store = transaction.objectStore(STORE_CHUNKS);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error clearing storage');
    });
  }

  async setSetting(key, value) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_SETTINGS], 'readwrite');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error saving setting');
    });
  }

  async getSetting(key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_SETTINGS], 'readonly');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Error getting setting');
    });
  }

  async removeSetting(key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_SETTINGS], 'readwrite');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error removing setting');
    });
  }

  async hasUnsavedData() {
    const chunks = await this.getAllChunks();
    return chunks.length > 0;
  }
}

export const storageManager = new StorageManager();
