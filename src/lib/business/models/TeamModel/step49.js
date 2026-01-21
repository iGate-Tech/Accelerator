import { standardPromptTemplate } from '../../templates.js';

export const step49 = {
  id: "step49",
  name: "Founding Team",
  model: "Team Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "List founding team members for {{solution}} and their roles.",
  validate: (context) => ({ valid: true, issues: [] }),
};