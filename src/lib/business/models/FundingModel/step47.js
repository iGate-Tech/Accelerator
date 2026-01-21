import { standardPromptTemplate } from '../../templates.js';

export const step47 = {
  id: "step47",
  name: "Target Investors",
  model: "Funding Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "Identify target investor types for {{solution}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};