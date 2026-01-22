import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step48 = {
  id: "step48",
  name: "Funding Milestones",
  model: "Legal Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

List milestones unlocked by this funding round for {{solution}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
