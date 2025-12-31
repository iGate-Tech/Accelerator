import Collection from "./index2.mjs";
import createLocalStorageAdapter from "./index6.mjs";
import createFilesystemAdapter from "./index8.mjs";
function createAdapter(name) {
  if (typeof window === "undefined") {
    return createFilesystemAdapter(`persistent-collection-${name}.json`);
  }
  return createLocalStorageAdapter(name);
}
class PersistentCollection extends Collection {
  constructor(name, options) {
    super(Object.assign({ persistence: createAdapter(name) }, options));
  }
}
export {
  PersistentCollection as default
};
