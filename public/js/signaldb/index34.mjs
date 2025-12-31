function get(value, path) {
  const segments = path.split(/[.[\]]/g);
  if (segments[0] === "")
    segments.shift();
  if (segments[segments.length - 1] === "")
    segments.pop();
  let current = value;
  for (let i = 0; i < segments.length; i += 1) {
    const key = segments[i];
    if (current == null || key.trim() === "")
      return void 0;
    current = current[key];
  }
  if (current === void 0)
    return void 0;
  return current;
}
export {
  get as default
};
