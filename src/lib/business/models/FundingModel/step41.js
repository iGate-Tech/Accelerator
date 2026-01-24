import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step41 = {
  id: "step41",
  name: "Funding Readiness",
  model: "Funding Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["tam", "team", "solution", "traction", "riskLevel"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Provide current traction, team strength, market size ({{tam}}), and risk level for {{solution}}.

Provide:
- {{traction: "Current traction metrics, milestones achieved, and validation evidence"}}
- {{team: "Team composition and relevant experience"}}
- {{riskLevel: "Overall risk level (low/medium/high) with justification"}}

Structure in professional Markdown with readiness scorecard.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.traction) issues.push('Missing traction details');
    if (!context.riskLevel) issues.push('Missing risk assessment');
    return { valid: issues.length === 0, issues };
  },
};
