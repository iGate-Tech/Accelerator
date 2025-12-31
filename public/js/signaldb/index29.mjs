import { sort } from "fast-sort";
import get from "./index34.mjs";
function sortItems(items, sortFields) {
  return sort(items).by(Object.entries(sortFields).map(([key, value]) => {
    const order = value === 1 ? "asc" : "desc";
    return { [order]: (i) => get(i, key) };
  }));
}
export {
  sortItems as default
};
