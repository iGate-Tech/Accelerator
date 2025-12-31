import Collection from "./index2.mjs";
import combinePersistenceAdapters from "./index10.mjs";
import createPersistenceAdapter from "./index9.mjs";
import createSignal from "./index23.mjs";
function createReplicationAdapter(options) {
  return createPersistenceAdapter({
    async register(onChange) {
      if (!options.registerRemoteChange)
        return;
      await options.registerRemoteChange(onChange);
    },
    load: () => options.pull(),
    save: (items, changes) => {
      if (!options.push)
        throw new Error("Pushing is not configured for this collection. Try to pass a `push` function to the collection options.");
      return options.push(changes, items);
    }
  });
}
class ReplicatedCollection extends Collection {
  constructor(options) {
    var _a, _b;
    const replicationAdapter = createReplicationAdapter({
      registerRemoteChange: options.registerRemoteChange,
      pull: async () => {
        this.isPullingRemoteSignal.set(true);
        try {
          return await options.pull();
        } finally {
          this.isPullingRemoteSignal.set(false);
        }
      },
      push: options.push ? async (changes, items) => {
        if (!options.push)
          throw new Error("Pushing is not configured for this collection. Try to pass a `push` function to the collection options.");
        this.isPushingRemoteSignal.set(true);
        try {
          await options.push(changes, items);
        } finally {
          this.isPushingRemoteSignal.set(false);
        }
      } : void 0
    });
    const persistenceAdapter = (options === null || options === void 0 ? void 0 : options.persistence) ? combinePersistenceAdapters(replicationAdapter, options.persistence) : replicationAdapter;
    super(Object.assign(Object.assign({}, options), { persistence: persistenceAdapter }));
    this.isPullingRemoteSignal = createSignal((_a = options.reactivity) === null || _a === void 0 ? void 0 : _a.create(), false);
    this.isPushingRemoteSignal = createSignal((_b = options.reactivity) === null || _b === void 0 ? void 0 : _b.create(), false);
  }
  isLoading() {
    const isPullingRemote = this.isPullingRemoteSignal.get();
    const isPushingRemote = this.isPushingRemoteSignal.get();
    const isLoading = super.isLoading();
    return isPullingRemote || isPushingRemote || isLoading;
  }
}
export {
  createReplicationAdapter,
  ReplicatedCollection as default
};
