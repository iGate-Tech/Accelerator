import isEqual from "./index19.mjs";
import uniqueBy from "./index40.mjs";
class Observer {
  constructor(bindEvents) {
    this.previousItems = [];
    this.callbacks = {
      added: [],
      addedBefore: [],
      changed: [],
      changedField: [],
      movedBefore: [],
      removed: []
    };
    this.unbindEvents = bindEvents();
  }
  call(event, ...args) {
    this.callbacks[event].forEach(({ callback, options }) => {
      if (!options.skipInitial || !options.isInitial) {
        callback(...args);
      }
    });
  }
  hasCallbacks(events) {
    return events.some((event) => this.callbacks[event].length > 0);
  }
  isEmpty() {
    return !this.hasCallbacks([
      "added",
      "addedBefore",
      "changed",
      "changedField",
      "movedBefore",
      "removed"
    ]);
  }
  runChecks(newItems) {
    const oldItemsMap = new Map(this.previousItems.map((item, index) => [
      item.id,
      { item, index, beforeItem: this.previousItems[index + 1] || null }
    ]));
    const newItemsMap = new Map(newItems.map((item, index) => [
      item.id,
      { item, index, beforeItem: newItems[index + 1] || null }
    ]));
    if (this.hasCallbacks(["changed", "changedField", "movedBefore", "removed"])) {
      oldItemsMap.forEach(({ item: oldItem, index, beforeItem: oldBeforeItem }) => {
        var _a;
        const newItem = newItemsMap.get(oldItem.id);
        if (newItem) {
          if (this.hasCallbacks(["changed", "changedField"])) {
            if (!isEqual(newItem.item, oldItem)) {
              this.call("changed", newItem.item);
              if (this.hasCallbacks(["changedField"])) {
                const keys = uniqueBy([
                  ...Object.keys(newItem.item),
                  ...Object.keys(oldItem)
                ], (value) => value);
                keys.forEach((key) => {
                  if (isEqual(newItem.item[key], oldItem[key]))
                    return;
                  this.call("changedField", newItem.item, key, oldItem[key], newItem.item[key]);
                });
              }
            }
          }
          if (newItem.index !== index && ((_a = newItem.beforeItem) === null || _a === void 0 ? void 0 : _a.id) !== (oldBeforeItem === null || oldBeforeItem === void 0 ? void 0 : oldBeforeItem.id)) {
            this.call("movedBefore", newItem.item, newItem.beforeItem);
          }
        } else {
          this.call("removed", oldItem);
        }
      });
    }
    if (this.hasCallbacks(["added", "addedBefore"])) {
      newItems.forEach((newItem, index) => {
        const oldItem = oldItemsMap.get(newItem.id);
        if (oldItem)
          return;
        this.call("added", newItem);
        this.call("addedBefore", newItem, newItems[index + 1] || null);
      });
    }
    this.previousItems = newItems;
    Object.keys(this.callbacks).forEach((key) => {
      const event = key;
      const callbacks = this.callbacks[event];
      this.callbacks[event] = callbacks.map((callback) => Object.assign(Object.assign({}, callback), { options: Object.assign(Object.assign({}, callback.options), { isInitial: false }) }));
    });
  }
  stop() {
    this.unbindEvents();
  }
  addCallbacks(callbacks, skipInitial = false) {
    Object.keys(callbacks).forEach((key) => {
      const typedKey = key;
      this.callbacks[typedKey].push({
        callback: callbacks[typedKey],
        options: { skipInitial, isInitial: true }
      });
    });
  }
  removeCallbacks(callbacks) {
    Object.keys(callbacks).forEach((key) => {
      const typedKey = key;
      const index = this.callbacks[typedKey].findIndex(({ callback }) => callback === callbacks[typedKey]);
      this.callbacks[typedKey].splice(index, 1);
    });
  }
}
export {
  Observer as default
};
