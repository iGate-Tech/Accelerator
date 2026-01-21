import { standardPromptTemplate } from '../../templates.js';

export const step44 = {
  id: "step44",
  name: "Funding Amount",
  model: "Funding Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "Determine how much capital to raise for {{solution}} and provide the rationale.",
  validate: (context) => ({ valid: true, issues: [] }),
};