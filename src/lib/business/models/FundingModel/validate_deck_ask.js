import { validationPromptTemplate } from '../../templates.js';

export const validate_deck_ask = {
  id: "validate_deck_ask",
  name: "Funding Validation",
  model: "Funding Model",
  promptTemplate: validationPromptTemplate,
  variables: ["valuation", "ask"],
  instructions: "Check if {{valuation}} aligns with {{ask}}.",
  validate: (context) => {
    const valuation = parseFloat(context.valuation) || 0;
    const ask = parseFloat(context.ask) || 0;
    const valid = valuation > 0 && ask > 0 && ask <= valuation * 1.5; // Rough alignment
    const issues = valid ? [] : ["Funding ask should align with valuation"];
    return { valid, issues };
  },
};