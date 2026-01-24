import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step34 = {
  id: "step34",
  name: "Retention Strategy",
  model: "Marketing Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "retentionStrategy", "revenueGrowth"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Develop strategies to retain customers and grow revenue for {{solution}}.

Provide:
- {{retentionStrategy: "Customer retention approach including churn prevention, engagement tactics, and loyalty programs"}}
- {{revenueGrowth: "Revenue expansion strategies including upselling, cross-selling, and pricing optimization"}}

Structure in professional Markdown with retention metrics, growth levers, and LTV improvement tactics.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.retentionStrategy) issues.push('Missing retention strategy');
    return { valid: issues.length === 0, issues };
  },
};
