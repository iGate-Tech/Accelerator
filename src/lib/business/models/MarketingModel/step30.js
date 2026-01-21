import { standardPromptTemplate } from '../../templates.js';

export const step30 = {
  id: "step30",
  name: "Competitive Landscape",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplate,
  variables: ["market", "solution"],
  instructions: "List direct and indirect competitors in {{market}}. Explain how {{solution}} differs.",
  validate: (context) => ({ valid: true, issues: [] }),
};