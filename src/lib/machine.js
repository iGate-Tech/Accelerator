import { steps, stepNames, modelMap, sectionMap, modelCumul } from './machine/steps.js';

const stepOrder = steps.map(s => s.id);

export { steps, stepNames, modelMap, sectionMap, modelCumul };

export const getNextStep = (current) => {
  const index = stepOrder.indexOf(current);
  return stepOrder[index + 1] || null;
};

export const extractFromResponse = (response) => {
  if (!response) return {};
  const data = {};
  const regex = /\{\{(\w+)(?::([^}]*))?\}\}\s*[:=]?\s*["']?([^}"']+)["']?/g;
  let match;
  while ((match = regex.exec(response)) !== null) {
    const [, key, , value] = match;
    try {
      data[key] = JSON.parse(value);
    } catch {
      data[key] = value;
    }
  }
  return data;
};

export const extractData = (response) => {
  if (!response) return {};
  const extracted = extractFromResponse(response);
  if (extracted.response && typeof extracted.response === 'object') {
    return extracted.response;
  }
  return extracted;
};

export const fillPrompt = (template, ctx) => {
  if (!template || !ctx) return template || '';
  return template.replace(/\{\{(\w+)(?::([^}]*))?\}\}/g, (match, key, defaultValue) => {
    const value = ctx[key];
    if (value === undefined || value === null) return defaultValue || '';
    return value;
  });
};

export const buildPrompt = (step, context, instructions) => {
  if (!step) return '';
  const template = typeof step.promptTemplate === 'function' 
    ? step.promptTemplate(step.instructions, step.variables, step.outputKeys)
    : step.instructions || '';
  return fillPrompt(template, { ...context, ...instructions });
};
