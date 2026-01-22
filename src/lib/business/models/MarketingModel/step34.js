import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step34 = {
  id: "step34",
  name: "Retention Strategy",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["market"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Develop strategies to retain customers and grow revenue in {{market}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
