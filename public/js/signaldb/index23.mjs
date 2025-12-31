function createSignal(dependency, initialValue, isEqual = Object.is) {
  let value = initialValue;
  const signal = {
    get() {
      if (dependency)
        dependency.depend();
      return value;
    },
    set(newValue) {
      if (isEqual(value, newValue))
        return;
      value = newValue;
      if (dependency)
        dependency.notify();
    }
  };
  return signal;
}
export {
  createSignal as default
};
