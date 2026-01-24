import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step52 = {
  id: "step52",
  name: "Governance Structure",
  model: "Legal Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "advisors", "boardStructure", "governance"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


List advisors, board members, and governance structure for {{solution}}.

Provide:
- {{advisors: "Key advisors with expertise and value they bring"}}
- {{boardStructure: "Planned board composition and governance approach"}}
- {{governance: "Corporate governance framework and decision-making processes"}}

Structure in professional Markdown with advisor table and governance model.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.advisors) issues.push('Missing advisors');
    return { valid: issues.length === 0, issues };
  },
};
