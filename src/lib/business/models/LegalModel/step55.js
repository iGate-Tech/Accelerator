import { standardPromptTemplate } from '../../templates.js';

export const step55 = {
  id: "step55",
  name: "Contracts & Compliance",
  model: "Legal Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "Identify key contracts and compliance requirements for {{solution}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};