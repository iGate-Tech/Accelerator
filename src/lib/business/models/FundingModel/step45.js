import { standardPromptTemplate } from '../../templates.js';

export const step45 = {
  id: "step45",
  name: "Fund Allocation",
  model: "Funding Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "Plan the allocation of raised funds for {{solution}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};