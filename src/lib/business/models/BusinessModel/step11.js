import { standardPromptTemplate } from '../../templates.js';

export const step11 = {
  id: "step11",
  name: "Key Features",
  model: "Business Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution"],
  detailedPrompt: `
List and detail key features of the solution {{solution}}.
Provide {{features: "List of features, each mapped to a specific customer benefit, with descriptions of functionality and value"}}.
Structure as a numbered or bulleted list in professional Markdown, ensuring each feature is practical and tied to solving the core problem.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};