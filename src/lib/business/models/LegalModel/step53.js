import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step53 = {
  id: "step53",
  name: "Legal Structure",
  model: "LegalModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Determine the legal structure for the {{solution}} company.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
