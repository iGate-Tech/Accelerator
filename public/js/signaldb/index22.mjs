function serializeValue(value) {
  if (typeof value === "string")
    return value;
  if (typeof value === "number")
    return value.toString();
  if (typeof value === "boolean")
    return value.toString();
  if (value instanceof Date)
    return value.toISOString();
  return JSON.stringify(value);
}
export {
  serializeValue as default
};
