function uniqueBy(arr, fn) {
  const set = /* @__PURE__ */ new Set();
  return arr.filter((el) => {
    const value = typeof fn === "function" ? fn(el) : el[fn];
    return !set.has(value) && set.add(value);
  });
}
export {
  uniqueBy as default
};
