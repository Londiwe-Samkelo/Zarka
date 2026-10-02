// Minimal IndexedDB wrapper. Stores: outbox (waiting transfers), history, settings (language, session, cached rates).
const DB_NAME = "zarka";
const STORES = ["outbox", "history", "settings"];
let dbPromise;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        for (const name of STORES) {
          if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

async function run(storeName, mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = action(tx.objectStore(storeName));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
  });
}

export const idbGetAll = (store) => run(store, "readonly", (s) => s.getAll());
export const idbGet = (store, id) => run(store, "readonly", (s) => s.get(id));
export const idbPut = (store, value) => run(store, "readwrite", (s) => s.put(value));
export const idbDelete = (store, id) => run(store, "readwrite", (s) => s.delete(id));
