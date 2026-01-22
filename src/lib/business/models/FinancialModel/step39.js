import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step39 = {
  id: "step39",
  name: "Burn Rate Analysis",
  model: "FinancialModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Calculate the monthly burn rate and runway for {{solution}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
