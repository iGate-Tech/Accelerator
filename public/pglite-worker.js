// pglite-worker.js - Shared worker for cross-tab sync
console.time('PGLite worker init');
import { PGlite } from 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js';
import { live } from 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite/live/index.js';

const pg = await PGlite.create({
  dataDir: 'idb://my-database',
  extensions: { live }
});
console.log('PGLite created with live extension');

// Setup schema if needed for other data
// Settings now handled by localStorage

const clients = new Set();

self.onconnect = (e) => {
  const port = e.ports[0];
  clients.add(port);
  console.log('New client connected, total clients:', clients.size);

  port.onmessage = async (e) => {
    console.log('Worker received message from port:', e.data);
    const { type, id, query, params } = e.data;
    if (type === 'query') {
      console.log('Worker received query:', query, 'params:', params);
      try {
        const result = await pg.query(query, params);
        console.log('Query executed, result:', result);
        port.postMessage({ id, result });
        console.log('Worker sent result to port');
      } catch (error) {
        console.error('Worker query error:', error);
        port.postMessage({ id, error: error.message });
      }
    } else {
      console.warn('Unknown message type in worker:', e.data);
    }
  };

  port.onclose = () => {
    clients.delete(port);
    console.log('Client disconnected, total clients:', clients.size);
  };

  // Settings handled by localStorage
};

  port.onclose = () => {
    clients.delete(port);
  };

  // Send current settings to new client
  pg.query("SELECT * FROM settings", []).then(res => {
    const settings = {};
    res.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    port.postMessage({ type: 'settingsUpdate', settings });
  });
};

// No live query for settings, using localStorage

console.timeEnd('PGLite worker init');