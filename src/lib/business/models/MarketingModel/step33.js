import { standardPromptTemplate } from '../../templates.js';

export const step33 = {
  id: "step33",
  name: "Sales Strategy",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplate,
  variables: ["market"],
  instructions: "Describe the sales motion for {{market}}: self-serve, inside sales, or enterprise.",
  validate: (context) => ({ valid: true, issues: [] }),
};