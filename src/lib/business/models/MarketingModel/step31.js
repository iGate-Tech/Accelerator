import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step31 = {
  id: "step31",
  name: "Market Entry",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["market"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Develop a strategy to enter {{market}} and acquire first customers.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
