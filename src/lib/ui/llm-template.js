

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

function safeParseValue(valueStr) {
  if (!valueStr || typeof valueStr !== 'string') {
    return { value: valueStr, method: 'direct' };
  }

  const trimmed = valueStr.trim();

  if (!trimmed) {
    return { value: trimmed, method: 'empty' };
  }

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return { value: JSON.parse(trimmed), method: 'json' };
    } catch {
      return { value: trimmed.slice(1, -1), method: 'unquoted' };
    }
  }

  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return { value: trimmed.slice(1, -1), method: 'single_quoted' };
  }

  if (trimmed === 'true') return { value: true, method: 'boolean' };
  if (trimmed === 'false') return { value: false, method: 'boolean' };
  if (trimmed === 'null') return { value: null, method: 'null' };
  if (trimmed === 'undefined') return { value: undefined, method: 'undefined' };

  const numMatch = trimmed.match(/^-?\d+(\.\d+)?$/);
  if (numMatch) {
    return { value: parseFloat(trimmed), method: 'number' };
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      return { value: JSON.parse(trimmed), method: 'json_array' };
    } catch {
      return { value: trimmed, method: 'raw' };
    }
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return { value: JSON.parse(trimmed), method: 'json_object' };
    } catch {
      return { value: trimmed, method: 'raw' };
    }
  }

  return { value: trimmed, method: 'raw' };
}

function extractTemplateData(templateText, options = {}) {
  const { expandNestedKeys = false, duplicateHandling = 'lastWins' } = options;
  const text = templateText;
  const len = text.length;
  const obj = {};
  let pos = 0;

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
        current[finalKey] = value;
      }
    } else {
      current[finalKey] = value;
    }
  }

  let placeholderCount = 0;
  let extractCount = 0;

  while ((pos = text.indexOf("{{", pos)) !== -1) {
    placeholderCount++;
    const start = pos;
    pos += 2;

    while (pos < len && /\s/.test(text[pos])) pos++;

    const keyStart = pos;
    while (pos < len && /[\w.-]/.test(text[pos])) pos++;
    const key = text.slice(keyStart, pos);

    if (!key) {
      pos = start + 2;
      continue;
    }

    while (pos < len && /\s/.test(text[pos])) pos++;

    if (text[pos] !== ":") {
      pos = start + 2;
      continue;
    }
    pos++;

    while (pos < len && /\s/.test(text[pos])) pos++;

    const valueStart = pos;

    let inString = false;
    let escaped = false;
    let braceCount = 0;
    let found = false;
    let loopPos = pos;

    while (loopPos < len - 1) {
      const char = text[loopPos];

      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') {
          inString = false;
        }
      } else {
        if (char === '"') {
          inString = true;
        } else if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount <= 0 && text[loopPos + 1] === '}') {
            found = true;
            break;
          }
        }
      }

      loopPos++;
    }

    if (!found) {
      pos = start + 2;
    } else {
      const valueStr = text.slice(valueStart, loopPos).trim();
      pos = loopPos + 2;

      const { value } = safeParseValue(valueStr);

      if (value !== undefined) {
        extractCount++;
        obj[key] = value;
      }
    }
  }

  return obj;
}

/**
 * Gets a value from nested object using dot notation key
 */
function resolveNestedKey(obj, key) {
  logger.trace('resolveNestedKey: Starting with key:', key);
  if (!key.includes('.')) {
    const value = obj[key];
    logger.trace('resolveNestedKey: Simple key resolved to:', typeof value);
    return value;
  }
  const keys = key.split('.');
  let current = obj;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
      logger.trace('resolveNestedKey: Resolved key segment:', k, 'current type:', typeof current);
    } else {
      logger.trace('resolveNestedKey: Key segment not found:', k, 'in current object');
      return undefined;
    }
  }
  logger.trace('resolveNestedKey: Nested key resolved successfully');
  return current;
}

/**
 * Fills a template string with context data.
 * Converts {{key}} → {{key: JSON}}
 */
function injectTemplateData(templateStr, data, options = {}) {
  logger.trace('injectTemplateData: Starting with template length:', templateStr?.length, 'data keys:', Object.keys(data || {}), 'options:', options);
  const { preserveWhitespace = false } = options;

  if (preserveWhitespace) {
    return templateStr.replace(/\{\{(\s*)([\w.-]+)(\s*)\}\}/g, (match, ws1, key, ws2) => {
      const value = resolveNestedKey(data, key);
      if (value !== undefined) {
        try {
          const replacement = JSON.stringify(value);
          return replacement;
        } catch {
          return match;
        }
      }
      return match;
    });
  } else {
    return templateStr.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, key) => {
      logger.trace('injectTemplateData: Processing placeholder:', match, 'key:', key);
      const value = resolveNestedKey(data, key);
      if (value !== undefined) {
        try {
          const replacement = JSON.stringify(value);
          logger.trace('injectTemplateData: Replaced with value type:', typeof value);
          return `{{${key}: ${replacement}}}`;
        } catch (error) {
          logger.warn('injectTemplateData: Failed to stringify value for key:', key, error.message);
          return match;
        }
      }
      logger.trace('injectTemplateData: No value found for key:', key, 'leaving placeholder unchanged');
      return match;
    });
  }
}

/**
 * Normalizes a template by converting filled placeholders {{key: value}} back to {{key}}
 */
function resetTemplatePlaceholders(templateText, options = {}) {
  logger.trace('resetTemplatePlaceholders: Starting with template length:', templateText?.length, 'options:', options);
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
    while (pos < len && /[\w.-]/.test(text[pos])) pos++;
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
    let braceCount = 0;
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
  logger.trace('mergeTemplateData: Starting with target keys:', Object.keys(target || {}), 'source keys:', Object.keys(source || {}));
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      logger.trace('mergeTemplateData: Merging nested object for key:', key);
      result[key] = mergeTemplateData(result[key] || {}, source[key]);
    } else {
      logger.trace('mergeTemplateData: Setting primitive value for key:', key, 'type:', typeof source[key]);
      result[key] = source[key];
    }
  }
  logger.trace('mergeTemplateData: Completed, result keys:', Object.keys(result));
  return result;
}

/**
 * Renders filled templates as plain text by replacing {{key: value}} with value
 */
function renderFilledTemplate(templateText) {
  logger.trace('renderFilledTemplate: Starting with template length:', templateText?.length);
  if (!templateText) return templateText || '';
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
    pos += 2; // Skip "{{"

    // Skip whitespace
    while (pos < len && /\s/.test(text[pos])) pos++;

    // Parse key
    const keyStart = pos;
    while (pos < len && /[\w.-]/.test(text[pos])) pos++;
    const key = text.slice(keyStart, pos);

    if (!key) {
      // Skip invalid template
      pos = start + 2;
      continue;
    }

    // Skip whitespace
    while (pos < len && /\s/.test(text[pos])) pos++;

    // Check if colon (filled placeholder)
    if (text[pos] !== ":") {
      // Skip incomplete template instead of outputting raw {{
      pos = start + 2;
      continue;
    }
    pos++;

    // Skip whitespace
    while (pos < len && /\s/.test(text[pos])) pos++;

    // Parse key (for filled placeholders)
    const filledKeyStart = pos;
    while (pos < len && /[\w.-]/.test(text[pos])) pos++;
    const filledKey = text.slice(filledKeyStart, pos);

    if (!filledKey) {
      pos = start + 2;
      result += text.slice(start, pos);
      continue;
    }

    // Skip whitespace
    while (pos < len && /\s/.test(text[pos])) pos++;

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
    let braceCount = 0;
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
      const valueStr = text.slice(valueStart, pos).trim();
      pos += 2;

      logger.trace('renderFilledTemplate: Processing filled placeholder for key:', filledKey);
      try {
        const value = JSON.parse(valueStr);
        if (typeof value === 'string') {
          logger.trace('renderFilledTemplate: Returning string value for key:', filledKey);
          result += value;
        } else {
          logger.trace('renderFilledTemplate: Returning JSON stringified value for key:', filledKey);
          result += JSON.stringify(value, null, 2);
        }
      } catch (error) {
        // logger.warn('renderFilledTemplate: Failed to parse value for key:', filledKey, error.message);
        // Treat as plain string if not valid JSON
        result += valueStr;
      }
    }
  }

  logger.trace('renderFilledTemplate: Completed');
  return result;
}

/**
 * Extracts output keys from a prompt text by scanning for {{key: }} patterns
 */
function extractKeysFromPrompt(promptText) {
  const keyRegex = /\{\{\s*(\w+(?:[-.]\w+)*)\s*:/g;
  const keys = [];
  let match;
  while ((match = keyRegex.exec(promptText)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

/**
 * Unified bidirectional processor.
 * - Extracts data
 * - Merges input
 * - Normalizes template
 * - Refills template
 * - Re-extracts data
 */
import { logger } from '../core';

function processLLMTemplate(template, data = {}, options = {}, updateDataFn) {
  logger.info('processLLMTemplate: Starting with template length:', template?.length, 'data keys:', Object.keys(data), 'options:', options);
  logger.debug('processLLMTemplate: Input data:', data);

  const extractedInitial = extractTemplateData(template, options);
  logger.debug('processLLMTemplate: Initial extraction completed, keys:', Object.keys(extractedInitial));

  const mergedData = mergeTemplateData(extractedInitial, data);
  logger.debug('processLLMTemplate: Data merged, total keys:', Object.keys(mergedData), 'merged data:', mergedData);

  const normalizedTemplate = resetTemplatePlaceholders(template, options);
  logger.debug('processLLMTemplate: Template normalized, length:', normalizedTemplate.length);

  const processedTemplate = injectTemplateData(normalizedTemplate, mergedData, options);
  logger.debug('processLLMTemplate: Template processed with data injection, processed template preview:', processedTemplate.substring(0, 200) + '...');

  const extractedData = extractTemplateData(processedTemplate, options);
  logger.debug('processLLMTemplate: Final extraction completed, extracted keys:', Object.keys(extractedData), 'extracted data:', extractedData);

  // Persist extracted data if update function provided
  if (updateDataFn && typeof updateDataFn === 'function') {
    updateDataFn(extractedData);
    logger.debug('processLLMTemplate: Data persisted via update function');
  } else {
    logger.warn('processLLMTemplate: No update function provided, data not persisted');
  }

  const result = {
    inputData: data,
    template: processedTemplate,
    extractedData
  };
  logger.info('processLLMTemplate: Completed successfully');
  return result;
}

export {
  extractTemplateData,
  injectTemplateData,
  resetTemplatePlaceholders,
  mergeTemplateData,
  renderFilledTemplate,
  processLLMTemplate,
  extractKeysFromPrompt
};