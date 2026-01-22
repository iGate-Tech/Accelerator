import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step43 = {
  id: "step43",
  name: "Funding Stage",
  model: "FundingModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Determine the appropriate funding stage for {{solution}}: Pre-seed, Seed, Series A, etc.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
