import createIndexProvider from "./index13.mjs";
import get from "./index34.mjs";
import getMatchingKeys from "./index35.mjs";
import serializeValue from "./index22.mjs";
function createExternalIndex(field, index) {
  return createIndexProvider({
    query(selector) {
      const keys = getMatchingKeys(field, selector);
      if (keys == null)
        return { matched: false };
      const itemPositions = keys.reduce((memo, key) => [...memo, ...index.get(key) || []], []);
      return {
        matched: true,
        positions: itemPositions,
        fields: [field]
      };
    },
    rebuild() {
    }
  });
}
function createIndex(field) {
  const index = /* @__PURE__ */ new Map();
  return Object.assign(Object.assign({}, createExternalIndex(field, index)), { rebuild(items) {
    index.clear();
    items.forEach((item, i) => {
      const value = serializeValue(get(item, field));
      const current = index.get(value) || /* @__PURE__ */ new Set();
      current.add(i);
      index.set(value, current);
    });
  } });
}
export {
  createExternalIndex,
  createIndex as default
};
