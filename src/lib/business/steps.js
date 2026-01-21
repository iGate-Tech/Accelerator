





import { steps } from './models/index.js';

export { steps };

// Mappings derived from steps
export const stepNames = Object.fromEntries(
  steps.map((step) => [step.id, step.name]),
);

export const modelMap = Object.fromEntries(
  steps.map((step) => [step.id, step.model || "Unknown"]),
);

export const sectionMap = Object.fromEntries(
  steps.map((step) => [step.id, step.section || "Unknown"]),
);

// Calculate cumulative step counts per model
export const modelCumul = (() => {
  const modelOrder = [
    'System',
    'Idea Model',
    'Business Model',
    'Technical Model',
    'Marketing Model',
    'Financial Model',
    'Funding Model',
    'Team Model',
    'Legal Model',
    'Pitch Deck Report',
    'Business Plan Report',
    'Valuation Report'
  ];

  const cumul = {};
  let total = 0;

  for (const model of modelOrder) {
    const stepsInModel = steps.filter(s => s.model === model).length;
    total += stepsInModel;
    cumul[model] = total;
  }

  return cumul;
})();

