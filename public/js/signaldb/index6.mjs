import createPersistenceAdapter from "./index9.mjs";
function createLocalStorageAdapter(name, options) {
  const { serialize = JSON.stringify, deserialize = JSON.parse } = options || {};
  const collectionId = `signaldb-collection-${name}`;
  function getItems() {
    return deserialize(localStorage.getItem(collectionId) || "[]");
  }
  return createPersistenceAdapter({
    async load() {
      const items = getItems();
      return Promise.resolve({ items });
    },
    async save(items, { added, modified, removed }) {
      const currentItems = getItems();
      added.forEach((item) => {
        currentItems.push(item);
      });
      modified.forEach((item) => {
        const index = currentItems.findIndex(({ id }) => id === item.id);
        /* istanbul ignore if -- @preserve */
        if (index === -1)
          throw new Error(`Item with ID ${item.id} not found`);
        currentItems[index] = item;
      });
      removed.forEach((item) => {
        const index = currentItems.findIndex(({ id }) => id === item.id);
        /* istanbul ignore if -- @preserve */
        if (index === -1)
          throw new Error(`Item with ID ${item.id} not found`);
        currentItems.splice(index, 1);
      });
      localStorage.setItem(collectionId, serialize(currentItems));
      return Promise.resolve();
    },
    async register() {
      return Promise.resolve();
    }
  });
}
export {
  createLocalStorageAdapter as default
};
