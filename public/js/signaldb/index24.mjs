import sortItems from "./index29.mjs";
import project from "./index30.mjs";
import Observer from "./index31.mjs";
function isInReactiveScope(reactivity) {
  if (!reactivity)
    return false;
  if (!reactivity.isInScope)
    return true;
  return reactivity.isInScope();
}
class Cursor {
  constructor(getItems, options) {
    this.onCleanupCallbacks = [];
    this.getFilteredItems = getItems;
    this.options = options || {};
  }
  addGetters(item) {
    if (!isInReactiveScope(this.options.reactive))
      return item;
    const depend = this.depend.bind(this);
    return Object.entries(item).reduce((memo, [key, value]) => {
      Object.defineProperty(memo, key, {
        get() {
          depend({
            changedField: (notify) => (changedItem, changedFieldName) => {
              if (changedFieldName !== key || changedItem.id !== item.id)
                return;
              notify();
            }
          });
          return value;
        },
        enumerable: true,
        configurable: true
      });
      return memo;
    }, {});
  }
  transform(rawItem) {
    const item = this.options.fieldTracking ? this.addGetters(rawItem) : rawItem;
    if (!this.options.transform)
      return item;
    return this.options.transform(item);
  }
  getItems() {
    const items = this.getFilteredItems();
    const { sort, skip, limit } = this.options;
    const sorted = sort ? sortItems(items, sort) : items;
    const skipped = skip ? sorted.slice(skip) : sorted;
    const limited = limit ? skipped.slice(0, limit) : skipped;
    const idExcluded = this.options.fields && this.options.fields.id === 0;
    return limited.map((item) => {
      if (!this.options.fields)
        return item;
      return Object.assign(Object.assign({}, idExcluded ? {} : { id: item.id }), project(item, this.options.fields));
    });
  }
  depend(changeEvents) {
    if (!this.options.reactive)
      return;
    if (!isInReactiveScope(this.options.reactive))
      return;
    const signal = this.options.reactive.create();
    signal.depend();
    const notify = () => signal.notify();
    function buildNotifier(event) {
      const eventHandler = changeEvents[event];
      return (...args) => {
        if (eventHandler === true) {
          notify();
          return;
        }
        if (typeof eventHandler !== "function")
          return;
        eventHandler(notify)(...args);
      };
    }
    const stop = this.observeRawChanges({
      added: buildNotifier("added"),
      addedBefore: buildNotifier("addedBefore"),
      changed: buildNotifier("changed"),
      changedField: buildNotifier("changedField"),
      movedBefore: buildNotifier("movedBefore"),
      removed: buildNotifier("removed")
    }, true);
    if (this.options.reactive.onDispose) {
      this.options.reactive.onDispose(() => stop(), signal);
    }
    this.onCleanup(stop);
  }
  ensureObserver() {
    if (!this.observer) {
      const observer = new Observer(() => {
        const requery = () => {
          observer.runChecks(this.getItems());
        };
        const cleanup = this.options.bindEvents && this.options.bindEvents(requery);
        return () => {
          if (cleanup)
            cleanup();
        };
      });
      this.onCleanup(() => observer.stop());
      this.observer = observer;
    }
    return this.observer;
  }
  observeRawChanges(callbacks, skipInitial = false) {
    const observer = this.ensureObserver();
    observer.addCallbacks(callbacks, skipInitial);
    observer.runChecks(this.getItems());
    return () => {
      observer.removeCallbacks(callbacks);
      if (!observer.isEmpty())
        return;
      observer.stop();
      this.observer = void 0;
    };
  }
  cleanup() {
    this.onCleanupCallbacks.forEach((callback) => {
      callback();
    });
    this.onCleanupCallbacks = [];
  }
  onCleanup(callback) {
    this.onCleanupCallbacks.push(callback);
  }
  forEach(callback) {
    const items = this.getItems();
    this.depend(Object.assign({ addedBefore: true, removed: true, movedBefore: true }, this.options.fieldTracking ? {} : { changed: true }));
    items.forEach((item) => {
      callback(this.transform(item));
    });
  }
  map(callback) {
    const results = [];
    this.forEach((item) => {
      results.push(callback(item));
    });
    return results;
  }
  fetch() {
    return this.map((item) => item);
  }
  count() {
    const items = this.getItems();
    this.depend({
      added: true,
      removed: true
    });
    return items.length;
  }
  observeChanges(callbacks, skipInitial = false) {
    return this.observeRawChanges(Object.entries(callbacks).reduce((memo, [callbackName, callback]) => {
      if (!callback)
        return memo;
      return Object.assign(Object.assign({}, memo), { [callbackName]: (item, before) => {
        const transformedValue = this.transform(item);
        const hasBeforeParam = before !== void 0;
        const transformedBeforeValue = hasBeforeParam && before ? this.transform(before) : null;
        return callback(transformedValue, ...hasBeforeParam ? [transformedBeforeValue] : []);
      } });
    }, {}), skipInitial);
  }
  requery() {
    if (!this.observer)
      return;
    this.observer.runChecks(this.getItems());
  }
}
export {
  Cursor as default,
  isInReactiveScope
};
