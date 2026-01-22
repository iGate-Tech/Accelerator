import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step36 = {
  id: "step36",
  name: "Unit Economics",
  model: "FinancialModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["modelType"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Provide Customer Acquisition Cost (CAC), Lifetime Value (LTV), and gross margin assumptions for {{modelType}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
