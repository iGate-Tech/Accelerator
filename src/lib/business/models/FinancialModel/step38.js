import { standardPromptTemplate } from '../../templates.js';

export const step38 = {
  id: "step38",
  name: "Financial Projections",
  model: "Financial Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "Provide 3-year revenue and expense projections for {{solution}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};