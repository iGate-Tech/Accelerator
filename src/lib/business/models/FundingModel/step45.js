import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step45 = {
  id: "step45",
  name: "Use of Funds",
  model: "FundingModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Plan the allocation of raised funds for {{solution}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
