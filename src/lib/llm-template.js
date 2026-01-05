/**
  * LLMTemplate
  * "Typed bidirectional template engine for LLM prompts and responses"
  *
  * =========================================================
  * Placeholder Grammar Specification (Reference)
  * =========================================================
  *
  * This defines the exact syntax rules for placeholders in this library.
  * Placeholders are used for bidirectional LLM data exchange:
  *   - {{key}}            : unfilled placeholder
  *   - {{key: value}}     : filled placeholder with JSON value
  *
  * The grammar below is written in EBNF-like style with explanations.
  */

/**
 * A complete placeholder.
 *
 * Syntax:
 *   {{ key : JSON }}
 *
 * - Starts with '{{' and ends with '}}'
 * - Contains a key-value pair separated by ':'
 * - Allows optional whitespace around components
 */
// placeholder ::= "{{" ws key ws ":" ws json ws "}}"

/**
 * A key used in placeholders.
 *
 * Syntax:
 *   identifier (("." | "-") identifier)*
 *
 * - Can be a single identifier or multiple identifiers joined by '.' or '-'
 * - Supports namespacing like 'user.name' or 'config-setting'
 */
// key ::= identifier (("." | "-") identifier)*

/**
 * A single identifier.
 *
 * Syntax:
 *   [a-zA-Z0-9_]+
 *
 * - Can contain letters, numbers, or underscores
 * - Cannot contain spaces or special characters
 */
// identifier ::= [a-zA-Z0-9_]+

/**
 * A JSON value.
 *
 * Syntax:
 *   valid JSON (as accepted by JSON.parse)
 *
 * - Supports: strings, numbers, booleans, arrays, objects
 * - Examples: "Alice", 123, true, [1,2], {"a":1}
 * - Does NOT support JavaScript-only values like undefined or functions
 */
// json ::= valid JSON (JSON.parse)

/**
 * Optional whitespace.
 *
 * Syntax:
 *   [ \t\n\r]*
 *
 * - Zero or more spaces, tabs, newlines, or carriage returns
 * - Allows flexibility in formatting placeholders
 */
// ws ::= [ \t\n\r]*

function extractTemplateData(templateText, options = {}) {
  const { expandNestedKeys = false, duplicateHandling = 'lastWins' } = options;
  const text = templateText;
  const len = text.length;
  const obj = {};
  let pos = 0;

  // Helper to set nested value
  function _assignNestedKey(obj, keyPath, value, duplicateHandling) {
    const keys = keyPath.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || Array.isArray(current[key])) {
        if (duplicateHandling === 'error') {
          throw new Error(`Cannot set nested key '${keyPath}': conflict at '${keys.slice(0, i+1).join('.')}'`);
        }
        current[key] = {};
      }
      current = current[key];
    }

    const finalKey = keys[keys.length - 1];
    if (finalKey in current) {
      if (duplicateHandling === 'error') {
        throw new Error(`Duplicate key '${keyPath}'`);
      } else if (duplicateHandling === 'array') {
        if (!Array.isArray(current[finalKey])) {
          current[finalKey] = [current[finalKey]];
        }
        current[finalKey].push(value);
      } else {
        // lastWins
        current[finalKey] = value;
      }
    } else {
      current[finalKey] = value;
    }
  }

  while ((pos = text.indexOf("{{", pos)) !== -1) {
    const start = pos;
    pos += 2;

    // Skip whitespace
    while (pos < len && /\s/.test(text[pos])) pos++;

    // Parse key
    const keyStart = pos;
    while (pos < len && /[\w.\-]/.test(text[pos])) pos++;
    const key = text.slice(keyStart, pos);

    if (!key) {
      pos = start + 2;
      continue;
    }

    // Skip whitespace
    while (pos < len && /\s/.test(text[pos])) pos++;

    // Expect colon
    if (text[pos] !== ":") {
      pos = start + 2;
      continue;
    }
    pos++;

    // Skip whitespace
    while (pos < len && /\s/.test(text[pos])) pos++;

    const valueStart = pos;

    let inString = false;
    let escaped = false;
    let braceCount = 0;
    let found = false;

    // Scan until }}
    while (pos < len - 1) {
      const char = text[pos];

      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
      } else {
        if (char === '"') inString = true;
        else if (char === '{') braceCount++;
        else if (char === '}') {
          braceCount--;
          if (braceCount === 0 && text[pos + 1] === '}') {
            found = true;
            break;
          }
        }
      }

      pos++;
    }

    if (!found) {
      pos = start + 2;
    } else {
      const valueStr = text.slice(valueStart, pos).trim();
      pos += 2;

      let value;
      try {
        value = JSON.parse(valueStr);
        if (expandNestedKeys && key.includes('.')) {
          _assignNestedKey(obj, key, value, duplicateHandling);
        } else {
          if (key in obj) {
            if (duplicateHandling === 'error') {
              throw new Error(`Duplicate key '${key}'`);
            } else if (duplicateHandling === 'array') {
              if (!Array.isArray(obj[key])) {
                obj[key] = [obj[key]];
              }
              obj[key].push(value);
            } else {
              // lastWins
              obj[key] = value;
            }
          } else {
            obj[key] = value;
          }
        }
      } catch (e) {
        // Try parsing as multiple key-value pairs separated by commas
        const pairs = valueStr.split(',').map(s => s.trim());
        for (const pair of pairs) {
          const match = pair.match(/^([\w.\-]+)\s*:\s*(.+)$/);
          if (match) {
            const subKey = match[1];
            const subValueStr = match[2];
            try {
              const subValue = JSON.parse(subValueStr);
              if (expandNestedKeys && subKey.includes('.')) {
                _assignNestedKey(obj, subKey, subValue, duplicateHandling);
              } else {
                if (subKey in obj) {
                  if (duplicateHandling === 'error') {
                    throw new Error(`Duplicate key '${subKey}'`);
                  } else if (duplicateHandling === 'array') {
                    if (!Array.isArray(obj[subKey])) {
                      obj[subKey] = [obj[subKey]];
                    }
                    obj[subKey].push(subValue);
                  } else {
                    // lastWins
                    obj[subKey] = subValue;
                  }
                } else {
                  obj[subKey] = subValue;
                }
              }
            } catch (subE) {
              console.log('JSON parse error for sub-value:', subValueStr, subE.message);
            }
          }
        }
        // Skip setting value since we handled it here
      }
    }
  }

  return obj;
}

/**
 * Gets a value from nested object using dot notation key
 */
function resolveNestedKey(obj, key) {
  if (!key.includes('.')) {
    return obj[key];
  }
  const keys = key.split('.');
  let current = obj;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Fills a template string with context data.
 * Converts {{key}} → {{key: JSON}}
 */
function injectTemplateData(templateStr, data, options = {}) {
  const { preserveWhitespace = false } = options;

  if (preserveWhitespace) {
    return templateStr.replace(/\{\{(\s*)([\w.\-]+)(\s*)\}\}/g, (match, ws1, key, ws2) => {
      const value = resolveNestedKey(data, key);
      if (value !== undefined) {
        try {
          const replacement = JSON.stringify(value);
          return `{{${key}: ${replacement}}}`;
        } catch {
          return match;
        }
      }
      return match;
    });
  } else {
    return templateStr.replace(/\{\{\s*([\w.\-]+)\s*\}\}/g, (match, key) => {
      const value = resolveNestedKey(data, key);
      if (value !== undefined) {
        try {
          const replacement = JSON.stringify(value);
          return `{{${key}: ${replacement}}}`;
        } catch {
          return match;
        }
      }
      return match;
    });
  }
}

/**
 * Normalizes a template by converting filled placeholders {{key: value}} back to {{key}}
 */
function resetTemplatePlaceholders(templateText, options = {}) {
  const { preserveWhitespace = false } = options;
  const text = templateText;
  const len = text.length;
  let result = '';
  let pos = 0;

  while (pos < len) {
    const nextOpen = text.indexOf("{{", pos);
    if (nextOpen === -1) {
      result += text.slice(pos);
      break;
    }

    result += text.slice(pos, nextOpen);
    pos = nextOpen;

    const start = pos;
    pos += 2;

    // Skip whitespace
    let ws1 = '';
    while (pos < len && /\s/.test(text[pos])) {
      ws1 += text[pos];
      pos++;
    }

    // Parse key
    const keyStart = pos;
    while (pos < len && /[\w.\-]/.test(text[pos])) pos++;
    const key = text.slice(keyStart, pos);

    if (!key) {
      pos = start + 2;
      result += text.slice(start, pos);
      continue;
    }

    // Skip whitespace
    let ws2 = '';
    while (pos < len && /\s/.test(text[pos])) {
      ws2 += text[pos];
      pos++;
    }

    // Check if colon (filled placeholder)
    if (text[pos] !== ":") {
      pos = start + 2;
      result += text.slice(start, pos);
      continue;
    }
    pos++;

    // Skip whitespace
    while (pos < len && /\s/.test(text[pos])) pos++;

    const valueStart = pos;

    let inString = false;
    let escaped = false;
    let found = false;

    // Scan until }}
    while (pos < len - 1) {
      const char = text[pos];

      if (!inString && char === "}" && text[pos + 1] === "}" && braceCount === 0) {
        found = true;
        break;
      }

      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
      } else {
        if (char === '"') inString = true;
        else if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
      }

      pos++;
    }

    if (!found) {
      pos = start + 2;
      result += text.slice(start, pos);
    } else {
      pos += 2;
      // Replace with normalized {{key}}
      if (preserveWhitespace) {
        result += `{{${ws1}${key}${ws2}}}`;
      } else {
        result += `{{${key}}}`;
      }
    }
  }

  return result;
}

/**
 * Deep merges two objects
 */
function mergeTemplateData(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeTemplateData(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Unified bidirectional processor.
 * - Extracts data
 * - Merges input
 * - Normalizes template
 * - Refills template
 * - Re-extracts data
 */
function processLLMTemplate(template, data = {}, options = {}) {
  const extractedInitial = extractTemplateData(template, options);
  const mergedData = mergeTemplateData(extractedInitial, data);
  const normalizedTemplate = resetTemplatePlaceholders(template, options);
  const processedTemplate = injectTemplateData(normalizedTemplate, mergedData, options);
  const extractedData = extractTemplateData(processedTemplate, options);

  return {
    inputData: data,
    template: processedTemplate,
    extractedData
  };
}

export {
  extractTemplateData,
  injectTemplateData,
  resetTemplatePlaceholders,
  mergeTemplateData,
  processLLMTemplate
};