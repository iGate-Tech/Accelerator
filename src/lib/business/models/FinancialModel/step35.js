import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step35 = {
  id: "step35",
  name: "Revenue Streams",
  model: "FinancialModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["modelType"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Explain how revenue is generated per customer in {{modelType}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
