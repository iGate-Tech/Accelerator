import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step41 = {
  id: "step41",
  name: "Funding Readiness",
  model: "FundingModel Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["tam","team"],
  instructions: `The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Provide current traction, team strength, market size ({{tam}}), and risk level for {{solution}}.`,
  validate: (context) => ({ valid: true, issues: [] }),
};
