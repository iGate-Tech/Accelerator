import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step40 = {
  id: "step40",
  name: "Break-even Analysis",
  model: "FinancialModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Determine when {{solution}} will break even.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
