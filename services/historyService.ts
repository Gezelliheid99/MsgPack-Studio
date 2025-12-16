import { FileInfo } from '../types';

const DB_NAME = 'MsgPackStudioDB';
const STORE_NAME = 'history';
const VERSION = 1;

export interface HistoryRecord {
  id: string;
  name: string;
  size: number;
  type: string;
  timestamp: number;
  blob: Blob;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const addToHistory = async (file: File) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    // Get all records sorted by timestamp (oldest first)
    const getAllReq = index.getAll();
    
    getAllReq.onsuccess = () => {
        let records = getAllReq.result as HistoryRecord[];
        
        // Check for duplicates (same name, size, type)
        const duplicateIndex = records.findIndex(r => 
            r.name === file.name && 
            r.size === file.size && 
            r.type === (file.type || 'application/x-msgpack')
        );

        if (duplicateIndex !== -1) {
            // Remove duplicate from store
            const duplicate = records[duplicateIndex];
            store.delete(duplicate.id);
            // Remove from local array so we can calculate if we need to prune
            records.splice(duplicateIndex, 1);
        }

        // Keep only latest 20 (pruning oldest)
        // records is sorted oldest -> newest. 
        if (records.length >= 20) {
            // Remove excess items
            const countToRemove = records.length - 19;
            for (let i = 0; i < countToRemove; i++) {
                store.delete(records[i].id);
            }
        }
        
        const record: HistoryRecord = {
          id: generateId(),
          name: file.name,
          size: file.size,
          type: file.type || 'application/x-msgpack',
          timestamp: Date.now(),
          blob: file
        };
        store.add(record);
    };
    
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
      console.error("History error", e);
  }
};

export const getHistoryList = async (): Promise<Omit<HistoryRecord, 'blob'>[]> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const index = store.index('timestamp');
          // 'prev' direction gives newest first
          const request = index.openCursor(null, 'prev'); 
          const results: Omit<HistoryRecord, 'blob'>[] = [];
          
          request.onsuccess = (event) => {
              const cursor = (event.target as IDBRequest).result;
              if (cursor) {
                  // Destructure to exclude the heavy blob from the list view
                  const { blob, ...meta } = cursor.value;
                  results.push(meta);
                  cursor.continue();
              } else {
                  resolve(results);
              }
          };
          request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("Failed to load history list", e);
      return [];
    }
}

export const getHistoryItem = async (id: string): Promise<HistoryRecord | undefined> => {
     const db = await openDB();
     return new Promise((resolve, reject) => {
         const tx = db.transaction(STORE_NAME, 'readonly');
         const store = tx.objectStore(STORE_NAME);
         const request = store.get(id);
         request.onsuccess = () => resolve(request.result);
         request.onerror = () => reject(request.error);
     });
}

export const clearHistory = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};
