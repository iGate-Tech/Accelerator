import Collection from "./index2.mjs";
import debounce from "./index26.mjs";
import PromiseQueue from "./index27.mjs";
import createLocalStorageAdapter from "./index6.mjs";
import randomId from "./index20.mjs";
import isEqual from "./index19.mjs";
import sync from "./index28.mjs";
class SyncManager {
  /**
   * @param options Collection options
   * @param options.pull Function to pull data from remote source.
   * @param options.push Function to push data to remote source.
   * @param [options.registerRemoteChange] Function to register a callback for remote changes.
   * @param [options.id] Unique identifier for this sync manager. Only nessesary if you have multiple sync managers.
   * @param [options.persistenceAdapter] Persistence adapter to use for storing changes, snapshots and sync operations.
   * @param [options.reactivity] Reactivity adapter to use for reactivity.
   * @param [options.onError] Function to handle errors that occur async during syncing.
   */
  constructor(options) {
    var _a, _b;
    this.collections = /* @__PURE__ */ new Map();
    this.remoteChanges = [];
    this.syncQueues = /* @__PURE__ */ new Map();
    this.isDisposed = false;
    this.instanceId = randomId();
    this.deboucedPush = debounce((name) => {
      this.pushChanges(name).catch(() => {
      });
    }, 100);
    this.options = options;
    const id = (_a = this.options.id) !== null && _a !== void 0 ? _a : "default-sync-manager";
    const { reactivity } = this.options;
    let changesErrorHandler = () => {
    };
    let snapshotsErrorHandler = () => {
    };
    let syncOperationsErrorHandler = () => {
    };
    const persistenceAdapter = (_b = options.persistenceAdapter) !== null && _b !== void 0 ? _b : createLocalStorageAdapter;
    const changesPersistenceAdapter = persistenceAdapter(`${id}-changes`, (handler) => {
      changesErrorHandler = handler;
    });
    const snapshotsPersistenceAdapter = persistenceAdapter(`${id}-snapshots`, (handler) => {
      snapshotsErrorHandler = handler;
    });
    const syncOperationsPersistenceAdapter = persistenceAdapter(`${id}-sync-operations`, (handler) => {
      syncOperationsErrorHandler = handler;
    });
    this.changes = new Collection({
      persistence: changesPersistenceAdapter,
      reactivity
    });
    this.snapshots = new Collection({
      persistence: snapshotsPersistenceAdapter,
      reactivity
    });
    this.syncOperations = new Collection({
      persistence: syncOperationsPersistenceAdapter,
      reactivity
    });
    this.changes.on("persistence.error", (error) => changesErrorHandler(error));
    this.snapshots.on("persistence.error", (error) => snapshotsErrorHandler(error));
    this.syncOperations.on("persistence.error", (error) => syncOperationsErrorHandler(error));
    this.persistenceReady = Promise.all([
      new Promise((resolve, reject) => {
        this.syncOperations.once("persistence.error", reject);
        this.syncOperations.once("persistence.init", resolve);
      }),
      new Promise((resolve, reject) => {
        this.changes.once("persistence.error", reject);
        this.changes.once("persistence.init", resolve);
      }),
      new Promise((resolve, reject) => {
        this.snapshots.once("persistence.error", reject);
        this.snapshots.once("persistence.init", resolve);
      })
    ]).then(() => {
    });
    this.changes.setMaxListeners(1e3);
    this.snapshots.setMaxListeners(1e3);
    this.syncOperations.setMaxListeners(1e3);
  }
  getSyncQueue(name) {
    if (this.syncQueues.get(name) == null) {
      this.syncQueues.set(name, new PromiseQueue());
    }
    return this.syncQueues.get(name);
  }
  /**
   * Clears all internal data structures
   */
  async dispose() {
    this.collections.clear();
    this.syncQueues.clear();
    this.remoteChanges.splice(0, this.remoteChanges.length);
    await Promise.all([
      this.changes.dispose(),
      this.snapshots.dispose(),
      this.syncOperations.dispose()
    ]);
    this.isDisposed = true;
  }
  /**
   * Gets a collection with it's options by name
   * @param name Name of the collection
   * @throws Will throw an error if the name wasn't found
   * @returns Tuple of collection and options
   */
  getCollection(name) {
    const entry = this.collections.get(name);
    if (entry == null)
      throw new Error(`Collection with id '${name}' not found`);
    return entry;
  }
  /**
   * Adds a collection to the sync manager.
   * @param collection Collection to add
   * @param options Options for the collection. The object needs at least a `name` property.
   * @param options.name Unique name of the collection
   */
  addCollection(collection, options) {
    if (this.isDisposed)
      throw new Error("SyncManager is disposed");
    if (this.options.registerRemoteChange) {
      this.options.registerRemoteChange(options, async (data) => {
        if (data == null) {
          await this.sync(options.name);
        } else {
          const syncTime = Date.now();
          const syncId = this.syncOperations.insert({
            start: syncTime,
            collectionName: options.name,
            instanceId: this.instanceId,
            status: "active"
          });
          await this.syncWithData(options.name, data).then(() => {
            this.syncOperations.removeMany({
              id: { $ne: syncId },
              collectionName: options.name,
              $or: [
                { end: { $lte: syncTime } },
                { status: "active" }
              ]
            });
            this.syncOperations.updateOne({ id: syncId }, {
              $set: { status: "done", end: Date.now() }
            });
          }).catch((error) => {
            if (this.options.onError)
              this.options.onError(options, error);
            this.syncOperations.updateOne({ id: syncId }, {
              $set: { status: "error", end: Date.now(), error: error.stack || error.message }
            });
            throw error;
          });
        }
      });
    }
    this.collections.set(options.name, [collection, options]);
    const hasRemoteChange = (change) => {
      for (const remoteChange of this.remoteChanges) {
        if (isEqual(remoteChange, change)) {
          return true;
        }
      }
      return false;
    };
    const removeRemoteChange = (change) => {
      for (let i = 0; i < this.remoteChanges.length; i += 1) {
        if (isEqual(this.remoteChanges[i], change)) {
          this.remoteChanges.splice(i, 1);
          return;
        }
      }
    };
    collection.on("added", (item) => {
      if (hasRemoteChange({ collectionName: options.name, type: "insert", data: item })) {
        removeRemoteChange({ collectionName: options.name, type: "insert", data: item });
        return;
      }
      this.changes.insert({
        collectionName: options.name,
        time: Date.now(),
        type: "insert",
        data: item
      });
      this.schedulePush(options.name);
    });
    collection.on("changed", ({ id }, modifier) => {
      const data = { id, modifier };
      if (hasRemoteChange({ collectionName: options.name, type: "update", data })) {
        removeRemoteChange({ collectionName: options.name, type: "update", data });
        return;
      }
      this.changes.insert({
        collectionName: options.name,
        time: Date.now(),
        type: "update",
        data
      });
      this.schedulePush(options.name);
    });
    collection.on("removed", ({ id }) => {
      if (hasRemoteChange({ collectionName: options.name, type: "remove", data: id })) {
        removeRemoteChange({ collectionName: options.name, type: "remove", data: id });
        return;
      }
      this.changes.insert({
        collectionName: options.name,
        time: Date.now(),
        type: "remove",
        data: id
      });
      this.schedulePush(options.name);
    });
  }
  schedulePush(name) {
    this.deboucedPush(name);
  }
  /**
   * Starts the sync process for all collections
   */
  async syncAll() {
    if (this.isDisposed)
      throw new Error("SyncManager is disposed");
    const errors = [];
    await Promise.all([...this.collections.keys()].map((id) => this.sync(id).catch((error) => {
      errors.push({ id, error });
    })));
    if (errors.length > 0)
      throw new Error(`Error while syncing collections:
${errors.map((e) => `${e.id}: ${e.error.message}`).join("\n\n")}`);
  }
  /**
   * Checks if a collection is currently beeing synced
   * @param [name] Name of the collection. If not provided, it will check if any collection is currently beeing synced.
   * @returns True if the collection is currently beeing synced, false otherwise.
   */
  isSyncing(name) {
    return this.syncOperations.findOne(Object.assign(Object.assign({}, name ? { collectionName: name } : {}), { status: "active" }), { fields: { status: 1 } }) != null;
  }
  /**
   * Checks if the sync manager is ready to sync.
   * @returns A promise that resolves when the sync manager is ready to sync.
   */
  async isReady() {
    await this.persistenceReady;
  }
  /**
   * Starts the sync process for a collection
   * @param name Name of the collection
   * @param options Options for the sync process.
   * @param options.force If true, the sync process will be started even if there are no changes and onlyWithChanges is true.
   * @param options.onlyWithChanges If true, the sync process will only be started if there are changes.
   */
  async sync(name, options = {}) {
    if (this.isDisposed)
      throw new Error("SyncManager is disposed");
    await this.isReady();
    const entry = this.getCollection(name);
    const collectionOptions = entry[1];
    const hasActiveSyncs = this.syncOperations.find({
      collectionName: name,
      instanceId: this.instanceId,
      status: "active"
    }).count() > 0;
    const syncTime = Date.now();
    let syncId = null;
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    const doSync = async () => {
      const lastFinishedSync = this.syncOperations.findOne({ collectionName: name, status: "done" }, { sort: { end: -1 } });
      if (options === null || options === void 0 ? void 0 : options.onlyWithChanges) {
        const currentChanges = this.changes.find({
          collectionName: name,
          $and: [
            { time: { $lte: syncTime } }
          ]
        }, { sort: { time: 1 } }).count();
        if (currentChanges === 0)
          return;
      }
      if (!hasActiveSyncs) {
        syncId = this.syncOperations.insert({
          start: syncTime,
          collectionName: name,
          instanceId: this.instanceId,
          status: "active"
        });
      }
      const data = await this.options.pull(collectionOptions, {
        lastFinishedSyncStart: lastFinishedSync === null || lastFinishedSync === void 0 ? void 0 : lastFinishedSync.start,
        lastFinishedSyncEnd: lastFinishedSync === null || lastFinishedSync === void 0 ? void 0 : lastFinishedSync.end
      });
      await this.syncWithData(name, data);
    };
    await ((options === null || options === void 0 ? void 0 : options.force) ? doSync() : this.getSyncQueue(name).add(doSync)).catch((error) => {
      if (syncId != null) {
        if (this.options.onError)
          this.options.onError(collectionOptions, error);
        this.syncOperations.updateOne({ id: syncId }, {
          $set: { status: "error", end: Date.now(), error: error.stack || error.message }
        });
      }
      throw error;
    });
    if (syncId != null) {
      this.syncOperations.removeMany({
        id: { $ne: syncId },
        collectionName: name,
        $or: [
          { end: { $lte: syncTime } },
          { status: "active" }
        ]
      });
      this.syncOperations.updateOne({ id: syncId }, {
        $set: { status: "done", end: Date.now() }
      });
    }
  }
  /**
   * Starts the push process for a collection (sync process but only if there are changes)
   * @param name Name of the collection
   */
  async pushChanges(name) {
    await this.sync(name, {
      onlyWithChanges: true
    });
  }
  async syncWithData(name, data) {
    const entry = this.getCollection(name);
    const [collection, collectionOptions] = entry;
    const syncTime = Date.now();
    const lastFinishedSync = this.syncOperations.findOne({ collectionName: name, status: "done" }, { sort: { end: -1 } });
    const lastSnapshot = this.snapshots.findOne({ collectionName: name }, { sort: { time: -1 } });
    const currentChanges = this.changes.find({
      collectionName: name,
      $and: [
        { time: { $lte: syncTime } }
      ]
    }, { sort: { time: 1 } }).fetch();
    await sync({
      changes: currentChanges,
      lastSnapshot: lastSnapshot === null || lastSnapshot === void 0 ? void 0 : lastSnapshot.items,
      data,
      pull: () => this.options.pull(collectionOptions, {
        lastFinishedSyncStart: lastFinishedSync === null || lastFinishedSync === void 0 ? void 0 : lastFinishedSync.start,
        lastFinishedSyncEnd: lastFinishedSync === null || lastFinishedSync === void 0 ? void 0 : lastFinishedSync.end
      }),
      push: (changes) => this.options.push(collectionOptions, { changes }),
      insert: (item) => {
        if (item.id && !!collection.findOne({ id: item.id })) {
          this.remoteChanges.push({
            collectionName: name,
            type: "update",
            data: { id: item.id, modifier: { $set: item } }
          });
          collection.updateOne({ id: item.id }, { $set: item });
          return;
        }
        this.remoteChanges.push({
          collectionName: name,
          type: "insert",
          data: item
        });
        collection.insert(item);
      },
      update: (itemId, modifier) => {
        if (itemId && !collection.findOne({ id: itemId })) {
          const item = Object.assign(Object.assign({}, modifier.$set), { id: itemId });
          this.remoteChanges.push({
            collectionName: name,
            type: "insert",
            data: item
          });
          collection.insert(item);
          return;
        }
        this.remoteChanges.push({
          collectionName: name,
          type: "update",
          data: { id: itemId, modifier }
        });
        collection.updateOne({ id: itemId }, modifier);
      },
      remove: (itemId) => {
        if (!collection.findOne({ id: itemId }))
          return;
        this.remoteChanges.push({
          collectionName: name,
          type: "remove",
          data: itemId
        });
        collection.removeOne({ id: itemId });
      },
      batch: (fn) => {
        collection.batch(() => {
          fn();
        });
      }
    }).then(async (snapshot) => {
      this.snapshots.removeMany({ collectionName: name, time: { $lte: syncTime } });
      this.changes.removeMany({
        collectionName: name,
        id: { $in: currentChanges.map((c) => c.id) }
      });
      this.snapshots.insert({
        time: syncTime,
        collectionName: name,
        items: snapshot
      });
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
      const hasChanges = this.changes.find({
        collectionName: name
      }).count() > 0;
      if (hasChanges) {
        await this.sync(name, {
          force: true,
          onlyWithChanges: true
        });
        return;
      }
      const nonExistingItemIds = collection.find({
        id: { $nin: snapshot.map((item) => item.id) }
      }).map((item) => item.id);
      collection.batch(() => {
        snapshot.forEach((item) => {
          const itemExists = !!collection.findOne({ id: item.id });
          /* istanbul ignore else -- @preserve */
          if (itemExists) {
            this.remoteChanges.push({
              collectionName: name,
              type: "update",
              data: { id: item.id, modifier: { $set: item } }
            });
            collection.updateOne({ id: item.id }, { $set: item });
          } else {
            this.remoteChanges.push({
              collectionName: name,
              type: "insert",
              data: item
            });
            collection.insert(item);
          }
        });
        nonExistingItemIds.forEach((id) => {
          collection.removeOne({ id });
        });
      });
    });
  }
}
export {
  SyncManager as default
};
