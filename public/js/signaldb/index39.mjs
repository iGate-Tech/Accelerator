function set(obj, path, value, deleteIfUndefined = false) {
  if (obj == null)
    return obj;
  const segments = path.split(/[.[\]]/g);
  if (segments[0] === "")
    segments.shift();
  if (segments[segments.length - 1] === "")
    segments.pop();
  const apply = (node) => {
    if (segments.length > 1) {
      const key = segments.shift();
      const nextIsNum = !Number.isNaN(parseInt(segments[0], 10));
      if (node[key] === void 0) {
        node[key] = nextIsNum ? [] : {};
      }
      apply(node[key]);
    } else {
      if (deleteIfUndefined && value === void 0) {
        delete node[segments[0]];
        return;
      }
      node[segments[0]] = value;
    }
  };
  apply(obj);
  return obj;
}
export {
  set as default
};
