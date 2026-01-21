import { standardPromptTemplate } from '../../templates.js';

export const step51 = {
  id: "step51",
  name: "Hiring Plan",
  model: "Team Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "Develop a hiring plan for {{solution}} for the next 12-24 months.",
  validate: (context) => ({ valid: true, issues: [] }),
};