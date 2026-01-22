import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step51 = {
  id: "step51",
  name: "Hiring Plan",
  model: "TeamModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Develop a hiring plan for {{solution}} for the next 12-24 months.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
