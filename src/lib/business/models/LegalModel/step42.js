import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step42 = {
  id: "step42",
  name: "Valuation Analysis",
  model: "Legal Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["inputs"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Calculate the valuation for {{solution}} using Scorecard, Berkus, VC, and DCF-light methods with {{inputs}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
