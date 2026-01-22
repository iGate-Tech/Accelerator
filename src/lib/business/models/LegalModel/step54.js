import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step54 = {
  id: "step54",
  name: "IP Protection",
  model: "LegalModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Plan intellectual property ownership and protection for {{solution}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
