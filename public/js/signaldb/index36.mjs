import isEqual from "./index19.mjs";
function computeChanges(oldItems, newItems) {
  const added = [];
  const modified = [];
  const removed = [];
  const oldItemsMap = new Map(oldItems.map((item) => [item.id, item]));
  const newItemsMap = new Map(newItems.map((item) => [item.id, item]));
  for (const [id, oldItem] of oldItemsMap) {
    const newItem = newItemsMap.get(id);
    if (!newItem) {
      removed.push(oldItem);
    } else if (!isEqual(newItem, oldItem)) {
      modified.push(newItem);
    }
  }
  for (const [id, newItem] of newItemsMap) {
    if (!oldItemsMap.has(id)) {
      added.push(newItem);
    }
  }
  return { added, modified, removed };
}
export {
  computeChanges as default
};
