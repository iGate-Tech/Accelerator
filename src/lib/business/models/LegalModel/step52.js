import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step52 = {
  id: "step52",
  name: "Governance Structure",
  model: "LegalModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

List advisors, board members, and governance structure for {{solution}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
