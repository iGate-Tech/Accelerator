// pglite.js - PGLite worker setup and interface

let pg;

// Shared PGLite worker for cross-tab sync
console.time('PGLite main init');
const worker = new SharedWorker('/pglite-worker.js');
const pendingQueries = new Map();

worker.port.onmessage = (e) => {
  console.log('Main received message from worker:', e.data);
  const { id, result, error, type, settings } = e.data;
  if (type === 'settingsUpdate') {
    // Settings now handled by localStorage
    console.log("Ignoring settingsUpdate, using localStorage");
  } else if (id) {
    console.log('Resolving query id:', id, 'result:', result, 'error:', error);
    const { resolve, reject } = pendingQueries.get(id);
    pendingQueries.delete(id);
    if (error) {
      reject(new Error(error));
    } else {
      resolve(result);
    }
  } else {
    console.warn('Unknown message type:', e.data);
  }
};

// PG-like interface
pg = {
  query: (query, params = []) => {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36);
      pendingQueries.set(id, { resolve, reject });
      worker.port.postMessage({ type: 'query', id, query, params });
    });
  },
  exec: (query) => {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36);
      pendingQueries.set(id, { resolve, reject });
      worker.port.postMessage({ type: 'exec', id, query });
    });
  }
};

// Make pg available globally for other scripts
window.pg = pg;

console.timeEnd('PGLite main init');