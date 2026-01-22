import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step5 = {
  id: "step5",
  name: "Solution Gaps",
  model: "Idea Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["alternatives"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Analyze why current solutions {{alternatives}} fail to adequately address {{problem}}.
Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Identify key gaps in solving {{problem}}:
- {{gaps: "Specific gaps preventing {{alternatives}} from solving {{problem}} - cost, speed, usability, scalability, features"}}
- {{quantifiedImpact: "Quantified impact of these gaps on {{problem}} - cost savings, time reductions, efficiency"}}
- {{userFeedback: "User complaints/reviews about {{alternatives}} failing to solve {{problem}}"}}
Format in professional Markdown with clear sections and metrics tied to {{problem}}.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};
