import { standardPromptTemplate } from '../../templates.js';

export const step54 = {
  id: "step54",
  name: "IP Protection",
  model: "Legal Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "Plan intellectual property ownership and protection for {{solution}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};