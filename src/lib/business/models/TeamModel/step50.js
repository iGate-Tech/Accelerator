import { standardPromptTemplate } from '../../templates.js';

export const step50 = {
  id: "step50",
  name: "Team Gaps",
  model: "Team Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "Identify key skills missing in the team for {{solution}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};