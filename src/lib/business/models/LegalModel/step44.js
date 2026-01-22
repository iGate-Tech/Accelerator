import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step44 = {
  id: "step44",
  name: "Funding Amount",
  model: "Legal Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Determine how much capital to raise for {{solution}} and provide the rationale.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
