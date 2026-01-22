import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step32 = {
  id: "step32",
  name: "Customer Acquisition",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["market"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Identify channels to acquire customers in {{market}}. Rank by priority.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
