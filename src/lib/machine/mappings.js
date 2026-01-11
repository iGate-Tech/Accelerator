import { stepsConfig } from "./stepsConfig.js";

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

export const modelCumul = stepsConfig.reduce((acc, step) => {
  const model = step.model;
  if (!acc[model]) acc[model] = 0;
  acc[model] += 1;
  return acc;
}, {});
