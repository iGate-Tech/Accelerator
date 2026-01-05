class Node {
  constructor(id, type, data = {}, computedFn = null) {
    this.id = id;
    this.type = type;
    this.data = data;
    this.listeners = [];
    this.computedFn = computedFn;
  }

  updateData(newData) {
    Object.assign(this.data, newData);
    if (this.computedFn) {
      this.data.computed = this.computedFn(this.data);
    }
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  notify(payload) {
    this.listeners.forEach(callback => callback(payload));
  }
}

class Edge {
  constructor(fromNodeId, toNodeId, condition = () => true, transform = (fromData, toData) => toData) {
    this.fromNodeId = fromNodeId;
    this.toNodeId = toNodeId;
    this.condition = condition;
    this.transform = transform;
  }
}

class ReactiveGraph {
  constructor(dbName = 'reactiveGraph') {
    this.dbName = dbName;
    this.nodes = new Map();
    this.edges = [];
    this.eventListeners = new Map();
    this.storage = { nodes: new Map(), edges: [], meta: new Map() };
  }

  async initDB() {
    // Server: in-memory storage
    return Promise.resolve();
  }

  async saveToDB() {
    // Server: save to in-memory
    this.storage.nodes = new Map(Array.from(this.nodes.entries()).map(([id, node]) => [id, { id: node.id, type: node.type, data: node.data, computedFn: node.computedFn?.toString() }]));
    this.storage.edges = [...this.edges];
    this.storage.meta.set('version', 1);
  }

  async loadFromDB() {
    // Server: load from in-memory
    this.storage.nodes.forEach(n => {
      const computedFn = n.computedFn ? new Function('return ' + n.computedFn)() : null;
      this.nodes.set(n.id, new Node(n.id, n.type, n.data, computedFn));
    });
    this.edges = [...this.storage.edges];
    return Promise.resolve();
  }

  addNode(node) {
    this.nodes.set(node.id, node);
    this.emit('node-added', { nodeId: node.id });
  }

  addEdge(edge) {
    this.edges.push(edge);
    this.emit('edge-added', edge);
  }

  removeNode(id) {
    this.nodes.delete(id);
    this.edges = this.edges.filter(e => e.fromNodeId !== id && e.toNodeId !== id);
    this.emit('node-removed', { nodeId: id });
  }

  updateNodeData(id, newData) {
    const node = this.nodes.get(id);
    if (node) {
      node.updateData(newData);
      node.notify({ type: 'data-updated', data: node.data });
      this.propagate(id);
      this.emit('node-updated', { nodeId: id, data: node.data });
    }
  }

  propagate(fromId) {
    const fromNode = this.nodes.get(fromId);
    const outgoing = this.edges.filter(e => e.fromNodeId === fromId);
    outgoing.forEach(edge => {
      const toNode = this.nodes.get(edge.toNodeId);
      if (toNode && edge.condition(toNode.data)) {
        const transformed = edge.transform(fromNode.data, toNode.data);
        toNode.updateData(transformed);
        toNode.notify({ type: 'propagated', data: toNode.data });
        this.emit('propagation', { fromId, toId: edge.toNodeId, data: toNode.data });
        this.propagate(edge.toNodeId);
      }
    });
  }

  emit(eventType, payload) {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(callback => callback(payload));
  }

  on(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(callback);
  }

  off(eventType, callback) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      this.eventListeners.set(eventType, listeners.filter(l => l !== callback));
    }
  }

  validateGraph() {
    const visited = new Set();
    const recStack = new Set();

    const hasCycle = (nodeId) => {
      if (recStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      visited.add(nodeId);
      recStack.add(nodeId);
      const outgoing = this.edges.filter(e => e.fromNodeId === nodeId);
      for (const edge of outgoing) {
        if (hasCycle(edge.toNodeId)) return true;
      }
      recStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (hasCycle(nodeId)) return false;
    }
    return true;
  }

  serializeGraph() {
    return {
      nodes: Array.from(this.nodes.values()).map(n => ({ id: n.id, type: n.type, data: n.data, computedFn: n.computedFn?.toString() })),
      edges: this.edges
    };
  }

  deserializeGraph(data) {
    data.nodes.forEach(n => {
      const computedFn = n.computedFn ? new Function('return ' + n.computedFn)() : null;
      this.nodes.set(n.id, new Node(n.id, n.type, n.data, computedFn));
    });
    this.edges = data.edges;
  }
}

module.exports = { Node, Edge, ReactiveGraph };