// pglite-worker.js - Shared worker for PGLite cross-tab sync
importScripts('https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js');
importScripts('https://cdn.jsdelivr.net/npm/@electric-sql/pglite/live/index.js');

const pg = new PGlite({
  dataDir: 'idb://my-database',
  extensions: { live }
});

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
    } else if (type === 'exec') {
      console.log('Worker received exec:', query);
      try {
        await pg.exec(query);
        port.postMessage({ id, result: null });
      } catch (error) {
        console.error('Worker exec error:', error);
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
};