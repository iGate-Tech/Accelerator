import isFieldExpression from "./index41.mjs";
import serializeValue from "./index22.mjs";
function getMatchingKeys(field, selector) {
  if (selector[field] instanceof RegExp)
    return null;
  if (selector[field] != null) {
    if (isFieldExpression(selector[field])) {
      const is$in = isFieldExpression(selector[field]) && Array.isArray(selector[field].$in) && selector[field].$in.length;
      if (is$in) {
        const optimizedSelector = Object.assign(Object.assign({}, selector), { [field]: Object.assign({}, selector[field]) });
        delete optimizedSelector[field].$in;
        if (Object.keys(optimizedSelector[field]).length === 0) {
          delete optimizedSelector[field];
        }
        return selector[field].$in.map(serializeValue);
      }
      return null;
    }
    return [serializeValue(selector[field])];
  }
  return null;
}
export {
  getMatchingKeys as default
};
