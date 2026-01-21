import { standardPromptTemplate } from '../../templates.js';

export const step32 = {
  id: "step32",
  name: "Customer Acquisition",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplate,
  variables: ["market"],
  instructions: "Identify channels to acquire customers in {{market}}. Rank by priority.",
  validate: (context) => ({ valid: true, issues: [] }),
};