import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step50 = {
  id: "step50",
  name: "Team Gaps",
  model: "TeamModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["persona"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Identify key skills missing in the team for {{solution}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
