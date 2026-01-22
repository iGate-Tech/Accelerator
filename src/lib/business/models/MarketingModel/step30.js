import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step30 = {
  id: "step30",
  name: "Competitive Landscape",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["market", "solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

List direct and indirect competitors in {{market}}. Explain how {{solution}} differs.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
