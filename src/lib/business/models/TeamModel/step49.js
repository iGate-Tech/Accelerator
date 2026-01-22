import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step49 = {
  id: "step49",
  name: "Founding Team",
  model: "TeamModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

List founding team members for {{solution}} and their roles.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
