
import { steps } from './models/index.js';

export { steps };

export const stepNames = Object.fromEntries(
  steps.map((step) => [step.id, step.name]),
);

export const modelMap = Object.fromEntries(
  steps.map((step) => [step.id, step.model || "Unknown"]),
);

export const sectionMap = Object.fromEntries(
  steps.map((step) => [step.id, step.section || "Unknown"]),
);

// Calculate cumulative step counts per model for 100% Health Flow
// New order: System -> Idea -> Business Core -> Marketing -> Business Details -> Technical -> Financial -> Team -> Legal -> Funding -> Reports
export const modelCumul = (() => {
  const modelOrder = [
    'System',
    'Idea Model',
    'Business Core',
    'Marketing Model',
    'Business Details',
    'Technical Model',
    'Financial Model',
    'Team Model',
    'Legal Model',
    'Funding Model',
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

// Helper to get current phase based on step index
export const getPhaseInfo = (stepIndex) => {
  const phases = [
    { name: 'System', start: 0, end: 1 },
    { name: 'Idea Model', start: 1, end: 9 },
    { name: 'Business Core', start: 9, end: 13 },
    { name: 'Marketing Model', start: 13, end: 24 },
    { name: 'Business Details', start: 24, end: 28 },
    { name: 'Technical Model', start: 28, end: 38 },
    { name: 'Financial Model', start: 38, end: 44 },
    { name: 'Team Model', start: 44, end: 47 },
    { name: 'Legal Model', start: 47, end: 52 },
    { name: 'Funding Model', start: 52, end: 62 },
    { name: 'Reports', start: 62, end: 65 }
  ];

  for (const phase of phases) {
    if (stepIndex >= phase.start && stepIndex < phase.end) {
      return phase;
    }
  }
  return { name: 'Unknown', start: 0, end: steps.length };
};

// Helper to get progress percentage
export const getPhaseProgress = (stepIndex) => {
  const phase = getPhaseInfo(stepIndex);
  const phaseLength = phase.end - phase.start;
  const progressInPhase = stepIndex - phase.start;
  return Math.round((progressInPhase / phaseLength) * 100);
};
