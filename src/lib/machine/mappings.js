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

// Calculate cumulative step counts per model in correct order
export const modelCumul = (() => {
  logger.trace('modelCumul: Starting');
  
  // Define model order as they appear in the accelerator flow
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
    const stepsInModel = stepsConfig.filter(s => s.model === model).length;
    total += stepsInModel;
    cumul[model] = total;
    logger.debug(`modelCumul: ${model} = ${stepsInModel} steps, cumulative: ${total}`);
  }
  
  return cumul;
})();
