import createPersistenceAdapter from "./index9.mjs";
function createTemporaryFallbackExecutor(firstResolvingPromiseFn, secondResolvingPromiseFn, options) {
  var _a;
  const cacheTimeout = (_a = options === null || options === void 0 ? void 0 : options.cacheTimeout) !== null && _a !== void 0 ? _a : 0;
  let isResolved = false;
  let resolvedValue = null;
  let timeout = null;
  let secondaryPromise = null;
  return (...args) => {
    if (secondaryPromise == null) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      secondaryPromise = secondResolvingPromiseFn(...args).then((result) => {
        if (cacheTimeout > 0) {
          timeout = setTimeout(() => {
            isResolved = false;
            resolvedValue = null;
            secondaryPromise = null;
          }, cacheTimeout);
        }
        isResolved = true;
        resolvedValue = result;
        if (options === null || options === void 0 ? void 0 : options.onResolve)
          options.onResolve(resolvedValue);
        return result;
      });
    } else if (isResolved) {
      return secondaryPromise;
    }
    return firstResolvingPromiseFn(...args);
  };
}
function combinePersistenceAdapters(primary, secondary, options) {
  var _a;
  const readPreference = (_a = options === null || options === void 0 ? void 0 : options.readPreference) !== null && _a !== void 0 ? _a : "secondary";
  const primaryAdapter = readPreference === "primary" ? primary : secondary;
  const secondaryAdapter = readPreference === "primary" ? secondary : primary;
  let handleChange = null;
  const readExecutor = createTemporaryFallbackExecutor(() => primaryAdapter.load(), () => secondaryAdapter.load(), {
    cacheTimeout: 100,
    onResolve: (result) => {
      var _a2, _b, _c;
      if (handleChange)
        void handleChange();
      void primaryAdapter.save(result.items || [], {
        added: ((_a2 = result.changes) === null || _a2 === void 0 ? void 0 : _a2.added) || [],
        modified: ((_b = result.changes) === null || _b === void 0 ? void 0 : _b.modified) || [],
        removed: ((_c = result.changes) === null || _c === void 0 ? void 0 : _c.removed) || []
      });
    }
  });
  return createPersistenceAdapter({
    async register(onChange) {
      handleChange = onChange;
      await Promise.all([primary.register(onChange), secondary.register(onChange)]);
    },
    async load() {
      const promise = readExecutor();
      return promise;
    },
    async save(items, changes) {
      await Promise.all([
        primaryAdapter.save(items, changes),
        secondaryAdapter.save(items, changes)
      ]);
    }
  });
}
export {
  createTemporaryFallbackExecutor,
  combinePersistenceAdapters as default
};
