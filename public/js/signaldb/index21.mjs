function clone(value) {
  if (typeof value === "function")
    throw new Error("Cloning functions is not supported");
  if (value === null || typeof value !== "object")
    return value;
  if (value instanceof Date)
    return new Date(value.getTime());
  if (Array.isArray(value))
    return value.map((item) => clone(item));
  if (value instanceof Map) {
    const result2 = /* @__PURE__ */ new Map();
    value.forEach((val, key) => {
      result2.set(key, clone(val));
    });
    return result2;
  }
  if (value instanceof Set) {
    const result2 = /* @__PURE__ */ new Set();
    value.forEach((val) => {
      result2.add(clone(val));
    });
    return result2;
  }
  if (value instanceof RegExp)
    return new RegExp(value);
  const result = {};
  for (const key in value) {
    if (Object.hasOwnProperty.call(value, key)) {
      result[key] = clone(value[key]);
    }
  }
  return result;
}
function deepClone(obj) {
  if (typeof structuredClone === "function")
    return structuredClone(obj);
  /* istanbul ignore next -- @preserve */
  return clone(obj);
}
export {
  clone,
  deepClone as default
};
