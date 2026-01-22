import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step47 = {
  id: "step47",
  name: "Target Investors",
  model: "FundingModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Identify target investor types for {{solution}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
