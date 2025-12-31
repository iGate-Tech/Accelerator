import { Query } from "mingo";
function match(item, selector) {
  const query = new Query(selector);
  return query.test(item);
}
export {
  match as default
};
