import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step45 = {
  id: "step45",
  name: "Use of Funds",
  model: "Funding Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "askAmount", "useOfFunds", "allocation"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Plan the allocation of raised funds ({{askAmount}}) for {{solution}}.

Provide:
- {{useOfFunds: "Detailed breakdown of how funds will be allocated across categories (product, marketing, team, ops)"}}
- {{allocation: "Percentage allocation for each category"}}

Structure in professional Markdown with funding allocation table and priorities.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.useOfFunds) issues.push('Missing use of funds breakdown');
    return { valid: issues.length === 0, issues };
  },
};
