import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step54 = {
  id: "step54",
  name: "IP Protection",
  model: "Legal Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "ipOwnership", "ipStrategy", "patents"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Plan intellectual property ownership and protection for {{solution}}.

Provide:
- {{ipOwnership: "IP ownership structure and assignment agreements"}}
- {{ipStrategy: "Strategy for patents, trademarks, copyrights, and trade secrets"}}
- {{patents: "Patent strategy and key IP assets to protect"}}

Structure in professional Markdown with IP protection plan.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.ipOwnership) issues.push('Missing IP ownership plan');
    return { valid: issues.length === 0, issues };
  },
};
