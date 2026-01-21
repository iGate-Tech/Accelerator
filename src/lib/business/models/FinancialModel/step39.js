import { standardPromptTemplate } from '../../templates.js';

export const step39 = {
  id: "step39",
  name: "Monthly Burn Rate",
  model: "Financial Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "Calculate the monthly burn rate and runway for {{solution}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};