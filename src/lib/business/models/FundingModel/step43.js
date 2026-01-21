import { standardPromptTemplate } from '../../templates.js';

export const step43 = {
  id: "step43",
  name: "Funding Stage",
  model: "Funding Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  instructions: "Determine the appropriate funding stage for {{solution}}: Pre-seed, Seed, Series A, etc.",
  validate: (context) => ({ valid: true, issues: [] }),
};