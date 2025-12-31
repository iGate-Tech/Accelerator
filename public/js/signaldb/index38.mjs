import Collection from "./index2.mjs";
import modify from "./index18.mjs";
function applyChanges(items, changes) {
  const collection = new Collection();
  collection.batch(() => {
    items.forEach((item) => collection.insert(item));
    changes.forEach((change) => {
      if (change.type === "remove") {
        collection.removeOne({ id: change.data });
        return;
      }
      const selector = { id: change.data.id };
      const itemExists = collection.findOne(selector);
      if (change.type === "insert") {
        if (itemExists) {
          collection.updateOne(selector, { $set: change.data });
        } else {
          collection.insert(change.data);
        }
        return;
      }
      if (itemExists) {
        collection.updateOne(selector, change.data.modifier);
      } else {
        collection.insert(modify(selector, change.data.modifier));
      }
    });
  });
  return collection.find().fetch();
}
export {
  applyChanges as default
};
