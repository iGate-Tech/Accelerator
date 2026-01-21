import { standardPromptTemplate } from '../../templates.js';

export const step42 = {
  id: "step42",
  name: "Company Valuation",
  model: "Funding Model",
  promptTemplate: standardPromptTemplate,
  variables: ["inputs"],
  instructions: "Calculate the valuation for {{solution}} using Scorecard, Berkus, VC, and DCF-light methods with {{inputs}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};