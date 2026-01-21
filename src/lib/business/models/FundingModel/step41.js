import { standardPromptTemplate } from '../../templates.js';

export const step41 = {
  id: "step41",
  name: "Valuation Inputs",
  model: "Funding Model",
  promptTemplate: standardPromptTemplate,
  variables: ["tam", "team"],
  instructions: "Provide current traction, team strength, market size ({{tam}}), and risk level for {{solution}}.",
  validate: (context) => ({ valid: true, issues: [] }),
};