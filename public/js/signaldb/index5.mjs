import ReplicatedCollection from "./index4.mjs";
import createSignal from "./index23.mjs";
class AutoFetchCollection extends ReplicatedCollection {
  /**
   * @param options {Object} - Options for the collection.
   * @param options.fetchQueryItems {Function} - A function that fetches items from the server. It takes the selector as an argument and returns a promise that resolves to an object with an `items` property.
   * @param options.purgeDelay {Number} - The delay in milliseconds before purging an item from the cache.
   */
  constructor(options) {
    var _a, _b, _c, _d;
    let triggerRemoteChange;
    super(Object.assign(Object.assign({}, options), { pull: () => Promise.resolve({
      items: [...this.itemsCache.values()].reduce((memo, items) => {
        const newItems = [...memo];
        items.forEach((item) => {
          const index = newItems.findIndex((i) => i.id === item.id);
          if (index === -1) {
            newItems.push(item);
            return;
          }
          newItems[index] = this.mergeItems(newItems[index], item);
        });
        return newItems;
      }, [])
    }), registerRemoteChange: async (onChange) => {
      triggerRemoteChange = onChange;
      return Promise.resolve();
    } }));
    this.activeObservers = /* @__PURE__ */ new Map();
    this.observerTimeouts = /* @__PURE__ */ new Map();
    this.idQueryCache = /* @__PURE__ */ new Map();
    this.itemsCache = /* @__PURE__ */ new Map();
    this.triggerReload = null;
    this.reactivityAdapter = null;
    this.loadingSignals = /* @__PURE__ */ new Map();
    this.mergeItems = (_a = options.mergeItems) !== null && _a !== void 0 ? _a : (itemA, itemB) => Object.assign(Object.assign({}, itemA), itemB);
    this.purgeDelay = (_b = options.purgeDelay) !== null && _b !== void 0 ? _b : 1e4;
    this.isFetchingSignal = createSignal((_c = options.reactivity) === null || _c === void 0 ? void 0 : _c.create(), false);
    if (!triggerRemoteChange)
      throw new Error("No triggerRemoteChange method found. Looks like your persistence adapter was not registered");
    this.triggerReload = triggerRemoteChange;
    this.reactivityAdapter = (_d = options.reactivity) !== null && _d !== void 0 ? _d : null;
    this.fetchQueryItems = options.fetchQueryItems;
    this.on("observer.created", (selector) => this.handleObserverCreation(selector !== null && selector !== void 0 ? selector : {}));
    this.on("observer.disposed", (selector) => setTimeout(() => this.handleObserverDisposal(selector !== null && selector !== void 0 ? selector : {}), 100));
    if (options.registerRemoteChange) {
      void options.registerRemoteChange(() => this.forceRefetch());
    }
  }
  /**
   * @summary Registers a query manually that items should be fetched for it
   * @param selector {Object} Selector of the query
   */
  registerQuery(selector) {
    this.handleObserverCreation(selector);
  }
  /**
   * @summary Unregisters a query manually that items are not fetched anymore for it
   * @param selector {Object} Selector of the query
   */
  unregisterQuery(selector) {
    this.handleObserverDisposal(selector);
  }
  // eslint-disable-next-line class-methods-use-this
  getKeyForSelector(selector) {
    return JSON.stringify(selector);
  }
  async forceRefetch() {
    return Promise.all([...this.activeObservers.values()].map(({ selector }) => this.fetchSelector(selector))).then(() => {
    });
  }
  fetchSelector(selector) {
    this.isFetchingSignal.set(true);
    return this.fetchQueryItems(selector).then((response) => {
      if (!response.items)
        throw new Error("AutoFetchCollection currently only works with a full item response");
      this.itemsCache.set(this.getKeyForSelector(selector), response.items);
      response.items.forEach((item) => {
        var _a;
        const queries = (_a = this.idQueryCache.get(item.id)) !== null && _a !== void 0 ? _a : [];
        queries.push(selector);
        this.idQueryCache.set(item.id, queries);
      });
      this.setLoading(selector, true);
      this.once("persistence.received", () => {
        this.setLoading(selector, false);
      });
      if (!this.triggerReload)
        throw new Error("No triggerReload method found. Looks like your persistence adapter was not registered");
      void this.triggerReload();
    }).catch((error) => {
      this.emit("persistence.error", error);
    }).finally(() => {
      this.isFetchingSignal.set(false);
    });
  }
  handleObserverCreation(selector) {
    var _a, _b;
    const activeObservers = (_b = (_a = this.activeObservers.get(this.getKeyForSelector(selector))) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : 0;
    this.activeObservers.set(this.getKeyForSelector(selector), {
      selector,
      count: activeObservers + 1
    });
    const timeout = this.observerTimeouts.get(this.getKeyForSelector(selector));
    if (timeout)
      clearTimeout(timeout);
    if (activeObservers === 0)
      void this.fetchSelector(selector);
  }
  handleObserverDisposal(selector) {
    var _a, _b;
    const currentObservers = (_b = (_a = this.activeObservers.get(this.getKeyForSelector(selector))) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : 0;
    const activeObservers = currentObservers - 1;
    if (activeObservers > 0) {
      this.activeObservers.set(this.getKeyForSelector(selector), {
        selector,
        count: activeObservers
      });
      return;
    }
    const timeout = this.observerTimeouts.get(this.getKeyForSelector(selector));
    if (timeout)
      clearTimeout(timeout);
    const removeObserver = () => {
      this.activeObservers.delete(this.getKeyForSelector(selector));
      this.itemsCache.delete(this.getKeyForSelector(selector));
      if (!this.triggerReload)
        throw new Error("No triggerReload method found. Looks like your persistence adapter was not registered");
      void this.triggerReload();
    };
    if (this.purgeDelay === 0) {
      removeObserver();
      return;
    }
    this.observerTimeouts.set(this.getKeyForSelector(selector), setTimeout(removeObserver, this.purgeDelay));
  }
  ensureSignal(selector) {
    if (!this.reactivityAdapter)
      throw new Error("No reactivity adapter found");
    if (!this.loadingSignals.has(this.getKeyForSelector(selector))) {
      this.loadingSignals.set(this.getKeyForSelector(selector), createSignal(this.reactivityAdapter.create(), false));
    }
    return this.loadingSignals.get(this.getKeyForSelector(selector));
  }
  setLoading(selector, value) {
    const signal = this.ensureSignal(selector);
    signal.set(value);
  }
  /**
   * @summary Indicates wether a query is currently been loaded
   * @param selector {Object} Selector of the query
   * @returns The loading state
   */
  isLoading(selector) {
    const isPushing = this.isPushing();
    if (!selector) {
      return this.isFetchingSignal.get() || isPushing;
    }
    const signal = this.ensureSignal(selector);
    return signal.get() || isPushing;
  }
}
export {
  AutoFetchCollection as default
};
