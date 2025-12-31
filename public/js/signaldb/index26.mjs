function debounce(func, wait, options = {}) {
  let timeout;
  let result;
  const { leading = false, trailing = true } = options;
  function debounced(...args) {
    const shouldCallImmediately = leading && !timeout;
    const shouldCallTrailing = trailing && !timeout;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      if (trailing && !shouldCallImmediately) {
        result = func.apply(this, args);
      }
    }, wait);
    if (shouldCallImmediately) {
      result = func.apply(this, args);
    } else if (!shouldCallTrailing) {
      result = null;
    }
    return result;
  }
  return debounced;
}
export {
  debounce as default
};
