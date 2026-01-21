import { standardPromptTemplate } from '../../templates.js';

export const step48 = {
  id: "step48",
  name: "Funding Milestones",
  model: "Funding Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "List milestones unlocked by this funding round for {{solution}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};