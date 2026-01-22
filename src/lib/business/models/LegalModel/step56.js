import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step56 = {
  id: "step56",
  name: "Risk Assessment",
  model: "LegalModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Identify legal and regulatory risks for {{solution}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
