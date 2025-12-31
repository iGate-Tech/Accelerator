import { __rest } from "./index32.mjs";
import intersection from "./index33.mjs";
function getMergedIndexInfo(indexProviders, selector) {
  return indexProviders.reduce((memo, indexProvider) => {
    /* istanbul ignore if -- @preserve */
    if (indexProvider.getItemPositions) {
      const result = indexProvider.getItemPositions(selector);
      if (result == null)
        return memo;
      return {
        matched: true,
        positions: memo.matched ? intersection(memo.positions, result) : result,
        optimizedSelector: memo.optimizedSelector
      };
    }
    const info = indexProvider.query(selector);
    if (!info.matched)
      return memo;
    const optimizedSelector = Object.fromEntries(Object.entries(memo.optimizedSelector).filter(([key]) => !info.fields.includes(key)));
    return {
      matched: true,
      positions: [...new Set(memo.matched ? intersection(memo.positions, info.positions) : info.positions)],
      optimizedSelector
    };
  }, {
    matched: false,
    positions: [],
    optimizedSelector: Object.assign({}, selector)
  });
}
function getIndexInfo(indexProviders, selector) {
  if (selector == null || Object.keys(selector).length <= 0) {
    return { matched: false, positions: [], optimizedSelector: selector };
  }
  const { $and, $or } = selector, rest = __rest(selector, ["$and", "$or"]);
  const flatInfo = getMergedIndexInfo(indexProviders, rest);
  let { matched, positions } = flatInfo;
  const newSelector = flatInfo.optimizedSelector;
  if (Array.isArray($and)) {
    const $andNew = [];
    for (const sel of $and) {
      const { matched: selMatched, positions: selPositions, optimizedSelector } = getIndexInfo(indexProviders, sel);
      if (selMatched) {
        positions = matched ? intersection(positions, selPositions) : selPositions;
        matched = true;
        if (Object.keys(optimizedSelector).length > 0) {
          $andNew.push(optimizedSelector);
        }
      } else {
        $andNew.push(sel);
      }
    }
    if ($andNew.length > 0)
      newSelector.$and = $andNew;
  }
  if (Array.isArray($or)) {
    const $orNew = [];
    for (const sel of $or) {
      const { matched: selMatched, positions: selPositions, optimizedSelector } = getIndexInfo(indexProviders, sel);
      if (selMatched) {
        positions = [.../* @__PURE__ */ new Set([...positions, ...selPositions])];
        matched = true;
        if (Object.keys(optimizedSelector).length > 0) {
          $orNew.push(optimizedSelector);
        }
      } else {
        $orNew.push(sel);
      }
    }
    if ($orNew.length > 0)
      newSelector.$or = $orNew;
  }
  return {
    matched,
    positions: positions || [],
    optimizedSelector: newSelector
  };
}
export {
  getIndexInfo as default,
  getMergedIndexInfo
};
