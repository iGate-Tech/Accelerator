import { updateObject } from "mingo/updater";
function modify(item, modifier) {
  const clonedItem = Object.assign({}, item);
  updateObject(clonedItem, modifier);
  return clonedItem;
}
export {
  modify as default
};
