import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step37 = {
  id: "step37",
  name: "Cost Structure",
  model: "Legal Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

List major fixed and variable costs for {{solution}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
