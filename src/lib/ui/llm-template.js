/**
 * Extracts highlighted text between ==markers== from content
 */
function extractHighlightedText(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  // Match text between == and ==
  const highlightRegex = /==([^=]+)==/g;
  const highlights = [];
  let match;

  while ((match = highlightRegex.exec(content)) !== null) {
    highlights.push(match[1].trim()); // Extract the text between the markers
  }

  return highlights;
}

/**
 * Generates a context string from an array of highlighted texts
 */
function generateContextString(highlights) {
  if (!highlights || !Array.isArray(highlights) || highlights.length === 0) {
    return '';
  }

  return highlights.join('; ');
}

/**
 * Extracts data from template using the simplified approach of extracting highlights
 */
function extractTemplateData(templateText, options = {}) {
  if (!templateText || typeof templateText !== 'string') {
    return {};
  }

  const highlights = extractHighlightedText(templateText);
  const contextString = generateContextString(highlights);

  // Return a simple object with the extracted context
  return {
    highlights: highlights,
    context: contextString,
    extractedContent: contextString
  };
}

/**
 * Renders filled templates by simply returning the content (since we're using highlights)
 */
function renderFilledTemplate(templateText) {
  if (!templateText) return templateText || '';
  return templateText;
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

export {
  extractTemplateData,
  renderFilledTemplate,
  extractKeysFromPrompt,
  extractHighlightedText,
  generateContextString
};