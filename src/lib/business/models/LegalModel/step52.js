import { standardPromptTemplate } from '../../templates.js';

export const step52 = {
  id: "step52",
  name: "Advisors & Board",
  model: "Legal Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "List advisors, board members, and governance structure for {{solution}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};