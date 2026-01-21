import { standardPromptTemplate } from '../../templates.js';

export const step35 = {
  id: "step35",
  name: "Revenue Logic",
  model: "Financial Model",
  promptTemplate: standardPromptTemplate,
  variables: ["modelType"],
  instructions: "Explain how revenue is generated per customer in {{modelType}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};