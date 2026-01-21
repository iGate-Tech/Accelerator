import { standardPromptTemplate } from '../../templates.js';

export const step46 = {
  id: "step46",
  name: "Pre-Money Valuation",
  model: "Funding Model",
  promptTemplate: standardPromptTemplate,
  variables: ["valuation"],
  instructions: "Calculate the expected pre-money valuation for {{solution}}, ensuring alignment with {{valuation}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};