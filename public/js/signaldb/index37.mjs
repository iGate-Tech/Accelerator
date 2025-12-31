function getSnapshot(lastSnapshot, data) {
  if (data.items != null)
    return data.items;
  const items = lastSnapshot || [];
  data.changes.added.forEach((item) => {
    const index = items.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      items[index] = item;
    } else {
      items.push(item);
    }
  });
  data.changes.modified.forEach((item) => {
    const index = items.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      items[index] = item;
    } else {
      items.push(item);
    }
  });
  data.changes.removed.forEach((item) => {
    const index = items.findIndex((i) => i.id === item.id);
    if (index !== -1)
      items.splice(index, 1);
  });
  return items;
}
export {
  getSnapshot as default
};
