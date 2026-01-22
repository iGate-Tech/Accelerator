import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step55 = {
  id: "step55",
  name: "Compliance Requirements",
  model: "LegalModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Identify key contracts and compliance requirements for {{solution}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
