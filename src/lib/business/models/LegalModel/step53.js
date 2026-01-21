import { standardPromptTemplate } from '../../templates.js';

export const step53 = {
  id: "step53",
  name: "Legal Structure",
  model: "Legal Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "Determine the legal structure for the {{solution}} company.",
  validate: (context) => ({ valid: true, issues: [] }),
};