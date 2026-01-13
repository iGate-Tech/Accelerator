import { stepsConfig } from "./stepsConfig.js";
import logger from '../logger.js';


// Auto-generated mappings from stepsConfig
export const stepNames = Object.fromEntries(
  stepsConfig.map((step) => [step.id, step.name]),
);

export const modelMap = Object.fromEntries(
  stepsConfig.map((step) => [step.id, step.model]),
);

export const sectionMap = Object.fromEntries(
  stepsConfig.map((step) => [step.id, step.section]),
);

export const modelCumul = (() => {
  logger.trace('modelCumul: Starting');
  const modelOrder = ['System', 'Idea Model', 'Business Model', 'Financial Model', 'Funding Model', 'Marketing Model', 'Team Model', 'Legal Model', 'Technical Model'];
  const cumul = {};
  let total = 0;
  for (const model of modelOrder) {
    const stepsInModel = stepsConfig.filter(s => s.model === model).length;
    total += stepsInModel;
    cumul[model] = total;
  }
  return cumul;
})();
