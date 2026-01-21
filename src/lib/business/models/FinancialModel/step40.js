import { standardPromptTemplate } from '../../templates.js';

export const step40 = {
  id: "step40",
  name: "Profitability Timeline",
  model: "Financial Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "Determine when {{solution}} will break even.",
  validate: (context) => ({ valid: true, issues: [] }),
};