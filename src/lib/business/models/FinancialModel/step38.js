import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step38 = {
  id: "step38",
  name: "Financial Projections",
  model: "FinancialModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Provide 3-year revenue and expense projections for {{solution}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
