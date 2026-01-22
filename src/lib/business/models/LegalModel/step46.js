import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step46 = {
  id: "step46",
  name: "Pre-money Valuation",
  model: "Legal Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["valuation"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Calculate the expected pre-money valuation for {{solution}}, ensuring alignment with {{valuation}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
