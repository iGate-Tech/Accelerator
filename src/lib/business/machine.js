import { steps, stepNames, modelMap, sectionMap, modelCumul } from './steps.js';
import { extractTemplateData, injectTemplateData } from '../ui/llm-template.js';

const stepOrder = steps.map(s => s.id);

// Re-exports from steps.js are handled above

export const getNextStep = (current) => {
  const index = stepOrder.indexOf(current);
  return stepOrder[index + 1] || null;
};

// Legacy wrapper for backward compatibility
export const extractFromResponse = (response) => {
  if (!response) return {};
  return extractTemplateData(response);
};

export const extractData = (response) => {
  if (!response) return {};
  const extracted = extractFromResponse(response);
  if (extracted.response && typeof extracted.response === 'object') {
    return extracted.response;
  }
  return extracted;
};

export const fillPrompt = (template, ctx) => injectTemplateData(template, ctx);

export const buildPrompt = (step, context, instructions, lang = 'en') => {
  if (!step) return '';

  // Determine which prompt to use based on language
  let promptContent;
  if (step.detailedPrompt && typeof step.detailedPrompt === 'object') {
    // Use bilingual prompt structure
    promptContent = step.detailedPrompt[lang] || step.detailedPrompt['en'] || '';
  } else {
    // Use original prompt structure
    promptContent = step.detailedPrompt || '';
  }

  const template = typeof step.promptTemplate === 'function'
    ? step.promptTemplate(promptContent, step.variables, lang)
    : promptContent || '';
  return fillPrompt(template, { ...context, ...instructions });
};
