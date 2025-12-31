import EventEmitter from "./index16.mjs";
import match from "./index17.mjs";
import modify from "./index18.mjs";
import isEqual from "./index19.mjs";
import randomId from "./index20.mjs";
import deepClone from "./index21.mjs";
import serializeValue from "./index22.mjs";
import createSignal from "./index23.mjs";
import Cursor from "./index24.mjs";
import getIndexInfo from "./index25.mjs";
import { createExternalIndex } from "./index15.mjs";
import { default as default2 } from "./index15.mjs";
function hasPendingUpdates(pendingUpdates) {
  return pendingUpdates.added.length > 0 || pendingUpdates.modified.length > 0 || pendingUpdates.removed.length > 0;
}
function applyUpdates(currentItems, { added, modified, removed }) {
  const items = currentItems.slice();
  added.forEach((item) => {
    items.push(item);
  });
  modified.forEach((item) => {
    const index = items.findIndex(({ id }) => id === item.id);
    if (index === -1)
      return;
    items[index] = item;
  });
  removed.forEach((item) => {
    const index = items.findIndex(({ id }) => id === item.id);
    if (index === -1)
      return;
    items.splice(index, 1);
  });
  return items;
}
class Collection extends EventEmitter {
  static batch(callback) {
    Collection.batchOperationInProgress = true;
    Collection.collections.reduce((memo, collection) => () => collection.batch(() => memo()), callback)();
    Collection.batchOperationInProgress = false;
  }
  constructor(options) {
    var _a, _b, _c, _d;
    super();
    this.persistenceAdapter = null;
    this.indexProviders = [];
    this.indicesOutdated = false;
    this.idIndex = /* @__PURE__ */ new Map();
    this.batchOperationInProgress = false;
    this.isDisposed = false;
    this.postBatchCallbacks = /* @__PURE__ */ new Set();
    Collection.collections.push(this);
    this.options = Object.assign({ memory: [] }, options);
    this.debugMode = (_a = this.options.enableDebugMode) !== null && _a !== void 0 ? _a : Collection.debugMode;
    this.indexProviders = [
      createExternalIndex("id", this.idIndex),
      ...this.options.indices || []
    ];
    this.rebuildIndices();
    this.isPullingSignal = createSignal((_b = this.options.reactivity) === null || _b === void 0 ? void 0 : _b.create(), !!(options === null || options === void 0 ? void 0 : options.persistence));
    this.isPushingSignal = createSignal((_c = this.options.reactivity) === null || _c === void 0 ? void 0 : _c.create(), false);
    this.on("persistence.pullStarted", () => {
      this.isPullingSignal.set(true);
    });
    this.on("persistence.pullCompleted", () => {
      this.isPullingSignal.set(false);
    });
    this.on("persistence.pushStarted", () => {
      this.isPushingSignal.set(true);
    });
    this.on("persistence.pushCompleted", () => {
      this.isPushingSignal.set(false);
    });
    this.persistenceAdapter = (_d = this.options.persistence) !== null && _d !== void 0 ? _d : null;
    if (this.persistenceAdapter) {
      let ongoingSaves = 0;
      let isInitialized = false;
      const pendingUpdates = { added: [], modified: [], removed: [] };
      const loadPersistentData = async (data) => {
        if (!this.persistenceAdapter)
          throw new Error("Persistence adapter not found");
        this.emit("persistence.pullStarted");
        const { items, changes } = data !== null && data !== void 0 ? data : await this.persistenceAdapter.load();
        if (items) {
          if (ongoingSaves > 0)
            return;
          this.memory().splice(0, this.memoryArray().length, ...items);
          this.idIndex.clear();
          this.memory().map((item, index) => {
            this.idIndex.set(serializeValue(item.id), /* @__PURE__ */ new Set([index]));
          });
        } else if (changes) {
          changes.added.forEach((item) => {
            const index = this.memory().findIndex((doc) => doc.id === item.id);
            if (index >= 0) {
              this.memory().splice(index, 1, item);
              return;
            }
            this.memory().push(item);
            const itemIndex = this.memory().findIndex((doc) => doc === item);
            this.idIndex.set(serializeValue(item.id), /* @__PURE__ */ new Set([itemIndex]));
          });
          changes.modified.forEach((item) => {
            const index = this.memory().findIndex((doc) => doc.id === item.id);
            if (index === -1)
              throw new Error("Cannot resolve index for item");
            this.memory().splice(index, 1, item);
          });
          changes.removed.forEach((item) => {
            const index = this.memory().findIndex((doc) => doc.id === item.id);
            if (index === -1)
              throw new Error("Cannot resolve index for item");
            this.memory().splice(index, 1);
          });
        }
        this.rebuildIndices();
        this.emit("persistence.received");
        setTimeout(() => this.emit("persistence.pullCompleted"), 0);
      };
      const saveQueue = {
        added: [],
        modified: [],
        removed: []
      };
      let isFlushing = false;
      const flushQueue = () => {
        if (!this.persistenceAdapter)
          throw new Error("Persistence adapter not found");
        if (ongoingSaves <= 0)
          this.emit("persistence.pushStarted");
        if (isFlushing)
          return;
        if (!hasPendingUpdates(saveQueue))
          return;
        isFlushing = true;
        ongoingSaves += 1;
        const currentItems = this.memoryArray();
        const changes = Object.assign({}, saveQueue);
        saveQueue.added = [];
        saveQueue.modified = [];
        saveQueue.removed = [];
        this.persistenceAdapter.save(currentItems, changes).then(() => {
          this.emit("persistence.transmitted");
        }).catch((error) => {
          this.emit("persistence.error", error instanceof Error ? error : new Error(error));
        }).finally(() => {
          ongoingSaves -= 1;
          isFlushing = false;
          flushQueue();
          if (ongoingSaves <= 0)
            this.emit("persistence.pushCompleted");
        });
      };
      this.on("added", (item) => {
        if (!isInitialized) {
          pendingUpdates.added.push(item);
          return;
        }
        saveQueue.added.push(item);
        flushQueue();
      });
      this.on("changed", (item) => {
        if (!isInitialized) {
          pendingUpdates.modified.push(item);
          return;
        }
        saveQueue.modified.push(item);
        flushQueue();
      });
      this.on("removed", (item) => {
        if (!isInitialized) {
          pendingUpdates.removed.push(item);
          return;
        }
        saveQueue.removed.push(item);
        flushQueue();
      });
      this.persistenceAdapter.register((data) => loadPersistentData(data)).then(async () => {
        if (!this.persistenceAdapter)
          throw new Error("Persistence adapter not found");
        let currentItems = this.memoryArray();
        await loadPersistentData();
        while (hasPendingUpdates(pendingUpdates)) {
          const added = pendingUpdates.added.splice(0);
          const modified = pendingUpdates.modified.splice(0);
          const removed = pendingUpdates.removed.splice(0);
          currentItems = applyUpdates(this.memoryArray(), { added, modified, removed });
          await this.persistenceAdapter.save(currentItems, { added, modified, removed }).then(() => {
            this.emit("persistence.transmitted");
          });
        }
        await loadPersistentData();
        isInitialized = true;
        setTimeout(() => this.emit("persistence.init"), 0);
      }).catch((error) => {
        this.emit("persistence.error", error instanceof Error ? error : new Error(error));
      });
    }
  }
  isPulling() {
    var _a;
    return (_a = this.isPullingSignal.get()) !== null && _a !== void 0 ? _a : false;
  }
  isPushing() {
    var _a;
    return (_a = this.isPushingSignal.get()) !== null && _a !== void 0 ? _a : false;
  }
  isLoading() {
    const isPulling = this.isPulling();
    const isPushing = this.isPushing();
    return isPulling || isPushing;
  }
  getDebugMode() {
    return this.debugMode;
  }
  setDebugMode(enable) {
    this.debugMode = enable;
  }
  profile(fn, measureFunction) {
    if (!this.debugMode)
      return fn();
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    measureFunction(endTime - startTime);
    return result;
  }
  executeInDebugMode(fn) {
    if (!this.debugMode)
      return;
    const callstack = new Error().stack || "";
    fn(callstack);
  }
  rebuildIndices() {
    this.indicesOutdated = true;
    if (this.batchOperationInProgress)
      return;
    this.rebuildAllIndices();
  }
  rebuildAllIndices() {
    this.idIndex.clear();
    this.memory().map((item, index) => {
      this.idIndex.set(serializeValue(item.id), /* @__PURE__ */ new Set([index]));
    });
    this.indexProviders.forEach((index) => index.rebuild(this.memoryArray()));
    this.indicesOutdated = false;
  }
  getIndexInfo(selector) {
    if (selector != null && Object.keys(selector).length === 1 && "id" in selector && typeof selector.id !== "object") {
      return {
        matched: true,
        positions: Array.from(this.idIndex.get(serializeValue(selector.id)) || []),
        optimizedSelector: {}
      };
    }
    if (selector == null || this.indicesOutdated) {
      return {
        matched: false,
        positions: [],
        optimizedSelector: {}
      };
    }
    return getIndexInfo(this.indexProviders, selector);
  }
  getItemAndIndex(selector) {
    const memory = this.memoryArray();
    const indexInfo = this.getIndexInfo(selector);
    const items = indexInfo.matched ? indexInfo.positions.map((index2) => memory[index2]) : memory;
    const item = items.find((doc) => match(doc, selector));
    const index = indexInfo.matched && indexInfo.positions.find((itemIndex) => memory[itemIndex] === item) || memory.findIndex((doc) => doc === item);
    if (item == null)
      return { item: null, index: -1 };
    if (index === -1)
      throw new Error("Cannot resolve index for item");
    return { item, index };
  }
  deleteFromIdIndex(id, index) {
    this.idIndex.delete(serializeValue(id));
    if (!this.batchOperationInProgress)
      return;
    this.idIndex.forEach(([currenIndex], key) => {
      if (currenIndex > index) {
        this.idIndex.set(key, /* @__PURE__ */ new Set([currenIndex - 1]));
      }
    });
  }
  memory() {
    return this.options.memory;
  }
  memoryArray() {
    return this.memory().map((item) => item);
  }
  transform(item) {
    if (!this.options.transform)
      return item;
    return this.options.transform(item);
  }
  getItems(selector) {
    return this.profile(() => {
      const indexInfo = this.getIndexInfo(selector);
      const matchItems = (item) => {
        if (indexInfo.optimizedSelector == null)
          return true;
        if (Object.keys(indexInfo.optimizedSelector).length <= 0)
          return true;
        const matches = match(item, indexInfo.optimizedSelector);
        return matches;
      };
      if (!indexInfo.matched)
        return this.memory().filter(matchItems);
      const memory = this.memoryArray();
      const items = indexInfo.positions.map((index) => memory[index]);
      this.emit("getItems", selector);
      return items.filter(matchItems);
    }, (measuredTime) => this.executeInDebugMode((callstack) => this.emit("_debug.getItems", callstack, selector, measuredTime)));
  }
  /**
   * Disposes the collection, runs the dispose method of the persistence adapter
   * and clears all internal data structures.
   */
  async dispose() {
    var _a;
    if ((_a = this.persistenceAdapter) === null || _a === void 0 ? void 0 : _a.unregister)
      await this.persistenceAdapter.unregister();
    this.persistenceAdapter = null;
    this.memory().map(() => this.memory().pop());
    this.idIndex.clear();
    this.indexProviders = [];
    this.isDisposed = true;
  }
  find(selector, options) {
    if (this.isDisposed)
      throw new Error("Collection is disposed");
    if (selector !== void 0 && (!selector || typeof selector !== "object"))
      throw new Error("Invalid selector");
    const cursor = new Cursor(() => this.getItems(selector), Object.assign(Object.assign({ reactive: this.options.reactivity }, options), { transform: this.transform.bind(this), bindEvents: (requery) => {
      const handleRequery = () => {
        if (this.batchOperationInProgress) {
          this.postBatchCallbacks.add(requery);
          return;
        }
        requery();
      };
      this.addListener("persistence.received", handleRequery);
      this.addListener("added", handleRequery);
      this.addListener("changed", handleRequery);
      this.addListener("removed", handleRequery);
      this.emit("observer.created", selector, options);
      return () => {
        this.removeListener("persistence.received", handleRequery);
        this.removeListener("added", handleRequery);
        this.removeListener("changed", handleRequery);
        this.removeListener("removed", handleRequery);
        this.emit("observer.disposed", selector, options);
      };
    } }));
    this.emit("find", selector, options, cursor);
    this.executeInDebugMode((callstack) => this.emit("_debug.find", callstack, selector, options, cursor));
    return cursor;
  }
  findOne(selector, options) {
    if (this.isDisposed)
      throw new Error("Collection is disposed");
    const cursor = this.find(selector, Object.assign({ limit: 1 }, options));
    const returnValue = cursor.fetch()[0] || void 0;
    this.emit("findOne", selector, options, returnValue);
    this.executeInDebugMode((callstack) => this.emit("_debug.findOne", callstack, selector, options, returnValue));
    return returnValue;
  }
  batch(callback) {
    this.batchOperationInProgress = true;
    callback();
    this.batchOperationInProgress = false;
    this.rebuildAllIndices();
    this.postBatchCallbacks.forEach((cb) => cb());
    this.postBatchCallbacks.clear();
  }
  insert(item) {
    if (this.isDisposed)
      throw new Error("Collection is disposed");
    if (!item)
      throw new Error("Invalid item");
    const newItem = Object.assign({ id: randomId() }, item);
    if (this.idIndex.has(serializeValue(newItem.id)))
      throw new Error("Item with same id already exists");
    this.memory().push(newItem);
    const itemIndex = this.memory().findIndex((doc) => doc === newItem);
    this.idIndex.set(serializeValue(newItem.id), /* @__PURE__ */ new Set([itemIndex]));
    this.rebuildIndices();
    this.emit("added", newItem);
    this.emit("insert", newItem);
    this.executeInDebugMode((callstack) => this.emit("_debug.insert", callstack, newItem));
    return newItem.id;
  }
  insertMany(items) {
    if (this.isDisposed)
      throw new Error("Collection is disposed");
    if (!items)
      throw new Error("Invalid items");
    if (items.length === 0) {
      return [];
    }
    const ids = [];
    this.batch(() => {
      items.forEach((item) => {
        ids.push(this.insert(item));
      });
    });
    return ids;
  }
  updateOne(selector, modifier) {
    if (this.isDisposed)
      throw new Error("Collection is disposed");
    if (!selector)
      throw new Error("Invalid selector");
    if (!modifier)
      throw new Error("Invalid modifier");
    const { item, index } = this.getItemAndIndex(selector);
    if (item == null)
      return 0;
    const modifiedItem = modify(deepClone(item), modifier);
    const existingItem = this.findOne({ id: modifiedItem.id }, { reactive: false });
    if (!isEqual(existingItem, Object.assign(Object.assign({}, existingItem), { id: modifiedItem.id })))
      throw new Error("Item with same id already exists");
    this.memory().splice(index, 1, modifiedItem);
    this.rebuildIndices();
    this.emit("changed", modifiedItem, modifier);
    this.emit("updateOne", selector, modifier);
    this.executeInDebugMode((callstack) => this.emit("_debug.updateOne", callstack, selector, modifier));
    return 1;
  }
  updateMany(selector, modifier) {
    if (this.isDisposed)
      throw new Error("Collection is disposed");
    if (!selector)
      throw new Error("Invalid selector");
    if (!modifier)
      throw new Error("Invalid modifier");
    const items = this.getItems(selector);
    const modifiedItems = [];
    items.forEach((item) => {
      const { index } = this.getItemAndIndex({ id: item.id });
      if (index === -1)
        throw new Error("Cannot resolve index for item");
      const modifiedItem = modify(deepClone(item), modifier);
      this.memory().splice(index, 1, modifiedItem);
      modifiedItems.push(modifiedItem);
    });
    this.rebuildIndices();
    modifiedItems.forEach((modifiedItem) => {
      this.emit("changed", modifiedItem, modifier);
    });
    this.emit("updateMany", selector, modifier);
    this.executeInDebugMode((callstack) => this.emit("_debug.updateMany", callstack, selector, modifier));
    return modifiedItems.length;
  }
  removeOne(selector) {
    if (this.isDisposed)
      throw new Error("Collection is disposed");
    if (!selector)
      throw new Error("Invalid selector");
    const { item, index } = this.getItemAndIndex(selector);
    if (item != null) {
      this.memory().splice(index, 1);
      this.deleteFromIdIndex(item.id, index);
      this.rebuildIndices();
      this.emit("removed", item);
    }
    this.emit("removeOne", selector);
    this.executeInDebugMode((callstack) => this.emit("_debug.removeOne", callstack, selector));
    return item == null ? 0 : 1;
  }
  removeMany(selector) {
    if (this.isDisposed)
      throw new Error("Collection is disposed");
    if (!selector)
      throw new Error("Invalid selector");
    const items = this.getItems(selector);
    items.forEach((item) => {
      const index = this.memory().findIndex((doc) => doc === item);
      if (index === -1)
        throw new Error("Cannot resolve index for item");
      this.memory().splice(index, 1);
      this.deleteFromIdIndex(item.id, index);
      this.rebuildIndices();
    });
    items.forEach((item) => {
      this.emit("removed", item);
    });
    this.emit("removeMany", selector);
    this.executeInDebugMode((callstack) => this.emit("_debug.removeMany", callstack, selector));
    return items.length;
  }
}
Collection.collections = [];
Collection.debugMode = false;
Collection.batchOperationInProgress = false;
Collection.enableDebugMode = () => {
  Collection.debugMode = true;
  Collection.collections.forEach((collection) => {
    collection.setDebugMode(true);
  });
};
export {
  default2 as createIndex,
  Collection as default
};
