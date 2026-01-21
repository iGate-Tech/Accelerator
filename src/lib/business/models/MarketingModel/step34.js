import { standardPromptTemplate } from '../../templates.js';

export const step34 = {
  id: "step34",
  name: "Customer Retention",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplate,
  variables: ["market"],
  instructions: "Develop strategies to retain customers and grow revenue in {{market}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};