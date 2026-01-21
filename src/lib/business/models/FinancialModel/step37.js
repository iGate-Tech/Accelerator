import { standardPromptTemplate } from '../../templates.js';

export const step37 = {
  id: "step37",
  name: "Cost Structure",
  model: "Financial Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "List major fixed and variable costs for {{solution}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};