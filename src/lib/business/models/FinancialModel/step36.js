import { standardPromptTemplate } from '../../templates.js';

export const step36 = {
  id: "step36",
  name: "Unit Economics",
  model: "Financial Model",
  promptTemplate: standardPromptTemplate,
  variables: ["modelType"],
  instructions: "Provide Customer Acquisition Cost (CAC), Lifetime Value (LTV), and gross margin assumptions for {{modelType}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};