import get from "./index34.mjs";
import set from "./index39.mjs";
function project(item, fields) {
  const allFieldsDeactivated = Object.values(fields).every((value) => value === 0);
  if (allFieldsDeactivated) {
    const result2 = Object.assign({}, item);
    Object.keys(fields).forEach((key) => {
      const fieldValue = get(item, key);
      if (fieldValue === void 0)
        return;
      set(result2, key, void 0, true);
    });
    return result2;
  }
  const result = {};
  Object.entries(fields).forEach(([key, value]) => {
    const fieldValue = get(item, key);
    if (fieldValue === void 0)
      return;
    if (fieldValue == null && value !== 1)
      return;
    set(result, key, value === 1 ? fieldValue : void 0);
  });
  return result;
}
export {
  project as default
};
