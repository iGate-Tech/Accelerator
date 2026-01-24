import { validationPromptTemplateWithProblem } from '../../templates.js';

// Funding alignment validation constants
// MAX_ASK_TO_VALUATION_RATIO: Maximum funding ask as percentage of valuation
// Typical VC terms suggest 10-25% dilution per round, we allow up to 40% for safety
const MAX_ASK_TO_VALUATION_RATIO = 1.5;

export const validate_deck_ask = {
  id: "validate_deck_ask",
  name: "Funding Validation",
  model: "Funding Model",
  promptTemplate: validationPromptTemplateWithProblem,
  variables: ["valuation", "ask"],
  instructions: "Check if {{valuation}} aligns with {{ask}}.",
  validate: (context) => {
    const valuation = parseFloat(context.valuation) || 0;
    const ask = parseFloat(context.ask) || 0;

    // Validation logic: funding ask should not exceed 150% of valuation
    // This prevents unrealistic dilution and aligns with typical VC expectations
    const maxValidAsk = valuation * MAX_ASK_TO_VALUATION_RATIO;
    const valid = valuation > 0 && ask > 0 && ask <= maxValidAsk;

    const issues = valid
      ? []
      : [`Funding ask ($${ask}) should not exceed 150% of valuation ($${valuation})`];

    return { valid, issues };
  },
};