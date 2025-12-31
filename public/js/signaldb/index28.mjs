import computeChanges from "./index36.mjs";
import getSnapshot from "./index37.mjs";
import applyChanges from "./index38.mjs";
function hasChanges(changes) {
  return changes.added.length > 0 || changes.modified.length > 0 || changes.removed.length > 0;
}
function hasDifference(oldItems, newItems) {
  return hasChanges(computeChanges(oldItems, newItems));
}
async function sync({ changes, lastSnapshot, data, pull, push, insert, update, remove, batch }) {
  let newData = data;
  let previousSnapshot = lastSnapshot || [];
  let newSnapshot = getSnapshot(lastSnapshot, newData);
  if (changes.length > 0) {
    const lastSnapshotWithChanges = applyChanges(previousSnapshot, changes);
    if (hasDifference(previousSnapshot, lastSnapshotWithChanges)) {
      const newSnapshotWithChanges = applyChanges(newSnapshot, changes);
      const changesToPush = computeChanges(newSnapshot, newSnapshotWithChanges);
      if (hasChanges(changesToPush)) {
        await push(changesToPush);
        newData = await pull();
        newSnapshot = getSnapshot(newSnapshot, newData);
      }
      previousSnapshot = lastSnapshotWithChanges;
    }
  }
  const newChanges = newData.changes == null ? computeChanges(previousSnapshot, newData.items) : newData.changes;
  batch(() => {
    newChanges.added.forEach((item) => insert(item));
    newChanges.modified.forEach((item) => update(item.id, { $set: item }));
    newChanges.removed.forEach((item) => remove(item.id));
  });
  return newSnapshot;
}
export {
  sync as default
};
